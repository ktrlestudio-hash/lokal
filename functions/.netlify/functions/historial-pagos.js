// historial-pagos.js — Cloudflare Pages Functions version.
import { handleError, handleOptions, HttpError, jsonResponse } from './_lib/http.js';
import { requireAuth, ensureSameUserOrAdmin } from './_lib/auth.js';
import { readTiendas, findTiendaById } from './_lib/tiendas-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, OPTIONS',
};

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestGet({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tiendaId');
    if (!tiendaId) throw new HttpError(400, 'Falta tiendaId');

    const user = await requireAuth(event, env);
    const tiendas = await readTiendas(bucket);
    const tienda = findTiendaById(tiendas, tiendaId);
    if (!tienda) throw new HttpError(404, 'Tienda no encontrada');

    ensureSameUserOrAdmin(user, tienda.googleUid, 'No autorizado para ver este historial');

    const historial = [...(tienda.suscripcion?.historial || [])].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );

    return jsonResponse(event, 200, { historial }, { ...HTTP_OPTIONS, env });
  } catch (err) {
    return handleError(request, err, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
