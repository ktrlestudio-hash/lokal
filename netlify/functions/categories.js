import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const LOCAL_FILE = join('/tmp', 'lokal-categories.json');

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

const BUCKET = process.env.R2_BUCKET_NAME;
const DATA_KEY = 'data/categories-custom.json';

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
  } else {
    writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
  }
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    // ── GET: devuelve todas las categorías custom ────────────────────────────
    if (event.httpMethod === 'GET') {
      const custom = await readCustom();
      return { statusCode: 200, headers, body: JSON.stringify(custom) };
    }

    // ── POST: crea una categoría nueva ──────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const name = body.name?.trim();
      const parentId = body.parentId ?? null;

      if (!name) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'name es requerido' }) };
      }

      const custom = await readCustom();

      // Evitar duplicados por nombre (case-insensitive) dentro del mismo nivel
      const exists = custom.some(
        c => c.name.toLowerCase() === name.toLowerCase() && c.parentId === parentId
      );
      if (exists) {
        const dup = custom.find(c => c.name.toLowerCase() === name.toLowerCase() && c.parentId === parentId);
        return { statusCode: 200, headers, body: JSON.stringify(dup) };
      }

      const nueva = {
        id: `custom_${Date.now()}`,
        name,
        parentId,
        icon: body.icon || null,
        custom: true,
        createdAt: new Date().toISOString(),
      };

      custom.push(nueva);
      await writeCustom(custom);
      return { statusCode: 201, headers, body: JSON.stringify(nueva) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };

  } catch (err) {
    console.error('[categories]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
