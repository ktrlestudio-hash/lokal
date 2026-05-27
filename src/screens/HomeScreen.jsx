import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  Search, MessageSquare, Flame, Store, ChevronLeft, ChevronRight,
  Package, Tag, MapPin, Star, Bell, X, LayoutGrid, User
} from 'lucide-react';
import { LogoSymbol, LogoFull } from '../Brand';
import CategoryIcon from '../CategoryIcon';
import { getCategoryPath } from '../categories';
import NavArrowBtn from '../components/ui/NavArrowBtn';
import useScrollEdges from '../hooks/useScrollEdges';

export default function HomeScreen(props) {
  const {
    homeActiveCat, setHomeActiveCat,
    visibleOfertas = [], tiendas = [], allDemandas = [], allCategories = [],
    addRecentSearch, recentSearches = [], clearRecentSearches,
    setSelectedProduct, setSelectedTienda, setSelectedDemanda,
    navigate, navigateSearch, setEditingDemanda,
    loadingOfertas, loadingDemandas, demandasActivas = [],
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
      ...allDemandas.filter(d => d.estado !== 'resuelto' && (ms(d.titulo) || ms(d.descripcion))).slice(0, 2).map(d => ({ _t: 'demanda', ...d })),
    ];
  }, [lq, visibleOfertas, tiendas, allDemandas]);

  const lSelect = (item) => {
    addRecentSearch?.(item._t === 'tienda' ? item.nombre : item.titulo);
    setLq(''); setLOpen(false);
    if (item._t === 'oferta')  { setSelectedProduct?.(item); navigate('product-detail'); }
    if (item._t === 'tienda')  { setSelectedTienda?.(item); navigate('tienda-detail'); }
    if (item._t === 'demanda') { setSelectedDemanda?.(item); navigate('detalle'); }
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
    { bg: 'from-primary via-primary to-primary-hover', Icon: MessageSquare, title: '¿Qué necesitás hoy?', sub: 'Publicá y las tiendas locales te responden', cta: 'Crear demanda', action: () => { setEditingDemanda?.(null); navigate('crear'); } },
    { bg: 'from-brand via-brand to-brand-dark', Icon: Flame, title: 'Ofertas exclusivas', sub: 'Los mejores precios de tu ciudad', cta: 'Ver todo', action: () => navigate('todas-ofertas') },
    { bg: 'from-[#0B132B] via-slate-800 to-slate-700', Icon: Store, title: 'Tiendas cerca tuyo', sub: 'Comercios locales a tu alcance', cta: 'Explorar', action: () => navigate('tiendas') },
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

  const filteredDemandas = activeCat
    ? demandasActivas.filter(d => {
        const path = getCategoryPath(d.categoryId, allCategories);
        return path.some(c => c.id === activeCat) || d.categoryId === activeCat;
      })
    : demandasActivas;

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

  const catRoot = allCategories.filter(c => c.parentId === null);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0d16] pb-32">

      {/* ── Header sticky mobile ── */}
      <div className="lg:hidden sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/10">
        <div className="px-3 h-14 flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <LogoSymbol size={26} className="text-slate-900 dark:text-white" />
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10" />
            <input
              value={lq}
              onChange={e => { setLq(e.target.value); setLOpen(true); }}
              onFocus={() => setLOpen(true)}
              onBlur={() => setTimeout(() => setLOpen(false), 150)}
              placeholder="Buscar productos y tiendas..."
              className="ui-input w-full pl-9 pr-3 bg-slate-100 dark:bg-white/6 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              onKeyDown={e => { if (e.key === 'Enter' && lq.trim()) { addRecentSearch?.(lq.trim()); navigateSearch?.(lq.trim()); setLq(''); setLOpen(false); } }}
            />
            {/* Dropdown resultados */}
            {lOpen && lResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50">
                {lResults.map((item, i) => (
                  <button key={i} onMouseDown={() => lSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-left">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0 overflow-hidden">
                      {(item.fotos?.[0] || item.foto || item.logo)
                        ? <img src={item.fotos?.[0] || item.foto || item.logo} alt="" className="w-full h-full object-cover" />
                        : item._t === 'tienda' ? <Store className="w-4 h-4 text-slate-400" />
                        : item._t === 'oferta' ? <Tag className="w-4 h-4 text-slate-400" />
                        : <Package className="w-4 h-4 text-slate-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item._t === 'tienda' ? item.nombre : item.titulo}</p>
                      <p className="text-[10px] text-slate-400">{item._t === 'tienda' ? item.rubro : item._t === 'oferta' ? item.tiendaNombre : 'Demanda'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={(e) => openNotifications(e.currentTarget)} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 relative text-slate-500 transition-colors shrink-0">
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
          </button>
          <button onClick={() => props.onOpenProfile?.()} className="ui-avatar-btn shrink-0 ring-2 ring-transparent hover:ring-primary transition-all">
            {props.firebaseUser?.photoURL
              ? <img src={props.firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
              )
            }
          </button>
        </div>

        {/* Categorías mobile */}
        <div className="relative group/catscroll">
          <div ref={catScrollMobileRef} className="flex gap-2 overflow-x-auto px-3 pb-3 pt-1 no-scrollbar">
            <button onClick={() => setActiveCat(null)} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${!activeCat ? 'bg-primary' : 'bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15'}`}>
                <Search className={`w-6 h-6 ${!activeCat ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <span className={`text-[10px] font-semibold leading-tight text-center ${!activeCat ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>Todos</span>
            </button>
            {catRoot.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${activeCat === cat.id ? 'bg-primary' : 'bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15'}`}>
                  <CategoryIcon name={cat.icon} className={`w-6 h-6 ${activeCat === cat.id ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <span className={`text-[10px] font-semibold leading-tight text-center ${activeCat === cat.id ? 'text-primary' : 'text-slate-500'}`}>
                  {cat.shortName || cat.name.split(' ')[0]}
                </span>
              </button>
            ))}
            <button onClick={() => navigate('categorias')} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-dashed border-slate-300 dark:border-white/20">
                <LayoutGrid className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-[10px] font-semibold leading-tight text-center text-slate-400">Ver todas</span>
            </button>
          </div>
          <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent transition-opacity duration-200 ${catMobileEdges.left ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-slate-900 to-transparent transition-opacity duration-200 ${catMobileEdges.right ? 'opacity-100' : 'opacity-0'}`} />
          <NavArrowBtn dir="left" onClick={() => scrollCat(catScrollMobileRef, -1)}
            className={`absolute left-1 top-[22px] w-7 h-7 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 z-10 lg:opacity-0 lg:group-hover/catscroll:opacity-100 transition-opacity ${!catMobileEdges.left ? 'pointer-events-none !opacity-0' : ''}`} />
          <NavArrowBtn dir="right" onClick={() => scrollCat(catScrollMobileRef, 1)}
            className={`absolute right-1 top-[22px] w-7 h-7 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 z-10 lg:opacity-0 lg:group-hover/catscroll:opacity-100 transition-opacity ${!catMobileEdges.right ? 'pointer-events-none !opacity-0' : ''}`} />
        </div>
      </div>

      {/* ── Desktop header ── */}
      <div className="hidden lg:block sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/10">
        <div className="h-14 flex items-center px-6 gap-3 max-w-5xl mx-auto">
          <div className="flex items-center shrink-0 text-[#0B132B] dark:text-white">
            <LogoFull size={22} />
          </div>
          <div className="flex-1 relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10" />
            <input
              value={lq}
              onChange={e => { setLq(e.target.value); setLOpen(true); }}
              onFocus={() => setLOpen(true)}
              onBlur={() => setTimeout(() => setLOpen(false), 150)}
              placeholder="Buscar productos, tiendas, demandas..."
              className="ui-input w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/6 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              onKeyDown={e => { if (e.key === 'Enter' && lq.trim()) { addRecentSearch?.(lq.trim()); navigateSearch?.(lq.trim()); setLq(''); setLOpen(false); } }}
            />
            {lOpen && lResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50">
                {lResults.map((item, i) => (
                  <button key={i} onMouseDown={() => lSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-left">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0 overflow-hidden">
                      {(item.fotos?.[0] || item.foto || item.logo)
                        ? <img src={item.fotos?.[0] || item.foto || item.logo} alt="" className="w-full h-full object-cover" />
                        : item._t === 'tienda' ? <Store className="w-4 h-4 text-slate-400" />
                        : item._t === 'oferta' ? <Tag className="w-4 h-4 text-slate-400" />
                        : <Package className="w-4 h-4 text-slate-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item._t === 'tienda' ? item.nombre : item.titulo}</p>
                      <p className="text-[10px] text-slate-400">{item._t === 'tienda' ? item.rubro : item._t === 'oferta' ? item.tiendaNombre : 'Demanda'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={(e) => openNotifications(e.currentTarget)} className="ui-icon-btn text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 relative transition-colors shrink-0">
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
          </button>
          <div className="relative shrink-0" ref={props.profileDropdownRef}>
            <button onClick={() => props.toggleProfileMenu?.()} className={`ui-avatar-btn ring-2 transition-all ${props.showProfileDropdown ? 'ring-primary' : 'ring-transparent hover:ring-primary'}`}>
              {props.firebaseUser?.photoURL
                ? <img src={props.firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
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
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${active ? 'bg-primary' : 'bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15'}`}>
                    {isAll
                      ? <Search className={`w-6 h-6 ${active ? 'text-white' : 'text-slate-500'}`} />
                      : <CategoryIcon name={cat.icon} className={`w-6 h-6 ${active ? 'text-white' : 'text-slate-500'}`} />
                    }
                  </div>
                  <span className={`text-[10px] font-semibold leading-tight text-center ${active ? 'text-primary' : 'text-slate-500'}`}>
                    {isAll ? 'Todos' : (cat.shortName || cat.name.split(' ')[0])}
                  </span>
                </button>
              );
            })}
            <button onClick={() => navigate('categorias')} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-dashed border-slate-300 dark:border-white/20">
                <LayoutGrid className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-[10px] font-semibold leading-tight text-center text-slate-400">Ver todas</span>
            </button>
          </div>
          <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent transition-opacity duration-200 ${catDesktopEdges.left ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-slate-900 to-transparent transition-opacity duration-200 ${catDesktopEdges.right ? 'opacity-100' : 'opacity-0'}`} />
          <NavArrowBtn dir="left" onClick={() => scrollCat(catScrollDesktopRef, -1)}
            className={`absolute left-1 top-[22px] w-7 h-7 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 z-10 opacity-0 group-hover/catscrollD:opacity-100 transition-opacity ${!catDesktopEdges.left ? 'pointer-events-none !opacity-0' : ''}`} />
          <NavArrowBtn dir="right" onClick={() => scrollCat(catScrollDesktopRef, 1)}
            className={`absolute right-1 top-[22px] w-7 h-7 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 z-10 opacity-0 group-hover/catscrollD:opacity-100 transition-opacity ${!catDesktopEdges.right ? 'pointer-events-none !opacity-0' : ''}`} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto">

        {/* ── Hero mapa decorativo ── */}
        <div
          onClick={() => navigate('mapa')}
          className="relative overflow-hidden cursor-pointer select-none"
          style={{ height: 200, background: 'linear-gradient(135deg, #0B132B 0%, #0B132B 45%, #00B8D9 100%)' }}
        >
          {/* Grilla de puntos */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
          {/* Líneas de ruta decorativas */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <polyline points="0,120 60,80 120,100 200,60 280,90 360,50 440,80 520,40" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 4" />
            <polyline points="0,160 80,140 160,155 240,130 320,150 400,120 480,145" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 6" />
          </svg>
          {/* Pins decorativos */}
          <div className="absolute" style={{ top: 38, left: '22%' }}>
            <div className="w-7 h-7 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center animate-bounce" style={{ animationDelay: '0s', animationDuration: '2.2s' }}>
              <Store className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="w-1 h-3 bg-primary mx-auto" />
            <div className="w-1.5 h-1.5 bg-primary/50 rounded-full mx-auto" />
          </div>
          <div className="absolute" style={{ top: 55, left: '55%' }}>
            <div className="w-6 h-6 rounded-full bg-brand shadow-lg shadow-brand/40 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '2.5s' }}>
              <Store className="w-3 h-3 text-white" />
            </div>
            <div className="w-1 h-2.5 bg-brand mx-auto" />
            <div className="w-1.5 h-1.5 bg-brand/50 rounded-full mx-auto" />
          </div>
          <div className="absolute" style={{ top: 28, left: '72%' }}>
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center animate-bounce" style={{ animationDelay: '1.1s', animationDuration: '2s' }}>
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="w-1 h-3 bg-white/30 mx-auto" />
            <div className="w-1.5 h-1.5 bg-white/20 rounded-full mx-auto" />
          </div>
          <div className="absolute" style={{ top: 70, left: '38%' }}>
            <div className="w-5 h-5 rounded-full bg-primary/70 flex items-center justify-center animate-bounce" style={{ animationDelay: '1.8s', animationDuration: '2.8s' }}>
              <Store className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="w-0.5 h-2 bg-primary/50 mx-auto" />
          </div>
          {/* Halo de pulso en el centro */}
          <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          {/* Degradado inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0B132B]/80 to-transparent" />
          {/* Contenido */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
            <p className="text-white font-black text-lg leading-tight mb-1">
              {tiendas.length > 0 ? `${tiendas.length} tiendas cerca tuyo` : 'Explorá tu ciudad'}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-xs">Comercios locales en el mapa</p>
              <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
                <MapPin className="w-3 h-3" /> Abrir mapa
              </span>
            </div>
          </div>
        </div>

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
              <button key={i} onClick={() => setBannerIdx(i)} className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-5 bg-primary' : 'w-1.5 bg-slate-300 dark:bg-white/20'}`} />
            ))}
          </div>
        </div>

        {/* ── Destacados cerca tuyo ── */}
        <div className="mt-5">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="font-black text-[15px] text-slate-900 dark:text-white">Destacados cerca tuyo</h2>
            <button onClick={() => navigate('todas-ofertas')} className="text-xs text-primary font-bold">Ver todo →</button>
          </div>
          {loadingOfertas ? (
            <div className="flex gap-3 px-4 overflow-hidden">
              {[1,2,3].map(i => (
                <div key={i} className="w-44 shrink-0 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-slate-200 dark:bg-white/8" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-white/8 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOfertas.length === 0 ? (
            <div className="px-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 text-center">
                <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">{activeCat ? 'Sin productos en esta categoría' : 'Aún no hay productos disponibles'}</p>
              </div>
            </div>
          ) : (
            <div className="relative group/destacados">
              <div ref={destacadosScrollRef} className="overflow-x-auto pl-4 py-2 no-scrollbar" {...destacadosDrag}>
                <div className="flex gap-3 pr-12" style={{ width: 'max-content' }}>
                  {filteredOfertas.map((o, i) => {
                    const vc = VENTAJA_CONFIG[o.ventaja] || {};
                    const img = o.galeria?.[0] || o.fotos?.[0];
                    return (
                      <div key={o.id}
                        onClick={() => { if (destacadosWasDragged()) return; setSelectedProduct(o); navigate('product-detail'); }}
                        className="w-44 shrink-0 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-black/8 active:scale-[0.98] transition-all select-none">
                        <div className="h-48 bg-slate-100 dark:bg-white/5 relative overflow-hidden pointer-events-none">
                          {img
                            ? <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                            : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/8"><Package className="w-12 h-12 text-slate-300" /></div>
                          }
                          {vc.label && vc.Icon && (
                            <span className={`absolute top-2 left-2 ${vc.color} text-white text-[10px] font-bold px-2 py-1 rounded-xl flex items-center gap-1`}>
                              <vc.Icon className="w-2.5 h-2.5" />{vc.label}
                            </span>
                          )}
                        </div>
                        <div className="p-3 pointer-events-none">
                          <p className="font-bold text-[13px] leading-snug line-clamp-2 mb-0.5 text-slate-900 dark:text-white">{o.titulo}</p>
                          <p className="text-[11px] text-slate-400 truncate mb-2">{o.tiendaNombre}</p>
                          {o.precio
                            ? <p className="text-base font-black text-slate-900 dark:text-white">${Number(o.precio).toLocaleString()}</p>
                            : <p className="text-[11px] text-slate-400 italic">Consultá precio</p>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-slate-50 dark:from-[#0a0d16] to-transparent transition-opacity duration-200 ${destacadosEdges.left ? 'opacity-100' : 'opacity-0'}`} />
              <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 dark:from-[#0a0d16] to-transparent transition-opacity duration-200 ${destacadosEdges.right ? 'opacity-100' : 'opacity-0'}`} />
              <NavArrowBtn dir="left" onClick={() => scrollBy(destacadosScrollRef, -1)}
                className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/destacados:opacity-100 transition-all ${!destacadosEdges.left ? 'pointer-events-none !opacity-0' : ''}`} />
              <NavArrowBtn dir="right" onClick={() => scrollBy(destacadosScrollRef, 1)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/destacados:opacity-100 transition-all ${!destacadosEdges.right ? 'pointer-events-none !opacity-0' : ''}`} />
            </div>
          )}
        </div>

        {/* ── Tiendas cerca tuyo ── */}
        <div className="mt-7">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="font-black text-[15px] text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" /> Tiendas cerca tuyo
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('mapa')}
                className="h-7 px-2.5 rounded-full bg-white dark:bg-white/8 border border-slate-200 dark:border-white/10 flex items-center gap-1.5 text-slate-500 hover:text-primary hover:border-primary/50 transition-all shadow-sm text-[11px] font-semibold">
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
                    className="w-52 shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-4 cursor-pointer hover:shadow-md hover:shadow-black/6 transition-all select-none">
                    <div className="flex items-center gap-2.5 mb-2.5 pointer-events-none">
                      <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                        {t.logo ? <img src={t.logo} alt="" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate text-slate-900 dark:text-white">{t.nombre}</p>
                        <p className="text-[10px] text-slate-400 truncate">{t.rubro}</p>
                      </div>
                    </div>
                    {t.rating && (
                      <div className="flex items-center gap-1 mb-2 pointer-events-none">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.rating}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs pointer-events-none">
                      {t.distancia && <span className="flex items-center gap-1 text-slate-400"><MapPin className="w-3 h-3" />{t.distancia}</span>}
                      <span className={`flex items-center gap-1 font-semibold ml-auto ${isStoreOpen?.(t.horarios) ? 'text-ok' : 'text-slate-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isStoreOpen?.(t.horarios) ? 'bg-ok' : 'bg-slate-300'}`} />
                        {isStoreOpen?.(t.horarios) ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-slate-50 dark:from-[#0a0d16] to-transparent transition-opacity duration-200 ${tiendasEdges.left ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 dark:from-[#0a0d16] to-transparent transition-opacity duration-200 ${tiendasEdges.right ? 'opacity-100' : 'opacity-0'}`} />
            <NavArrowBtn dir="left" onClick={() => scrollBy(tiendasScrollRef, -1)}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/tiendas:opacity-100 transition-all ${!tiendasEdges.left ? 'pointer-events-none !opacity-0' : ''}`} />
            <NavArrowBtn dir="right" onClick={() => scrollBy(tiendasScrollRef, 1)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/tiendas:opacity-100 transition-all ${!tiendasEdges.right ? 'pointer-events-none !opacity-0' : ''}`} />
          </div>
        </div>

        {/* ── Mis demandas (compactas) ── */}
        <div className="mt-7 px-4 pb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-[15px] text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> {props.firebaseUser ? 'Mis demandas' : 'Publicá tu pedido'}
            </h2>
            {props.firebaseUser && demandasActivas.length > 0 && (
              <button onClick={() => navigate('mis-demandas')} className="text-xs text-primary font-bold">Ver todas →</button>
            )}
          </div>

          {/* Guest mode: invitación a login */}
          {!props.firebaseUser && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-brand" />
              </div>
              <h3 className="font-black text-sm mb-1">¿Qué estás buscando?</h3>
              <p className="text-xs text-slate-400 mb-3">Publicá tu demanda y las tiendas locales te responden</p>
              <button onClick={() => props.onOpenProfile?.()}
                className="px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 mx-auto">
                <svg width={16} height={16} viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Entrar con Google
              </button>
            </div>
          )}

          {/* Logged in: mis demandas normales */}
          {props.firebaseUser && (
            loadingDemandas ? (
              <div className="space-y-2">{[1,2].map(i => <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl h-16 animate-pulse" />)}</div>
            ) : demandasActivas.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-black text-sm mb-1">¿Qué estás buscando?</h3>
                <p className="text-xs text-slate-400 mb-3">Publicá tu demanda y las tiendas te responden</p>
                <button onClick={() => { setEditingDemanda?.(null); navigate('crear'); }}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm transition-colors">
                  Crear demanda
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDemandas.slice(0, 3).map((d, i) => {
                  const foto = d.fotos?.[0] || d.foto;
                  return (
                    <div key={d.id} onClick={() => { setSelectedDemanda(d); navigate('detalle'); }}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-3 flex gap-3 cursor-pointer hover:shadow-sm transition-all active:scale-[0.99]">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/8 shrink-0 overflow-hidden flex items-center justify-center">
                        {foto ? <img src={foto} alt="" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate text-slate-900 dark:text-white">{d.titulo}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-0.5 ${d.respuestas > 0 ? 'text-primary' : 'text-slate-400'}`}>
                          <MessageSquare className="w-2.5 h-2.5" />{d.respuestas} resp.
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 self-center shrink-0" />
                    </div>
                  );
                })}
                {filteredDemandas.length > 3 && (
                  <button onClick={() => navigate('mis-demandas')}
                    className="w-full py-3 bg-white dark:bg-slate-900 rounded-2xl text-sm font-semibold text-primary hover:bg-primary/5 transition-colors">
                    Ver {filteredDemandas.length - 3} más →
                  </button>
                )}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}
