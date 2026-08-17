/**
 * Galeria — fotos de la tienda
 * variant: 'strip' | 'masonry'
 *
 * strip    → fila horizontal scrolleable. Liviano.
 * masonry  → grid tipo Pinterest. Visual.
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RADIUS, SHADOW } from '../tokens.js';

export function Galeria({ tienda, variant = 'strip' }) {
  // useState ANTES del early return de abajo: con el guard arriba del
  // hook (como estaba), el hook simplemente no se llamaba cuando
  // fotos.length < 2, violando las reglas de hooks (detectado por eslint
  // react-hooks/rules-of-hooks). Este componente no tiene importadores
  // reales hoy (ver TEMPLATE_GUIDE.md / plan de profesionalización, Fase
  // 4 — vestigio de templates ya borrados), pero se corrige igual para no
  // dejar un error real bloqueando el lint.
  const [lightbox, setLightbox] = useState(null);
  const fotos = [tienda.logo, ...(tienda.galeria || []), ...(tienda.fotos || [])].filter(Boolean);
  if (fotos.length < 2) return null;

  const Lightbox = () => lightbox === null ? null : (
    <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
        <X size={18} />
      </button>
      <img src={fotos[lightbox]} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: RADIUS.lg, objectFit: 'contain', boxShadow: SHADOW.xl }} />
    </div>
  );

  if (variant === 'strip') return (
    <section style={{ padding: '2rem 0' }}>
      <Lightbox />
      <div style={{ overflowX: 'auto', display: 'flex', gap: 10, padding: '0 1.25rem', scrollbarWidth: 'none' }}>
        {fotos.map((img, i) => (
          <div key={i} onClick={() => setLightbox(i)}
            style={{ width: 160, height: 120, borderRadius: RADIUS.lg, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', boxShadow: SHADOW.sm }}>
            <img src={img} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .2s ease' }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
          </div>
        ))}
      </div>
    </section>
  );

  if (variant === 'masonry') return (
    <section style={{ padding: '2rem 1.25rem' }}>
      <Lightbox />
      <div style={{ columns: 2, gap: 10 }}>
        {fotos.map((img, i) => (
          <div key={i} onClick={() => setLightbox(i)}
            style={{ marginBottom: 10, borderRadius: RADIUS.lg, overflow: 'hidden', cursor: 'pointer', breakInside: 'avoid', boxShadow: SHADOW.sm }}>
            <img src={img} alt="" loading="lazy" decoding="async" style={{ width: '100%', display: 'block', transition: 'transform .2s ease' }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
          </div>
        ))}
      </div>
    </section>
  );

  return null;
}
