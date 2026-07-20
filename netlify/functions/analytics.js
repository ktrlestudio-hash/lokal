/**
 * analytics.js — endpoint de tracking de eventos de la vista pública.
 *
 * POST (público, sin auth): cualquier visitante puede registrar SU PROPIA
 * navegación — es como funciona cualquier analytics de sitio (GA, Plausible,
 * etc.), no expone datos de terceros, solo escribe. Payload validado y
 * acotado (sin objetos libres sin límite) para no volverse un vector de
 * abuso de storage.
 *
 * GET (autenticado):
 *   - vista=mi-tienda: solo el DUEÑO de la tienda pedida (googleUid propio,
 *     verificado con ensureStoreOwner). Resumen SIMPLE — vistas, clicks WA,
 *     compartidos, top ofertas. Nada de tracking interno de LOKAL.
 *   - resto de vistas (resumen/tienda/producto/busquedas/flujo): solo admin
 *     de LOKAL vía ensureAdmin — el tracking "completo" del super-admin.
 */
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

// Tipos de evento aceptados — cualquier otro valor se rechaza (400), evita
// que el store acumule "tipos" arbitrarios sin sentido para las métricas.
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
    // datos: objeto libre pero ACOTADO (maxKeys/maxStringLength) — acá viaja
    // accion/medio/query/termino, nunca texto libre de un formulario.
    datos: body.datos ? sanitizePlainObject(body.datos, { maxKeys: 10, maxStringLength: 200 }) : null,
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    if (event.httpMethod === 'POST') {
      const body = parseJsonBody(event);

      // batch opcional: [{tipo,...}, ...] — o un solo evento en el body.
      const rawEvents = Array.isArray(body.events) ? body.events : [body];
      if (rawEvents.length > 20) {
        throw new HttpError(400, 'Máximo 20 eventos por request');
      }

      const saved = [];
      for (const raw of rawEvents) {
        const clean = sanitizeEvent(raw);
        saved.push(await trackEvent(clean));
        if (clean.sessionId) {
          await trackSession(clean.sessionId, {
            pagina: clean.pagina,
            tiendaId: clean.tiendaId,
            productoId: clean.productoId,
            busqueda: clean.tipo === 'busqueda' ? clean.datos?.query : undefined,
            tiempo: clean.tipo === 'tiempo' ? clean.valor : undefined,
            dispositivo: raw.dispositivo,
          });
        }
      }
      return jsonResponse(event, 201, { ok: true, count: saved.length }, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'GET') {
      const user = await requireAuth(event);
      const { tiendaId, productoId, dias, vista } = event.queryStringParameters || {};
      const d = dias ? Math.min(90, Math.max(1, parseInt(dias, 10) || 7)) : 7;

      // vista=mi-tienda: el DUEÑO ve el resumen simple de SU tienda — no
      // requiere ensureAdmin, solo que sea dueño real de tiendaId (mismo
      // criterio que ensureStoreOwner, sin importarlo directo para no
      // acoplar este endpoint al shape completo de tienda que esa función
      // espera — acá solo hace falta comparar el uid).
      if (vista === 'mi-tienda') {
        if (!tiendaId) throw new HttpError(400, 'tiendaId requerido');
        const tiendas = await readTiendas();
        const tienda = tiendas.find((t) => String(t.id) === String(tiendaId));
        if (!tienda) throw new HttpError(404, 'Tienda no encontrada');
        if (!user.isAdmin && tienda.googleUid !== user.uid) {
          throw new HttpError(403, 'No autorizado para ver las estadísticas de esta tienda');
        }
        const ofertaIds = (event.queryStringParameters?.ofertaIds || '')
          .split(',').map((s) => s.trim()).filter(Boolean).slice(0, 100);
        const resumen = await getResumenDueñoTienda(String(tiendaId), ofertaIds, Math.min(30, d));
        return jsonResponse(event, 200, resumen, HTTP_OPTIONS);
      }

      // Resto de vistas: tracking completo, solo admin de LOKAL.
      ensureAdmin(user);
      if (vista === 'busquedas') return jsonResponse(event, 200, await getTopBusquedas(d), HTTP_OPTIONS);
      if (vista === 'flujo') return jsonResponse(event, 200, await getFlujoNavegacion(d), HTTP_OPTIONS);
      if (tiendaId) return jsonResponse(event, 200, await getAnalyticsTienda(tiendaId, d), HTTP_OPTIONS);
      if (productoId) return jsonResponse(event, 200, await getAnalyticsProducto(productoId, d), HTTP_OPTIONS);
      return jsonResponse(event, 200, await getAnalyticsResumen(d), HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Método no permitido' }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
