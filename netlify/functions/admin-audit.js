import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, jsonResponse } from './_lib/http.js';
import {
  getAuditHoy,
  getAuditByEntidad,
  getAuditByActor,
  getAuditByAccion,
  getAuditStats,
} from './_lib/audit-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);
    ensureAdmin(user);

    const { tipo, entidadTipo, entidadId, actorUid, accion } = event.queryStringParameters || {};
    const limit = Math.min(Number(event.queryStringParameters?.limit) || 50, 200);
    const offset = Number(event.queryStringParameters?.offset) || 0;

    if (tipo === 'stats') {
      const stats = await getAuditStats();
      return jsonResponse(event, 200, { stats });
    }

    if (tipo === 'entidad') {
      if (!entidadTipo || !entidadId) return jsonResponse(event, 400, { error: 'Faltan entidadTipo o entidadId' });
      const logs = await getAuditByEntidad(entidadTipo, entidadId, limit);
      return jsonResponse(event, 200, { logs });
    }

    if (tipo === 'actor') {
      if (!actorUid) return jsonResponse(event, 400, { error: 'Falta actorUid' });
      const logs = await getAuditByActor(actorUid, limit);
      return jsonResponse(event, 200, { logs });
    }

    if (tipo === 'accion') {
      if (!accion) return jsonResponse(event, 400, { error: 'Falta accion' });
      const logs = await getAuditByAccion(accion, limit);
      return jsonResponse(event, 200, { logs });
    }

    const logs = await getAuditHoy(limit, offset);
    return jsonResponse(event, 200, { logs });
  } catch (err) {
    return handleError(event, err);
  }
};
