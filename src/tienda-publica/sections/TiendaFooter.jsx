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
export function TiendaFooter({ dark, toggleDark, tiendaId }) {
  return (
    <footer id="tp-footer" style={{
      borderTop: `1px solid ${dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}`,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 14,
      background: dark ? '#0c0c0c' : '#f0f0f0',
      flexShrink: 0,
    }}>
      {/* Zona IZQUIERDA — logo LOKAL + invitación a crear tienda A SU DERECHA
          (2 renglones), como un solo bloque de marca en fila. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Logo Lokal — contraste subido (era #a3a3a3 en light / .35 alpha en
            dark, muy débil sobre el fondo del footer). Hover/press: son <a>,
            no <button>, así que no heredan el scale(0.93) global de
            index.css (button:not(.no-press):active) — se replica a mano,
            mismo valor que el resto de la app. */}
        <style>{`
          .tp-footer-logo { transition: opacity .15s ease, transform .12s cubic-bezier(0.34, 1.56, 0.64, 1); }
          @media (hover: hover) { .tp-footer-logo:hover { opacity: .75; } }
          .tp-footer-logo:active { transform: scale(0.93); transition: transform .06s ease; }
          @media (hover: hover) { .tp-footer-cta:hover { color: var(--tp-primary) !important; } }
          .tp-footer-cta:active { color: var(--tp-primary) !important; opacity: .8; }
        `}</style>
        <a href="https://lokalbovril.netlify.app" target="_blank" rel="noopener noreferrer" className="tp-footer-logo"
          onClick={() => trackClick(tiendaId, 'logo-lokal')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none', color: dark ? 'rgba(255,255,255,.65)' : '#6b6b6b', flexShrink: 0 }}>
          <LogoSymbol size={18} color="currentColor" />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.01em', fontFamily: "'Inter', system-ui, sans-serif" }}>lokal</span>
        </a>

        {/* Separador vertical sutil entre el logo y el CTA */}
        <span style={{ width: 1, alignSelf: 'stretch', background: dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)' }} />

        {/* Invitación a registrar tienda — 2 renglones, a la DERECHA del logo */}
        <a href="/admin" className="tp-footer-cta" onClick={() => trackClick(tiendaId, 'crear-tienda')} style={{
          textAlign: 'left', fontSize: 11, fontWeight: 600, textDecoration: 'none', lineHeight: 1.35,
          color: dark ? 'rgba(255,255,255,.4)' : '#9a9a9a',
          fontFamily: "'Inter', system-ui, sans-serif",
          transition: 'color .15s ease',
        }}>
          ¿Tenés un negocio?<br />Creá tu tienda gratis en LOKAL
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Toggle claro/oscuro — el MISMO modo de toda la app cuando se
            navega logueado (afecta cualquier pantalla, no solo esta
            tienda); solo queda aislado a esta visita en el caso
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
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)',
            color: dark ? 'rgba(255,255,255,.5)' : '#6b6b6b',
            transition: 'background-color .15s ease, color .15s ease',
          }}>
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Creado por KTRL — contraste subido (era .2 alpha en dark /
            #d4d4d4 en light, casi invisible sobre el fondo). Sigue siendo
            más discreto que el logo de LOKAL (jerarquía visual), pero
            legible. Mismo hover/press que el logo de arriba — es <a>, no
            heredaba el scale(0.93) global. */}
        <style>{`
          .tp-footer-ktrl { transition: opacity .15s ease, transform .12s cubic-bezier(0.34, 1.56, 0.64, 1); }
          @media (hover: hover) { .tp-footer-ktrl:hover { opacity: .75; } }
          .tp-footer-ktrl:active { transform: scale(0.93); transition: transform .06s ease; }
        `}</style>
        <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer" className="tp-footer-ktrl"
          onClick={() => trackClick(tiendaId, 'ktrl')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: dark ? 'rgba(255,255,255,.45)' : '#9a9a9a' }}>
          <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif" }}>Creado por</span>
          <KtrlMark style={{ height: 11, color: 'currentColor' }} />
        </a>
      </div>
    </footer>
  );
}
