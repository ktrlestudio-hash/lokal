import React, { useRef, useState } from 'react';
import {
  Camera, X, AlertCircle, Loader2, CheckCircle,
  MessageSquare, Check, Info, EyeOff,
} from 'lucide-react';
import CategoryPicker from '../CategoryPicker';
import AttributesEditor from '../AttributesEditor';
import { calcularBadges, BADGE_CONFIG } from '../utils/productBadges';

// p-3.5 (no p-4): 2px menos por lado × 5 cards, parte del mismo ajuste
// medido para que el formulario entre sin scroll en un viewport típico.
const cardCls = 'bg-surface-card rounded-2xl border border-slate-200 dark:border-white/10 p-3.5';
const labelCls = 'text-xs font-bold text-ink-dim uppercase tracking-wider';
// py-2.5 (no py-3): compartido por los 4 inputs + el textarea del
// formulario, así que el recorte de 4px por campo es el ajuste con mejor
// relación ganancia/impacto visual para que el formulario entre sin
// scroll — medido con Playwright contra el render real.
const inputCls = 'w-full bg-surface-card-2 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors dark:text-white placeholder:text-ink-dim';

// Click/tap para abrir (no solo hover) — en mobile no hay hover, así que
// hover-only dejaba estas 6 explicaciones de campo inalcanzables para el
// usuario que carga el producto desde el celular.
const Tip = ({ text }) => {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1 align-middle">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        onBlur={() => setOpen(false)}
        aria-label="Más información"
        className="flex items-center justify-center text-ink-dim hover:text-brand transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#262626] text-white text-[11px] leading-snug rounded-xl px-3 py-2 z-50 shadow-lg">
            {text}
          </span>
        </>
      )}
    </span>
  );
};

// ─── BadgesSection ────────────────────────────────────────────────────────────
// Reemplaza a VentajaSection (checkbox manual "Mejor precio"/"Financiación"/
// "Combo especial" — conceptos de venta comparativa que no aplican bien a
// un comercio simple, y que quedaban tildados para siempre sin relación con
// el estado real del producto). Los 3 badges de acá se CALCULAN solos
// (ver productBadges.js: reciente → "Nuevo", precioOriginal>precio →
// "Oferta", vence pronto → "Últimos días") a partir de datos que el
// formulario ya está juntando (precio/precioOriginal/fecha) — no hay nada
// que tildar. El único control manual es el override: forzar un badge que
// no se cumpliría solo, u ocultar uno que sí se cumple.
function BadgesSection({ form, set, labelCls }) {
  const previa = {
    precio: form.precio ? Number(form.precio) : null,
    precioOriginal: form.precioOriginal ? Number(form.precioOriginal) : null,
    publishAt: new Date().toISOString(), // al crear, se publica ahora — "Nuevo" siempre aplicaría de forma automática al guardar
    expireAt: form.expireAt || null,
    badgesForzados: form.badgesForzados,
  };
  const activos = new Set(calcularBadges(previa));
  const agregar = form.badgesForzados?.agregar || [];
  const ocultar = form.badgesForzados?.ocultar || [];

  // seCalculariaSolo tiene que mirar el cálculo SIN overrides — no
  // `activos` (que ya viene con agregar/ocultar aplicados). Antes, tocar
  // dos veces seguidas un badge que se calcula solo (ej. "Nuevo") hacía:
  // 1er click → activos.has('nuevo') true → entra a ocultar → ocultar:
  // ['nuevo']. En el render siguiente, `activos` YA viene sin 'nuevo'
  // (calcularBadges le aplica el ocultar). 2do click → activos.has('nuevo')
  // ahora daba false → tomaba la rama de FORZAR en vez de "sacarlo de
  // ocultar" → agregar:['nuevo'] Y ocultar:['nuevo'] coexistiendo. Con los
  // dos arrays conteniendo el mismo id, ni isActive ni isOculto daban
  // true — el chip se veía "normal", como si nunca se hubiera tocado.
  const seCalculaSoloSinOverrides = new Set(calcularBadges({ ...previa, badgesForzados: null }));

  const toggleForzado = (id) => {
    if (seCalculaSoloSinOverrides.has(id)) {
      // Se calcularía activo de por sí → tocar el chip lo OCULTA (o
      // deshace el ocultado si ya estaba oculto).
      const yaOculto = ocultar.includes(id);
      set('badgesForzados', {
        agregar: agregar.filter(x => x !== id), // por si quedó un estado inconsistente previo
        ocultar: yaOculto ? ocultar.filter(x => x !== id) : [...ocultar, id],
      });
    } else {
      // No se cumple solo → tocar el chip lo FUERZA (o deshace el forzado).
      const yaForzado = agregar.includes(id);
      set('badgesForzados', {
        agregar: yaForzado ? agregar.filter(x => x !== id) : [...agregar, id],
        ocultar: ocultar.filter(x => x !== id), // por si quedó un estado inconsistente previo
      });
    }
  };

  return (
    <div className={cardCls}>
      {/* "Etiquetas" y no "Badges": el dueño de la tienda no tiene por qué
          saber qué es un badge. El texto explicativo largo que había acá
          se sacó — con los chips visibles y el estado a la vista, no
          agregaba nada que no se entienda tocándolos.
          Ícono + texto en UNA fila (no apilados): la etiqueta más larga
          se abrevia solo acá ("Últimos días" → "Últimos") para que las 3
          entren sin apretarse; en las cards del público sigue completa
          (ver BADGE_CONFIG en productBadges.js). */}
      <p className={`${labelCls} mb-3`}>Etiquetas</p>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(BADGE_CONFIG).map(([id, cfg]) => {
          const Icon = cfg.Icon;
          const isActive = activos.has(id);
          const isOculto = ocultar.includes(id) && !agregar.includes(id);
          const labelCorta = id === 'por_vencer' ? 'Últimos' : cfg.label;
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleForzado(id)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-2xl border-2 transition-all
                ${isActive ? `${cfg.color} border-transparent text-white` : isOculto ? 'border-dashed border-slate-300 dark:border-white/20 text-ink-dim opacity-60' : 'border-slate-200 dark:border-white/15 text-ink-dim hover:border-slate-300 dark:hover:border-white/25'}`}
            >
              {isOculto ? <EyeOff className="w-4 h-4 shrink-0" /> : <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : cfg.iconColor}`} />}
              <span className="font-semibold text-xs">{labelCorta}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ContactoSection ──────────────────────────────────────────────────────────
// EN PAUSA (no borrar): su render está comentado más abajo porque el chat
// interno todavía no funciona — elegir "Chat" no llevaría a ningún lado.
// Se vuelve a habilitar cuando el módulo de mensajes esté activo.
//
// tiendaWhatsapp: número ya guardado en el perfil (puede ser null)
// Lógica:
//   - Si tiendaWhatsapp existe → selector visual Chat / WhatsApp (usa el número del perfil)
//   - Si no existe → Chat siempre activo + campo opcional para ingresar número
// eslint-disable-next-line no-unused-vars
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
                  ${isActive ? 'bg-white/60 dark:bg-black/20' : 'bg-surface-card-2 dark:bg-white/8'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? opt.activeIcon : 'text-ink-dim'}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold leading-tight ${isActive ? opt.activeLabel : 'text-ink'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-ink-dim leading-tight truncate">{opt.desc}</p>
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
              <p className="text-sm font-semibold text-ink">Chat interno Lokal</p>
              <p className="text-xs text-ink-dim">Los interesados te escriben por la app</p>
            </div>
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <Check size={10} className="text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-dim block mb-1.5">
              WhatsApp <span className="font-normal text-ink-dim">(opcional)</span>
            </label>
            <div className="flex items-center bg-surface-card-2 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 gap-2">
              <span className="text-ink-dim text-sm">+54</span>
              <input
                type="tel"
                value={form.contactoWhatsapp}
                onChange={e => set('contactoWhatsapp', e.target.value.replace(/\D/g, ''))}
                placeholder="Número sin 0 ni 15"
                className="flex-1 bg-transparent text-sm outline-none text-ink"
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
    // space-y-2.5 (no 4) entre las 5 cards y pt-4/pb-4 (no pt-5/pb-6):
    // medido con Playwright contra el formulario real, sobraban ~100px en
    // un viewport típico (iPhone 14, 844px de alto) — el aire real estaba
    // acá, en el espacio ENTRE secciones, no dentro de cada campo. Esto
    // no achica ningún input/label, solo el hueco entre cards.
    <div className="max-w-lg mx-auto px-4 pt-3 pb-2 space-y-2.5">

      {/* La sección "¿Qué vas a vender?" (Nuevo/Usado) se sacó: estas
          tiendas venden productos nuevos, así que era un paso extra que
          casi nadie iba a cambiar y ocupaba una card entera arriba de
          todo. El campo `condicion` sigue existiendo en el modelo y en el
          backend (queda en 'nuevo', ver el default de productoForm en
          StoreApp.jsx), y los badges/filtros que lo leen siguen
          funcionando — se puede reactivar sin migrar datos. */}

      {/* ── Fotos ── */}
      <div className={cardCls}>
        <p className={`${labelCls} mb-2`}>
          Fotos <span className="font-normal normal-case text-ink-dim">({fotoPreviews.length}/4)</span>
          <Tip text="Agregá fotos claras del producto. La primera imagen será la principal." />
        </p>
        {/* max-h-24 tope: en max-w-lg (512px) cada celda del grid ronda
            ~110px de ancho, y aspect-square las hacía igual de altas —
            era la sección más pesada del formulario después de la de
            Título. El tope mantiene el cuadrado hasta ese límite y lo
            recorta si el ancho disponible daría más. */}
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => {
            if (i < fotoPreviews.length) return (
              <div key={i} className="relative aspect-square max-h-24 rounded-xl overflow-hidden bg-surface-card-2 dark:bg-white/10">
                <img src={fotoPreviews[i]} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeFoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1 py-0.5 rounded font-medium">Principal</span>}
              </div>
            );
            if (i === fotoPreviews.length && fotoPreviews.length < 4) return (
              <button key={i} onClick={() => fotoInputRef.current?.click()}
                className="aspect-square max-h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center gap-1 hover:border-brand transition-colors text-ink-dim hover:text-brand">
                <Camera className="w-5 h-5" />
                <span className="text-[10px]">Agregar</span>
              </button>
            );
            return <div key={i} className="aspect-square max-h-24 rounded-xl bg-surface-card-2/40 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/5" />;
          })}
        </div>
        <input ref={fotoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFotos} />
      </div>

      {/* ── Título + descripción ── */}
      {/* space-y-3 (no 4) y mb-1.5 (no 2) en los labels: la sección más
          alta del formulario después de Fotos — el recorte puntual acá
          suma más que tocar el padding de todas las cards. */}
      <div className={`${cardCls} space-y-3`}>
        <div>
          <label className={`${labelCls} block mb-1.5`}>
            Nombre del producto <span className="text-rose-500">*</span>
            <Tip text="Escribí el nombre completo y específico. Ej: 'Auriculares Sony WH-1000XM5 Negro'." />
          </label>
          <input
            value={form.titulo}
            onChange={e => set('titulo', e.target.value)}
            placeholder="Ej: Remera oversize negra talle M"
            className={inputCls}
          />
        </div>
        <div>
          <label className={`${labelCls} block mb-1.5`}>
            Descripción <span className="font-normal normal-case text-ink-dim">(opcional)</span>
            <Tip text="Contá más detalles: características, estado, qué incluye, medidas, etc." />
          </label>
          <textarea
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            rows={2}
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim text-xs pointer-events-none">$</span>
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

      {/* ── Badges dinámicos (Nuevo/Oferta/Últimos días) ── */}
      <BadgesSection form={form} set={set} labelCls={labelCls} />

      {/* "Presentación" (campo libre: 1kg, 500cc...) se sacó: se pisaba
          con el atributo "Presentación" que varias categorías ya traen
          con opciones predefinidas (ver categories.js: bebidas, gaseosas,
          cervezas), así que había dos campos con el mismo nombre pidiendo
          lo mismo. Donde no hay atributo de categoría, el dato va en el
          título o la descripción, que es donde el comprador lo lee igual.

          "Financiación" (campo libre) también se sacó por lo mismo que la
          condición: ocupaba una card entera para algo que casi ninguna de
          estas tiendas usa.

          Ambos campos siguen en el modelo y en el backend — los productos
          ya cargados conservan su valor, solo dejan de editarse acá.

          ContactoSection queda comentada, NO borrada: el chat interno
          todavía no funciona, así que elegir "Chat" no lleva a ningún
          lado. Se vuelve a habilitar cuando el módulo de mensajes esté
          activo.
          <ContactoSection form={form} set={set} tiendaWhatsapp={tiendaWhatsapp} inputCls={inputCls} labelCls={labelCls} />
      */}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Guardar ── */}
      {/* sticky al fondo del viewport: este formulario es largo (fotos,
          título, precio, categoría, atributos, etiquetas), así que dejar
          el botón solo al final obligaba a scrollear hasta abajo cada vez
          para publicar. Se mantiene la misma condición de habilitado (hay
          título) — el botón se ve siempre, pero sigue deshabilitado hasta
          completar lo obligatorio.
          -mx-4 px-4 contrarresta el padding lateral del contenedor para
          que la barra llegue de borde a borde; el degradado evita que el
          contenido "choque" contra el botón al scrollear por debajo. */}
      <div
        className="sticky bottom-0 -mx-4 px-4 pt-4 bg-gradient-to-t from-[#f5f5f5] via-[#f5f5f5] to-transparent dark:from-[#080808] dark:via-[#080808]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <button
          onClick={onSave}
          disabled={saving || !form.titulo?.trim()}
          className="w-full py-3.5 bg-brand hover:bg-brand-light disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand/25"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Publicar producto'}
        </button>
      </div>
    </div>
  );
}
