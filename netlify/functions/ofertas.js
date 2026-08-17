// ofertas.js — CRUD de ofertas de LOKAL LINKS: imagen + link compartible.
// A diferencia del modelo "producto de comercio" (precio/stock/categoría),
// una oferta acá es una imagen con vigencia (publishAt/expireAt), slug para
// /o/:slug, y contadores de views/uniques. El OG dinámico al compartir vive
// en oferta-ssr.js (SSR real, esta función es solo la API JSON).
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getBearerToken, requireAuth, verifyFirebaseIdToken } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeMediaUrls, sanitizeText, requireText, sanitizeNumber, sanitizeStringArray, sanitizePlainObject, sanitizePhone } from './_lib/validation.js';
import { ensureStoreOwner, findTiendaById, findTiendaBySlug, readTiendas } from './_lib/tiendas-store.js';
import { isModuleActive } from './_lib/modules.js';

const LOCAL_FILE = join('/tmp', 'lokal-ofertas.json');
const DATA_KEY = 'data/ofertas.json';
const BUCKET = process.env.R2_BUCKET_NAME;

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, DELETE, OPTIONS',
};

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

async function readOfertas() {
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

async function writeOfertas(data) {
  if (isR2Configured()) {
    await getR2Client().send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: DATA_KEY,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }));
    return;
  }
  writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
}

async function getOptionalUser(event) {
  const token = getBearerToken(event);
  if (!token) return null;
  try {
    return await verifyFirebaseIdToken(token);
  } catch {
    return null;
  }
}

function generateSlug(nombre) {
  return String(nombre || '')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'oferta';
}

// ¿Está vigente? (visible + dentro de la ventana de fechas)
function esVigente(o, now = Date.now()) {
  if (!o || o.visible === false) return false;
  const pub = o.publishAt ? new Date(o.publishAt).getTime() : 0;
  const exp = o.expireAt ? new Date(o.expireAt).getTime() : Infinity;
  return now >= pub && now <= exp;
}

// CONDICIONES/VENTAJAS válidas — mismo set que ProductoForm.jsx
// (CONDICION_OPTS/VENTAJA_OPTS). Rechazar valores fuera de este set en vez
// de guardar lo que venga: son ids que el frontend usa para elegir ícono/
// color fijos, un valor inesperado ahí rompería ese render, no solo el dato.
const CONDICIONES_VALIDAS = new Set(['nuevo', 'usado']);
const VENTAJAS_VALIDAS = new Set(['precio', 'disponibilidad', 'financiacion', 'combo']);

function sanitizeOfertaInput(body, tienda, existingSlug) {
  // El formulario de "Producto" (catálogo) manda `titulo`, el de "Oferta"
  // manda `nombre` — mismo backend, dos formularios distintos del admin.
  // Aceptar cualquiera de los dos evita forzar un cambio de contrato en un
  // frontend que ya funciona así.
  const nombre = requireText(body.nombre ?? body.titulo, { field: 'nombre', min: 2, max: 160, multiline: false });
  const imageUrl = sanitizeMediaUrls(body.imageUrl ? [body.imageUrl] : [], { maxItems: 1 })[0] || null;
  const thumbUrl = sanitizeMediaUrls(body.thumbUrl ? [body.thumbUrl] : [], { maxItems: 1 })[0] || imageUrl;
  // ogImageUrl: variante generada client-side (canvas resize, ver
  // storeFormUtils.jsx → uploadFotoOferta) pensada para redes sociales
  // (WhatsApp/FB) — 1200×630, JPEG ~80%, pocos KB. Antes el <og:image> del
  // SSR (oferta-og.js) usaba imageUrl directo, la foto ORIGINAL sin
  // comprimir subida por el dueño (puede pesar varios MB en resolución de
  // cámara de celular) — WhatsApp frecuentemente no renderiza el preview
  // con archivos así de pesados/con proporción no estándar. Opcional: si no
  // viene (ofertas viejas, o subida por un flujo que no la generó todavía),
  // cae a thumbUrl.
  const ogImageUrl = sanitizeMediaUrls(body.ogImageUrl ? [body.ogImageUrl] : [], { maxItems: 1 })[0] || thumbUrl;
  // fotos[]: galería del producto (ProductoForm permite varias) — imageUrl/
  // thumbUrl/ogImageUrl arriba siguen siendo la ÚNICA foto que usa una
  // oferta simple, y la portada del producto cae a la primera de fotos[]
  // si no vino imageUrl explícito.
  const fotos = sanitizeMediaUrls(Array.isArray(body.fotos) ? body.fotos : [], { maxItems: 8 });

  const base = {
    tiendaId: tienda.id,
    nombre,
    slug: existingSlug || generateSlug(nombre),
    imageUrl: imageUrl || fotos[0] || null,
    thumbUrl: thumbUrl || fotos[0] || null,
    ogImageUrl: ogImageUrl || fotos[0] || null,
    publishAt: body.publishAt || new Date().toISOString(),
    expireAt: body.expireAt || null,
    visible: body.visible !== false,
  };

  // Campos específicos del módulo "catalogo" (producto de comercio) — cada
  // uno se asigna SOLO si la clave está presente en el body (no con `??`
  // contra undefined): así un PATCH parcial que no toca "precio" no lo pisa
  // con null, y una oferta simple del módulo "ofertas" (que nunca manda
  // estas claves) no termina con un objeto lleno de nulls decorativos.
  const producto = {};
  if (fotos.length) producto.fotos = fotos;
  if ('descripcion' in body) producto.descripcion = sanitizeText(body.descripcion, { max: 2000, multiline: true });
  if ('precio' in body) producto.precio = sanitizeNumber(body.precio, { field: 'precio', min: 0, max: 999999999 });
  if ('precioOriginal' in body) producto.precioOriginal = sanitizeNumber(body.precioOriginal, { field: 'precioOriginal', min: 0, max: 999999999 });
  if ('stock' in body) producto.stock = sanitizeNumber(body.stock, { field: 'stock', min: 0, max: 999999, integer: true });
  if ('ventaja' in body) {
    const lista = Array.isArray(body.ventaja) ? body.ventaja : body.ventaja ? [body.ventaja] : [];
    producto.ventaja = sanitizeStringArray(lista, { maxItems: 4, maxItemLength: 20 }).filter((v) => VENTAJAS_VALIDAS.has(v));
  }
  if ('financiacion' in body) producto.financiacion = sanitizeText(body.financiacion, { max: 200, multiline: false }) || null;
  if ('condicion' in body) {
    const c = sanitizeText(body.condicion, { max: 20, multiline: false });
    producto.condicion = CONDICIONES_VALIDAS.has(c) ? c : 'nuevo';
  }
  if ('categoryId' in body) producto.categoryId = sanitizeText(body.categoryId, { max: 80, multiline: false }) || null;
  if ('contactoWhatsapp' in body) producto.contactoWhatsapp = sanitizePhone(body.contactoWhatsapp) || null;
  if ('attributes' in body) producto.attributes = sanitizePlainObject(body.attributes, { maxKeys: 20, maxStringLength: 80 });

  return { ...base, ...producto };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    if (event.httpMethod === 'GET') {
      const ofertas = await readOfertas();
      const { tiendaId, slug, ofertaSlug, all } = event.queryStringParameters || {};
      const now = Date.now();

      // /o/:slug — resolver una oferta puntual por tienda+slug (para el SSR de OG)
      if (slug && ofertaSlug) {
        const tiendas = await readTiendas();
        const tienda = findTiendaBySlug(tiendas, slug);
        if (!tienda) return jsonResponse(event, 404, { error: 'Tienda no encontrada' }, HTTP_OPTIONS);
        const oferta = ofertas.find((o) => String(o.tiendaId) === String(tienda.id) && (o.id === ofertaSlug || o.slug === ofertaSlug));
        if (!oferta) return jsonResponse(event, 404, { error: 'Oferta no encontrada' }, HTTP_OPTIONS);
        return jsonResponse(event, 200, { oferta, tienda }, HTTP_OPTIONS);
      }

      // Listado de una tienda pública por slug — solo vigentes
      if (slug) {
        const tiendas = await readTiendas();
        const tienda = findTiendaBySlug(tiendas, slug);
        if (!tienda || !tienda.activa) return jsonResponse(event, 404, { error: 'Tienda no encontrada' }, HTTP_OPTIONS);
        const result = ofertas
          .filter((o) => String(o.tiendaId) === String(tienda.id) && esVigente(o, now))
          .map(({ views, uniques, lastVisit, ...pub }) => pub);
        return jsonResponse(event, 200, result, HTTP_OPTIONS);
      }

      // Listado admin (todas, incluidas vencidas/ocultas) — requiere ser dueño
      if (tiendaId) {
        const user = await getOptionalUser(event);
        let result = ofertas.filter((o) => String(o.tiendaId) === String(tiendaId));
        if (all === '1') {
          const tiendas = await readTiendas();
          const tienda = findTiendaById(tiendas, tiendaId);
          const canSeePrivate = user && tienda && (user.isAdmin || tienda.googleUid === user.uid);
          if (!canSeePrivate) throw new HttpError(403, 'No autorizado');
        } else {
          result = result.filter((o) => esVigente(o, now)).map(({ views, uniques, lastVisit, ...pub }) => pub);
        }
        return jsonResponse(event, 200, result, HTTP_OPTIONS);
      }

      return jsonResponse(event, 200, [], HTTP_OPTIONS);
    }

    if (event.httpMethod === 'POST') {
      const user = await requireAuth(event);
      const body = parseJsonBody(event);
      const tiendaId = sanitizeText(String(body.tiendaId || ''), { max: 64, multiline: false });
      if (!tiendaId) throw new HttpError(400, 'tiendaId es requerido');

      const tiendas = await readTiendas();
      const tienda = findTiendaById(tiendas, tiendaId);
      ensureStoreOwner(user, tienda);
      if (!isModuleActive(tienda, 'ofertas')) {
        throw new HttpError(403, 'El módulo de Ofertas no está activo para esta tienda');
      }

      const ofertas = await readOfertas();
      const nueva = {
        id: `oferta_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...sanitizeOfertaInput(body, tienda),
        views: 0,
        uniques: 0,
        lastVisit: null,
        createdAt: new Date().toISOString(),
      };

      ofertas.unshift(nueva);
      await writeOfertas(ofertas);
      return jsonResponse(event, 201, nueva, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'PATCH') {
      const user = await requireAuth(event);
      const body = parseJsonBody(event);
      const id = sanitizeText(body.id, { max: 80, multiline: false });
      if (!id) throw new HttpError(400, 'id requerido');

      const ofertas = await readOfertas();
      const idx = ofertas.findIndex((item) => item.id === id);
      if (idx === -1) return jsonResponse(event, 404, { error: 'No encontrada' }, HTTP_OPTIONS);

      const tiendas = await readTiendas();
      const tienda = findTiendaById(tiendas, ofertas[idx].tiendaId);
      ensureStoreOwner(user, tienda);

      // Campos que disparan sanitizeOfertaInput en un PATCH parcial. Incluye
      // `titulo` (alias de `nombre` que manda ProductoForm) y todos los
      // campos propios del catálogo — sin `titulo` acá, un PATCH de edición
      // de producto (que siempre manda titulo+precio+stock, nunca `nombre`)
      // no entraba a este bloque y los campos de producto se perdían en
      // cada edición aunque sí se guardaran bien al crear.
      const CAMPOS_QUE_DISPARAN_SANITIZE = [
        'nombre', 'titulo', 'imageUrl', 'thumbUrl', 'ogImageUrl', 'fotos',
        'publishAt', 'expireAt', 'descripcion', 'precio', 'precioOriginal',
        'stock', 'ventaja', 'financiacion', 'condicion', 'categoryId',
        'contactoWhatsapp', 'attributes',
      ];
      const update = {};
      if (CAMPOS_QUE_DISPARAN_SANITIZE.some((campo) => campo in body)) {
        Object.assign(update, sanitizeOfertaInput({ ...ofertas[idx], ...body }, tienda, ofertas[idx].slug));
      }
      if ('visible' in body) update.visible = !!body.visible;

      ofertas[idx] = { ...ofertas[idx], ...update, updatedAt: new Date().toISOString() };
      await writeOfertas(ofertas);
      return jsonResponse(event, 200, ofertas[idx], HTTP_OPTIONS);
    }

    if (event.httpMethod === 'DELETE') {
      const user = await requireAuth(event);
      const { id } = event.queryStringParameters || {};
      if (!id) throw new HttpError(400, 'id requerido');

      const ofertas = await readOfertas();
      const idx = ofertas.findIndex((item) => item.id === id);
      if (idx === -1) return jsonResponse(event, 404, { error: 'No encontrada' }, HTTP_OPTIONS);

      const tiendas = await readTiendas();
      const tienda = findTiendaById(tiendas, ofertas[idx].tiendaId);
      ensureStoreOwner(user, tienda);

      ofertas.splice(idx, 1);
      await writeOfertas(ofertas);
      return jsonResponse(event, 200, { ok: true }, HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
