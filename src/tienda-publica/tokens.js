/**
 * Design tokens del sistema de TiendaPublica.
 * Todo template usa estos tokens — nunca hardcodea colores ni tamaños.
 * Para crear un nuevo template: importá estos tokens y componés con ellos.
 */

// Espaciado base (rem)
export const SPACING = {
  xs:  '0.5rem',
  sm:  '1rem',
  md:  '1.5rem',
  lg:  '2.5rem',
  xl:  '4rem',
  xxl: '6rem',
};

// Tipografía
export const FONT = {
  family: "'Poppins', 'Inter var', 'Inter', system-ui, -apple-system, sans-serif",
  size: {
    xs:   '0.7rem',
    sm:   '0.85rem',
    base: '1rem',
    lg:   '1.15rem',
    xl:   '1.4rem',
    '2xl':'1.75rem',
    '3xl':'2.25rem',
    '4xl':'3rem',
  },
  weight: { normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 },
  lineHeight: { tight: 1.15, base: 1.5, relaxed: 1.75 },
};

// Radios de borde
export const RADIUS = {
  sm:   '8px',
  md:   '14px',
  lg:   '20px',
  xl:   '28px',
  full: '9999px',
};

// Sombras
export const SHADOW = {
  sm:  '0 1px 8px rgba(0,0,0,.08)',
  md:  '0 4px 20px rgba(0,0,0,.12)',
  lg:  '0 8px 40px rgba(0,0,0,.18)',
  xl:  '0 16px 60px rgba(0,0,0,.24)',
};

// Transiciones
export const TRANSITION = {
  fast:   'all .12s ease',
  normal: 'all .2s ease',
  slow:   'all .35s cubic-bezier(0.16,1,0.3,1)',
};

// Breakpoints (para lógica JS de responsive)
export const BP = {
  sm: 480,
  md: 768,
  lg: 1024,
};

/**
 * Secciones disponibles con su config por defecto.
 * Un template puede cambiar el orden pero no puede agregar secciones que no estén acá.
 * Para agregar una sección nueva: agregala acá + creá su componente en /sections/.
 */
export const SECCIONES_DEFAULT = {
  hero:      { activa: true,  orden: 1, label: 'Portada',    desc: 'Logo, nombre y tagline' },
  productos: { activa: true,  orden: 2, label: 'Catálogo',   desc: 'Grilla de productos' },
  horarios:  { activa: true,  orden: 3, label: 'Horarios',   desc: 'Días y horarios de atención' },
  contacto:  { activa: true,  orden: 4, label: 'Contacto',   desc: 'WhatsApp, Instagram, teléfono' },
  galeria:   { activa: false, orden: 5, label: 'Galería',    desc: 'Fotos de la tienda' },
  sobre:     { activa: true,  orden: 6, label: 'Sobre nosotros', desc: 'Descripción libre' },
  mapa:      { activa: false, orden: 7, label: 'Ubicación',  desc: 'Mapa con la dirección' },
};

/**
 * Templates disponibles.
 * Para que la IA cree uno nuevo: agregar entrada acá + crear el archivo en /templates/.
 */
export const TEMPLATES = {
  detail:   { label: 'Detail',    desc: 'Foto hero + logo flotante + acciones rápidas. Inspirado en el perfil de tienda.' },
  minimal:  { label: 'Minimal',   desc: 'Limpio, columna única, mucho espacio. Ideal para servicios y profesionales.' },
  tarjetas: { label: 'Tarjetas',  desc: 'Grid visual con cards. Ideal para comercios con catálogo de productos.' },
  magazine: { label: 'Magazine',  desc: 'Banner full-width y layout asimétrico. Para marcas con identidad fuerte.' },
  market:      { label: 'Market',      desc: 'Estilo supermercado: chips de categoría, grid de productos con badges de descuento y stock, trust strip.' },
  'minimal-pro': { label: 'Minimal Pro',  desc: 'Lista vertical compacta, sin hero. Ideal para servicios, profesionales y catálogos chicos.' },
  'market-dark': { label: 'Market Dark', desc: 'Dark premium: cards full-bleed con imagen, hero banner, sidebar en desktop, bottom nav mobile.' },
  'premium':     { label: '✦ Premium',   desc: 'Dark 2026: glassmorphism, Framer Motion, hero cinemático con parallax, sidebar desktop, bottom nav.' },
  'PARALLAX':    { label: '✦ Nebula',    desc: 'Cinematic 2026: parallax hero, glassmorphism, ambient orbs, sidebar desktop, dark/light adaptable.' },
  'base':        { label: '⭐ Base',     desc: 'El template definitivo: parallax hero, filtros avanzados, carrito, mapa, contacto, dark/light adaptable.' },
};

export const TEMPLATE_DEFAULT = 'detail';

/**
 * Config de página por defecto.
 * La tienda puede sobreescribir cualquier campo.
 */
export const PAGINA_DEFAULT = {
  template: TEMPLATE_DEFAULT,
  color: '#00B8D9',
  modoOscuro: false,
  secciones: { ...SECCIONES_DEFAULT },
};
