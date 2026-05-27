import React, { useRef, useState } from 'react';
import {
  Camera, X, AlertCircle, Loader2, CheckCircle,
  MessageSquare, Check, Info, Gift, Zap, CreditCard, Tag,
} from 'lucide-react';
import CategoryPicker from '../CategoryPicker';
import AttributesEditor from '../AttributesEditor';

// ─── Condición cards ──────────────────────────────────────────────────────────
const CONDICION_OPTS = [
  {
    id: 'usado',
    label: 'Usado',
    desc: 'Segunda mano',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    activeCard: 'border-brand bg-brand/8 dark:bg-brand/10',
    activeIcon: 'bg-brand/15',
    activeIconColor: 'text-brand',
    inactiveCard: 'border-slate-200 dark:border-white/10 hover:border-slate-300',
    inactiveIcon: 'bg-slate-100 dark:bg-white/8',
    inactiveIconColor: 'text-slate-500 dark:text-slate-400',
  },
  {
    id: 'nuevo',
    label: 'Nuevo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/>
      </svg>
    ),
    activeCard: 'border-amber-400 bg-amber-50 dark:bg-amber-500/10',
    activeIcon: 'bg-amber-400/15',
    activeIconColor: 'text-amber-500',
    inactiveCard: 'border-slate-200 dark:border-white/10 hover:border-amber-300',
    inactiveIcon: 'bg-slate-100 dark:bg-white/8',
    inactiveIconColor: 'text-slate-500 dark:text-slate-400',
  },
];

// ─── Ventaja options ──────────────────────────────────────────────────────────
const VENTAJA_OPTS = [
  {
    id: 'precio',
    label: 'Mejor precio',
    tip: 'Tu precio es menor o más conveniente que el de la competencia.',
    Icon: Tag,
    activeClass: 'bg-primary border-transparent text-white',
    iconClass: 'text-primary',
  },
  {
    id: 'disponibilidad',
    label: 'Tenelo hoy',
    tip: 'El producto está en stock y disponible para entrega o retiro inmediato.',
    Icon: Zap,
    activeClass: 'bg-amber-400 border-transparent text-white',
    iconClass: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 'financiacion',
    label: 'Financiación',
    tip: 'Ofrecés cuotas, pago en efectivo diferido u otra forma de financiamiento.',
    Icon: CreditCard,
    activeClass: 'bg-slate-600 border-transparent text-white',
    iconClass: 'text-slate-500 dark:text-slate-400',
  },
  {
    id: 'combo',
    label: 'Combo especial',
    tip: 'Incluís un pack, regalo o producto adicional junto con la oferta principal.',
    Icon: Gift,
    activeClass: 'bg-amber-500 border-transparent text-white',
    iconClass: 'text-amber-500 dark:text-amber-400',
  },
];

const cardCls = 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-4';
const labelCls = 'text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider';
const inputCls = 'w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand transition-colors dark:text-white placeholder:text-slate-400';

const Tip = ({ text }) => (
  <span className="relative group inline-flex items-center ml-1 cursor-default align-middle">
    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-800 dark:bg-slate-700 text-white text-[11px] leading-snug rounded-xl px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
      {text}
    </span>
  </span>
);

// ─── VentajaSection ───────────────────────────────────────────────────────────
function VentajaSection({ form, set, inputCls, labelCls }) {
  const [infoModal, setInfoModal] = useState(null);

  const active = VENTAJA_OPTS.find(v => v.id === infoModal);
  const ventajas = Array.isArray(form.ventaja) ? form.ventaja : [];
  const toggle = (id) => set('ventaja', ventajas.includes(id) ? ventajas.filter(x => x !== id) : [...ventajas, id]);
  const showFinanciacion = ventajas.includes('financiacion');

  return (
    <>
      <div className={cardCls}>
        <p className={`${labelCls} mb-3`}>Ventaja exclusiva <span className="font-normal normal-case text-slate-400">(opcional · podés elegir varias)</span></p>
        <div className="grid grid-cols-2 gap-2">
          {VENTAJA_OPTS.map(v => {
            const Icon = v.Icon;
            const isActive = ventajas.includes(v.id);
            return (
              <div key={v.id} className="relative">
                <button
                  onClick={() => toggle(v.id)}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border-2 transition-all pr-8
                    ${isActive ? v.activeClass : 'border-slate-200 dark:border-white/15 hover:border-slate-300 dark:hover:border-white/25 text-slate-700 dark:text-slate-200'}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : v.iconClass}`} />
                  <span className="font-semibold text-sm">{v.label}</span>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setInfoModal(v.id); }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full transition-colors
                    ${isActive ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        {/* financiación siempre en DOM, colapsa sin salto de layout */}
        <div className={`overflow-hidden transition-all duration-200 ${showFinanciacion ? 'max-h-24 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
          <label className={`${labelCls} block mb-2`}>Detalle de financiación</label>
          <input value={form.financiacion} onChange={e => set('financiacion', e.target.value)} placeholder="Ej: 12 cuotas sin interés" className={inputCls} />
        </div>
      </div>

      {/* Modal info ventaja */}
      {infoModal && active && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6" onClick={() => setInfoModal(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setInfoModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${active.activeClass}`}>
              <active.Icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-base mb-2">{active.label}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{active.tip}</p>
            <button
              onClick={() => { toggle(active.id); setInfoModal(null); }}
              className={`mt-5 w-full py-2.5 rounded-2xl font-bold text-sm transition-colors
                ${ventajas.includes(active.id)
                  ? 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  : `${active.activeClass} text-white`}`}
            >
              {ventajas.includes(active.id) ? 'Quitar ventaja' : 'Seleccionar'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── ContactoSection ──────────────────────────────────────────────────────────
// tiendaWhatsapp: número ya guardado en el perfil (puede ser null)
// Lógica:
//   - Si tiendaWhatsapp existe → selector visual Chat / WhatsApp (usa el número del perfil)
//   - Si no existe → Chat siempre activo + campo opcional para ingresar número
function ContactoSection({ form, set, tiendaWhatsapp, inputCls, labelCls }) {
  // modo derivado del form: 'chat' si contactoWhatsapp está vacío, 'whatsapp' si tiene valor
  const modo = form.contactoWhatsapp ? 'whatsapp' : 'chat';

  const selectModo = (m) => {
    if (m === 'chat') set('contactoWhatsapp', '');
    else if (tiendaWhatsapp) set('contactoWhatsapp', tiendaWhatsapp);
    // si no hay tiendaWhatsapp y elige whatsapp, deja que el usuario escriba
  };

  return (
    <div className={cardCls}>
      <p className={`${labelCls} mb-3`}>Contacto</p>

      {tiendaWhatsapp ? (
        /* ── Tiene número en perfil: selector visual ── */
        <div className="flex gap-2">
          {[
            {
              id: 'chat',
              Icon: MessageSquare,
              label: 'Chat Lokal',
              desc: 'Por la app',
              activeCard: 'border-green-400 bg-green-50 dark:bg-green-500/10',
              activeIcon: 'text-green-600',
              activeLabel: 'text-green-700 dark:text-green-400',
            },
            {
              id: 'whatsapp',
              Icon: MessageSquare,
              label: 'WhatsApp',
              desc: `+54 ${tiendaWhatsapp}`,
              activeCard: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
              activeIcon: 'text-emerald-600',
              activeLabel: 'text-emerald-700 dark:text-emerald-400',
            },
          ].map(opt => {
            const isActive = modo === opt.id;
            const Icon = opt.Icon;
            return (
              <button
                key={opt.id}
                onClick={() => selectModo(opt.id)}
                className={`flex-1 flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all text-left
                  ${isActive ? opt.activeCard : 'border-slate-200 dark:border-white/10 hover:border-slate-300'}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                  ${isActive ? 'bg-white/60 dark:bg-black/20' : 'bg-slate-100 dark:bg-white/8'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? opt.activeIcon : 'text-slate-400'}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold leading-tight ${isActive ? opt.activeLabel : 'text-slate-900 dark:text-white'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">{opt.desc}</p>
                </div>
                {isActive && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Check size={9} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* ── Sin número en perfil: chat fijo + campo opcional ── */
        <>
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/20 mb-3">
            <MessageSquare size={18} className="text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Chat interno Lokal</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Los interesados te escriben por la app</p>
            </div>
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <Check size={10} className="text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
              WhatsApp <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <div className="flex items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 gap-2">
              <span className="text-slate-500 dark:text-slate-400 text-sm">+54</span>
              <input
                type="tel"
                value={form.contactoWhatsapp}
                onChange={e => set('contactoWhatsapp', e.target.value.replace(/\D/g, ''))}
                placeholder="Número sin 0 ni 15"
                className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductoForm — formulario unificado de producto (sin header ni wrapper externo)
//
// Form shape (todos los campos, mismo en ambas screens):
//   { titulo, descripcion, precio, precioOriginal, ventaja, financiacion,
//     stock, condicion, categoryId, contactoWhatsapp }
//
// Props opcionales de tienda:
//   attributes / setAttributes — para AttributesEditor
//   categories / onCreateCategory — para CategoryPicker avanzado
//
// Props opcionales de home:
//   canPostNew — si false, bloquea la opción "Nuevo" con nudge modal
//   setNudgeModal — fn({ type }) requerida si canPostNew puede ser false
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductoForm({
  form,
  setForm,
  fotoPreviews = [],
  setFotoPreviews,
  fotoFiles = [],
  setFotoFiles,
  attributes = {},
  setAttributes,
  onSave,
  saving = false,
  error = null,
  isEditing = false,
  canPostNew = true,
  setNudgeModal,
  categories,
  onCreateCategory,
  tiendaWhatsapp = null,
}) {
  const fotoInputRef = useRef(null);

  const handleFotos = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - fotoFiles.length);
    files.forEach(f => {
      setFotoFiles(prev => [...prev, f]);
      setFotoPreviews(prev => [...prev, URL.createObjectURL(f)]);
    });
    e.target.value = '';
  };

  const removeFoto = (i) => {
    const prev = fotoPreviews[i];
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
    setFotoPreviews(ps => ps.filter((_, j) => j !== i));
    setFotoFiles(fs => fs.filter((_, j) => j !== i));
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-6 space-y-4">

      {/* ── Condición ── */}
      <div className={cardCls}>
        <p className={`${labelCls} mb-3`}>¿Qué vas a vender?</p>
        <div className="flex gap-2 items-stretch">
          {CONDICION_OPTS.map(opt => {
            const isActive = (form.condicion || 'usado') === opt.id;
            const locked = opt.id === 'nuevo' && !canPostNew;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (locked) { setNudgeModal?.({ type: 'producto-nuevo' }); return; }
                  set('condicion', opt.id);
                }}
                className={`flex-1 flex items-center gap-2.5 rounded-xl border-2 px-3 py-2 transition-all text-left
                  ${isActive ? opt.activeCard : locked ? 'border-slate-100 dark:border-white/5 opacity-60' : opt.inactiveCard}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? opt.activeIcon : opt.inactiveIcon}`}>
                  <span className={isActive ? opt.activeIconColor : opt.inactiveIconColor}>{opt.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{opt.label}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {opt.id === 'usado' ? 'Segunda mano' : canPostNew ? 'De tu negocio' : 'Solo negocios'}
                  </p>
                  {locked && <span className="text-[10px] font-bold text-amber-600">↑ Subir nivel</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Fotos ── */}
      <div className={cardCls}>
        <p className={`${labelCls} mb-3`}>
          Fotos <span className="font-normal normal-case text-slate-400">({fotoPreviews.length}/4)</span>
          <Tip text="Agregá fotos claras del producto. La primera imagen será la principal." />
        </p>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => {
            if (i < fotoPreviews.length) return (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-white/10">
                <img src={fotoPreviews[i]} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeFoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1 py-0.5 rounded font-medium">Principal</span>}
              </div>
            );
            if (i === fotoPreviews.length && fotoPreviews.length < 4) return (
              <button key={i} onClick={() => fotoInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center gap-1 hover:border-brand transition-colors text-slate-400 hover:text-brand">
                <Camera className="w-5 h-5" />
                <span className="text-[10px]">Agregar</span>
              </button>
            );
            return <div key={i} className="aspect-square rounded-xl bg-slate-100/40 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/5" />;
          })}
        </div>
        <input ref={fotoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFotos} />
      </div>

      {/* ── Título + descripción ── */}
      <div className={`${cardCls} space-y-4`}>
        <div>
          <label className={`${labelCls} block mb-2`}>
            Nombre del producto <span className="text-rose-500">*</span>
            <Tip text="Escribí el nombre completo y específico. Ej: 'Auriculares Sony WH-1000XM5 Negro'." />
          </label>
          <input
            value={form.titulo}
            onChange={e => set('titulo', e.target.value)}
            placeholder={form.condicion === 'nuevo' ? 'Ej: Remera oversize negra talle M' : 'Ej: Bicicleta MTB rodado 26'}
            className={inputCls}
          />
        </div>
        <div>
          <label className={`${labelCls} block mb-2`}>
            Descripción <span className="font-normal normal-case text-slate-400">(opcional)</span>
            <Tip text="Contá más detalles: características, estado, qué incluye, medidas, etc." />
          </label>
          <textarea
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            rows={3}
            placeholder="Estado, medidas, características importantes..."
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>

      {/* ── Precio + stock ── */}
      <div className={`${cardCls} space-y-4`}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`${labelCls} block mb-2`}>
              Precio
              <Tip text="El precio al que vendés. Si tenés descuento, poné el precio ya rebajado acá." />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">$</span>
              <input type="number" value={form.precio} onChange={e => set('precio', e.target.value)} placeholder="0" className={`${inputCls} pl-7`} />
            </div>
          </div>
          <div>
            <label className={`${labelCls} block mb-2`}>
              Stock
              <Tip text="Cuántas unidades tenés. Dejá vacío si no querés mostrarlo." />
            </label>
            <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="Unidades" className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Categoría + atributos ── */}
      <div className={cardCls}>
        <label className={`${labelCls} block mb-2`}>
          Categoría <Tip text="Elegí la categoría que mejor describe tu producto." />
        </label>
        <CategoryPicker
          value={form.categoryId}
          onChange={id => { set('categoryId', id); setAttributes?.({}); }}
          onCreateCategory={onCreateCategory}
          categories={categories}
          placeholder="¿En qué categoría entra tu producto?"
          suggestionContext={{ titulo: form.titulo, descripcion: form.descripcion }}
        />
        {form.categoryId && setAttributes && (
          <div className="mt-3">
            <AttributesEditor
              categoryId={form.categoryId}
              value={attributes}
              onChange={setAttributes}
              categories={categories}
            />
          </div>
        )}
      </div>

      {/* ── Ventaja exclusiva ── */}
      <VentajaSection form={form} set={set} inputCls={inputCls} labelCls={labelCls} />

      {/* ── Contacto ── */}
      <ContactoSection form={form} set={set} tiendaWhatsapp={tiendaWhatsapp} inputCls={inputCls} labelCls={labelCls} />

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Guardar ── */}
      <button
        onClick={onSave}
        disabled={saving || !form.titulo?.trim()}
        className="w-full py-3.5 bg-brand hover:bg-brand-light disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand/25"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Publicar producto'}
      </button>
    </div>
  );
}
