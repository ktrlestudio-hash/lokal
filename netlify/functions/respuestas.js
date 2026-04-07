import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const LOCAL_FILE = join('/tmp', 'lokal-respuestas.json');
const BUCKET = process.env.R2_BUCKET_NAME;
const DATA_KEY = 'data/respuestas.json';

function isR2Configured() {
  return !!(process.env.CF_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
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

async function readRespuestas() {
  if (isR2Configured()) {
    try {
      const res = await getClient().send(new GetObjectCommand({ Bucket: BUCKET, Key: DATA_KEY }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return [];
      throw err;
    }
  }
  if (!existsSync(LOCAL_FILE)) return [];
  return JSON.parse(readFileSync(LOCAL_FILE, 'utf8'));
}

async function writeRespuestas(data) {
  if (isR2Configured()) {
    await getClient().send(new PutObjectCommand({
      Bucket: BUCKET, Key: DATA_KEY,
      Body: JSON.stringify(data, null, 2), ContentType: 'application/json',
    }));
  } else {
    writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
  }
}

// Actualiza el contador de respuestas en la demanda correspondiente
async function incrementarContadorDemanda(demandaId, baseUrl) {
  try {
    // Leemos demandas y actualizamos el contador via PATCH
    await fetch(`${baseUrl}/.netlify/functions/demandas`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: demandaId, _incrementRespuestas: true }),
    });
  } catch { /* no bloquear */ }
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
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    // GET ?demandaId=xxx — respuestas de una demanda (para el usuario)
    // GET ?tiendaId=xxx  — respuestas enviadas por una tienda
    if (event.httpMethod === 'GET') {
      const respuestas = await readRespuestas();
      const { demandaId, tiendaId } = event.queryStringParameters || {};

      let result = respuestas;
      if (demandaId) result = result.filter(r => String(r.demandaId) === String(demandaId));
      if (tiendaId) result = result.filter(r => String(r.tiendaId) === String(tiendaId));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(
          result.map(r => ({
            ...r,
            tiempoRespuesta: r.creadoEn ? tiempoRelativo(r.creadoEn) : r.tiempoRespuesta,
          }))
        ),
      };
    }

    // POST — tienda responde a una demanda
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { demandaId, tiendaId, tiendaNombre, mensaje, precio } = body;

      if (!demandaId || !tiendaId || !mensaje?.trim()) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'demandaId, tiendaId y mensaje son requeridos' }) };
      }

      const respuestas = await readRespuestas();

      // Una tienda solo puede responder una vez por demanda
      const duplicada = respuestas.find(
        r => String(r.demandaId) === String(demandaId) && String(r.tiendaId) === String(tiendaId)
      );
      if (duplicada) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Ya respondiste esta demanda' }) };
      }

      const nueva = {
        id: Date.now(),
        demandaId: String(demandaId),
        tiendaId: String(tiendaId),
        tiendaNombre: tiendaNombre || 'Tienda',
        mensaje: mensaje.trim(),
        precio: precio ? Number(precio) : null,
        tiempoRespuesta: 'Hace un momento',
        creadoEn: new Date().toISOString(),
      };

      respuestas.unshift(nueva);
      await writeRespuestas(respuestas);

      // Incrementar contador en la demanda
      const baseUrl = process.env.URL || 'http://localhost:8888';
      // Actualizamos el campo respuestas en la demanda directamente
      try {
        const demandasRes = await fetch(`${baseUrl}/.netlify/functions/demandas`);
        if (demandasRes.ok) {
          const demandas = await demandasRes.json();
          const demanda = demandas.find(d => String(d.id) === String(demandaId));
          if (demanda) {
            await fetch(`${baseUrl}/.netlify/functions/demandas`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: demanda.id, respuestas: (demanda.respuestas || 0) + 1 }),
            });
          }
        }
      } catch { /* no bloquear */ }

      return { statusCode: 201, headers, body: JSON.stringify(nueva) };
    }

    // DELETE ?id=xxx — eliminar respuesta
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id requerido' }) };

      const respuestas = await readRespuestas();
      const filtradas = respuestas.filter(r => String(r.id) !== String(id));
      if (filtradas.length === respuestas.length) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'No encontrada' }) };
      }
      await writeRespuestas(filtradas);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };
  } catch (err) {
    console.error('[respuestas]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
