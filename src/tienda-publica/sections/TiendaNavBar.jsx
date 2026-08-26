/**
 * TiendaNavBar — bottom-nav propio del modo standalone (/t/:slug público).
 * Mismo lenguaje visual que el BottomNav global de LOKAL (App.jsx), pero con
 * acciones de ESTA tienda aislada en vez de navegación de la plataforma — no
 * existe bottom-nav global fuera de una sesión logueada, así que esta es la
 * única barra.
 *
 * Orden: Mapa · Compartir/Carrito (centro, elevado) · Horarios. El centro es
 * Carrito con contador cuando el módulo Catálogo tiene carrito activo
 * (carritoCount viene definido) — Compartir sigue disponible desde el botón
 * flotante del hero, no se pierde. Sin esto, el centro vuelve a ser
 * Compartir (tiendas sin catálogo, o el propio dueño viendo su tienda).
 */
import React, { useRef } from 'react';
import { MapPin, Clock, Share2, ShoppingCart } from 'lucide-react';
import { RADIUS, FONT } from '../tokens.js';
import { usePublicarAlturaReal } from '../../store/hooks/usePublicarAlturaReal.js';

const F = { fontFamily: FONT.family };

function NavItem({ Icon, label, onClick }) {
  // Sin no-press: hereda el feedback global de press (active:scale(.93)),
  // igual que el BottomNav de plataforma (App.jsx) — resuelve una
  // inconsistencia que ya existía en el proyecto original de comida rápida
  // (el nav de plataforma SÍ tiene feedback, el standalone no).
  return (
    <button className="tp-nav-item" onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px', position: 'relative',
    }}>
      {/* w-10 h-10 rounded-xl (40px / 12px) — literal el contenedor de ícono
          del BottomNav global (App.jsx), con el mismo hover de fondo que
          ese nav (antes acá no había ningún feedback de hover). Sin fondo
          ACTIVO persistente: no hay "pantalla actual" que resaltar, cada
          botón dispara una acción puntual (mapa/horarios), no una
          navegación con estado — pero sí reacciona al pasar el mouse. */}
      <div className="tp-nav-icon" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tp-text-muted)', transition: 'background-color .15s ease, color .15s ease' }}>
        <Icon size={20} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--tp-text-muted)', ...F }}>{label}</span>
    </button>
  );
}

// Ya NO es position:fixed — vive como hermano shrink-0 del contenedor de
// scroll (mismo patrón que el header de HomeScreen.jsx), dentro del root
// h-[100dvh] flex-col del template. Así la scrollbar del navegador termina
// justo antes de esta barra, en vez de seguir hasta el final absoluto del
// documento con la barra flotando (fixed) tapando esa franja sin que nada
// la empuje a la vista.
export function TiendaNavBar({ onAbrirMapa, onAbrirHorarios, onCompartir, onAbrirCarrito, carritoCount }) {
  const conCarrito = onAbrirCarrito != null;
  // Altura real publicada en --tp-nav-h — la usan los sheets/modales que se
  // abren POR ENCIMA de este nav para no taparlo
  // con su position:fixed. Un fixed con inset:0 ignora el flujo normal del
  // documento (donde este nav sí "empuja" el resto del layout como
  // shrink-0), así que necesita este valor medido para saber cuánto restar.
  const navRef = useRef(null);
  usePublicarAlturaReal(navRef, true, '--tp-nav-h');
  return (
    <div ref={navRef} style={{
      flexShrink: 0, zIndex: 250,
      // Mismos valores que BottomNav global (App.jsx): fondo translúcido +
      // blur (no sólido), mismo tono de borde. Antes esta barra era opaca
      // (var(--tp-surface) sin alpha) — se notaba distinta al lado del
      // resto de la app.
      background: 'color-mix(in srgb, var(--tp-surface) 80%, transparent)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--tp-border)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Hover con fondo + color de marca en el ícono — mismo lenguaje que
          BottomNav de StoreApp.jsx (admin): ahí cada ítem reacciona con
          bg-surface-card-2/8 al pasar el mouse, acá no había ningún
          feedback de hover, solo el active:scale al presionar.
          @media(hover:hover): sin esto, en dispositivos táctiles el estilo
          de "hover" queda pegado después de un tap (no hay mouse que se
          aleje para quitarlo) — mismo criterio que ya usa el resto de
          tienda-publica (TiendaFooter, cm-hero-arrow, cm-hero-share-btn),
          que este nav no tenía. */}
      <style>{`
        @media (hover: hover) {
          .tp-nav-item:hover .tp-nav-icon { background: color-mix(in srgb, var(--tp-text) 6%, transparent); }
          .tp-nav-share:hover .tp-nav-share-icon { filter: brightness(1.08); }
        }
      `}</style>
      {/* Mismo padding que BottomNav global: 4px lateral, 8px arriba, 12px
          abajo (antes era 8/6/10 uniforme, ligeramente distinto). */}
      <div style={{ display: 'flex', alignItems: 'flex-end', padding: '8px 4px 12px', maxWidth: 460, margin: '0 auto' }}>
        <NavItem Icon={MapPin} label="Mapa" onClick={onAbrirMapa} />

        {/* Central elevado, mismo tamaño/sombra que el botón central de Home
            (56px, sombra con el color de marca, no negro genérico). Carrito
            con contador cuando hay catálogo con carrito activo; si no,
            Compartir sigue siendo la acción principal de la vista de
            ofertas. Hover con brightness (mismo espíritu que el FAB "Crear"
            del admin, que cambia de color/rota al interactuar). */}
        <button className="tp-nav-share" onClick={conCarrito ? onAbrirCarrito : onCompartir} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'none', border: 'none', cursor: 'pointer', marginTop: -14,
        }}>
          {/* rounded-2xl (16px) — el central de BottomNav global es w-14 h-14
              rounded-2xl, NO circular (RADIUS.xl/28px era demasiado redondo). */}
          <div className="tp-nav-share-icon" style={{ position: 'relative', width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tp-primary)', boxShadow: '0 4px 18px color-mix(in srgb, var(--tp-primary) 45%, transparent)', transition: 'filter .15s ease' }}>
            {conCarrito ? <ShoppingCart size={22} style={{ color: 'var(--tp-on-primary)' }} /> : <Share2 size={22} style={{ color: 'var(--tp-on-primary)' }} />}
            {conCarrito && carritoCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, padding: '0 5px', borderRadius: RADIUS.full, background: 'var(--tp-secondary, #ef4444)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', border: '2px solid var(--tp-surface)' }}>
                {carritoCount > 99 ? '99+' : carritoCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--tp-text-muted)', marginTop: 4, ...F }}>{conCarrito ? 'Carrito' : 'Compartir'}</span>
        </button>

        <NavItem Icon={Clock} label="Horarios" onClick={onAbrirHorarios} />
      </div>
    </div>
  );
}
