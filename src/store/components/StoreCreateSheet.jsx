// StoreCreateSheet — sheet mobile "¿Qué querés crear?" disparado por el FAB
// central del BottomNav. Quinto y último componente de "shell" extraído en
// la Fase 3. Hoy con una sola opción real (producto/oferta) — la card de
// "Búsqueda laboral" se sacó porque ese módulo no existe todavía, se vuelve
// a sumar acá cuando exista.
import React from 'react';
import { Tag } from 'lucide-react';
import { isModuleActive } from '../../tienda-publica/utils.js';

export function StoreCreateSheet({
  createSheetOpen, createSheetClosing, closeCreateSheet,
  misProductosSinFiltrar, productLimit, tiendaData, isEmprendimiento,
  setProductoEditing, setProductoForm, setProductoFotoFiles, setProductoFotoPreviews,
  setProductoSaveErr, setProductoAttributes, setProductoShowForm,
  setOfertaEditing, setOfertaForm, setOfertaFotoFile, setOfertaFotoPreview, setOfertaShowForm,
}) {
  if (!createSheetOpen && !createSheetClosing) return null;

  const activeProducts = misProductosSinFiltrar.filter(o => o.activa !== false && o.visible !== false).length;
  const atProductLimit = activeProducts >= productLimit;
  const usaCatalogo = isModuleActive(tiendaData, 'catalogo');
  const opts = [
    {
      icon: Tag,
      color: atProductLimit ? 'bg-surface-card-2 dark:bg-white/8 text-ink-dim' : 'bg-primary/10 text-primary',
      title: usaCatalogo ? 'Nuevo producto' : 'Nueva oferta',
      desc: atProductLimit
        ? `Límite alcanzado: ${productLimit} ${usaCatalogo ? 'productos' : 'ofertas'} (${isEmprendimiento ? 'upgrade a Empresa' : 'upgrade a Premium'})`
        : usaCatalogo ? 'Publicá un producto en tu vitrina' : 'Publicá una oferta con foto',
      locked: atProductLimit,
      action: () => {
        if (atProductLimit) return;
        closeCreateSheet();
        if (usaCatalogo) {
          setProductoEditing(null);
          setProductoForm({ titulo: '', descripcion: '', precio: '', precioOriginal: '', badgesForzados: null, financiacion: '', stock: '1', condicion: 'nuevo', categoryId: null, contactoWhatsapp: '' });
          setProductoFotoFiles([]);
          setProductoFotoPreviews([]);
          setProductoSaveErr(null);
          setProductoAttributes({});
          setProductoShowForm(true);
        } else {
          setOfertaEditing(null);
          setOfertaForm({ nombre: '', expireAt: '', visible: true });
          setOfertaFotoFile(null);
          setOfertaFotoPreview(null);
          setOfertaShowForm(true);
        }
      },
    },
    // "Búsqueda laboral — Próximamente disponible" se saca: era una card
    // bloqueada que no hacía nada y ocupaba la mitad del sheet. Cuando el
    // módulo exista se vuelve a sumar acá.
  ];

  return (
    <div className="lg:hidden fixed inset-0 z-[4000] flex flex-col justify-end" onClick={closeCreateSheet}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ animation: createSheetClosing ? 'backdrop-out .22s ease forwards' : 'backdrop-in .22s ease' }} />
      <div className="relative bg-surface-card rounded-t-3xl px-4 pt-3 shadow-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)', animation: createSheetClosing ? 'sheet-down .22s ease forwards' : 'sheet-up .22s ease' }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-surface-card-2 dark:bg-white/15 mx-auto mb-4" />
        <p className="font-bold text-base px-1 mb-3">¿Qué querés crear?</p>
        <div className="space-y-2 pb-2">
          {opts.map(opt => {
            const Icon = opt.icon;
            return (
              <button key={opt.title} onClick={opt.locked ? undefined : opt.action} disabled={opt.locked}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-colors ${opt.locked ? 'border-slate-100 dark:border-white/8 opacity-50 cursor-not-allowed' : 'border-slate-100 dark:border-white/8 hover:border-primary hover:bg-primary/5'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${opt.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm">{opt.title}</p>
                  <p className="text-xs text-ink-dim">{opt.desc}</p>
                </div>
                {opt.locked && <span className="ml-auto text-xs bg-surface-card-2 dark:bg-white/10 text-ink-dim px-2 py-1 rounded-lg font-semibold">Pronto</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
