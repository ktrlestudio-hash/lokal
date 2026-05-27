/**
 * Hero — portada de la tienda pública
 * variant: 'centered' | 'split' | 'banner'
 *
 * centered → logo arriba, nombre y tagline centrados. Minimalista.
 * split    → logo izquierda, info derecha. Más ejecutivo.
 * banner   → foto de fondo full-width con overlay. Impacto visual.
 */
import React from 'react';
import { MapPin } from 'lucide-react';
import { getEstadoApertura } from '../utils.js';
import { FONT, RADIUS, SHADOW } from '../tokens.js';

const F = { fontFamily: FONT.family };

function BadgeApertura({ horarios }) {
  const { abierta, texto } = getEstadoApertura(horarios);
  if (!texto) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: RADIUS.full,
      fontSize: FONT.size.xs, fontWeight: FONT.weight.bold,
      background: abierta ? 'rgba(16,185,129,.12)' : 'rgba(100,116,139,.1)',
      color: abierta ? '#10b981' : 'var(--tp-text-muted)',
      ...F,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      {texto}
    </span>
  );
}

export function Hero({ tienda, variant = 'centered' }) {
  const foto = tienda.galeria?.[0] || tienda.foto || null;

  if (variant === 'centered') return (
    <div style={{ textAlign: 'center', padding: '3rem 1.5rem 2rem', background: 'var(--tp-surface)' }}>
      <div style={{ width: 88, height: 88, borderRadius: RADIUS.xl, margin: '0 auto 1.25rem', overflow: 'hidden', boxShadow: SHADOW.md, background: 'var(--tp-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {tienda.logo
          ? <img src={tienda.logo} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', fontFamily: FONT.family }}>{tienda.nombre?.[0]?.toUpperCase() || 'T'}</span>
        }
      </div>
      <h1 style={{ fontSize: FONT.size['3xl'], fontWeight: FONT.weight.black, color: 'var(--tp-text)', margin: '0 0 .4rem', lineHeight: FONT.lineHeight.tight, ...F }}>
        {tienda.nombre}
      </h1>
      {tienda.tagline && (
        <p style={{ fontSize: FONT.size.lg, color: 'var(--tp-text-muted)', margin: '0 0 1rem', ...F }}>{tienda.tagline}</p>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <BadgeApertura horarios={tienda.horarios} />
        {tienda.ciudad && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: FONT.size.xs, color: 'var(--tp-text-muted)', ...F }}>
            <MapPin size={11} /> {tienda.ciudad}
          </span>
        )}
      </div>
    </div>
  );

  if (variant === 'split') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2.5rem 1.5rem', background: 'var(--tp-surface)', flexWrap: 'wrap' }}>
      <div style={{ width: 80, height: 80, borderRadius: RADIUS.xl, overflow: 'hidden', flexShrink: 0, boxShadow: SHADOW.md, background: 'var(--tp-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {tienda.logo
          ? <img src={tienda.logo} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <span style={{ fontSize: 30, fontWeight: 900, color: '#fff', fontFamily: FONT.family }}>{tienda.nombre?.[0]?.toUpperCase() || 'T'}</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <h1 style={{ fontSize: FONT.size['2xl'], fontWeight: FONT.weight.black, color: 'var(--tp-text)', margin: '0 0 .3rem', lineHeight: FONT.lineHeight.tight, ...F }}>
          {tienda.nombre}
        </h1>
        {tienda.tagline && (
          <p style={{ fontSize: FONT.size.base, color: 'var(--tp-text-muted)', margin: '0 0 .75rem', ...F }}>{tienda.tagline}</p>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <BadgeApertura horarios={tienda.horarios} />
          {tienda.ciudad && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: FONT.size.xs, color: 'var(--tp-text-muted)', ...F }}>
              <MapPin size={11} /> {tienda.ciudad}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (variant === 'banner') return (
    <div style={{ position: 'relative', minHeight: 280, overflow: 'hidden', background: foto ? 'transparent' : 'var(--tp-primary)' }}>
      {foto && (
        <img src={foto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.2) 60%, transparent 100%)' }} />
      <div style={{ position: 'relative', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 280 }}>
        {tienda.logo && (
          <img src={tienda.logo} alt={tienda.nombre}
            style={{ width: 64, height: 64, borderRadius: RADIUS.lg, objectFit: 'cover', marginBottom: '1rem', boxShadow: SHADOW.lg }} />
        )}
        <h1 style={{ fontSize: FONT.size['3xl'], fontWeight: FONT.weight.black, color: '#fff', margin: '0 0 .3rem', lineHeight: FONT.lineHeight.tight, textShadow: '0 2px 12px rgba(0,0,0,.4)', ...F }}>
          {tienda.nombre}
        </h1>
        {tienda.tagline && (
          <p style={{ fontSize: FONT.size.base, color: 'rgba(255,255,255,.85)', margin: '0 0 .75rem', ...F }}>{tienda.tagline}</p>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <BadgeApertura horarios={tienda.horarios} />
          {tienda.ciudad && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: FONT.size.xs, color: 'rgba(255,255,255,.75)', ...F }}>
              <MapPin size={11} /> {tienda.ciudad}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return null;
}
