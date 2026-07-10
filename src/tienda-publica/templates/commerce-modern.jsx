/**
 * Template: commerce-modern
 * Vista de tienda estilo apps de pedidos (Rappi / PedidosYa / Glovo) adaptada al
 * sistema de diseño de LOKAL (tokens --tp-*, 1 color de marca por tienda).
 *
 * Estructura (ver MEMORIA_ANALISIS_PROYECTO.md §7):
 *  - Hero: foto de portada + botón compartir flotante + logo centrado + nombre +
 *    rating al lado del nombre + badge abierto/cerrado.
 *  - Barra sticky: buscador (con contraste) + chips de categoría con ícono +
 *    toggle lista/grilla.
 *  - Catálogo agrupado por categoría; encabezado de sección con el mismo ícono
 *    que su chip (consistencia).
 *  - Card lista: foto a la IZQUIERDA, info a la derecha, control de cantidad en
 *    el área de info (nunca encima de la foto).
 *  - Card grilla: foto arriba, botón + sobre la foto (patrón catálogo visual).
 *  - Badge de descuento (precio tachado) cuando hay precioOriginal.
 */
export const META = { label: 'Commerce', desc: 'Estilo Rappi/PedidosYa: hero, chips con ícono, catálogo agrupado, vista lista/grilla, carrito.' };

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Plus, Minus, Star, MapPin, Clock, Search, Share2, LayoutGrid, List, ShoppingBag,
  UtensilsCrossed, Coffee, Pizza, Beef, Sandwich, IceCream, CupSoda, Salad,
  Croissant, Cookie, Soup, Fish, Drumstick, Wheat, Tag, Users, ChevronLeft, ChevronRight,
} from 'lucide-react';

import { MapaSection } from '../sections/MapaSection.jsx';
import { CartFab, CartSheet } from '../sections/CartSheet.jsx';
import { ProductDetailModal } from '../sections/ProductDetailModal.jsx';

import { getEstadoApertura, formatPrice } from '../utils.js';
import { FONT, RADIUS, SHADOW, TRANSITION } from '../tokens.js';

const F = { fontFamily: FONT.family };

const GLOBAL_CSS = `
  .cm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  @media (min-width: 620px) { .cm-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
  @media (min-width: 980px) { .cm-grid { grid-template-columns: repeat(4, 1fr); } }
  .cm-chips::-webkit-scrollbar { display: none; }

  /* Los tokens --tp-* son alias de los tokens reales de LOKAL (ver
     src/index.css §4.bis) — ya no hace falta !important, no hay dos paletas
     compitiendo.
     :focus-visible SÍ hay que pisarlo: LOKAL define un outline turquesa fijo
     global (var(--brand-hex), 2.5px) para accesibilidad de teclado en TODA
     la app — correcto ahí, pero acá compite mal con la paleta de marca de
     la tienda (puede ser cualquier color, no turquesa). Reemplazado por un
     outline fino usando el color de marca de ESTA tienda. */
  .cm-input { background: var(--tp-surface2); color: var(--tp-text); border-color: var(--tp-border); }
  .cm-input:focus { border-color: var(--tp-primary); background: var(--tp-surface); }
  .cm-input:focus-visible { outline: 1.5px solid var(--tp-primary); outline-offset: 1px; }
  .cm-input::placeholder { color: var(--tp-text-muted); opacity: 1; }

  /* Feedback suave en la card (sin el scale brusco global de LOKAL) */
  .cm-card { transition: box-shadow .18s ease, border-color .18s ease; }
  @media (hover: hover) {
    .cm-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.10); border-color: var(--tp-primary); }
  }
  .cm-card:active { box-shadow: 0 2px 10px rgba(0,0,0,.08); }

  /* Pulso muy leve al agregar (reemplaza el scale(0.93) heredado) */
  .cm-add { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1); }
  .cm-add:active { transform: scale(0.92); }
  @keyframes cm-pop { 0% { transform: scale(1); } 40% { transform: scale(1.12); } 100% { transform: scale(1); } }
  .cm-pop { animation: cm-pop .28s ease-out; }
`;

// Lectura tolerante: catálogo real usa `titulo`/`fotos[]`; mock usa `nombre`/`foto`.
const nombreDe = p => p.nombre || p.titulo || '';
const fotoDe   = p => p.foto || p.fotos?.[0] || p.galeria?.[0] || null;
const catDe    = p => p.categoria || p.categoryId || null;

// Mapa de íconos por categoría de comida (match por palabra clave, tolerante a
// mayúsculas/plurales). Cae a un ícono genérico de cubiertos.
const CAT_ICONS = [
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
function iconoDeCategoria(cat) {
  if (!cat) return UtensilsCrossed;
  for (const [rx, Icon] of CAT_ICONS) if (rx.test(cat)) return Icon;
  return UtensilsCrossed;
}

// Categorías con productos "verticales" por naturaleza (botellas, latas):
// se muestran en carrusel horizontal con cards más altas que anchas, en vez
// del layout lista/grilla normal — igual criterio visual que LOKAL usa en
// TiendaDetailScreen (scroll horizontal + flechas + fade en los bordes).
function esCategoriaVertical(cat) {
  return /bebida|gaseosa|cervez|vino|trago|jugo|agua(?!s)/i.test(cat || '');
}

export function TemplateCommerceModern({
  tienda, secciones, cart, onAdd, onRemove, onClear, note, setNote, isDark,
}) {
  const s = Object.fromEntries(secciones.map(sec => [sec.id, sec]));

  const productos = (tienda.productos || []).filter(p => p.activo !== false && p.disponible !== false);

  const [detalle, setDetalle] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [catActiva, setCatActiva] = useState('__todas');
  const [layout, setLayout] = useState('lista');

  const { abierta, texto } = getEstadoApertura(tienda.horarios);

  const categorias = useMemo(() => {
    const vistas = [];
    for (const p of productos) {
      const c = catDe(p);
      if (c && !vistas.includes(c)) vistas.push(c);
    }
    return vistas;
  }, [productos]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos.filter(p => {
      if (catActiva !== '__todas' && catDe(p) !== catActiva) return false;
      if (q && !nombreDe(p).toLowerCase().includes(q) && !(p.descripcion || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [productos, query, catActiva]);

  const grupos = useMemo(() => {
    const map = new Map();
    for (const p of filtrados) {
      const c = catDe(p) || 'Otros';
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(p);
    }
    return [...map.entries()];
  }, [filtrados]);

  const qtyDe = id => cart.find(i => i.id === id)?.qty || 0;

  const bg = 'var(--tp-bg)', surf = 'var(--tp-surface)', surf2 = 'var(--tp-surface2)';
  const border = 'var(--tp-border)', txt = 'var(--tp-text)', txtM = 'var(--tp-text-muted)';
  const primary = 'var(--tp-primary)', primarySoft = 'var(--tp-primary-soft)', onPrimary = 'var(--tp-on-primary)';

  const heroImg = tienda.foto || tienda.galeria?.[0] || tienda.fotoPortada || null;

  const compartir = () => {
    const url = tienda.slug ? `${window.location.origin}/t/${tienda.slug}` : window.location.href;
    if (navigator.share) navigator.share({ title: tienda.nombre, url });
    else navigator.clipboard?.writeText(url);
  };

  const cardProps = { onAdd, onRemove, surf, surf2, border, txt, txtM, primary, onPrimary };

  return (
    <div style={{ background: bg, minHeight: '100dvh', color: txt, paddingBottom: 90, ...F }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── HERO ── */}
      {s.hero?.activa !== false && (
        <header style={{ position: 'relative' }}>
          <div style={{ height: 172, background: surf2, position: 'relative', overflow: 'hidden' }}>
            {heroImg && <img src={heroImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.28), rgba(0,0,0,.05) 40%, transparent)' }} />
            {/* compartir flotante — esquina superior derecha */}
            <button onClick={compartir} aria-label="Compartir"
              style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: RADIUS.full, border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(6px)' }}>
              <Share2 size={17} style={{ marginRight: 2 }} />
            </button>
          </div>

          {/* Logo centrado, superpuesto */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 16px', marginTop: -48 }}>
            <div style={{ width: 88, height: 88, borderRadius: RADIUS.xl, background: surf, boxShadow: SHADOW.lg, overflow: 'hidden', display: 'grid', placeItems: 'center', border: `4px solid ${surf}` }}>
              {tienda.logo
                ? <img src={tienda.logo} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 32, fontWeight: 900, color: primary }}>{tienda.nombre?.[0]?.toUpperCase() || 'T'}</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <h1 style={{ margin: 0, fontSize: 23, fontWeight: 900, letterSpacing: '-0.02em' }}>{tienda.nombre}</h1>
              {tienda.rating && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: RADIUS.full, background: primarySoft, color: txt, fontSize: 13, fontWeight: 800 }}>
                  <Star size={13} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                  {tienda.rating}{tienda.totalReseñas ? <span style={{ color: txtM, fontWeight: 600 }}> ({tienda.totalReseñas})</span> : null}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 7, flexWrap: 'wrap', justifyContent: 'center', fontSize: 13, color: txtM }}>
              {texto && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, color: abierta ? '#16a34a' : '#ef4444' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: abierta ? '#16a34a' : '#ef4444' }} />
                  {texto}
                </span>
              )}
              {(tienda.direccion || tienda.ciudad) && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={13} />{[tienda.direccion, tienda.ciudad].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {tienda.descripcion && (
              <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: txtM, maxWidth: 560 }}>{tienda.descripcion}</p>
            )}
          </div>
        </header>
      )}

      {/* ── Barra sticky: buscador + chips + toggle ── */}
      {s.productos?.activa !== false && productos.length > 0 && (
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: bg, paddingTop: 16, marginTop: 18, borderBottom: `1px solid ${border}` }}>
          <div style={{ padding: '0 16px', display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: txtM, pointerEvents: 'none' }} />
              <input
                className="cm-input"
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Buscar en el menú…"
                style={{
                  width: '100%', padding: '12px 14px 12px 38px', borderRadius: RADIUS.md,
                  border: `1.5px solid ${border}`, outline: 'none', fontSize: 14, fontWeight: 500,
                  background: surf2, color: txt, ...F,
                }}
              />
            </div>
            <button
              className="cm-input"
              onClick={() => setLayout(l => l === 'lista' ? 'grilla' : 'lista')}
              aria-label="Cambiar vista" title={layout === 'lista' ? 'Ver en grilla' : 'Ver en lista'}
              style={{ width: 46, borderRadius: RADIUS.md, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {layout === 'lista' ? <LayoutGrid size={19} /> : <List size={19} />}
            </button>
          </div>

          {categorias.length > 0 && (
            <div className="cm-chips" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 13px', scrollbarWidth: 'none' }}>
              <Chip label="Todos" Icon={Tag} active={catActiva === '__todas'} onClick={() => setCatActiva('__todas')}
                primary={primary} onPrimary={onPrimary} surf2={surf2} border={border} txt={txt} />
              {categorias.map(c => (
                <Chip key={c} label={c} Icon={iconoDeCategoria(c)} active={catActiva === c} onClick={() => setCatActiva(c)}
                  primary={primary} onPrimary={onPrimary} surf2={surf2} border={border} txt={txt} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Catálogo agrupado ── */}
      {s.productos?.activa !== false && (
        <div style={{ padding: '18px 16px 0' }}>
          {filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: txtM }}>
              <ShoppingBag size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14 }}>{query ? `Sin resultados para "${query}"` : 'Todavía no hay productos'}</p>
            </div>
          ) : (
            grupos.map(([cat, items]) => {
              const SecIcon = iconoDeCategoria(cat);
              const vertical = esCategoriaVertical(cat);
              // Con pocos productos, un carrusel scrolleable queda con
              // cards angostas flotando y espacio vacío al lado — no tiene
              // sentido "poder scrollear" cuando entran todos igual. Solo a
              // partir de 4 ítems el carrusel aporta (hay algo para
              // descubrir scrolleando). Con 2-3, se ajustan al ancho en
              // grilla; con 1 sola, cae a la card horizontal normal (misma
              // que cualquier otra categoría, no tiene sentido una card
              // vertical sola).
              const pocasVerticales = vertical && items.length <= 3;
              return (
                <section key={cat} style={{ marginBottom: 26 }}>
                  {(catActiva === '__todas' && categorias.length > 0) && (
                    <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em', color: txt, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 30, height: 30, borderRadius: RADIUS.md, background: primarySoft, color: primary, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <SecIcon size={16} />
                      </span>
                      {cat}
                      <span style={{ fontSize: 12, fontWeight: 600, color: txtM }}>· {items.length}</span>
                    </h2>
                  )}

                  {vertical && items.length > 3 ? (
                    // 4+ bebidas: carrusel horizontal con cards más altas
                    // que anchas (foto vertical), flechas + fade en los bordes
                    // — mismo patrón que LOKAL usa en TiendaDetailScreen.
                    <Carrusel>
                      {items.map(p => (
                        <ProductCardVertical key={p.id} p={p} qty={qtyDe(p.id)} onOpen={() => setDetalle(p)} {...cardProps} />
                      ))}
                    </Carrusel>
                  ) : items.length === 1 ? (
                    // 1 sola: card horizontal normal, como cualquier otra categoría.
                    <ProductCardList p={items[0]} qty={qtyDe(items[0].id)} onOpen={() => setDetalle(items[0])} {...cardProps} />
                  ) : pocasVerticales ? (
                    // 2-3 bebidas: se ajustan al ancho disponible, sin scroll.
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10 }}>
                      {items.map(p => (
                        <ProductCardVertical key={p.id} p={p} qty={qtyDe(p.id)} onOpen={() => setDetalle(p)} fluida {...cardProps} />
                      ))}
                    </div>
                  ) : layout === 'grilla' ? (
                    <div className="cm-grid">
                      {items.map(p => (
                        <ProductCardGrid key={p.id} p={p} qty={qtyDe(p.id)} onOpen={() => setDetalle(p)} {...cardProps} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {items.map(p => (
                        <ProductCardList key={p.id} p={p} qty={qtyDe(p.id)} onOpen={() => setDetalle(p)} {...cardProps} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
      )}

      {/* ── Mapa ── */}
      {s.mapa?.activa && (
        <section style={{ paddingBottom: 20 }}>
          <MapaSection tienda={tienda} isDark={isDark} />
        </section>
      )}

      {/* ── Carrito ── */}
      <CartFab cart={cart} onOpen={() => setCartOpen(true)} />
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} tienda={tienda}
        cart={cart} onAdd={onAdd} onRemove={onRemove} onClear={onClear} note={note} setNote={setNote} />

      {/* ── Detalle ── */}
      {detalle && (
        <ProductDetailModal producto={detalle} cartQty={qtyDe(detalle.id)} onAdd={onAdd} onClose={() => setDetalle(null)} />
      )}
    </div>
  );
}

/* ── Chip de categoría con ícono (estilo LOKAL: rounded parcial) ── */
function Chip({ label, Icon, active, onClick, primary, onPrimary, surf2, border, txt }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '9px 14px', borderRadius: RADIUS.md, cursor: 'pointer',
      border: `1.5px solid ${active ? primary : border}`,
      background: active ? primary : surf2, color: active ? onPrimary : txt,
      fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', transition: TRANSITION.fast, ...F,
    }}>
      {Icon && <Icon size={15} style={{ opacity: active ? 1 : 0.75 }} />}
      {label}
    </button>
  );
}

/* ── Precio con descuento: por defecto el precio tachado va a la DERECHA del
   precio final (misma fila) — el layout "tachado arriba" es una excepción
   puntual, solo para las cards VERTICALES (`stacked=true`), donde el ancho
   angosto de esas cards no da lugar cómodo a los dos precios lado a lado. ── */
function Precio({ p, txt, size = 'md', stacked = false }) {
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
function TituloDescripcion({ nombre, descripcion, txt, txtM, tituloSize = 14, descSize = 11, maxLineasTitulo = 2, maxLineasTotal = 3 }) {
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
      <h3 ref={tituloRef} style={{
        margin: 0, fontSize: tituloSize, fontWeight: 800, color: txt, letterSpacing: '-0.01em',
        lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: maxLineasTitulo, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{nombre}</h3>
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

function descuentoPct(p) {
  if (!p.precioOriginal || p.precioOriginal <= (p.precio || 0)) return null;
  return Math.round((1 - p.precio / p.precioOriginal) * 100);
}

/* ── Control de cantidad (+ / selector) ── */
function QtyControl({ qty, onAdd, onRemove, p, primary, onPrimary, surf2, border, txt, size = 'md' }) {
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

/* ── Card LISTA: grid de 2 columnas (foto | resto). "Resto" es a su vez un
   grid interno de 2 filas × 2 columnas:
     fila 1: título+descripción (flexible) | stats personas/tiempo (angosta,
             mismo ancho que el botón +)
     fila 2: precio (izquierda) ←──────────→ botón + (derecha), alineados
             horizontalmente en la misma fila.
   La foto es cuadrada (ancho = alto = CM_LIST_H, px fijos) y se estira con
   alignSelf:stretch a lo que mida el bloque de la derecha completo. ── */
const CM_LIST_H = 96;    // referencia de tamaño de foto (ancho=alto)
const CM_LIST_SIDE = 34; // ancho de la columna angosta = ancho real del botón + (QtyControl size="sm", d=34)

function ProductCardList({ p, qty, onOpen, onAdd, onRemove, surf, surf2, border, txt, txtM, primary, onPrimary }) {
  const img = fotoDe(p);
  const pct = descuentoPct(p);
  const hasStats = p.serves || p.prepTimeMin || p.rating;
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
          {img ? <img src={img} alt={nombreDe(p)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ShoppingBag size={18} style={{ color: txtM, opacity: 0.5 }} />}
        </div>
        {/* badge de descuento pegado a la esquina real de la foto (top:0/left:0,
            sin margen) — así queda anclado a la esquina superior, no "flotando"
            separado del borde. Solo redondea la esquina inferior-derecha para
            que combine con la curva del contenedor. */}
        {pct && <span style={{ position: 'absolute', top: 0, left: 0, padding: '3px 6px', borderRadius: `${RADIUS.md} 0 ${RADIUS.sm} 0`, background: '#ef4444', color: '#fff', fontSize: 9.5, fontWeight: 900, lineHeight: 1.3 }}>-{pct}%</span>}
      </div>

      {/* col 2: grid interno 2 filas × 2 columnas. rowGap:0 a propósito — el
          espaciado entre fila 1 y fila 2 NO debe ser uniforme (texto→precio
          pegado, sin aire de sobra), así que cada celda controla su propio
          margen puntual en vez de un gap general del grid. */}
      <div style={{ display: 'grid', gridTemplateColumns: `1fr ${CM_LIST_SIDE}px`, gridTemplateRows: 'auto auto', columnGap: 8, rowGap: 0, minWidth: 0 }}>
        {/* fila 1, col A: título + descripción con reparto dinámico de
            líneas (ver TituloDescripcion). alignSelf:start — el bloque de
            texto ocupa SOLO su alto real, sin estirar la fila del grid (que
            de lo contrario arrastraría a los stats de la col B con ella,
            dejándolos con aire de más o pegados feo abajo cuando la
            descripción usa sus 3 líneas completas). */}
        <div style={{ minWidth: 0, alignSelf: 'start' }}>
          <TituloDescripcion nombre={nombreDe(p)} descripcion={p.descripcion} txt={txt} txtM={txtM} tituloSize={14} descSize={11} maxLineasTitulo={2} maxLineasTotal={4} />
        </div>

        {/* fila 1, col B: stats (personas/tiempo/rating) — alignSelf:start
            para no estirarse con la col A; alineados a la izquierda dentro
            de su columna, cada uno como mini-chip prolijo con ícono+valor
            parejos. */}
        {hasStats ? (
          <div style={{ alignSelf: 'start', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            {p.rating && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 800, color: txt }}>
                <Star size={11} style={{ fill: '#fbbf24', color: '#fbbf24', flexShrink: 0 }} />{p.rating}
              </span>
            )}
            {p.serves && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600, color: txtM }}>
                <Users size={11} style={{ flexShrink: 0 }} />{p.serves}
              </span>
            )}
            {p.prepTimeMin && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600, color: txtM }}>
                <Clock size={11} style={{ flexShrink: 0 }} />{p.prepTimeMin}′
              </span>
            )}
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
    </div>
  );
}

/* ── Carrusel horizontal con flechas + fade en los bordes — mismo patrón
   visual que LOKAL usa en TiendaDetailScreen (useScrollEdges + NavArrowBtn),
   reimplementado acá con los tokens de tienda-publica para no acoplar este
   template al resto de la app. ── */
function Carrusel({ children }) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [update]);

  const scrollBy = dir => ref.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });

  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }} className="cm-chips">
        {children}
      </div>
      {/* Fade con stops explícitos (no solo color→transparent) para evitar el
          artefacto de 1px que deja el navegador al interpolar transparencia
          en un color con canal alpha implícito — mismo tono en ambos
          extremos del gradiente, solo cambia la opacidad. */}
      {edges.left && (
        <>
          <div style={{ pointerEvents: 'none', position: 'absolute', left: 0, top: 0, bottom: 0, width: 28, background: 'linear-gradient(to right, var(--tp-bg) 0%, var(--tp-bg) 15%, transparent 100%)' }} />
          <button onClick={() => scrollBy(-1)} aria-label="Anterior" className="no-press"
            style={{ position: 'absolute', left: 2, top: '38%', width: 30, height: 30, borderRadius: RADIUS.full, border: '1px solid var(--tp-border)', background: 'var(--tp-surface)', color: 'var(--tp-text)', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: SHADOW.sm, zIndex: 2 }}>
            <ChevronLeft size={16} />
          </button>
        </>
      )}
      {edges.right && (
        <>
          <div style={{ pointerEvents: 'none', position: 'absolute', right: 0, top: 0, bottom: 0, width: 28, background: 'linear-gradient(to left, var(--tp-bg) 0%, var(--tp-bg) 15%, transparent 100%)' }} />
          <button onClick={() => scrollBy(1)} aria-label="Siguiente" className="no-press"
            style={{ position: 'absolute', right: 2, top: '38%', width: 30, height: 30, borderRadius: RADIUS.full, border: '1px solid var(--tp-border)', background: 'var(--tp-surface)', color: 'var(--tp-text)', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: SHADOW.sm, zIndex: 2 }}>
            <ChevronRight size={16} />
          </button>
        </>
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
const CM_VERT_W = 'clamp(118px, calc((100vw - 56px) / 2.5), 148px)';
const CM_VERT_IMG = 152; // alto fijo de la foto, igual en TODAS las cards
// alto del cuerpo para el caso NORMAL (título 1 línea + descripción hasta 2
// líneas, ya que maxLineasTotal=3 le da 3-1=2 a la descripción): título
// (~16px) + descripción 2 líneas (~26px) + gap (4px) + fila precio/botón
// (34px, alto del botón +) + padding vertical (20px, 10px arriba/abajo) +
// aire extra para que el botón no quede pegado al borde inferior ≈ 116px.
const CM_VERT_BODY = 124;

function ProductCardVertical({ p, qty, onOpen, onAdd, onRemove, surf, surf2, border, txt, txtM, primary, onPrimary, fluida = false }) {
  const img = fotoDe(p);
  const pct = descuentoPct(p);
  return (
    <div onClick={onOpen} role="button" tabIndex={0} className="no-press cm-card"
      style={{ position: 'relative', flexShrink: fluida ? undefined : 0, width: fluida ? '100%' : CM_VERT_W, height: CM_VERT_IMG + CM_VERT_BODY, background: surf, border: `1px solid ${border}`, borderRadius: RADIUS.lg, overflow: 'visible', cursor: 'pointer', boxShadow: SHADOW.sm, display: 'flex', flexDirection: 'column' }}>
      {/* foto: SIEMPRE el mismo tamaño fijo; el alto total de la card es
          fijo (height), calculado para el caso normal — no el peor caso. */}
      <div style={{ position: 'relative', width: '100%', height: CM_VERT_IMG, flexShrink: 0, background: surf2, borderRadius: `${RADIUS.lg} ${RADIUS.lg} 0 0`, overflow: 'hidden' }}>
        {img ? <img src={img} alt={nombreDe(p)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}><ShoppingBag size={22} style={{ color: txtM, opacity: 0.5 }} /></div>}
        {pct && <span style={{ position: 'absolute', top: 0, left: 0, padding: '3px 6px', borderRadius: `${RADIUS.lg} 0 ${RADIUS.sm} 0`, background: '#ef4444', color: '#fff', fontSize: 9.5, fontWeight: 900 }}>-{pct}%</span>}
      </div>
      {/* título + descripción con reparto dinámico de líneas (ver TituloDescripcion) */}
      <div style={{ minHeight: CM_VERT_BODY, padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <TituloDescripcion nombre={nombreDe(p)} descripcion={p.descripcion} txt={txt} txtM={txtM} tituloSize={12.5} descSize={10.5} maxLineasTitulo={2} maxLineasTotal={3} />
        {/* precio + control SIEMPRE en el flujo normal de la fila — mismo
            criterio visual que la card horizontal (ProductCardList), en vez
            del overlay flotante sobre la foto que quedaba visualmente
            distinto. La card angosta se aprieta un poco cuando el selector
            se expande, pero se ve consistente con el resto de las cards. */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <Precio p={p} txt={txt} stacked />
          <QtyControl qty={qty} onAdd={onAdd} onRemove={onRemove} p={p} primary={primary} onPrimary={onPrimary} surf2={surf2} border={border} txt={txt} size="sm" />
        </div>
      </div>
    </div>
  );
}

/* ── Card GRILLA: foto arriba, botón sobre la foto (catálogo visual) ── */
function ProductCardGrid({ p, qty, onOpen, onAdd, onRemove, surf, surf2, border, txt, txtM, primary, onPrimary }) {
  const img = fotoDe(p);
  const pct = descuentoPct(p);
  return (
    <div onClick={onOpen} role="button" tabIndex={0} className="no-press cm-card"
      style={{ background: surf, border: `1px solid ${border}`, borderRadius: RADIUS.lg, overflow: 'hidden', cursor: 'pointer', boxShadow: SHADOW.sm, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: surf2 }}>
        {img ? <img src={img} alt={nombreDe(p)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}><ShoppingBag size={26} style={{ color: txtM, opacity: 0.5 }} /></div>}
        {pct && <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: RADIUS.sm, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 900 }}>-{pct}%</span>}
        <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
          <QtyControl qty={qty} onAdd={onAdd} onRemove={onRemove} p={p} primary={primary} onPrimary={onPrimary} surf2={surf} border={border} txt={txt} size="sm" />
        </div>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: txt, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{nombreDe(p)}</h3>
        {p.rating && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: txtM }}>
            <Star size={11} style={{ fill: '#fbbf24', color: '#fbbf24' }} />{p.rating}
          </span>
        )}
        <div style={{ marginTop: 'auto' }}><Precio p={p} txt={txt} /></div>
      </div>
    </div>
  );
}
