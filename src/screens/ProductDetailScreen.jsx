import React from 'react';
import { ArrowLeft, Package, Store, MapPin, MessageSquare, Navigation, Heart, ChevronRight, Zap, CheckCircle, Bell, Search, User } from 'lucide-react';
import NavArrowBtn from '../components/ui/NavArrowBtn';
import useScrollEdges from '../hooks/useScrollEdges';
import { VENTAJA_CONFIG } from '../utils/ventajaConfig';

export default function ProductDetailScreen({
  oferta,
  tiendas,
  visibleOfertas,
  allDemandas,
  firebaseUser,
  unreadCount,
  toggleProfileMenu,
  openNotifications,
  goBack,
  navigate,
  openChat,
  setSelectedProduct,
  setSelectedTienda,
  setSelectedDemanda,
  setMapaFocusStore,
  setMapaFocusProduct,
  setMapaAutoRoute,
  mainScrollRef,
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
    if (item._t === 'tienda')  { setSelectedTienda(item); navigate('tienda-detail'); }
    if (item._t === 'demanda') { setSelectedDemanda(item); navigate('detalle'); }
  };

  const photos = oferta.galeria?.length ? oferta.galeria : oferta.fotos?.length ? oferta.fotos : [];
  const tiendaMatch = tiendas.find(t => t.id === oferta.tiendaId);
  const vc = VENTAJA_CONFIG[oferta.ventaja] || {};
  const isUserProduct = !!oferta.vendedorId;

  const handleConsultar = () => {
    if (isUserProduct) {
      const tel = (oferta.contactoWhatsapp || '').replace(/\D/g, '');
      if (!tel) return;
      const txt = encodeURIComponent(`Hola, vi "${oferta.titulo}" en Lokal y me interesa.`);
      window.open(`https://wa.me/54${tel}?text=${txt}`, '_blank');
      return;
    }
    const tel = (tiendaMatch?.telefono || oferta.tiendaTelefono || '').replace(/\D/g, '');
    if (!tel) return;
    const txt = encodeURIComponent(`Hola, vi el producto "${oferta.titulo}" en Lokal y me interesa.`);
    window.open(`https://wa.me/54${tel}?text=${txt}`, '_blank');
  };

  const handleVerTienda = () => {
    if (tiendaMatch) { setSelectedTienda(tiendaMatch); navigate('tienda-detail'); return; }
    const slug = oferta.tiendaSlug || oferta.slug;
    if (slug) window.open(`/t/${slug}`, '_blank');
  };

  const handleNavegar = () => {
    if (tiendaMatch) setMapaFocusStore(tiendaMatch);
    setMapaAutoRoute(true);
    navigate('mapa');
  };

  const canVerTienda = !isUserProduct && !!(tiendaMatch || oferta.tiendaSlug || oferta.slug);
  const canNavegar = !isUserProduct && !!(tiendaMatch?.lat && tiendaMatch?.lng);
  const canConsultar = isUserProduct
    ? !!(oferta.contactoWhatsapp)
    : !!(tiendaMatch?.telefono || oferta.tiendaTelefono);
  const canChatTienda = !isUserProduct && !!tiendaMatch;
  const handleChatTienda = () => {
    if (tiendaMatch) openChat(
      { id: tiendaMatch.id, tienda: tiendaMatch.nombre, foto: tiendaMatch.logo, telefono: tiendaMatch.telefono },
      oferta
    );
  };

  const masDeLaTienda = visibleOfertas.filter(o => o.tiendaId === oferta.tiendaId && o.id !== oferta.id).slice(0, 8);
  const similares = visibleOfertas.filter(o => o.categoryId === oferta.categoryId && o.id !== oferta.id && o.tiendaId !== oferta.tiendaId).slice(0, 8);

  const [badgeModal, setBadgeModal] = React.useState(null);

  React.useEffect(() => {
    mainScrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [oferta.id]);

  const BADGE_INFO = {
    disponible: {
      icon: Zap, color: 'bg-emerald-500', label: 'Disponible hoy',
      title: '¿Qué significa "Disponible hoy"?',
      body: 'La tienda confirmó que este producto tiene stock físico en el local. Podés acercarte hoy mismo a comprarlo o retirarlo, sin necesidad de esperar envíos ni encargos.',
    },
    responde: {
      icon: MessageSquare, color: 'bg-brand', label: 'Responde rápido',
      title: '¿Qué significa "Responde rápido"?',
      body: 'Esta tienda tiene un tiempo de respuesta promedio menor a 2 horas por WhatsApp. Cuando consultes por este producto, podés esperar una respuesta el mismo día.',
    },
    verificada: {
      icon: CheckCircle, color: 'bg-primary', label: 'Tienda verificada',
      title: '¿Qué significa "Tienda verificada"?',
      body: 'Lokal verificó que esta tienda es un comercio real con domicilio físico en la ciudad. Revisamos su dirección, horarios y datos de contacto para que puedas confiar en tu compra.',
    },
  };

  const BadgeModal = () => {
    const info = BADGE_INFO[badgeModal];
    if (!info) return null;
    const { icon: Icon, color, title, body } = info;
    return (
      <div className="fixed inset-0 z-[9000] flex items-end lg:items-center justify-center px-4 pb-4 lg:pb-0"
        onClick={() => setBadgeModal(null)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}>
          <div className={`${color} px-6 pt-6 pb-8 flex flex-col items-center gap-3`}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-black text-lg text-center leading-tight">{info.label}</p>
          </div>
          <div className="px-6 py-5">
            <p className="font-bold text-slate-900 mb-2">{title}</p>
            <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
          </div>
          <div className="px-6 pb-6">
            <button onClick={() => setBadgeModal(null)}
              className="w-full h-11 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-sm text-slate-700 transition-colors">
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  };

  const BenefitCards = ({ bg }) => (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {[
        { icon: Zap,          text: 'Disponible hoy',  key: 'disponible',  modal: true },
        { icon: MapPin,       text: oferta.distancia ? `A ${oferta.distancia}` : 'Cerca tuyo', key: 'mapa', modal: false },
        { icon: MessageSquare,text: 'Responde rápido', key: 'responde',    modal: true },
        { icon: CheckCircle,  text: 'Tienda verificada',key: 'verificada', modal: true },
      ].map(({ icon: Icon, text, key, modal }) => (
        <button key={key}
          onClick={() => {
            if (modal) { setBadgeModal(key); return; }
            if (tiendaMatch) { setMapaFocusStore(tiendaMatch); setMapaFocusProduct(oferta); }
            navigate('mapa');
          }}
          className={`flex items-center gap-2 ${bg} rounded-2xl px-3 py-2.5 text-left hover:brightness-95 active:scale-[0.98] transition-all`}>
          <Icon className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-slate-700">{text}</span>
          <ChevronRight className="w-3 h-3 text-slate-300 ml-auto shrink-0" />
        </button>
      ))}
    </div>
  );

  const WaSvg = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );

  const MiniCard = ({ o }) => {
    const img = o.galeria?.[0] || o.fotos?.[0];
    const ovc = VENTAJA_CONFIG[o.ventaja] || {};
    return (
      <div onClick={() => { setSelectedProduct(o); }}
        className="shrink-0 w-44 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden hover:shadow-lg hover:shadow-black/8 active:scale-[0.98] cursor-pointer transition-all select-none">
        <div className="h-44 bg-slate-100 dark:bg-white/6 relative overflow-hidden pointer-events-none">
          {img
            ? <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
            : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/4 dark:to-white/8"><Package className="w-12 h-12 text-slate-300 dark:text-white/20" /></div>
          }
          {ovc.label && ovc.Icon && (
            <span className={`absolute top-2 left-2 ${ovc.pastel} text-slate-700 dark:text-slate-200 text-[10px] font-bold px-2 py-1 rounded-xl flex items-center gap-1`}>
              <ovc.Icon className={`w-2.5 h-2.5 shrink-0 ${ovc.iconColor || ''}`} />{ovc.label}
            </span>
          )}
        </div>
        <div className="p-3 pointer-events-none">
          <p className="font-bold text-[13px] leading-snug line-clamp-2 mb-0.5">{o.titulo}</p>
          <p className="text-[11px] text-slate-400 truncate mb-1.5">{o.tiendaNombre}</p>
          {o.precio
            ? <p className="text-base font-black text-slate-900 dark:text-slate-100">${Number(o.precio).toLocaleString()}</p>
            : <p className="text-[11px] text-slate-400 italic">Consultá precio</p>
          }
        </div>
      </div>
    );
  };

  const RelatedSection = ({ title, items, onVerTienda }) => {
    const rRef = React.useRef(null);
    const edges = useScrollEdges(rRef);
    const rScroll = (dir) => rRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
    return (
      <div>
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="font-black text-[15px] text-slate-900">{title}</h2>
          {onVerTienda && <button onClick={onVerTienda} className="text-xs text-primary font-bold">Ver tienda →</button>}
        </div>
        <div className="relative group/rel">
          <div ref={rRef} className="overflow-x-auto pl-4 py-2 no-scrollbar" style={{ cursor: 'grab' }}>
            <div className="flex gap-3 pr-12" style={{ width: 'max-content' }}>
              {items.map(o => <MiniCard key={o.id} o={o} />)}
            </div>
          </div>
          <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-surface-dim to-transparent transition-opacity duration-200 ${edges.left ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-surface-dim to-transparent transition-opacity duration-200 ${edges.right ? 'opacity-100' : 'opacity-0'}`} />
          <NavArrowBtn dir="left" onClick={() => rScroll(-1)}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-md border border-slate-200 text-slate-500 hover:text-slate-800 z-10 lg:opacity-0 lg:group-hover/rel:opacity-100 ${!edges.left ? 'pointer-events-none !opacity-0' : ''}`} />
          <NavArrowBtn dir="right" onClick={() => rScroll(1)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-md border border-slate-200 text-slate-500 hover:text-slate-800 z-10 lg:opacity-0 lg:group-hover/rel:opacity-100 ${!edges.right ? 'pointer-events-none !opacity-0' : ''}`} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ════════════════════ MOBILE (< lg) ════════════════════ */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/8">
          <div className="px-3 h-14 flex items-center gap-2">
            <button onClick={goBack} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10" />
              <input type="text"
                value={lq}
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

        <div className="bg-white">
          <div className="relative bg-slate-100 overflow-hidden" style={{ height: '60vw', maxHeight: 340, minHeight: 220 }}>
            {photos[photoIdx]
              ? <img src={photos[photoIdx]} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <Package className="w-20 h-20 text-slate-300" />
                </div>
            }
            <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm z-10 hover:bg-white transition-colors">
              <Heart className="w-4 h-4 text-slate-400" />
            </button>
            {photos.length > 1 && (
              <>
                <NavArrowBtn dir="left" onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm text-slate-700" />
                <NavArrowBtn dir="right" onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm text-slate-700" />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === photoIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="px-5 pt-5">
            <div className="flex items-start gap-2 mb-2">
              <h1 className="flex-1 font-black text-2xl leading-tight text-slate-900">{oferta.titulo}</h1>
              {vc.label && vc.Icon && (
                <span className={`shrink-0 mt-1 ${vc.pastel} text-slate-700 dark:text-slate-200 text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1`}>
                  <vc.Icon className={`w-3 h-3 shrink-0 ${vc.iconColor || ''}`} />{vc.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-4">
              {oferta.distancia && <><span className="text-slate-300">·</span><span className="text-sm text-slate-500">A {oferta.distancia} de vos</span></>}
            </div>
            {oferta.precioOriginal && oferta.precio && Number(oferta.precioOriginal) > Number(oferta.precio) && (
              <p className="text-sm text-slate-400 line-through">${Number(oferta.precioOriginal).toLocaleString()}</p>
            )}
            <div className="mb-1">
              {oferta.precio
                ? <p className="text-4xl font-black text-slate-900">${Number(oferta.precio).toLocaleString()}</p>
                : <p className="text-xl font-bold text-slate-500">Consultá el precio</p>}
            </div>
            {oferta.financiacion && <p className="text-sm text-brand font-semibold mb-1">💳 {oferta.financiacion}</p>}
            <p className="text-sm text-slate-400 mb-5">3 cuotas sin interés disponibles</p>
            {oferta.descripcion && <p className="text-sm text-slate-600 leading-relaxed mb-5">{oferta.descripcion}</p>}
            {tiendaMatch && (
              <div className="bg-slate-50 rounded-3xl p-4 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-bold text-sm truncate text-slate-900">{tiendaMatch.nombre}</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-ok shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500">Tienda verificada · {tiendaMatch.distancia}</p>
                </div>
                <button onClick={handleVerTienda}
                  className="shrink-0 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                  Ver tienda
                </button>
              </div>
            )}
            <BenefitCards bg="bg-slate-50" />
          </div>
        </div>

        <div className="bg-white border-t border-slate-100 px-5 py-4">
          {isUserProduct ? (
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl bg-slate-50">
                <User className="w-5 h-5 text-slate-500" />
                <span className="text-[11px] font-bold text-slate-500 truncate max-w-full px-1">{oferta.vendedorNombre || 'Vendedor'}</span>
              </div>
              <button onClick={handleConsultar} disabled={!canConsultar}
                className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 text-white disabled:opacity-40 active:scale-95 transition-all font-bold text-sm"
                style={{ boxShadow: canConsultar ? '0 4px 14px rgba(16,185,129,0.35)' : 'none' }}>
                <WaSvg />
                Contactar por WhatsApp
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleVerTienda} disabled={!canVerTienda}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-slate-100 dark:bg-white/8 disabled:opacity-40 active:scale-95 transition-all">
                <Store className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Ver tienda</span>
              </button>
              <button onClick={handleNavegar} disabled={!canNavegar}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-brand text-white disabled:opacity-40 active:scale-95 transition-all"
                style={{ boxShadow: canNavegar ? '0 4px 14px rgba(0,184,217,0.35)' : 'none' }}>
                <Navigation className="w-5 h-5" />
                <span className="text-[11px] font-bold">Navegar</span>
              </button>
              {canChatTienda ? (
                <button onClick={handleChatTienda}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-slate-100 dark:bg-white/8 active:scale-95 transition-all">
                  <MessageSquare className="w-5 h-5 text-brand" />
                  <span className="text-[11px] font-bold text-brand">Chat</span>
                </button>
              ) : (
                <button onClick={handleConsultar} disabled={!canConsultar}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-slate-100 dark:bg-white/8 disabled:opacity-40 active:scale-95 transition-all">
                  <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Consultar</span>
                </button>
              )}
            </div>
          )}
        </div>

        {(masDeLaTienda.length > 0 || similares.length > 0) && (
          <div className="mt-2 space-y-6 pb-24">
            {masDeLaTienda.length > 0 && (
              <div className="bg-white pt-5 pb-2">
                <RelatedSection title={`Más de ${oferta.tiendaNombre}`} items={masDeLaTienda} onVerTienda={tiendaMatch ? handleVerTienda : null} />
              </div>
            )}
            {similares.length > 0 && (
              <div className="bg-white pt-5 pb-2">
                <RelatedSection title="Productos similares" items={similares} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════ DESKTOP (≥ lg) ════════════════════ */}
      <div className="hidden lg:block">
        <div className="bg-white border-b border-slate-100 px-8 h-14 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-400 truncate">{oferta.titulo}</span>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex gap-10 items-start">
            <div className="w-[480px] shrink-0">
              <div className="relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm" style={{ height: 420 }}>
                {photos[photoIdx]
                  ? <img src={photos[photoIdx]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <Package className="w-24 h-24 text-slate-300" />
                    </div>
                }
                {vc.label && vc.Icon && (
                  <span className={`absolute top-4 left-4 ${vc.pastel} text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5`}>
                    <vc.Icon className={`w-3.5 h-3.5 shrink-0 ${vc.iconColor || ''}`} />{vc.label}
                  </span>
                )}
                <button className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
                  <Heart className="w-4 h-4 text-slate-400" />
                </button>
                {photos.length > 1 && <>
                  <NavArrowBtn dir="left" onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm text-slate-700 hover:bg-white" />
                  <NavArrowBtn dir="right" onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm text-slate-700 hover:bg-white" />
                </>}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {photos.map((p, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === photoIdx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {tiendaMatch && (
                <button onClick={handleVerTienda} className="flex items-center gap-2 mb-4 group">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-primary group-hover:underline">{tiendaMatch.nombre}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-ok" />
                  <span className="text-xs text-slate-400">{tiendaMatch.distancia}</span>
                </button>
              )}

              <h1 className="font-black text-3xl leading-tight text-slate-900 mb-3">{oferta.titulo}</h1>

              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-ok" />
                  <span className="text-sm font-semibold text-ok">En stock</span>
                </div>
                {oferta.distancia && <><span className="text-slate-300">·</span><span className="text-sm text-slate-500">A {oferta.distancia} de vos</span></>}
              </div>

              <div className="mb-2">
                {oferta.precioOriginal && oferta.precio && Number(oferta.precioOriginal) > Number(oferta.precio) && (
                  <p className="text-base text-slate-400 line-through">${Number(oferta.precioOriginal).toLocaleString()}</p>
                )}
                {oferta.precio
                  ? <p className="text-5xl font-black text-slate-900">${Number(oferta.precio).toLocaleString()}</p>
                  : <p className="text-2xl font-bold text-slate-500">Consultá el precio</p>}
              </div>
              {oferta.financiacion && <p className="text-sm text-brand font-semibold mb-1">💳 {oferta.financiacion}</p>}
              <p className="text-sm text-slate-400 mb-6">3 cuotas sin interés disponibles</p>

              <div className="flex gap-3 mb-7">
                {isUserProduct ? (
                  <>
                    <div className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <User className="w-5 h-5 text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-500 truncate max-w-full px-1">{oferta.vendedorNombre || 'Vendedor'}</span>
                    </div>
                    <button onClick={handleConsultar} disabled={!canConsultar}
                      className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 transition-all font-bold text-sm"
                      style={{ boxShadow: canConsultar ? '0 4px 14px rgba(16,185,129,0.35)' : 'none' }}>
                      <WaSvg />
                      Contactar por WhatsApp
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleVerTienda} disabled={!canVerTienda}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12 disabled:opacity-40 transition-all">
                      <Store className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Ver tienda</span>
                    </button>
                    <button onClick={handleNavegar} disabled={!canNavegar}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-brand hover:bg-brand-dark text-white disabled:opacity-40 transition-all"
                      style={{ boxShadow: canNavegar ? '0 4px 14px rgba(0,184,217,0.35)' : 'none' }}>
                      <Navigation className="w-5 h-5" />
                      <span className="text-[11px] font-bold">Navegar</span>
                    </button>
                    {canChatTienda ? (
                      <button onClick={handleChatTienda}
                        className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-brand hover:bg-brand-dark text-white transition-all"
                        style={{ boxShadow: '0 4px 14px rgba(0,184,217,0.35)' }}>
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-[11px] font-bold">Chat</span>
                      </button>
                    ) : (
                      <button onClick={handleConsultar} disabled={!canConsultar}
                        className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12 disabled:opacity-40 transition-all">
                        <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Consultar</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {oferta.descripcion && (
                <div className="border-t border-slate-100 pt-5 mb-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{oferta.descripcion}</p>
                </div>
              )}

              <BenefitCards bg="bg-white border border-slate-100" />
            </div>
          </div>

          {(masDeLaTienda.length > 0 || similares.length > 0) && (
            <div className="mt-12 space-y-10">
              {masDeLaTienda.length > 0 && (
                <div className="border-t border-slate-200 pt-8">
                  <RelatedSection title={`Más de ${oferta.tiendaNombre}`} items={masDeLaTienda} onVerTienda={tiendaMatch ? handleVerTienda : null} />
                </div>
              )}
              {similares.length > 0 && (
                <div className="border-t border-slate-200 pt-8">
                  <RelatedSection title="Productos similares" items={similares} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <BadgeModal />
    </div>
  );
}
