// Login mínimo para /admin (backoffice del dueño de la tienda mono-negocio).
// Reemplaza al viejo AuthScreen.jsx (landing/pricing multi-tienda, borrado en
// el recorte a mono-tienda, ver CLAUDE.md) — acá solo hace falta un botón de
// "Iniciar sesión con Google" para el único dueño que administra la tienda.
import React, { useState } from 'react';
import { Loader2, AlertCircle, Sun, Moon, ArrowLeft } from 'lucide-react';
import { signInWithGoogle } from './firebase';
import { LogoFull, KtrlMark } from './Brand';

// Logo oficial de Google (mismo SVG que components/LoginBottomSheet.jsx) —
// botón neutro (fondo blanco/oscuro, no color de marca) con el ícono
// multicolor real, patrón estándar de "Continuar con Google" que cualquier
// login profesional actual usa. Antes era un botón bg-brand genérico sin
// el logo, que no se leía como una acción de Google real.
const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AdminLogin({ isDark, toggleTheme, onVolver }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [backTooltip, setBackTooltip] = useState(false);

  // Volver al sitio público. Si no viene onVolver, cae a la home ('/').
  const handleBack = onVolver || (() => { window.location.href = '/'; });
  // Tooltip custom para el toggle de tema — mismo lenguaje visual que el
  // de la sidebar de escritorio (StoreApp.jsx, pill oscura con flechita),
  // en vez del title nativo del navegador (feo, con delay/estilo fuera de
  // nuestro control).
  const [themeTooltip, setThemeTooltip] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Si usó redirect (mobile), la página navega y este componente se
      // desmonta; onAuthStateChanged en Root.jsx toma el control al volver.
    } catch (err) {
      const ignored = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      if (!ignored.includes(err.code)) {
        setError(
          err.code === 'auth/unauthorized-domain'
            ? 'Dominio no autorizado. Agregá este dominio en Firebase Console.'
            : (err.message || 'No se pudo iniciar sesión')
        );
      }
      setLoading(false);
    }
  };

  return (
    <div className="lok-app-surface relative min-h-screen flex items-center justify-center px-6 overflow-hidden" style={{ background: isDark ? '#040a14' : 'var(--surface-solid, #fff)' }}>
      {/* Ambiente de luz de marca — mismo lenguaje que el splash de carga
          (AdminLoader): glow radial superior que pulsa + reflejo inferior
          tenue. Usa el color de marca (--brand) en vez del turquesa fijo del
          splash, y opacidades bajas para no competir con la card. */}
      <style>{`
        @keyframes lk-login-glow { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.06); } }
      `}</style>
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
        height: '60%',
        background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.16), transparent)',
        animation: 'lk-login-glow 3.4s ease-in-out infinite',
      }} />
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{
        height: '40%',
        background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgb(var(--brand, 0 184 217) / 0.06), transparent)',
      }} />

      <div className="relative w-full max-w-sm">
        {/* Mismo tratamiento que las cards de la landing (CARD_TINTED en
            LandingScreen.jsx): una pizca de turquesa de marca en el fondo y
            en el borde, en vez de gris neutro. Los tokens globales son
            "cero azul" a propósito (ver index.css §4), correcto para el
            panel pero apagado acá.

            En dark se suma al glass que ya había: blanco a baja opacidad +
            blur, que deja pasar el glow del fondo a través en vez de
            imponer un color propio encima. El turquesa va por debajo del
            blur, así tiñe sin tapar. */}
        <div
          className="relative rounded-3xl shadow-2xl px-6 py-8 text-center"
          style={{
            background: isDark
              ? 'linear-gradient(160deg, rgba(255,255,255,.07), rgb(var(--brand, 0 184 217) / 0.06))'
              : 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.06), rgb(var(--brand, 0 184 217) / 0.015)), var(--surface-solid, #fff)',
            border: '1px solid rgb(var(--brand, 0 184 217) / 0.18)',
            backdropFilter: isDark ? 'blur(24px)' : undefined,
            WebkitBackdropFilter: isDark ? 'blur(24px)' : undefined,
          }}
        >
          {/* Retroceso — esquina izquierda, espejo del toggle de tema.
              Vuelve al sitio público. Mismo lenguaje de botón-ícono
              (cuadrado con borde redondeado) que el resto de la interfaz. */}
          <div className="absolute top-4 left-4">
            <button
              onClick={handleBack}
              onMouseEnter={() => setBackTooltip(true)}
              onMouseLeave={() => setBackTooltip(false)}
              aria-label="Volver al sitio"
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-surface-card-2 hover:bg-brand/10 hover:text-brand text-ink-dim transition-colors active:scale-90"
              style={isDark ? { background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : undefined}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {backTooltip && (
              <div className="absolute top-full left-0 mt-2 pointer-events-none z-10">
                <div className="relative bg-ink dark:bg-surface-card-2 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap">
                  <span className="absolute bottom-full left-3 w-0 h-0 border-x-[5px] border-x-transparent border-b-[6px] border-b-slate-900 dark:border-b-slate-700" />
                  Volver al sitio
                </div>
              </div>
            )}
          </div>
          {/* Toggle de tema — esquina flotante, no en el footer: ahí
              obligaba a compartir línea con "Creado por KTRL" y lo
              descentraba. Tooltip custom (no title nativo) al hover.
              Cuadrado con borde redondeado (rounded-xl), misma filosofía
              de botón-ícono que toda la interfaz. */}
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleTheme}
              onMouseEnter={() => setThemeTooltip(true)}
              onMouseLeave={() => setThemeTooltip(false)}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-surface-card-2 hover:bg-brand/10 hover:text-brand text-ink-dim transition-colors active:scale-90"
              style={isDark ? { background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : undefined}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {themeTooltip && (
              <div className="absolute top-full right-0 mt-2 pointer-events-none z-10">
                <div className="relative bg-ink dark:bg-surface-card-2 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap">
                  <span className="absolute bottom-full right-3 w-0 h-0 border-x-[5px] border-x-transparent border-b-[6px] border-b-slate-900 dark:border-b-slate-700" />
                  {isDark ? 'Modo claro' : 'Modo oscuro'}
                </div>
              </div>
            )}
          </div>
          <div className="mb-6 flex justify-center">
            <LogoFull size={28} />
          </div>
          <h1 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary, #fff)' }}>
            Panel de tienda
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary, #999)' }}>
            Iniciá sesión con tu cuenta de Google para administrar tu tienda.
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* text-[#18181b] fijo en dark (no dark:text-ink): text-ink
              resuelve a --text-primary-rgb, que en dark mode es casi
              blanco (242 242 242) — sobre bg-white quedaba texto blanco
              sobre fondo blanco, invisible. Acá el fondo se invierte
              respecto al tema (blanco en dark, oscuro en light), así que
              el texto necesita su propio color fijo por lado, no el token
              de tema que asume "texto sobre superficie normal". */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-ink dark:bg-white hover:bg-ink/90 dark:hover:bg-white/90 text-white dark:text-[#18181b] font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon size={20} />}
            {loading ? 'Entrando...' : 'Continuar con Google'}
          </button>

          {/* Texto legal — dentro de la card, debajo del botón (antes
              flotaba afuera pegado al footer de marca). */}
          <p className="text-[11px] mt-4" style={{ color: 'var(--text-secondary, #999)' }}>
            Al continuar, aceptás los <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand transition-colors">términos y condiciones</a> de LOKAL.
          </p>
        </div>

        {/* Footer — solo créditos KTRL, centrado (toggle de tema se movió
            a la esquina de la card, logo LOKAL y link "¿Tenés un negocio?"
            sacados por redundantes/no aplicables acá). */}
        <div className="mt-6 flex items-center justify-center">
          <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-ink-dim/50 hover:text-ink-dim/80 transition-colors">
            <span className="text-[10px] font-semibold">Creado por</span>
            <KtrlMark style={{ height: 11, color: 'currentColor' }} />
          </a>
        </div>
      </div>
    </div>
  );
}
