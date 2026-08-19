// _debug-ofertas.js — endpoint TEMPORAL de solo lectura, solo-admin, para
// diagnosticar el bug real reportado (2026-08-19): "vacío las ofertas
// desde el admin, veo la lista vacía, pero al refrescar/navegar vuelven a
// aparecer". Devuelve el estado crudo real de data/ofertas.json y
// data/productos.json en R2, sin pasar por ningún filtro/caché del cliente
// — así se puede confirmar si el problema es del servidor (el archivo
// nunca se vació de verdad) o del cliente (algo trae datos viejos).
// BORRAR este archivo una vez resuelto el diagnóstico.
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, jsonResponse, HttpError } from './_lib/http.js';
import { safeRead } from './_lib/r2-safe-write.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, OPTIONS',
};

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestGet({ request, env }) {
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(request, env);
    if (!user.isAdmin) throw new HttpError(403, 'Solo admin');

    const { searchParams } = new URL(request.url);
    const tiendaId = searchParams.get('tiendaId');

    const [{ data: ofertas, etag: etagOfertas }, { data: productos, etag: etagProductos }] = await Promise.all([
      safeRead(bucket, 'data/ofertas.json', []),
      safeRead(bucket, 'data/productos.json', []),
    ]);

    const ofertasDeLaTienda = tiendaId ? ofertas.filter((o) => String(o.tiendaId) === String(tiendaId)) : ofertas;
    const productosDeLaTienda = tiendaId ? productos.filter((p) => String(p.tiendaId) === String(tiendaId)) : productos;

    return jsonResponse(request, 200, {
      ofertas: {
        totalGlobal: ofertas.length,
        totalDeLaTienda: ofertasDeLaTienda.length,
        etag: etagOfertas,
        primeros3: ofertasDeLaTienda.slice(0, 3).map((o) => ({ id: o.id, nombre: o.nombre, precio: o.precio, tipoPrecio: typeof o.precio, createdAt: o.createdAt })),
      },
      productos: {
        totalGlobal: productos.length,
        totalDeLaTienda: productosDeLaTienda.length,
        etag: etagProductos,
        primeros10: productosDeLaTienda.slice(0, 10).map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio, tipoPrecio: typeof p.precio, createdAt: p.createdAt })),
      },
    }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
