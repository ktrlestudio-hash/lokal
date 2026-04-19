import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// ── Storage helpers ────────────────────────────────────────────────────────────
const RESP_LOCAL  = join('/tmp', 'lokal-respuestas.json');
const DEM_LOCAL   = join('/tmp', 'lokal-demandas.json');
const BUCKET      = process.env.R2_BUCKET_NAME;
const RESP_KEY    = 'data/respuestas.json';
const DEM_KEY     = 'data/demandas.json';

function isR2() {
  return !!(process.env.CF_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
}

function r2() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function readJson(r2Key, localFile) {
  if (isR2()) {
    try {
      const res = await r2().send(new GetObjectCommand({ Bucket: BUCKET, Key: r2Key }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return [];
      throw err;
    }
  }
  if (!existsSync(localFile)) return [];
  return JSON.parse(readFileSync(localFile, 'utf8'));
}

async function writeJson(r2Key, localFile, data) {
  if (isR2()) {
    await r2().send(new PutObjectCommand({
      Bucket: BUCKET, Key: r2Key,
      Body: JSON.stringify(data, null, 2), ContentType: 'application/json',
    }));
  } else {
    writeFileSync(localFile, JSON.stringify(data, null, 2));
  }
}

const readRespuestas  = () => readJson(RESP_KEY, RESP_LOCAL);
const writeRespuestas = (d) => writeJson(RESP_KEY, RESP_LOCAL, d);
const readDemandas    = () => readJson(DEM_KEY,  DEM_LOCAL);
const writeDemandas   = (d) => writeJson(DEM_KEY,  DEM_LOCAL, d);

// ── Helpers ────────────────────────────────────────────────────────────────────
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

// ── Handler ────────────────────────────────────────────────────────────────────
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    // ── GET ?demandaId=xxx  — respuestas para una demanda (usuario)
    // ── GET ?tiendaId=xxx   — respuestas enviadas por una tienda
    if (event.httpMethod === 'GET') {
      const respuestas = await readRespuestas();
      const { demandaId, tiendaId } = event.queryStringParameters || {};

      let result = respuestas;
      if (demandaId) result = result.filter(r => String(r.demandaId) === String(demandaId));
      if (tiendaId)  result = result.filter(r => String(r.tiendaId)  === String(tiendaId));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(
          result.map(r => ({
            ...r,
            tiempoRespuesta: r.creadoEn ? tiempoRelativo(r.creadoEn) : (r.tiempoRespuesta || 'Reciente'),
          }))
        ),
      };
    }

    // ── POST — tienda responde a una demanda
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const {
        demandaId, tiendaId, tiendaNombre, mensaje, precio,
        demandaTitulo,
        tiendaFoto, tiendaRating, tiendaHorario, tiendaDireccion, tiendaCiudad, tiendaTelefono,
        adjuntos, // [{ url, type: 'image'|'video' }]
      } = body;

      if (!demandaId || !tiendaId || !mensaje?.trim()) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'demandaId, tiendaId y mensaje son requeridos' }) };
      }

      const respuestas = await readRespuestas();

      // Una tienda solo puede responder una vez por demanda
      const duplicada = respuestas.find(
        r => String(r.demandaId) === String(demandaId) && String(r.tiendaId) === String(tiendaId)
      );
      if (duplicada) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Ya respondiste esta demanda', existing: duplicada }) };
      }

      const nueva = {
        id: Date.now(),
        demandaId: String(demandaId),
        demandaTitulo: demandaTitulo || null,
        tiendaId: String(tiendaId),
        tiendaNombre: tiendaNombre || 'Tienda',
        tiendaFoto: tiendaFoto || null,
        tiendaRating: tiendaRating || null,
        tiendaHorario: tiendaHorario || null,
        tiendaDireccion: tiendaDireccion || null,
        tiendaCiudad: tiendaCiudad || null,
        tiendaTelefono: tiendaTelefono || null,
        matchType: body.matchType || null,
        mensaje: mensaje.trim(),
        precio: precio ? Number(precio) : null,
        adjuntos: Array.isArray(adjuntos) ? adjuntos.slice(0, 4) : [],
        creadoEn: new Date().toISOString(),
        tiempoRespuesta: 'Hace un momento',
      };

      respuestas.unshift(nueva);
      await writeRespuestas(respuestas);

      // ── Incrementar contador en demanda directamente (sin HTTP circular) ──
      try {
        const demandas = await readDemandas();
        const idx = demandas.findIndex(d => String(d.id) === String(demandaId));
        if (idx !== -1) {
          demandas[idx].respuestas = (demandas[idx].respuestas || 0) + 1;
          demandas[idx].updatedAt = new Date().toISOString();
          await writeDemandas(demandas);
        }
      } catch { /* no bloquear la respuesta si falla el contador */ }

      return { statusCode: 201, headers, body: JSON.stringify(nueva) };
    }

    // ── DELETE ?id=xxx — eliminar respuesta (y decrementar contador)
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id requerido' }) };

      const respuestas = await readRespuestas();
      const idx = respuestas.findIndex(r => String(r.id) === String(id));
      if (idx === -1) return { statusCode: 404, headers, body: JSON.stringify({ error: 'No encontrada' }) };

      const [eliminada] = respuestas.splice(idx, 1);
      await writeRespuestas(respuestas);

      // Decrementar contador
      try {
        const demandas = await readDemandas();
        const dIdx = demandas.findIndex(d => String(d.id) === String(eliminada.demandaId));
        if (dIdx !== -1 && demandas[dIdx].respuestas > 0) {
          demandas[dIdx].respuestas -= 1;
          demandas[dIdx].updatedAt = new Date().toISOString();
          await writeDemandas(demandas);
        }
      } catch { /* silencioso */ }

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };

  } catch (err) {
    console.error('[respuestas]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
