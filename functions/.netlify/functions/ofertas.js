// ofertas.js — Cloudflare Pages Functions version de netlify/functions/ofertas.js.
// Mismo patrón de adaptación que tiendas-crud.js (ver comentario ahí para
// el detalle de onRequestX/context/env). Lógica de negocio idéntica,
// incluido el fix reciente de precio/stock/condición del catálogo
// (sanitizeOfertaInput) — el bug real que se corrigió hoy (esos campos se
// perdían al guardar un producto) viaja con esta migración, no se reintrodujo.
import { getBearerToken, requireAuth, verifyFirebaseIdToken } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText } from './_lib/validation.js';
import { ensureStoreOwner, findTiendaById, findTiendaBySlug, readTiendas } from './_lib/tiendas-store.js';
import { isModuleActive } from './_lib/modules.js';
import { safeRead, safeWrite } from './_lib/r2-safe-write.js';
import { sanitizeOfertaInput, esVigente } from './_lib/ofertas-sanitize.js';

const DATA_KEY = 'data/ofertas.json';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, DELETE, OPTIONS',
};

async function readOfertas(bucket) {
  const { data } = await safeRead(bucket, DATA_KEY, []);
  return data;
}

async function writeOfertas(bucket, data) {
  const { etag } = await safeRead(bucket, DATA_KEY, []);
  await safeWrite(bucket, DATA_KEY, data, etag);
}

async function getOptionalUser(event, env) {
  const token = getBearerToken(event);
  if (!token) return null;
  try {
    return await verifyFirebaseIdToken(token, env);
  } catch {
    return null;
  }
}

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestGet({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const ofertas = await readOfertas(bucket);
    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tiendaId');
    const slug = searchParams.get('slug');
    const ofertaSlug = searchParams.get('ofertaSlug');
    const all = searchParams.get('all');
    const now = Date.now();

    if (slug && ofertaSlug) {
      const tiendas = await readTiendas(bucket);
      const tienda = findTiendaBySlug(tiendas, slug);
      if (!tienda) return jsonResponse(event, 404, { error: 'Tienda no encontrada' }, { ...HTTP_OPTIONS, env });
      const oferta = ofertas.find((o) => String(o.tiendaId) === String(tienda.id) && (o.id === ofertaSlug || o.slug === ofertaSlug));
      if (!oferta) return jsonResponse(event, 404, { error: 'Oferta no encontrada' }, { ...HTTP_OPTIONS, env });
      return jsonResponse(event, 200, { oferta, tienda }, { ...HTTP_OPTIONS, env });
    }

    if (slug) {
      const tiendas = await readTiendas(bucket);
      const tienda = findTiendaBySlug(tiendas, slug);
      if (!tienda || !tienda.activa) return jsonResponse(event, 404, { error: 'Tienda no encontrada' }, { ...HTTP_OPTIONS, env });
      const result = ofertas
        .filter((o) => String(o.tiendaId) === String(tienda.id) && esVigente(o, now))
        .map(({ views, uniques, lastVisit, ...pub }) => pub);
      return jsonResponse(event, 200, result, { ...HTTP_OPTIONS, env });
    }

    if (tiendaId) {
      const user = await getOptionalUser(event, env);
      let result = ofertas.filter((o) => String(o.tiendaId) === String(tiendaId));
      if (all === '1') {
        const tiendas = await readTiendas(bucket);
        const tienda = findTiendaById(tiendas, tiendaId);
        const canSeePrivate = user && tienda && (user.isAdmin || tienda.googleUid === user.uid);
        if (!canSeePrivate) throw new HttpError(403, 'No autorizado');
      } else {
        result = result.filter((o) => esVigente(o, now)).map(({ views, uniques, lastVisit, ...pub }) => pub);
      }
      return jsonResponse(event, 200, result, { ...HTTP_OPTIONS, env });
    }

    return jsonResponse(event, 200, [], { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    const body = await parseJsonBody(event);
    const tiendaId = sanitizeText(String(body.tiendaId || ''), { max: 64, multiline: false });
    if (!tiendaId) throw new HttpError(400, 'tiendaId es requerido');

    const tiendas = await readTiendas(bucket);
    const tienda = findTiendaById(tiendas, tiendaId);
    ensureStoreOwner(user, tienda);
    if (!isModuleActive(tienda, 'ofertas')) {
      throw new HttpError(403, 'El módulo de Ofertas no está activo para esta tienda');
    }

    const ofertas = await readOfertas(bucket);
    const nueva = {
      id: `oferta_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...sanitizeOfertaInput(body, tienda),
      views: 0,
      uniques: 0,
      lastVisit: null,
      createdAt: new Date().toISOString(),
    };

    ofertas.unshift(nueva);
    await writeOfertas(bucket, ofertas);
    return jsonResponse(event, 201, nueva, { ...HTTP_OPTIONS, env });
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

    const ofertas = await readOfertas(bucket);
    const idx = ofertas.findIndex((item) => item.id === id);
    if (idx === -1) return jsonResponse(event, 404, { error: 'No encontrada' }, { ...HTTP_OPTIONS, env });

    const tiendas = await readTiendas(bucket);
    const tienda = findTiendaById(tiendas, ofertas[idx].tiendaId);
    ensureStoreOwner(user, tienda);

    const CAMPOS_QUE_DISPARAN_SANITIZE = [
      'nombre', 'titulo', 'imageUrl', 'thumbUrl', 'ogImageUrl', 'fotos',
      'publishAt', 'expireAt', 'descripcion', 'precio', 'precioOriginal',
      'stock', 'badgesForzados', 'financiacion', 'condicion', 'categoryId',
      'contactoWhatsapp', 'attributes',
    ];
    const update = {};
    if (CAMPOS_QUE_DISPARAN_SANITIZE.some((campo) => campo in body)) {
      Object.assign(update, sanitizeOfertaInput({ ...ofertas[idx], ...body }, tienda, ofertas[idx].slug));
    }
    if ('visible' in body) update.visible = !!body.visible;

    ofertas[idx] = { ...ofertas[idx], ...update, updatedAt: new Date().toISOString() };
    await writeOfertas(bucket, ofertas);
    return jsonResponse(event, 200, ofertas[idx], { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestDelete({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new HttpError(400, 'id requerido');

    const ofertas = await readOfertas(bucket);
    const idx = ofertas.findIndex((item) => item.id === id);
    if (idx === -1) return jsonResponse(event, 404, { error: 'No encontrada' }, { ...HTTP_OPTIONS, env });

    const tiendas = await readTiendas(bucket);
    const tienda = findTiendaById(tiendas, ofertas[idx].tiendaId);
    ensureStoreOwner(user, tienda);

    ofertas.splice(idx, 1);
    await writeOfertas(bucket, ofertas);
    return jsonResponse(event, 200, { ok: true }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
