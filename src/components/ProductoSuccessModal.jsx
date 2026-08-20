import React from 'react';
import {
  CheckCircle, Edit3, Eye, X, Package, LayoutList,
} from 'lucide-react';
import { calcularBadges, BADGE_CONFIG } from '../utils/productBadges';

// ProductoSuccessModal — confirmación tras publicar/guardar un producto.
//
// La idea del diseño: lo que el dueño quiere ver acá es "cómo quedó", no
// una repetición del formulario que acaba de completar. Por eso la foto
// es lo primero y ocupa el ancho completo (mismo encuadre cuadrado que la
// card real de la vitrina), con el nombre y el precio debajo — el mismo
// orden de lectura que tendrá su cliente. Es el patrón de confirmación
// que usan las plataformas de e-commerce al publicar: te muestran la
// publicación, no un resumen de campos.
export default function ProductoSuccessModal({ product, onEdit, onView, onMisProductos, onClose }) {
  // El backend normaliza `titulo` → `nombre` al guardar (ver
  // _lib/ofertas-sanitize.js: `body.nombre ?? body.titulo`), así que el
  // objeto que vuelve NUNCA trae `titulo`. Leer solo `titulo` dejaba el
  // nombre vacío acá — se leen los dos, con `nombre` primero.
  const titulo = product?.nombre || product?.titulo || null;
  const foto = product?.fotos?.[0] || product?.imageUrl || product?.foto || null;
  const precio = product?.precio ? `$${Number(product.precio).toLocaleString('es-AR')}` : null;
  const badges = product ? calcularBadges(product) : [];
  const desc = product?.descripcion?.trim() || null;
  const stock = product?.stock;
  const catName = product?.categoryName || null;

  return (
    <div className="fixed inset-0 z-[7000] flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#0f1320] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl overflow-hidden">

        {/* Header verde: el check y el texto van centrados verticalmente en
            su propia fila, y la X se alinea a ESA fila (items-center en el
            contenedor) en vez de a una esquina absoluta — antes era
            `absolute top-4 right-4` sobre un header de alto variable, así
            que quedaba visualmente descolgada respecto al texto. */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-base leading-tight">¡Producto publicado!</p>
              <p className="text-white/75 text-xs mt-0.5">Ya está visible en tu vitrina</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Foto grande, encuadre cuadrado — el mismo que usa la card de
              la vitrina, así lo que ve acá es lo que verá su cliente. Con
              object-cover no se deforma: recorta al centro igual que la
              card real, en vez de estirar la imagen a un contenedor de
              otra proporción. */}
          <div className="relative aspect-square w-full bg-surface-card-2 dark:bg-white/6">
            {foto
              ? <img src={foto} alt="" className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-ink-dim">
                  <Package className="w-10 h-10" />
                  <span className="text-xs font-semibold">Sin foto</span>
                </div>
              )
            }
            {/* Badges flotando sobre la foto (mismo patrón que las cards de
                Mis productos: absolute top-2 left-2) — antes vivían abajo,
                en una zona con scroll interno (max-h-[60vh]) que en
                pantallas chicas los dejaba fuera de vista sin que el
                dueño lo notara. El estado del producto (Nuevo/Oferta/
                Últimos días) tiene que verse siempre, sin acción extra. */}
            {badges.length > 0 && (
              <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                {badges.map(id => {
                  const v = BADGE_CONFIG[id];
                  return (
                    <span key={id} className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shadow ${v.pastel} ${v.iconColor}`}>
                      <v.Icon className="w-3 h-3" />
                      {v.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-4 space-y-3">
            {/* Nombre + precio: el orden de lectura de una publicación
                real (qué es, cuánto sale). */}
            <div>
              <p className="font-bold text-ink text-base leading-snug">{titulo}</p>
              {precio && (
                <p className="text-green-600 dark:text-green-400 font-black text-2xl mt-1 leading-none">{precio}</p>
              )}
            </div>

            {/* Descripción visible, recortada a 2 líneas — sin desplegable:
                el dueño la acaba de escribir, no necesita un clic extra
                para confirmarla, y un acordeón para 2 renglones era más
                interacción que información. */}
            {desc && (
              <p className="text-sm text-ink-dim leading-relaxed line-clamp-2">{desc}</p>
            )}

            {/* Categoría + stock — datos secundarios, no el estado visual
                del producto (eso ya está flotando sobre la foto). */}
            {(stock != null || catName) && (
              <div className="flex flex-wrap gap-1.5">
                {catName && (
                  <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-card-2 dark:bg-white/8 text-ink-dim border border-slate-200 dark:border-white/10">
                    {catName}
                  </span>
                )}
                {stock != null && (
                  <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-card-2 dark:bg-white/8 text-ink-dim border border-slate-200 dark:border-white/10">
                    Stock: {stock}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Acciones — las 3 en una fila: "Ver publicación" a ancho completo
            hacía que las otras dos quedaran anchas al pedo debajo, y el
            conjunto ocupaba tres renglones para tres acciones simples.
            Ver publicación conserva la jerarquía por color (sólido de
            marca) y por ser la primera, no por ocupar más espacio. */}
        <div className="px-4 pb-5 pt-1 flex gap-2 border-t border-slate-100 dark:border-white/8">
          <button
            onClick={onView || onClose}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-2xl bg-brand hover:bg-brand-light text-white font-bold text-xs transition-colors"
          >
            <Eye className="w-4 h-4" />
            Ver publicación
          </button>
          <button
            onClick={onEdit}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-ink-dim font-semibold text-xs hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={onMisProductos || onClose}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-ink-dim font-semibold text-xs hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors"
          >
            <LayoutList className="w-4 h-4" />
            Mis productos
          </button>
        </div>
      </div>
    </div>
  );
}
