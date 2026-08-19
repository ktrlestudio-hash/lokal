// _lib/productos-read.js — lectura compartida de data/productos.json, mismo
// propósito que ofertas-read.js pero para el módulo "catalogo" (backend
// separado desde esta sesión, ver productos.js). carrito.js valida/repricea
// ítems contra esto, no contra ofertas.json.
import { safeRead } from './r2-safe-write.js';

const DATA_KEY = 'data/productos.json';

export async function readProductos(bucket) {
  const { data } = await safeRead(bucket, DATA_KEY, []);
  return data;
}

// Solo los de ESA tienda con precio numérico — mismo criterio que
// readOfertasParaCarrito, acá ya no hace falta filtrar por "tiene precio"
// porque data/productos.json es exclusivamente catálogo, pero se mantiene
// el filtro por consistencia con datos legados que pudieran faltar el campo.
export async function readProductosParaCarrito(bucket, tiendaId) {
  const productos = await readProductos(bucket);
  return productos.filter((p) => String(p.tiendaId) === String(tiendaId) && typeof p.precio === 'number');
}
