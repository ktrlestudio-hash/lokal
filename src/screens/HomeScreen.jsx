import React, { useRef, useState, useMemo, useEffect } from 'react';
import { SkeletonOfertas } from '../Skeletons';
import {
  Search, MessageSquare, Flame, Store, ChevronLeft, ChevronRight,
  Package, Tag, MapPin, Star, Bell, X, LayoutGrid, User
} from 'lucide-react';
import { LogoSymbol, LogoFull } from '../Brand';
import CategoryIcon from '../CategoryIcon';
import { getCategoryPath } from '../categories';
import NavArrowBtn from '../components/ui/NavArrowBtn';
import useScrollEdges from '../hooks/useScrollEdges';
import { ProductCardVertical } from '../tienda-publica/components/ProductCards.jsx';

// ─── Colores para las cards del Home ───────────────────────────────────────
// El Home es GLOBAL (mezcla productos de muchas tiendas): a diferencia de
// commerce-modern (que usa deriveColorPalette(), el color de marca de UNA
// tienda), acá resolvemos los mismos roles visuales (surf/surf2/border/txt/
// txtM/primary/onPrimary) desde los tokens generales de la app —
// src/index.css §4.bis (--surface-solid/--surface-solid-2/--border-solid/
// --text-primary/--text-secondary) y la marca fija de LOKAL (--brand-hex/
// --brand-fg, §1). Nunca la paleta por-tienda.
const HOME_CARD_COLORS = {
  surf:      'var(--surface-solid)',
  surf2:     'var(--surface-solid-2)',
  border:    'var(--border-solid)',
  txt:       'var(--text-primary)',
  txtM:      'var(--text-secondary)',
  primary:   'var(--brand-hex)',
  onPrimary: 'rgb(var(--brand-fg))', // --brand-fg es "R G B" sin función, hay que envolverlo
};

export default function HomeScreen(props) {
  const {
    homeActiveCat, setHomeActiveCat,
    visibleOfertas = [], tiendas = [], allCategories = [],
    addRecentSearch, recentSearches = [], clearRecentSearches,
    setSelectedProduct, setSelectedTienda,
    navigate, navigateSearch,
    loadingOfertas,
    openNotifications, unreadCount = 0, isStoreOpen, VENTAJA_CONFIG = {}
  } = props;

  const activeCat = homeActiveCat;
  const setActiveCat = setHomeActiveCat;

  const tiendasScrollRef    = useRef(null);
  const destacadosScrollRef = useRef(null);
  const catScrollMobileRef  = useRef(null);
  const catScrollDesktopRef = useRef(null);

  // ─── Local search ─────────────────────────────────────────────────────────
  const [lq, setLq] = useState('');
  const [lOpen, setLOpen] = useState(false);
  const lResults = useMemo(() => {
    const q = lq.trim().toLowerCase();
    if (!q) return [];
    const ms = (s) => s?.toLowerCase().includes(q);
    return [
      ...visibleOfertas.filter(o => o.activa !== false && (ms(o.titulo) || ms(o.tiendaNombre))).slice(0, 4).map(o => ({ _t: 'oferta', ...o })),
      ...tiendas.filter(t => ms(t.nombre) || ms(t.rubro)).slice(0, 3).map(t => ({ _t: 'tienda', ...t })),
    ];
  }, [lq, visibleOfertas, tiendas]);

  const lSelect = (item) => {
    addRecentSearch?.(item._t === 'tienda' ? item.nombre : item.titulo);
    setLq(''); setLOpen(false);
    if (item._t === 'oferta')  { setSelectedProduct?.(item); navigate('product-detail'); }
    if (item._t === 'tienda')  { setSelectedTienda?.(item); navigate('tienda-detail'); }
  };

  // ─── Drag scroll ──────────────────────────────────────────────────────────
  const useDragScroll = (ref) => {
    const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
    const onDown = (e) => { if (!ref.current) return; drag.current = { active: true, startX: e.pageX - ref.current.offsetLeft, scrollLeft: ref.current.scrollLeft, moved: false }; ref.current.style.cursor = 'grabbing'; };
    const onMove = (e) => {
      if (!drag.current.active || !ref.current) return;
      const delta = e.pageX - ref.current.offsetLeft - drag.current.startX;
      if (Math.abs(delta) > 4) { drag.current.moved = true; e.preventDefault(); ref.current.scrollLeft = drag.current.scrollLeft - delta; }
    };
    const onUp = () => { drag.current.active = false; if (ref.current) ref.current.style.cursor = ''; };
    const wasDragged = () => { const m = drag.current.moved; drag.current.moved = false; return m; };
    return [{ onMouseDown: onDown, onMouseMove: onMove, onMouseUp: onUp, onMouseLeave: onUp, style: { cursor: 'grab' } }, wasDragged];
  };

  const [destacadosDrag, destacadosWasDragged] = useDragScroll(destacadosScrollRef);
  const [tiendasDrag, tiendasWasDragged]       = useDragScroll(tiendasScrollRef);
  const destacadosEdges  = useScrollEdges(destacadosScrollRef);
  const tiendasEdges     = useScrollEdges(tiendasScrollRef);
  const catMobileEdges   = useScrollEdges(catScrollMobileRef);
  const catDesktopEdges  = useScrollEdges(catScrollDesktopRef);

  const scrollBy  = (ref, dir) => ref.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  const scrollCat = (ref, dir) => ref.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });

  // ─── Banner ───────────────────────────────────────────────────────────────
  const [bannerIdx, setBannerIdx] = useState(0);
  const BANNERS = [
    { bg: 'from-brand via-brand to-brand-dark', Icon: Flame, title: 'Ofertas exclusivas', sub: 'Los mejores precios de tu ciudad', cta: 'Ver todo', action: () => navigate('todas-ofertas') },
    { bg: 'from-[#2A0509] via-[#333333] to-[#4d4d4d]', Icon: Store, title: 'Tiendas cerca tuyo', sub: 'Comercios locales a tu alcance', cta: 'Explorar', action: () => navigate('tiendas') },
  ];
  useEffect(() => { const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4500); return () => clearInterval(t); }, []);

  // ─── Data ─────────────────────────────────────────────────────────────────
  const ofertasActivas = visibleOfertas.filter(o => o.activa !== false);
  const filteredOfertas = activeCat
    ? ofertasActivas.filter(o => {
        const path = getCategoryPath(o.categoryId, allCategories);
        return path.some(c => c.id === activeCat) || o.categoryId === activeCat;
      })
    : ofertasActivas;

  const filteredTiendas = activeCat
    ? tiendas.filter(t => {
        const rubroMatch = t.categoryId && (() => {
          const path = getCategoryPath(t.categoryId, allCategories);
          return path.some(c => c.id === activeCat) || t.categoryId === activeCat;
        })();
        const hasOferta = ofertasActivas.some(o => {
          if (o.tiendaId !== t.id) return false;
          const path = getCategoryPath(o.categoryId, allCategories);
          return path.some(c => c.id === activeCat) || o.categoryId === activeCat;
        });
        return rubroMatch || hasOferta;
      })
    : tiendas;

  // ─── Mezcla del carrusel "Destacados cerca tuyo" ───────────────────────────
  // Antes: `ofertasActivas` en el orden en que llegan (en la práctica, casi
  // siempre termina siendo "lo más vendido"/lo primero del catálogo). Ahora
  // mezclamos parejo 3 grupos, round-robin, para que el carrusel no sea
  // 100% lo mismo siempre:
  //   (a) NUEVOS: por `createdAt`/`fechaCreacion` si el producto lo tiene
  //       (fecha real de alta) — más reciente primero.
  //   (b) POCA DEMANDA: por `ventas`/`vendidos` si el producto lo tiene —
  //       menos vendido primero, para darle visibilidad a lo que no se ve.
  //   (c) DESTACADOS: por `rating` propio si lo tiene, o `precioOriginal`
  //       (oferta con descuento activo) como proxy de "producto destacado".
  // El modelo mock actual (`src/data/mockData.js`) no incluye esos campos
  // en las ofertas todavía (sí existen en tiendas) — el fallback usa el
  // orden de llegada del array para no dejar el criterio (b)/(c) vacío
  // mientras tanto; en cuanto el backend real mande esos campos, el sort
  // los usa automáticamente sin tocar este código.
  const destacadosMezclados = useMemo(() => {
    const items = filteredOfertas;
    if (items.length <= 4) return items; // muy pocos ítems: no vale la pena mezclar

    const porFecha = (o) => {
      const f = o.createdAt || o.fechaCreacion;
      return f ? new Date(f).getTime() : null;
    };
    const porVentas = (o) => (o.ventas ?? o.vendidos ?? null);

    const nuevos = [...items].sort((a, b) => {
      const fa = porFecha(a), fb = porFecha(b);
      if (fa != null && fb != null) return fb - fa; // más reciente primero
      return 0; // sin dato real: no reordena (mantiene orden de llegada)
    });
    const pocaDemanda = [...items].sort((a, b) => {
      const va = porVentas(a), vb = porVentas(b);
      if (va != null && vb != null) return va - vb; // menos vendido primero
      return 0;
    });
    const destacados = [...items].sort((a, b) => {
      const ra = a.rating ?? (a.precioOriginal ? 1 : 0);
      const rb = b.rating ?? (b.precioOriginal ? 1 : 0);
      return rb - ra; // mejor rating / con descuento primero
    });

    const grupos = [nuevos, pocaDemanda, destacados];
    const vistos = new Set();
    const mezcla = [];
    let i = 0;
    while (mezcla.length < items.length) {
      const grupo = grupos[i % grupos.length];
      const candidato = grupo.find(o => !vistos.has(o.id));
      if (candidato) { vistos.add(candidato.id); mezcla.push(candidato); }
      i++;
      if (i > items.length * grupos.length) break; // salvavidas anti-loop
    }
    return mezcla;
  }, [filteredOfertas]);

  const catRoot = allCategories.filter(c => c.parentId === null);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] flex flex-col bg-surface-dim">

      {/* ── Header mobile ── */}
      <div className="lg:hidden shrink-0 z-20 bg-surface-card border-b border-slate-100 dark:border-white/10">
        <div className="px-3 h-14 flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <LogoSymbol size={26} className="text-ink" />
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim w-4 h-4 pointer-events-none z-10" />
            <input
              value={lq}
              onChange={e => { setLq(e.target.value); setLOpen(true); }}
              onFocus={() => setLOpen(true)}
              onBlur={() => setTimeout(() => setLOpen(false), 150)}
              placeholder="Buscar productos y tiendas..."
              className="ui-input w-full pl-9 pr-3 bg-surface-card-2 text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              onKeyDown={e => { if (e.key === 'Enter' && lq.trim()) { addRecentSearch?.(lq.trim()); navigateSearch?.(lq.trim()); setLq(''); setLOpen(false); } }}
            />
            {/* Dropdown resultados */}
            {lOpen && lResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50">
                {lResults.map((item, i) => (
                  <button key={i} onMouseDown={() => lSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-card-2 dark:hover:bg-white/5 text-left">
                    <div className="w-8 h-8 rounded-xl bg-surface-card-2 dark:bg-white/8 flex items-center justify-center shrink-0 overflow-hidden">
                      {(item.fotos?.[0] || item.foto || item.logo)
                        ? <img src={item.fotos?.[0] || item.foto || item.logo} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        : item._t === 'tienda' ? <Store className="w-4 h-4 text-ink-dim" />
                        : <Tag className="w-4 h-4 text-ink-dim" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item._t === 'tienda' ? item.nombre : item.titulo}</p>
                      <p className="text-[10px] text-ink-dim">{item._t === 'tienda' ? item.rubro : item.tiendaNombre}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={(e) => openNotifications(e.currentTarget)} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 relative text-ink-dim transition-colors shrink-0">
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
          </button>
          <button onClick={() => props.onOpenProfile?.()} className="ui-avatar-btn shrink-0 ring-2 ring-transparent hover:ring-primary transition-all">
            {props.firebaseUser?.photoURL
              ? <img src={props.firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full bg-surface-card-2 dark:bg-white/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-ink-dim" />
                </div>
              )
            }
          </button>
        </div>

        {/* Categorías mobile */}
        <div className="relative group/catscroll">
          <div ref={catScrollMobileRef} className="flex gap-2 overflow-x-auto px-3 pb-3 pt-1 no-scrollbar">
            <button onClick={() => setActiveCat(null)} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${!activeCat ? 'bg-primary' : 'bg-surface-card-2 dark:bg-white/10 hover:bg-surface-card-2 dark:hover:bg-white/15'}`}>
                <Search className={`w-6 h-6 ${!activeCat ? 'text-white' : 'text-ink-dim'}`} />
              </div>
              <span className={`text-[10px] font-semibold leading-tight text-center ${!activeCat ? 'text-primary' : 'text-ink-dim'}`}>Todos</span>
            </button>
            {catRoot.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${activeCat === cat.id ? 'bg-primary' : 'bg-surface-card-2 dark:bg-white/10 hover:bg-surface-card-2 dark:hover:bg-white/15'}`}>
                  <CategoryIcon name={cat.icon} className={`w-6 h-6 ${activeCat === cat.id ? 'text-white' : 'text-ink-dim'}`} />
                </div>
                <span className={`text-[10px] font-semibold leading-tight text-center ${activeCat === cat.id ? 'text-primary' : 'text-ink-dim'}`}>
                  {cat.shortName || cat.name.split(' ')[0]}
                </span>
              </button>
            ))}
            <button onClick={() => navigate('categorias')} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors bg-surface-card-2 dark:bg-white/10 hover:bg-surface-card-2 dark:hover:bg-white/15 border border-dashed border-slate-300 dark:border-white/20">
                <LayoutGrid className="w-6 h-6 text-ink-dim" />
              </div>
              <span className="text-[10px] font-semibold leading-tight text-center text-ink-dim">Ver todas</span>
            </button>
          </div>
          <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface-card to-transparent transition-opacity duration-200 ${catMobileEdges.left ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface-card to-transparent transition-opacity duration-200 ${catMobileEdges.right ? 'opacity-100' : 'opacity-0'}`} />
          <NavArrowBtn dir="left" onClick={() => scrollCat(catScrollMobileRef, -1)}
            className={`absolute left-1 top-[22px] w-7 h-7 bg-surface-card shadow-md border border-slate-200 dark:border-white/10 text-ink-dim hover:text-ink z-10 lg:opacity-0 lg:group-hover/catscroll:opacity-100 transition-opacity ${!catMobileEdges.left ? 'pointer-events-none !opacity-0' : ''}`} />
          <NavArrowBtn dir="right" onClick={() => scrollCat(catScrollMobileRef, 1)}
            className={`absolute right-1 top-[22px] w-7 h-7 bg-surface-card shadow-md border border-slate-200 dark:border-white/10 text-ink-dim hover:text-ink z-10 lg:opacity-0 lg:group-hover/catscroll:opacity-100 transition-opacity ${!catMobileEdges.right ? 'pointer-events-none !opacity-0' : ''}`} />
        </div>
      </div>

      {/* ── Desktop header ── */}
      <div className="hidden lg:block shrink-0 z-20 bg-surface-card border-b border-slate-100 dark:border-white/10">
        <div className="h-14 flex items-center px-6 gap-3 max-w-5xl mx-auto">
          <div className="flex items-center shrink-0 text-ink">
            <LogoFull size={22} />
          </div>
          <div className="flex-1 relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim w-4 h-4 pointer-events-none z-10" />
            <input
              value={lq}
              onChange={e => { setLq(e.target.value); setLOpen(true); }}
              onFocus={() => setLOpen(true)}
              onBlur={() => setTimeout(() => setLOpen(false), 150)}
              placeholder="Buscar productos, tiendas..."
              className="ui-input w-full pl-10 pr-4 py-2 bg-surface-card-2 text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              onKeyDown={e => { if (e.key === 'Enter' && lq.trim()) { addRecentSearch?.(lq.trim()); navigateSearch?.(lq.trim()); setLq(''); setLOpen(false); } }}
            />
            {lOpen && lResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50">
                {lResults.map((item, i) => (
                  <button key={i} onMouseDown={() => lSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-card-2 dark:hover:bg-white/5 text-left">
                    <div className="w-8 h-8 rounded-xl bg-surface-card-2 dark:bg-white/8 flex items-center justify-center shrink-0 overflow-hidden">
                      {(item.fotos?.[0] || item.foto || item.logo)
                        ? <img src={item.fotos?.[0] || item.foto || item.logo} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        : item._t === 'tienda' ? <Store className="w-4 h-4 text-ink-dim" />
                        : <Tag className="w-4 h-4 text-ink-dim" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item._t === 'tienda' ? item.nombre : item.titulo}</p>
                      <p className="text-[10px] text-ink-dim">{item._t === 'tienda' ? item.rubro : item.tiendaNombre}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={(e) => openNotifications(e.currentTarget)} className="ui-icon-btn text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 relative transition-colors shrink-0">
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
          </button>
          <div className="relative shrink-0" ref={props.profileDropdownRef}>
            <button onClick={() => props.toggleProfileMenu?.()} className={`ui-avatar-btn ring-2 transition-all ${props.showProfileDropdown ? 'ring-primary' : 'ring-transparent hover:ring-primary'}`}>
              {props.firebaseUser?.photoURL
                ? <img src={props.firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full bg-surface-card-2 dark:bg-white/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-ink-dim" />
                  </div>
                )
              }
            </button>
            {props.showProfileDropdown && props.ProfileDropdown && <props.ProfileDropdown />}
          </div>
        </div>
        {/* Categorías desktop */}
        <div className="relative max-w-5xl mx-auto group/catscrollD">
          <div ref={catScrollDesktopRef}
            className="flex overflow-x-auto px-6 pb-3 pt-1 no-scrollbar"
            style={{ gap: catRoot.length < 12 ? '0' : '8px', justifyContent: catRoot.length < 12 ? 'space-between' : 'flex-start' }}>
            {[{ id: null, icon: null, name: 'Todos' }, ...catRoot].map((cat, idx) => {
              const isAll = idx === 0;
              const active = isAll ? !activeCat : activeCat === cat.id;
              return (
                <button key={cat.id ?? 'all'}
                  onClick={() => setActiveCat(isAll ? null : (activeCat === cat.id ? null : cat.id))}
                  className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${active ? 'bg-primary' : 'bg-surface-card-2 dark:bg-white/10 hover:bg-surface-card-2 dark:hover:bg-white/15'}`}>
                    {isAll
                      ? <Search className={`w-6 h-6 ${active ? 'text-white' : 'text-ink-dim'}`} />
                      : <CategoryIcon name={cat.icon} className={`w-6 h-6 ${active ? 'text-white' : 'text-ink-dim'}`} />
                    }
                  </div>
                  <span className={`text-[10px] font-semibold leading-tight text-center ${active ? 'text-primary' : 'text-ink-dim'}`}>
                    {isAll ? 'Todos' : (cat.shortName || cat.name.split(' ')[0])}
                  </span>
                </button>
              );
            })}
            <button onClick={() => navigate('categorias')} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors bg-surface-card-2 dark:bg-white/10 hover:bg-surface-card-2 dark:hover:bg-white/15 border border-dashed border-slate-300 dark:border-white/20">
                <LayoutGrid className="w-6 h-6 text-ink-dim" />
              </div>
              <span className="text-[10px] font-semibold leading-tight text-center text-ink-dim">Ver todas</span>
            </button>
          </div>
          <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface-card to-transparent transition-opacity duration-200 ${catDesktopEdges.left ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface-card to-transparent transition-opacity duration-200 ${catDesktopEdges.right ? 'opacity-100' : 'opacity-0'}`} />
          <NavArrowBtn dir="left" onClick={() => scrollCat(catScrollDesktopRef, -1)}
            className={`absolute left-1 top-[22px] w-7 h-7 bg-surface-card shadow-md border border-slate-200 dark:border-white/10 text-ink-dim hover:text-ink z-10 opacity-0 group-hover/catscrollD:opacity-100 transition-opacity ${!catDesktopEdges.left ? 'pointer-events-none !opacity-0' : ''}`} />
          <NavArrowBtn dir="right" onClick={() => scrollCat(catScrollDesktopRef, 1)}
            className={`absolute right-1 top-[22px] w-7 h-7 bg-surface-card shadow-md border border-slate-200 dark:border-white/10 text-ink-dim hover:text-ink z-10 opacity-0 group-hover/catscrollD:opacity-100 transition-opacity ${!catDesktopEdges.right ? 'pointer-events-none !opacity-0' : ''}`} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-y-contain no-scrollbar">
      <div className="max-w-5xl mx-auto pb-32">

        {/* ── Banner rotativo ── */}
        <div className="px-4 pt-5">
          <div className="relative group">
            <div onClick={BANNERS[bannerIdx].action}
              className={`bg-gradient-to-br ${BANNERS[bannerIdx].bg} rounded-3xl p-6 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden select-none shadow-lg`}
              style={{ minHeight: 120 }}>
              {(() => { const BIcon = BANNERS[bannerIdx].Icon; return <BIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 text-white opacity-15 pointer-events-none" />; })()}
              <div className="relative">
                <p className="text-white font-black text-xl leading-tight mb-1">{BANNERS[bannerIdx].title}</p>
                <p className="text-white/75 text-sm mb-4">{BANNERS[bannerIdx].sub}</p>
                <span className="inline-block bg-white/25 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-1.5 rounded-xl">{BANNERS[bannerIdx].cta} →</span>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setBannerIdx(i => (i - 1 + BANNERS.length) % BANNERS.length); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/35 backdrop-blur-sm rounded-full flex items-center justify-center text-white lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setBannerIdx(i => (i + 1) % BANNERS.length); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/35 backdrop-blur-sm rounded-full flex items-center justify-center text-white lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {BANNERS.map((_, i) => (
              <button key={i} onClick={() => setBannerIdx(i)} className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-5 bg-primary' : 'w-1.5 bg-ink-dim dark:bg-white/20'}`} />
            ))}
          </div>
        </div>

        {/* ── Destacados cerca tuyo ── */}
        <div className="mt-5">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="font-black text-[15px] text-ink">Destacados cerca tuyo</h2>
            <button onClick={() => navigate('todas-ofertas')} className="text-xs text-primary font-bold">Ver todo →</button>
          </div>
          {loadingOfertas && filteredOfertas.length === 0 ? (
            <div className="px-4"><SkeletonOfertas count={4} /></div>
          ) : filteredOfertas.length === 0 ? (
            <div className="px-4">
              <div className="bg-surface-card rounded-3xl p-5 text-center">
                <Tag className="w-8 h-8 text-ink-dim mx-auto mb-2" />
                <p className="text-sm text-ink-dim">{activeCat ? 'Sin productos en esta categoría' : 'Aún no hay productos disponibles'}</p>
              </div>
            </div>
          ) : (
            <div className="relative group/destacados">
              <div ref={destacadosScrollRef} className="overflow-x-auto pl-4 py-2 no-scrollbar" {...destacadosDrag}>
                <div className="flex gap-3 pr-12" style={{ width: 'max-content' }}>
                  {/* Card compartida con la tienda individual (ver
                      src/tienda-publica/components/ProductCards.jsx). El Home
                      global NO tiene carrito — no se pasa onAdd/onRemove, así
                      que QtyControl se auto-oculta y solo se ve el precio; el
                      click en toda la card abre el detalle del producto
                      (onOpen), igual que antes. Los colores vienen de
                      HOME_CARD_COLORS (paleta general de la app), no de la
                      marca de ninguna tienda en particular. */}
                  {destacadosMezclados.map((o) => (
                    <ProductCardVertical
                      key={o.id}
                      p={o}
                      qty={0}
                      onOpen={() => { if (destacadosWasDragged()) return; setSelectedProduct(o); navigate('product-detail'); }}
                      {...HOME_CARD_COLORS}
                    />
                  ))}
                </div>
              </div>
              <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-surface-card to-transparent transition-opacity duration-200 ${destacadosEdges.left ? 'opacity-100' : 'opacity-0'}`} />
              <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-surface-card to-transparent transition-opacity duration-200 ${destacadosEdges.right ? 'opacity-100' : 'opacity-0'}`} />
              <NavArrowBtn dir="left" onClick={() => scrollBy(destacadosScrollRef, -1)}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-card shadow-md border border-slate-200 dark:border-white/10 text-ink-dim hover:text-ink hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/destacados:opacity-100 transition-all ${!destacadosEdges.left ? 'pointer-events-none !opacity-0' : ''}`} />
              <NavArrowBtn dir="right" onClick={() => scrollBy(destacadosScrollRef, 1)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-card shadow-md border border-slate-200 dark:border-white/10 text-ink-dim hover:text-ink hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/destacados:opacity-100 transition-all ${!destacadosEdges.right ? 'pointer-events-none !opacity-0' : ''}`} />
            </div>
          )}
        </div>

        {/* ── Tiendas cerca tuyo ── */}
        <div className="mt-7">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="font-black text-[15px] text-ink flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" /> Tiendas cerca tuyo
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('mapa')}
                className="h-7 px-2.5 rounded-full bg-white dark:bg-white/8 border border-slate-200 dark:border-white/10 flex items-center gap-1.5 text-ink-dim hover:text-primary hover:border-primary/50 transition-all shadow-sm text-[11px] font-semibold">
                <MapPin className="w-3 h-3" />Mapa
              </button>
              <button onClick={() => navigate('tiendas')} className="text-xs text-primary font-bold">Ver todas →</button>
            </div>
          </div>
          <div className="relative group/tiendas">
            <div ref={tiendasScrollRef} className="overflow-x-auto pl-4 py-2 no-scrollbar" {...tiendasDrag}>
              <div className="flex gap-3 pr-12" style={{ width: 'max-content' }}>
                {filteredTiendas.map((t) => (
                  <div key={t.id} onClick={() => { if (tiendasWasDragged()) return; setSelectedTienda(t); navigate('tienda-detail'); }}
                    className="w-52 shrink-0 bg-surface-card rounded-2xl p-4 cursor-pointer hover:shadow-md hover:shadow-black/6 transition-all select-none">
                    <div className="flex items-center gap-2.5 mb-2.5 pointer-events-none">
                      <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                        {t.logo ? <img src={t.logo} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate text-ink">{t.nombre}</p>
                        <p className="text-[10px] text-ink-dim truncate">{t.rubro}</p>
                      </div>
                    </div>
                    {t.rating && (
                      <div className="flex items-center gap-1 mb-2 pointer-events-none">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-ink dark:text-ink-dim">{t.rating}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs pointer-events-none">
                      {t.distancia && <span className="flex items-center gap-1 text-ink-dim"><MapPin className="w-3 h-3" />{t.distancia}</span>}
                      <span className={`flex items-center gap-1 font-semibold ml-auto ${isStoreOpen?.(t.horarios) ? 'text-ok' : 'text-ink-dim'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isStoreOpen?.(t.horarios) ? 'bg-ok' : 'bg-ink-dim'}`} />
                        {isStoreOpen?.(t.horarios) ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-surface-card to-transparent transition-opacity duration-200 ${tiendasEdges.left ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-surface-card to-transparent transition-opacity duration-200 ${tiendasEdges.right ? 'opacity-100' : 'opacity-0'}`} />
            <NavArrowBtn dir="left" onClick={() => scrollBy(tiendasScrollRef, -1)}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-card shadow-md border border-slate-200 dark:border-white/10 text-ink-dim hover:text-ink hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/tiendas:opacity-100 transition-all ${!tiendasEdges.left ? 'pointer-events-none !opacity-0' : ''}`} />
            <NavArrowBtn dir="right" onClick={() => scrollBy(tiendasScrollRef, 1)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-card shadow-md border border-slate-200 dark:border-white/10 text-ink-dim hover:text-ink hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/tiendas:opacity-100 transition-all ${!tiendasEdges.right ? 'pointer-events-none !opacity-0' : ''}`} />
          </div>
        </div>

      </div>{/* fin max-w-5xl */}
      </div>{/* fin flex-1 overflow-y-auto */}
    </div>
  );
}
