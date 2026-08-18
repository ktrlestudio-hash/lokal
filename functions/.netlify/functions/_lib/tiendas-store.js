// _lib/tiendas-store.js — Cloudflare Pages Functions version.
//
// Sin el fallback de fs/tmp: la versión Netlify lo usaba solo cuando R2 no
// estaba configurado (desarrollo local sin credenciales) — en producción
// real SIEMPRE hay R2 configurado, así que esa rama nunca corría ahí. Acá
// se recibe directo el R2Bucket binding (`env.LOKAL_BUCKET`, ver
// wrangler.toml) en vez de credenciales S3 — no hay "sin configurar"
// posible: si el binding falta, wrangler ya falla al levantar el Worker.
import { HttpError } from './http.js';
import { safeRead, safeWrite } from './r2-safe-write.js';

const DATA_KEY = 'data/tiendas.json';

// Lectura simple (sin etag) — para GETs públicos
export async function readTiendas(bucket) {
  const { data } = await safeRead(bucket, DATA_KEY, []);
  return data;
}

// Lectura con etag — para writes que necesitan protección
export async function readTiendasWithEtag(bucket) {
  return safeRead(bucket, DATA_KEY, []);
}

// Write simple — para operaciones admin donde el riesgo es mínimo
export async function writeTiendas(bucket, data) {
  const { etag } = await readTiendasWithEtag(bucket);
  await safeWrite(bucket, DATA_KEY, data, etag);
}

// Write con etag previo — para cuando el caller ya leyó con readTiendasWithEtag()
// Lanza 409 si alguien escribió entre la lectura y este write
export async function writeTiendasSafe(bucket, data, etag) {
  await safeWrite(bucket, DATA_KEY, data, etag);
}

export function findTiendaById(tiendas, id) {
  return tiendas.find((item) => String(item.id) === String(id)) || null;
}

export function findTiendaByOwnerUid(tiendas, uid) {
  return tiendas.find((item) => item.googleUid === uid) || null;
}

export function findTiendaBySlug(tiendas, slug) {
  return tiendas.find((item) => item.slug === slug) || null;
}

export function generateSlug(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function sanitizePublicTienda(tienda) {
  if (!tienda) return null;
  const { googleUid, ownerEmail, ownerNombre, ownerFoto, token, ...rest } = tienda;
  return rest;
}

export function sanitizeOwnerTienda(tienda) {
  if (!tienda) return null;
  const { token, ...rest } = tienda;
  return rest;
}

export function ensureStoreOwner(user, tienda, message = 'No autorizado para operar sobre esta tienda') {
  if (!tienda) throw new HttpError(404, 'Tienda no encontrada');
  if (!user?.isAdmin && tienda.googleUid !== user?.uid) throw new HttpError(403, message);
}
