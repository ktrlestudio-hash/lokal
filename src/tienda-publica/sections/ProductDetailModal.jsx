/**
 * ProductDetailModal — vista ampliada de un producto/oferta: fusión de dos
 * componentes que antes vivían separados en el ecosistema LOKAL:
 *
 *   1. El ProductDetailModal original de LOKAL LINKS (sheet fullscreen,
 *      animación de cierre en dos tiempos, imagen con zoom, compartir +
 *      carrito) — se conserva TAL CUAL como base: es el lenguaje visual ya
 *      pulido de esta app, con los tokens --tp-* correctos.
 *   2. ProductDetailScreen.jsx de LOKAL Global (carrusel de fotos con dots,
 *      badges, "más de la tienda") — de ahí se toma la estructura de
 *      contenido rico (carrusel en vez de una sola imagen, sección
 *      relacionada), reimplementada con los componentes YA pulidos de LINKS
 *      (ProductCardGrid + Carrusel de ProductCards.jsx, calcularBadges) en
 *      vez de portar su UI vieja tal cual — así lo pidió el usuario
 *      explícitamente: "usar de base ya pulida lo que es el producto detail
 *      de lokal global [...] pero si haces lo que te digo de fusión [...]
 *      planear mejoras según la interfaz y ui de botones, componente de
 *      lokal links actuales sería un golazo".
 *
 * Usado en dos lugares: la tienda individual (con carrito real, via
 * carritoPropsDe) y, a futuro, un modal de detalle en la Home global (sin
 * carrito — mismo criterio de QtyControl que se auto-oculta sin onAdd).
 *
 * Tres mejoras tomadas de MV Distribuciones, ya vigentes en la versión
 * anterior y conservadas acá:
 *   1. El sheet NO tapa la bottom-nav — bottom:var(--tp-nav-h).
 *   2. Cierre animado en dos tiempos (panel baja + fondo se desvanece antes
 *      de desmontar).
 *   3. Precio y botón de acción en la MISMA fila, mismo alto (48px).
 */
import React, { useState, useCallback, useMemo } from 'react';
import { X, Share2, ShoppingBag, Plus, Minus, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { FONT, RADIUS, SHADOW } from '../tokens.js';
import { formatPrice } from '../utils.js';
import { Carrusel, ProductCardGrid, CM_GRID_CARD_W, nombreDe, fotoDe } from '../components/ProductCards.jsx';
import { calcularBadges, BADGE_CONFIG } from '../../utils/productBadges.js';

const F = { fontFamily: FONT.family };
const CIERRE_MS = 220; // duración real de la animación de salida, ver @keyframes tp-pdm-out abajo
const ACCION_ALTO = 48; // alto fijo compartido por "Agregar al pedido" y el stepper — mismo criterio que MV Distribuciones (stepper idéntico al botón, no una versión chica)

// Defaults var(--tp-*): este modal se usa hoy siempre DENTRO de una tienda
// individual (deriveColorPalette ya define esas variables en ese árbol del
// DOM) — mismo criterio que el resto de este archivo. Un consumidor futuro
// sin paleta de tienda (ej. detalle de producto en la Home global) pisa
// estas props con tokens propios, igual que ya hacen Precio/Carrusel.
export function ProductDetailModal({
  producto, onClose, onCompartir, qty = 0, onAdd, onRemove, productos, onOpenProducto,
  surf = 'var(--tp-surface)', surf2 = 'var(--tp-surface2)', border = 'var(--tp-border)',
  txt = 'var(--tp-text)', txtM = 'var(--tp-text-muted)', primary = 'var(--tp-primary)', onPrimary = 'var(--tp-on-primary)',
  chipBg = 'var(--tp-primary-soft)', chipColor = 'var(--tp-primary)',
}) {
  const [fotoIdx, setFotoIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  // Cierre en dos tiempos: "cerrando" dispara la animación de salida (CSS),
  // y recién cuando termina se llama al onClose real que desmonta el
  // componente — sin esto, el padre sacaba el modal del árbol en el mismo
  // frame del click, cortando la animación antes de que se viera.
  const [cerrando, setCerrando] = useState(false);
  const cerrarAnimado = useCallback(() => {
    setCerrando(true);
    setTimeout(onClose, CIERRE_MS);
  }, [onClose]);

  // "Más de la tienda": reutiliza la MISMA lista de productos que ya carga
  // CatalogoModal (prop `productos`, sin fetch propio) — filtra el producto
  // actual y tapea a 8, mismo criterio que RelatedSection en LOKAL Global
  // pero sin la MiniCard propia de esa app: acá se reusa ProductCardGrid,
  // la card ya pulida de LINKS, para que se vea idéntica al resto del
  // catálogo en vez de un tercer estilo de card distinto.
  const masDeLaTienda = useMemo(() => {
    if (!producto || !productos?.length) return [];
    return productos.filter(p => p.id !== producto.id).slice(0, 8);
  }, [producto, productos]);

  if (!producto) return null;

  const fotos = (producto.galeria?.length ? producto.galeria : producto.fotos?.length ? producto.fotos : [fotoDe(producto)]).filter(Boolean);
  const foto = fotos[fotoIdx];
  const badges = calcularBadges(producto);
  const badgeId = badges.find(id => id !== 'oferta'); // "oferta" ya lo cubre el tachado de precio, no duplicar
  const badge = badgeId ? BADGE_CONFIG[badgeId] : null;

  // zIndex 4750: por encima de CatalogoModal/OfertasModal (4700, Fase 6 del
  // plan) — el detalle de producto se abre DESDE dentro de esos modales
  // fullscreen y debe quedar apilado encima, no debajo.
  //
  // bottom: var(--tp-nav-h, 0px) en vez de inset:0 — TiendaNavBar publica
  // su altura real (ver ese archivo), así el sheet termina justo arriba de
  // la barra en vez de taparla con su fixed. Sin esto, el usuario perdía el
  // acceso al carrito/mapa/horarios mientras miraba el detalle de un
  // producto — justo la acción más probable después de ver el detalle.
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 'var(--tp-nav-h, 0px)', zIndex: 4750, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={cerrarAnimado} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', animation: `tp-pdm-backdrop-${cerrando ? 'out' : 'in'} ${CIERRE_MS}ms ease forwards` }} />
      <div className="tp-sheet-scroll" style={{
        position: 'relative', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`, boxShadow: SHADOW.xl, ...F,
        animation: `tp-pdm-panel-${cerrando ? 'out' : 'in'} ${CIERRE_MS}ms cubic-bezier(0.4,0,0.2,1) forwards`,
      }}>
        {/* Sin className/:hover en la X ni en el botón Compartir de abajo —
            mismo hueco que el resto de sheets/botones sólidos de marca. */}
        <style>{`
          @media (hover: hover) {
            .tp-pdm-close:hover { background: rgba(0,0,0,.7) !important; }
            .tp-pdm-share:hover { filter: brightness(0.9); }
            .tp-pdm-arrow:hover { background: #fff !important; }
          }
          .tp-pdm-close { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), background-color .15s ease; }
          .tp-pdm-share { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
          .tp-pdm-close:active { transform: scale(0.9); transition: transform .06s ease; }
          .tp-pdm-share:active { transform: scale(0.95); transition: transform .06s ease; }
          .tp-sheet-scroll { scrollbar-width: none; -ms-overflow-style: none; }
          .tp-sheet-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
          @keyframes tp-pdm-backdrop-in  { from { opacity: 0; } to { opacity: 1; } }
          @keyframes tp-pdm-backdrop-out { from { opacity: 1; } to { opacity: 0; } }
          @keyframes tp-pdm-panel-in  { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes tp-pdm-panel-out { from { transform: translateY(0); } to { transform: translateY(100%); } }
        `}</style>
        <button onClick={cerrarAnimado} aria-label="Cerrar" className="tp-pdm-close" style={{
          position: 'absolute', top: 12, right: 12, zIndex: 2,
          width: 34, height: 34, border: 'none', borderRadius: RADIUS.full,
          background: 'rgba(0,0,0,.5)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}><X size={17} /></button>

        {/* Imagen — carrusel real cuando hay varias fotos (dots + flechas,
            tomado de ProductDetailScreen.jsx de LOKAL Global), tap para zoom
            en la foto activa (mecanismo propio de LINKS, se conserva). El
            zoom se cierra tocando de nuevo la imagen. */}
        <div
          onClick={() => foto && setZoom(z => !z)}
          style={{
            background: 'var(--tp-surface2)', position: 'relative', overflow: 'hidden',
            cursor: foto ? (zoom ? 'zoom-out' : 'zoom-in') : 'default',
          }}
        >
          {foto
            ? <img src={foto} alt={nombreDe(producto)} style={{
                width: '100%', display: 'block', objectFit: 'contain',
                transform: zoom ? 'scale(1.8)' : 'scale(1)',
                transition: 'transform .25s ease',
              }} />
            : <div style={{ width: '100%', height: 220, display: 'grid', placeItems: 'center', color: 'var(--tp-text-muted)' }}>
                <ShoppingBag size={40} style={{ opacity: 0.4 }} />
              </div>
          }
          {badge && (
            <span style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: RADIUS.sm, background: 'var(--tp-surface)', color: 'var(--tp-text)', fontSize: 11, fontWeight: 800, boxShadow: SHADOW.sm }}>
              <badge.Icon size={12} />
              {badge.label}
            </span>
          )}
          {fotos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setFotoIdx(i => (i - 1 + fotos.length) % fotos.length); setZoom(false); }} aria-label="Foto anterior" className="no-press tp-pdm-arrow"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: RADIUS.full, border: 'none', background: 'rgba(255,255,255,.9)', color: '#111', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: SHADOW.sm }}>
                <ChevronLeft size={17} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setFotoIdx(i => (i + 1) % fotos.length); setZoom(false); }} aria-label="Foto siguiente" className="no-press tp-pdm-arrow"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: RADIUS.full, border: 'none', background: 'rgba(255,255,255,.9)', color: '#111', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: SHADOW.sm }}>
                <ChevronRight size={17} />
              </button>
              <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
                {fotos.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setFotoIdx(i); setZoom(false); }} aria-label={`Foto ${i + 1}`}
                    style={{ width: i === fotoIdx ? 16 : 5, height: 5, borderRadius: RADIUS.full, border: 'none', padding: 0, background: i === fotoIdx ? '#fff' : 'rgba(255,255,255,.55)', cursor: 'pointer', transition: 'width .2s ease' }} />
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--tp-text)', letterSpacing: '-0.02em' }}>{nombreDe(producto)}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: producto.descripcion ? 12 : 18 }}>
            {producto.precio != null && (
              <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--tp-primary)', letterSpacing: '-0.02em' }}>{formatPrice(producto.precio)}</span>
            )}
            {producto.precioOriginal != null && producto.precioOriginal > (producto.precio || 0) && (
              <span style={{ fontSize: 14, color: 'var(--tp-text-muted)', textDecoration: 'line-through' }}>{formatPrice(producto.precioOriginal)}</span>
            )}
          </div>

          {producto.descripcion && (
            <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.6, color: 'var(--tp-text-muted)' }}>{producto.descripcion}</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: masDeLaTienda.length ? 26 : 0 }}>
            <button
              onClick={onCompartir}
              className="tp-pdm-share"
              style={{
                flex: onAdd ? undefined : 1, height: ACCION_ALTO, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '0 14px', border: `1.5px solid var(--tp-border)`, borderRadius: RADIUS.lg,
                background: onAdd ? 'var(--tp-surface)' : 'var(--tp-primary)',
                color: onAdd ? 'var(--tp-text)' : 'var(--tp-on-primary)',
                fontWeight: 800, fontSize: 15, cursor: 'pointer',
                transition: 'transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease', ...F,
              }}
            >
              <Share2 size={17} />
              {onAdd ? null : 'Compartir'}
            </button>
            {onAdd && (qty === 0 ? (
              <button onClick={() => onAdd(producto)} className="tp-pdm-share" style={{
                flex: 2, height: ACCION_ALTO, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '0 14px', border: 'none', borderRadius: RADIUS.lg,
                background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', fontWeight: 800, fontSize: 15,
                cursor: 'pointer', transition: 'transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease', ...F,
              }}>
                <Plus size={17} />
                Agregar al pedido
              </button>
            ) : (
              <div style={{ flex: 2, height: ACCION_ALTO, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 8px', borderRadius: RADIUS.lg, background: 'var(--tp-primary)' }}>
                <button onClick={() => onRemove(producto.id)} aria-label="Restar" style={{ width: 36, height: 36, border: 'none', borderRadius: RADIUS.md, background: 'rgba(255,255,255,.2)', color: 'var(--tp-on-primary)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Minus size={16} /></button>
                <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--tp-on-primary)' }}>{qty}</span>
                <button onClick={() => onAdd(producto)} aria-label="Sumar" style={{ width: 36, height: 36, border: 'none', borderRadius: RADIUS.md, background: 'rgba(255,255,255,.2)', color: 'var(--tp-on-primary)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Plus size={16} /></button>
              </div>
            ))}
          </div>

          {/* "Más de la tienda" — mismo concepto que RelatedSection de
              ProductDetailScreen.jsx (LOKAL Global), reimplementado con
              ProductCardGrid/Carrusel reales de LINKS en vez de una MiniCard
              propia — así la card se ve idéntica al resto del catálogo.
              onOpenProducto (opcional) navega el detalle al producto tocado
              sin cerrar el sheet; si no viene, la sección no se muestra. */}
          {masDeLaTienda.length > 0 && onOpenProducto && (
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: 'var(--tp-text)', ...F }}>
                <Store size={14} style={{ verticalAlign: -2, marginRight: 6, opacity: 0.6 }} />
                Más de esta tienda
              </h3>
              <Carrusel gap={10} padding="2px 2px" border={border} text={txt} surface={surf}>
                {masDeLaTienda.map(p => (
                  <div key={p.id} style={{ width: CM_GRID_CARD_W, flexShrink: 0 }}>
                    <ProductCardGrid
                      p={p}
                      onOpen={() => onOpenProducto(p)}
                      surf={surf} surf2={surf2} border={border} txt={txt} txtM={txtM}
                      primary={primary} onPrimary={onPrimary}
                      chipBg={chipBg} chipColor={chipColor}
                    />
                  </div>
                ))}
              </Carrusel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
