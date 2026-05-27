/**
 * LOKAL — Sistema de Identidad Visual
 * ─────────────────────────────────────────────────────────────────────────────
 * Archivo central de marca. Exporta:
 *   BRAND          — constantes de marca (colores, nombre, links)
 *   LogoSymbol     — solo el símbolo SVG (adaptable a cualquier color)
 *   LogoBadge      — símbolo sobre fondo de color (app icon, avatar)
 *   LogoFull       — símbolo + wordmark "lokal" en horizontal
 *   LogoWordmark   — solo el texto "lokal"
 *   LogoMono       — versión monocromática (para footers, watermarks)
 *   KtrlMark       — logo del estudio creador (KTRL)
 *
 * Uso rápido:
 *   import { LogoFull, LogoBadge, BRAND } from './Brand';
 *   <LogoFull size={32} />          → símbolo + texto, color brand
 *   <LogoBadge size={40} inverted /> → badge blanco s/ fondo brand
 *   <LogoSymbol size={24} color="white" />
 *   style={{ color: BRAND.hex }}    → color en inline styles
 *
 * Para cambiar el color de toda la marca:
 *   Editá --brand-hex en src/index.css y ese valor se propaga a toda la app.
 *   Acá se usa var(--brand-hex) para que las instancias del logo también cambien.
 */

// ── Constantes de marca ───────────────────────────────────────────────────────
export const BRAND = {
  name:     'Lokal',
  tagline:  'Todo cerca.',
  pitch:    'Descubrí, Comprá, Conectá.',
  year:     2026,

  colors: {
    primary:   '#00B8D9',  // turquesa — color principal
    secondary: '#3A86FF',  // azul eléctrico
    deep:      '#0B132B',  // azul profundo (fondos oscuros)
    darkBg:    '#0F172A',  // fondo dark modo
    lightBg:   '#F8FAFC',  // fondo light mode
    accent:    '#FFD60A',  // amarillo — uso limitado, solo CTAs clave
  },

  semantic: {
    ok:      '#22C55E',
    warn:    '#F59E0B',
    danger:  '#EF4444',
    info:    '#94A3B8',
    new:     '#8B5CF6',
  },

  social: {
    instagram: 'https://instagram.com/lokal.ar',
  },

  // Para uso en inline styles, SVGs externos, canvas, mapas
  get hex()  { return 'var(--brand-hex, #00B8D9)'; },
};

// ── Paths del símbolo (del archivo LOKAL LOGO 2026.svg) ───────────────────────
// Marco redondeado cuadrado (efecto "anillo" por doble M en fill-rule nonzero)
const FRAME_PATH = 'M62.52,7.66c6.08,0,11,4.93,11,11v44.12c0,6.08-4.93,11-11,11H18.66c-6.08,0-11-4.93-11-11V18.66c0-6.08,4.93-11,11-11h43.86M62.52,0H18.66C8.37,0,0,8.37,0,18.66v44.12c0,10.29,8.37,18.66,18.66,18.66h43.86c10.29,0,18.66-8.37,18.66-18.66V18.66c0-10.29-8.37-18.66-18.66-18.66h0Z';

// ── LogoSymbol ────────────────────────────────────────────────────────────────
/**
 * Solo el símbolo SVG de Lokal (contenedor + punto).
 * Usa currentColor — controlable con className="text-brand" o color prop.
 *
 * @param {number} size    — tamaño en px (ancho y alto)
 * @param {string} color   — color inline (sobrescribe currentColor)
 * @param {string} className
 */
export function LogoSymbol({ size = 32, color, className = '' }) {
  return (
    <svg
      viewBox="0 0 81.18 81.44"
      width={size}
      height={size}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={color ? { color } : undefined}
      aria-label="Lokal"
    >
      <circle cx="40.72" cy="40.65" r="11.23" />
      <path d={FRAME_PATH} />
    </svg>
  );
}

// ── LogoBadge ─────────────────────────────────────────────────────────────────
/**
 * Símbolo sobre fondo de color (para app icon, navbar, avatar, notificaciones).
 *
 * @param {number} size     — tamaño total del badge en px
 * @param {boolean} inverted — fondo blanco + símbolo brand (vs brand + símbolo blanco)
 * @param {boolean} dark    — fondo oscuro (#0B132B) + símbolo blanco
 * @param {string} className
 */
export function LogoBadge({ size = 40, inverted = false, dark: darkMode = false, className = '' }) {
  const radius = Math.round(size * 0.22);   // ~22% del size = radio coherente con el logo
  const symbolSize = Math.round(size * 0.6);

  let bg, symbolColor;
  if (darkMode) {
    bg = '#0B132B';
    symbolColor = 'white';
  } else if (inverted) {
    bg = 'white';
    symbolColor = 'var(--brand-hex, #00B8D9)';
  } else {
    bg = 'var(--brand-hex, #00B8D9)';
    symbolColor = 'white';
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
      }}
      aria-hidden="true"
    >
      <LogoSymbol size={symbolSize} color={symbolColor} />
    </span>
  );
}

// ── LogoFull ──────────────────────────────────────────────────────────────────
/**
 * Símbolo + wordmark "lokal" en horizontal.
 * El color del texto sigue al color del símbolo (ambos usan currentColor
 * por defecto, así que `className="text-brand"` los pinta a los dos).
 *
 * @param {number} size   — tamaño del símbolo (el texto escala proporcionalmente)
 * @param {string} color  — color inline para símbolo y texto
 * @param {boolean} light — wordmark en blanco (para fondos oscuros sin pasar color)
 * @param {string} className
 */
export function LogoFull({ size = 28, color, light = false, className = '' }) {
  const textColor = color || (light ? 'white' : undefined);
  const fontSize  = Math.round(size * 0.9);
  const gap       = Math.round(size * 0.28);

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap }}
      aria-label="Lokal"
    >
      <LogoSymbol size={size} color={textColor} />
      <span
        style={{
          fontSize,
          fontWeight: 800,
          letterSpacing: '0.01em',
          lineHeight: 1,
          color: textColor || 'currentColor',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        lokal
      </span>
    </span>
  );
}

// ── LogoWordmark ──────────────────────────────────────────────────────────────
/**
 * Solo el texto "lokal" con la tipografía de marca.
 */
export function LogoWordmark({ size = 24, color, className = '' }) {
  return (
    <span
      className={className}
      style={{
        fontSize: size,
        fontWeight: 800,
        letterSpacing: '0.01em',
        lineHeight: 1,
        color: color || 'currentColor',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      lokal
    </span>
  );
}

// ── LogoMono ──────────────────────────────────────────────────────────────────
/**
 * Versión monocromática del logo completo.
 * Ideal para footers, watermarks, sobre imágenes.
 * Por defecto: blanco sobre transparente. Pasar color="black" para versión negra.
 */
export function LogoMono({ size = 24, color = 'white', className = '' }) {
  return <LogoFull size={size} color={color} className={className} />;
}

// ── KtrlMark ──────────────────────────────────────────────────────────────────
/**
 * Logo del estudio creador (KTRL / Katriel Martínez).
 * Usar solo en footer y créditos.
 */
export function KtrlMark({ className = '', style }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 1629.2 404.35"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-label="KTRL"
    >
      <path d="M838.15,41.28v74.06c0,20.45-16.58,37.03-37.03,37.03h-55.55c-10.23,0-18.52,8.29-18.52,18.52v191.9c0,20.6-16.7,37.3-37.3,37.3h-73.53c-20.6,0-37.3-16.7-37.3-37.3v-191.86c0-10.24-8.31-18.54-18.56-18.52l-55.43.15c-20.48.04-37.11-16.55-37.11-37.03V41.28c0-20.45,16.58-37.03,37.03-37.03h296.26c20.45,0,37.03,16.58,37.03,37.03Z"/>
      <path d="M1629.2,289.56v74.06c0,20.45-16.58,37.03-37.03,37.03h-222.19c-20.45,0-37.03-16.58-37.03-37.03V41.84c0-20.45,16.58-37.03,37.03-37.03h74.06c20.45,0,37.03,16.58,37.03,37.03v192.17c0,10.23,8.29,18.52,18.52,18.52h92.58c20.45,0,37.03,16.58,37.03,37.03Z"/>
      <path d="M1098.1,152.38h-56.26c-10.23,0-18.52,8.29-18.52,18.52v191.97c0,20.45-16.58,37.03-37.03,37.03h-74.08c-20.45,0-37.03-16.58-37.03-37.03V78.31c0-40.9,33.16-74.06,74.06-74.06h247.71c40.9,0,74.06,33.16,74.06,74.06v100.72c0,9.82-3.9,19.24-10.85,26.19l-52.61,52.6c-6.78,6.72-8.03,18.46-.12,26.36l52.77,52.75c23.34,23.34,6.8,63.25-26.21,63.22l-95.66-.07c-9.82,0-19.24-3.9-26.19-10.85l-40.95-40.95c-6.94-6.94-10.85-16.36-10.85-26.19v-71.94c0-9.82,3.9-19.24,10.85-26.19l39.99-39.99c11.66-11.66,3.4-31.61-13.09-31.61Z"/>
      <path d="M83.04,14.06L10.79,86.32C3.88,93.22,0,102.59,0,112.36v179.62c0,9.77,3.88,19.14,10.79,26.05l72.26,72.26c23.21,23.21,62.88,6.77,62.88-26.05V40.11c0-32.82-39.68-49.25-62.88-26.05Z"/>
      <path d="M416.11,340.58l-52.97,52.97c-14.39,14.39-37.71,14.39-52.09,0l-117.4-117.4c-6.97-6.97-10.88-16.41-10.88-26.27v-95.43c0-9.85,3.91-19.3,10.88-26.27L311.04,10.79c14.39-14.39,37.71-14.39,52.09,0l52.97,52.97c14.39,14.39,14.39,37.71,0,52.09l-73.29,73.29c-7.19,7.19-7.19,18.85,0,26.05l73.29,73.29c14.39,14.39,14.39,37.71,0,52.09Z"/>
    </svg>
  );
}

// ── OG / Social Preview helper ────────────────────────────────────────────────
/**
 * Datos para meta tags OG. Usar en index.html o al generar la imagen.
 *
 * Para generar la imagen OG:
 *   - Fondo: #0F172A (dark) o #F8FAFC (light)
 *   - Logo centrado: LogoFull size=80, color blanco
 *   - Tagline debajo: "Descubrí, Comprá, Conectá." color brand
 *   - Dimensiones: 1200×630px
 */
export const OG_META = {
  title:       'Lokal — Todo cerca.',
  description: 'Publicás lo que buscás. Las tiendas de tu ciudad responden.',
  image:       '/og.png',      // generá con las specs de arriba y poné en /public
  themeColor:  '#00B8D9',
};
