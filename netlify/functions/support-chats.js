/**
 * Chats de soporte entre usuarios/tiendas y el admin.
 * GET  /support-chats            → lista completa (admin) o el propio (usuario)
 * POST /support-chats            → crear nuevo chat de soporte (usuario autenticado)
 * PATCH /support-chats?id=xxx    → agregar mensaje o cambiar estado
 */

import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, jsonResponse, parseJsonBody } from './_lib/http.js';
import { readSupportChats, writeSupportChats } from './_lib/support-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);

    // ── GET ──────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      const chats = await readSupportChats();
      if (user.isAdmin) {
        return jsonResponse(event, 200, chats, HTTP_OPTIONS);
      }
      // usuario normal: solo su propio chat
      return jsonResponse(event, 200, chats.filter(c => c.autorUid === user.uid), HTTP_OPTIONS);
    }

    // ── POST — abrir nuevo chat ──────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const body = parseJsonBody(event);
      const { asunto, mensaje, autorRol } = body || {};

      if (!asunto?.trim() || !mensaje?.trim()) {
        return jsonResponse(event, 400, { error: 'Faltan campos: asunto, mensaje' }, HTTP_OPTIONS);
      }

      const chats = await readSupportChats();

      // Un usuario solo puede tener un chat abierto a la vez
      const existingOpen = chats.find(c => c.autorUid === user.uid && c.estado === 'abierto');
      if (existingOpen && !user.isAdmin) {
        return jsonResponse(event, 409, { error: 'Ya tenés un chat de soporte abierto', chatId: existingOpen.id }, HTTP_OPTIONS);
      }

      const newChat = {
        id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        autorUid: user.uid,
        autorNombre: user.name || user.email || 'Anónimo',
        autorRol: autorRol || 'usuario',
        asunto: asunto.trim().slice(0, 200),
        estado: 'abierto',
        fecha: new Date().toISOString(),
        mensajes: [{
          de: 'usuario',
          texto: mensaje.trim().slice(0, 1000),
          fecha: new Date().toISOString(),
        }],
      };

      await writeSupportChats([newChat, ...chats]);
      return jsonResponse(event, 201, newChat, HTTP_OPTIONS);
    }

    // ── PATCH — agregar mensaje o cambiar estado ──────────────────────────────
    if (event.httpMethod === 'PATCH') {
      const { id } = event.queryStringParameters || {};
      if (!id) return jsonResponse(event, 400, { error: 'Falta id' }, HTTP_OPTIONS);

      const body = parseJsonBody(event);
      const chats = await readSupportChats();
      const idx = chats.findIndex(c => c.id === id);
      if (idx === -1) return jsonResponse(event, 404, { error: 'Chat no encontrado' }, HTTP_OPTIONS);

      const chat = chats[idx];

      // Solo admin o el dueño del chat pueden modificarlo
      if (!user.isAdmin && chat.autorUid !== user.uid) {
        return jsonResponse(event, 403, { error: 'No autorizado' }, HTTP_OPTIONS);
      }

      const updated = { ...chat };

      if (body.mensaje?.trim()) {
        updated.mensajes = [
          ...chat.mensajes,
          {
            de: user.isAdmin ? 'admin' : 'usuario',
            texto: body.mensaje.trim().slice(0, 1000),
            fecha: new Date().toISOString(),
            adjuntos: Array.isArray(body.adjuntos) ? body.adjuntos : undefined,
          },
        ];
      }

      if (body.estado && user.isAdmin) {
        updated.estado = body.estado;
      }

      chats[idx] = updated;
      await writeSupportChats(chats);
      return jsonResponse(event, 200, updated, HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Method not allowed' }, HTTP_OPTIONS);
  } catch (err) {
    return handleError(event, err);
  }
};
