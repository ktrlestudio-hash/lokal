/**
 * LokalLoader — logo animado + splash de carga, ÚNICA fuente de verdad.
 * Antes existían 3 copias casi idénticas de este mismo SVG/splash (Root.jsx,
 * TiendaPublica.jsx, OfertaPublica.jsx) — mismo diseño, nombres de keyframes
 * distintos (lk-/tp-/op-) por archivo. Consolidado acá para que los 3 puntos
 * de la app que muestran "cargando" usen exactamente el mismo componente,
 * sin margen para que diverjan con el tiempo.
 *
 * Dos variantes:
 *   - SplashScreenFull: logo + wordmark "lokal" + "creado por KTRL" — SOLO
 *     para una carga real de página (F5 / primera visita en ventana de 20min,
 *     ver IS_FIRST_LOAD en Root.jsx).
 *   - InlineLoader: solo el ícono sobre el mismo fondo — para esperas dentro
 *     de una sesión SPA ya abierta (navegación interna, refetch, cambio de
 *     ruta sin recarga). Mismo fondo/glow que el splash completo a propósito:
 *     aunque React desmonte un componente y monte otro (splash de salida de
 *     una pantalla + loader de entrada de la siguiente), al ser pixel-a-pixel
 *     el mismo diseño no hay parpadeo perceptible en la transición.
 */
import React from 'react';
import { KtrlMark } from './Brand';

export function LogoLoader({ size }) {
  const cx = 40.72, cy = 40.65, r = 11.23;
  // Sin size explícito, escala con el viewport: 72px fijos se leían chicos
  // en una pantalla de escritorio ancha, donde el splash es la única cosa en
  // pantalla y tiene todo el espacio para respirar. clamp() en vez de un
  // valor fijo mayor: en mobile el tamaño de antes seguía siendo correcto.
  const tamano = size ?? 'clamp(72px, 9vw, 120px)';
  return (
    <svg viewBox="0 0 81.18 81.44" width={tamano} height={tamano} xmlns="http://www.w3.org/2000/svg" aria-label="Cargando">
      <style>{`
        @keyframes lk-draw { from { stroke-dashoffset: 275; } to { stroke-dashoffset: 0; } }
        @keyframes lk-dot-in {
          0% { transform: scale(0); opacity: 0; }
          55% { transform: scale(1.3); opacity: 1; }
          75% { transform: scale(0.88); }
          90% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes lk-pulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.10); opacity: 0.7; }
        }
        .lk-ring {
          fill: none; stroke: var(--brand-hex, #00B8D9); stroke-width: 7.66;
          stroke-linecap: round; stroke-dasharray: 275; stroke-dashoffset: 275;
          animation: lk-draw 0.85s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
        }
        .lk-dot {
          fill: var(--brand-hex, #00B8D9); transform-origin: ${cx}px ${cy}px;
          animation: lk-dot-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.7s both,
                     lk-pulse 2.2s ease-in-out 1.35s infinite;
        }
      `}</style>
      <rect className="lk-ring" x="3.83" y="3.83" width="73.52" height="73.78" rx="14.83" />
      <circle className="lk-dot" cx={cx} cy={cy} r={r} />
    </svg>
  );
}

// Fondo/glow del splash — clases dark: en vez de un color fijo: la clase
// 'dark' en <html> ya la aplica theme-init.js ANTES de que React monte
// (según el tema guardado en localStorage), así que no hay parpadeo entre
// "splash siempre oscuro" y "primer render ya en el tema correcto". El
// glow (radial-gradient celeste) se mantiene igual en ambos temas — es el
// acento de marca, no algo que deba invertirse; lo que cambia es el fondo
// y el color de texto detrás de él.
const SPLASH_BG = 'bg-white dark:bg-[#040a14]';

export function SplashScreenFull() {
  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden ${SPLASH_BG}`}>
      <style>{`
        @keyframes lk-brand-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lk-mark-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lk-glow-pulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.08); } }
      `}</style>
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: '65%', background: 'radial-gradient(ellipse 75% 55% at 50% 0%, rgba(0,184,217,0.22), transparent)', animation: 'lk-glow-pulse 3s ease-in-out 1.2s infinite' }} />
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '40%', background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,184,217,0.07), transparent)' }} />
      <LogoLoader />
      {/* fontSize con clamp: mismo criterio que el logo — en escritorio el
          splash ocupa toda la pantalla y el texto de 34px fijo quedaba
          chico comparado con el espacio disponible. */}
      <div className="text-ink" style={{ animation: 'lk-brand-in 0.45s ease 1.0s both', marginTop: 18 }}>
        <span style={{ fontSize: 'clamp(34px, 3.2vw, 46px)', fontWeight: 800, letterSpacing: '0.01em', fontFamily: "'Inter', system-ui, sans-serif" }}>lokal</span>
      </div>
      <div className="absolute bottom-10 flex items-center gap-1.5 text-ink-dim" style={{ animation: 'lk-mark-in 0.5s ease 1.2s both', opacity: 0 }}>
        <span style={{ fontSize: 'clamp(10px, 0.9vw, 13px)', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>creado por</span>
        <KtrlMark className="text-current" style={{ height: 'clamp(12px, 1.1vw, 16px)', width: 'auto', opacity: 0.35 }} />
      </div>
    </div>
  );
}

// Mismo fondo/glow que SplashScreenFull (solo sin wordmark/KTRL) — para que
// la transición entre "splash completo de una pantalla" y "loader liviano
// de otra" sea visualmente continua, sin salto de diseño perceptible.
export function InlineLoader() {
  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden ${SPLASH_BG}`}>
      <style>{`@keyframes lk-glow-pulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.08); } }`}</style>
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: '65%', background: 'radial-gradient(ellipse 75% 55% at 50% 0%, rgba(0,184,217,0.22), transparent)', animation: 'lk-glow-pulse 3s ease-in-out 1.2s infinite' }} />
      <LogoLoader />
    </div>
  );
}
