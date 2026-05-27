/**
 * Endpoint para que el admin consulte analytics del sistema
 * Devuelve métricas agregadas, tendencias, flujos, etc.
 */

import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, jsonResponse } from './_lib/http.js';
import {
  getAnalyticsResumen,
  getAnalyticsTienda,
  getAnalyticsProducto,
  getTopBusquedas,
  getFlujoNavegacion,
} from './_lib/analytics-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, OPTIONS',
};

export const handler = async (event) =>  {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);
    ensureAdmin(user);

    const q = event.queryStringParameters || {};
    const tipo = q.tipo || 'resumen';
    const dias = Math.min(Number(q.dias) || 7, 90);

    switch (tipo) {
      case 'resumen': {
        const resumen = await getAnalyticsResumen(dias);
        return jsonResponse(event, 200, { resumen });
      }
      case 'tienda': {
        if (!q.tiendaId) return jsonResponse(event, 400, { error: 'Falta tiendaId' });
        const datos = await getAnalyticsTienda(q.tiendaId, dias);
        return jsonResponse(event, 200, { tiendaId: q.tiendaId, datos });
      }
      case 'producto': {
        if (!q.productoId) return jsonResponse(event, 400, { error: 'Falta productoId' });
        const datos = await getAnalyticsProducto(q.productoId, dias);
        return jsonResponse(event, 200, { productoId: q.productoId, datos });
      }
      case 'busquedas': {
        const limit = Math.min(Number(q.limit) || 20, 100);
        const busquedas = await getTopBusquedas(dias, limit);
        return jsonResponse(event, 200, { busquedas });
      }
      case 'flujo': {
        const flujo = await getFlujoNavegacion(dias);
        return jsonResponse(event, 200, { flujo });
      }
      default:
        return jsonResponse(event, 400, { error: 'Tipo no válido' });
    }
  } catch (err) {
    return handleError(event, err);
  }
};
