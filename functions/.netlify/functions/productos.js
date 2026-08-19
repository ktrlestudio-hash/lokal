// productos.js — backend real del módulo "catalogo", separado de ofertas.js.
//
// Por qué existe: hasta esta sesión, TODO lo que el dueño cargaba (manual o
// vía el importador de Excel/CSV) terminaba en data/ofertas.json, sin
// importar si conceptualmente era "una oferta puntual" o "mi catálogo
// completo de precios" — el módulo Catálogo existía en la UI (commerce-
// modern.jsx, CatalogoSection/CatalogoModal) pero nunca tuvo un endpoint
// propio. Confirmado auditando también LOKAL Global (mismo problema: una
// sola colección "ofertas" para todo) y MV Distribuciones (sí separa
// productos.json de las imágenes de ofertas) — acá se toma ese segundo
// patrón, pero con CRUD granular por id (GET/POST/PATCH/DELETE), no
// reemplazo completo del array, para que escale igual que ofertas.js.
//
// Mismo patrón exacto que ofertas.js (Cloudflare Pages Functions,
// onRequestX/context/env, safeRead/safeWrite con ETag) — reusa
// sanitizeOfertaInput (ya distingue campos de "producto": precio/stock/
// categoryId/attributes) porque el modelo de un producto de catálogo y una
// oferta con precio son el mismo shape, solo cambia dónde se persisten.
import { getBearerToken, requireAuth, verifyFirebaseIdToken } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText } from './_lib/validation.js';
import { ensureStoreOwner, findTiendaById, findTiendaBySlug, readTiendas } from './_lib/tiendas-store.js';
import { isModuleActive } from './_lib/modules.js';
import { safeRead, safeWrite } from './_lib/r2-safe-write.js';
import { sanitizeOfertaInput, esVigente } from './_lib/ofertas-sanitize.js';

const DATA_KEY = 'data/productos.json';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, DELETE, OPTIONS',
};

async function readProductos(bucket) {
  const { data } = await safeRead(bucket, DATA_KEY, []);
  return data;
}

async function writeProductos(bucket, data) {
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
    const productos = await readProductos(bucket);
    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tiendaId');
    const slug = searchParams.get('slug');
    const all = searchParams.get('all');
    const now = Date.now();

    if (slug) {
      const tiendas = await readTiendas(bucket);
      const tienda = findTiendaBySlug(tiendas, slug);
      if (!tienda || !tienda.activa) return jsonResponse(event, 404, { error: 'Tienda no encontrada' }, { ...HTTP_OPTIONS, env });
      const result = productos
        .filter((p) => String(p.tiendaId) === String(tienda.id) && esVigente(p, now))
        .map(({ views, uniques, lastVisit, ...pub }) => pub);
      return jsonResponse(event, 200, result, { ...HTTP_OPTIONS, env });
    }

    if (tiendaId) {
      const user = await getOptionalUser(event, env);
      let result = productos.filter((p) => String(p.tiendaId) === String(tiendaId));
      if (all === '1') {
        const tiendas = await readTiendas(bucket);
        const tienda = findTiendaById(tiendas, tiendaId);
        const canSeePrivate = user && tienda && (user.isAdmin || tienda.googleUid === user.uid);
        if (!canSeePrivate) throw new HttpError(403, 'No autorizado');
      } else {
        result = result.filter((p) => esVigente(p, now)).map(({ views, uniques, lastVisit, ...pub }) => pub);
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
    if (!isModuleActive(tienda, 'catalogo')) {
      throw new HttpError(403, 'El módulo de Catálogo no está activo para esta tienda');
    }

    const productos = await readProductos(bucket);
    const nuevo = {
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...sanitizeOfertaInput(body, tienda),
      views: 0,
      uniques: 0,
      lastVisit: null,
      createdAt: new Date().toISOString(),
    };

    productos.unshift(nuevo);
    await writeProductos(bucket, productos);
    return jsonResponse(event, 201, nuevo, { ...HTTP_OPTIONS, env });
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

    const productos = await readProductos(bucket);
    const idx = productos.findIndex((item) => item.id === id);
    if (idx === -1) return jsonResponse(event, 404, { error: 'No encontrado' }, { ...HTTP_OPTIONS, env });

    const tiendas = await readTiendas(bucket);
    const tienda = findTiendaById(tiendas, productos[idx].tiendaId);
    ensureStoreOwner(user, tienda);

    const CAMPOS_QUE_DISPARAN_SANITIZE = [
      'nombre', 'titulo', 'imageUrl', 'thumbUrl', 'ogImageUrl', 'fotos',
      'publishAt', 'expireAt', 'descripcion', 'precio', 'precioOriginal',
      'stock', 'badgesForzados', 'financiacion', 'condicion', 'categoryId',
      'contactoWhatsapp', 'attributes',
    ];
    const update = {};
    if (CAMPOS_QUE_DISPARAN_SANITIZE.some((campo) => campo in body)) {
      Object.assign(update, sanitizeOfertaInput({ ...productos[idx], ...body }, tienda, productos[idx].slug));
    }
    if ('visible' in body) update.visible = !!body.visible;

    productos[idx] = { ...productos[idx], ...update, updatedAt: new Date().toISOString() };
    await writeProductos(bucket, productos);
    return jsonResponse(event, 200, productos[idx], { ...HTTP_OPTIONS, env });
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

    const productos = await readProductos(bucket);
    const idx = productos.findIndex((item) => item.id === id);
    if (idx === -1) return jsonResponse(event, 404, { error: 'No encontrado' }, { ...HTTP_OPTIONS, env });

    const tiendas = await readTiendas(bucket);
    const tienda = findTiendaById(tiendas, productos[idx].tiendaId);
    ensureStoreOwner(user, tienda);

    productos.splice(idx, 1);
    await writeProductos(bucket, productos);
    return jsonResponse(event, 200, { ok: true }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
