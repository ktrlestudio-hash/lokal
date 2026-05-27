/**
 * Endpoint para trackear eventos de analytics desde el frontend
 * Público (no requiere auth) para trackear usuarios anónimos
 * Opcional: si hay token, se asocia al usuario
 */

import { getBearerToken, verifyFirebaseIdToken } from './_lib/auth.js';
import { handleError, handleOptions, jsonResponse, parseJsonBodyAsync } from './_lib/http.js';
import { trackEvent, trackSession } from './_lib/analytics-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, OPTIONS',
};

export const handler = async (event) =>  {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);
  if (event.httpMethod !== 'POST') {
    return jsonResponse(event, 405, { error: 'Método no permitido' });
  }

  try {
    const body = await parseJsonBodyAsync(req);
    const { eventos, sessionId, sessionDatos } = body;

    // Intentar obtener usuario si está logueado
    let usuarioUid = null;
    try {
      const token = getBearerToken(req);
      if (token) {
        const user = await verifyFirebaseIdToken(token);
        usuarioUid = user.uid;
      }
    } catch {
      // Usuario anónimo, no pasa nada
    }

    // Actualizar sesión
    if (sessionId) {
      await trackSession(sessionId, {
        ...sessionDatos,
        usuarioUid,
      });
    }

    // Trackear eventos
    const resultados = [];
    if (Array.isArray(eventos)) {
      for (const evento of eventos) {
        const entry = await trackEvent({
          ...evento,
          usuarioUid: evento.usuarioUid || usuarioUid,
          sessionId: evento.sessionId || sessionId,
        });
        resultados.push(entry);
      }
    } else if (eventos) {
      const entry = await trackEvent({
        ...eventos,
        usuarioUid: eventos.usuarioUid || usuarioUid,
        sessionId: eventos.sessionId || sessionId,
      });
      resultados.push(entry);
    }

    return jsonResponse(event, 200, { ok: true, tracked: resultados.length });
  } catch (err) {
    return handleError(event, err);
  }
}
