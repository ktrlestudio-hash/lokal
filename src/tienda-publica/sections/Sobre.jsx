/**
 * Sobre — descripción / "quiénes somos"
 * variant: 'simple' | 'card'
 *
 * simple → texto plano con título
 * card   → caja con fondo surface, ícono decorativo
 */
import React from 'react';
import { Info } from 'lucide-react';
import { FONT, RADIUS, SHADOW } from '../tokens.js';

const F = { fontFamily: FONT.family };

export function Sobre({ tienda, variant = 'simple' }) {
  const texto = tienda.descripcion || tienda.sobre || tienda.bio || null;
  if (!texto) return null;

  if (variant === 'simple') return (
    <section style={{ padding: '2rem 1.25rem' }}>
      <h2 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.black, color: 'var(--tp-text)', margin: '0 0 .75rem', ...F }}>
        Sobre nosotros
      </h2>
      <p style={{ fontSize: FONT.size.base, color: 'var(--tp-text-muted)', lineHeight: FONT.lineHeight.relaxed, margin: 0, ...F }}>
        {texto}
      </p>
    </section>
  );

  if (variant === 'card') return (
    <section style={{ padding: '2rem 1.25rem' }}>
      <div style={{ background: 'var(--tp-surface)', border: '1px solid var(--tp-border)', borderRadius: RADIUS.xl, padding: '1.5rem', boxShadow: SHADOW.sm }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: RADIUS.lg, background: 'var(--tp-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Info size={18} style={{ color: 'var(--tp-primary)' }} />
          </div>
          <h2 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.black, color: 'var(--tp-text)', margin: 0, ...F }}>
            Sobre nosotros
          </h2>
        </div>
        <p style={{ fontSize: FONT.size.base, color: 'var(--tp-text-muted)', lineHeight: FONT.lineHeight.relaxed, margin: 0, ...F }}>
          {texto}
        </p>
      </div>
    </section>
  );

  return null;
}
