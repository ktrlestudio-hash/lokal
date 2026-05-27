import React from 'react';
import { ArrowLeft, Search, Package, Store, MessageSquare, Share2, Bell, Star, MapPin, Clock, Navigation, Phone, MessageCircle, Globe, ExternalLink, Send } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import NavArrowBtn from '../components/ui/NavArrowBtn';
import useScrollEdges from '../hooks/useScrollEdges';
import { VENTAJA_CONFIG } from '../utils/ventajaConfig';
import { StoreMap } from '../LeafletMap';
import { isStoreOpen, getNextOpen, DAY_NAMES, DAY_LABELS } from '../utils/helpers';

export default function TiendaDetailScreen({
  tienda,
  tiendas,
  visibleOfertas,
  allDemandas,
  allCategories,
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
  setSelectedDemanda,
  setMapaFocusStore,
  setOfertasStoreFilter,
  mainScrollRef,
  showToast,
  isDark,
}) {
  const [photoIdx, setPhotoIdx] = React.useState(0);
  const [lq, setLq] = React.useState('');
  const [lOpen, setLOpen] = React.useState(false);

  const lResults = React.useMemo(() => {
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
    setLq(''); setLOpen(false);
    if (item._t === 'oferta')  { setSelectedProduct(item); navigate('product-detail'); }
    if (item._t === 'tienda')  { setSelectedTienda(item); navigateReplace('tienda-detail'); }
    if (item._t === 'demanda') { setSelectedDemanda(item); navigate('detalle'); }
  };

  const photos = [tienda.logo, ...(tienda.galeria || []), ...(tienda.fotos || [])].filter(Boolean);
  const ofertasTienda = visibleOfertas.filter(o => o.tiendaId === tienda.id);
  const open = isStoreOpen(tienda.horarios);
  const nextOpen = !open ? getNextOpen(tienda.horarios) : null;
  const todayKey = DAY_NAMES[new Date().getDay()];
  const simRef = React.useRef(null);
  const simEdges = useScrollEdges(simRef);
  const scrollSim = (dir) => simRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  const pdScrollRef = React.useRef(null);
  const pdEdges = useScrollEdges(pdScrollRef);
  const scrollPd = (dir) => pdScrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });

  React.useEffect(() => {
    mainScrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tienda.id]);

  const tiendaCats = React.useMemo(() =>
    (tienda.categoryIds || []).map(cid => allCategories.find(c => c.id === cid)).filter(Boolean),
  [tienda.categoryIds, allCategories]);

  const handleShare = () => {
    const url = tienda.slug ? `${window.location.origin}/t/${tienda.slug}` : window.location.href;
    if (navigator.share) {
      navigator.share({ title: tienda.nombre, text: tienda.descripcion || '', url });
    } else {
      navigator.clipboard?.writeText(url);
      showToast('Link copiado', 'ok');
    }
  };

  const getTiendasSimilares = (referenceTiendas, excludeIds = new Set()) =>
    tiendas.filter(t => {
      if (excludeIds.has(t.id)) return false;
      return referenceTiendas.some(ref =>
        (t.categoryIds || []).some(cid => (ref.categoryIds || []).includes(cid)) ||
        (ref.rubro && t.rubro?.toLowerCase() === ref.rubro?.toLowerCase())
      );
    });

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0a0d16] pb-24">

      {/* Top bar móvil */}
      <div className="lg:hidden sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/8">
        <div className="px-3 h-14 flex items-center gap-2">
          <button onClick={() => { setSelectedTienda(null); goBack(); }} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10" />
            <input type="text" value={lq}
              onChange={e => { setLq(e.target.value); setLOpen(true); }}
              onFocus={() => setLOpen(true)}
              onBlur={() => setTimeout(() => setLOpen(false), 150)}
              placeholder="Buscar productos y tiendas..."
              className="ui-input w-full pl-9 pr-3 bg-slate-100 dark:bg-white/6 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
            {lOpen && lResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-[999] overflow-hidden max-h-96 overflow-y-auto">
                {lResults.filter(r => r._t === 'oferta').length > 0 && (<div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-widest uppercase text-slate-400">Productos</p>
                  {lResults.filter(r => r._t === 'oferta').map(item => (
                    <button key={item.id} onMouseDown={() => lSelect(item)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-left">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.galeria?.[0] || item.fotos?.[0] ? <img src={item.galeria?.[0] || item.fotos?.[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{item.titulo}</p><p className="text-xs text-slate-400 truncate">{item.tiendaNombre}</p></div>
                      {item.precio && <p className="text-sm font-bold text-primary shrink-0">${Number(item.precio).toLocaleString()}</p>}
                    </button>
                  ))}
                </div>)}
                {lResults.filter(r => r._t === 'tienda').length > 0 && (<div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-widest uppercase text-slate-400">Tiendas</p>
                  {lResults.filter(r => r._t === 'tienda').map(item => (
                    <button key={item.id} onMouseDown={() => lSelect(item)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-left">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 shrink-0 flex items-center justify-center"><Store className="w-4 h-4 text-primary" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{item.nombre}</p><p className="text-xs text-slate-400 truncate">{item.rubro}</p></div>
                    </button>
                  ))}
                </div>)}
                {lResults.filter(r => r._t === 'demanda').length > 0 && (<div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-widest uppercase text-slate-400">Demandas</p>
                  {lResults.filter(r => r._t === 'demanda').map(item => (
                    <button key={item.id} onMouseDown={() => lSelect(item)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 text-left">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-slate-400" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{item.titulo}</p></div>
                    </button>
                  ))}
                </div>)}
                <div className="h-2" />
              </div>
            )}
          </div>
          <button onClick={handleShare} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 text-slate-500 shrink-0">
            <Share2 className="w-[18px] h-[18px]" />
          </button>
          <button onClick={openNotifications} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 relative text-slate-500 transition-colors shrink-0">
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

      {/* Hero */}
      <div className="relative h-64 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        {photos.length > 0
          ? photos.map((src, i) => (
              <img key={src} src={src} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                style={{ opacity: i === photoIdx ? 1 : 0 }} />
            ))
          : <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl font-black text-white/8 select-none">{tienda.nombre?.[0]}</span>
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        {photos.length > 1 && (
          <>
            <NavArrowBtn dir="left" onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm text-slate-700" />
            <NavArrowBtn dir="right" onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm text-slate-700" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 items-center z-10">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setPhotoIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === photoIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10 space-y-3 pb-8">

        {/* Tarjeta principal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-visible">
          <div className="p-5 pt-0">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              <div className="w-20 h-20 rounded-2xl shrink-0 ring-4 ring-white dark:ring-slate-900 shadow-xl overflow-hidden bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
                {tienda.logo
                  ? <img src={tienda.logo} alt="" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-black text-brand select-none">{tienda.nombre?.[0]}</span>
                }
              </div>
              <div className="pb-1 flex-1 min-w-0">
                <h2 className="font-black text-xl leading-tight">{tienda.nombre}</h2>
                {tienda.rubro && <p className="text-sm text-slate-500 dark:text-slate-400">{tienda.rubro}</p>}
              </div>
              {tienda.slug && (
                <button
                  onClick={() => window.open(`/t/${tienda.slug}`, '_blank')}
                  className="shrink-0 pb-1 flex flex-col items-center gap-1 text-primary hover:text-brand-dark transition-colors"
                  title="Ver página web de la tienda">
                  <Globe className="w-5 h-5" />
                  <span className="text-[10px] font-bold">Web</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${open ? 'bg-ok/10 text-ok' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-ok' : 'bg-rose-500'}`} />
                {open ? 'Abierto ahora' : 'Cerrado'}
              </span>
              {nextOpen && <span className="text-xs text-slate-400">{nextOpen}</span>}
              {tienda.rating && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {tienda.rating}
                  {tienda.totalReseñas && <span className="text-amber-400/70 font-normal">({tienda.totalReseñas})</span>}
                </span>
              )}
              {tienda.ciudad && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-white/8 px-2.5 py-1 rounded-full">
                  <MapPin className="w-3 h-3 shrink-0" />{tienda.ciudad}
                </span>
              )}
            </div>

            {tiendaCats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tiendaCats.map(cat => (
                  <span key={cat.id} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand/10 dark:bg-brand/15 text-brand-dark dark:text-brand">
                    {cat.name || cat.nombre}
                  </span>
                ))}
              </div>
            )}

            {tienda.descripcion && (
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{tienda.descripcion}</p>
            )}

            {tienda.slug && (
              <button
                onClick={() => window.open(`/t/${tienda.slug}`, '_blank')}
                className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-brand/10 to-brand/5 dark:from-brand/15 dark:to-brand/8 border border-brand/20 dark:border-brand/25 hover:border-brand/40 transition-colors group">
                <Globe className="w-5 h-5 text-brand shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-bold text-brand">Página web de la tienda</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">lokal.com.ar/t/{tienda.slug}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-brand/60 group-hover:text-brand transition-colors shrink-0" />
              </button>
            )}

            {(() => {
              const tel = (tienda.whatsapp || tienda.telefono || '').replace(/\D/g, '');
              const hasWA = !!tel;
              const hasPhone = !!tienda.telefono;
              const cols = [true, hasPhone, hasWA, true].filter(Boolean).length;
              return (
                <div className={`grid grid-cols-${cols} gap-2`}>
                  <button
                    onClick={() => { setMapaFocusStore(tienda); navigate('mapa'); }}
                    className="flex flex-col items-center gap-1.5 py-3 bg-slate-900 dark:bg-white/10 text-white dark:text-slate-200 rounded-xl font-semibold text-xs hover:opacity-90 transition-opacity">
                    <Navigation className="w-4 h-4" />Navegar
                  </button>
                  {hasPhone && (
                    <button
                      onClick={() => window.open(`tel:${tienda.telefono}`, '_self')}
                      className="flex flex-col items-center gap-1.5 py-3 bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs hover:bg-slate-200 dark:hover:bg-white/12 transition-colors">
                      <Phone className="w-4 h-4" />Llamar
                    </button>
                  )}
                  {hasWA && (
                    <button
                      onClick={() => window.open(`https://wa.me/54${tel}?text=${encodeURIComponent(`Hola ${tienda.nombre}, te contacto desde Lokal.`)}`, '_blank')}
                      className="flex flex-col items-center gap-1.5 py-3 bg-[#25D366] text-white rounded-xl font-semibold text-xs hover:opacity-90 transition-opacity">
                      <MessageCircle className="w-4 h-4" />WhatsApp
                    </button>
                  )}
                  <button
                    onClick={() => openChat({ id: tienda.id, tienda: tienda.nombre, foto: tienda.logo || null, mensaje: '¡Hola! ¿En qué puedo ayudarte?' })}
                    className="flex flex-col items-center gap-1.5 py-3 bg-primary text-white rounded-xl font-semibold text-xs hover:bg-primary-hover transition-colors">
                    <MessageSquare className="w-4 h-4" />Chat
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Productos y ofertas */}
        {ofertasTienda.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[15px]">Productos y ofertas</h3>
              <button onClick={() => { setOfertasStoreFilter(tienda); navigate('todas-ofertas'); }} className="text-xs text-primary font-bold">Ver todos →</button>
            </div>
            <div className="relative group/pdscroll -mx-4">
              <div ref={pdScrollRef} className="overflow-x-auto pl-4 py-2 no-scrollbar">
                <div className="flex gap-3 pr-12" style={{ width: 'max-content' }}>
                  {ofertasTienda.map((o) => {
                    const vc = VENTAJA_CONFIG[o.ventaja] || {};
                    const img = o.galeria?.[0] || o.fotos?.[0];
                    return (
                      <div key={o.id}
                        onClick={() => { setSelectedProduct(o); navigate('product-detail'); }}
                        className="w-44 shrink-0 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-black/8 active:scale-[0.98] transition-all select-none">
                        <div className="h-44 bg-slate-100 dark:bg-white/6 relative overflow-hidden pointer-events-none">
                          {img
                            ? <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                            : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/4 dark:to-white/8"><Package className="w-12 h-12 text-slate-300 dark:text-white/20" /></div>
                          }
                          {vc.label && vc.Icon && (
                            <span className={`absolute top-2 left-2 ${vc.pastel} text-slate-700 dark:text-slate-200 text-[10px] font-bold px-2 py-1 rounded-xl flex items-center gap-1`}>
                              <vc.Icon className={`w-2.5 h-2.5 shrink-0 ${vc.iconColor || ''}`} />{vc.label}
                            </span>
                          )}
                        </div>
                        <div className="p-3 pointer-events-none">
                          <p className="font-bold text-[13px] leading-snug line-clamp-2 mb-0.5">{o.titulo}</p>
                          {o.precio
                            ? <p className="text-base font-black text-slate-900 dark:text-slate-100">${Number(o.precio).toLocaleString()}</p>
                            : <p className="text-[11px] text-slate-400 italic">Consultá precio</p>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#f7f8fa] dark:from-[#0a0d16] to-transparent transition-opacity duration-200 ${pdEdges.left ? 'opacity-100' : 'opacity-0'}`} />
              <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#f7f8fa] dark:from-[#0a0d16] to-transparent transition-opacity duration-200 ${pdEdges.right ? 'opacity-100' : 'opacity-0'}`} />
              <NavArrowBtn dir="left" onClick={() => scrollPd(-1)} className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/pdscroll:opacity-100 transition-all ${!pdEdges.left ? 'pointer-events-none !opacity-0' : ''}`} />
              <NavArrowBtn dir="right" onClick={() => scrollPd(1)} className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/pdscroll:opacity-100 transition-all ${!pdEdges.right ? 'pointer-events-none !opacity-0' : ''}`} />
            </div>
          </div>
        )}

        {/* Mapa mini */}
        {tienda.lat && tienda.lng && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
            onClick={() => { setMapaFocusStore(tienda); navigate('mapa'); }}>
            <div className="relative pointer-events-none">
              <StoreMap lat={tienda.lat} lng={tienda.lng} nombre={tienda.nombre} direccion={tienda.direccion} logo={tienda.logo} dark={isDark} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3" />Abrir en mapa
                </span>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/8 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                <MapPin className="w-3 h-3 shrink-0 text-primary" />
                {tienda.direccion || tienda.ciudad || 'Ver ubicación'}
              </span>
              <span className="text-xs text-primary font-semibold flex items-center gap-1 shrink-0 ml-2">
                <Navigation className="w-3 h-3" />Cómo llegar
              </span>
            </div>
          </div>
        )}

        {/* Info + Horarios */}
        {(tienda.direccion || tienda.telefono || tienda.email) && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-white/8">
            {tienda.direccion && (
              <div className="flex gap-3 items-center px-4 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Dirección</p>
                  <p className="text-sm font-semibold truncate">{tienda.direccion}</p>
                </div>
              </div>
            )}
            {tienda.telefono && (
              <button onClick={() => window.open(`tel:${tienda.telefono}`, '_self')}
                className="w-full flex gap-3 items-center px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/4 transition-colors text-left">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Teléfono</p>
                  <p className="text-sm font-semibold text-primary">{tienda.telefono}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              </button>
            )}
            {tienda.email && (
              <button onClick={() => window.open(`mailto:${tienda.email}`, '_self')}
                className="w-full flex gap-3 items-center px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/4 transition-colors text-left">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Email</p>
                  <p className="text-sm font-semibold text-primary truncate">{tienda.email}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              </button>
            )}
          </div>
        )}

        {/* Horarios */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-bold">Horario de atención</p>
          </div>
          {tienda.horarios
            ? <div className="space-y-1.5">
                {Object.entries(tienda.horarios).map(([key, schedule]) => (
                  <div key={key} className={`flex justify-between text-sm rounded-xl px-3 py-1.5 ${key === todayKey ? 'bg-primary/8 dark:bg-primary/12' : ''}`}>
                    <span className={`font-medium ${key === todayKey ? 'text-primary font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                      {DAY_LABELS[key]}{key === todayKey && <span className="ml-1 text-[10px] font-bold uppercase tracking-wide opacity-70">hoy</span>}
                    </span>
                    <span className={key === todayKey ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}>
                      {schedule || <span className="text-rose-400">Cerrado</span>}
                    </span>
                  </div>
                ))}
              </div>
            : <p className="text-sm text-slate-400 italic">Horario no disponible</p>
          }
        </div>
      </div>

      {/* Tiendas similares */}
      {(() => {
        const byCategory = getTiendasSimilares([tienda], new Set([tienda.id]));
        const similares = (byCategory.length >= 1 ? byCategory : tiendas.filter(t => t.id !== tienda.id)).slice(0, 8);
        if (!similares.length) return null;
        return (
          <div className="max-w-2xl mx-auto pb-8">
            <div className="px-4 mb-3 flex items-center justify-between">
              <h3 className="font-bold text-base">{byCategory.length >= 2 ? 'Tiendas similares' : 'Otras tiendas'}</h3>
            </div>
            <div className="relative group/simscroll">
              <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar" ref={simRef}>
                {similares.map(t => {
                  const sOpen = isStoreOpen(t.horarios);
                  return (
                    <div key={t.id}
                      onClick={() => { setSelectedTienda(t); navigateReplace('tienda-detail'); }}
                      className="w-52 shrink-0 bg-white dark:bg-slate-800 rounded-2xl p-4 cursor-pointer hover:shadow-md hover:shadow-black/6 active:scale-[.98] transition-all select-none">
                      <div className="flex items-center gap-2.5 mb-2.5 pointer-events-none">
                        <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                          {t.logo
                            ? <img src={t.logo} alt="" className="w-full h-full object-cover" />
                            : <span className="text-base font-black text-primary">{t.nombre[0]}</span>
                          }
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
                        <span className={`flex items-center gap-1 font-semibold ml-auto ${sOpen ? 'text-ok' : 'text-slate-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${sOpen ? 'bg-ok' : 'bg-slate-300'}`} />
                          {sOpen ? 'Abierto' : 'Cerrado'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#f7f8fa] dark:from-[#0a0d16] to-transparent transition-opacity duration-200 ${simEdges.left ? 'opacity-100' : 'opacity-0'}`} />
              <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#f7f8fa] dark:from-[#0a0d16] to-transparent transition-opacity duration-200 ${simEdges.right ? 'opacity-100' : 'opacity-0'}`} />
              <NavArrowBtn dir="left" onClick={() => scrollSim(-1)} className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/simscroll:opacity-100 transition-all ${!simEdges.left ? 'pointer-events-none !opacity-0' : ''}`} />
              <NavArrowBtn dir="right" onClick={() => scrollSim(1)} className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 hover:shadow-lg z-10 lg:opacity-0 lg:group-hover/simscroll:opacity-100 transition-all ${!simEdges.right ? 'pointer-events-none !opacity-0' : ''}`} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
