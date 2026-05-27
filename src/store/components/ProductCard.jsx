import React from 'react';
import { Package, Edit3, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ProductCard({ product, onEdit, onDelete, onToggleActive }) {
  const o = product;
  const isActive = o.activa !== false;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${isActive ? 'border-slate-100 dark:border-white/8' : 'border-dashed border-slate-200 dark:border-white/15 opacity-60'} overflow-hidden`}>
      <div className="flex gap-3 p-4">
        {/* Foto */}
        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-white/8 overflow-hidden shrink-0 flex items-center justify-center">
          {o.fotos?.[0] ? (
            <img src={o.fotos[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <Package className="w-7 h-7 text-slate-400" />
          )}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-sm line-clamp-1">{o.titulo}</p>
          </div>
          {o.descripcion && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{o.descripcion}</p>}
          <div className="flex items-center gap-2 mt-1.5">
            {o.precio && (
              <span className="text-sm font-black text-brand-dark dark:text-brand">
                ${Number(o.precio).toLocaleString()}
              </span>
            )}
            {o.precioOriginal && o.precio && Number(o.precioOriginal) > Number(o.precio) && (
              <span className="text-xs text-slate-400 line-through">
                ${Number(o.precioOriginal).toLocaleString()}
              </span>
            )}
            {o.stock != null && (
              <span className="text-xs text-slate-400 ml-auto">Stock: {o.stock}</span>
            )}
          </div>
        </div>
      </div>
      {/* Acciones */}
      <div className="flex items-center gap-2 px-4 pb-3">
        {onToggleActive && (
          <button
            onClick={() => onToggleActive(o)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${isActive ? 'bg-brand/8 dark:bg-brand/15 text-brand-dark dark:text-brand' : 'bg-slate-100 dark:bg-white/8 text-slate-500'}`}
          >
            {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {isActive ? 'Activa' : 'Inactiva'}
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(o)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Editar
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(o.id)}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
