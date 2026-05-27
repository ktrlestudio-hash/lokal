import React, { useState } from 'react';
import { Search, Store, MapPin, LayoutGrid, LayoutList } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import CategoryFilterBar from '../components/ui/CategoryFilterBar';
import { getAllDescendants } from '../categories';
import { DAY_NAMES, isStoreOpen } from '../utils/helpers';

export default function TiendasScreen({
  tiendas, allCategories, visibleOfertas,
  filterCategory, setFilterCategory,
  navigate, goBack, setSelectedTienda,
  pageHeaderProps,
}) {
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = React.useState(() => localStorage.getItem('lokal-view-tiendas') || 'grid');
  const toggleView = () => setViewMode(m => { const n = m === 'list' ? 'grid' : 'list'; localStorage.setItem('lokal-view-tiendas', n); return n; });

  const tiendaRootIds = new Set(tiendas.flatMap(t => t.categoryIds || []));
  const filtered = tiendas.filter(t => {
    const q = query.toLowerCase();
    const matchesSearch = !q || t.nombre.toLowerCase().includes(q) || t.rubro.toLowerCase().includes(q);
    const matchesCategory = !filterCategory || (() => {
      if (!t.categoryIds?.length) return false;
      const descendants = getAllDescendants(filterCategory, allCategories);
      return t.categoryIds.some(id => id === filterCategory || descendants.includes(id));
    })();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0a0d16] pb-24">
      <PageHeader
        title={`Tiendas · ${filtered.length}`}
        hideTitle
        onBack={goBack}
        {...pageHeaderProps}
        searchValue={query}
        searchInput={<>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar tiendas o rubros..."
            className="ui-input w-full pl-9 pr-3 bg-slate-100 dark:bg-white/6 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </>}
        filtersSlot={<CategoryFilterBar filterCategory={filterCategory} setFilterCategory={setFilterCategory} categories={allCategories} presentIds={tiendaRootIds} navigate={navigate} />}
      >
        <button onClick={toggleView} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 transition-colors text-slate-500 dark:text-slate-400">
          {viewMode === 'list' ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
        </button>
      </PageHeader>

      <div className={`max-w-4xl mx-auto px-4 py-5 gap-3 ${viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3' : 'grid grid-cols-1 lg:grid-cols-2'}`}>
        {filtered.map((t, i) => {
          const open = isStoreOpen(t.horarios);
          const todayHours = t.horarios?.[DAY_NAMES[new Date().getDay()]];
          const ofertaCount = visibleOfertas.filter(o => o.tiendaId === t.id && o.activa !== false).length;
          const heroBg = t.galeria?.[0] || t.fotos?.[0];

          if (viewMode === 'grid') return (
            <div key={t.id} onClick={() => { setSelectedTienda(t); navigate('tienda-detail'); }}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/35 active:scale-[0.98] transition-all animate-fade-up select-none"
              style={{ animationDelay: `${i * 30}ms` }}>
              <div className="h-32 relative overflow-hidden bg-gradient-to-br from-primary/15 to-brand/8 dark:from-primary/20 dark:to-brand/12">
                {heroBg ? <img src={heroBg} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-5xl font-black text-primary/10 dark:text-primary/15 select-none">{t.nombre[0]}</span></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
                {ofertaCount > 0 && <span className="absolute top-2 right-2 text-[9px] font-bold bg-primary text-white px-2 py-0.5 rounded-full shadow">{ofertaCount} {ofertaCount === 1 ? 'oferta' : 'ofertas'}</span>}
                <div className="absolute bottom-2 left-2 w-9 h-9 rounded-xl overflow-hidden bg-white/15 backdrop-blur-sm border border-white/30 shadow flex items-center justify-center shrink-0">
                  {t.logo ? <img src={t.logo} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-black text-white">{t.nombre[0]}</span>}
                </div>
                <span className={`absolute bottom-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${open ? 'bg-ok/90 text-white' : 'bg-black/50 text-white/80'}`}>{open ? 'Abierto' : 'Cerrado'}</span>
              </div>
              <div className="px-3 pt-2.5 pb-3">
                <p className="font-bold text-sm leading-snug text-slate-900 dark:text-white line-clamp-2 mb-0.5">{t.nombre}</p>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[11px] text-slate-400 truncate">{t.rubro}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.distancia && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{t.distancia}</span>}
                    {t.rating && <span className="text-[11px] font-bold text-amber-500">★ {t.rating}</span>}
                  </div>
                </div>
              </div>
            </div>
          );

          return (
            <div key={t.id} onClick={() => { setSelectedTienda(t); navigate('tienda-detail'); }}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/30 active:scale-[0.99] transition-all animate-fade-up select-none"
              style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex gap-0">
                <div className="w-24 shrink-0 bg-gradient-to-br from-primary/15 to-brand/8 dark:from-primary/20 dark:to-brand/12 relative overflow-hidden">
                  {heroBg ? <img src={heroBg} alt="" className="w-full h-full object-cover" /> : t.logo ? <img src={t.logo} alt="" className="w-full h-full object-cover opacity-30" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-4xl font-black text-primary/15">{t.nombre[0]}</span></div>}
                </div>
                <div className="flex-1 min-w-0 p-3">
                  <div className="flex items-start gap-2 mb-1">
                    <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden bg-primary/10 dark:bg-primary/15 flex items-center justify-center border border-slate-100 dark:border-white/10">
                      {t.logo ? <img src={t.logo} alt="" className="w-full h-full object-cover" /> : <Store className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-sm truncate leading-tight">{t.nombre}</h3>
                        {t.rating && <span className="text-[11px] font-bold text-amber-500 shrink-0">★ {t.rating}</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{t.rubro}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.distancia && <span className="flex items-center gap-0.5 text-[10px] text-slate-400"><MapPin className="w-2.5 h-2.5" />{t.distancia}</span>}
                    <span className={`flex items-center gap-1 text-[10px] font-semibold ${open ? 'text-ok' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-ok' : 'bg-slate-300'}`} />
                      {open ? 'Abierto' : 'Cerrado'}
                      {todayHours && <span className="font-normal text-slate-400">{open ? ` · hasta ${todayHours.split('-')[1]}` : ''}</span>}
                    </span>
                    {ofertaCount > 0 && <span className="text-[10px] font-bold text-primary bg-primary/8 dark:bg-primary/12 px-1.5 py-0.5 rounded-full">{ofertaCount} ofertas</span>}
                  </div>
                  {t.descripcion && <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 leading-relaxed">{t.descripcion}</p>}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-slate-300 dark:text-white/20" />
            </div>
            <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Sin tiendas encontradas</p>
            <p className="text-sm text-slate-400">Probá con otro término o categoría</p>
          </div>
        )}
      </div>
    </div>
  );
}
