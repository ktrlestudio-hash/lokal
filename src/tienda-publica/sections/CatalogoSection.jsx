/**
 * CatalogoSection / CatalogoModal — mismo patrón dual que MapaSection.jsx
 * (Fase 6 del plan): una card-preview chica vive en el scroll normal de la
 * tienda; al tocarla, abre CatalogoModal, un modal fullscreen con TODO el
 * contenido (buscador, filtro, ordenar, chips de categoría, grilla agrupada)
 * que antes vivía inline en commerce-modern.jsx.
 *
 * Todo el estado de búsqueda/filtro/orden/categoría vive DENTRO de
 * CatalogoModal (self-contained, como sat/userPos/route en MapaModal) — no
 * tiene consumidores fuera de su propia UI. Carrito, detalle de producto y
 * gestión del dueño siguen siendo infraestructura del padre
 * (TemplateCommerceModern), pasada por props.
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Filter, ArrowUpDown, ShoppingBag } from 'lucide-react';
import { FONT, RADIUS, SHADOW } from '../tokens.js';
import { calcularBadges } from '../../utils/productBadges.js';
import { trackBusqueda } from '../track.js';
import {
  nombreDe, fotoDe, ProductCardList, ProductCardVertical,
  iconoDeCategoria, esCategoriaVertical, Chip, Carrusel, ProductCardGrid,
} from '../components/ProductCards.jsx';
import { FiltrosSheet, OrdenarSheet } from './FiltrosOrdenSheet.jsx';

const F = { fontFamily: FONT.family };
const catDe = p => p.categoria || p.categoryId || null;

const SORT_OPTIONS = [
  { value: 'relevancia',  label: 'Relevancia' },
  { value: 'precio-asc',  label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
  { value: 'nombre-az',   label: 'Nombre A-Z' },
  { value: 'destacados',  label: 'Destacados' },
];

// ── Card-preview: vive en el lugar normal del scroll (mismo layout visual
// que MapaSection: <h2> + card clickeable con borderRadius/boxShadow), no
// se renderiza si no hay productos activos/disponibles.
export function CatalogoSection({ productos, onAbrirModal }) {
  if (!productos.length) return null;
  const previewFotos = productos.slice(0, 4).map(fotoDe).filter(Boolean);
  const surf2 = 'var(--tp-surface2)', border = 'var(--tp-border)', txt = 'var(--tp-text)';

  return (
    <section style={{ padding: '18px 16px 0' }}>
      <h2 style={{ margin: '0 0 .75rem', fontSize: FONT.size?.xl || 18, fontWeight: 900, color: txt, ...F }}>Catálogo</h2>
      <div
        onClick={onAbrirModal}
        role="button" tabIndex={0}
        className="no-press"
        style={{ borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.md, border: `1px solid ${border}`, cursor: 'pointer', position: 'relative', background: surf2 }}
      >
        {previewFotos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(previewFotos.length, 4)}, 1fr)`, height: 140 }}>
            {previewFotos.map((src, i) => (
              <img key={i} src={src} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ))}
          </div>
        ) : (
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={28} style={{ color: 'var(--tp-text-muted)', opacity: 0.5 }} />
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 10, left: 10, pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            borderRadius: 20, padding: '5px 12px',
            fontFamily: FONT.family, fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
            backdropFilter: 'blur(6px)',
          }}>
            Ver catálogo · {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Modal fullscreen: todo el contenido que antes vivía inline. Bloquea el
// scroll del body mientras está montado, mismo criterio que MapaModal.
export function CatalogoModal({
  tienda, esDueño, productos, onClose,
  carritoPropsDe, onOpenDetalle, onOpenAdminMenu, onVerTodosFiltrado,
}) {
  const [query, setQuery] = useState('');
  const [catActiva, setCatActiva] = useState('__todas');
  const [layout, setLayout] = useState('lista');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [filtroBadges, setFiltroBadges] = useState([]);
  const [filtrosAtributos, setFiltrosAtributos] = useState({});
  const [sortBy, setSortBy] = useState('relevancia');
  const searchInputRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Tracking de búsqueda — debounce 800ms, mismo criterio que tenía el
  // catálogo inline: no se trackea al propio dueño revisando su tienda.
  useEffect(() => {
    if (esDueño || !query.trim()) return undefined;
    const t = setTimeout(() => trackBusqueda(tienda.id, query.trim()), 800);
    return () => clearTimeout(t);
  }, [query, tienda.id, esDueño]);

  const activeAttrCount = Object.values(filtrosAtributos).filter(v => v && v.length > 0).length;
  const activeFilterCount = [precioMin !== '' || precioMax !== '', filtroBadges.length > 0].filter(Boolean).length + activeAttrCount;

  const atributosDisponibles = useMemo(() => {
    const map = {};
    const SKIP_KEYS = new Set(['modelo', 'estado']);
    productos.forEach(p => {
      if (!p.attributes) return;
      Object.entries(p.attributes).forEach(([k, v]) => {
        if (SKIP_KEYS.has(k) || !v) return;
        if (!map[k]) map[k] = { key: k, label: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '), values: new Set() };
        map[k].values.add(String(v));
      });
    });
    return Object.values(map).filter(a => a.values.size >= 2).map(a => ({ ...a, values: [...a.values].sort() }));
  }, [productos]);

  const categorias = useMemo(() => {
    const vistas = [];
    for (const p of productos) {
      const c = catDe(p);
      if (c && !vistas.includes(c)) vistas.push(c);
    }
    return vistas;
  }, [productos]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pMin = precioMin !== '' ? Number(precioMin) : null;
    const pMax = precioMax !== '' ? Number(precioMax) : null;
    const base = productos.filter(p => {
      if (catActiva !== '__todas' && catDe(p) !== catActiva) return false;
      if (q && !nombreDe(p).toLowerCase().includes(q) && !(p.descripcion || '').toLowerCase().includes(q)) return false;
      if (filtroBadges.length && !calcularBadges(p).some(id => filtroBadges.includes(id))) return false;
      if (pMin !== null && (p.precio == null || Number(p.precio) < pMin)) return false;
      if (pMax !== null && (p.precio == null || Number(p.precio) > pMax)) return false;
      for (const [key, vals] of Object.entries(filtrosAtributos)) {
        if (!vals || vals.length === 0) continue;
        if (!p.attributes || !vals.includes(String(p.attributes[key]))) return false;
      }
      return true;
    });
    if (sortBy === 'relevancia') return base;
    return [...base].sort((a, b) => {
      if (sortBy === 'precio-asc')  return (a.precio ?? Infinity) - (b.precio ?? Infinity);
      if (sortBy === 'precio-desc') return (b.precio ?? 0) - (a.precio ?? 0);
      if (sortBy === 'nombre-az')   return nombreDe(a).localeCompare(nombreDe(b), 'es');
      if (sortBy === 'destacados')  return (b.rating ?? 0) - (a.rating ?? 0);
      return 0;
    });
  }, [productos, query, catActiva, filtroBadges, precioMin, precioMax, filtrosAtributos, sortBy]);

  const grupos = useMemo(() => {
    if (sortBy !== 'relevancia') {
      return filtrados.length > 0 ? [['Resultados', filtrados]] : [];
    }
    const map = new Map();
    for (const p of filtrados) {
      const c = catDe(p) || 'Otros';
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(p);
    }
    return [...map.entries()];
  }, [filtrados, sortBy]);

  const surf = 'var(--tp-surface)', surf2 = 'var(--tp-surface2)', border = 'var(--tp-border)';
  const txt = 'var(--tp-text)', txtM = 'var(--tp-text-muted)';
  const primary = 'var(--tp-primary)', primarySoft = 'var(--tp-primary-soft)', onPrimary = 'var(--tp-on-primary)';

  const cardProps = { surf, surf2, border, txt, txtM, primary, onPrimary, onOpenAdminMenu };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 4700, background: 'var(--tp-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header fijo — mismo criterio que MapaModal: cerrar + título, acá con
          el buscador+filtro+ordenar debajo (era la barra sticky inline). */}
      <div style={{ flexShrink: 0, background: surf, borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
          <button onClick={onClose} aria-label="Cerrar" style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: surf2, color: txt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={18} />
          </button>
          <h2 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 800, color: txt, ...F }}>Catálogo</h2>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', gap: 10, marginBottom: 12 }}>
          <div className="cm-search-wrap" style={{ position: 'relative', flex: 1 }}>
            <Search size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: txtM, pointerEvents: 'none' }} />
            <input
              ref={searchInputRef}
              className="cm-input"
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar productos…"
              style={{
                width: '100%', padding: `12px ${query ? '36px' : '14px'} 12px 38px`, borderRadius: RADIUS.md,
                borderWidth: '1.5px', borderStyle: 'solid', outline: 'none', fontSize: 14, fontWeight: 500,
                ...F,
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda" className="no-press cm-clear-btn"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', border: 'none', background: surf2, color: txtM, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'filter .15s ease, transform .12s ease' }}>
                <X size={13} />
              </button>
            )}
          </div>
          <button
            className="cm-toggle-btn"
            onClick={() => setFiltersOpen(true)}
            aria-label="Filtros" data-tooltip="Filtros"
            style={{
              width: 46, borderRadius: RADIUS.md, border: `1.5px solid ${activeFilterCount > 0 ? primary : border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, position: 'relative',
              background: activeFilterCount > 0 ? primary : surf2, color: activeFilterCount > 0 ? onPrimary : txt,
            }}>
            <Filter size={18} />
            {activeFilterCount > 0 && (
              <span style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: primary, boxShadow: `0 0 0 2px ${surf}` }} />
            )}
          </button>
          <button
            className="cm-toggle-btn"
            onClick={() => setSortOpen(true)}
            aria-label="Ordenar" data-tooltip="Ordenar"
            style={{ width: 46, borderRadius: RADIUS.md, border: `1.5px solid ${sortBy !== 'relevancia' ? primary : border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, background: surf2, color: sortBy !== 'relevancia' ? primary : txt }}>
            <ArrowUpDown size={18} />
          </button>
        </div>

        {categorias.length > 0 && (
          <div style={{ padding: '0 16px 13px' }}>
            <Carrusel gap={8} className="cm-chips" arrowOffset={10}>
              <Chip label="Todos" Icon={ShoppingBag} active={catActiva === '__todas'} onClick={() => setCatActiva('__todas')}
                primary={primary} onPrimary={onPrimary} surf2={surf2} border={border} txt={txt} />
              {categorias.map(c => (
                <Chip key={c} label={c} Icon={iconoDeCategoria(c)} active={catActiva === c}
                  onClick={() => setCatActiva(catActiva === c ? '__todas' : c)}
                  primary={primary} onPrimary={onPrimary} surf2={surf2} border={border} txt={txt} />
              ))}
            </Carrusel>
          </div>
        )}
      </div>

      {/* Body scrolleable — grilla agrupada, mismo JSX que antes vivía inline. */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '18px 16px 24px' }}>
          {filtrados.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: 56, height: 56, borderRadius: RADIUS.full, background: surf2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                {query
                  ? <Search size={24} style={{ color: txtM }} />
                  : <ShoppingBag size={24} style={{ color: txtM }} />}
              </div>
              {query ? (
                <>
                  <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: txt }}>Sin resultados para &quot;{query}&quot;</p>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: txtM }}>Probá con otra palabra o revisá la ortografía</p>
                  <button onClick={() => setQuery('')} style={{ padding: '9px 18px', borderRadius: RADIUS.md, border: `1.5px solid ${border}`, background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: txt, ...F }}>
                    Limpiar búsqueda
                  </button>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: txtM }}>Todavía no hay productos</p>
              )}
            </div>
          ) : (
            grupos.map(([cat, items]) => {
              const SecIcon = iconoDeCategoria(cat);
              const vertical = esCategoriaVertical(cat);
              const pocasVerticales = vertical && items.length <= 3;
              return (
                <section key={cat} style={{ marginBottom: 26 }}>
                  {(catActiva === '__todas' && categorias.length > 0) && (
                    <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em', color: txt, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 30, height: 30, borderRadius: RADIUS.md, background: primarySoft, color: primary, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <SecIcon size={16} />
                      </span>
                      {cat}
                      <span style={{ fontSize: 12, fontWeight: 600, color: txtM }}>· {items.length}</span>
                      {onVerTodosFiltrado && (
                        <button onClick={() => onVerTodosFiltrado(cat)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12.5, fontWeight: 700, color: primary, ...F }}>
                          Ver todos →
                        </button>
                      )}
                    </h2>
                  )}

                  {vertical && items.length > 3 ? (
                    <Carrusel>
                      {items.map(p => (
                        <ProductCardVertical key={p.id} p={p} onOpen={() => onOpenDetalle(p)} {...cardProps} {...carritoPropsDe(p)} />
                      ))}
                    </Carrusel>
                  ) : items.length === 1 ? (
                    <ProductCardList p={items[0]} onOpen={() => onOpenDetalle(items[0])} {...cardProps} {...carritoPropsDe(items[0])} />
                  ) : pocasVerticales ? (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10 }}>
                      {items.map(p => (
                        <ProductCardVertical key={p.id} p={p} onOpen={() => onOpenDetalle(p)} fluida {...cardProps} {...carritoPropsDe(p)} />
                      ))}
                    </div>
                  ) : layout === 'grilla' ? (
                    <div className="cm-grid">
                      {items.map(p => (
                        <ProductCardGrid key={p.id} p={p} onOpen={() => onOpenDetalle(p)} {...cardProps} {...carritoPropsDe(p)} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {items.map(p => (
                        <ProductCardList key={p.id} p={p} onOpen={() => onOpenDetalle(p)} {...cardProps} {...carritoPropsDe(p)} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
      </div>

      <FiltrosSheet
        open={filtersOpen} onClose={() => setFiltersOpen(false)}
        precioMin={precioMin} setPrecioMin={setPrecioMin}
        precioMax={precioMax} setPrecioMax={setPrecioMax}
        filtroBadges={filtroBadges} setFiltroBadges={setFiltroBadges}
        atributosDisponibles={atributosDisponibles}
        filtrosAtributos={filtrosAtributos} setFiltrosAtributos={setFiltrosAtributos}
        layout={layout} setLayout={setLayout}
        activeFilterCount={activeFilterCount}
        onLimpiar={() => { setPrecioMin(''); setPrecioMax(''); setFiltroBadges([]); setFiltrosAtributos({}); setFiltersOpen(false); }}
      />
      <OrdenarSheet open={sortOpen} onClose={() => setSortOpen(false)} sortBy={sortBy} setSortBy={setSortBy} options={SORT_OPTIONS} />
    </div>,
    document.body
  );
}
