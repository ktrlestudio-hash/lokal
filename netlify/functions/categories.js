import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { requireText, sanitizeText } from './_lib/validation.js';

const LOCAL_FILE = join('/tmp', 'lokal-categories.json');
const DATA_KEY = 'data/categories-custom.json';
const BUCKET = process.env.R2_BUCKET_NAME;

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, OPTIONS',
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

async function readCustom() {
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

async function writeCustom(data) {
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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    if (event.httpMethod === 'GET') {
      const user = await requireAuth(event).catch(() => null);
      const custom = await readCustom();

      // Si es admin, devolver todas (incluyendo pendientes)
      if (user?.isAdmin) {
        return jsonResponse(event, 200, custom, HTTP_OPTIONS);
      }

      // Si no es admin, solo devolver las aprobadas
      const aprobadas = custom.filter(c => c.aprobada !== false);
      return jsonResponse(event, 200, aprobadas, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'POST') {
      const user = await requireAuth(event);

      const body = parseJsonBody(event);
      const name = requireText(body.name, { field: 'name', min: 2, max: 60, multiline: false });
      const parentId = sanitizeText(body.parentId, { max: 80, multiline: false }) || null;
      const icon = sanitizeText(body.icon, { max: 40, multiline: false }) || null;
      const custom = await readCustom();

      const exists = custom.find(
        (item) => item.name.toLowerCase() === name.toLowerCase() && item.parentId === parentId
      );
      if (exists) {
        return jsonResponse(event, 200, exists, HTTP_OPTIONS);
      }

      const nueva = {
        id: `custom_${Date.now()}`,
        name,
        parentId,
        icon,
        custom: true,
        aprobada: false,        // ← Necesita aprobación del admin
        creadaPor: user.uid,    // ← Quién la creó
        creadaPorEmail: user.email,
        createdAt: new Date().toISOString(),
      };

      custom.push(nueva);
      await writeCustom(custom);
      return jsonResponse(event, 201, nueva, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'PATCH') {
      const user = await requireAuth(event);
      ensureAdmin(user);

      const body = parseJsonBody(event);
      const { id, aprobada, name: nuevoNombre } = body;

      if (!id) {
        return jsonResponse(event, 400, { error: 'Falta id' }, HTTP_OPTIONS);
      }

      const custom = await readCustom();
      const idx = custom.findIndex(c => c.id === id);
      if (idx === -1) {
        return jsonResponse(event, 404, { error: 'Categoria no encontrada' }, HTTP_OPTIONS);
      }

      if (aprobada !== undefined) {
        custom[idx].aprobada = !!aprobada;
        custom[idx].aprobadaPor = user.email;
        custom[idx].aprobadaEn = new Date().toISOString();
      }

      if (nuevoNombre) {
        custom[idx].name = requireText(nuevoNombre, { field: 'name', min: 2, max: 60, multiline: false });
      }

      await writeCustom(custom);
      return jsonResponse(event, 200, custom[idx], HTTP_OPTIONS);
    }

    if (event.httpMethod === 'DELETE') {
      const user = await requireAuth(event);
      ensureAdmin(user);

      const { id } = event.queryStringParameters || {};
      if (!id) {
        return jsonResponse(event, 400, { error: 'Falta id' }, HTTP_OPTIONS);
      }

      const custom = await readCustom();
      const filtradas = custom.filter(c => c.id !== id);
      await writeCustom(filtradas);
      return jsonResponse(event, 200, { ok: true }, HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
