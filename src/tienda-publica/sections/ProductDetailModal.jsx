/**
 * ProductDetailModal — ficha ampliada de un producto (foto grande, descripción,
 * porciones estimadas, tiempo de preparación, tags dietéticos si existen) con
 * selector de cantidad y botón de agregar. Campos `serves`/`prepTimeMin`/`tags`
 * son opcionales — si el producto no los tiene, esas filas simplemente no se
 * muestran (no todo comercio necesita "para cuántos alcanza").
 */
import React, { useState } from 'react';
import { X, Plus, Minus, Users, Clock, ShoppingBag, Star } from 'lucide-react';
import { FONT, RADIUS, SHADOW } from '../tokens.js';
import { formatPrice } from '../utils.js';

const F = { fontFamily: FONT.family };

const TAG_LABELS = {
  vegetarian: 'Vegetariano', vegan: 'Vegano', glutenFree: 'Sin TACC',
  lactoseFree: 'Sin Lactosa', kids: 'Kids',
};

export function ProductDetailModal({ producto, cartQty = 0, onAdd, onClose }) {
  const [qty, setQty] = useState(Math.max(cartQty, 1));
  if (!producto) return null;

  const img = producto.foto || producto.galeria?.[0] || producto.fotos?.[0];
  const tags = producto.tags || [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`, boxShadow: SHADOW.xl, ...F,
      }}>
        <button onClick={onClose} aria-label="Cerrar" style={{
          position: 'absolute', top: 12, right: 12, zIndex: 2,
          width: 34, height: 34, border: 'none', borderRadius: RADIUS.full,
          background: 'rgba(0,0,0,.5)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}><X size={17} /></button>

        <div style={{ height: 220, background: 'var(--tp-surface2)', position: 'relative' }}>
          {img
            ? <img src={img} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--tp-text-muted)' }}>
                <ShoppingBag size={40} style={{ opacity: 0.4 }} />
              </div>
          }
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--tp-text)', letterSpacing: '-0.02em' }}>{producto.nombre}</h2>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--tp-primary)', whiteSpace: 'nowrap' }}>{formatPrice(producto.precio)}</span>
          </div>

          {producto.presentacion && (
            <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 700, color: 'var(--tp-text-muted)', textTransform: 'uppercase', letterSpacing: '.03em' }}>
              {producto.presentacion}
            </p>
          )}

          {producto.descripcion && (
            <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.6, color: 'var(--tp-text-muted)' }}>{producto.descripcion}</p>
          )}

          {(producto.serves || producto.prepTimeMin || producto.rating) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {producto.rating && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                  borderRadius: RADIUS.md, background: 'var(--tp-surface2)', fontSize: 13, fontWeight: 700, color: 'var(--tp-text)',
                }}>
                  <Star size={14} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                  {producto.rating}
                </div>
              )}
              {producto.serves && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                  borderRadius: RADIUS.md, background: 'var(--tp-surface2)', fontSize: 13, fontWeight: 700, color: 'var(--tp-text)',
                }}>
                  <Users size={14} style={{ color: 'var(--tp-primary)' }} />
                  {producto.serves} {producto.serves === 1 ? 'persona' : 'personas'}
                </div>
              )}
              {producto.prepTimeMin && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                  borderRadius: RADIUS.md, background: 'var(--tp-surface2)', fontSize: 13, fontWeight: 700, color: 'var(--tp-text)',
                }}>
                  <Clock size={14} style={{ color: 'var(--tp-primary)' }} />
                  {producto.prepTimeMin} min
                </div>
              )}
            </div>
          )}

          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {tags.map(t => TAG_LABELS[t] && (
                <span key={t} style={{
                  fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: RADIUS.full,
                  background: 'var(--tp-primary-soft)', color: 'var(--tp-primary)',
                }}>{TAG_LABELS[t]}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '8px 6px',
              borderRadius: RADIUS.full, border: '1px solid var(--tp-border)',
            }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Restar" style={{
                width: 32, height: 32, border: 'none', borderRadius: RADIUS.full, background: 'var(--tp-surface2)',
                color: 'var(--tp-text)', display: 'grid', placeItems: 'center', cursor: 'pointer',
              }}><Minus size={15} /></button>
              <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 800, fontSize: 15, color: 'var(--tp-text)' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} aria-label="Sumar" style={{
                width: 32, height: 32, border: 'none', borderRadius: RADIUS.full, background: 'var(--tp-surface2)',
                color: 'var(--tp-text)', display: 'grid', placeItems: 'center', cursor: 'pointer',
              }}><Plus size={15} /></button>
            </div>

            <button
              onClick={() => { onAdd(producto, qty); onClose(); }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', border: 'none', borderRadius: RADIUS.lg,
                background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', fontWeight: 800, fontSize: 15,
                cursor: 'pointer', ...F,
              }}
            >
              Agregar · {formatPrice((producto.precio || 0) * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
