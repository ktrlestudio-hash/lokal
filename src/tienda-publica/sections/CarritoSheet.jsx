/**
 * CarritoSheet — arma el pedido desde el catálogo: repasa los items
 * agregados, deja ajustar cantidad o sacar, pide nombre/teléfono (opcional)
 * y nota, y al confirmar dispara el POST a /carrito. Reemplaza el patrón
 * viejo de "armar un mensaje y mandarlo por WhatsApp" — el resultado es un
 * link propio (CarritoIndividual, ya construido) que el vendedor abre y ve
 * el pedido completo, no un texto suelto a interpretar.
 */
import React, { useState } from 'react';
import { X, Minus, Plus, Trash2, Package, Loader2, Check } from 'lucide-react';
import { RADIUS, SHADOW, FONT } from '../tokens.js';
import { useSheetOpen } from '../hooks/useSheetOpen.js';
import { SHEET_TRANSITION_CSS } from './sheetTransitionCss.js';
import { formatPrice } from '../utils.js';

const F = { fontFamily: FONT.family };
const API_BASE = '/.netlify/functions';

export function CarritoSheet({ open, onClose, tienda, productos, carritoQty, onAdd, onRemove, onEnviado }) {
  const { mounted, visible } = useSheetOpen(open, 220, onClose);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (!mounted) return null;

  const items = Object.entries(carritoQty)
    .map(([id, qty]) => ({ producto: productos.find(p => p.id === id), qty }))
    .filter(x => x.producto && x.qty > 0);
  const total = items.reduce((acc, { producto, qty }) => acc + (producto.precio || 0) * qty, 0);

  const enviarPedido = async () => {
    if (items.length === 0 || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/carrito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiendaId: tienda.id,
          items: items.map(({ producto, qty }) => ({ ofertaId: producto.id, qty })),
          cliente: { nombre: nombre.trim() || null, telefono: telefono.trim() || null },
          nota: nota.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'No se pudo enviar el pedido');
      }
      const { carrito } = await res.json();
      onEnviado(carrito);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4720, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <style>{SHEET_TRANSITION_CSS}</style>
      <div onClick={onClose} className={`tp-sheet-ov ${visible ? 'in' : ''}`} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div className={`tp-sheet-panel tp-sheet-scroll ${visible ? 'in' : ''}`} style={{
        position: 'relative', background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: SHADOW.xl, ...F,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--tp-border)', margin: '10px auto 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 14px', borderBottom: '1px solid var(--tp-border)' }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 800, color: 'var(--tp-text)' }}>Tu pedido</h3>
          <button onClick={onClose} aria-label="Cerrar" className="tp-sheet-close" style={{
            width: 32, height: 32, border: 'none', borderRadius: RADIUS.md, background: 'var(--tp-surface2)',
            color: 'var(--tp-text-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}><X size={16} /></button>
        </div>

        <div style={{ padding: '14px 18px 24px', overflowY: 'auto', flex: 1 }}>
          {items.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--tp-text-muted)' }}>
              <Package size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14 }}>Todavía no agregaste nada</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {items.map(({ producto: p, qty }) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: RADIUS.md, background: 'var(--tp-surface2)', overflow: 'hidden', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                      {p.fotos?.[0] || p.foto
                        ? <img src={p.fotos?.[0] || p.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Package size={16} style={{ color: 'var(--tp-text-muted)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--tp-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.titulo || p.nombre}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--tp-text-muted)' }}>{p.precio != null ? formatPrice(p.precio) : '—'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--tp-surface2)', border: '1px solid var(--tp-border)', borderRadius: RADIUS.md, padding: 3, flexShrink: 0 }}>
                      <button onClick={() => onRemove(p.id)} aria-label="Restar" style={{ width: 26, height: 26, border: 'none', borderRadius: RADIUS.sm, background: 'transparent', color: 'var(--tp-text)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                        {qty === 1 ? <Trash2 size={13} /> : <Minus size={14} />}
                      </button>
                      <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 800, fontSize: 13, color: 'var(--tp-text)' }}>{qty}</span>
                      <button onClick={() => onAdd(p)} aria-label="Sumar" style={{ width: 26, height: 26, border: 'none', borderRadius: RADIUS.sm, background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: RADIUS.lg, background: 'var(--tp-surface2)', marginBottom: 20 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--tp-text-muted)' }}>Total</span>
                <span style={{ fontSize: 19, fontWeight: 900, color: 'var(--tp-text)' }}>{formatPrice(total)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre (opcional)"
                  style={{ padding: '11px 13px', borderRadius: RADIUS.md, border: '1.5px solid var(--tp-border)', background: 'var(--tp-surface2)', color: 'var(--tp-text)', fontSize: 14, outline: 'none', ...F }} />
                <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Tu teléfono (opcional)" inputMode="tel"
                  style={{ padding: '11px 13px', borderRadius: RADIUS.md, border: '1.5px solid var(--tp-border)', background: 'var(--tp-surface2)', color: 'var(--tp-text)', fontSize: 14, outline: 'none', ...F }} />
                <textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="Nota para el vendedor (opcional)" rows={2}
                  style={{ padding: '11px 13px', borderRadius: RADIUS.md, border: '1.5px solid var(--tp-border)', background: 'var(--tp-surface2)', color: 'var(--tp-text)', fontSize: 14, outline: 'none', resize: 'none', ...F }} />
              </div>

              {error && <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#ef4444', fontWeight: 600 }}>{error}</p>}

              <button onClick={enviarPedido} disabled={enviando} className="no-press" style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', border: 'none', borderRadius: RADIUS.lg,
                background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', fontWeight: 800, fontSize: 15,
                cursor: enviando ? 'default' : 'pointer', opacity: enviando ? 0.7 : 1, ...F,
              }}>
                {enviando ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
                {enviando ? 'Enviando...' : 'Enviar pedido'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
