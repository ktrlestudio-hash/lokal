/**
 * OfertasSection / OfertasModal — mismo patrón dual que CatalogoSection.jsx
 * y MapaSection.jsx (Fase 6 del plan): una card-preview chica vive en el
 * scroll normal de la tienda; al tocarla, abre OfertasModal, un modal
 * fullscreen con TODO el contenido (buscador, filtro, ordenar, chips de
 * categoría, grilla con cards pendientes/error) que antes vivía inline en
 * commerce-modern.jsx.
 *
 * Todo el estado de búsqueda/filtro/orden/categoría vive DENTRO de
 * OfertasModal (self-contained) — no tiene consumidores fuera de su propia
 * UI. Gestión del dueño (OfertaAdminSheet/ShareSheet de oferta) sigue siendo
 * infraestructura del padre (TemplateCommerceModern), pasada por props —
 * un solo sheet compartido con Catálogo, no uno por modal.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Filter, ArrowUpDown, Tag, Share2, MoreVertical, RotateCw, Loader2 } from 'lucide-react';
import { FONT, RADIUS, SHADOW } from '../tokens.js';
import { calcularBadges } from '../../utils/productBadges.js';
import { iconoDeCategoria, Chip, Carrusel } from '../components/ProductCards.jsx';
import { FiltrosSheet, OrdenarSheet } from './FiltrosOrdenSheet.jsx';
import { trackClick, trackBusqueda } from '../track.js';

const F = { fontFamily: FONT.family };
const catDe = o => o.categoria || o.categoryId || null;

const OF_SORT_OPTIONS = [
  { value: 'relevancia',  label: 'Relevancia' },
  { value: 'precio-asc',  label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
  { value: 'nombre-az',   label: 'Nombre A-Z' },
];

// ── Card-preview: vive en el lugar normal del scroll (mismo layout visual
// que MapaSection/CatalogoSection), no se renderiza si no hay ofertas.
export function OfertasSection({ ofertasBase, ofertasPendientes, onAbrirModal }) {
  const total = ofertasBase.length + ofertasPendientes.length;
  if (total === 0) return null;
  const previewFotos = ofertasBase.slice(0, 4).map(o => o.thumbUrl || o.imageUrl).filter(Boolean);
  const hayPendientes = ofertasPendientes.length > 0;
  const surf2 = 'var(--tp-surface2)', border = 'var(--tp-border)', txt = 'var(--tp-text)';

  return (
    <section style={{ padding: '18px 16px 0' }}>
      <h2 style={{ margin: '0 0 .75rem', fontSize: FONT.size?.xl || 18, fontWeight: 900, color: txt, ...F }}>Ofertas</h2>
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
            <Tag size={28} style={{ color: 'var(--tp-text-muted)', opacity: 0.5 }} />
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
            Ver ofertas · {total} {total === 1 ? 'oferta' : 'ofertas'}
          </div>
        </div>
        {/* Badge "Subiendo…" — visible sin abrir el modal, feedback de que
            algo se está publicando en segundo plano (dato ya disponible,
            sin fetch extra). */}
        {hayPendientes && (
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <div style={{
              background: 'var(--tp-primary)', color: 'var(--tp-on-primary)',
              borderRadius: 20, padding: '5px 10px',
              fontFamily: FONT.family, fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: SHADOW.sm,
            }}>
              <Loader2 size={12} className="cm-spin" />
              Subiendo…
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Modal fullscreen: todo el contenido que antes vivía inline. Bloquea el
// scroll del body mientras está montado, mismo criterio que MapaModal.
export function OfertasModal({
  tienda, esDueño, ofertasBase, ofertasPendientes, onClose,
  onVerOferta, onOfertaReintentar, onOfertaCancelarPendiente,
  onOpenAdminTarget, onOpenShareOferta,
}) {
  const [query, setQuery] = useState('');
  const [catActiva, setCatActiva] = useState('__todas');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [filtroBadges, setFiltroBadges] = useState([]);
  const [filtrosAtributos, setFiltrosAtributos] = useState({});
  const [sortBy, setSortBy] = useState('relevancia');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Tracking de búsqueda — debounce 800ms, mismo criterio que Catálogo.
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
    ofertasBase.forEach(o => {
      if (!o.attributes) return;
      Object.entries(o.attributes).forEach(([k, v]) => {
        if (SKIP_KEYS.has(k) || !v) return;
        if (!map[k]) map[k] = { key: k, label: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '), values: new Set() };
        map[k].values.add(String(v));
      });
    });
    return Object.values(map).filter(a => a.values.size >= 2).map(a => ({ ...a, values: [...a.values].sort() }));
  }, [ofertasBase]);

  const categorias = useMemo(() => {
    const vistas = [];
    for (const o of ofertasBase) {
      const c = catDe(o);
      if (c && !vistas.includes(c)) vistas.push(c);
    }
    return vistas;
  }, [ofertasBase]);

  const ofertasFiltradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pMin = precioMin !== '' ? Number(precioMin) : null;
    const pMax = precioMax !== '' ? Number(precioMax) : null;
    const base = ofertasBase.filter(o => {
      if (catActiva !== '__todas' && catDe(o) !== catActiva) return false;
      if (q && !(o.nombre || '').toLowerCase().includes(q) && !(o.descripcion || '').toLowerCase().includes(q)) return false;
      if (filtroBadges.length && !calcularBadges(o).some(id => filtroBadges.includes(id))) return false;
      if (pMin !== null && (o.precio == null || Number(o.precio) < pMin)) return false;
      if (pMax !== null && (o.precio == null || Number(o.precio) > pMax)) return false;
      for (const [key, vals] of Object.entries(filtrosAtributos)) {
        if (!vals || vals.length === 0) continue;
        if (!o.attributes || !vals.includes(String(o.attributes[key]))) return false;
      }
      return true;
    });
    if (sortBy === 'relevancia') return base;
    return [...base].sort((a, b) => {
      if (sortBy === 'precio-asc')  return (a.precio ?? Infinity) - (b.precio ?? Infinity);
      if (sortBy === 'precio-desc') return (b.precio ?? 0) - (a.precio ?? 0);
      if (sortBy === 'nombre-az')   return (a.nombre || '').localeCompare(b.nombre || '', 'es');
      return 0;
    });
  }, [ofertasBase, query, catActiva, filtroBadges, precioMin, precioMax, filtrosAtributos, sortBy]);

  const total = ofertasPendientes.length + ofertasBase.length;
  const ofertasList = [...ofertasPendientes, ...ofertasFiltradas];
  const buscadorVisible = ofertasBase.length > 1;

  const surf = 'var(--tp-surface)', surf2 = 'var(--tp-surface2)', border = 'var(--tp-border)';
  const txt = 'var(--tp-text)', txtM = 'var(--tp-text-muted)';
  const primary = 'var(--tp-primary)', onPrimary = 'var(--tp-on-primary)';

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 4700, background: 'var(--tp-bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, background: surf, borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
          <button onClick={onClose} aria-label="Cerrar" style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: surf2, color: txt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={18} />
          </button>
          <h2 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 800, color: txt, ...F }}>Ofertas</h2>
          {total > 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: txtM, ...F }}>
              {total} {total === 1 ? 'oferta' : 'ofertas'}
            </span>
          )}
        </div>

        {buscadorVisible && (
          <>
            <div style={{ padding: '0 16px', display: 'flex', gap: 10, marginBottom: categorias.length > 0 ? 10 : 12 }}>
              <div className="cm-search-wrap" style={{ position: 'relative', flex: 1 }}>
                <Search size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: txtM, pointerEvents: 'none' }} />
                <input
                  className="cm-input"
                  value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar ofertas…"
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
                  <Chip label="Todos" Icon={Tag} active={catActiva === '__todas'} onClick={() => setCatActiva('__todas')}
                    primary={primary} onPrimary={onPrimary} surf2={surf2} border={border} txt={txt} />
                  {categorias.map(c => (
                    <Chip key={c} label={c} Icon={iconoDeCategoria(c)} active={catActiva === c}
                      onClick={() => setCatActiva(catActiva === c ? '__todas' : c)}
                      primary={primary} onPrimary={onPrimary} surf2={surf2} border={border} txt={txt} />
                  ))}
                </Carrusel>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '18px 16px 24px' }}>
          {total === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: 56, height: 56, borderRadius: RADIUS.full, background: surf2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Tag size={24} style={{ color: txtM }} />
              </div>
              <p style={{ margin: 0, fontSize: 14, color: txtM, ...F }}>Todavía no hay ofertas publicadas</p>
            </div>
          ) : ofertasList.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: 56, height: 56, borderRadius: RADIUS.full, background: surf2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Search size={24} style={{ color: txtM }} />
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: txt }}>Sin resultados{query ? ` para "${query}"` : ''}</p>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: txtM }}>Probá con otra búsqueda o filtro</p>
              <button onClick={() => { setQuery(''); setCatActiva('__todas'); setFiltroBadges([]); setPrecioMin(''); setPrecioMax(''); setFiltrosAtributos({}); }}
                style={{ padding: '9px 18px', borderRadius: RADIUS.md, border: `1.5px solid ${border}`, background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: txt, ...F }}>
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="cm-grid">
              {ofertasList.map((o) => {
                if (o._localId) {
                  const isError = o._status === 'error';
                  return (
                    <div key={o._localId} style={{ position: 'relative', display: 'block', aspectRatio: '1/1.414', borderRadius: RADIUS.lg, overflow: 'hidden', background: surf2, border: `1px solid ${isError ? '#EF4444' : border}` }}>
                      <img src={o.thumbUrl} alt={o.nombre} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: isError ? 0.4 : 0.75, filter: isError ? 'grayscale(.3)' : 'none' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: isError ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.2)' }}>
                        {isError ? (
                          <>
                            <span style={{ padding: '4px 10px', borderRadius: RADIUS.sm, background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 800 }}>No se pudo publicar</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => onOfertaReintentar?.(o._localId)} aria-label="Reintentar" className="no-press"
                                style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,.9)', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <RotateCw size={15} />
                              </button>
                              <button onClick={() => onOfertaCancelarPendiente?.(o._localId)} aria-label="Descartar" className="no-press"
                                style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={15} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <Loader2 size={26} color="#fff" className="cm-spin" />
                            <button onClick={() => onOfertaCancelarPendiente?.(o._localId)} aria-label="Cancelar" className="no-press"
                              style={{ width: 28, height: 28, borderRadius: 9, border: 'none', background: 'rgba(0,0,0,.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                      <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '10px', background: 'linear-gradient(to top, rgba(0,0,0,.7), transparent)', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                        {o.nombre}
                      </div>
                    </div>
                  );
                }
                const ofVencida = o.expireAt && new Date(o.expireAt).getTime() < Date.now();
                const ofOculta = o.visible === false;
                const ofInactiva = ofVencida || ofOculta;
                return (
                <a key={o.id} href={`/${tienda.slug}/o/${o.slug || o.id}`}
                  onClick={(e) => {
                    trackClick(tienda.id, 'card', { productoId: o.id });
                    if (onVerOferta && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      onVerOferta(tienda, o);
                    }
                  }}
                  style={{ position: 'relative', display: 'block', aspectRatio: '1/1.414', borderRadius: RADIUS.lg, overflow: 'hidden', background: surf2, border: `1px solid ${border}`, textDecoration: 'none', opacity: ofInactiva ? 0.55 : 1 }}>
                  <img src={o.thumbUrl || o.imageUrl} alt={o.nombre} loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {ofInactiva && (
                    <span style={{ position: 'absolute', top: 8, left: 8, zIndex: 3, padding: '3px 8px', borderRadius: RADIUS.sm, background: ofVencida ? '#EF4444' : 'rgba(0,0,0,.6)', color: '#fff', fontSize: 10, fontWeight: 800 }}>
                      {ofVencida ? 'Vencida' : 'Oculta'}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenShareOferta(o);
                    }}
                    aria-label="Compartir oferta" className="no-press cm-hero-share-btn"
                    style={{ position: 'absolute', top: 8, right: esDueño ? 46 : 8, zIndex: 3, width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color .15s ease' }}>
                    <Share2 size={15} />
                  </button>
                  {esDueño && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenAdminTarget(o); }}
                      aria-label="Gestionar oferta" className="no-press cm-hero-share-btn"
                      style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MoreVertical size={15} />
                    </button>
                  )}
                </a>
                );
              })}
            </div>
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
        activeFilterCount={activeFilterCount}
        onLimpiar={() => { setPrecioMin(''); setPrecioMax(''); setFiltroBadges([]); setFiltrosAtributos({}); setFiltersOpen(false); }}
      />
      <OrdenarSheet open={sortOpen} onClose={() => setSortOpen(false)} sortBy={sortBy} setSortBy={setSortBy} options={OF_SORT_OPTIONS} />
    </div>,
    document.body
  );
}
