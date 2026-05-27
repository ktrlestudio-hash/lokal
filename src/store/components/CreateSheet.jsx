import React from 'react';
import { Tag, Package, Lock } from 'lucide-react';

export default function CreateSheet({ open, onClose, onCreateProduct, onCreateJob, productLimit, currentProductCount, isEmprendimiento }) {
  if (!open) return null;

  const atProductLimit = currentProductCount >= productLimit;
  const opts = [
    {
      icon: Tag,
      color: atProductLimit ? 'bg-slate-100 dark:bg-white/8 text-slate-400' : 'bg-primary/10 text-primary',
      title: 'Nuevo producto',
      desc: atProductLimit
        ? `Límite alcanzado: ${productLimit} productos (${isEmprendimiento ? 'upgrade a Empresa' : 'upgrade a Premium'})`
        : 'Publicá un producto en tu vitrina',
      locked: atProductLimit,
      action: () => {
        if (atProductLimit) return;
        onCreateProduct();
      }
    },
    {
      icon: Package,
      color: 'bg-slate-100 dark:bg-white/8 text-slate-400',
      title: 'Búsqueda laboral',
      desc: 'Próximamente disponible',
      locked: true,
      action: () => {}
    },
  ];

  return (
    <div className="lg:hidden fixed inset-0 z-[4000] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-slate-900 rounded-t-3xl px-4 pt-3 shadow-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-white/15 mx-auto mb-4" />
        <p className="font-bold text-base px-1 mb-3">¿Qué querés crear?</p>
        <div className="space-y-2 pb-2">
          {opts.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.title}
                onClick={opt.locked ? undefined : opt.action}
                disabled={opt.locked}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-colors ${opt.locked ? 'border-slate-100 dark:border-white/8 opacity-50 cursor-not-allowed' : 'border-slate-100 dark:border-white/8 hover:border-primary hover:bg-primary/5'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${opt.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm">{opt.title}</p>
                  <p className="text-xs text-slate-400">{opt.desc}</p>
                </div>
                {opt.locked && (
                  <span className="ml-auto flex items-center gap-1 text-xs bg-slate-100 dark:bg-white/10 text-slate-400 px-2 py-1 rounded-lg font-semibold">
                    <Lock className="w-3 h-3" /> Pronto
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
