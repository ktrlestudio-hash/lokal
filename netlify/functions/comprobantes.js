import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';

const COMPROBANTES_KEY = 'data/comprobantes.json';
const COMPROBANTES_LOCAL = join('/tmp', 'lokal-comprobantes.json');
const BUCKET = process.env.R2_BUCKET_NAME;

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || 'katryelmmartinez@gmail.com,ktrlestudio@gmail.com')
  .split(',')
  .map(v => v.trim().toLowerCase())
  .filter(Boolean);

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, OPTIONS',
};

function isR2() {
  return !!(process.env.CF_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
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

async function readData() {
  if (isR2()) {
    try {
      const res = await r2().send(new GetObjectCommand({ Bucket: BUCKET, Key: COMPROBANTES_KEY }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return [];
      throw err;
    }
  }
  if (!existsSync(COMPROBANTES_LOCAL)) return [];
  return JSON.parse(readFileSync(COMPROBANTES_LOCAL, 'utf8'));
}

async function writeData(data) {
  if (isR2()) {
    await r2().send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: COMPROBANTES_KEY,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }));
    return;
  }
  writeFileSync(COMPROBANTES_LOCAL, JSON.stringify(data, null, 2));
}

function isAdmin(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase());
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);
    const comprobantes = await readData();

    if (event.httpMethod === 'GET') {
      const url = new URL(event.url);
      const tiendaId = url.searchParams.get('tiendaId');
      const estado = url.searchParams.get('estado');

      let result = [...comprobantes];
      if (tiendaId) result = result.filter(c => c.tiendaId === tiendaId);
      if (estado) result = result.filter(c => c.estado === estado);

      // Si no es admin, solo ver sus propios comprobantes
      if (!user.isAdmin) {
        result = result.filter(c => c.userUid === user.uid);
      }

      // Ordenar por fecha descendente
      result.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

      return jsonResponse(event, 200, { comprobantes: result }, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'POST') {
      const body = parseJsonBody(event);
      const nuevo = {
        id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tiendaId: body.tiendaId,
        userUid: user.uid,
        userEmail: user.email,
        userName: user.name || '',
        plan: body.plan || 'mensual',
        monto: body.monto || null,
        imagenUrl: body.imagenUrl || '',
        estado: 'pendiente',
        notasUsuario: body.notas || '',
        creadoEn: new Date().toISOString(),
      };

      comprobantes.push(nuevo);
      await writeData(comprobantes);
      return jsonResponse(event, 200, { ok: true, comprobante: nuevo }, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'PATCH') {
      if (!isAdmin(payload.email)) {
        throw new HttpError(403, 'Solo admins pueden aprobar/rechazar');
      }

      const body = parseJsonBody(event);
      const { id, estado, notasAdmin } = body;
      if (!id || !['aprobado', 'rechazado'].includes(estado)) {
        throw new HttpError(400, 'Estado invalido');
      }

      const idx = comprobantes.findIndex(c => c.id === id);
      if (idx === -1) throw new HttpError(404, 'Comprobante no encontrado');

      comprobantes[idx] = {
        ...comprobantes[idx],
        estado,
        notasAdmin: notasAdmin || '',
        revisadoEn: new Date().toISOString(),
        revisadoPor: payload.email,
      };

      await writeData(comprobantes);

      return jsonResponse(event, 200, { ok: true, comprobante: comprobantes[idx] }, HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
