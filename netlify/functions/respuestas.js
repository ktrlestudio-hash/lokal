import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import {
  requireText,
  sanitizeMediaUrls,
  sanitizeNumber,
  sanitizeText,
} from './_lib/validation.js';
import { ensureStoreOwner, findTiendaById, readTiendas } from './_lib/tiendas-store.js';

const RESP_LOCAL = join('/tmp', 'lokal-respuestas.json');
const DEM_LOCAL = join('/tmp', 'lokal-demandas.json');
const BUCKET = process.env.R2_BUCKET_NAME;
const RESP_KEY = 'data/respuestas.json';
const DEM_KEY = 'data/demandas.json';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, DELETE, OPTIONS',
};

function isR2() {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
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
      Bucket: BUCKET,
      Key: r2Key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }));
    return;
  }

  writeFileSync(localFile, JSON.stringify(data, null, 2));
}

const readRespuestas = () => readJson(RESP_KEY, RESP_LOCAL);
const writeRespuestas = (data) => writeJson(RESP_KEY, RESP_LOCAL, data);
const readDemandas = () => readJson(DEM_KEY, DEM_LOCAL);
const writeDemandas = (data) => writeJson(DEM_KEY, DEM_LOCAL, data);

function tiempoRelativo(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Hace un momento';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

function storeCanRespond(store) {
  if (!store || store.activa === false) return false;
  if (!store.suscripcion?.vence) return true;
  return new Date(store.suscripcion.vence) > new Date();
}

function sanitizeAdjuntos(value) {
  if (!Array.isArray(value)) return [];

  const out = [];
  for (const item of value.slice(0, 4)) {
    if (!item || typeof item !== 'object') continue;
    const url = sanitizeMediaUrls(item.url ? [item.url] : [], { maxItems: 1 })[0];
    const type = ['image', 'video'].includes(item.type) ? item.type : null;
    if (url && type) out.push({ url, type });
  }
  return out;
}

function sanitizeRespuestaForResponse(respuesta) {
  return {
    ...respuesta,
    tiempoRespuesta: respuesta.creadoEn
      ? tiempoRelativo(respuesta.creadoEn)
      : (respuesta.tiempoRespuesta || 'Reciente'),
  };
}

function ensureDemandViewer(user, demanda) {
  if (!demanda) {
    throw new HttpError(404, 'Demanda no encontrada');
  }
  if (!user.isAdmin && demanda.ownerUid !== user.uid) {
    throw new HttpError(403, 'No autorizado para ver las respuestas de esta demanda');
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);

    if (event.httpMethod === 'GET') {
      const respuestas = await readRespuestas();
      const query = event.queryStringParameters || {};
      const demandaId = sanitizeText(query.demandaId, { max: 64, multiline: false });
      const tiendaId = sanitizeText(query.tiendaId, { max: 64, multiline: false });

      if (!demandaId && !tiendaId) {
        throw new HttpError(400, 'demandaId o tiendaId es requerido');
      }

      if (demandaId) {
        const demandas = await readDemandas();
        const demanda = demandas.find((item) => String(item.id) === String(demandaId));
        ensureDemandViewer(user, demanda);

        return jsonResponse(
          event,
          200,
          respuestas
            .filter((item) => String(item.demandaId) === String(demandaId))
            .map(sanitizeRespuestaForResponse),
          HTTP_OPTIONS
        );
      }

      const tiendas = await readTiendas();
      const tienda = findTiendaById(tiendas, tiendaId);
      ensureStoreOwner(user, tienda, 'No autorizado para ver las respuestas de esta tienda');

      return jsonResponse(
        event,
        200,
        respuestas
          .filter((item) => String(item.tiendaId) === String(tiendaId))
          .map(sanitizeRespuestaForResponse),
        HTTP_OPTIONS
      );
    }

    if (event.httpMethod === 'POST') {
      const body = parseJsonBody(event);
      const demandaId = sanitizeText(body.demandaId, { max: 64, multiline: false });
      const tiendaId = sanitizeText(body.tiendaId, { max: 64, multiline: false });
      const mensaje = requireText(body.mensaje, { field: 'mensaje', min: 2, max: 1500 });

      if (!demandaId || !tiendaId) {
        throw new HttpError(400, 'demandaId y tiendaId son requeridos');
      }

      const tiendas = await readTiendas();
      const tienda = findTiendaById(tiendas, tiendaId);
      ensureStoreOwner(user, tienda);

      if (!storeCanRespond(tienda)) {
        throw new HttpError(403, 'La tienda no puede responder con la suscripcion actual');
      }

      const demandas = await readDemandas();
      const demanda = demandas.find((item) => String(item.id) === String(demandaId));
      if (!demanda) {
        throw new HttpError(404, 'Demanda no encontrada');
      }
      if (demanda.estado !== 'activa') {
        throw new HttpError(409, 'La demanda ya no esta activa');
      }

      const respuestas = await readRespuestas();
      const duplicada = respuestas.find(
        (item) => String(item.demandaId) === String(demandaId) && String(item.tiendaId) === String(tiendaId)
      );
      if (duplicada) {
        return jsonResponse(event, 409, {
          error: 'Ya respondiste esta demanda',
          existing: sanitizeRespuestaForResponse(duplicada),
        }, HTTP_OPTIONS);
      }

      const nueva = {
        id: Date.now(),
        demandaId: String(demandaId),
        demandaTitulo: demanda.titulo || sanitizeText(body.demandaTitulo, { max: 160, multiline: false }) || null,
        tiendaId: String(tienda.id),
        tiendaNombre: tienda.nombre || 'Tienda',
        tiendaFoto: tienda.foto || null,
        tiendaRating: tienda.rating || null,
        tiendaHorario: tienda.horarios || null,
        tiendaDireccion: tienda.direccion || null,
        tiendaCiudad: tienda.ciudad || null,
        tiendaTelefono: tienda.telefono || null,
        matchType: sanitizeText(body.matchType, { max: 40, multiline: false }) || null,
        mensaje,
        precio: sanitizeNumber(body.precio, { field: 'precio', min: 0, max: 999999999, nullable: true }),
        adjuntos: sanitizeAdjuntos(body.adjuntos),
        creadoEn: new Date().toISOString(),
        tiempoRespuesta: 'Hace un momento',
      };

      respuestas.unshift(nueva);
      await writeRespuestas(respuestas);

      const idx = demandas.findIndex((item) => String(item.id) === String(demandaId));
      if (idx !== -1) {
        demandas[idx].respuestas = (demandas[idx].respuestas || 0) + 1;
        demandas[idx].updatedAt = new Date().toISOString();
        await writeDemandas(demandas);
      }

      const baseUrl = process.env.URL || 'http://localhost:8888';

      // Abrir thread de chat con el primer mensaje = cotización (fire and forget)
      if (demanda.ownerUid) {
        const chatBody = {
          storeId: String(tienda.id),
          partnerUid: demanda.ownerUid,
          text: mensaje,
          attachment: {
            type: 'context',
            origin: 'demanda',
            demandaId: String(demandaId),
            demandaTitulo: demanda.titulo || '',
            precio: nueva.precio || null,
            matchType: nueva.matchType || null,
            adjuntos: nueva.adjuntos || [],
          },
        };
        fetch(`${baseUrl}/.netlify/functions/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: event.headers.authorization || '' },
          body: JSON.stringify(chatBody),
        }).catch(() => {});
      }

      // Notificar al dueño de la demanda
      if (demanda.ownerUid) {
        fetch(`${baseUrl}/.netlify/functions/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: event.headers.authorization || '' },
          body: JSON.stringify({
            targetUid: demanda.ownerUid,
            type: 'respuesta',
            title: `${tienda.nombre || 'Una tienda'} respondió tu demanda`,
            body: demanda.titulo || '',
            link: String(demandaId),
          }),
        }).catch(() => {});
      }

      return jsonResponse(event, 201, sanitizeRespuestaForResponse(nueva), HTTP_OPTIONS);
    }

    if (event.httpMethod === 'PATCH') {
      // Append a chat message to an existing respuesta
      const body = parseJsonBody(event);
      const respuestaId = sanitizeText(body.respuestaId, { max: 64, multiline: false });
      const texto = requireText(body.texto, { field: 'texto', min: 1, max: 1000 });
      const rol = ['tienda', 'cliente'].includes(body.rol) ? body.rol : null;

      if (!respuestaId || !rol) {
        throw new HttpError(400, 'respuestaId y rol son requeridos');
      }

      const respuestas = await readRespuestas();
      const idx = respuestas.findIndex((item) => String(item.id) === String(respuestaId));
      if (idx === -1) throw new HttpError(404, 'Respuesta no encontrada');

      const respuesta = respuestas[idx];

      // Autorización: tienda owner o demanda owner (cliente)
      const tiendas = await readTiendas();
      const tienda = findTiendaById(tiendas, respuesta.tiendaId);
      const esTienda = tienda && tienda.ownerUid === user.uid;

      if (!esTienda && !user.isAdmin) {
        // For now only store owners can add messages (client chat is future work)
        throw new HttpError(403, 'No autorizado');
      }

      const msg = {
        id: Date.now(),
        rol: esTienda ? 'tienda' : 'cliente',
        texto,
        creadoEn: new Date().toISOString(),
      };

      respuestas[idx].mensajes = [...(respuestas[idx].mensajes || []), msg];
      await writeRespuestas(respuestas);

      return jsonResponse(event, 200, { msg }, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) {
        throw new HttpError(400, 'id requerido');
      }

      const respuestas = await readRespuestas();
      const idx = respuestas.findIndex((item) => String(item.id) === String(id));
      if (idx === -1) {
        return jsonResponse(event, 404, { error: 'No encontrada' }, HTTP_OPTIONS);
      }

      const eliminada = respuestas[idx];
      const tiendas = await readTiendas();
      const tienda = findTiendaById(tiendas, eliminada.tiendaId);
      ensureStoreOwner(user, tienda, 'No autorizado para eliminar esta respuesta');

      respuestas.splice(idx, 1);
      await writeRespuestas(respuestas);

      try {
        const demandas = await readDemandas();
        const demandaIdx = demandas.findIndex((item) => String(item.id) === String(eliminada.demandaId));
        if (demandaIdx !== -1 && demandas[demandaIdx].respuestas > 0) {
          demandas[demandaIdx].respuestas -= 1;
          demandas[demandaIdx].updatedAt = new Date().toISOString();
          await writeDemandas(demandas);
        }
      } catch {
        // No bloquear la respuesta si falla el contador.
      }

      return jsonResponse(event, 200, { ok: true }, HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
