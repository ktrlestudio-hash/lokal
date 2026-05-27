import { S3Client } from '@aws-sdk/client-s3';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { HttpError } from './http.js';
import { safeRead, safeWrite } from './r2-safe-write.js';

const LOCAL_FILE = join('/tmp', 'lokal-tiendas.json');
const DATA_KEY = 'data/tiendas.json';
const BUCKET = process.env.R2_BUCKET_NAME;

function isR2Configured() {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function getClient() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// Lectura simple (sin etag) — para GETs públicos
export async function readTiendas() {
  if (isR2Configured()) {
    const { data } = await safeRead(getClient(), BUCKET, DATA_KEY, []);
    return data;
  }
  if (!existsSync(LOCAL_FILE)) return [];
  return JSON.parse(readFileSync(LOCAL_FILE, 'utf8'));
}

// Lectura con etag — para writes que necesitan protección
export async function readTiendasWithEtag() {
  if (isR2Configured()) {
    return safeRead(getClient(), BUCKET, DATA_KEY, []);
  }
  const data = existsSync(LOCAL_FILE) ? JSON.parse(readFileSync(LOCAL_FILE, 'utf8')) : [];
  return { data, etag: null };
}

// Write simple — para operaciones admin donde el riesgo es mínimo
export async function writeTiendas(data) {
  if (isR2Configured()) {
    const { etag } = await readTiendasWithEtag();
    await safeWrite(getClient(), BUCKET, DATA_KEY, data, etag);
    return;
  }
  writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
}

// Write con etag previo — para cuando el caller ya leyó con readTiendasWithEtag()
// Lanza 409 si alguien escribió entre la lectura y este write
export async function writeTiendasSafe(data, etag) {
  if (isR2Configured()) {
    await safeWrite(getClient(), BUCKET, DATA_KEY, data, etag);
    return;
  }
  writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
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
