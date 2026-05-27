/**
 * Reportes de usuarios sobre tiendas, productos o demandas.
 * GET  /reports              → lista (admin) o los propios (usuario)
 * POST /reports              → crear reporte (cualquier usuario autenticado)
 * PATCH /reports?id=xxx      → actualizar estado / responder (admin)
 */

import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, jsonResponse, parseJsonBody } from './_lib/http.js';
import { readReports, writeReports } from './_lib/reports-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, OPTIONS',
};

const MOTIVOS_VALIDOS = ['Información incorrecta', 'Precio engañoso', 'Tienda cerrada', 'Contenido inapropiado', 'Spam', 'Otro'];

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);

    // ── GET ──────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      const reports = await readReports();
      if (user.isAdmin) {
        return jsonResponse(event, 200, reports, HTTP_OPTIONS);
      }
      // usuario normal: solo sus propios reportes
      return jsonResponse(event, 200, reports.filter(r => r.autorUid === user.uid), HTTP_OPTIONS);
    }

    // ── POST — crear reporte ─────────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const body = parseJsonBody(event);
      const { tipo, refId, refNombre, motivo, desc } = body || {};

      if (!tipo || !motivo || !desc?.trim()) {
        return jsonResponse(event, 400, { error: 'Faltan campos: tipo, motivo, desc' }, HTTP_OPTIONS);
      }
      if (!MOTIVOS_VALIDOS.includes(motivo)) {
        return jsonResponse(event, 400, { error: 'Motivo inválido' }, HTTP_OPTIONS);
      }

      const reports = await readReports();
      const newReport = {
        id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tipo,
        refId: refId || null,
        refNombre: refNombre || null,
        motivo,
        desc: desc.trim().slice(0, 500),
        fecha: new Date().toISOString(),
        estado: 'pendiente',
        autorUid: user.uid,
        autorNombre: user.name || user.email || 'Anónimo',
        adminRespuesta: null,
        respondidoEn: null,
      };

      await writeReports([newReport, ...reports]);
      return jsonResponse(event, 201, newReport, HTTP_OPTIONS);
    }

    // ── PATCH — responder / cambiar estado (admin) ───────────────────────────
    if (event.httpMethod === 'PATCH') {
      ensureAdmin(user);
      const { id } = event.queryStringParameters || {};
      if (!id) return jsonResponse(event, 400, { error: 'Falta id' }, HTTP_OPTIONS);

      const body = parseJsonBody(event);
      const reports = await readReports();
      const idx = reports.findIndex(r => r.id === id);
      if (idx === -1) return jsonResponse(event, 404, { error: 'Reporte no encontrado' }, HTTP_OPTIONS);

      const updated = {
        ...reports[idx],
        ...(body.estado         && { estado: body.estado }),
        ...(body.adminRespuesta !== undefined && { adminRespuesta: body.adminRespuesta, respondidoEn: new Date().toISOString() }),
      };
      reports[idx] = updated;
      await writeReports(reports);
      return jsonResponse(event, 200, updated, HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Method not allowed' }, HTTP_OPTIONS);
  } catch (err) {
    return handleError(event, err);
  }
};
