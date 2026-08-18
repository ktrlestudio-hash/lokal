// _lib/ofertas-sanitize.js — lógica pura de sanitización de ofertas.js,
// extraída para poder testear sin depender de R2/auth/Request (ver
// __tests__/ofertas-sanitize.test.js). Sin este archivo, sanitizeOfertaInput
// vivía inline en ofertas.js y solo se pudo verificar el fix de precio/
// stock con un script ad-hoc de una sola vez — acá queda como test real
// del repo, que corre en cada `npm test`.
import { sanitizeMediaUrls, sanitizeText, requireText, sanitizeNumber, sanitizeStringArray, sanitizePlainObject, sanitizePhone } from './validation.js';

export function generateSlug(nombre) {
  return String(nombre || '')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'oferta';
}

export function esVigente(o, now = Date.now()) {
  if (!o || o.visible === false) return false;
  const pub = o.publishAt ? new Date(o.publishAt).getTime() : 0;
  const exp = o.expireAt ? new Date(o.expireAt).getTime() : Infinity;
  return now >= pub && now <= exp;
}

export const CONDICIONES_VALIDAS = new Set(['nuevo', 'usado']);
// badgesForzados reemplaza al viejo `ventaja` (VENTAJAS_VALIDAS: "Mejor
// precio"/"Financiación"/etc, un checkbox manual sin relación con el
// tiempo real del producto) — ver src/utils/productBadges.js para el
// diseño completo. `ventaja` sigue siendo un campo legado válido en datos
// YA guardados (no se borra), pero sanitizeOfertaInput ya no lo escribe.
export const BADGES_VALIDOS = new Set(['nuevo', 'oferta', 'por_vencer']);

// El formulario de "Producto" (catálogo) manda `titulo`, el de "Oferta"
// manda `nombre` — mismo backend, dos formularios distintos del admin.
export function sanitizeOfertaInput(body, tienda, existingSlug) {
  const nombre = requireText(body.nombre ?? body.titulo, { field: 'nombre', min: 2, max: 160, multiline: false });
  const imageUrl = sanitizeMediaUrls(body.imageUrl ? [body.imageUrl] : [], { maxItems: 1 })[0] || null;
  const thumbUrl = sanitizeMediaUrls(body.thumbUrl ? [body.thumbUrl] : [], { maxItems: 1 })[0] || imageUrl;
  const ogImageUrl = sanitizeMediaUrls(body.ogImageUrl ? [body.ogImageUrl] : [], { maxItems: 1 })[0] || thumbUrl;
  const fotos = sanitizeMediaUrls(Array.isArray(body.fotos) ? body.fotos : [], { maxItems: 8 });

  const base = {
    tiendaId: tienda.id,
    nombre,
    slug: existingSlug || generateSlug(nombre),
    imageUrl: imageUrl || fotos[0] || null,
    thumbUrl: thumbUrl || fotos[0] || null,
    ogImageUrl: ogImageUrl || fotos[0] || null,
    publishAt: body.publishAt || new Date().toISOString(),
    expireAt: body.expireAt || null,
    visible: body.visible !== false,
  };

  // Campos específicos del módulo "catalogo" (producto de comercio) — cada
  // uno se asigna SOLO si la clave está presente en el body: así un PATCH
  // parcial que no toca "precio" no lo pisa con null, y una oferta simple
  // del módulo "ofertas" (que nunca manda estas claves) no termina con un
  // objeto lleno de nulls decorativos. Este es el fix del bug real de hoy
  // (precio/stock/condición se descartaban al guardar un producto).
  const producto = {};
  if (fotos.length) producto.fotos = fotos;
  if ('descripcion' in body) producto.descripcion = sanitizeText(body.descripcion, { max: 2000, multiline: true });
  if ('precio' in body) producto.precio = sanitizeNumber(body.precio, { field: 'precio', min: 0, max: 999999999 });
  if ('precioOriginal' in body) producto.precioOriginal = sanitizeNumber(body.precioOriginal, { field: 'precioOriginal', min: 0, max: 999999999 });
  if ('stock' in body) producto.stock = sanitizeNumber(body.stock, { field: 'stock', min: 0, max: 999999, integer: true });
  // badgesForzados: { agregar: string[], ocultar: string[] } — override
  // manual OPCIONAL sobre los badges que ya se calculan solos en el
  // frontend (calcularBadges). Ambos arrays se sanitizan igual, filtrando
  // contra el set de badges reales — un id inventado desde el cliente no
  // hace nada (ver productBadges.js: BADGE_CONFIG[id] && activos.add(id)).
  if ('badgesForzados' in body) {
    const raw = body.badgesForzados && typeof body.badgesForzados === 'object' ? body.badgesForzados : {};
    const limpiar = (lista) => sanitizeStringArray(Array.isArray(lista) ? lista : [], { maxItems: 4, maxItemLength: 20 }).filter((v) => BADGES_VALIDOS.has(v));
    producto.badgesForzados = { agregar: limpiar(raw.agregar), ocultar: limpiar(raw.ocultar) };
  }
  if ('financiacion' in body) producto.financiacion = sanitizeText(body.financiacion, { max: 200, multiline: false }) || null;
  if ('condicion' in body) {
    const c = sanitizeText(body.condicion, { max: 20, multiline: false });
    producto.condicion = CONDICIONES_VALIDAS.has(c) ? c : 'nuevo';
  }
  if ('categoryId' in body) producto.categoryId = sanitizeText(body.categoryId, { max: 80, multiline: false }) || null;
  if ('contactoWhatsapp' in body) producto.contactoWhatsapp = sanitizePhone(body.contactoWhatsapp) || null;
  if ('attributes' in body) producto.attributes = sanitizePlainObject(body.attributes, { maxKeys: 20, maxStringLength: 80 });

  return { ...base, ...producto };
}
