/**
 * TiendaDetailScreen — wrapper delgado que reemplaza la vista vieja de
 * tienda. Ya no tiene JSX propio de tienda (hero, catálogo, mapa, etc):
 * eso vive en commerce-modern.jsx (modo="plataforma"), la ÚNICA vista de
 * tienda individual, compartida con /t/:slug (modo="standalone").
 *
 * Este archivo solo aporta el CHROME de navegación de LOKAL — top bar con
 * buscador global (cruza ofertas+tiendas de TODA la plataforma) + avatar/
 * notificaciones — que es responsabilidad de App.jsx/plataforma, no de la
 * tienda en sí, y por eso nunca migró al template.
 */
import React from 'react';
import { ArrowLeft, Search, Package, Store, Share2, Bell } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { TiendaPublicaRenderer } from '../tienda-publica/TiendaPublicaRenderer.jsx';

export default function TiendaDetailScreen({
  tienda,
  tiendas,
  visibleOfertas,
  firebaseUser,
  unreadCount,
  toggleProfileMenu,
  openNotifications,
  goBack,
  navigate,
  navigateReplace,
  openChat,
  setSelectedTienda,
  setSelectedProduct,
  setMapaFocusStore,
  setOfertasStoreFilter,
  setSearchResultsQuery,
  mainScrollRef,
  showToast,
  isDark,
  onToggleTheme,
}) {
  const [lq, setLq] = React.useState('');
  const [lOpen, setLOpen] = React.useState(false);

  const lResults = React.useMemo(() => {
    const q = lq.trim().toLowerCase();
    if (!q) return [];
    const ms = (s) => s?.toLowerCase().includes(q);
    return [
      ...visibleOfertas.filter(o => o.activa !== false && (ms(o.titulo) || ms(o.tiendaNombre))).slice(0, 4).map(o => ({ _t: 'oferta', ...o })),
      ...tiendas.filter(t => ms(t.nombre) || ms(t.rubro)).slice(0, 3).map(t => ({ _t: 'tienda', ...t })),
    ];
  }, [lq, visibleOfertas, tiendas]);

  const lSelect = (item) => {
    setLq(''); setLOpen(false);
    if (item._t === 'oferta')  { setSelectedProduct(item); navigate('product-detail'); }
    if (item._t === 'tienda')  { setSelectedTienda(item); navigateReplace('tienda-detail'); }
  };

  const handleShare = () => {
    // Sin prefijo /t/: el router (pathToTiendaSlug en Root.jsx) espera
    // /:slug de un único segmento.
    const url = tienda.slug ? `${window.location.origin}/${tienda.slug}` : window.location.href;
    if (navigator.share) {
      navigator.share({ title: tienda.nombre, text: tienda.descripcion || '', url });
    } else {
      navigator.clipboard?.writeText(url);
      showToast('Link copiado', 'ok');
    }
  };

  // Mismo criterio que la vista vieja: tiendas que comparten categoría o
  // rubro con esta, excluyéndose a sí misma.
  const tiendasSimilares = React.useMemo(() =>
    tiendas.filter(t => {
      if (t.id === tienda.id) return false;
      return (t.categoryIds || []).some(cid => (tienda.categoryIds || []).includes(cid)) ||
        (tienda.rubro && t.rubro?.toLowerCase() === tienda.rubro?.toLowerCase());
    }),
  [tiendas, tienda]);

  // commerce-modern.jsx lee tienda.productos directamente — acá se arma a
  // partir de visibleOfertas (las ofertas viven sueltas, filtradas por
  // tiendaId, no anidadas en el objeto tienda). tienda.web se resuelve a la
  // propia página pública de LOKAL (/:slug) cuando la tienda no cargó un
  // sitio externo propio — así el botón "Web" del hero siempre tiene algo
  // a donde apuntar si la tienda tiene slug.
  const tiendaConDatos = React.useMemo(() => ({
    ...tienda,
    productos: visibleOfertas.filter(o => o.tiendaId === tienda.id),
    web: tienda.web || tienda.sitioWeb || (tienda.slug ? `${window.location.origin}/${tienda.slug}` : null),
  }), [tienda, visibleOfertas]);

  React.useEffect(() => {
    mainScrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tienda.id]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#080808]">

      {/* Top bar móvil — buscador global de la plataforma. sticky (no fixed):
          el único scroll real de la pantalla logueada es el contenedor
          mainScrollRef de App.jsx (mismo patrón que el resto de pantallas,
          Home/Tiendas/etc) — este componente NO debe crear su propio scroll
          interno de 100dvh, porque quedaría anidado dentro de ese scroll y
          el paddingBottom que compensa el BottomNav fixed (que vive en
          mainScrollRef, no acá) nunca llegaría a cubrir el final real del
          contenido de la tienda. */}
      <div className="lg:hidden sticky top-0 z-20 bg-surface-card border-b border-slate-100 dark:border-white/8">
        <div className="px-3 h-14 flex items-center gap-2">
          <button onClick={() => { setSelectedTienda(null); goBack(); }} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim w-4 h-4 pointer-events-none z-10" />
            <input type="text" value={lq}
              onChange={e => { setLq(e.target.value); setLOpen(true); }}
              onFocus={() => setLOpen(true)}
              onBlur={() => setTimeout(() => setLOpen(false), 150)}
              placeholder="Buscar productos y tiendas..."
              className="ui-input w-full pl-9 pr-3 bg-surface-card-2 text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
            {lOpen && lResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-surface-card border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-[999] overflow-hidden max-h-96 overflow-y-auto">
                {lResults.filter(r => r._t === 'oferta').length > 0 && (<div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-widest uppercase text-ink-dim">Productos</p>
                  {lResults.filter(r => r._t === 'oferta').map(item => (
                    <button key={item.id} onMouseDown={() => lSelect(item)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-card-2 dark:hover:bg-white/5 text-left">
                      <div className="w-9 h-9 rounded-xl bg-surface-card-2 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.galeria?.[0] || item.fotos?.[0] ? <img src={item.galeria?.[0] || item.fotos?.[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-ink-dim" />}
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{item.titulo}</p><p className="text-xs text-ink-dim truncate">{item.tiendaNombre}</p></div>
                      {item.precio && <p className="text-sm font-bold text-primary shrink-0">${Number(item.precio).toLocaleString()}</p>}
                    </button>
                  ))}
                </div>)}
                {lResults.filter(r => r._t === 'tienda').length > 0 && (<div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-widest uppercase text-ink-dim">Tiendas</p>
                  {lResults.filter(r => r._t === 'tienda').map(item => (
                    <button key={item.id} onMouseDown={() => lSelect(item)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-card-2 dark:hover:bg-white/5 text-left">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 shrink-0 flex items-center justify-center"><Store className="w-4 h-4 text-primary" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{item.nombre}</p><p className="text-xs text-ink-dim truncate">{item.rubro}</p></div>
                    </button>
                  ))}
                </div>)}
                <div className="h-2" />
              </div>
            )}
          </div>
          <button onClick={handleShare} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim shrink-0">
            <Share2 className="w-[18px] h-[18px]" />
          </button>
          <button onClick={openNotifications} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 relative text-ink-dim transition-colors shrink-0">
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
          </button>
          <button onClick={toggleProfileMenu} className="ui-avatar-btn ring-2 ring-transparent hover:ring-primary transition-all shrink-0">
            {firebaseUser?.photoURL
              ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-primary flex items-center justify-center font-bold text-white text-sm">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</div>
            }
          </button>
        </div>
      </div>

      {/* Top bar desktop */}
      <div className="hidden lg:block">
        <PageHeader title={tienda.nombre} onBack={() => { setSelectedTienda(null); goBack(); }} />
      </div>

      {/* La tienda en sí — commerce-modern en modo plataforma */}
      <TiendaPublicaRenderer
        tienda={tiendaConDatos}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        modo="plataforma"
        onVerEnMapaGlobal={() => { setMapaFocusStore(tienda); navigate('mapa'); }}
        tiendasSimilares={tiendasSimilares}
        onIrATienda={(t) => { setSelectedTienda(t); navigateReplace('tienda-detail'); }}
        onVerTodosFiltrado={(cat) => {
          setOfertasStoreFilter(tienda);
          // TodasOfertasScreen no comparte el sistema de categorías propio
          // de cada tienda (categoryId global vs. string libre de
          // commerce-modern) — sembrar la categoría como texto de búsqueda
          // (ya acotado a esta tienda vía ofertasStoreFilter) reusa el
          // mismo mecanismo que la búsqueda global, sin inventar un filtro
          // cruzado nuevo.
          setSearchResultsQuery(cat || '');
          navigate('todas-ofertas');
        }}
      />
    </div>
  );
}
