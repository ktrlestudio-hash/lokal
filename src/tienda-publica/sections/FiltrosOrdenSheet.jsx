/**
 * FiltrosSheet / OrdenarSheet — subconjunto acotado del sistema completo
 * de filtros de TodasOfertasScreen.jsx, portado al catálogo de UNA tienda
 * (commerce-modern.jsx). Categoría no se duplica acá: ya la cubren los
 * chips existentes arriba del catálogo. El toggle lista/grilla vive en la
 * barra fija de CatalogoModal (segmented control), mismo lugar que el
 * admin (ProductosScreen.jsx) — no dentro de este sheet.
 */
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { RADIUS, SHADOW, FONT } from '../tokens.js';
import { useSheetOpen } from '../hooks/useSheetOpen.js';
import { SHEET_TRANSITION_CSS } from './sheetTransitionCss.js';
import { BADGE_CONFIG } from '../../utils/productBadges.js';

const F = { fontFamily: FONT.family };

function SheetShell({ open, onClose, title, children }) {
  const { mounted, visible } = useSheetOpen(open, 220, onClose);
  if (!mounted) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4720, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <style>{SHEET_TRANSITION_CSS}</style>
      <div onClick={onClose} className={`tp-sheet-ov ${visible ? 'in' : ''}`} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div className={`tp-sheet-panel tp-sheet-scroll ${visible ? 'in' : ''}`} style={{
        position: 'relative', background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: SHADOW.xl, ...F,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--tp-border)', margin: '10px auto 4px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 14px', borderBottom: '1px solid var(--tp-border)' }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 800, color: 'var(--tp-text)' }}>{title}</h3>
          {/* Sin className/:hover — mismo hueco que tenían las X de
              HorariosSheet/ShareSheet, ningún feedback al pasar el mouse. */}
          <style>{`
            @media (hover: hover) { .tp-sheet-close:hover { filter: brightness(0.85); } }
            .tp-sheet-close:active { transform: scale(0.9); transition: transform .06s ease; }
          `}</style>
          <button onClick={onClose} aria-label="Cerrar" className="tp-sheet-close" style={{
            width: 32, height: 32, border: 'none', borderRadius: RADIUS.md, background: 'var(--tp-surface2)',
            color: 'var(--tp-text-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease',
          }}><X size={16} /></button>
        </div>
        <div style={{ padding: '14px 18px 24px', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

const sectionLabel = { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--tp-text-muted)', margin: '0 0 8px' };

// Colores hex por badge — misma familia que BADGE_CONFIG (emerald/amber),
// pero en hex porque este sheet usa style inline, no clases Tailwind.
// "oferta" usa el primary de la tienda (var css) en vez de un hex fijo.
const BADGE_CHIP_COLORS = {
  nuevo: { activeBg: '#10b981', activeColor: '#fff', softBg: 'rgba(16,185,129,.12)', softColor: '#059669' },
  oferta: { activeBg: 'var(--tp-primary)', activeColor: 'var(--tp-on-primary)', softBg: 'var(--tp-primary-soft)', softColor: 'var(--tp-primary)' },
  por_vencer: { activeBg: '#f59e0b', activeColor: '#fff', softBg: 'rgba(245,158,11,.12)', softColor: '#b45309' },
};

// Chip "rápido" tipo pastel — mismo patrón visual que qDescuento en
// TodasOfertasScreen.jsx (fondo pastel del color semántico, texto/ícono a
// juego; activo = color sólido + texto blanco).
function ChipRapido({ active, onClick, Icon, label, activeBg, softBg, activeColor, softColor }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 999,
      border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, transition: 'all .15s ease', ...F,
      background: active ? activeBg : softBg, color: active ? activeColor : softColor,
    }}>
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );
}

export function FiltrosSheet({
  open, onClose,
  precioMin, setPrecioMin, precioMax, setPrecioMax,
  filtroBadges = [], setFiltroBadges,
  atributosDisponibles = [], filtrosAtributos = {}, setFiltrosAtributos,
  onLimpiar, activeFilterCount,
}) {
  // Input "borrador": no aplica en cada tecla, solo al tocar OK o Enter —
  // mismo patrón que TodasOfertasScreen.jsx (precioMinInput/applyPrecio).
  // Se resincroniza con el valor real cuando cambia desde afuera (ej. al
  // limpiar filtros) o al reabrir el sheet.
  const [minDraft, setMinDraft] = useState(precioMin);
  const [maxDraft, setMaxDraft] = useState(precioMax);
  useEffect(() => { if (open) { setMinDraft(precioMin); setMaxDraft(precioMax); } }, [open, precioMin, precioMax]);
  const applyPrecio = () => { setPrecioMin(minDraft); setPrecioMax(maxDraft); };

  const chips = [
    ...filtroBadges.map((id) => ({
      key: `badge_${id}`,
      label: BADGE_CONFIG[id]?.label || id,
      onRemove: () => setFiltroBadges(prev => prev.filter(x => x !== id)),
    })),
    ...Object.entries(filtrosAtributos).filter(([, v]) => v && v.length > 0).flatMap(([k, vals]) =>
      vals.map(v => ({
        key: `attr_${k}_${v}`,
        label: `${k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ')}: ${v}`,
        onRemove: () => setFiltrosAtributos(f => ({ ...f, [k]: (f[k] || []).filter(x => x !== v) })),
      }))
    ),
    ...((precioMin !== '' || precioMax !== '') ? [{
      key: 'precio',
      label: `$${precioMin ? Number(precioMin).toLocaleString('es-AR') : '0'} — $${precioMax ? Number(precioMax).toLocaleString('es-AR') : '∞'}`,
      onRemove: () => { setPrecioMin(''); setPrecioMax(''); },
    }] : []),
  ];

  return (
    <SheetShell open={open} onClose={onClose} title="Filtros">
      {chips.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={sectionLabel}>Filtros aplicados</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {chips.map(c => (
              <button key={c.key} onClick={c.onRemove} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 8px 7px 13px', borderRadius: 999,
                border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', ...F,
              }}>
                {c.label}<X size={12} style={{ opacity: .8 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <p style={sectionLabel}>Filtros rápidos</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(BADGE_CONFIG).map(([id, cfg]) => {
            const c = BADGE_CHIP_COLORS[id];
            return (
              <ChipRapido key={id} active={filtroBadges.includes(id)} Icon={cfg.Icon} label={cfg.label}
                onClick={() => setFiltroBadges(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                activeBg={c.activeBg} activeColor={c.activeColor} softBg={c.softBg} softColor={c.softColor} />
            );
          })}
        </div>
      </div>

      {/* Atributos dinámicos — derivados de los productos reales de esta
          tienda (tamaño, apto celíaco, con extra, etc). Mismo patrón de
          chip que la categoría en TodasOfertasScreen.jsx. */}
      {atributosDisponibles.map(attr => (
        <div key={attr.key} style={{ marginBottom: 20 }}>
          <p style={sectionLabel}>{attr.label}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {attr.values.map(val => {
              const active = (filtrosAtributos[attr.key] || []).includes(val);
              return (
                <button key={val} onClick={() => setFiltrosAtributos(f => {
                  const prev = f[attr.key] || [];
                  return { ...f, [attr.key]: active ? prev.filter(x => x !== val) : [...prev, val] };
                })} style={{
                  padding: '7px 13px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, ...F,
                  background: active ? 'var(--tp-text)' : 'var(--tp-surface2)', color: active ? 'var(--tp-surface)' : 'var(--tp-text-muted)',
                }}>
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ marginBottom: chips.length || activeFilterCount ? 20 : 4 }}>
        <p style={sectionLabel}>Precio</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tp-text-muted)', fontSize: 12.5, pointerEvents: 'none' }}>$</span>
            <input type="text" inputMode="numeric" placeholder="0" value={minDraft}
              onChange={e => setMinDraft(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && applyPrecio()}
              style={{ width: '100%', padding: '10px 10px 10px 22px', borderRadius: RADIUS.md, border: '1.5px solid var(--tp-border)', background: 'var(--tp-surface2)', color: 'var(--tp-text)', fontSize: 14, outline: 'none', ...F }} />
          </div>
          <span style={{ color: 'var(--tp-text-muted)', fontSize: 13, flexShrink: 0 }}>—</span>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tp-text-muted)', fontSize: 12.5, pointerEvents: 'none' }}>$</span>
            <input type="text" inputMode="numeric" placeholder="∞" value={maxDraft}
              onChange={e => setMaxDraft(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && applyPrecio()}
              style={{ width: '100%', padding: '10px 10px 10px 22px', borderRadius: RADIUS.md, border: '1.5px solid var(--tp-border)', background: 'var(--tp-surface2)', color: 'var(--tp-text)', fontSize: 14, outline: 'none', ...F }} />
          </div>
          <button onClick={applyPrecio} style={{ flexShrink: 0, padding: '10px 14px', borderRadius: RADIUS.md, border: 'none', background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', ...F }}>OK</button>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button onClick={onLimpiar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13.5, fontWeight: 700, color: '#ef4444', ...F }}>
          Limpiar todos los filtros
        </button>
      )}
    </SheetShell>
  );
}

export function OrdenarSheet({ open, onClose, sortBy, setSortBy, options }) {
  return (
    <SheetShell open={open} onClose={onClose} title="Ordenar por">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {options.map(opt => (
          <button key={opt.value} onClick={() => { setSortBy(opt.value); onClose(); }} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 12px',
            borderRadius: RADIUS.md, border: 'none', background: sortBy === opt.value ? 'var(--tp-primary-soft)' : 'transparent',
            cursor: 'pointer', textAlign: 'left', ...F,
          }}>
            <span style={{ fontSize: 14.5, fontWeight: sortBy === opt.value ? 800 : 500, color: sortBy === opt.value ? 'var(--tp-primary)' : 'var(--tp-text)' }}>{opt.label}</span>
            {sortBy === opt.value && <Check size={17} color="var(--tp-primary)" />}
          </button>
        ))}
      </div>
    </SheetShell>
  );
}
