// _lib/ofertas-read.js — Cloudflare Pages Functions version.
// Mismo propósito que la versión Netlify: lectura compartida de
// data/ofertas.json para que carrito.js pueda validar/repricear ítems
// contra el catálogo real sin duplicar la lógica de acceso a R2.
import { safeRead } from './r2-safe-write.js';

const DATA_KEY = 'data/ofertas.json';

export async function readOfertas(bucket) {
  const { data } = await safeRead(bucket, DATA_KEY, []);
  return data;
}

// Solo las de ESA tienda que además tienen precio (o sea, son "producto de
// catálogo", no una oferta simple sin precio).
export async function readOfertasParaCarrito(bucket, tiendaId) {
  const ofertas = await readOfertas(bucket);
  return ofertas.filter((o) => String(o.tiendaId) === String(tiendaId) && typeof o.precio === 'number');
}
