// carrito.js — Pedidos armados desde el catálogo (módulo "catalogo").
//
// A diferencia del patrón viejo (armar un mensaje de texto y mandarlo a
// wa.me), acá el cliente arma su pedido y este endpoint lo GUARDA con un
// id propio — el link que se comparte (/:tienda/c/:slug) es una página real
// con el pedido ya armado (ver carrito-og.js para el Open Graph dinámico al
// compartir por WhatsApp), no un texto que el vendedor tiene que descifrar.
//
// El vendedor abre el link y ve: qué pidieron, cuánto es, datos del cliente.
// Puede marcarlo confirmado/cancelado desde ahí mismo (requiere ser dueño).
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText, sanitizeNumber, sanitizePhone } from './_lib/validation.js';
import { ensureStoreOwner, findTiendaById, findTiendaBySlug, readTiendas } from './_lib/tiendas-store.js';
import { safeRead, safeWrite } from './_lib/r2-safe-write.js';
import { isModuleActive } from './_lib/modules.js';
import { readOfertasParaCarrito } from './_lib/ofertas-read.js';

const LOCAL_FILE = join('/tmp', 'lokal-carritos.json');
const DATA_KEY = 'data/carritos.json';
const BUCKET = process.env.R2_BUCKET_NAME;

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, OPTIONS',
};

const ESTADOS_VALIDOS = new Set(['pendiente', 'confirmado', 'cancelado']);
// Un pedido armado hace más de 30 días sin confirmación es ruido, no un
// pedido real esperando respuesta — mismo criterio que usaría cualquier
// carrito abandonado. No se borra (el vendedor podría querer el historial),
// solo deja de tratarse como "activo" en el 404 de la vista OG.
const DIAS_VIGENCIA = 30;

function isR2Configured() {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function readCarritosWithEtag() {
  if (isR2Configured()) {
    return safeRead(getR2Client(), BUCKET, DATA_KEY, []);
  }
  const data = existsSync(LOCAL_FILE) ? JSON.parse(readFileSync(LOCAL_FILE, 'utf8')) : [];
  return { data, etag: null };
}

async function writeCarritosSafe(data, etag) {
  if (isR2Configured()) {
    await safeWrite(getR2Client(), BUCKET, DATA_KEY, data, etag);
    return;
  }
  writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
}

// GET simple (sin etag) para las lecturas públicas — mismo criterio que
// ofertas.js: solo las escrituras necesitan el read-modify-write protegido.
async function readCarritos() {
  if (isR2Configured()) {
    try {
      const res = await getR2Client().send(new GetObjectCommand({ Bucket: BUCKET, Key: DATA_KEY }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return [];
      throw err;
    }
  }
  if (!existsSync(LOCAL_FILE)) return [];
  return JSON.parse(readFileSync(LOCAL_FILE, 'utf8'));
}

function generarSlug() {
  // No deriva del nombre del cliente (a diferencia de ofertas/productos):
  // un pedido no tiene "título" propio, y un slug legible no aporta nada
  // acá — nadie navega a mano un link de pedido, siempre lo abre desde el
  // link que se comparte. Random corto alcanza y evita choques sin
  // necesitar consultar los existentes.
  return Math.random().toString(36).slice(2, 10);
}

// Ítems: snapshot al momento de armar el pedido, no una referencia viva al
// producto — si el vendedor cambia el precio del producto mañana, el pedido
// de hoy tiene que seguir mostrando lo que el cliente vio y aceptó. Cada
// ítem valida contra el catálogo real de la tienda (existe, está vigente)
// pero copia sus datos, no los enlaza.
function sanitizeItems(rawItems, ofertasDeLaTienda) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new HttpError(400, 'El pedido no puede estar vacío');
  }
  if (rawItems.length > 50) {
    throw new HttpError(400, 'Demasiados productos en un solo pedido');
  }

  const porId = new Map(ofertasDeLaTienda.map((o) => [o.id, o]));
  const items = [];

  for (const raw of rawItems) {
    const ofertaId = sanitizeText(raw?.ofertaId, { max: 80, multiline: false });
    const producto = porId.get(ofertaId);
    if (!producto) throw new HttpError(400, `Producto no encontrado: ${ofertaId || '(vacío)'}`);

    const qty = sanitizeNumber(raw?.qty, { field: 'cantidad', min: 1, max: 999, integer: true, nullable: false });

    items.push({
      ofertaId: producto.id,
      nombre: producto.nombre,
      // Precio SIEMPRE tomado del producto real en este momento, nunca del
      // valor que mandó el cliente — evita que alguien arme un pedido con
      // un precio inventado desde las devtools. El snapshot es para que el
      // pedido no cambie DESPUÉS, no para confiar en lo que llega del cliente.
      precio: typeof producto.precio === 'number' ? producto.precio : null,
      imageUrl: producto.thumbUrl || producto.imageUrl || null,
      qty,
    });
  }

  return items;
}

function calcularTotal(items) {
  return items.reduce((acc, item) => acc + (item.precio || 0) * item.qty, 0);
}

function esVigente(carrito, now = Date.now()) {
  if (!carrito) return false;
  const creado = new Date(carrito.createdAt).getTime();
  return now - creado <= DIAS_VIGENCIA * 24 * 60 * 60 * 1000;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    if (event.httpMethod === 'GET') {
      const { tiendaSlug, carritoSlug, tiendaId } = event.queryStringParameters || {};

      // /:tienda/c/:carrito — resolver un pedido puntual (vista del
      // vendedor Y del cliente comparten esta misma lectura pública; no hay
      // dato sensible de otra tienda expuesto porque el filtro es por
      // tiendaId real, no confiado del query).
      if (tiendaSlug && carritoSlug) {
        const tiendas = await readTiendas();
        const tienda = findTiendaBySlug(tiendas, tiendaSlug);
        if (!tienda) return jsonResponse(event, 404, { error: 'Tienda no encontrada' }, HTTP_OPTIONS);

        const carritos = await readCarritos();
        const carrito = carritos.find((c) => String(c.tiendaId) === String(tienda.id) && c.slug === carritoSlug);
        if (!carrito) return jsonResponse(event, 404, { error: 'Pedido no encontrado' }, HTTP_OPTIONS);

        return jsonResponse(event, 200, { carrito, tienda }, HTTP_OPTIONS);
      }

      // Listado admin de pedidos de una tienda — requiere ser dueño.
      if (tiendaId) {
        const user = await requireAuth(event);
        const tiendas = await readTiendas();
        const tienda = findTiendaById(tiendas, tiendaId);
        ensureStoreOwner(user, tienda);

        const carritos = await readCarritos();
        const result = carritos
          .filter((c) => String(c.tiendaId) === String(tiendaId))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return jsonResponse(event, 200, result, HTTP_OPTIONS);
      }

      return jsonResponse(event, 400, { error: 'Falta tiendaSlug+carritoSlug o tiendaId' }, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'POST') {
      // Sin requireAuth a propósito: quien arma un pedido es un CLIENTE
      // anónimo de la tienda, no alguien con cuenta en LOKAL — mismo
      // criterio que "Confirmar por WhatsApp" nunca pidió login. La
      // protección real es isModuleActive(tienda, 'catalogo') + que los
      // ítems se validan/repriceen contra el catálogo real, no lo que
      // mande el cliente.
      const body = parseJsonBody(event);
      const tiendaId = sanitizeText(String(body.tiendaId || ''), { max: 64, multiline: false });
      if (!tiendaId) throw new HttpError(400, 'tiendaId es requerido');

      const tiendas = await readTiendas();
      const tienda = findTiendaById(tiendas, tiendaId);
      if (!tienda) throw new HttpError(404, 'Tienda no encontrada');
      if (!isModuleActive(tienda, 'catalogo')) {
        throw new HttpError(403, 'El módulo de Catálogo no está activo para esta tienda');
      }

      // Los ítems se validan contra el catálogo REAL de la tienda —
      // reutiliza el mismo archivo/colección que ofertas.js (catálogo y
      // ofertas comparten backend, ver ofertas.js).
      const ofertasDeLaTienda = await readOfertasParaCarrito(tiendaId);
      const items = sanitizeItems(body.items, ofertasDeLaTienda);

      const cliente = {
        nombre: sanitizeText(body.cliente?.nombre, { max: 120, multiline: false }) || null,
        telefono: sanitizePhone(body.cliente?.telefono) || null,
      };
      const nota = sanitizeText(body.nota, { max: 500, multiline: true }) || null;

      const nuevo = {
        id: `carrito_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        slug: generarSlug(),
        tiendaId: tienda.id,
        items,
        total: calcularTotal(items),
        cliente,
        nota,
        estado: 'pendiente',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data: carritos, etag } = await readCarritosWithEtag();
      carritos.unshift(nuevo);
      await writeCarritosSafe(carritos, etag);

      return jsonResponse(event, 201, { carrito: nuevo, tienda }, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'PATCH') {
      // Cambiar estado (pendiente → confirmado/cancelado) SÍ requiere ser
      // dueño de la tienda — es la única escritura después de creado el
      // pedido, y es una decisión del vendedor, no del cliente.
      const user = await requireAuth(event);
      const body = parseJsonBody(event);
      const id = sanitizeText(body.id, { max: 80, multiline: false });
      if (!id) throw new HttpError(400, 'id requerido');

      const estado = sanitizeText(body.estado, { max: 20, multiline: false });
      if (!ESTADOS_VALIDOS.has(estado)) throw new HttpError(400, 'estado inválido');

      const { data: carritos, etag } = await readCarritosWithEtag();
      const idx = carritos.findIndex((c) => c.id === id);
      if (idx === -1) return jsonResponse(event, 404, { error: 'Pedido no encontrado' }, HTTP_OPTIONS);

      const tiendas = await readTiendas();
      const tienda = findTiendaById(tiendas, carritos[idx].tiendaId);
      ensureStoreOwner(user, tienda);

      carritos[idx] = { ...carritos[idx], estado, updatedAt: new Date().toISOString() };
      await writeCarritosSafe(carritos, etag);

      return jsonResponse(event, 200, carritos[idx], HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};

export { esVigente };
