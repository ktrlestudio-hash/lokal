// DatePicker — calendario de fecha única, sin dependencias, con la estética
// de LOKAL (tokens CSS: --brand-hex, --surface-solid, etc.). Portado del
// motor MonthView del SISTEMA DE TRACKEO (widgets.jsx / DateTimeInput.jsx),
// simplificado a fecha sola (sin hora ni rango): navegación en cascada
// días → meses → años, popover posicionado con portal.
//
// Uso principal: fecha de caducidad de una oferta (min = hoy, no se puede
// caducar en el pasado). Pensado también para filtros de fecha en otras
// pantallas — de ahí que acepte min/max configurables.
//
// value: "yyyy-mm-dd" | "". onChange(nextIso). placeholder opcional.
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const pad2 = (n) => String(n).padStart(2, '0');
const dToISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const isoToD = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_AB = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS_AB = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

function isoToDisplay(iso) {
  if (!iso) return '';
  const d = isoToD(iso);
  return `${d.getDate()} ${MESES_AB[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Vista de mes navegable (días → meses → años) ──────────────────────────────
function MonthView({ cursor, setCursor, value, onDay, minISO, maxISO, minYear, maxYear }) {
  const [view, setView] = useState('days');
  const y = cursor.getFullYear();
  const m = cursor.getMonth();

  const primero = new Date(y, m, 1);
  const offset = (primero.getDay() + 6) % 7; // semana arranca lunes
  const celdas = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  const diasEnMes = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(y, m, d));
  while (celdas.length % 7 !== 0) celdas.push(null);

  const hoyISO = dToISO(new Date());
  const navBtn = { width: 30, height: 30, display: 'grid', placeItems: 'center', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary, #6b6b6b)' };
  const deshabilitado = (iso) => (minISO && iso < minISO) || (maxISO && iso > maxISO);

  return (
    <div style={{ width: 286, padding: '12px 14px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button type="button" onClick={() => view === 'days' ? setCursor(new Date(y, m - 1, 1)) : view === 'months' ? setCursor(new Date(y - 1, m, 1)) : setCursor(new Date(y - 12, m, 1))} style={navBtn}><ChevronLeft size={17} /></button>
        <button type="button" onClick={() => setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'days')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary, #18181b)', padding: '5px 10px', borderRadius: 8 }}>
          {view === 'days' && `${MESES[m]} ${y}`}
          {view === 'months' && `${y}`}
          {view === 'years' && 'Elegí el año'}
        </button>
        <button type="button" onClick={() => view === 'days' ? setCursor(new Date(y, m + 1, 1)) : view === 'months' ? setCursor(new Date(y + 1, m, 1)) : setCursor(new Date(y + 12, m, 1))} style={navBtn}><ChevronRight size={17} /></button>
      </div>

      {view === 'days' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DIAS_AB.map((d) => <div key={d} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary, #6b6b6b)', padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {celdas.map((d, i) => {
              if (!d) return <div key={i} />;
              const iso = dToISO(d);
              const sel = iso === value;
              const esHoy = iso === hoyISO;
              const off = deshabilitado(iso);
              return (
                <button key={i} type="button" disabled={off}
                  onClick={() => onDay(iso)}
                  style={{
                    height: 34, border: 'none', cursor: off ? 'not-allowed' : 'pointer', fontSize: 12.5,
                    fontWeight: sel ? 800 : 550,
                    color: off ? 'var(--text-secondary, #6b6b6b)' : sel ? '#fff' : 'var(--text-primary, #18181b)',
                    opacity: off ? 0.35 : 1,
                    background: sel ? 'var(--brand-hex, #00B8D9)' : 'transparent',
                    borderRadius: 9, position: 'relative', transition: 'background .12s',
                  }}>
                  {d.getDate()}
                  {esHoy && !sel && <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 999, background: 'var(--brand-hex, #00B8D9)' }} />}
                </button>
              );
            })}
          </div>
        </>
      )}

      {view === 'months' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '4px 0' }}>
          {MESES_AB.map((mes, idx) => (
            <button key={mes} type="button" onClick={() => { setCursor(new Date(y, idx, 1)); setView('days'); }} style={{ height: 46, border: '1px solid var(--border-solid, rgba(0,0,0,.07))', background: idx === m ? 'color-mix(in srgb, var(--brand-hex, #00B8D9) 12%, transparent)' : 'transparent', color: idx === m ? 'var(--brand-hex, #00B8D9)' : 'var(--text-secondary, #6b6b6b)', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 650 }}>{mes}</button>
          ))}
        </div>
      )}

      {view === 'years' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 232, overflowY: 'auto', padding: '4px 2px' }}>
          {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map((ano) => (
            <button key={ano} type="button" onClick={() => { setCursor(new Date(ano, m, 1)); setView('months'); }} style={{ height: 40, border: ano === y ? '1px solid var(--brand-hex, #00B8D9)' : '1px solid var(--border-solid, rgba(0,0,0,.07))', background: ano === y ? 'color-mix(in srgb, var(--brand-hex, #00B8D9) 12%, transparent)' : 'transparent', color: ano === y ? 'var(--brand-hex, #00B8D9)' : 'var(--text-secondary, #6b6b6b)', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 650 }}>{ano}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DatePicker({ value, onChange, placeholder = 'Elegí una fecha', minISO, maxISO, clearable = true }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(value ? isoToD(value) : new Date());
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const [pos, setPos] = useState(null);

  const nowYear = new Date().getFullYear();
  const minYear = minISO ? isoToD(minISO).getFullYear() : nowYear - 1;
  const maxYear = maxISO ? isoToD(maxISO).getFullYear() : nowYear + 5;

  useEffect(() => { if (value) setCursor(isoToD(value)); }, [value]);

  const place = () => {
    const el = btnRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const W = 300, vw = window.innerWidth, vh = window.innerHeight;
    let left = r.left; if (left + W > vw - 8) left = Math.max(8, vw - W - 8);
    const abajo = vh - r.bottom;
    const arriba = abajo < 360 && r.top > abajo;
    const maxH = Math.max(240, (arriba ? r.top : abajo) - 16);
    setPos({ left, top: arriba ? undefined : r.bottom + 6, bottom: arriba ? vh - r.top + 6 : undefined, maxH });
  };
  useLayoutEffect(() => { if (open) place(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const upd = () => place();
    window.addEventListener('scroll', upd, true); window.addEventListener('resize', upd);
    return () => { window.removeEventListener('scroll', upd, true); window.removeEventListener('resize', upd); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (btnRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return; setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
          padding: '10px 14px', borderRadius: 16, cursor: 'pointer',
          border: '1px solid var(--border-solid, rgba(255,255,255,.1))',
          background: 'var(--surface-solid-2, #1a1a1a)',
          color: value ? 'var(--text-primary, #fff)' : 'var(--text-secondary, #999)',
          fontSize: 14,
        }}
      >
        <CalIcon size={16} style={{ color: value ? 'var(--brand-hex, #00B8D9)' : 'var(--text-secondary, #999)', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{value ? isoToDisplay(value) : placeholder}</span>
        {value && clearable && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            style={{ flexShrink: 0, display: 'flex', cursor: 'pointer' }}
          >
            <X size={14} style={{ color: 'var(--text-secondary, #999)' }} />
          </span>
        )}
      </button>
      {open && pos && createPortal(
        <div ref={popRef} style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, zIndex: 6000, maxHeight: pos.maxH, overflowY: 'auto', background: 'var(--surface-solid, #0a0a0a)', border: '1px solid var(--border-solid, rgba(255,255,255,.1))', borderRadius: 16, boxShadow: '0 18px 44px -14px rgba(0,0,0,.4)' }}>
          <MonthView
            cursor={cursor}
            setCursor={setCursor}
            value={value}
            onDay={(iso) => { onChange(iso); setOpen(false); }}
            minISO={minISO}
            maxISO={maxISO}
            minYear={minYear}
            maxYear={maxYear}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
