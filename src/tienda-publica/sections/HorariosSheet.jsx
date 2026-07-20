/**
 * HorariosSheet — bottom sheet con el horario completo de la semana.
 * Se abre desde el badge abierto/cerrado del hero. Mismo patrón visual que
 * CartSheet (overlay + panel con borde redondeado solo arriba).
 */
import React, { useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { RADIUS, SHADOW, FONT } from '../tokens.js';
import { DAY_NAMES, DAY_LABELS } from '../../utils/helpers.ts';
import { useSheetOpen } from '../hooks/useSheetOpen.js';
import { SHEET_TRANSITION_CSS } from './sheetTransitionCss.js';

const F = { fontFamily: FONT.family };

export function HorariosSheet({ open, onClose, horarios, abierta, texto }) {
  const { mounted, visible } = useSheetOpen(open, 220, onClose);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!mounted) return null;

  const todayKey = DAY_NAMES[new Date().getDay()];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4700, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <style>{SHEET_TRANSITION_CSS}</style>
      <div onClick={onClose} className={`tp-sheet-ov ${visible ? 'in' : ''}`} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div className={`tp-sheet-panel tp-sheet-scroll ${visible ? 'in' : ''}`} style={{
        position: 'relative', background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
        maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: SHADOW.xl, ...F,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--tp-border)', margin: '10px auto 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 14px', borderBottom: '1px solid var(--tp-border)' }}>
          <Clock size={18} style={{ color: 'var(--tp-primary)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--tp-text)' }}>Horario de atención</h3>
            {texto && <p style={{ margin: '1px 0 0', fontSize: 12.5, fontWeight: 700, color: abierta ? '#16a34a' : '#ef4444' }}>{texto}</p>}
          </div>
          {/* Sin className/:hover — mismo hueco que el resto de X de sheets. */}
          <style>{`
            @media (hover: hover) { .tp-sheet-close:hover { filter: brightness(0.85); } }
            .tp-sheet-close:active { transform: scale(0.9); transition: transform .06s ease; }
          `}</style>
          <button onClick={onClose} aria-label="Cerrar" className="tp-sheet-close" style={{
            width: 32, height: 32, border: 'none', borderRadius: RADIUS.md, background: 'var(--tp-surface2)',
            color: 'var(--tp-text-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, transition: 'transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease',
          }}><X size={16} /></button>
        </div>

        <div style={{ padding: '10px 18px 24px', overflowY: 'auto' }}>
          {horarios ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {DAY_NAMES.map(key => {
                const schedule = horarios[key];
                const isToday = key === todayKey;
                return (
                  <div key={key} style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: 14, borderRadius: RADIUS.md,
                    padding: '9px 12px', background: isToday ? 'var(--tp-primary-soft)' : 'transparent',
                  }}>
                    <span style={{ fontWeight: isToday ? 800 : 500, color: isToday ? 'var(--tp-primary)' : 'var(--tp-text-muted)' }}>
                      {DAY_LABELS[key]}{isToday && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', opacity: .7 }}>hoy</span>}
                    </span>
                    <span style={{ fontWeight: isToday ? 800 : 500, color: schedule ? (isToday ? 'var(--tp-text)' : 'var(--tp-text-muted)') : '#ef4444' }}>
                      {schedule || 'Cerrado'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--tp-text-muted)', textAlign: 'center', padding: '16px 0' }}>Horario no disponible</p>
          )}
        </div>
      </div>
    </div>
  );
}
