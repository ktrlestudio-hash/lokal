/**
 * OfertaQuickForm — carga rápida de oferta DIRECTO desde la vista pública de
 * tienda (FAB "+"), sin ir al panel admin. Mismo endpoint (POST /ofertas) y
 * mismos campos que OfertaFormOverlay en StoreApp.jsx — no se duplica la
 * lógica de guardado, solo se monta en un bottom-sheet en vez del overlay de
 * página completa (acá no hay StorePageHeader ni layout de panel).
 *
 * Solo visible/montable cuando el dueño logueado ve su propia tienda
 * (ver "esDueño" en TiendaPublica.jsx / prop mismo nombre acá).
 */
import React, { useState } from 'react';
import { X, Camera, Loader2, Save, CalendarClock } from 'lucide-react';
import { uploadFile } from '../../storeFormUtils.jsx';
import { apiFetch } from '../../api.js';
import { haptic } from '../../haptic.js';
import { useSheetOpen } from '../hooks/useSheetOpen.js';
import { SHEET_TRANSITION_CSS } from './sheetTransitionCss.js';
import { TpMiniCalendario } from '../components/TpMiniCalendario.jsx';
import { RADIUS, SHADOW, FONT } from '../tokens.js';

const API_BASE = '/.netlify/functions';
const F = { fontFamily: FONT.family };

export function OfertaQuickForm({ open, onClose, tienda, onCreated }) {
  const { mounted, visible } = useSheetOpen(open, 220, onClose);
  const [nombre, setNombre] = useState('');
  const [expireAt, setExpireAt] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  if (!mounted) return null;

  const reset = () => {
    setNombre(''); setExpireAt(''); setFotoFile(null); setFotoPreview(null); setErr(null); setCalendarOpen(false);
  };

  const handleFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!nombre.trim() || !fotoFile) return;
    setSaving(true); setErr(null);
    try {
      const imageUrl = await uploadFile(fotoFile);
      const payload = {
        tiendaId: tienda.id,
        nombre: nombre.trim(),
        imageUrl,
        thumbUrl: imageUrl,
        expireAt: expireAt ? new Date(expireAt).toISOString() : null,
        visible: true,
      };
      const res = await apiFetch(`${API_BASE}/ofertas`, {
        method: 'POST', authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('No se pudo publicar la oferta');
      const nueva = await res.json();
      haptic('success');
      onCreated?.(nueva);
      reset();
      onClose();
    } catch (e) {
      setErr(e.message);
      haptic('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4720, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <style>{SHEET_TRANSITION_CSS}</style>
      <style>{`
        .oqf-close { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
        @media (hover: hover) { .oqf-close:hover { filter: brightness(0.85); } }
        .oqf-close:active { transform: scale(0.9); transition: transform .06s ease; }
        .oqf-photo { transition: border-color .15s ease; }
        @media (hover: hover) { .oqf-photo:hover { border-color: var(--tp-primary); } }
        .oqf-save { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
        .oqf-save:active:not(:disabled) { transform: scale(0.97); transition: transform .06s ease; }
      `}</style>
      <div onClick={onClose} className={`tp-sheet-ov ${visible ? 'in' : ''}`} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div className={`tp-sheet-panel ${visible ? 'in' : ''}`} style={{
        position: 'relative', background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
        boxShadow: SHADOW.xl, maxHeight: '88vh', overflowY: 'auto', ...F,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--tp-border)', margin: '10px auto 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 14px', borderBottom: '1px solid var(--tp-border)' }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 800, color: 'var(--tp-text)' }}>Nueva oferta</h3>
          <button onClick={onClose} aria-label="Cerrar" className="no-press oqf-close" style={{
            width: 32, height: 32, border: 'none', borderRadius: RADIUS.md, background: 'var(--tp-surface2)',
            color: 'var(--tp-text-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}><X size={16} /></button>
        </div>

        <div style={{ padding: '16px 18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--tp-text-muted)', marginBottom: 8 }}>Foto</label>
            <label className="oqf-photo" style={{
              display: 'block', aspectRatio: '1', borderRadius: RADIUS.lg, border: `2px dashed var(--tp-border)`,
              background: 'var(--tp-surface2)', overflow: 'hidden', cursor: 'pointer', position: 'relative',
            }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
              {fotoPreview
                ? <img src={fotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--tp-text-muted)' }}>
                    <Camera size={28} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Elegir foto</span>
                  </div>
                )}
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--tp-text-muted)', marginBottom: 8 }}>Nombre</label>
            <input
              value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: 2x1 en aceite de girasol" maxLength={160}
              style={{ width: '100%', padding: '12px 14px', borderRadius: RADIUS.md, border: `1.5px solid var(--tp-border)`, background: 'var(--tp-surface2)', color: 'var(--tp-text)', fontSize: 14, outline: 'none', ...F }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--tp-text-muted)', marginBottom: 8 }}>Vence (opcional)</label>
            <button type="button" onClick={() => setCalendarOpen((v) => !v)} className="no-press" style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: RADIUS.md,
              border: `1.5px solid ${calendarOpen ? 'var(--tp-primary)' : 'var(--tp-border)'}`, background: 'var(--tp-surface2)',
              color: expireAt ? 'var(--tp-text)' : 'var(--tp-text-muted)', fontSize: 14, cursor: 'pointer', ...F,
            }}>
              <CalendarClock size={17} style={{ color: expireAt ? 'var(--tp-primary)' : 'var(--tp-text-muted)', flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: 'left' }}>
                {expireAt ? new Date(expireAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin fecha de vencimiento'}
              </span>
            </button>
            {calendarOpen && (
              <div style={{ marginTop: 8, padding: 10, borderRadius: RADIUS.lg, background: 'var(--tp-surface2)' }}>
                <TpMiniCalendario valueISO={expireAt} onPick={(iso) => { setExpireAt(iso); setCalendarOpen(false); }} />
                {expireAt && (
                  <button type="button" onClick={() => { setExpireAt(''); setCalendarOpen(false); }} className="no-press" style={{
                    width: '100%', marginTop: 8, padding: '9px', border: 'none', borderRadius: RADIUS.md,
                    background: 'transparent', color: 'var(--tp-text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>Quitar fecha de vencimiento</button>
                )}
              </div>
            )}
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--tp-text-muted)' }}>Sin fecha, la oferta queda vigente hasta que la ocultes desde el panel.</p>
          </div>

          {err && <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#EF4444' }}>{err}</p>}

          <button onClick={handleSave} disabled={saving || !nombre.trim() || !fotoFile} className="no-press oqf-save"
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: RADIUS.lg, cursor: 'pointer',
              background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', fontWeight: 800, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (saving || !nombre.trim() || !fotoFile) ? .5 : 1,
            }}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Publicar oferta
          </button>
        </div>
      </div>
    </div>
  );
}
