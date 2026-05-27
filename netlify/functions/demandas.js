import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import {
  requireText,
  sanitizeMediaUrls,
  sanitizeNumber,
  sanitizePlainObject,
  sanitizeText,
} from './_lib/validation.js';
import { findTiendaByOwnerUid, readTiendas } from './_lib/tiendas-store.js';

const LOCAL_FILE = join('/tmp', 'lokal-demandas.json');
const DATA_KEY = 'data/demandas.json';
const BUCKET = process.env.R2_BUCKET_NAME;

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, DELETE, OPTIONS',
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
    return;
  }

  writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
}

function tiempoRelativo(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Hace un momento';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

function sanitizePresupuesto(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const min = sanitizeNumber(value.min, { field: 'presupuesto.min', min: 0, max: 999999999, nullable: true });
  const max = sanitizeNumber(value.max, { field: 'presupuesto.max', min: 0, max: 999999999, nullable: true });

  if (min === null && max === null) return null;
  if (min !== null && max !== null && min > max) {
    throw new HttpError(400, 'presupuesto invalido');
  }

  return { min, max };
}

function sanitizeDemandaBody(body) {
  const fotos = sanitizeMediaUrls(body.fotos, { maxItems: 6 });
  const foto = sanitizeMediaUrls(body.foto ? [body.foto] : [], { maxItems: 1 })[0] || fotos[0] || null;

  return {
    titulo: requireText(body.titulo, { field: 'titulo', min: 2, max: 160, multiline: false }),
    descripcion: sanitizeText(body.descripcion, { max: 2000 }),
    fotos,
    foto,
    categoryId: sanitizeText(body.categoryId, { max: 80, multiline: false }) || null,
    attributes: sanitizePlainObject(body.attributes, { maxKeys: 24, maxStringLength: 120 }),
    presupuesto: sanitizePresupuesto(body.presupuesto),
  };
}

function sanitizeDemandaForResponse(demanda) {
  const {
    ownerUid,
    ownerEmail,
    ownerNombre,
    ...rest
  } = demanda;

  return {
    ...rest,
    tiempoCreado: demanda.createdAt ? tiempoRelativo(demanda.createdAt) : demanda.tiempoCreado,
  };
}

function ensureDemandOwner(user, demanda) {
  if (!demanda) {
    throw new HttpError(404, 'Demanda no encontrada');
  }

  if (!demanda.ownerUid && !user.isAdmin) {
    throw new HttpError(403, 'Esta demanda no tiene propietario verificable');
  }

  if (!user.isAdmin && demanda.ownerUid !== user.uid) {
    throw new HttpError(403, 'No autorizado para modificar esta demanda');
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);

    if (event.httpMethod === 'GET') {
      const demandas = await readDemandas();
      const tiendas = await readTiendas();
      const hasStore = !!findTiendaByOwnerUid(tiendas, user.uid);
      const mine = ['1', 'true', 'yes'].includes(String(event.queryStringParameters?.mine || '').toLowerCase());

      let result = demandas;
      if (mine || (!hasStore && !user.isAdmin)) {
        result = demandas.filter((item) => item.ownerUid === user.uid);
      }

      return jsonResponse(
        event,
        200,
        result.map(item => ({ ...sanitizeDemandaForResponse(item), isMine: item.ownerUid === user.uid })),
        HTTP_OPTIONS
      );
    }

    if (event.httpMethod === 'POST') {
      const body = parseJsonBody(event);
      const payload = sanitizeDemandaBody(body);
      const demandas = await readDemandas();
      const nueva = {
        id: Date.now(),
        ...payload,
        respuestas: 0,
        estado: 'activa',
        ownerUid: user.uid,
        ownerNombre: sanitizeText(user.name || '', { max: 120, multiline: false }),
        ownerEmail: sanitizeText(user.email || '', { max: 160, multiline: false }),
        tiempoCreado: 'Hace un momento',
        createdAt: new Date().toISOString(),
      };

      demandas.unshift(nueva);
      await writeDemandas(demandas);
      return jsonResponse(event, 201, sanitizeDemandaForResponse(nueva), HTTP_OPTIONS);
    }

    if (event.httpMethod === 'PATCH') {
      const body = parseJsonBody(event);
      const { id, ...changes } = body;

      if (!id) {
        throw new HttpError(400, 'id es requerido');
      }

      const demandas = await readDemandas();
      // eslint-disable-next-line eqeqeq
      const idx = demandas.findIndex((item) => item.id == id || item._id == id);
      if (idx === -1) {
        return jsonResponse(event, 404, { error: 'Demanda no encontrada' }, HTTP_OPTIONS);
      }

      ensureDemandOwner(user, demandas[idx]);

      const update = {};
      if ('estado' in changes) {
        const estado = sanitizeText(changes.estado, { max: 24, multiline: false });
        if (!['activa', 'pausada', 'finalizada'].includes(estado)) {
          throw new HttpError(400, 'estado invalido');
        }
        update.estado = estado;
      }
      if ('titulo' in changes) update.titulo = requireText(changes.titulo, { field: 'titulo', min: 2, max: 160, multiline: false });
      if ('descripcion' in changes) update.descripcion = sanitizeText(changes.descripcion, { max: 2000 });
      if ('fotos' in changes) update.fotos = sanitizeMediaUrls(changes.fotos, { maxItems: 6 });
      if ('foto' in changes) update.foto = sanitizeMediaUrls(changes.foto ? [changes.foto] : [], { maxItems: 1 })[0] || null;
      if ('categoryId' in changes) update.categoryId = sanitizeText(changes.categoryId, { max: 80, multiline: false }) || null;
      if ('attributes' in changes) update.attributes = sanitizePlainObject(changes.attributes, { maxKeys: 24, maxStringLength: 120 });
      if ('presupuesto' in changes) update.presupuesto = sanitizePresupuesto(changes.presupuesto);

      demandas[idx] = {
        ...demandas[idx],
        ...update,
        updatedAt: new Date().toISOString(),
      };

      await writeDemandas(demandas);
      return jsonResponse(event, 200, sanitizeDemandaForResponse(demandas[idx]), HTTP_OPTIONS);
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) {
        throw new HttpError(400, 'id es requerido');
      }

      const demandas = await readDemandas();
      const idx = demandas.findIndex(
        // eslint-disable-next-line eqeqeq
        (item) => item.id == id || item._id == id
      );
      if (idx === -1) {
        // diagnóstico: devolver qué ids hay para detectar mismatch
        return jsonResponse(event, 404, {
          error: 'Demanda no encontrada',
          searchId: id,
          searchIdType: typeof id,
          storedIds: demandas.map(d => ({ id: d.id, type: typeof d.id, owner: d.ownerUid === user.uid })),
        }, HTTP_OPTIONS);
      }

      ensureDemandOwner(user, demandas[idx]);
      demandas.splice(idx, 1);
      await writeDemandas(demandas);
      return jsonResponse(event, 200, { ok: true }, HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
