import React from 'react';
import { ArrowLeft } from 'lucide-react';
import CategoryIcon from '../CategoryIcon';
import { getCategoryPath } from '../categories';

export default function CategoriasScreen({ allCategories, visibleOfertas, navigate, setHomeActiveCat, setFilterCategory, returnScreen }) {
  const catRoot = allCategories.filter(c => c.parentId === null);
  const ofertasActivas = visibleOfertas.filter(o => o.activa !== false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0d16]">
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/10">
        <div className="h-14 flex items-center px-4 gap-3 max-w-5xl mx-auto">
          <button onClick={() => navigate('home')} className="ui-icon-btn text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-black text-base text-slate-900 dark:text-white flex-1">Explorar por categoría</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {catRoot.map(cat => {
            const count = ofertasActivas.filter(o => {
              const path = getCategoryPath(o.categoryId, allCategories);
              return path.some(c => c.id === cat.id) || o.categoryId === cat.id;
            }).length;
            const previews = ofertasActivas
              .filter(o => {
                const path = getCategoryPath(o.categoryId, allCategories);
                return path.some(c => c.id === cat.id) || o.categoryId === cat.id;
              })
              .slice(0, 3)
              .map(o => o.galeria?.[0] || o.fotos?.[0])
              .filter(Boolean);

            return (
              <button key={cat.id}
                onClick={() => {
                  if (setFilterCategory) { setFilterCategory(cat.id); navigate(returnScreen || 'tiendas'); }
                  else { setHomeActiveCat(cat.id); navigate('home'); }
                }}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden text-left hover:shadow-md hover:shadow-black/6 active:scale-[0.98] transition-all group">
                <div className="h-24 relative bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  {previews.length >= 2 ? (
                    <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
                      {previews.slice(0, previews.length >= 3 ? 3 : 2).map((src, i) => (
                        <div key={i} className={`${previews.length >= 3 && i === 0 ? 'row-span-2' : ''} overflow-hidden`}>
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : previews.length === 1 ? (
                    <img src={previews[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <CategoryIcon name={cat.icon} className="w-10 h-10 text-primary/40" />
                    </div>
                  )}
                  {previews.length > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  )}
                </div>
                <div className="p-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{cat.name}</p>
                    <p className="text-[10px] text-slate-400">{count > 0 ? `${count} ${count === 1 ? 'oferta' : 'ofertas'}` : 'Próximamente'}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
