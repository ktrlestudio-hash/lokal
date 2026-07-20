/**
 * Cards de producto compartidas entre `commerce-modern.jsx` (vista de UNA
 * tienda, con carrito y paleta de marca por-tienda) y `HomeScreen.jsx`
 * (Home global del cliente, sin carrito, paleta general de la app).
 *
 * Extraído de `templates/commerce-modern.jsx` para reuso — el comportamiento
 * y el layout NO cambian, solo se movió el código a un módulo común. Los
 * valores de color (`surf`/`surf2`/`border`/`txt`/`txtM`/`primary`/
 * `onPrimary`) siguen viniendo por props: cada consumidor decide de dónde
 * los resuelve (paleta de marca de la tienda vs. tokens generales del Home).
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Minus, Star, Clock, ShoppingBag, Users, MoreVertical,
  UtensilsCrossed, Coffee, Pizza, Beef, Sandwich, IceCream, CupSoda, Salad,
  Croissant, Cookie, Soup, Fish, Drumstick, Wheat, Leaf, Snowflake,
} from 'lucide-react';
import { formatPrice } from '../utils.js';
import { RADIUS, SHADOW } from '../tokens.js';

/* ── Botón de 3 puntos, SOLO para el dueño de la tienda logueado en su
   propia vista pública (ver OfertaAdminSheet.jsx) — abre el sheet de
   gestión rápida (ocultar/vencimiento/eliminar) sin salir del catálogo
   público. Se renderiza solo si el caller pasa `onOpen` (así las cards no
   necesitan conocer `esDueño`, solo si reciben o no el handler). Esquina
   opuesta al badge de descuento (que vive en top-left de la foto en las 3
   variantes) para no competir por el mismo espacio. */
export function OfertaMenuButton({ onOpen, top = 8, right = 8 }) {
  if (!onOpen) return null;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpen(); }}
      aria-label="Gestionar oferta"
      className="no-press cm-ofmenu"
      style={{
        position: 'absolute', top, right, width: 28, height: 28, borderRadius: RADIUS.sm,
        border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff',
        display: 'grid', placeItems: 'center', cursor: 'pointer', backdropFilter: 'blur(2px)',
      }}
    >
      <MoreVertical size={15} />
    </button>
  );
}

/* ── Categorización de comida rápida — compartida entre commerce-modern
   (catálogo de UNA tienda) y HomeScreen (secciones globales por rubro).
   Match por palabra clave sobre el nombre de categoría/rubro, tolerante a
   mayúsculas/plurales. Cae a un ícono genérico de cubiertos. */
export const CAT_ICONS = [
  [/hamburg|burg/i, Beef],
  [/pizz/i, Pizza],
  [/sandwi|lomit|pancho|choripan/i, Sandwich],
  [/bebida|gaseosa|refresc|jugo|agua/i, CupSoda],
  [/cervez|trago|vino|cocktail|café|cafe|coffee/i, Coffee],
  [/postre|dulce|helad/i, IceCream],
  [/factura|pasteler|torta|brownie|cookie|galleta|churr/i, Cookie],
  [/panader|pan\b|croissant|medialun/i, Croissant],
  [/ensalad|veggie|vegan|saludable|bowl/i, Salad],
  [/sopa|caldo|guiso/i, Soup],
  [/pescado|sushi|mar/i, Fish],
  [/pollo|milanesa/i, Drumstick],
  [/acompaña|papas|guarnic|snack|entrada/i, UtensilsCrossed],
  [/sin tacc|celíac|celiac/i, Wheat],
];
export function iconoDeCategoria(cat) {
  if (!cat) return UtensilsCrossed;
  for (const [rx, Icon] of CAT_ICONS) if (rx.test(cat)) return Icon;
  return UtensilsCrossed;
}
/* Categorías con productos "verticales" por naturaleza (botellas, latas):
   se muestran mejor en carrusel horizontal con cards altas que anchas. */
export function esCategoriaVertical(cat) {
  return /bebida|gaseosa|cervez|vino|trago|jugo|agua(?!s)/i.test(cat || '');
}

export const nombreDe = p => p.nombre || p.titulo || '';
export const fotoDe   = p => p.foto || p.fotos?.[0] || p.galeria?.[0] || null;

export function descuentoPct(p) {
  if (!p.precioOriginal || p.precioOriginal <= (p.precio || 0)) return null;
  return Math.round((1 - p.precio / p.precioOriginal) * 100);
}

/* ── Precio con descuento: por defecto el precio tachado va a la DERECHA del
   precio final (misma fila) — el layout "tachado arriba" es una excepción
   puntual, solo para las cards VERTICALES (`stacked=true`), donde el ancho
   angosto de esas cards no da lugar cómodo a los dos precios lado a lado. ── */
export function Precio({ p, txt, size = 'md', stacked = false }) {
  const hasDesc = p.precioOriginal && p.precioOriginal > (p.precio || 0);
  const fs = size === 'lg' ? 20 : 17;
  if (stacked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {hasDesc && <span style={{ fontSize: 11, color: 'var(--tp-text-muted)', textDecoration: 'line-through', lineHeight: 1.2 }}>{formatPrice(p.precioOriginal)}</span>}
        <span style={{ fontSize: fs, fontWeight: 900, color: txt, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{formatPrice(p.precio)}</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
      <span style={{ fontSize: fs, fontWeight: 900, color: txt, letterSpacing: '-0.02em' }}>{formatPrice(p.precio)}</span>
      {hasDesc && <span style={{ fontSize: 12, color: 'var(--tp-text-muted)', textDecoration: 'line-through' }}>{formatPrice(p.precioOriginal)}</span>}
    </div>
  );
}

/* ── Título + descripción con reparto DINÁMICO de líneas.
   Problema real: no sabemos qué va a escribir cada comercio — título de 1
   palabra o de 8, descripción larga, corta, o ninguna. Reservar líneas fijas
   para cada uno ("título 2, descripción 2") deja huecos vacíos cuando el
   texto real es corto, o corta feo cuando es largo.
   Solución: medimos cuántas líneas ocupa el TÍTULO ya renderizado (con
   ResizeObserver, se re-mide si cambia el ancho de la card) y le damos a la
   descripción las líneas que sobran de un presupuesto TOTAL (`maxLineasTotal`)
   — que es mayor al tope individual del título (`maxLineasTitulo`), porque un
   título de 1 línea debe poder cederle 2 líneas a la descripción (no solo 1),
   ya que el espacio vertical real de la card alcanza para eso. Si no hay
   descripción, no queda hueco: el título ocupa su alto real sin reservar de más. ── */
export function TituloDescripcion({ nombre, descripcion, txt, txtM, surf2, tituloSize = 14, descSize = 11, maxLineasTitulo = 2, maxLineasTotal = 3, rating }) {
  const tituloRef = useRef(null);
  const [lineasTitulo, setLineasTitulo] = useState(1);

  useEffect(() => {
    const el = tituloRef.current;
    if (!el) return undefined;
    const medir = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || tituloSize * 1.25;
      setLineasTitulo(Math.max(1, Math.round(el.scrollHeight / lh)));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [nombre, tituloSize]);

  const lineasDesc = Math.max(0, maxLineasTotal - lineasTitulo);

  return (
    <div>
      {/* rating pegado al final del ÚLTIMO CARÁCTER del título — no un
          hermano en flex-row (eso comprime el título a costa del chip). Acá
          el chip vive DENTRO del <h3>, al final del texto, con float:right:
          fluye como parte del texto — si el título entra en 1 línea, el chip
          queda pegado en esa misma línea; si el título es largo, el título
          se envuelve a un segundo renglón y el chip queda pegado ahí, igual
          que "página siguiente →" en un párrafo con float. */}
      <h3 ref={tituloRef} style={{
        margin: 0, fontSize: tituloSize, fontWeight: 800, color: txt, letterSpacing: '-0.01em',
        lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: maxLineasTitulo, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {nombre}
        {rating && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: tituloSize * 0.7, fontWeight: 800, color: txt, background: surf2, borderRadius: RADIUS.sm, padding: '1px 5px', marginLeft: 5, verticalAlign: 'middle' }}>
            <Star size={tituloSize * 0.65} style={{ fill: '#fbbf24', color: '#fbbf24', flexShrink: 0 }} />{rating}
          </span>
        )}
      </h3>
      {descripcion && lineasDesc > 0 && (
        <p style={{
          margin: 0, fontSize: descSize, color: txtM, opacity: 0.75, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: lineasDesc, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          // text-wrap:balance reparte las líneas con ancho parejo entre sí
          // (evita que la última línea quede mucho más corta/huérfana que
          // las anteriores). Soporte moderno (Chrome/Edge 114+, Safari
          // 17.4+); donde no existe, degrada a wrap normal sin romper nada.
          textWrap: 'balance',
        }}>{descripcion}</p>
      )}
    </div>
  );
}

/* ── Control de cantidad (+ / selector).
   Si no se pasa `onAdd` (consumidor de solo-lectura, sin carrito — ej. Home
   global) el control NO se renderiza: no tiene sentido mostrar un botón "+"
   que no agrega nada a ningún carrito, ni tolerar qty=0/undefined como si
   hubiera un flujo de compra activo. El caller debe ocultar/omitir
   QtyControl en ese caso (commerce-modern siempre pasa onAdd). ── */
export function QtyControl({ qty, onAdd, onRemove, p, primary, onPrimary, surf2, border, txt, size = 'md' }) {
  if (!onAdd) return null;
  const d = size === 'sm' ? 34 : 38;
  if (qty === 0) {
    return (
      <button onClick={e => { e.stopPropagation(); onAdd(p); }} aria-label="Agregar" className="no-press cm-add"
        style={{ width: d, height: d, borderRadius: RADIUS.md, border: 'none', background: primary, color: onPrimary, display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: SHADOW.sm, flexShrink: 0 }}>
        <Plus size={18} />
      </button>
    );
  }
  return (
    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4, background: surf2, border: `1px solid ${border}`, borderRadius: RADIUS.md, padding: 3, flexShrink: 0, boxShadow: SHADOW.md }}>
      <button onClick={() => onRemove(p.id)} aria-label="Restar" className="no-press cm-add" style={{ width: d - 8, height: d - 8, borderRadius: RADIUS.sm, border: 'none', background: 'transparent', color: txt, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Minus size={16} /></button>
      <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 800, fontSize: 14, color: txt }}>{qty}</span>
      <button onClick={() => onAdd(p)} aria-label="Sumar" className="no-press cm-add" style={{ width: d - 8, height: d - 8, borderRadius: RADIUS.sm, border: 'none', background: primary, color: onPrimary, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Plus size={16} /></button>
    </div>
  );
}

/* ── Atributos de utilidad rápida para la columna de stats: cada producto
   puede tener una cantidad distinta (0 a varios) — sin TACC, vegano, frío —
   además de personas/tiempo. Se arman dinámicamente desde `attributes`, no
   hay un set fijo por card. */
function atributosUtiles(p) {
  const attrs = p.attributes || {};
  const out = [];
  if (attrs.apto_celiaco === 'Sí' || attrs.sin_tacc === 'Sí') out.push({ Icon: Wheat, label: 'Sin TACC' });
  if (attrs.apto_vegano === 'Sí') out.push({ Icon: Leaf, label: 'Vegano' });
  if (esFrio(p)) out.push({ Icon: Snowflake, label: 'Frío' });
  return out;
}
const esFrio = (p) => /helad/i.test(p.categoryId || '');

/* ── Card LISTA: grid de 2 columnas (foto | resto). "Resto" es a su vez un
   grid interno de 2 filas × 2 columnas:
     fila 1: título+descripción (flexible) | stats personas/tiempo (angosta,
             mismo ancho que el botón +)
     fila 2: precio (izquierda) ←──────────→ botón + (derecha), alineados
             horizontalmente en la misma fila.
   La foto es cuadrada (ancho = alto = CM_LIST_H, px fijos) y se estira con
   alignSelf:stretch a lo que mida el bloque de la derecha completo. ── */
export const CM_LIST_H = 96;    // referencia de tamaño de foto (ancho=alto)
export const CM_LIST_SIDE = 34; // ancho de la columna angosta = ancho real del botón + (QtyControl size="sm", d=34)

export function ProductCardList({ p, qty, onOpen, onAdd, onRemove, surf, surf2, border, txt, txtM, primary, onPrimary, onOpenAdminMenu }) {
  const img = fotoDe(p);
  const pct = descuentoPct(p);
  const atributos = atributosUtiles(p);
  const hasStats = p.serves || p.prepTimeMin || atributos.length > 0;
  // Sin onAdd (consumidor de solo lectura, ej. TodasOfertasScreen/SearchModal
  // sin carrito) no hay botón + que ocupe la col B — el precio usa todo el
  // ancho de la fila y se centra verticalmente con el bloque de texto, en
  // vez de dejar un hueco vacío a la derecha donde iría el control.
  const soloLectura = !onAdd;
  return (
    <div onClick={onOpen} role="button" tabIndex={0} className="no-press cm-card"
      style={{
        display: 'grid', gridTemplateColumns: `${CM_LIST_H}px 1fr`, gap: 12,
        padding: 10, background: surf, border: `1px solid ${border}`, borderRadius: RADIUS.lg,
        cursor: 'pointer', boxShadow: SHADOW.sm, height: CM_LIST_H + 20,
      }}>
      {/* col 1: foto — SIEMPRE cuadrada 1:1 y del MISMO tamaño fijo en todas
          las cards (ancho=alto=CM_LIST_H). El alto TOTAL de la card es fijo
          (height, no minHeight): el caso normal es título de 1 línea, así que
          fijamos el alto pensado para eso — un título excepcional de 3 líneas
          se corta con el clamp de TituloDescripcion (maxLineas) en vez de
          estirar la card, para no dejar aire de sobra en el 95% de los casos
          normales por planificar para el caso raro. */}
      <div style={{ position: 'relative', width: CM_LIST_H, height: CM_LIST_H }}>
        <div style={{ width: '100%', height: '100%', borderRadius: RADIUS.md, background: surf2, overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
          {img ? <img src={img} alt={nombreDe(p)} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ShoppingBag size={18} style={{ color: txtM, opacity: 0.5 }} />}
        </div>
        {/* badge de descuento pegado a la esquina real de la foto (top:0/left:0,
            sin margen) — así queda anclado a la esquina superior, no "flotando"
            separado del borde. Solo redondea la esquina inferior-derecha para
            que combine con la curva del contenedor. */}
        {pct && <span style={{ position: 'absolute', top: 0, left: 0, padding: '3px 6px', borderRadius: `${RADIUS.md} 0 ${RADIUS.sm} 0`, background: 'var(--accent-hex)', color: 'var(--accent-fg)', fontSize: 9.5, fontWeight: 900, lineHeight: 1.3 }}>-{pct}%</span>}
        <OfertaMenuButton onOpen={onOpenAdminMenu ? () => onOpenAdminMenu(p) : null} top={4} right={4} />
      </div>

      {soloLectura ? (
        /* Sin control +: 3 columnas — texto | stats apilados en su propia
           columna a la derecha (donde antes iba el botón), cada stat en su
           propia fila, todo centrado verticalmente en el alto disponible de
           la card (mismo criterio que la col B del layout con +, pero acá
           apilada en vez de solo 3 chips en línea arriba del título). */
        <div style={{ display: 'grid', gridTemplateColumns: `1fr auto`, columnGap: 10, alignItems: 'center', minWidth: 0 }}>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <TituloDescripcion nombre={nombreDe(p)} descripcion={p.descripcion} txt={txt} txtM={txtM} surf2={surf2} tituloSize={14} descSize={11} maxLineasTitulo={2} maxLineasTotal={3} rating={p.rating} />
            <Precio p={p} txt={txt} />
          </div>
          {hasStats && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 5, flexShrink: 0, background: surf2, borderRadius: RADIUS.md, padding: '8px 10px' }}>
              {p.serves && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, color: txt, whiteSpace: 'nowrap' }}>
                  <Users size={11} style={{ flexShrink: 0 }} />{p.serves}
                </span>
              )}
              {p.prepTimeMin && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, color: txt, whiteSpace: 'nowrap' }}>
                  <Clock size={11} style={{ flexShrink: 0 }} />{p.prepTimeMin}′
                </span>
              )}
              {atributos.map(({ Icon, label }) => (
                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, color: txt, whiteSpace: 'nowrap' }}>
                  <Icon size={11} style={{ flexShrink: 0 }} />
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* col 2: grid interno 2 filas × 2 columnas. rowGap:0 a propósito — el
           espaciado entre fila 1 y fila 2 NO debe ser uniforme (texto→precio
           pegado, sin aire de sobra), así que cada celda controla su propio
           margen puntual en vez de un gap general del grid. */
        <div style={{ display: 'grid', gridTemplateColumns: `1fr ${CM_LIST_SIDE}px`, gridTemplateRows: 'auto auto', columnGap: 8, rowGap: 0, minWidth: 0 }}>
          {/* fila 1, col A: título + descripción con reparto dinámico de
              líneas (ver TituloDescripcion). alignSelf:start — el bloque de
              texto ocupa SOLO su alto real, sin estirar la fila del grid (que
              de lo contrario arrastraría a los stats de la col B con ella,
              dejándolos con aire de más o pegados feo abajo cuando la
              descripción usa sus 3 líneas completas). */}
          <div style={{ minWidth: 0, alignSelf: 'start' }}>
            <TituloDescripcion nombre={nombreDe(p)} descripcion={p.descripcion} txt={txt} txtM={txtM} surf2={surf2} tituloSize={14} descSize={11} maxLineasTitulo={2} maxLineasTotal={4} rating={p.rating} />
          </div>

          {/* fila 1, col B: stats (personas/tiempo/atributos), agrupados en un
              chip único gris clarito para que no se confundan con el título
              de al lado — alignSelf:start para no estirarse con la col A. */}
          {hasStats ? (
            <div style={{ alignSelf: 'start', justifySelf: 'start', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, background: surf2, borderRadius: RADIUS.sm, padding: '3px 6px' }}>
              {p.serves && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, color: txt }}>
                  <Users size={11} style={{ flexShrink: 0 }} />{p.serves}
                </span>
              )}
              {p.prepTimeMin && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, color: txt }}>
                  <Clock size={11} style={{ flexShrink: 0 }} />{p.prepTimeMin}′
                </span>
              )}
              {atributos.map(({ Icon, label }) => (
                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, color: txt }}>
                  <Icon size={11} style={{ flexShrink: 0 }} />
                </span>
              ))}
            </div>
          ) : <div />}

          {/* fila 2, col A: precio, pegado al texto de arriba (sin gap), centrado
              verticalmente con el botón + de al lado (que es más alto, 34px) */}
          <div style={{ alignSelf: 'center' }}><Precio p={p} txt={txt} /></div>

          {/* fila 2, col B: botón +, alineado a la derecha — centrado con el precio en la misma fila visual */}
          <div style={{ alignSelf: 'center', justifySelf: 'end' }}>
            <QtyControl qty={qty} onAdd={onAdd} onRemove={onRemove} p={p} primary={primary} onPrimary={onPrimary} surf2={surf2} border={border} txt={txt} size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Card VERTICAL: para bebidas/botellas — foto más alta que ancha,
   pensada para ir dentro de un Carrusel. Alto fijo (foto + cuerpo), igual en
   TODAS las cards, sin depender del texto. Precio + botón en la misma fila
   (igual criterio que el resto de las cards); cuando el selector se expande
   (qty>0), se muestra como OVERLAY flotante que se sale del ancho angosto
   de la card (position:absolute, no limitado por los 128px), en vez de
   apretarse deforme dentro de la columna. ── */
// Ancho pensado para que se vean ~2.5 cards en pantalla en mobile — la media
// card cortada en el borde es el indicio visual de "hay más, deslizá" incluso
// antes de que aparezca la flecha (que solo se muestra tras el primer scroll).
// calc(): 100vw menos el padding lateral de la página (32px) y 2 gaps (24px),
// dividido 2.5. clamp() evita que en pantallas grandes las cards se vean
// gigantes (tope 148px) o diminutas en pantallas muy chicas (piso 118px).
export const CM_VERT_W = 'clamp(118px, calc((100vw - 56px) / 2.5), 148px)';
export const CM_VERT_IMG = 152; // alto fijo de la foto, igual en TODAS las cards
// alto del cuerpo para el caso NORMAL (título 1 línea + descripción hasta 2
// líneas, ya que maxLineasTotal=3 le da 3-1=2 a la descripción): título
// (~16px) + descripción 2 líneas (~26px) + gap (4px) + fila precio/botón
// (34px, alto del botón +) + padding vertical (20px, 10px arriba/abajo) +
// aire extra para que el botón no quede pegado al borde inferior ≈ 116px.
export const CM_VERT_BODY = 124;

export function ProductCardVertical({ p, qty, onOpen, onAdd, onRemove, surf, surf2, border, txt, txtM, primary, onPrimary, fluida = false, onOpenAdminMenu }) {
  const img = fotoDe(p);
  const pct = descuentoPct(p);
  const atributos = atributosUtiles(p);
  return (
    <div onClick={onOpen} role="button" tabIndex={0} className="no-press cm-card"
      style={{ position: 'relative', flexShrink: fluida ? undefined : 0, width: fluida ? '100%' : CM_VERT_W, height: CM_VERT_IMG + CM_VERT_BODY, background: surf, border: `1px solid ${border}`, borderRadius: RADIUS.lg, overflow: 'visible', cursor: 'pointer', boxShadow: SHADOW.sm, display: 'flex', flexDirection: 'column' }}>
      {/* foto: SIEMPRE el mismo tamaño fijo; el alto total de la card es
          fijo (height), calculado para el caso normal — no el peor caso. */}
      <div style={{ position: 'relative', width: '100%', height: CM_VERT_IMG, flexShrink: 0, background: surf2, borderRadius: `${RADIUS.lg} ${RADIUS.lg} 0 0`, overflow: 'hidden' }}>
        {img ? <img src={img} alt={nombreDe(p)} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}><ShoppingBag size={22} style={{ color: txtM, opacity: 0.5 }} /></div>}
        {pct && <span style={{ position: 'absolute', top: 0, left: 0, padding: '3px 6px', borderRadius: `${RADIUS.lg} 0 ${RADIUS.sm} 0`, background: 'var(--accent-hex)', color: 'var(--accent-fg)', fontSize: 9.5, fontWeight: 900 }}>-{pct}%</span>}
        <OfertaMenuButton onOpen={onOpenAdminMenu ? () => onOpenAdminMenu(p) : null} top={6} right={6} />
      </div>
      {/* título + descripción con reparto dinámico de líneas (ver TituloDescripcion) */}
      <div style={{ minHeight: CM_VERT_BODY, padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(p.serves || p.prepTimeMin || atributos.length > 0) && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start', background: surf2, borderRadius: RADIUS.sm, padding: '2px 7px', flexWrap: 'wrap' }}>
            {p.serves && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: txt }}>
                <Users size={10} style={{ flexShrink: 0 }} />{p.serves}
              </span>
            )}
            {p.prepTimeMin && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: txt }}>
                <Clock size={10} style={{ flexShrink: 0 }} />{p.prepTimeMin}′
              </span>
            )}
            {atributos.map(({ Icon, label }) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: txt }}>
                <Icon size={10} style={{ flexShrink: 0 }} />
              </span>
            ))}
          </div>
        )}
        <TituloDescripcion nombre={nombreDe(p)} descripcion={p.descripcion} txt={txt} txtM={txtM} surf2={surf2} tituloSize={12.5} descSize={10.5} maxLineasTitulo={2} maxLineasTotal={3} rating={p.rating} />
        {/* precio + control SIEMPRE en el flujo normal de la fila — mismo
            criterio visual que la card horizontal (ProductCardList), en vez
            del overlay flotante sobre la foto que quedaba visualmente
            distinto. La card angosta se aprieta un poco cuando el selector
            se expande, pero se ve consistente con el resto de las cards.
            Si no hay onAdd (consumidor de solo lectura, ej. Home global sin
            carrito) QtyControl se auto-oculta — ver su propio comentario. */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <Precio p={p} txt={txt} stacked />
          <QtyControl qty={qty} onAdd={onAdd} onRemove={onRemove} p={p} primary={primary} onPrimary={onPrimary} surf2={surf2} border={border} txt={txt} size="sm" />
        </div>
      </div>
    </div>
  );
}
