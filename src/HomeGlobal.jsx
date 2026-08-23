// HomeGlobal — Home marketplace multi-tienda, lo que ve un visitante que
// entra a la RAÍZ del sitio ("/"). Reemplaza a LandingScreen ahí (LandingScreen
// pasa a vivir en /vender, ver Root.jsx) — esta pantalla es un buscador +
// vidriera de TODAS las tiendas activas, no la landing de venta del producto.
//
// Estructura/interacción portada de LOKAL Global (ecosistema LOKAL\LOKAL\src\
// screens\HomeScreen.jsx): header con buscador en vivo, fila de categorías,
// hero de mapa, banner rotativo, carrusel de destacados, carrusel de tiendas.
// La sección "Mis demandas" del original NO se portó — ese concepto no existe
// en LOKAL LINKS. Paleta/footer/componentes son 100% del sistema YA maduro de
// LOKAL LINKS (tokens de src/index.css, Carrusel/Chip/ProductCardVertical de
// tienda-publica/components/ProductCards.jsx) — nada copiado tal cual del
// proyecto hermano, solo la FORMA se inspiró ahí (pedido explícito del usuario).
//
// El hero de mapa acá es solo una CARD clickeable con gradiente de marca — el
// mapa interactivo real (Leaflet, clustering estilo Mi Bovril) es una fase
// aparte, no se integra en esta pasada.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Store, MapPin, Tag, User, X, Sun, Moon,
  ChevronLeft, ChevronRight, LayoutGrid, Sparkles, Rocket, ShoppingBag,
} from 'lucide-react';
import { LogoSymbol, LogoFull, KtrlMark } from './Brand';
import CategoryIcon from './CategoryIcon';
import { CATEGORIES, getCategoryPath } from './categories';
import NavArrowBtn from './components/ui/NavArrowBtn';
import useScrollEdges from './hooks/useScrollEdges';
import { Carrusel, ProductCardVertical } from './tienda-publica/components/ProductCards.jsx';
import { getEstadoApertura } from './tienda-publica/utils.js';
import { API_BASE } from './config/flags';

const catRoot = CATEGORIES.filter((c) => c.parentId === null);

// Colores fijos (no vienen de --tp-primary, que es la paleta POR TIENDA — acá
// se usan los tokens generales de marca de toda la app: brand/surface-card/ink).
const CM = {
  surf: 'rgb(var(--surface-solid-rgb))',
  surf2: 'rgb(var(--surface-solid-2-rgb))',
  border: 'var(--border-solid)',
  txt: 'var(--text-primary)',
  txtM: 'var(--text-secondary)',
  primary: 'var(--brand-hex, #00B8D9)',
  onPrimary: '#fff',
};

// Banner rotativo — CTAs propios de LOKAL LINKS (sin "demandas", que no
// existe acá). Los tres llevan a lugares reales: buscar/categorías, crear
// tienda, y el mapa (card placeholder de fase 2).
function useBanners(navigate) {
  return useMemo(() => [
    {
      Icon: Sparkles,
      title: 'Descubrí tiendas nuevas',
      sub: 'Comercios locales recién sumados a LOKAL',
      cta: 'Explorar tiendas',
      action: () => navigate('tiendas'),
      className: 'from-brand via-brand to-brand-dark',
    },
    {
      Icon: Rocket,
      title: 'Creá tu propia tienda gratis',
      sub: 'Tu catálogo online con link propio en minutos',
      cta: 'Empezar ahora',
      action: () => { window.history.pushState({}, '', '/vender'); window.dispatchEvent(new PopStateEvent('popstate')); },
      className: 'from-[#0B132B] via-slate-800 to-slate-700',
    },
    {
      Icon: Tag,
      title: 'Productos destacados',
      sub: 'Lo más nuevo de todas las tiendas, en un solo lugar',
      cta: 'Ver destacados',
      action: () => navigate('destacados'),
      className: 'from-accent-dark via-accent to-accent-light',
    },
  ], [navigate]);
}

export default function HomeGlobal({ isDark, toggleTheme, onIrAlPanel }) {
  const [activeCat, setActiveCat] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loadingTiendas, setLoadingTiendas] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/tiendas-crud`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (mounted) setTiendas(Array.isArray(data) ? data : []); })
      .catch(() => { if (mounted) setTiendas([]); })
      .finally(() => { if (mounted) setLoadingTiendas(false); });
    fetch(`${API_BASE}/productos-globales?limit=24`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (mounted) setProductos(Array.isArray(data) ? data : []); })
      .catch(() => { if (mounted) setProductos([]); })
      .finally(() => { if (mounted) setLoadingProductos(false); });
    return () => { mounted = false; };
  }, []);

  // Navegación simple dentro de esta pantalla — HomeGlobal no tiene un router
  // interno propio todavía (no hay "product-detail"/"tienda-detail" acá,
  // fuera de scope de esta pasada); los únicos destinos reales son rutas de
  // verdad (una tienda por su slug, o /vender). "tiendas"/"destacados"/"mapa"
  // hacen scroll a su propia sección en esta misma página por ahora.
  const tiendasRef = useRef(null);
  const destacadosRef = useRef(null);
  const navigate = (dest) => {
    if (dest === 'tiendas') tiendasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (dest === 'destacados') destacadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (dest === 'mapa') { /* placeholder — mapa interactivo real es fase 2 */ }
  };
  const irATienda = (slug) => { window.history.pushState({}, '', `/${slug}`); window.dispatchEvent(new PopStateEvent('popstate')); };
  const irAVender = () => { window.history.pushState({}, '', '/vender'); window.dispatchEvent(new PopStateEvent('popstate')); };

  const banners = useBanners(navigate);
  const [bannerIdx, setBannerIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 4500); return () => clearInterval(t); }, [banners.length]);

  // ─── Búsqueda en vivo ─────────────────────────────────────────────────────
  const [q, setQ] = useState('');
  const [qOpen, setQOpen] = useState(false);
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const ms = (s) => s?.toLowerCase().includes(query);
    return [
      ...productos.filter((p) => ms(p.nombre) || ms(p.tiendaNombre)).slice(0, 4).map((p) => ({ _t: 'producto', ...p })),
      ...tiendas.filter((t) => ms(t.nombre) || (t.rubros || []).some(ms)).slice(0, 4).map((t) => ({ _t: 'tienda', ...t })),
    ];
  }, [q, productos, tiendas]);
  const selectResult = (item) => {
    setQ(''); setQOpen(false);
    if (item._t === 'tienda') irATienda(item.slug);
    if (item._t === 'producto') irATienda(item.tiendaSlug);
  };

  // ─── Filtro por categoría (rubro) ─────────────────────────────────────────
  const tiendasFiltradas = activeCat
    ? tiendas.filter((t) => (t.rubros || []).includes(activeCat))
    : tiendas;
  const productosFiltrados = activeCat
    ? productos.filter((p) => {
        if (!p.categoryId) return false;
        const path = getCategoryPath(p.categoryId);
        return path.some((c) => c.id === activeCat) || p.categoryId === activeCat;
      })
    : productos;

  const catScrollRef = useRef(null);
  const catEdges = useScrollEdges(catScrollRef);
  const scrollCat = (dir) => catScrollRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });

  const cantTiendas = tiendas.length;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface-dim text-ink">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-surface-card border-b border-white/8 dark:border-white/8">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 h-14 flex items-center gap-3">
          <div className="hidden lg:flex items-center shrink-0">
            <LogoFull size={22} className="text-ink" />
          </div>
          <div className="lg:hidden w-10 h-10 flex items-center justify-center shrink-0">
            <LogoSymbol size={26} className="text-ink" />
          </div>

          <div className="flex-1 relative max-w-md lg:mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim w-4 h-4 pointer-events-none z-10" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setQOpen(true); }}
              onFocus={() => setQOpen(true)}
              onBlur={() => setTimeout(() => setQOpen(false), 150)}
              placeholder="Buscar productos y tiendas..."
              className="ui-input w-full pl-10 pr-9 bg-surface-card-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-brand transition-all"
            />
            {q && (
              <button onMouseDown={() => setQ('')} aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 grid place-items-center text-ink-dim">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {qOpen && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-card rounded-2xl shadow-xl border border-white/8 overflow-hidden z-50">
                {results.map((item, i) => (
                  <button key={`${item._t}-${item.id}-${i}`} onMouseDown={() => selectResult(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-card-2 text-left transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-surface-card-2 flex items-center justify-center shrink-0 overflow-hidden">
                      {(item.foto || item.tiendaFoto)
                        ? <img src={item.foto || item.tiendaFoto} alt="" className="w-full h-full object-cover" />
                        : item._t === 'tienda' ? <Store className="w-4 h-4 text-ink-dim" /> : <Tag className="w-4 h-4 text-ink-dim" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-ink">{item._t === 'tienda' ? item.nombre : item.nombre}</p>
                      <p className="text-[10px] text-ink-dim truncate">{item._t === 'tienda' ? (item.rubros || []).join(', ') : item.tiendaNombre}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={toggleTheme} aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} className="ui-icon-btn text-ink-dim hover:bg-surface-card-2 transition-colors shrink-0 hidden sm:inline-flex">
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <button onClick={onIrAlPanel} aria-label="Panel de tu tienda"
            className="ui-avatar-btn shrink-0 ring-2 ring-transparent hover:ring-brand transition-all bg-surface-card-2">
            <User className="w-4 h-4 text-ink-dim" />
          </button>
        </div>

        {/* Categorías */}
        <div className="relative max-w-5xl mx-auto group/cat">
          <div ref={catScrollRef} className="flex overflow-x-auto px-4 lg:px-6 pb-3 pt-1 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setActiveCat(null)} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${!activeCat ? 'bg-brand' : 'bg-surface-card-2 hover:bg-surface-card-2/70'}`}>
                <LayoutGrid className={`w-5 h-5 ${!activeCat ? 'text-brand-fg' : 'text-ink-dim'}`} />
              </div>
              <span className={`text-[10px] font-semibold leading-tight text-center ${!activeCat ? 'text-brand' : 'text-ink-dim'}`}>Todos</span>
            </button>
            {catRoot.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${activeCat === cat.id ? 'bg-brand' : 'bg-surface-card-2 hover:bg-surface-card-2/70'}`}>
                  <CategoryIcon name={cat.icon} className={`w-5 h-5 ${activeCat === cat.id ? 'text-brand-fg' : 'text-ink-dim'}`} />
                </div>
                <span className={`text-[10px] font-semibold leading-tight text-center truncate w-full ${activeCat === cat.id ? 'text-brand' : 'text-ink-dim'}`}>
                  {cat.shortName || cat.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
          <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface-card to-transparent transition-opacity duration-200 ${catEdges.left ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface-card to-transparent transition-opacity duration-200 ${catEdges.right ? 'opacity-100' : 'opacity-0'}`} />
          <NavArrowBtn dir="left" onClick={() => scrollCat(-1)}
            className={`absolute left-1 top-[22px] w-7 h-7 bg-surface-card shadow-md border border-white/8 text-ink-dim hover:text-ink z-10 opacity-0 group-hover/cat:opacity-100 transition-opacity ${!catEdges.left ? 'pointer-events-none !opacity-0' : ''}`} />
          <NavArrowBtn dir="right" onClick={() => scrollCat(1)}
            className={`absolute right-1 top-[22px] w-7 h-7 bg-surface-card shadow-md border border-white/8 text-ink-dim hover:text-ink z-10 opacity-0 group-hover/cat:opacity-100 transition-opacity ${!catEdges.right ? 'pointer-events-none !opacity-0' : ''}`} />
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-5xl mx-auto pb-10">

          {/* ── Hero mapa — CARD placeholder, sin Leaflet todavía ── */}
          <div
            onClick={() => navigate('mapa')}
            role="button" tabIndex={0}
            className="relative overflow-hidden cursor-pointer select-none mx-4 lg:mx-6 mt-4 rounded-3xl"
            style={{ height: 176, background: 'linear-gradient(135deg, var(--brand-deep-hex, #083344) 0%, var(--brand-deep-hex, #083344) 45%, var(--brand-hex, #00B8D9) 100%)' }}
          >
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hg-dots" x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.4" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hg-dots)" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
              <p className="text-white font-black text-lg leading-tight mb-1">
                {cantTiendas > 0 ? `${cantTiendas} tienda${cantTiendas === 1 ? '' : 's'} cerca tuyo` : 'Explorá tu ciudad'}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-white/70 text-xs">Comercios locales en el mapa</p>
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
                  <MapPin className="w-3 h-3" /> Próximamente
                </span>
              </div>
            </div>
          </div>

          {/* ── Banner rotativo ── */}
          <div className="px-4 lg:px-6 pt-5">
            <div className="relative group">
              <div onClick={banners[bannerIdx].action}
                className={`bg-gradient-to-br ${banners[bannerIdx].className} rounded-3xl p-6 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden select-none shadow-lg`}
                style={{ minHeight: 120 }}>
                {(() => { const BIcon = banners[bannerIdx].Icon; return <BIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 text-white opacity-15 pointer-events-none" />; })()}
                <div className="relative">
                  <p className="text-white font-black text-xl leading-tight mb-1">{banners[bannerIdx].title}</p>
                  <p className="text-white/75 text-sm mb-4">{banners[bannerIdx].sub}</p>
                  <span className="inline-block bg-white/25 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-1.5 rounded-xl">{banners[bannerIdx].cta} →</span>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setBannerIdx((i) => (i - 1 + banners.length) % banners.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/35 backdrop-blur-sm rounded-full flex items-center justify-center text-white lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setBannerIdx((i) => (i + 1) % banners.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/35 backdrop-blur-sm rounded-full flex items-center justify-center text-white lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)} aria-label={`Banner ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-5 bg-brand' : 'w-1.5 bg-ink-dim/30'}`} />
              ))}
            </div>
          </div>

          {/* ── Destacados de todas las tiendas ── */}
          <div ref={destacadosRef} className="mt-6 scroll-mt-24">
            <div className="px-4 lg:px-6 flex items-center justify-between mb-3">
              <h2 className="font-black text-[15px] text-ink flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand" /> Destacados
              </h2>
            </div>
            {loadingProductos && productosFiltrados.length === 0 ? (
              <div className="px-4 lg:px-6 flex gap-3 overflow-hidden">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-36 h-56 rounded-2xl bg-surface-card-2 animate-pulse shrink-0" />
                ))}
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="px-4 lg:px-6">
                <div className="bg-surface-card rounded-3xl p-5 text-center border border-white/8">
                  <ShoppingBag className="w-8 h-8 text-ink-dim/50 mx-auto mb-2" />
                  <p className="text-sm text-ink-dim">{activeCat ? 'Sin productos en esta categoría todavía' : 'Todavía no hay productos publicados'}</p>
                </div>
              </div>
            ) : (
              <div className="px-4 lg:px-6">
                <Carrusel gap={12} padding="4px 2px">
                  {productosFiltrados.map((p) => (
                    <ProductCardVertical
                      key={p.id}
                      p={p}
                      onOpen={() => irATienda(p.tiendaSlug)}
                      surf={CM.surf} surf2={CM.surf2} border={CM.border} txt={CM.txt} txtM={CM.txtM}
                      primary={CM.primary} onPrimary={CM.onPrimary}
                    />
                  ))}
                </Carrusel>
              </div>
            )}
          </div>

          {/* ── Tiendas destacadas ── */}
          <div ref={tiendasRef} className="mt-7 scroll-mt-24">
            <div className="px-4 lg:px-6 flex items-center justify-between mb-3">
              <h2 className="font-black text-[15px] text-ink flex items-center gap-2">
                <Store className="w-4 h-4 text-brand" /> Tiendas destacadas
              </h2>
              <button onClick={() => navigate('mapa')}
                className="h-7 px-2.5 rounded-full bg-surface-card border border-white/8 flex items-center gap-1.5 text-ink-dim hover:text-brand hover:border-brand/40 transition-all shadow-sm text-[11px] font-semibold">
                <MapPin className="w-3 h-3" />Mapa
              </button>
            </div>
            {loadingTiendas && tiendasFiltradas.length === 0 ? (
              <div className="px-4 lg:px-6 flex gap-3 overflow-hidden">
                {[0, 1, 2].map((i) => <div key={i} className="w-52 h-24 rounded-2xl bg-surface-card-2 animate-pulse shrink-0" />)}
              </div>
            ) : tiendasFiltradas.length === 0 ? (
              <div className="px-4 lg:px-6">
                <div className="bg-surface-card rounded-3xl p-5 text-center border border-white/8">
                  <Store className="w-8 h-8 text-ink-dim/50 mx-auto mb-2" />
                  <p className="text-sm text-ink-dim">{activeCat ? 'Sin tiendas en esta categoría todavía' : 'Todavía no hay tiendas publicadas'}</p>
                </div>
              </div>
            ) : (
              <div className="px-4 lg:px-6">
                <Carrusel gap={12} padding="4px 2px">
                  {tiendasFiltradas.map((t) => {
                    const estado = getEstadoApertura(t.horarios);
                    return (
                      <div key={t.id} onClick={() => irATienda(t.slug)} role="button" tabIndex={0}
                        className="no-press w-52 shrink-0 bg-surface-card border border-white/8 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all select-none">
                        <div className="flex items-center gap-2.5 mb-2.5 pointer-events-none">
                          <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                            {t.foto ? <img src={t.foto} alt="" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-brand" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate text-ink">{t.nombre}</p>
                            <p className="text-[10px] text-ink-dim truncate">{(t.rubros || []).join(', ') || 'Comercio local'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs pointer-events-none">
                          {t.ciudad && <span className="flex items-center gap-1 text-ink-dim truncate"><MapPin className="w-3 h-3 shrink-0" />{t.ciudad}</span>}
                          <span className={`flex items-center gap-1 font-semibold ml-auto shrink-0 ${estado.abierta ? 'text-ok' : 'text-ink-dim'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${estado.abierta ? 'bg-ok' : 'bg-ink-dim/40'}`} />
                            {estado.abierta ? 'Abierto' : 'Cerrado'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </Carrusel>
              </div>
            )}
          </div>

        </div>
      </div>

      <HomeGlobalFooter dark={isDark} toggleDark={toggleTheme} onVender={irAVender} />
    </div>
  );
}

// ── Footer — mismo lenguaje visual que TiendaFooter (tienda-publica/sections/
// TiendaFooter.jsx: franja CTA sutil con color-mix, logo+KTRL abajo, toggle
// de tema), pero con los tokens GLOBALES de marca (--brand) en vez de
// --tp-primary (esa var es por-tienda, no aplica en la Home general). No se
// importa TiendaFooter tal cual porque ese componente linkea "creado por
// KTRL"/"crear tienda" con tracking por tiendaId, que no tiene sentido acá.
function HomeGlobalFooter({ dark, toggleDark, onVender }) {
  return (
    <>
      <style>{`
        .hg-footer-banner { transition: background-color .15s ease; }
        @media (hover: hover) { .hg-footer-banner:hover { background: color-mix(in srgb, var(--brand-hex) 16%, transparent) !important; } }
        .hg-footer-banner:active { background: color-mix(in srgb, var(--brand-hex) 20%, transparent) !important; }
        .hg-footer-logo, .hg-footer-ktrl { transition: opacity .15s ease, transform .12s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @media (hover: hover) { .hg-footer-logo:hover, .hg-footer-ktrl:hover { opacity: .75; } }
        .hg-footer-logo:active, .hg-footer-ktrl:active { transform: scale(0.93); transition: transform .06s ease; }
        @media (hover: hover) { .hg-footer-theme:hover { background: color-mix(in srgb, var(--brand-hex) 10%, transparent) !important; color: var(--brand-hex) !important; } }
      `}</style>
      <button onClick={onVender} className="hg-footer-banner no-press w-full flex items-center justify-center gap-1.5 px-5 py-2 text-center"
        style={{ background: 'color-mix(in srgb, var(--brand-hex) 10%, transparent)', color: 'var(--brand-hex)', fontSize: 12, fontWeight: 700 }}>
        ¿Tenés un negocio? Creá tu tienda gratis →
      </button>
      <footer className="border-t border-white/8 px-6 py-3 grid items-center gap-3.5" style={{ gridTemplateColumns: '1fr auto 1fr', background: 'rgb(var(--surface-solid-rgb))' }}>
        <a href="/" className="hg-footer-logo justify-self-start inline-flex items-center gap-1.5 no-underline text-ink-dim">
          <LogoSymbol size={18} color="currentColor" />
          <span className="text-[13px] font-extrabold tracking-tight">lokal</span>
        </a>
        <button onClick={toggleDark} aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="hg-footer-theme justify-self-center w-[30px] h-[30px] rounded-[10px] grid place-items-center bg-surface-card-2 text-ink-dim transition-colors">
          {dark ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
        </button>
        <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
          className="hg-footer-ktrl justify-self-end inline-flex items-center gap-1.5 no-underline text-ink-dim/70">
          <span className="text-[10px] font-semibold">Creado por</span>
          <KtrlMark style={{ height: 11, color: 'currentColor' }} />
        </a>
      </footer>
    </>
  );
}
