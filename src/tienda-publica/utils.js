import { PAGINA_DEFAULT, SECCIONES_DEFAULT } from './tokens.js';

// Luminosidad percibida → decide si el texto sobre ese color es blanco o negro
function contrastOn(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return { r, g, b, on: luminance > 0.55 ? '#111827' : '#ffffff' };
}

/**
 * Deriva los colores de MARCA de la tienda (lo único que realmente varía
 * por comercio) a partir de 1-2 hex: primario (obligatorio) y secundario
 * (opcional — si no viene, usa el amarillo de LOKAL, --accent-hex en
 * index.css; repetido acá como literal porque este cálculo corre antes de
 * que la cascada CSS esté garantizada, no se puede leer la var en runtime).
 * Superficie/texto/borde NO se recalculan acá: son alias fijos de los
 * tokens reales de LOKAL (--surface-solid, etc., definidos una sola vez en
 * src/index.css) — un solo lugar de verdad para toda la app, sin una
 * segunda paleta paralela por tienda.
 */
export function deriveColorPalette(hex, dark = false, secondaryHex = null) {
  const p = contrastOn(hex);
  const sec = contrastOn(secondaryHex || '#FFC530');

  return {
    // --surface-dim vive en index.css como "R G B" (formato RGB-sin-función,
    // pensado para Tailwind vía rgb(var(--surface-dim))) — usarla directo acá
    // como background rompía: un string "248 250 252" no es un color CSS
    // válido, y el navegador NO cae al fallback declarado con var(x, fallback)
    // en ese caso (solo cae si la variable no existe, no si su valor es
    // inválido) — por eso el fondo quedaba mal solo en un modo. Envuelta en
    // rgb() queda un color real y válido en ambos temas.
    '--tp-bg':           'rgb(var(--surface-dim))',
    '--tp-surface':      'var(--surface-solid)',
    '--tp-surface2':     'var(--surface-solid-2)',
    '--tp-border':       'var(--border-solid)',
    '--tp-text':         'var(--text-primary)',
    '--tp-text-muted':   'var(--text-secondary)',
    '--tp-primary':        hex,
    '--tp-primary-soft':   `rgba(${p.r},${p.g},${p.b},${dark ? '.15' : '.1'})`,
    '--tp-on-primary':     p.on,
    '--tp-secondary':      secondaryHex || '#FFC530',
    '--tp-secondary-soft': `rgba(${sec.r},${sec.g},${sec.b},${dark ? '.15' : '.1'})`,
    '--tp-on-secondary':   sec.on,
  };
}

/**
 * Mergea la config guardada de la tienda con los defaults.
 * Garantiza que siempre haya una config completa aunque falten campos.
 */
export function resolvePagina(paginaGuardada) {
  if (!paginaGuardada) return { ...PAGINA_DEFAULT };

  const secciones = {};
  for (const [key, def] of Object.entries(SECCIONES_DEFAULT)) {
    secciones[key] = {
      ...def,
      ...(paginaGuardada.secciones?.[key] || {}),
    };
  }

  return {
    ...PAGINA_DEFAULT,
    ...paginaGuardada,
    secciones,
  };
}

/**
 * Devuelve las secciones activas ordenadas por `orden`.
 */
export function getSeccionesActivas(secciones) {
  return Object.entries(secciones)
    .filter(([, s]) => s.activa)
    .sort(([, a], [, b]) => a.orden - b.orden)
    .map(([id, s]) => ({ id, ...s }));
}

/**
 * ¿Tiene la tienda el módulo `moduleId` activo? Espejo exacto de
 * isModuleActive() en netlify/functions/_lib/modules.js — mismo criterio,
 * mismo fallback "cerrado" (false) si la tienda no tiene pagina/secciones
 * configurado. Usar esta versión en el frontend (StoreApp.jsx, editor
 * visual); si se toca la lógica, actualizar ambas copias.
 */
// 'mensajes' quedó declarado en netlify/functions/_lib/modules.js para
// reutilizarlo en otro rubro más adelante, pero su backend
// (netlify/functions/messages.js) fue retirado en el recorte de LOKAL
// LINKS. Se fuerza inactivo acá sin importar qué diga tienda.pagina.secciones
// — cubre tanto tiendas nuevas (ya no se pre-activa, ver RUBRO_DEFAULTS)
// como tiendas existentes que lo tuvieran guardado activo de antes.
const MODULOS_SIN_BACKEND = new Set(['mensajes']);

// Bug real encontrado en producción (2026-08-24): SECCIONES_DEFAULT
// (tokens.js) usa la key 'productos' para lo que la UI llama "Catálogo" —
// el editor visual (toggleSeccion en StoreApp.jsx) y la vista pública
// (getSeccionesActivas) siempre leyeron/escribieron esa key, consistentes
// entre sí. Pero isModuleActive('catalogo') buscaba secciones.catalogo, una
// key que el switch de "Diseño de página" NUNCA tocaba — activar/desactivar
// Catálogo ahí no tenía ningún efecto en el admin (pantalla "Productos",
// bottom-nav) ni en productos-globales.js (Destacados de la Home), que
// seguían leyendo el valor por default (false) sin importar qué dijera el
// switch. Se mapea acá 'catalogo' → 'productos' para que TODO el sistema
// termine leyendo la misma key real, sin tocar el editor visual, la vista
// pública, ni los datos ya guardados de ninguna tienda.
const MODULE_KEY_ALIAS = { catalogo: 'productos' };

export function isModuleActive(tienda, moduleId) {
  if (MODULOS_SIN_BACKEND.has(moduleId)) return false;
  const key = MODULE_KEY_ALIAS[moduleId] || moduleId;
  const seccion = tienda?.pagina?.secciones?.[key];
  if (seccion && typeof seccion === 'object') return !!seccion.activa;
  return !!seccion;
}

/**
 * Estado de apertura de la tienda en tiempo real.
 */
export function getEstadoApertura(horarios) {
  if (!horarios) return { abierta: false, texto: null };
  const days = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  const hoy = days[new Date().getDay()];
  const schedule = horarios[hoy];
  if (!schedule) return { abierta: false, texto: `Cerrado hoy` };
  const [openStr, closeStr] = schedule.split('-');
  const toMins = s => { const [h, m = 0] = s.split(':').map(Number); return h * 60 + m; };
  const open = toMins(openStr);
  const close = toMins(closeStr);
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const abierta = now >= open && now < close;
  return {
    abierta,
    texto: abierta ? `Abierto · Cierra a las ${closeStr}` : `Cerrado · Abre a las ${openStr}`,
  };
}

export function formatPrice(n) {
  if (n == null || n === '') return 'A consultar';
  return `$${Number(n).toLocaleString('es-AR')}`;
}

export function buildWhatsAppUrl(tienda, items = [], note = '', entrega = null) {
  const phone = (tienda.whatsapp || tienda.telefono || '').replace(/\D/g, '');
  if (!phone) return null;
  const lines = [`¡Hola ${tienda.nombre}! Quiero hacer un pedido:`];
  if (items.length) {
    lines.push('');
    items.forEach(it => lines.push(`• ${it.qty}× ${it.nombre} → ${formatPrice((it.precio || 0) * it.qty)}`));
    const total = items.reduce((a, b) => a + (b.precio || 0) * b.qty, 0);
    lines.push('', `Total estimado: ${formatPrice(total)}`);
  }
  // Modo de entrega (retiro / delivery + dirección + link de ubicación)
  if (entrega?.modo === 'delivery') {
    lines.push('', '🛵 *Envío a domicilio*');
    if (entrega.direccion?.trim()) lines.push(`Dirección: ${entrega.direccion.trim()}`);
    if (entrega.mapUrl) lines.push(`Ubicación: ${entrega.mapUrl}`);
  } else if (entrega?.modo === 'retiro') {
    lines.push('', '🏪 *Retiro en el local*');
  }
  if (note.trim()) lines.push('', `Nota: ${note.trim()}`);
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}
