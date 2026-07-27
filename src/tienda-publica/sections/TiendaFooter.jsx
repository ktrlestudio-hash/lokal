/**
 * TiendaFooter — footer de marca LOKAL, común a toda página de tienda.
 * Vive DENTRO de commerce-modern.jsx (no en TiendaPublicaRenderer como
 * antes) para que el scroll interno del template lo incluya junto con el
 * resto del contenido — así queda completamente visible al llegar al
 * final, en vez de tapado por TiendaNavBar (fixed) sin que nada lo empuje.
 */
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { LogoSymbol, KtrlMark } from '../../Brand.jsx';
import { trackClick } from '../track.js';

// tiendaId opcional — solo para asociar "desde qué tienda" se tocó el logo
// LOKAL/KTRL o "creá tu tienda" (dato de interés interno de LOKAL, no del
// dueño de la tienda: ver plan de analytics, dos audiencias distintas).
export function TiendaFooter({ dark, toggleDark, tiendaId, ctaBannerRef }) {
  return (
    <>
      {/* Franja CTA propia — separada del footer de marca (que abajo queda
          limpio, solo logo/tema/KTRL). Antes vivía metido DENTRO del
          footer, compitiendo en tamaño/color con "Creado por KTRL" — fácil
          de leer como letra chica de pie de página. Fondo TENUE con el
          color de marca (10% de opacidad, no sólido) — se diferencia del
          gris del footer sin resultar publicitario/gritón; el texto en
          color de marca es lo que realmente llama la atención, no un
          bloque de color saturado a todo ancho. */}
      <style>{`
        .tp-footer-banner { transition: background-color .15s ease; }
        @media (hover: hover) { .tp-footer-banner:hover { background: color-mix(in srgb, var(--tp-primary) 16%, transparent) !important; } }
        .tp-footer-banner:active { background: color-mix(in srgb, var(--tp-primary) 20%, transparent) !important; }
      `}</style>
      <a href="/admin" ref={ctaBannerRef} className="tp-footer-banner no-press" onClick={() => trackClick(tiendaId, 'crear-tienda')} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '8px 20px', textAlign: 'center', textDecoration: 'none',
        background: 'color-mix(in srgb, var(--tp-primary) 10%, transparent)', color: 'var(--tp-primary)',
        fontSize: 12, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif",
        flexShrink: 0,
      }}>
        ¿Tenés un negocio? Creá tu tienda gratis →
      </a>
      {/* grid de 3 columnas iguales (no flex+space-between): el toggle de
          tema queda VERDADERAMENTE centrado respecto a todo el footer,
          sin importar cuánto midan logo/KTRL a los costados — con
          space-between, el centro real dependía de que ambos lados
          pesaran igual, que no es el caso acá. justifySelf en cada
          columna decide su alineación individual (start/center/end). */}
      <footer id="tp-footer" style={{
        borderTop: `1px solid ${dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}`,
        padding: '12px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 14,
        background: dark ? '#0c0c0c' : '#f0f0f0',
        flexShrink: 0,
      }}>
      {/* Logo LOKAL — footer ahora solo tiene identidad de marca + utilidades
          (tema, créditos), el CTA de negocio vive en su propia franja arriba. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifySelf: 'start' }}>
        {/* Logo Lokal — contraste subido (era #a3a3a3 en light / .35 alpha en
            dark, muy débil sobre el fondo del footer). Hover/press: son <a>,
            no <button>, así que no heredan el scale(0.93) global de
            index.css (button:not(.no-press):active) — se replica a mano,
            mismo valor que el resto de la app. */}
        <style>{`
          .tp-footer-logo { transition: opacity .15s ease, transform .12s cubic-bezier(0.34, 1.56, 0.64, 1); }
          @media (hover: hover) { .tp-footer-logo:hover { opacity: .75; } }
          .tp-footer-logo:active { transform: scale(0.93); transition: transform .06s ease; }
        `}</style>
        <a href="https://lokalbovril.netlify.app" target="_blank" rel="noopener noreferrer" className="tp-footer-logo"
          onClick={() => trackClick(tiendaId, 'logo-lokal')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none', color: dark ? 'rgba(255,255,255,.65)' : '#6b6b6b', flexShrink: 0 }}>
          <LogoSymbol size={18} color="currentColor" />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.01em', fontFamily: "'Inter', system-ui, sans-serif" }}>lokal</span>
        </a>
      </div>

      {/* Toggle claro/oscuro — columna CENTRAL propia del grid (justifySelf
          center), no agrupado con KTRL como antes. El MISMO modo de toda
          la app cuando se navega logueado (afecta cualquier pantalla, no
          solo esta tienda); solo queda aislado a esta visita en el caso
          standalone del link público sin sesión. Hover literal igual que
          AdminLogin.jsx: bg-surface-card-2 → hover:bg-brand/10
          hover:text-brand (el color CAMBIA en hover, el fondo base se
          REEMPLAZA por el 10% de marca, no se suma). El :active previo
          recoloreaba el ícono de nuevo — el login no hace eso, active
          solo hereda el estado de hover sin una regla de color propia. */}
      <style>{`
        @media (hover: hover) {
          .tp-footer-theme:hover { background: color-mix(in srgb, var(--tp-primary) 10%, transparent) !important; color: var(--tp-primary) !important; }
        }
      `}</style>
      <button
        className="tp-footer-theme"
        onClick={toggleDark}
        aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={dark ? 'Modo claro' : 'Modo oscuro'}
        style={{
          justifySelf: 'center',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)',
          color: dark ? 'rgba(255,255,255,.5)' : '#6b6b6b',
          transition: 'background-color .15s ease, color .15s ease',
        }}>
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Creado por KTRL — columna DERECHA propia del grid. Contraste
          subido (era .2 alpha en dark / #d4d4d4 en light, casi invisible
          sobre el fondo). Sigue siendo más discreto que el logo de LOKAL
          (jerarquía visual), pero legible. Mismo hover/press que el logo
          de arriba — es <a>, no heredaba el scale(0.93) global. */}
      <style>{`
        .tp-footer-ktrl { transition: opacity .15s ease, transform .12s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @media (hover: hover) { .tp-footer-ktrl:hover { opacity: .75; } }
        .tp-footer-ktrl:active { transform: scale(0.93); transition: transform .06s ease; }
      `}</style>
      <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer" className="tp-footer-ktrl"
        onClick={() => trackClick(tiendaId, 'ktrl')}
        style={{ justifySelf: 'end', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: dark ? 'rgba(255,255,255,.45)' : '#9a9a9a' }}>
        <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif" }}>Creado por</span>
        <KtrlMark style={{ height: 11, color: 'currentColor' }} />
      </a>
      </footer>
    </>
  );
}
