import { sync } from 'fast-glob';

const content = sync(
  ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
  { ignore: ['**/node_modules/**'] }
);

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content,
  theme: {
    extend: {
      borderRadius: {
        '3xl': '1rem',
      },

      /* ════════════════════════════════════════════════════════════════════
         DESIGN TOKENS — expone todas las CSS variables como clases Tailwind.
         Cambiar --brand-* en index.css actualiza automáticamente estas clases.

         Uso:
           bg-brand            hover:bg-brand-light      active:bg-brand-dark
           text-brand          bg-brand-muted            text-brand-fg
           bg-brand/10         border-brand/30           (opacidad arbitraria)

           bg-ok / bg-danger / bg-warn / bg-info / bg-new / bg-pending / bg-urgent
           (mismo patrón: -light -dark -muted -fg para cada semántico)
         ════════════════════════════════════════════════════════════════════ */
      colors: {
        /* ── Superficies (adaptan al tema automáticamente) ──
           surface/surface-dim: para gradientes (from-surface, etc.), formato "R G B".
           surface-card/surface-card-2: superficie sólida de card/input — MISMOS
           tokens que consume commerce-modern vía deriveColorPalette(). Reemplazan
           bg-white/dark:bg-slate-900 en código nuevo: bg-surface-card en vez de
           bg-white dark:bg-slate-900, un solo nombre que ya cambia con el tema. */
        surface:     'rgb(var(--surface)     / <alpha-value>)',
        'surface-dim': 'rgb(var(--surface-dim) / <alpha-value>)',
        'surface-card':   'rgb(var(--surface-solid-rgb)   / <alpha-value>)',
        'surface-card-2': 'rgb(var(--surface-solid-2-rgb) / <alpha-value>)',

        /* ── Texto (adapta al tema automáticamente) — reemplaza text-slate-900/
           dark:text-white y text-slate-500/dark:text-slate-400 por un solo nombre.
           rgb(var / <alpha-value>) en vez de var() plano para soportar
           modificadores de opacidad (text-ink/50, bg-surface-card/80, etc.) */
        ink:      'rgb(var(--text-primary-rgb)   / <alpha-value>)',
        'ink-dim':'rgb(var(--text-secondary-rgb) / <alpha-value>)',


        /* ── Primario de marca ── */
        brand: {
          DEFAULT: 'rgb(var(--brand)         / <alpha-value>)',
          light:   'rgb(var(--brand-light)   / <alpha-value>)',
          dark:    'rgb(var(--brand-dark)     / <alpha-value>)',
          muted:   'rgb(var(--brand-muted)   / <alpha-value>)',
          fg:      'rgb(var(--brand-fg)       / <alpha-value>)',
        },
        /* Alias legacy — mantiene compatibilidad con código existente (bg-primary) */
        primary: {
          DEFAULT: 'rgb(var(--brand)         / <alpha-value>)',
          hover:   'rgb(var(--brand-light)   / <alpha-value>)',
          muted:   'rgb(var(--brand-muted)   / <alpha-value>)',
          fg:      'rgb(var(--brand-fg)       / <alpha-value>)',
        },

        /* ── Acento secundario de marca (amarillo — badges de descuento, precios destacados) ── */
        accent: {
          DEFAULT: 'rgb(var(--accent)         / <alpha-value>)',
          light:   'rgb(var(--accent-light)   / <alpha-value>)',
          dark:    'rgb(var(--accent-dark)     / <alpha-value>)',
          muted:   'rgb(var(--accent-muted)   / <alpha-value>)',
        },

        /* ── Semánticos ── */
        ok: {
          DEFAULT: 'rgb(var(--ok)            / <alpha-value>)',
          light:   'rgb(var(--ok-light)      / <alpha-value>)',
          dark:    'rgb(var(--ok-dark)        / <alpha-value>)',
          muted:   'rgb(var(--ok-muted)      / <alpha-value>)',
          fg:      'rgb(var(--ok-fg)          / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger)        / <alpha-value>)',
          light:   'rgb(var(--danger-light)  / <alpha-value>)',
          dark:    'rgb(var(--danger-dark)    / <alpha-value>)',
          muted:   'rgb(var(--danger-muted)  / <alpha-value>)',
          fg:      'rgb(var(--danger-fg)      / <alpha-value>)',
        },
        warn: {
          DEFAULT: 'rgb(var(--warn)          / <alpha-value>)',
          light:   'rgb(var(--warn-light)    / <alpha-value>)',
          dark:    'rgb(var(--warn-dark)      / <alpha-value>)',
          muted:   'rgb(var(--warn-muted)    / <alpha-value>)',
          fg:      'rgb(var(--warn-fg)        / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--info)          / <alpha-value>)',
          light:   'rgb(var(--info-light)    / <alpha-value>)',
          dark:    'rgb(var(--info-dark)      / <alpha-value>)',
          muted:   'rgb(var(--info-muted)    / <alpha-value>)',
          fg:      'rgb(var(--info-fg)        / <alpha-value>)',
        },
        new: {
          DEFAULT: 'rgb(var(--new)           / <alpha-value>)',
          light:   'rgb(var(--new-light)     / <alpha-value>)',
          dark:    'rgb(var(--new-dark)       / <alpha-value>)',
          muted:   'rgb(var(--new-muted)     / <alpha-value>)',
          fg:      'rgb(var(--new-fg)         / <alpha-value>)',
        },
        urgent: {
          DEFAULT: 'rgb(var(--urgent)        / <alpha-value>)',
          light:   'rgb(var(--urgent-light)  / <alpha-value>)',
          dark:    'rgb(var(--urgent-dark)    / <alpha-value>)',
          muted:   'rgb(var(--urgent-muted)  / <alpha-value>)',
          fg:      'rgb(var(--urgent-fg)      / <alpha-value>)',
        },
        pending: {
          DEFAULT: 'rgb(var(--pending)       / <alpha-value>)',
          light:   'rgb(var(--pending-light) / <alpha-value>)',
          dark:    'rgb(var(--pending-dark)   / <alpha-value>)',
          muted:   'rgb(var(--pending-muted) / <alpha-value>)',
          fg:      'rgb(var(--pending-fg)     / <alpha-value>)',
        },
      },

      animation: {
        'fade-in':      'fade-in-tailwind 0.4s ease-out both',
        'bounce-slow':  'bounce-slow 3s ease-in-out infinite',
        'float':        'float 4s ease-in-out infinite',
        'dropdown-in':  'dropdown-in 0.14s ease-out both',
      },
      keyframes: {
        'fade-in-tailwind': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'dropdown-in': {
          '0%':   { opacity: '0', transform: 'translateY(-6px) scaleY(0.95)', transformOrigin: 'top' },
          '100%': { opacity: '1', transform: 'translateY(0) scaleY(1)',       transformOrigin: 'top' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
