import { PAGINA_DEFAULT, SECCIONES_DEFAULT } from './tokens.js';

/**
 * Deriva el color de MARCA de la tienda (lo único que realmente varía por
 * comercio) a partir de 1 hex. Superficie/texto/borde NO se recalculan acá:
 * son alias fijos de los tokens reales de LOKAL (--surface-solid, etc.,
 * definidos una sola vez en src/index.css) — un solo lugar de verdad para
 * toda la app, sin una segunda paleta paralela por tienda.
 */
export function deriveColorPalette(hex, dark = false) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Luminosidad percibida (para decidir si el texto sobre el color es blanco o negro)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const onPrimary = luminance > 0.55 ? '#0f172a' : '#ffffff';

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
    '--tp-primary':      hex,
    '--tp-primary-soft': `rgba(${r},${g},${b},${dark ? '.15' : '.1'})`,
    '--tp-on-primary':   onPrimary,
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
