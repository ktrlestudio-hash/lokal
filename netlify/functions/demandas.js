import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const LOCAL_FILE = join('/tmp', 'lokal-demandas.json');

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
const DATA_KEY = 'data/demandas.json';

async function readDemandas() {
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

async function writeDemandas(data) {
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

function tiempoRelativo(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Hace un momento';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    // ── GET: listar ─────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      const demandas = await readDemandas();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(
          demandas.map(d => ({
            ...d,
            tiempoCreado: d.createdAt ? tiempoRelativo(d.createdAt) : d.tiempoCreado,
          }))
        ),
      };
    }

    // ── POST: crear ─────────────────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body.titulo?.trim()) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'titulo es requerido' }) };
      }
      const demandas = await readDemandas();
      const nueva = {
        id: Date.now(),
        titulo: body.titulo.trim(),
        descripcion: body.descripcion?.trim() || '',
        foto: body.foto || '📦',
        categorias: body.categorias || [],
        presupuesto: body.presupuesto || null,
        respuestas: 0,
        estado: 'activa',
        tiempoCreado: 'Hace un momento',
        createdAt: new Date().toISOString(),
      };
      demandas.unshift(nueva);
      await writeDemandas(demandas);
      return { statusCode: 201, headers, body: JSON.stringify(nueva) };
    }

    // ── PATCH: actualizar (estado, titulo, descripcion, foto, etc.) ─────────
    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const { id, ...changes } = body;

      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'id es requerido' }) };
      }

      const demandas = await readDemandas();
      const idx = demandas.findIndex(d => String(d.id) === String(id));

      if (idx === -1) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Demanda no encontrada' }) };
      }

      // Solo se permiten actualizar estos campos
      const allowed = ['estado', 'titulo', 'descripcion', 'foto', 'categorias', 'presupuesto', 'respuestas'];
      const update = {};
      for (const key of allowed) {
        if (key in changes) update[key] = changes[key];
      }

      demandas[idx] = { ...demandas[idx], ...update, updatedAt: new Date().toISOString() };
      await writeDemandas(demandas);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...demandas[idx],
          tiempoCreado: tiempoRelativo(demandas[idx].createdAt),
        }),
      };
    }

    // ── DELETE: eliminar por id ──────────────────────────────────────────────
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'id es requerido' }) };
      }
      const demandas = await readDemandas();
      const filtradas = demandas.filter(d => String(d.id) !== String(id));
      if (filtradas.length === demandas.length) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Demanda no encontrada' }) };
      }
      await writeDemandas(filtradas);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };

  } catch (err) {
    console.error('[demandas]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
