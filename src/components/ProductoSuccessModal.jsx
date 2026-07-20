import React, { useState } from 'react';
import {
  CheckCircle, Edit3, Eye, X, Package,
  Tag, Zap, CreditCard, Gift,
  MessageSquare, Phone, ChevronDown, ChevronUp,
  LayoutList, ArrowRight,
} from 'lucide-react';

const CONDICION_LABEL = {
  nuevo: { label: 'Nuevo', cls: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' },
  usado: { cls: 'bg-surface-card-2 dark:bg-white/8 text-ink-dim dark:text-ink-dim border border-slate-200 dark:border-white/10', label: 'Usado' },
};

const VENTAJA_MAP = {
  precio:        { label: 'Mejor precio',   Icon: Tag,        cls: 'bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20' },
  disponibilidad:{ label: 'Tenelo hoy',     Icon: Zap,        cls: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' },
  financiacion:  { label: 'Financiación',   Icon: CreditCard, cls: 'bg-surface-card-2 dark:bg-white/8 text-ink-dim border border-slate-200 dark:border-white/10' },
  combo:         { label: 'Combo especial', Icon: Gift,       cls: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' },
};

// onMisProductos — navega al listado de productos publicados
// onClose        — cierra sin navegar (X, backdrop)
export default function ProductoSuccessModal({ product, onEdit, onView, onMisProductos, onClose }) {
  const [descOpen, setDescOpen] = useState(false);

  const foto      = product?.fotos?.[0] || product?.foto || null;
  const precio    = product?.precio ? `$${Number(product.precio).toLocaleString('es-AR')}` : null;
  const cond      = CONDICION_LABEL[product?.condicion] || null;
  const ventajas  = Array.isArray(product?.ventaja) ? product.ventaja.filter(v => VENTAJA_MAP[v]) : [];
  const desc      = product?.descripcion?.trim() || null;
  const stock     = product?.stock;
  const catName   = product?.categoryName || product?.categoryId || null;
  const financiacion = product?.financiacion?.trim() || null;
  const hasWsp    = !!product?.contactoWhatsapp;

  return (
    <div className="fixed inset-0 z-[7000] flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#0f1320] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl overflow-hidden">

        {/* X cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-white hover:bg-black/20 dark:hover:bg-white/15 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header compacto: check + textos en fila */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-5 pt-5 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-black text-white text-base leading-tight">¡Producto publicado!</p>
              <p className="text-white/75 text-xs mt-0.5">Ya está visible en tu vitrina</p>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="px-4 py-4 space-y-3 max-h-[55vh] overflow-y-auto">

          {/* Título + foto */}
          <div className="flex gap-3 items-center">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-card-2 dark:bg-white/8 shrink-0">
              {foto
                ? <img src={foto} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-ink-dim dark:text-ink-dim" /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink text-sm leading-snug">{product?.titulo}</p>
              {precio && (
                <p className="text-green-600 dark:text-green-400 font-black text-lg mt-0.5 leading-none">{precio}</p>
              )}
            </div>
          </div>

          {/* Chips: condición + stock + categoría */}
          {(cond || stock != null || catName) && (
            <div className="flex flex-wrap gap-1.5">
              {cond && (
                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${cond.cls}`}>
                  {cond.label}
                </span>
              )}
              {stock != null && (
                <span className="inline-flex items-center gap-1 bg-surface-card-2 dark:bg-white/8 text-ink-dim text-xs px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/10">
                  Stock: {stock}
                </span>
              )}
              {catName && (
                <span className="inline-flex items-center gap-1 bg-surface-card-2 dark:bg-white/8 text-ink-dim text-xs px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/10">
                  {catName}
                </span>
              )}
            </div>
          )}

          {/* Ventajas */}
          {ventajas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ventajas.map(id => {
                const v = VENTAJA_MAP[id];
                return (
                  <span key={id} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${v.cls}`}>
                    <v.Icon className="w-3 h-3" />
                    {v.label}
                  </span>
                );
              })}
              {financiacion && (
                <span className="text-xs text-ink-dim px-2.5 py-1 rounded-full bg-surface-card-2 dark:bg-white/8 border border-slate-200 dark:border-white/10 italic">
                  {financiacion}
                </span>
              )}
            </div>
          )}

          {/* Contacto */}
          <div className="flex items-center gap-2 text-xs text-ink-dim">
            {hasWsp
              ? <Phone className="w-3.5 h-3.5 shrink-0 text-green-500" />
              : <MessageSquare className="w-3.5 h-3.5 shrink-0 text-brand" />
            }
            <span>
              Contacto por{' '}
              <span className="font-semibold text-ink dark:text-ink-dim">
                {hasWsp ? 'WhatsApp' : 'chat LOKAL'}
              </span>
            </span>
          </div>

          {/* Descripción colapsable */}
          {desc && (
            <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setDescOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors"
              >
                <span>Ver descripción</span>
                {descOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {descOpen && (
                <p className="px-3 pb-3 text-xs text-ink-dim leading-relaxed border-t border-slate-100 dark:border-white/8 pt-2">
                  {desc}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Acciones — botones horizontales con icono a la derecha */}
        <div className="px-4 pb-5 pt-2 space-y-2">
          {/* Ver publicación — primario */}
          <button
            onClick={onView || onClose}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-brand hover:bg-brand-light text-white font-bold text-sm transition-colors"
          >
            <span>Ver publicación</span>
            <Eye className="w-5 h-5" />
          </button>

          {/* Fila: Editar + Mis productos */}
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-between px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-ink-dim dark:text-ink-dim font-semibold text-sm hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors"
            >
              <span>Editar</span>
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onMisProductos || onClose}
              className="flex-1 flex items-center justify-between px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-ink-dim dark:text-ink-dim font-semibold text-sm hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors"
            >
              <span>Mis productos</span>
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
