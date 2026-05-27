import React from 'react';
import { Package, CheckCircle } from 'lucide-react';

export default function DemandaCard({ demanda, respondida, onClick }) {
  const d = demanda;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-3xl border-2 p-5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] ${respondida ? 'border-brand/15 dark:border-brand/20' : 'border-slate-100 dark:border-white/10'}`}
    >
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
          {(d.fotos?.[0] || d.foto) ? (
            <img src={d.fotos?.[0] || d.foto} alt="" className="w-full h-full object-cover" />
          ) : (
            <Package className="w-7 h-7 text-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold truncate">{d.titulo}</h3>
            {respondida ? (
              <span className="flex items-center gap-1 text-xs font-bold text-brand-dark bg-brand/8 px-2.5 py-1 rounded-xl shrink-0">
                <CheckCircle className="w-3 h-3" /> Respondida
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl shrink-0">Nueva</span>
            )}
          </div>
          {d.descripcion && <p className="text-sm text-slate-500 line-clamp-2 mb-2">{d.descripcion}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-400">{d.tiempoCreado}</span>
            {d.presupuesto?.max && (
              <span className="text-xs font-semibold text-brand-dark bg-brand/8 px-2 py-0.5 rounded-lg">
                Hasta ${d.presupuesto.max.toLocaleString()}
              </span>
            )}
            {(d.categorias || []).map(c => (
              <span key={c} className="text-xs bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
