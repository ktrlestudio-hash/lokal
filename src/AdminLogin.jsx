// Login mínimo para /admin (backoffice del dueño de la tienda mono-negocio).
// Reemplaza al viejo AuthScreen.jsx (landing/pricing multi-tienda, borrado en
// el recorte a mono-tienda, ver CLAUDE.md) — acá solo hace falta un botón de
// "Iniciar sesión con Google" para el único dueño que administra la tienda.
import React, { useState } from 'react';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import LoginCard from './components/LoginCard.jsx';
import { LogoFull, KtrlMark } from './Brand';

export default function AdminLogin({ isDark, toggleTheme, onVolver }) {
  const [backTooltip, setBackTooltip] = useState(false);

  // Volver al sitio público. Si no viene onVolver, cae a la home ('/').
  const handleBack = onVolver || (() => { window.location.href = '/'; });
  // Tooltip custom para el toggle de tema — mismo lenguaje visual que el
  // de la sidebar de escritorio (StoreApp.jsx, pill oscura con flechita),
  // en vez del title nativo del navegador (feo, con delay/estilo fuera de
  // nuestro control).
  const [themeTooltip, setThemeTooltip] = useState(false);

  // Columna, no centrado absoluto: así el footer se ancla abajo del viewport
  // (footer real, no un pie pegado a la card) y la card queda centrada en el
  // espacio que sobra.
  return (
    // min-h-[100dvh], no min-h-screen: en mobile, 100vh no descuenta la UI
    // dinámica del navegador (barra de direcciones que aparece/desaparece
    // al scrollear) — con poca info en pantalla, esa diferencia de alto
    // entre 100vh "de más" y el viewport real visible generaba scroll y un
    // rebote visual ("baile") que no debería existir acá. Mismo patrón que
    // ya usa HomeGlobal.jsx para el mismo problema.
    <div className="lok-app-surface relative min-h-[100dvh] flex flex-col px-6 overflow-hidden" style={{ background: isDark ? '#040a14' : 'var(--surface-solid, #fff)' }}>
      {/* Ambiente de luz de marca — mismo lenguaje que el splash de carga
          (AdminLoader): glow radial superior que pulsa + reflejo inferior
          tenue. Usa el color de marca (--brand) en vez del turquesa fijo del
          splash, y opacidades bajas para no competir con la card. */}
      <style>{`
        @keyframes lk-login-glow { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.06); } }
        /* LogoFull recibe su tamaño como número en px (atributo width/height
           del SVG), no un valor CSS — no admite clamp() directo. Se escala
           por fuera con transform en vez de tocar el componente. El
           contenedor ya lo centra con justify-center: con transform-origin
           en el centro (no en un borde), el logo crece parejo hacia los
           dos lados sin correrse de ese centro ya establecido. */
        @media (min-width: 900px) {
          .lok-login-logo { transform: scale(1.15); transform-origin: center; }
        }
        @media (min-width: 1400px) {
          .lok-login-logo { transform: scale(1.3); }
        }
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

      {/* flex-1 + centrado: la card se centra en el alto que queda libre
          entre el borde superior y el footer anclado abajo. */}
      <div className="relative flex-1 w-full flex items-center justify-center">
      {/* max-width con clamp, no max-w-sm fijo (384px): en una pantalla de
          1920px la card ocupaba solo 20% del ancho, mismo problema que
          tenía el splash de carga antes de escalarlo. De 384 a 460px según
          el viewport — sigue siendo una card angosta (es un formulario de
          un botón), pero con más presencia en pantallas grandes. */}
      <div className="w-full" style={{ maxWidth: 'clamp(384px, 28vw, 460px)' }}>
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
          className="relative rounded-3xl shadow-2xl text-center"
          style={{
            // Padding con clamp, igual criterio que el ancho: una card más
            // grande necesita más aire interno, no solo más espacio vacío
            // alrededor.
            padding: 'clamp(24px, 3vw, 36px) clamp(24px, 2.6vw, 32px)',
            background: isDark
              ? 'linear-gradient(160deg, rgba(255,255,255,.07), rgb(var(--brand, 0 184 217) / 0.06))'
              : 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.06), rgb(var(--brand, 0 184 217) / 0.015)), var(--surface-solid, #fff)',
            border: '1px solid rgb(var(--brand, 0 184 217) / 0.18)',
            backdropFilter: isDark ? 'blur(24px)' : undefined,
            WebkitBackdropFilter: isDark ? 'blur(24px)' : undefined,
          }}
        >
          {/* Retroceso + logo + toggle de tema en UNA fila — antes el logo
              vivía en su propio bloque más abajo (mb-6 flex justify-center)
              mientras los botones flotaban absolute arriba, así que el
              logo quedaba desalineado del eje vertical de los botones.
              Ahora los tres comparten flex items-center: mismo centro Y. */}
          <div className="flex items-center justify-between mb-8">
            {/* Retroceso — vuelve al sitio público. Mismo lenguaje de
                botón-ícono (cuadrado con borde redondeado) que el resto de
                la interfaz, y mismo patrón de color que el toggle de tema
                de al lado: bg-brand/[0.08] siempre presente. */}
            <div className="relative">
              <button
                onClick={handleBack}
                onMouseEnter={() => setBackTooltip(true)}
                onMouseLeave={() => setBackTooltip(false)}
                aria-label="Volver al sitio"
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-brand/[0.08] hover:bg-brand/[0.16] text-ink-dim hover:text-brand transition-colors active:scale-90 border border-transparent dark:border-brand/[0.18]"
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
            <LogoFull size={28} className="lok-login-logo" />
            {/* Toggle de tema. Tooltip custom (no title nativo) al hover.
                Mismo lenguaje de color que el toggle del footer de
                HomeGlobal.jsx (bg-brand/[0.08], borde de marca en dark) —
                antes era gris genérico en light (bg-surface-card-2, no el
                celeste de marca que sí usan los botones de "Legal") y
                blanco translúcido en dark (sin relación con --brand), dos
                criterios distintos para el mismo tipo de control en dos
                pantallas de la misma app. */}
            <div className="relative">
              <button
                onClick={toggleTheme}
                onMouseEnter={() => setThemeTooltip(true)}
                onMouseLeave={() => setThemeTooltip(false)}
                aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-brand/[0.08] hover:bg-brand/[0.16] text-ink-dim hover:text-brand transition-colors active:scale-90 border border-transparent dark:border-brand/[0.18]"
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
          </div>
          {/* Contenido de la card (ilustración/título/botón de Google/legal)
              extraído a LoginCard.jsx — mismo diseño que ahora también usa
              LoginSheet.jsx desde HomeGlobal, en vez de tener dos cards
              distintas para el mismo login. whoami=false: acá SIEMPRE es
              login de dueño (es la URL /admin), Root.jsx sigue resolviendo
              qué pasa después vía onAuthStateChanged, sin que esta card
              necesite llamar a /usuarios?whoami=1 ni manejar el paso de
              elegir rol. */}
          <LoginCard isDark={isDark} whoami={false} />
        </div>

        {/* KTRL queda pegado a la card, no en el footer: es la firma de
            autoría del producto, y acá el "producto" es la card de acceso.
            En el footer de abajo van los legales, que son del sitio. */}
        <div className="mt-6 flex items-center justify-center">
          <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
            className="lok-tap inline-flex items-center gap-1.5 text-ink-dim/50 hover:text-ink-dim/80 transition-colors">
            <span className="text-[10px] font-semibold">Creado por</span>
            <KtrlMark style={{ height: 11, color: 'currentColor' }} />
          </a>
        </div>
      </div>
      </div>

      {/* Footer real, anclado abajo del viewport — sin logos (el de LOKAL ya
          está en la card y el de KTRL justo arriba), sólo las dos filas que
          faltaban: legales y copyright. Los legales tienen que estar a mano
          porque al entrar se aceptan los términos. */}
      <footer className="relative z-10 shrink-0 py-6 flex flex-col items-center gap-2">
        <nav className="flex items-center gap-4 text-[11px] font-semibold" style={{ color: 'var(--text-secondary, #999)' }}>
          <a href="/terminos-y-condiciones" className="lok-tap lok-link-btn hover:text-brand">Términos</a>
          <a href="/politica-de-privacidad" className="lok-tap lok-link-btn hover:text-brand">Privacidad</a>
          <a href="/condiciones-para-comercios" className="lok-tap lok-link-btn hover:text-brand">Comercios</a>
        </nav>
        <p className="text-[10px]" style={{ color: 'var(--text-secondary, #999)' }}>
          © {new Date().getFullYear()} LOKAL. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
