// carrito.js — Cloudflare Pages Functions version de netlify/functions/carrito.js.
// Mismo patrón de adaptación que tiendas-crud.js/ofertas.js. Lógica de
// negocio del carrito con link dinámico sin cambios (el bloque completo de
// "por qué esto y no un mensaje de WhatsApp" queda documentado en el
// original — acá solo la capa de runtime cambia).
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText, sanitizeNumber, sanitizePhone } from './_lib/validation.js';
import { ensureStoreOwner, findTiendaById, findTiendaBySlug, readTiendas } from './_lib/tiendas-store.js';
import { safeRead, safeWrite } from './_lib/r2-safe-write.js';
import { isModuleActive } from './_lib/modules.js';
import { readOfertasParaCarrito } from './_lib/ofertas-read.js';

const DATA_KEY = 'data/carritos.json';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, OPTIONS',
};

const ESTADOS_VALIDOS = new Set(['pendiente', 'confirmado', 'cancelado']);
const DIAS_VIGENCIA = 30;

async function readCarritosWithEtag(bucket) {
  return safeRead(bucket, DATA_KEY, []);
}

async function writeCarritosSafe(bucket, data, etag) {
  await safeWrite(bucket, DATA_KEY, data, etag);
}

async function readCarritos(bucket) {
  const { data } = await safeRead(bucket, DATA_KEY, []);
  return data;
}

function generarSlug() {
  return Math.random().toString(36).slice(2, 10);
}

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

export function esVigente(carrito, now = Date.now()) {
  if (!carrito) return false;
  const creado = new Date(carrito.createdAt).getTime();
  return now - creado <= DIAS_VIGENCIA * 24 * 60 * 60 * 1000;
}

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestGet({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const { searchParams } = new URL(request.url);
    const tiendaSlug = searchParams.get('tiendaSlug');
    const carritoSlug = searchParams.get('carritoSlug');
    const tiendaId = searchParams.get('tiendaId');

    if (tiendaSlug && carritoSlug) {
      const tiendas = await readTiendas(bucket);
      const tienda = findTiendaBySlug(tiendas, tiendaSlug);
      if (!tienda) return jsonResponse(event, 404, { error: 'Tienda no encontrada' }, { ...HTTP_OPTIONS, env });

      const carritos = await readCarritos(bucket);
      const carrito = carritos.find((c) => String(c.tiendaId) === String(tienda.id) && c.slug === carritoSlug);
      if (!carrito) return jsonResponse(event, 404, { error: 'Pedido no encontrado' }, { ...HTTP_OPTIONS, env });

      return jsonResponse(event, 200, { carrito, tienda }, { ...HTTP_OPTIONS, env });
    }

    if (tiendaId) {
      const user = await requireAuth(event, env);
      const tiendas = await readTiendas(bucket);
      const tienda = findTiendaById(tiendas, tiendaId);
      ensureStoreOwner(user, tienda);

      const carritos = await readCarritos(bucket);
      const result = carritos
        .filter((c) => String(c.tiendaId) === String(tiendaId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return jsonResponse(event, 200, result, { ...HTTP_OPTIONS, env });
    }

    return jsonResponse(event, 400, { error: 'Falta tiendaSlug+carritoSlug o tiendaId' }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const body = await parseJsonBody(event);
    const tiendaId = sanitizeText(String(body.tiendaId || ''), { max: 64, multiline: false });
    if (!tiendaId) throw new HttpError(400, 'tiendaId es requerido');

    const tiendas = await readTiendas(bucket);
    const tienda = findTiendaById(tiendas, tiendaId);
    if (!tienda) throw new HttpError(404, 'Tienda no encontrada');
    if (!isModuleActive(tienda, 'catalogo')) {
      throw new HttpError(403, 'El módulo de Catálogo no está activo para esta tienda');
    }

    const ofertasDeLaTienda = await readOfertasParaCarrito(bucket, tiendaId);
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

    const { data: carritos, etag } = await readCarritosWithEtag(bucket);
    carritos.unshift(nuevo);
    await writeCarritosSafe(bucket, carritos, etag);

    return jsonResponse(event, 201, { carrito: nuevo, tienda }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestPatch({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    const body = await parseJsonBody(event);
    const id = sanitizeText(body.id, { max: 80, multiline: false });
    if (!id) throw new HttpError(400, 'id requerido');

    const estado = sanitizeText(body.estado, { max: 20, multiline: false });
    if (!ESTADOS_VALIDOS.has(estado)) throw new HttpError(400, 'estado inválido');

    const { data: carritos, etag } = await readCarritosWithEtag(bucket);
    const idx = carritos.findIndex((c) => c.id === id);
    if (idx === -1) return jsonResponse(event, 404, { error: 'Pedido no encontrado' }, { ...HTTP_OPTIONS, env });

    const tiendas = await readTiendas(bucket);
    const tienda = findTiendaById(tiendas, carritos[idx].tiendaId);
    ensureStoreOwner(user, tienda);

    carritos[idx] = { ...carritos[idx], estado, updatedAt: new Date().toISOString() };
    await writeCarritosSafe(bucket, carritos, etag);

    return jsonResponse(event, 200, carritos[idx], { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
