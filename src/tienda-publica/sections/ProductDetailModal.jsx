/**
 * ProductDetailModal — vista ampliada de una oferta: imagen grande con zoom
 * (tap para ampliar, mismo mecanismo que el flyer del proyecto de referencia),
 * nombre, descripción y precio si existen, botón Compartir. Ofertas simples
 * (sin módulo Catálogo) siguen siendo un flyer sin selector de cantidad — el
 * botón "Agregar" solo aparece si el caller pasa onAdd (catálogo con carrito
 * activo), mismo criterio que QtyControl en ProductCards.jsx.
 */
import React, { useState } from 'react';
import { X, Share2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { FONT, RADIUS, SHADOW } from '../tokens.js';
import { formatPrice } from '../utils.js';

const F = { fontFamily: FONT.family };

export function ProductDetailModal({ producto, onClose, onCompartir, qty = 0, onAdd, onRemove }) {
  const [zoom, setZoom] = useState(false);
  if (!producto) return null;

  const img = producto.foto || producto.galeria?.[0] || producto.fotos?.[0];

  // zIndex 4750: por encima de CatalogoModal/OfertasModal (4700, Fase 6 del
  // plan) — el detalle de producto se abre DESDE dentro de esos modales
  // fullscreen y debe quedar apilado encima, no debajo.
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4750, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)' }} />
      <div className="tp-sheet-scroll" style={{
        position: 'relative', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`, boxShadow: SHADOW.xl, ...F,
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
        `}</style>
        <button onClick={onClose} aria-label="Cerrar" className="tp-pdm-close" style={{
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
                flex: onAdd ? undefined : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', border: `1.5px solid var(--tp-border)`, borderRadius: RADIUS.lg,
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
                flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', border: 'none', borderRadius: RADIUS.lg,
                background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', fontWeight: 800, fontSize: 15,
                cursor: 'pointer', transition: 'transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease', ...F,
              }}>
                <Plus size={17} />
                Agregar al pedido
              </button>
            ) : (
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 10px', borderRadius: RADIUS.lg, background: 'var(--tp-primary)' }}>
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
