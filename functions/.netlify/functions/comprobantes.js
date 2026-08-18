// comprobantes.js — Cloudflare Pages Functions version.
//
// Bug corregido al portar: el PATCH original (netlify/functions/comprobantes.js)
// referenciaba una variable `payload` que nunca se declaraba en ese scope
// (el resto del handler usa `user`) — un ReferenceError real en cualquier
// intento de aprobar/rechazar un comprobante en producción. Acá usa `user`
// consistentemente, igual que el resto del archivo.
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { safeRead, safeWrite } from './_lib/r2-safe-write.js';

const COMPROBANTES_KEY = 'data/comprobantes.json';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, OPTIONS',
};

async function readData(bucket) {
  const { data } = await safeRead(bucket, COMPROBANTES_KEY, []);
  return data;
}

async function writeData(bucket, data) {
  const { etag } = await safeRead(bucket, COMPROBANTES_KEY, []);
  await safeWrite(bucket, COMPROBANTES_KEY, data, etag);
}

function getAdminEmails(env) {
  return (env.VITE_ADMIN_EMAILS || 'katryelmmartinez@gmail.com,ktrlestudio@gmail.com')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestGet({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    const comprobantes = await readData(bucket);
    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tiendaId');
    const estado = searchParams.get('estado');

    let result = [...comprobantes];
    if (tiendaId) result = result.filter((c) => c.tiendaId === tiendaId);
    if (estado) result = result.filter((c) => c.estado === estado);

    if (!user.isAdmin) {
      result = result.filter((c) => c.userUid === user.uid);
    }

    result.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

    return jsonResponse(event, 200, { comprobantes: result }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    const comprobantes = await readData(bucket);
    const body = await parseJsonBody(event);
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
    await writeData(bucket, comprobantes);
    return jsonResponse(event, 200, { ok: true, comprobante: nuevo }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestPatch({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    const comprobantes = await readData(bucket);

    if (!getAdminEmails(env).includes((user.email || '').toLowerCase())) {
      throw new HttpError(403, 'Solo admins pueden aprobar/rechazar');
    }

    const body = await parseJsonBody(event);
    const { id, estado, notasAdmin } = body;
    if (!id || !['aprobado', 'rechazado'].includes(estado)) {
      throw new HttpError(400, 'Estado invalido');
    }

    const idx = comprobantes.findIndex((c) => c.id === id);
    if (idx === -1) throw new HttpError(404, 'Comprobante no encontrado');

    comprobantes[idx] = {
      ...comprobantes[idx],
      estado,
      notasAdmin: notasAdmin || '',
      revisadoEn: new Date().toISOString(),
      revisadoPor: user.email,
    };

    await writeData(bucket, comprobantes);

    return jsonResponse(event, 200, { ok: true, comprobante: comprobantes[idx] }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
