/**
 * ProductDetailModal — vista ampliada de un producto/oferta: fusión de dos
 * componentes que antes vivían separados en el ecosistema LOKAL:
 *
 *   1. El ProductDetailModal original de LOKAL LINKS (sheet fullscreen,
 *      animación de cierre en dos tiempos, compartir + carrito) — se
 *      conserva como base: es el lenguaje visual ya pulido de esta app.
 *   2. ProductDetailScreen.jsx de LOKAL Global (carrusel de fotos, badges,
 *      card de la tienda vendedora, "más de la tienda" + "similares de
 *      otras tiendas") — de ahí se toma la estructura de navegación rica,
 *      reimplementada con los componentes YA pulidos de LINKS
 *      (ProductCardGrid + Carrusel de ProductCards.jsx, calcularBadges) en
 *      vez de portar su UI vieja tal cual.
 *
 * Usado en dos lugares: la tienda individual (con carrito real, tienda de
 * props, "más de esta tienda" vía `productos`) y la Home global (sin
 * carrito, con card de tienda vendedora + "similares de otras tiendas" vía
 * `similares`, ya que ahí SÍ existe un feed cross-tienda para alimentarla).
 *
 * Mejoras tomadas de MV Distribuciones, ya vigentes y conservadas:
 *   1. El sheet NO tapa la bottom-nav — bottom:var(--tp-nav-h).
 *   2. Cierre animado en dos tiempos.
 *   3. Precio y botón de acción en la MISMA fila, mismo alto (48px).
 */
import React, { useState, useCallback, useMemo } from 'react';
import { X, Share2, ShoppingBag, Plus, Minus, Store, ChevronRight, ChevronLeft as ChevronLeftIcon } from 'lucide-react';
import { FONT, RADIUS, SHADOW } from '../tokens.js';
import { formatPrice } from '../utils.js';
import { Carrusel, ProductCardGrid, CM_GRID_CARD_W, nombreDe, fotoDe } from '../components/ProductCards.jsx';
import { calcularBadges, BADGE_CONFIG } from '../../utils/productBadges.js';

const F = { fontFamily: FONT.family };
const CIERRE_MS = 220; // duración real de la animación de salida, ver @keyframes tp-pdm-out abajo
const ACCION_ALTO = 48; // alto fijo compartido por "Agregar al pedido" y el stepper — mismo criterio que MV Distribuciones (stepper idéntico al botón, no una versión chica)

// Defaults var(--tp-*): dentro de una tienda individual deriveColorPalette
// ya define esas variables en ese árbol del DOM. Un consumidor sin paleta
// de tienda (Home global) pisa estas props con tokens propios, igual que
// ya hacen Precio/Carrusel.
export function ProductDetailModal({
  producto, onClose, onCompartir, qty = 0, onAdd, onRemove,
  productos, onOpenProducto, similares, onVerTienda,
  tiendaNombre, tiendaLogo,
  surf = 'var(--tp-surface)', surf2 = 'var(--tp-surface2)', border = 'var(--tp-border)',
  txt = 'var(--tp-text)', txtM = 'var(--tp-text-muted)', primary = 'var(--tp-primary)', onPrimary = 'var(--tp-on-primary)',
  chipBg = 'var(--tp-primary-soft)', chipColor = 'var(--tp-primary)',
}) {
  const [fotoIdx, setFotoIdx] = useState(0);
  // Cierre en dos tiempos: "cerrando" dispara la animación de salida (CSS),
  // y recién cuando termina se llama al onClose real que desmonta el
  // componente — sin esto, el padre sacaba el modal del árbol en el mismo
  // frame del click, cortando la animación antes de que se viera.
  const [cerrando, setCerrando] = useState(false);
  const cerrarAnimado = useCallback(() => {
    setCerrando(true);
    setTimeout(onClose, CIERRE_MS);
  }, [onClose]);

  // "Más de esta tienda": reutiliza la MISMA lista que ya carga
  // CatalogoModal (prop `productos`, sin fetch propio) — mismo criterio que
  // RelatedSection en LOKAL Global pero con ProductCardGrid real de LINKS
  // en vez de una MiniCard propia, para que se vea idéntica al catálogo.
  const masDeLaTienda = useMemo(() => {
    if (!producto || !productos?.length) return [];
    return productos.filter(p => p.id !== producto.id).slice(0, 8);
  }, [producto, productos]);

  // "Similares de otras tiendas": SOLO si el caller pasa `similares` (hoy,
  // el feed cross-tienda de Destacados en HomeGlobal.jsx) — en la tienda
  // individual no existe ese feed, así que la sección se omite ahí en vez
  // de mostrar productos de la propia tienda con otro título.
  const similaresFiltrados = useMemo(() => {
    if (!producto || !similares?.length) return [];
    return similares.filter(p => p.id !== producto.id).slice(0, 8);
  }, [producto, similares]);

  if (!producto) return null;

  const fotos = (producto.galeria?.length ? producto.galeria : producto.fotos?.length ? producto.fotos : [fotoDe(producto)]).filter(Boolean);
  const foto = fotos[fotoIdx];
  const badges = calcularBadges(producto);
  const badgeId = badges.find(id => id !== 'oferta'); // "oferta" ya lo cubre el tachado de precio, no duplicar
  const badge = badgeId ? BADGE_CONFIG[badgeId] : null;
  const nombreTienda = tiendaNombre || producto.tiendaNombre;

  // zIndex 4750: por encima de CatalogoModal/OfertasModal (4700, Fase 6 del
  // plan) — el detalle de producto se abre DESDE dentro de esos modales
  // fullscreen y debe quedar apilado encima, no debajo.
  //
  // bottom: var(--tp-nav-h, 0px) en vez de inset:0 — TiendaNavBar publica
  // su altura real (ver ese archivo), así el sheet termina justo arriba de
  // la barra en vez de taparla con su fixed.
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 'var(--tp-nav-h, 0px)', zIndex: 4750, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={cerrarAnimado} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', animation: `tp-pdm-backdrop-${cerrando ? 'out' : 'in'} ${CIERRE_MS}ms ease forwards` }} />
      <div className="tp-sheet-scroll" style={{
        position: 'relative', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`, boxShadow: SHADOW.xl, ...F,
        animation: `tp-pdm-panel-${cerrando ? 'out' : 'in'} ${CIERRE_MS}ms cubic-bezier(0.4,0,0.2,1) forwards`,
      }}>
        <style>{`
          @media (hover: hover) {
            .tp-pdm-close:hover { background: rgba(0,0,0,.7) !important; }
            .tp-pdm-share:hover { filter: brightness(0.9); }
            .tp-pdm-arrow:hover { background: #fff !important; }
            .tp-pdm-tienda:hover { background: var(--tp-surface2); }
          }
          .tp-pdm-close { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), background-color .15s ease; }
          .tp-pdm-share { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
          .tp-pdm-close:active { transform: scale(0.9); transition: transform .06s ease; }
          .tp-pdm-share:active { transform: scale(0.95); transition: transform .06s ease; }
          .tp-pdm-tienda { transition: background-color .15s ease; }
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

        {/* Imagen — SIEMPRE cuadrada (1:1, mismo criterio que ProductCardGrid
            en toda la app) en vez de un alto libre dependiente de la
            proporción real de cada foto: object-fit:cover recorta, no
            estira. Carrusel real con flechas + dots cuando hay varias
            fotos (tomado de ProductDetailScreen.jsx de LOKAL Global). */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: surf2, overflow: 'hidden' }}>
          {foto
            ? <img src={foto} alt={nombreDe(producto)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: txtM }}>
                <ShoppingBag size={40} style={{ opacity: 0.4 }} />
              </div>
          }
          {badge && (
            <span style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: RADIUS.sm, background: surf, color: txt, fontSize: 11, fontWeight: 800, boxShadow: SHADOW.sm }}>
              <badge.Icon size={12} />
              {badge.label}
            </span>
          )}
          {fotos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setFotoIdx(i => (i - 1 + fotos.length) % fotos.length); }} aria-label="Foto anterior" className="no-press tp-pdm-arrow"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: RADIUS.full, border: 'none', background: 'rgba(255,255,255,.9)', color: '#111', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: SHADOW.sm }}>
                <ChevronLeftIcon size={17} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setFotoIdx(i => (i + 1) % fotos.length); }} aria-label="Foto siguiente" className="no-press tp-pdm-arrow"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: RADIUS.full, border: 'none', background: 'rgba(255,255,255,.9)', color: '#111', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: SHADOW.sm }}>
                <ChevronRight size={17} />
              </button>
              <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
                {fotos.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setFotoIdx(i); }} aria-label={`Foto ${i + 1}`}
                    style={{ width: i === fotoIdx ? 16 : 5, height: 5, borderRadius: RADIUS.full, border: 'none', padding: 0, background: i === fotoIdx ? '#fff' : 'rgba(255,255,255,.55)', cursor: 'pointer', transition: 'width .2s ease' }} />
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: 20 }}>
          {/* Jerarquía: título → precio (grande, primera línea de lectura
              después del nombre, no compitiendo en la misma fila) →
              descripción. Antes precio y título iban en la misma fila
              (se apretaban entre sí) y el precio no tenía el peso visual
              de un e-commerce real. */}
          <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 900, color: txt, letterSpacing: '-0.02em', lineHeight: 1.25 }}>{nombreDe(producto)}</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            {producto.precio != null
              ? <span style={{ fontSize: 28, fontWeight: 900, color: primary, letterSpacing: '-0.02em' }}>{formatPrice(producto.precio)}</span>
              : <span style={{ fontSize: 16, fontWeight: 700, color: txtM }}>Consultá el precio</span>}
            {producto.precioOriginal != null && producto.precioOriginal > (producto.precio || 0) && (
              <span style={{ fontSize: 14, color: txtM, textDecoration: 'line-through' }}>{formatPrice(producto.precioOriginal)}</span>
            )}
          </div>

          {/* Card "vendido por" — tomada de ProductDetailScreen.jsx (LOKAL
              Global), donde enriquecía la navegación llevando a la tienda
              vendedora. Solo se muestra si hay nombre de tienda + acción
              (onVerTienda) — en la tienda individual el usuario YA está en
              esa tienda, así que este componente no la muestra ahí (el
              caller simplemente no pasa tiendaNombre/onVerTienda). */}
          {nombreTienda && onVerTienda && (
            <button onClick={onVerTienda} className="no-press tp-pdm-tienda" style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
              padding: '10px 12px', border: `1px solid ${border}`, borderRadius: RADIUS.lg,
              background: surf2, cursor: 'pointer', textAlign: 'left', ...F,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: RADIUS.md, background: surf, border: `1px solid ${border}`, display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {tiendaLogo ? <img src={tiendaLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={16} style={{ color: txtM }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: txtM, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vendido por</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreTienda}</p>
              </div>
              <ChevronRight size={17} style={{ color: txtM, flexShrink: 0 }} />
            </button>
          )}

          {producto.descripcion && (
            <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.6, color: txtM }}>{producto.descripcion}</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: (masDeLaTienda.length || similaresFiltrados.length) ? 26 : 0 }}>
            <button
              onClick={onCompartir}
              className="tp-pdm-share"
              style={{
                flex: onAdd ? undefined : 1, height: ACCION_ALTO, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '0 14px', border: `1.5px solid ${border}`, borderRadius: RADIUS.lg,
                background: onAdd ? surf : primary,
                color: onAdd ? txt : onPrimary,
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
                background: primary, color: onPrimary, fontWeight: 800, fontSize: 15,
                cursor: 'pointer', transition: 'transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease', ...F,
              }}>
                <Plus size={17} />
                Agregar al pedido
              </button>
            ) : (
              <div style={{ flex: 2, height: ACCION_ALTO, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 8px', borderRadius: RADIUS.lg, background: primary }}>
                <button onClick={() => onRemove(producto.id)} aria-label="Restar" style={{ width: 36, height: 36, border: 'none', borderRadius: RADIUS.md, background: 'rgba(255,255,255,.2)', color: onPrimary, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Minus size={16} /></button>
                <span style={{ fontWeight: 900, fontSize: 16, color: onPrimary }}>{qty}</span>
                <button onClick={() => onAdd(producto)} aria-label="Sumar" style={{ width: 36, height: 36, border: 'none', borderRadius: RADIUS.md, background: 'rgba(255,255,255,.2)', color: onPrimary, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Plus size={16} /></button>
              </div>
            ))}
          </div>

          {/* "Más de esta tienda" — mismo producto de RelatedSection en
              ProductDetailScreen.jsx (LOKAL Global), reimplementado con
              ProductCardGrid/Carrusel reales de LINKS. onOpenProducto
              (opcional) navega el detalle sin cerrar el sheet. */}
          {masDeLaTienda.length > 0 && onOpenProducto && (
            <div style={{ marginBottom: similaresFiltrados.length > 0 ? 24 : 0 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: txt, ...F }}>Más de esta tienda</h3>
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

          {/* "También te puede interesar" — productos de OTRAS tiendas
              (`similares`, hoy solo alimentado por el feed cross-tienda de
              Destacados en HomeGlobal.jsx). En la tienda individual no hay
              feed cross-tienda disponible todavía, así que ahí el caller no
              pasa esta prop y la sección se omite en vez de mostrar
              productos de la misma tienda con un título engañoso. */}
          {similaresFiltrados.length > 0 && onOpenProducto && (
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: txt, ...F }}>También te puede interesar</h3>
              <Carrusel gap={10} padding="2px 2px" border={border} text={txt} surface={surf}>
                {similaresFiltrados.map(p => (
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
