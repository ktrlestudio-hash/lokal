/**
 * TpMiniCalendario — calendario de fecha única con la paleta --tp-* de
 * tienda-publica (no el DatePicker de src/components/, que trae tokens del
 * admin dark fijos --brand-hex/--surface-solid y se vería inconsistente en
 * el contexto de tienda pública, con su tema claro/oscuro dinámico según la
 * paleta de marca). Solo vista de días — sin el salto a meses/años del
 * picker completo, porque elegir vencimiento de una oferta es casi siempre
 * "un mes cerca de hoy", no navegar años hacia atrás.
 *
 * Usado por OfertaAdminSheet (menú de 3 puntos) y OfertaQuickForm (FAB "+"),
 * ambos con vencimiento opcional de oferta — mismo componente para que la
 * experiencia de elegir fecha sea idéntica en los dos flujos.
 */
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RADIUS } from '../tokens.js';

const pad2 = (n) => String(n).padStart(2, '0');
const dToISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const isoToD = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_AB = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

export function TpMiniCalendario({ valueISO, onPick }) {
  const [cursor, setCursor] = useState(valueISO ? isoToD(valueISO) : new Date());
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const hoyISO = dToISO(new Date());

  const primero = new Date(y, m, 1);
  const offset = (primero.getDay() + 6) % 7;
  const celdas = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  const diasEnMes = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(y, m, d));

  return (
    <div style={{ padding: '4px 2px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button type="button" onClick={() => setCursor(new Date(y, m - 1, 1))} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: 'none', background: 'var(--tp-surface2)', borderRadius: RADIUS.sm, cursor: 'pointer', color: 'var(--tp-text-muted)' }}><ChevronLeft size={15} /></button>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--tp-text)' }}>{MESES[m]} {y}</span>
        <button type="button" onClick={() => setCursor(new Date(y, m + 1, 1))} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: 'none', background: 'var(--tp-surface2)', borderRadius: RADIUS.sm, cursor: 'pointer', color: 'var(--tp-text-muted)' }}><ChevronRight size={15} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
        {DIAS_AB.map((d) => <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--tp-text-muted)', padding: '4px 0' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {celdas.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = dToISO(d);
          const sel = iso === valueISO;
          const esHoy = iso === hoyISO;
          const pasado = iso < hoyISO;
          return (
            <button key={i} type="button" disabled={pasado} onClick={() => onPick(iso)} style={{
              height: 32, border: 'none', cursor: pasado ? 'not-allowed' : 'pointer', fontSize: 12.5,
              fontWeight: sel ? 800 : 550, opacity: pasado ? 0.35 : 1,
              color: sel ? 'var(--tp-on-primary)' : 'var(--tp-text)',
              background: sel ? 'var(--tp-primary)' : 'transparent',
              borderRadius: RADIUS.sm, position: 'relative',
            }}>
              {d.getDate()}
              {esHoy && !sel && <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 999, background: 'var(--tp-primary)' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
