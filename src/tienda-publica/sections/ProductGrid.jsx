/**
 * ProductGrid — catálogo de productos
 * variant: 'grid2' | 'grid3' | 'list'
 *
 * grid2 → 2 columnas, cards con imagen cuadrada. Mobile-first.
 * grid3 → 3 columnas en desktop, 2 en mobile. Más denso.
 * list  → fila horizontal con imagen pequeña a la izquierda. Rápido de leer.
 */
import React, { useState } from 'react';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import { formatPrice } from '../utils.js';
import { FONT, RADIUS, SHADOW, TRANSITION } from '../tokens.js';

const F = { fontFamily: FONT.family };

function CardActions({ producto, cart, onAdd, onRemove }) {
  const inCart = cart.find(i => i.id === producto.id);
  if (inCart) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button onClick={() => onRemove(producto.id)}
        style={{ width: 28, height: 28, borderRadius: RADIUS.sm, border: '1.5px solid var(--tp-border)', background: 'var(--tp-surface2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tp-text-muted)', transition: TRANSITION.fast }}>
        <Minus size={13} />
      </button>
      <span style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, color: 'var(--tp-text)', minWidth: 18, textAlign: 'center', ...F }}>{inCart.qty}</span>
      <button onClick={() => onAdd(producto)}
        style={{ width: 28, height: 28, borderRadius: RADIUS.sm, border: 'none', background: 'var(--tp-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tp-on-primary)', transition: TRANSITION.fast }}>
        <Plus size={13} />
      </button>
    </div>
  );
  return (
    <button onClick={() => onAdd(producto)}
      style={{ padding: '6px 14px', borderRadius: RADIUS.sm, border: 'none', background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, cursor: 'pointer', transition: TRANSITION.fast, ...F }}>
      Agregar
    </button>
  );
}

export function ProductGrid({ productos = [], variant = 'grid2', cart = [], onAdd, onRemove }) {
  if (!productos.length) return null;
  const activos = productos.filter(p => p.activa !== false);
  if (!activos.length) return null;

  const sectionStyle = { padding: '2rem 1.25rem' };
  const titleStyle = { fontSize: FONT.size.xl, fontWeight: FONT.weight.black, color: 'var(--tp-text)', margin: '0 0 1.25rem', ...F };

  if (variant === 'list') return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>Catálogo</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activos.map(p => {
          const img = p.fotos?.[0] || p.galeria?.[0] || null;
          return (
            <div key={p.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 14px', background: 'var(--tp-surface)', border: '1px solid var(--tp-border)', borderRadius: RADIUS.lg, boxShadow: SHADOW.sm }}>
              {img
                ? <img src={img} alt={p.nombre} style={{ width: 60, height: 60, borderRadius: RADIUS.md, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 60, height: 60, borderRadius: RADIUS.md, background: 'var(--tp-primary-soft)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={20} style={{ color: 'var(--tp-primary)' }} /></div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.bold, color: 'var(--tp-text)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...F }}>{p.nombre}</p>
                {p.descripcion && <p style={{ fontSize: FONT.size.xs, color: 'var(--tp-text-muted)', margin: 0, ...F, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.descripcion}</p>}
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <p style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.black, color: 'var(--tp-primary)', margin: '0 0 6px', ...F }}>{formatPrice(p.precio)}</p>
                {onAdd && <CardActions producto={p} cart={cart} onAdd={onAdd} onRemove={onRemove} />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const cols = variant === 'grid3'
    ? 'repeat(auto-fill, minmax(160px, 1fr))'
    : 'repeat(auto-fill, minmax(140px, 1fr))';

  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>Catálogo</h2>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12 }}>
        {activos.map(p => {
          const img = p.fotos?.[0] || p.galeria?.[0] || null;
          return (
            <div key={p.id} style={{ background: 'var(--tp-surface)', border: '1px solid var(--tp-border)', borderRadius: RADIUS.lg, overflow: 'hidden', boxShadow: SHADOW.sm, display: 'flex', flexDirection: 'column' }}>
              <div style={{ aspectRatio: '1', background: 'var(--tp-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {img
                  ? <img src={img} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <ShoppingBag size={28} style={{ color: 'var(--tp-primary)', opacity: .4 }} />
                }
              </div>
              <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, color: 'var(--tp-text)', margin: 0, lineHeight: FONT.lineHeight.tight, ...F }}>{p.nombre}</p>
                <p style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.black, color: 'var(--tp-primary)', margin: 0, ...F }}>{formatPrice(p.precio)}</p>
                {onAdd && (
                  <div style={{ marginTop: 'auto' }}>
                    <CardActions producto={p} cart={cart} onAdd={onAdd} onRemove={onRemove} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
