/**
 * OfertaAdminSheet — acciones rápidas de gestión sobre UNA oferta, abierto
 * desde el botón de 3 puntos que aparece en cada card cuando el dueño de la
 * tienda está viendo su propia vista pública (esDueño). Mismas acciones y
 * mismos endpoints que ya existen en el panel completo (StoreApp.jsx →
 * OfertaCard: toggleVisible/openEdit/deleteOferta contra PATCH|DELETE
 * /ofertas), reimplementadas acá en un sheet chico para no forzar al dueño
 * a salir de la vista pública para una acción de un toque.
 */
import React, { useState, useRef, useEffect } from 'react';
import { X, Eye, EyeOff, CalendarClock, Trash2, Loader2 } from 'lucide-react';
import { apiFetch } from '../../api.js';
import { useSheetOpen } from '../hooks/useSheetOpen.js';
import { SHEET_TRANSITION_CSS } from './sheetTransitionCss.js';
import { TpMiniCalendario } from '../components/TpMiniCalendario.jsx';
import { RADIUS, SHADOW, FONT } from '../tokens.js';

const API_BASE = '/.netlify/functions';
const F = { fontFamily: FONT.family };

function fechaInputValue(expireAt) {
  return expireAt ? new Date(expireAt).toISOString().slice(0, 10) : '';
}

export function OfertaAdminSheet({ open, onClose, oferta, onUpdated, onDeleted }) {
  const { mounted, visible } = useSheetOpen(open, 220, onClose);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState(null);
  const calendarRef = useRef(null);

  // Al abrir el calendario, hacemos scroll dentro del panel (no de la
  // página) para que quede completo a la vista — el mismo bottom-sheet no
  // crece de alto, pero si el calendario asoma tapado por el borde inferior,
  // este scroll lo trae a la vista con una animación suave en vez de
  // aparecer cortado sin más.
  useEffect(() => {
    if (!calendarOpen) return;
    const raf = requestAnimationFrame(() => {
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => cancelAnimationFrame(raf);
  }, [calendarOpen]);

  // Reseteo de sub-estados de UI (no del sheet en sí) cada vez que se abre
  // para una oferta distinta o se vuelve a abrir — evita arrastrar
  // "confirmando eliminar" o el calendario abierto de una apertura anterior.
  const [lastId, setLastId] = useState(oferta?.id);
  if (oferta?.id !== lastId) {
    setLastId(oferta?.id);
    if (confirmDelete) setConfirmDelete(false);
    if (calendarOpen) setCalendarOpen(false);
  }

  if (!mounted || !oferta) return null;

  const vencida = oferta.expireAt && new Date(oferta.expireAt).getTime() < Date.now();
  const oculta = oferta.visible === false;

  // patch() YA NO cierra el sheet — el dueño puede seguir ajustando otras
  // cosas de la misma oferta sin reabrir el menú (pedido explícito: "sheet
  // se queda abierto, el botón cambia al instante").
  async function patch(body, { closeCalendar } = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/ofertas`, {
        method: 'PATCH', authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: oferta.id, ...body }),
      });
      if (!res.ok) throw new Error();
      onUpdated(await res.json());
      if (closeCalendar) setCalendarOpen(false);
    } catch {
      setError('No se pudo guardar el cambio');
    } finally {
      setBusy(false);
    }
  }

  async function eliminar() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/ofertas?id=${oferta.id}`, { method: 'DELETE', authRequired: true });
      if (!res.ok) throw new Error();
      onDeleted(oferta.id);
      onClose();
    } catch {
      setError('No se pudo eliminar');
      setBusy(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4730, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <style>{SHEET_TRANSITION_CSS}</style>
      <style>{`
        .oas-close { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
        @media (hover: hover) { .oas-close:hover { filter: brightness(0.85); } }
        .oas-close:active { transform: scale(0.9); transition: transform .06s ease; }
        .oas-row { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
        @media (hover: hover) { .oas-row:hover { filter: brightness(0.95); } }
        .oas-row:active { transform: scale(0.97); transition: transform .06s ease; }
      `}</style>
      <div onClick={busy ? undefined : onClose} className={`tp-sheet-ov ${visible ? 'in' : ''}`} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div className={`tp-sheet-panel tp-sheet-scroll ${visible ? 'in' : ''}`} style={{
        position: 'relative', background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
        boxShadow: SHADOW.xl, maxHeight: '80vh', overflowY: 'auto', ...F,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--tp-border)', margin: '10px auto 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 14px', borderBottom: '1px solid var(--tp-border)' }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 15, fontWeight: 800, color: 'var(--tp-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{oferta.nombre}</h3>
          <button onClick={onClose} disabled={busy} aria-label="Cerrar" className="no-press oas-close" style={{
            width: 32, height: 32, border: 'none', borderRadius: RADIUS.md, background: 'var(--tp-surface2)',
            color: 'var(--tp-text-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
          }}><X size={16} /></button>
        </div>

        <div style={{ padding: '14px 18px 28px' }}>
          {error && <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#EF4444' }}>{error}</p>}

          {/* 3 acciones en una sola fila — ícono arriba, label chico abajo. */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => patch({ visible: oculta })} disabled={busy} className="no-press oas-row" style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 6px', border: 'none', borderRadius: RADIUS.lg,
              background: 'var(--tp-surface2)', color: 'var(--tp-text)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            }}>
              {oculta ? <Eye size={19} style={{ color: 'var(--tp-primary)' }} /> : <EyeOff size={19} style={{ color: 'var(--tp-text-muted)' }} />}
              {oculta ? 'Mostrar' : 'Ocultar'}
            </button>

            <button onClick={() => setCalendarOpen((v) => !v)} disabled={busy} className="no-press oas-row" style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 6px', border: 'none', borderRadius: RADIUS.lg,
              background: calendarOpen ? 'color-mix(in srgb, var(--tp-primary) 14%, transparent)' : 'var(--tp-surface2)',
              color: vencida ? '#EF4444' : 'var(--tp-text)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            }}>
              <CalendarClock size={19} style={{ color: vencida ? '#EF4444' : calendarOpen ? 'var(--tp-primary)' : 'var(--tp-text-muted)' }} />
              {oferta.expireAt ? new Date(oferta.expireAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) : 'Vencimiento'}
            </button>

            <button onClick={() => setConfirmDelete(true)} disabled={busy} className="no-press oas-row" style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 6px', border: 'none', borderRadius: RADIUS.lg,
              background: 'var(--tp-surface2)', color: '#EF4444', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            }}>
              <Trash2 size={19} />
              Eliminar
            </button>
          </div>

          {/* Calendario custom in-sheet — reemplaza al <input type="date">
              nativo del sistema, mismos tokens --tp-* que el resto de la
              tienda pública. "Sin vencimiento" limpia expireAt en un toque.
              ref + scrollIntoView (ver useEffect arriba): si al desplegarse
              queda parcialmente tapado por el borde inferior del sheet, se
              trae a la vista con scroll suave dentro del panel. */}
          {calendarOpen && (
            <div ref={calendarRef} style={{ marginTop: 10, padding: 10, borderRadius: RADIUS.lg, background: 'var(--tp-surface2)' }}>
              <TpMiniCalendario
                valueISO={fechaInputValue(oferta.expireAt)}
                onPick={(iso) => patch({ expireAt: new Date(iso).toISOString() }, { closeCalendar: true })}
              />
              {oferta.expireAt && (
                <button onClick={() => patch({ expireAt: null }, { closeCalendar: true })} disabled={busy} className="no-press oas-row" style={{
                  width: '100%', marginTop: 8, padding: '9px', border: 'none', borderRadius: RADIUS.md,
                  background: 'transparent', color: 'var(--tp-text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>Quitar fecha de vencimiento</button>
              )}
            </div>
          )}

          {confirmDelete && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '10px 12px', borderRadius: RADIUS.lg, background: 'color-mix(in srgb, #EF4444 10%, transparent)' }}>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--tp-text)' }}>¿Eliminar esta oferta?</span>
              <button onClick={() => setConfirmDelete(false)} disabled={busy} className="no-press oas-row" style={{
                padding: '8px 14px', border: `1px solid var(--tp-border)`, borderRadius: RADIUS.md,
                background: 'transparent', color: 'var(--tp-text)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={eliminar} disabled={busy} className="no-press oas-row" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', border: 'none', borderRadius: RADIUS.md,
                background: '#EF4444', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              }}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
