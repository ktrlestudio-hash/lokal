// analytics.js — Cloudflare Pages Functions version.
import { handleError, handleOptions, jsonResponse, parseJsonBody, HttpError } from './_lib/http.js';
import { sanitizeText, sanitizePlainObject } from './_lib/validation.js';
import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { readTiendas } from './_lib/tiendas-store.js';
import {
  trackEvent,
  trackSession,
  getAnalyticsResumen,
  getAnalyticsTienda,
  getAnalyticsProducto,
  getTopBusquedas,
  getFlujoNavegacion,
  getResumenDueñoTienda,
} from './_lib/analytics-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, OPTIONS',
};

const TIPOS_VALIDOS = new Set([
  'pageview', 'click', 'busqueda', 'chat_iniciado', 'mensaje_enviado', 'rating', 'tiempo', 'conversion',
]);

function sanitizeEvent(body) {
  const tipo = sanitizeText(body.tipo, { max: 32, multiline: false });
  if (!TIPOS_VALIDOS.has(tipo)) {
    throw new HttpError(400, `tipo inválido: ${tipo}`);
  }
  return {
    tipo,
    categoria: body.categoria ? sanitizeText(body.categoria, { max: 32, multiline: false }) : null,
    entidadId: body.entidadId ? sanitizeText(String(body.entidadId), { max: 64, multiline: false }) : null,
    tiendaId: body.tiendaId ? sanitizeText(String(body.tiendaId), { max: 64, multiline: false }) : null,
    productoId: body.productoId ? sanitizeText(String(body.productoId), { max: 64, multiline: false }) : null,
    usuarioUid: body.usuarioUid ? sanitizeText(String(body.usuarioUid), { max: 128, multiline: false }) : null,
    sessionId: sanitizeText(String(body.sessionId || ''), { max: 64, multiline: false }) || null,
    pagina: body.pagina ? sanitizeText(body.pagina, { max: 64, multiline: false }) : null,
    desde: body.desde ? sanitizeText(body.desde, { max: 64, multiline: false }) : null,
    hacia: body.hacia ? sanitizeText(body.hacia, { max: 64, multiline: false }) : null,
    valor: typeof body.valor === 'number' && Number.isFinite(body.valor) ? body.valor : null,
    datos: body.datos ? sanitizePlainObject(body.datos, { maxKeys: 10, maxStringLength: 200 }) : null,
  };
}

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const body = await parseJsonBody(event);

    const rawEvents = Array.isArray(body.events) ? body.events : [body];
    if (rawEvents.length > 20) {
      throw new HttpError(400, 'Máximo 20 eventos por request');
    }

    const saved = [];
    for (const raw of rawEvents) {
      const clean = sanitizeEvent(raw);
      saved.push(await trackEvent(bucket, clean));
      if (clean.sessionId) {
        await trackSession(bucket, clean.sessionId, {
          pagina: clean.pagina,
          tiendaId: clean.tiendaId,
          productoId: clean.productoId,
          busqueda: clean.tipo === 'busqueda' ? clean.datos?.query : undefined,
          tiempo: clean.tipo === 'tiempo' ? clean.valor : undefined,
          dispositivo: raw.dispositivo,
        });
      }
    }
    return jsonResponse(event, 201, { ok: true, count: saved.length }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestGet({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tiendaId');
    const productoId = searchParams.get('productoId');
    const dias = searchParams.get('dias');
    const vista = searchParams.get('vista');
    const d = dias ? Math.min(90, Math.max(1, parseInt(dias, 10) || 7)) : 7;

    if (vista === 'mi-tienda') {
      if (!tiendaId) throw new HttpError(400, 'tiendaId requerido');
      const tiendas = await readTiendas(bucket);
      const tienda = tiendas.find((t) => String(t.id) === String(tiendaId));
      if (!tienda) throw new HttpError(404, 'Tienda no encontrada');
      if (!user.isAdmin && tienda.googleUid !== user.uid) {
        throw new HttpError(403, 'No autorizado para ver las estadísticas de esta tienda');
      }
      const ofertaIds = (searchParams.get('ofertaIds') || '')
        .split(',').map((s) => s.trim()).filter(Boolean).slice(0, 100);
      const resumen = await getResumenDueñoTienda(bucket, String(tiendaId), ofertaIds, Math.min(30, d));
      return jsonResponse(event, 200, resumen, { ...HTTP_OPTIONS, env });
    }

    ensureAdmin(user);
    if (vista === 'busquedas') return jsonResponse(event, 200, await getTopBusquedas(bucket, d), { ...HTTP_OPTIONS, env });
    if (vista === 'flujo') return jsonResponse(event, 200, await getFlujoNavegacion(bucket, d), { ...HTTP_OPTIONS, env });
    if (tiendaId) return jsonResponse(event, 200, await getAnalyticsTienda(bucket, tiendaId, d), { ...HTTP_OPTIONS, env });
    if (productoId) return jsonResponse(event, 200, await getAnalyticsProducto(bucket, productoId, d), { ...HTTP_OPTIONS, env });
    return jsonResponse(event, 200, await getAnalyticsResumen(bucket, d), { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
