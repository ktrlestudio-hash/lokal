/**
 * CartSheet — panel de carrito real (no un link directo a WhatsApp).
 * Patrón tipo Rappi/PedidosYa: bottom sheet con lista de items, +/-, nota
 * de pedido y un solo botón de confirmación al pie que arma el mensaje de
 * WhatsApp recién ahí. Compartido por todos los templates de tienda-publica.
 */
import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, MessageCircle, Store, Bike, MapPin, LocateFixed, Loader2, Check } from 'lucide-react';
import { FONT, RADIUS, SHADOW } from '../tokens.js';
import { buildWhatsAppUrl, formatPrice } from '../utils.js';

const F = { fontFamily: FONT.family };

/* Botón de modo de entrega (retiro/delivery) */
function ModoBtn({ active, onClick, Icon, label }) {
  return (
    <button onClick={onClick} className="no-press" style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '12px 8px', borderRadius: RADIUS.md, cursor: 'pointer',
      border: `1.5px solid ${active ? 'var(--tp-primary)' : 'var(--tp-border)'}`,
      background: active ? 'var(--tp-primary-soft)' : 'var(--tp-surface2)',
      color: active ? 'var(--tp-primary)' : 'var(--tp-text-muted)',
      fontSize: 13, fontWeight: 700, transition: 'all .15s ease', ...F,
    }}>
      <Icon size={20} />
      {label}
    </button>
  );
}

const SPIN_CSS = `
@keyframes cm-spin { to { transform: rotate(360deg); } }
.cm-spin { animation: cm-spin 1s linear infinite; }

/* Los tokens --tp-* son alias de los tokens reales de LOKAL (ver
   src/index.css §4.bis) — ya no hace falta !important. */
.cm-input { background: var(--tp-surface2); color: var(--tp-text); border-color: var(--tp-border); }
.cm-input:focus { border-color: var(--tp-primary); }
.cm-input::placeholder { color: var(--tp-text-muted); opacity: 1; }
`;

// El FAB vive en un wrapper `position: sticky; bottom` colocado en el flujo
// normal del documento, justo antes del footer (ver TiendaPublicaRenderer).
// El navegador se encarga solo de "despegarlo" al llegar al final — sin
// IntersectionObserver ni JS de scroll: cuando el contenedor padre se
// termina (porque empieza el footer), sticky dentro de un fragmento nunca
// se despega, así que el ancla real es que este wrapper mide 0 de alto y
// está posicionado *antes* del footer en el árbol, no encima.
export function CartFab({ cart, onOpen }) {
  const count = cart.reduce((a, i) => a + i.qty, 0);
  if (count === 0) return null;
  const total = cart.reduce((a, i) => a + (i.precio || 0) * i.qty, 0);
  return (
    <div style={{ position: 'sticky', bottom: 18, zIndex: 200, display: 'flex', justifyContent: 'center', height: 0, overflow: 'visible', pointerEvents: 'none' }}>
    <button
      onClick={onOpen}
      style={{
        pointerEvents: 'auto',
        display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 20px',
        border: 'none', borderRadius: RADIUS.full, background: 'var(--tp-primary)', color: 'var(--tp-on-primary)',
        fontWeight: 800, fontSize: 14, boxShadow: SHADOW.lg, cursor: 'pointer', ...F,
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.18)', fontSize: 12, fontWeight: 900,
      }}>{count}</span>
      Ver pedido
      <span style={{ opacity: 0.85 }}>· {formatPrice(total)}</span>
    </button>
    </div>
  );
}

export function CartSheet({ open, onClose, tienda, cart, onAdd, onRemove, onClear, note, setNote }) {
  const [modo, setModo] = useState('retiro'); // 'retiro' | 'delivery'
  const [direccion, setDireccion] = useState('');
  const [mapUrl, setMapUrl] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const total = cart.reduce((a, i) => a + (i.precio || 0) * i.qty, 0);
  const entrega = { modo, direccion, mapUrl };
  const wa = buildWhatsAppUrl(tienda, cart, note, entrega);
  // Delivery exige al menos dirección o ubicación antes de confirmar.
  const deliveryIncompleto = modo === 'delivery' && !direccion.trim() && !mapUrl;

  const ubicarme = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setMapUrl(`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <style>{SPIN_CSS}</style>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div style={{
        position: 'relative', background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: SHADOW.xl, ...F,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--tp-border)', margin: '10px auto 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 14px', borderBottom: '1px solid var(--tp-border)' }}>
          <ShoppingBag size={18} style={{ color: 'var(--tp-primary)' }} />
          <h3 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 800, color: 'var(--tp-text)' }}>Tu pedido</h3>
          <button onClick={onClose} aria-label="Cerrar" style={{
            width: 32, height: 32, border: 'none', borderRadius: RADIUS.full, background: 'var(--tp-surface2)',
            color: 'var(--tp-text-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}><X size={16} /></button>
        </div>

        {cart.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--tp-text-muted)' }}>
            <ShoppingBag size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Todavía no agregaste nada</p>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', padding: '10px 18px', flex: 1 }}>
            {cart.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: '1px solid var(--tp-border)',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: RADIUS.md, background: 'var(--tp-surface2)',
                  overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.foto
                    ? <img src={item.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <ShoppingBag size={18} style={{ color: 'var(--tp-text-muted)' }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--tp-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: 'var(--tp-primary)' }}>{formatPrice(item.precio)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => onRemove(item.id)} aria-label="Quitar uno" style={{
                    width: 28, height: 28, border: '1px solid var(--tp-border)', borderRadius: RADIUS.full,
                    background: 'var(--tp-surface)', color: 'var(--tp-text)', display: 'grid', placeItems: 'center', cursor: 'pointer',
                  }}>
                    {item.qty === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                  </button>
                  <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 800, fontSize: 14, color: 'var(--tp-text)' }}>{item.qty}</span>
                  <button onClick={() => onAdd(item)} aria-label="Agregar uno" style={{
                    width: 28, height: 28, border: 'none', borderRadius: RADIUS.full,
                    background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', display: 'grid', placeItems: 'center', cursor: 'pointer',
                  }}><Plus size={13} /></button>
                </div>
              </div>
            ))}

            {/* ── Modo de entrega: Retiro / Delivery ── */}
            <div style={{ marginTop: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12.5, fontWeight: 800, color: 'var(--tp-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>¿Cómo lo querés?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <ModoBtn active={modo === 'retiro'} onClick={() => setModo('retiro')} Icon={Store} label="Retiro en local" />
                <ModoBtn active={modo === 'delivery'} onClick={() => setModo('delivery')} Icon={Bike} label="Envío a domicilio" />
              </div>
            </div>

            {/* Dirección + ubicación (solo delivery) */}
            {modo === 'delivery' && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--tp-text-muted)' }} />
                  <input
                    className="cm-input"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    placeholder="Dirección de entrega (calle, número, piso…)"
                    style={{
                      width: '100%', padding: '11px 12px 11px 34px', borderRadius: RADIUS.md,
                      border: '1.5px solid var(--tp-border)', outline: 'none', fontSize: 13.5, fontWeight: 500,
                      background: 'var(--tp-surface2)', color: 'var(--tp-text)', ...F,
                    }}
                  />
                </div>
                <button
                  onClick={ubicarme}
                  disabled={locating}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px', borderRadius: RADIUS.md, cursor: locating ? 'default' : 'pointer',
                    border: `1.5px solid ${mapUrl ? '#16a34a' : 'var(--tp-border)'}`,
                    background: mapUrl ? 'rgba(22,163,74,.08)' : 'var(--tp-surface)',
                    color: mapUrl ? '#16a34a' : 'var(--tp-text)', fontSize: 13.5, fontWeight: 700, ...F,
                  }}>
                  {locating ? <Loader2 size={15} className="cm-spin" /> : mapUrl ? <Check size={15} /> : <LocateFixed size={15} />}
                  {locating ? 'Ubicando…' : mapUrl ? 'Ubicación adjuntada' : 'Usar mi ubicación actual'}
                </button>
              </div>
            )}

            <textarea
              className="cm-input"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Notas para el pedido (ej: sin cebolla, tocar timbre)…"
              rows={2}
              style={{
                width: '100%', marginTop: 12, padding: '10px 12px', borderRadius: RADIUS.md,
                border: '1px solid var(--tp-border)', outline: 'none', fontSize: 13, resize: 'none',
                background: 'var(--tp-surface2)', color: 'var(--tp-text)', ...F,
              }}
            />
          </div>
        )}

        {cart.length > 0 && (
          <div style={{ padding: '14px 18px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--tp-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--tp-text-muted)', fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--tp-text)' }}>{formatPrice(total)}</span>
            </div>
            {(() => {
              const habilitado = wa && !deliveryIncompleto;
              const label = !wa ? 'Tienda sin WhatsApp configurado'
                : deliveryIncompleto ? 'Agregá una dirección o ubicación'
                : 'Confirmar pedido por WhatsApp';
              return (
                <a
                  href={habilitado ? wa : undefined}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e => { if (!habilitado) e.preventDefault(); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '14px', borderRadius: RADIUS.lg, border: 'none',
                    background: habilitado ? '#25D366' : 'var(--tp-surface2)', color: habilitado ? '#fff' : 'var(--tp-text-muted)',
                    fontWeight: 800, fontSize: 15, textDecoration: 'none', cursor: habilitado ? 'pointer' : 'default', ...F,
                  }}
                >
                  <MessageCircle size={19} />
                  {label}
                </a>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
