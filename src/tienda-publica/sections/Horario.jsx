/**
 * Horario — días y horarios de atención
 * variant: 'simple' | 'tabla'
 *
 * simple → solo muestra días con horario, omite los cerrados
 * tabla  → todos los días en una tabla clara, cerrado destacado
 */
import React from 'react';
import { Clock } from 'lucide-react';
import { getEstadoApertura } from '../utils.js';
import { FONT, RADIUS, SHADOW } from '../tokens.js';

const F = { fontFamily: FONT.family };
const DIAS = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
const DIAS_LABEL = { lunes:'Lunes', martes:'Martes', miercoles:'Miércoles', jueves:'Jueves', viernes:'Viernes', sabado:'Sábado', domingo:'Domingo' };

export function Horario({ tienda, variant = 'simple' }) {
  const { horarios } = tienda;
  if (!horarios || !Object.keys(horarios).length) return null;

  const { abierta, texto } = getEstadoApertura(horarios);

  const badge = (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
      borderRadius: RADIUS.full, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold,
      background: abierta ? 'rgba(16,185,129,.12)' : 'rgba(100,116,139,.08)',
      color: abierta ? '#10b981' : 'var(--tp-text-muted)', ...F,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      {texto}
    </span>
  );

  if (variant === 'simple') {
    const diasConHorario = DIAS.filter(d => horarios[d]);
    return (
      <section style={{ padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.black, color: 'var(--tp-text)', margin: 0, ...F }}>Horarios</h2>
          {badge}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {diasConHorario.map(dia => (
            <div key={dia} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--tp-border)' }}>
              <span style={{ fontSize: FONT.size.sm, color: 'var(--tp-text)', fontWeight: FONT.weight.medium, ...F }}>{DIAS_LABEL[dia]}</span>
              <span style={{ fontSize: FONT.size.sm, color: 'var(--tp-primary)', fontWeight: FONT.weight.bold, ...F }}>{horarios[dia]}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (variant === 'tabla') return (
    <section style={{ padding: '2rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Clock size={18} style={{ color: 'var(--tp-primary)' }} />
        <h2 style={{ fontSize: FONT.size.xl, fontWeight: FONT.weight.black, color: 'var(--tp-text)', margin: 0, ...F }}>Horarios</h2>
        {badge}
      </div>
      <div style={{ background: 'var(--tp-surface)', border: '1px solid var(--tp-border)', borderRadius: RADIUS.lg, overflow: 'hidden', boxShadow: SHADOW.sm }}>
        {DIAS.map((dia, i) => {
          const h = horarios[dia];
          const esHoy = DIAS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] === dia;
          return (
            <div key={dia} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 16px',
              borderBottom: i < DIAS.length - 1 ? '1px solid var(--tp-border)' : 'none',
              background: esHoy ? 'var(--tp-primary-soft)' : 'transparent',
            }}>
              <span style={{ fontSize: FONT.size.sm, fontWeight: esHoy ? FONT.weight.bold : FONT.weight.medium, color: esHoy ? 'var(--tp-primary)' : 'var(--tp-text)', ...F }}>
                {DIAS_LABEL[dia]}{esHoy ? ' (hoy)' : ''}
              </span>
              <span style={{ fontSize: FONT.size.sm, fontWeight: FONT.weight.bold, color: h ? (esHoy ? 'var(--tp-primary)' : 'var(--tp-text)') : 'var(--tp-text-muted)', ...F }}>
                {h || 'Cerrado'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );

  return null;
}
