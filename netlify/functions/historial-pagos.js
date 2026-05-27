import { handleError, handleOptions, HttpError, jsonResponse } from './_lib/http.js';
import { requireAuth, ensureSameUserOrAdmin } from './_lib/auth.js';
import { readTiendas, findTiendaById } from './_lib/tiendas-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const { tiendaId } = event.queryStringParameters || {};
    if (!tiendaId) throw new HttpError(400, 'Falta tiendaId');

    const user = await requireAuth(event);
    const tiendas = await readTiendas();
    const tienda = findTiendaById(tiendas, tiendaId);
    if (!tienda) throw new HttpError(404, 'Tienda no encontrada');

    ensureSameUserOrAdmin(user, tienda.googleUid, 'No autorizado para ver este historial');

    const historial = [...(tienda.suscripcion?.historial || [])].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );

    return jsonResponse(event, 200, { historial });
  } catch (err) {
    return handleError(event, err);
  }
};
