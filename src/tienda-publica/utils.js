import { PAGINA_DEFAULT, SECCIONES_DEFAULT } from './tokens.js';

/**
 * Deriva toda la paleta de colores a partir de 1 color primario.
 * Los templates usan estas variables CSS — nunca el color crudo.
 */
export function deriveColorPalette(hex, dark = false) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Luminosidad percibida (para decidir si el texto sobre el color es blanco o negro)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const onPrimary = luminance > 0.55 ? '#0f172a' : '#ffffff';

  if (dark) {
    return {
      '--tp-bg':           '#0a0d16',
      '--tp-surface':      '#111827',
      '--tp-surface2':     '#1e293b',
      '--tp-border':       'rgba(255,255,255,.08)',
      '--tp-text':         '#f1f5f9',
      '--tp-text-muted':   '#64748b',
      '--tp-primary':      hex,
      '--tp-primary-soft': `rgba(${r},${g},${b},.15)`,
      '--tp-on-primary':   onPrimary,
    };
  }

  return {
    '--tp-bg':           '#f8fafc',
    '--tp-surface':      '#ffffff',
    '--tp-surface2':     '#f1f5f9',
    '--tp-border':       'rgba(0,0,0,.07)',
    '--tp-text':         '#0f172a',
    '--tp-text-muted':   '#64748b',
    '--tp-primary':      hex,
    '--tp-primary-soft': `rgba(${r},${g},${b},.1)`,
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

export function buildWhatsAppUrl(tienda, items = [], note = '') {
  const phone = (tienda.whatsapp || tienda.telefono || '').replace(/\D/g, '');
  if (!phone) return null;
  const lines = [`¡Hola ${tienda.nombre}!`];
  if (items.length) {
    lines.push('');
    items.forEach(it => lines.push(`• ${it.qty}× ${it.nombre} → ${formatPrice(it.precio * it.qty)}`));
    const total = items.reduce((a, b) => a + b.precio * b.qty, 0);
    lines.push('', `Total estimado: ${formatPrice(total)}`);
  }
  if (note.trim()) lines.push('', `Nota: ${note.trim()}`);
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}
