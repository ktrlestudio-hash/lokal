/**
 * ProductDetailModal — vista ampliada de una oferta: imagen grande con zoom
 * (tap para ampliar, mismo mecanismo que el flyer del proyecto de referencia),
 * nombre, descripción y precio si existen, botón Compartir. Ofertas simples
 * (sin módulo Catálogo) siguen siendo un flyer sin selector de cantidad — el
 * botón "Agregar" solo aparece si el caller pasa onAdd (catálogo con carrito
 * activo), mismo criterio que QtyControl en ProductCards.jsx.
 *
 * Tres mejoras tomadas de MV Distribuciones (la referencia más madura de
 * sheet de producto+carrito del ecosistema, ver .prod-sheet-ov/.prod-detalle-*
 * en su index.html):
 *   1. El sheet NO tapa la bottom-nav (TiendaNavBar) — bottom:var(--tp-nav-h)
 *      en vez de inset:0, mismo criterio que .prod-sheet-ov ("bottom:
 *      var(--bnav-h,0px)... el sheet no tapa la bottom-nav").
 *   2. Cierre animado en dos tiempos: el panel baja y el fondo se desvanece
 *      ANTES de desmontar, en vez de un corte seco — mismo patrón que
 *      prodCerrarSheetAnimado(), documentado ahí como respuesta directa a
 *      "el ocultamiento del carrito hacelo fluido y amigable, no de un
 *      tirón rápido".
 *   3. Precio y botón de acción en la MISMA fila — mismo layout que
 *      .prod-detalle-top — con el stepper del mismo ancho/alto exacto que
 *      el botón "Agregar" (150×44 en MV; acá se logra con el propio flex
 *      del layout en vez de un ancho fijo, ver el bloque de acciones).
 */
import React, { useState, useCallback } from 'react';
import { X, Share2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { FONT, RADIUS, SHADOW } from '../tokens.js';
import { formatPrice } from '../utils.js';

const F = { fontFamily: FONT.family };
const CIERRE_MS = 220; // duración real de la animación de salida, ver @keyframes tp-pdm-out abajo
const ACCION_ALTO = 48; // alto fijo compartido por "Agregar al pedido" y el stepper — mismo criterio que MV Distribuciones (stepper idéntico al botón, no una versión chica)

export function ProductDetailModal({ producto, onClose, onCompartir, qty = 0, onAdd, onRemove }) {
  const [zoom, setZoom] = useState(false);
  // Cierre en dos tiempos: "cerrando" dispara la animación de salida (CSS),
  // y recién cuando termina se llama al onClose real que desmonta el
  // componente — sin esto, el padre sacaba el modal del árbol en el mismo
  // frame del click, cortando la animación antes de que se viera.
  const [cerrando, setCerrando] = useState(false);
  const cerrarAnimado = useCallback(() => {
    setCerrando(true);
    setTimeout(onClose, CIERRE_MS);
  }, [onClose]);

  if (!producto) return null;

  const img = producto.foto || producto.galeria?.[0] || producto.fotos?.[0];

  // zIndex 4750: por encima de CatalogoModal/OfertasModal (4700, Fase 6 del
  // plan) — el detalle de producto se abre DESDE dentro de esos modales
  // fullscreen y debe quedar apilado encima, no debajo.
  //
  // bottom: var(--tp-nav-h, 0px) en vez de inset:0 — TiendaNavBar publica
  // su altura real (ver ese archivo), así el sheet termina justo arriba de
  // la barra en vez de taparla con su fixed. Sin esto, el usuario perdía el
  // acceso al carrito/mapa/horarios mientras miraba el detalle de un
  // producto — justo la acción más probable después de ver el detalle.
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 'var(--tp-nav-h, 0px)', zIndex: 4750, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={cerrarAnimado} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', animation: `tp-pdm-backdrop-${cerrando ? 'out' : 'in'} ${CIERRE_MS}ms ease forwards` }} />
      <div className="tp-sheet-scroll" style={{
        position: 'relative', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`, boxShadow: SHADOW.xl, ...F,
        animation: `tp-pdm-panel-${cerrando ? 'out' : 'in'} ${CIERRE_MS}ms cubic-bezier(0.4,0,0.2,1) forwards`,
      }}>
        {/* Sin className/:hover en la X ni en el botón Compartir de abajo —
            mismo hueco que el resto de sheets/botones sólidos de marca. */}
        <style>{`
          @media (hover: hover) {
            .tp-pdm-close:hover { background: rgba(0,0,0,.7) !important; }
            .tp-pdm-share:hover { filter: brightness(0.9); }
          }
          .tp-pdm-close { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), background-color .15s ease; }
          .tp-pdm-share { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
          .tp-pdm-close:active { transform: scale(0.9); transition: transform .06s ease; }
          .tp-pdm-share:active { transform: scale(0.95); transition: transform .06s ease; }
          .tp-sheet-scroll { scrollbar-width: none; -ms-overflow-style: none; }
          .tp-sheet-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
          @keyframes tp-pdm-backdrop-in  { from { opacity: 0; } to { opacity: 1; } }
          @keyframes tp-pdm-backdrop-out { from { opacity: 1; } to { opacity: 0; } }
          @keyframes tp-pdm-panel-in  { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes tp-pdm-panel-out { from { transform: translateY(0); } to { transform: translateY(100%); } }
        `}</style>
        <button onClick={cerrarAnimado} aria-label="Cerrar" className="tp-pdm-close" style={{
          position: 'absolute', top: 12, right: 12, zIndex: 2,
          width: 34, height: 34, border: 'none', borderRadius: RADIUS.full,
          background: 'rgba(0,0,0,.5)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}><X size={17} /></button>

        {/* Imagen — tap para zoom (transform:scale simple, sin dependencia
            nueva de lightbox). El zoom se cierra tocando de nuevo la imagen
            o el fondo oscuro. */}
        <div
          onClick={() => img && setZoom(z => !z)}
          style={{
            background: 'var(--tp-surface2)', position: 'relative', overflow: 'hidden',
            cursor: img ? (zoom ? 'zoom-out' : 'zoom-in') : 'default',
          }}
        >
          {img
            ? <img src={img} alt={producto.nombre} style={{
                width: '100%', display: 'block', objectFit: 'contain',
                transform: zoom ? 'scale(1.8)' : 'scale(1)',
                transition: 'transform .25s ease',
              }} />
            : <div style={{ width: '100%', height: 220, display: 'grid', placeItems: 'center', color: 'var(--tp-text-muted)' }}>
                <ShoppingBag size={40} style={{ opacity: 0.4 }} />
              </div>
          }
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--tp-text)', letterSpacing: '-0.02em' }}>{producto.nombre}</h2>
            {producto.precio != null && (
              <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--tp-primary)', whiteSpace: 'nowrap' }}>{formatPrice(producto.precio)}</span>
            )}
          </div>

          {producto.descripcion && (
            <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.6, color: 'var(--tp-text-muted)' }}>{producto.descripcion}</p>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCompartir}
              className="tp-pdm-share"
              style={{
                flex: onAdd ? undefined : 1, height: ACCION_ALTO, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '0 14px', border: `1.5px solid var(--tp-border)`, borderRadius: RADIUS.lg,
                background: onAdd ? 'var(--tp-surface)' : 'var(--tp-primary)',
                color: onAdd ? 'var(--tp-text)' : 'var(--tp-on-primary)',
                fontWeight: 800, fontSize: 15, cursor: 'pointer',
                transition: 'transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease', ...F,
              }}
            >
              <Share2 size={17} />
              {onAdd ? null : 'Compartir'}
            </button>
            {onAdd && (qty === 0 ? (
              <button onClick={() => onAdd(producto)} className="tp-pdm-share" style={{
                flex: 2, height: ACCION_ALTO, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '0 14px', border: 'none', borderRadius: RADIUS.lg,
                background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', fontWeight: 800, fontSize: 15,
                cursor: 'pointer', transition: 'transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease', ...F,
              }}>
                <Plus size={17} />
                Agregar al pedido
              </button>
            ) : (
              <div style={{ flex: 2, height: ACCION_ALTO, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 8px', borderRadius: RADIUS.lg, background: 'var(--tp-primary)' }}>
                <button onClick={() => onRemove(producto.id)} aria-label="Restar" style={{ width: 36, height: 36, border: 'none', borderRadius: RADIUS.md, background: 'rgba(255,255,255,.2)', color: 'var(--tp-on-primary)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Minus size={16} /></button>
                <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--tp-on-primary)' }}>{qty}</span>
                <button onClick={() => onAdd(producto)} aria-label="Sumar" style={{ width: 36, height: 36, border: 'none', borderRadius: RADIUS.md, background: 'rgba(255,255,255,.2)', color: 'var(--tp-on-primary)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Plus size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
