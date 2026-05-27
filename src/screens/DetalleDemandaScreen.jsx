import React, { useState, useEffect } from 'react';
import { Edit3, RotateCcw, Pause, CheckCircle, Trash2, Store, MapPin, Star, Clock, MessageSquare, Navigation, Play, X } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import PhotoCarousel from '../components/ui/PhotoCarousel';
import { apiFetch } from '../api';

const API_BASE = '/.netlify/functions';

export default function DetalleDemandaScreen({
  selectedDemanda,
  allDemandas,
  goBack,
  navigate,
  setEditingDemanda,
  openChat,
  updateDemandaEstado,
  deleteDemanda,
  setShowConfirm,
}) {
  const demanda = allDemandas.find(d => d.id === selectedDemanda?.id) || selectedDemanda;
  const [respuestas, setRespuestas] = useState([]);
  const [loadingResp, setLoadingResp] = useState(true);
  const isPaused = demanda?.estado === 'pausada';

  useEffect(() => {
    if (!demanda?.id) return;
    setLoadingResp(true);
    apiFetch(`${API_BASE}/respuestas?demandaId=${demanda.id}`, { authRequired: true })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRespuestas(data))
      .catch(() => setRespuestas([]))
      .finally(() => setLoadingResp(false));
  }, [demanda?.id]);

  const handlePausar = () => {
    setShowConfirm({
      title: isPaused ? 'Reactivar demanda' : 'Pausar demanda',
      msg: isPaused ? 'Las tiendas volverin a ver tu demanda.' : 'Las tiendas dejarán de ver tu demanda temporalmente.',
      onOk: () => {
        updateDemandaEstado(demanda.id, isPaused ? 'activa' : 'pausada');
        setShowConfirm(null);
        if (!isPaused) { goBack(); }
      },
    });
  };

  const handleFinalizar = () => {
    setShowConfirm({
      title: 'Finalizar demanda',
      msg: 'Marca esta demanda como resuelta. Pasará al historial.',
      onOk: () => {
        updateDemandaEstado(demanda.id, 'finalizada');
        setShowConfirm(null);
        goBack();
      },
    });
  };

  const handleEditar = () => {
    setEditingDemanda(demanda);
    navigate('crear');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <PageHeader title={loadingResp ? 'Demanda' : `${respuestas.length} ${respuestas.length === 1 ? 'respuesta' : 'respuestas'}`} onBack={goBack}>
        {demanda?.estado === 'pausada' && <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-xl">PAUSADA</span>}
      </PageHeader>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white border-b px-5 py-6">
          {(() => {
            const imgs = demanda?.fotos?.length ? demanda.fotos : demanda?.foto ? [demanda.foto] : [];
            if (!imgs.length) return null;
            return <PhotoCarousel photos={imgs} className="mb-5 rounded-3xl overflow-hidden" />;
          })()}
          <div className="mb-5">
            <h2 className="font-bold text-lg mb-1">{demanda?.titulo}</h2>
            {demanda?.descripcion && <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{demanda.descripcion}</p>}
            {demanda?.presupuesto && (
              <p className="text-sm font-semibold text-primary mb-2">
                Presupuesto: ${demanda.presupuesto.min?.toLocaleString() || '0'} - ${demanda.presupuesto.max?.toLocaleString() || '?'}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${demanda?.estado === 'activa' ? 'bg-primary/8 text-primary border-primary/30' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {(demanda?.estado || 'activa').toUpperCase()}
              </span>
              <span className="text-xs text-slate-400 flex items-center">{demanda?.tiempoCreado}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleEditar} className="py-2.5 bg-slate-100 ui-chip text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors">
              <Edit3 className="w-4 h-4" /> Editar
            </button>
            <button onClick={handlePausar} className="py-2.5 bg-slate-100 ui-chip text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors">
              {isPaused ? <><RotateCcw className="w-4 h-4" /> Reactivar</> : <><Pause className="w-4 h-4" /> Pausar</>}
            </button>
            <button onClick={handleFinalizar} className="py-2.5 bg-slate-900 dark:bg-primary text-white ui-chip text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-800 dark:hover:bg-primary-hover transition-colors">
              <CheckCircle className="w-4 h-4" /> Finalizar
            </button>
            <button onClick={() => setShowConfirm({ title: 'Eliminar demanda', msg: 'Esta acción no se puede deshacer.', onOk: () => { setShowConfirm(null); deleteDemanda(demanda.id); } })}
              className="py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 ui-chip text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-rose-100 transition-colors">
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          </div>
        </div>

        <div className="px-5 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Respuestas de tiendas</h3>
            {respuestas.length > 0 && (
              <span className="px-3 py-1.5 bg-primary/10 text-primary dark:text-primary rounded-xl text-xs font-bold">
                {respuestas.length} {respuestas.length === 1 ? 'tienda' : 'tiendas'}
              </span>
            )}
          </div>

          {[...respuestas].sort((a, b) => {
            const order = { 'exacto-nuevo': 1, 'exacto-usado': 2, 'reacondicionado': 3, 'compatible': 4, 'similar': 5, 'imitacion': 6 };
            return (order[a.matchType] || 99) - (order[b.matchType] || 99);
          }).map(r => {
            const nombreTienda = r.tiendaNombre || r.tienda || 'Tienda';
            const fotoTienda   = r.tiendaFoto   || r.foto   || null;
            const rating       = r.tiendaRating  || r.rating || null;
            const horario      = r.tiendaHorario || r.horario || null;
            const direccion    = r.tiendaDireccion ? `${r.tiendaDireccion}${r.tiendaCiudad ? ', ' + r.tiendaCiudad : ''}` : null;
            const distancia    = r.distancia || null;

            return (
              <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {fotoTienda
                        ? <img src={fotoTienda} alt="" className="w-full h-full object-cover" />
                        : <Store className="w-5 h-5 text-brand" />
                      }
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{nombreTienda}</h4>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-0.5">
                        {distancia && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{distancia}</span>}
                        {rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{rating}</span>}
                        {horario && <span className="flex items-center gap-0.5 text-primary font-medium"><Clock className="w-3 h-3" />{horario}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {r.matchType && (() => {
                      const matchLabels = {
                        'exacto-nuevo':   { label: 'Exacto Nuevo',   color: 'bg-primary/10 text-primary dark:text-primary' },
                        'exacto-usado':   { label: 'Exacto Usado',   color: 'bg-primary/10 text-primary dark:text-primary' },
                        'reacondicionado':{ label: 'Reacondicionado',color: 'bg-primary/10 text-primary' },
                        'compatible':     { label: 'Compatible',     color: 'bg-brand/10 text-brand' },
                        'similar':        { label: 'Similar',        color: 'bg-brand/10 text-brand' },
                        'imitacion':      { label: 'Imitación',      color: 'bg-slate-200/80 text-slate-500 dark:bg-white/8 dark:text-slate-400' },
                      };
                      const m = matchLabels[r.matchType];
                      return m ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.color}`}>{m.label}</span>
                      ) : null;
                    })()}
                    <span className="text-xs text-slate-400">{r.tiempoRespuesta || 'Reciente'}</span>
                  </div>
                </div>

                <p className="text-sm bg-slate-50 dark:bg-white/5 rounded-xl p-3.5 mb-3 leading-relaxed text-slate-700 dark:text-slate-300">{r.mensaje}</p>

                {r.adjuntos?.length > 0 && (() => {
                  const [lightbox, setLightbox] = React.useState(null);
                  return (
                    <>
                      <div className={`grid gap-1.5 mb-4 ${r.adjuntos.length === 1 ? 'grid-cols-1' : r.adjuntos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {r.adjuntos.map((a, ai) => (
                          <button
                            key={ai}
                            type="button"
                            onClick={() => setLightbox(ai)}
                            className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-white/8 group"
                          >
                            {a.type === 'video'
                              ? (
                                <>
                                  <video src={a.url} className="w-full h-full object-cover" muted playsInline />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                      <Play className="w-5 h-5 text-slate-800 ml-0.5" />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <img src={a.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                              )
                            }
                          </button>
                        ))}
                      </div>
                      {lightbox !== null && (
                        <div
                          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4"
                          onClick={() => setLightbox(null)}
                        >
                          <button
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            onClick={() => setLightbox(null)}
                          >
                            <X className="w-5 h-5" />
                          </button>
                          {r.adjuntos[lightbox]?.type === 'video'
                            ? <video src={r.adjuntos[lightbox].url} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl" onClick={e => e.stopPropagation()} />
                            : <img src={r.adjuntos[lightbox].url} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
                          }
                          {r.adjuntos.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {r.adjuntos.map((_, ai) => (
                                <button key={ai} onClick={e => { e.stopPropagation(); setLightbox(ai); }}
                                  className={`w-2 h-2 rounded-full transition-all ${ai === lightbox ? 'bg-white w-5' : 'bg-white/40'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}

                {r.precio && (
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-white/8">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Precio ofrecido</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">${r.precio.toLocaleString()}</p>
                    </div>
                    {direccion && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-0.5">Dirección</p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 max-w-[160px] text-right leading-snug">{direccion}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => openChat({
                      id: r.id,
                      tienda: nombreTienda,
                      foto: fotoTienda || '🏪',
                      mensaje: `Hola! Vi tu demanda "${demanda?.titulo}". ${r.mensaje}`,
                      tiempoRespuesta: r.tiempoRespuesta,
                      chatKey: `${r.tiendaId || r.id}-${r.demandaId}`,
                    })}
                    className="py-2.5 bg-slate-900 dark:bg-primary text-white ui-chip font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-slate-700 dark:hover:bg-primary-hover transition-colors">
                    <MessageSquare className="w-4 h-4" /> Chatear
                  </button>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(direccion || nombreTienda)}`, '_blank')}
                    className="py-2.5 bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-200 ui-chip font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-white/12 transition-colors">
                    <Navigation className="w-4 h-4" /> Navegar
                  </button>
                </div>
              </div>
            );
          })}

          {loadingResp && (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-white/8 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-slate-200 dark:bg-white/8 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-16 bg-slate-100 dark:bg-white/5 rounded-xl mb-4" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="h-10 bg-slate-200 dark:bg-white/8 rounded-xl" />
                    <div className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingResp && respuestas.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl">
              <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-white/20" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Sin respuestas aún</p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">Las tiendas locales están viendo tu demanda. Te avisaremos cuando alguien responda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
