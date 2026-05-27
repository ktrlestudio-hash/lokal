/**
 * Endpoint para que el admin consulte todos los usuarios
 * GET /admin-users — lista todos los perfiles
 * GET /admin-users?uid=xxx — un perfil específico
 */

import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, jsonResponse } from './_lib/http.js';
import { readUserProfiles, findUserProfileByUid } from './_lib/user-profiles-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);
    ensureAdmin(user);

    const { uid } = event.queryStringParameters || {};

    const profiles = await readUserProfiles();

    // Si piden un UID específico
    if (uid) {
      const profile = findUserProfileByUid(profiles, uid);
      if (!profile) {
        return jsonResponse(event, 404, { error: 'Perfil no encontrado' }, HTTP_OPTIONS);
      }
      return jsonResponse(event, 200, { usuario: profile }, HTTP_OPTIONS);
    }

    // Lista completa (con datos resumidos para no saturar)
    const usuarios = profiles.map(p => ({
      uid: p.uid,
      email: p.email,
      displayName: p.displayName || '',
      photoURL: p.photoURL || '',
      role: p.role || 'usuario',
      plan: p.plan || null,
      onboarded: p.onboarded || false,
      tieneTienda: !!p.businessProfile,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      suscripcion: p.suscripcion ? {
        plan: p.suscripcion.plan,
        vence: p.suscripcion.vence,
        estado: p.suscripcion.estado,
      } : null,
    }));

    return jsonResponse(event, 200, { usuarios, total: usuarios.length }, HTTP_OPTIONS);
  } catch (err) {
    return handleError(err, event, HTTP_OPTIONS);
  }
};
