import React from 'react';
import { Search, Package, MessageSquare, ChevronRight, AlertCircle, Loader2, ArrowUpDown, LayoutGrid, LayoutList } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import CategoryFilterBar from '../components/ui/CategoryFilterBar';
import CustomSelect from '../components/ui/CustomSelect';
import { getCategoryPath, getAllDescendants } from '../categories';

export default function MisDemandas({
  demandasActivas, allCategories, demandaRootIds, sortedDemandas,
  sortBy, setSortBy,
  loadingDemandas, errorDemandas, fetchDemandas,
  setSelectedDemanda, navigate, goBack, setEditingDemanda,
  pageHeaderProps,
}) {
  const [localSearch, setLocalSearch] = React.useState('');
  const [localCategory, setLocalCategory] = React.useState(null);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState(() => localStorage.getItem('lokal-view-demandas') || 'grid');
  const toggleView = () => setViewMode(m => { const n = m === 'list' ? 'grid' : 'list'; localStorage.setItem('lokal-view-demandas', n); return n; });
  const sortRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const localSorted = [...demandasActivas].filter(d => {
    const q = localSearch.toLowerCase();
    if (q && !d.titulo.toLowerCase().includes(q) && !(d.descripcion || '').toLowerCase().includes(q)) return false;
    if (localCategory) {
      if (!d.categoryId) return false;
      const descendants = getAllDescendants(localCategory, allCategories);
      if (d.categoryId !== localCategory && !descendants.includes(d.categoryId)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0a0d16] pb-28 lg:pb-8">
      <PageHeader
        title="Mis Demandas"
        hideTitle
        onBack={goBack}
        {...pageHeaderProps}
        searchValue={localSearch}
        searchInput={<>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input type="text" value={localSearch} onChange={e => setLocalSearch(e.target.value)}
            placeholder="Buscar demandas..."
            className="ui-input w-full pl-9 pr-3 bg-slate-100 dark:bg-white/6 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </>}
        filtersSlot={demandasActivas.length > 0 ? <CategoryFilterBar filterCategory={localCategory} setFilterCategory={setLocalCategory} categories={allCategories} presentIds={demandaRootIds} navigate={navigate} /> : undefined}
      >
        <div className="relative lg:hidden" ref={sortRef}>
          <button onClick={() => setSortOpen(o => !o)} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 transition-colors text-slate-500 dark:text-slate-400">
            <ArrowUpDown className="w-4 h-4" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 w-40 animate-dropdown-in">
              {[{ value: 'recientes', label: 'Más recientes' }, { value: 'respuestas', label: 'Más respuestas' }].map(opt => (
                <button key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${sortBy === opt.value ? 'text-primary dark:text-primary bg-primary/8 dark:bg-primary/10' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="hidden lg:block">
          <CustomSelect value={sortBy} onChange={setSortBy} options={[{ value: 'recientes', label: 'Recientes' }, { value: 'respuestas', label: 'Más respuestas' }]} />
        </div>
        <button onClick={toggleView} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 transition-colors text-slate-500 dark:text-slate-400">
          {viewMode === 'list' ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
        </button>
        {loadingDemandas ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <span className="text-xs text-slate-400 font-medium hidden lg:inline">{sortedDemandas.length}</span>}
      </PageHeader>

      <div className="px-4 lg:px-6 py-4 max-w-3xl">
        {errorDemandas && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-sm text-rose-700 dark:text-rose-400 flex-1">{errorDemandas}</p>
            <button onClick={fetchDemandas} className="text-xs font-bold text-rose-600 underline">Reintentar</button>
          </div>
        )}
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-4 gap-3' : 'grid grid-cols-1 lg:grid-cols-2 gap-3'}>
          {loadingDemandas ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-white/8 shrink-0" />
              <div className="flex-1 space-y-2.5 py-1">
                <div className="h-3 bg-slate-200 dark:bg-white/8 rounded w-1/3" />
                <div className="h-4 bg-slate-200 dark:bg-white/8 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-2/3" />
              </div>
            </div>
          )) : localSorted.map((d, i) => {
            const foto = d.fotos?.[0] || d.foto;
            const catPath = getCategoryPath(d.categoryId, allCategories);
            const catLabel = catPath.length > 0 ? catPath[catPath.length - 1].name : (typeof d.categoryId === 'string' && d.categoryId ? d.categoryId : null);
            const isActive = d.estado === 'activa';
            const estadoConfig = {
              activa:   { color: 'bg-ok',       text: 'Activa' },
              pausada:  { color: 'bg-amber-400', text: 'Pausada' },
              resuelto: { color: 'bg-slate-400', text: 'Resuelta' },
            };
            const ec = estadoConfig[d.estado] || estadoConfig.activa;

            if (viewMode === 'grid') return (
              <div key={d.id} onClick={() => { setSelectedDemanda(d); navigate('detalle'); }}
                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/30 transition-all active:scale-[0.98] animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}>
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/6 dark:to-white/10 relative overflow-hidden">
                  {foto ? <img src={foto} alt={d.titulo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-slate-300 dark:text-white/20" /></div>}
                  {!isActive && <div className="absolute inset-0 bg-black/45 flex items-center justify-center"><span className="text-[9px] font-black text-white uppercase tracking-wider">{ec.text}</span></div>}
                  <span className={`absolute top-2 left-2 ${ec.color} w-2 h-2 rounded-full shadow`} />
                </div>
                <div className="p-2.5">
                  {catLabel && <p className="text-[10px] font-bold text-primary truncate mb-0.5">{catLabel.split(/\s+(?:y|e|&)\s+/i)[0]}</p>}
                  <p className="text-xs font-bold line-clamp-2 leading-snug text-slate-900 dark:text-white">{d.titulo}</p>
                  <div className="flex items-center justify-between mt-1.5 gap-1">
                    {d.presupuesto?.max ? <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">${Number(d.presupuesto.max).toLocaleString()}</span> : <span />}
                    <span className={`flex items-center gap-0.5 text-[10px] font-bold shrink-0 ${d.respuestas > 0 ? 'text-primary' : 'text-slate-400'}`}>
                      <MessageSquare className="w-2.5 h-2.5" />{d.respuestas}
                    </span>
                  </div>
                </div>
              </div>
            );

            return (
              <div key={d.id} onClick={() => { setSelectedDemanda(d); navigate('detalle'); }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex gap-3.5 cursor-pointer hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/30 transition-all duration-200 active:scale-[0.99] animate-fade-up group"
                style={{ animationDelay: `${i * 40}ms` }}>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/6 dark:to-white/10 shrink-0 overflow-hidden relative flex items-center justify-center self-start mt-0.5">
                  {foto ? <img src={foto} alt={d.titulo} className="w-full h-full object-cover" /> : <Package className="w-7 h-7 text-slate-300 dark:text-white/20" />}
                  {!isActive && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-[8px] font-black text-white uppercase tracking-wider">{ec.text}</span></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${ec.color} shrink-0`} />
                    {catLabel && <span className="text-[10px] font-bold text-primary dark:text-primary truncate">{catLabel.split(/\s+(?:y|e|&)\s+/i)[0]}</span>}
                    <span className="text-[10px] text-slate-300 dark:text-white/20">·</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{d.tiempoCreado}</span>
                  </div>
                  <h3 className="font-bold text-sm leading-snug line-clamp-1 mb-1 text-slate-900 dark:text-white">{d.titulo}</h3>
                  {d.descripcion && <p className="text-xs text-slate-400 line-clamp-1 mb-2">{d.descripcion}</p>}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {d.presupuesto?.max && <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/8 px-2 py-0.5 rounded-full">hasta ${Number(d.presupuesto.max).toLocaleString()}</span>}
                    {d.attributes && Object.entries(d.attributes).slice(0, 1).map(([k, v]) => (
                      <span key={k} className="text-[10px] bg-slate-100 dark:bg-white/8 text-slate-500 px-2 py-0.5 rounded-full font-medium">{k}: {v}</span>
                    ))}
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ml-auto shrink-0 ${d.respuestas > 0 ? 'text-primary dark:text-primary bg-primary/8 dark:bg-primary/10' : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/6'}`}>
                      <MessageSquare className="w-2.5 h-2.5" />{d.respuestas} resp.
                    </span>
                  </div>
                </div>
                <div className="self-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            );
          })}
        </div>
        {!loadingDemandas && localSorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-primary/8 dark:bg-primary/10 rounded-3xl flex items-center justify-center mb-5"><Package className="w-12 h-12 text-primary" /></div>
            <h3 className="text-xl font-black mb-2">{localSearch ? 'Sin resultados' : 'Sin demandas aún'}</h3>
            <p className="text-sm text-slate-400 max-w-xs mb-8">{localSearch ? 'Probá con otras palabras clave' : 'Publicá lo que necesitás y las tiendas locales te van a responder'}</p>
            {!localSearch && <button onClick={() => { setEditingDemanda(null); navigate('crear'); }} className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-sm transition-colors shadow-lg shadow-primary/25">Crear mi primera demanda</button>}
          </div>
        )}
      </div>
    </div>
  );
}
