/**
 * ProductoIndividual — vista pública de UN producto de catálogo
 * (/:tienda/p/:producto), página completa (mobile Y desktop, no un
 * sheet/modal flotante).
 *
 * Infraestructura de página CALCADA de OfertaIndividual.jsx (mismo pipeline
 * de tema/color vía deriveColorPalette, layout height:100dvh con scroll
 * interno, header con botón "Volver", TiendaNavBar/TiendaFooter/ShareSheet
 * reusados tal cual para no divergir del resto de la tienda pública,
 * distinción mobile/desktop vía DESKTOP_QUERY). Sin el swipe táctil custom
 * entre ofertas hermanas ni la medición dinámica de OfertaIndividual — el
 * producto de catálogo es un contenido más "e-commerce".
 *
 * Layout desktop de referencia (pedido explícito del usuario, 2 capturas de
 * e-commerce reales): principalmente "Rivly" (silla de madera) — fondo con
 * tinte sutil de color de marca detrás de la foto (no plano/neutro), columna
 * derecha con nombre de tienda chico arriba del título, precio grande con
 * tachado al lado si hay descuento, jerarquía limpia nombre→precio→acción.
 * De "Nostra" (campera) se toma: breadcrumb arriba (Tienda › Categoría ›
 * Producto, vía categoryId — dato interno, nunca en la URL), tira de
 * thumbnails debajo de la foto principal con flechas a los costados de la
 * foto grande (no solo dots), y "Related products" como carrusel de cards al
 * pie (ya resuelto con ProductCardGrid/Carrusel, sin cambios ahí). Sin
 * multi-variante de color/talle — LOKAL no tiene ese concepto hoy.
 *
 * Contenido MIGRADO de ProductDetailModal.jsx (mismo dato, sin el wrapper de
 * sheet/animación de apertura-cierre): badge dinámico, precio con tachado,
 * descripción, "Más de esta tienda".
 *
 * La ruta la sirve el mismo link que comparte WhatsApp/FB: el SSR
 * (ogProducto en functions/_middleware.js) responde a los crawlers con OG
 * meta tags y redirige a los humanos a esta vista React.
 */
import React, { useState, useLayoutEffect, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronRight as ChevronRightCrumb, Share2, ShoppingBag, Store } from 'lucide-react';
import { deriveColorPalette, resolvePagina, formatPrice } from './utils.js';
import { TiendaFooter } from './sections/TiendaFooter.jsx';
import { TiendaNavBar } from './sections/TiendaNavBar.jsx';
import { ShareSheet } from './sections/ShareSheet.jsx';
import { Carrusel, ProductCardGrid, CM_GRID_CARD_W, nombreDe, fotoDe } from './components/ProductCards.jsx';
import { calcularBadges, BADGE_CONFIG } from '../utils/productBadges.js';
import { trackPageview, trackClick, trackCompartir } from './track.js';
import { getCategoryPath } from '../categories.js';
import { FONT, RADIUS, SHADOW, DESKTOP_QUERY } from './tokens.js';

const F = { fontFamily: FONT.family };

export function ProductoIndividual({ tienda, producto, isDark, toggleTheme, onVolver, onNavegarAProducto }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [fotoIdx, setFotoIdx] = useState(0);

  const pagina = useMemo(() => resolvePagina(tienda.pagina), [tienda]);
  const dark = isDark;

  // Mismo mecanismo que TiendaPublicaRenderer/OfertaIndividual: setea los
  // --tp-* en <html> y la clase .dark, para que el tema/color sea idéntico
  // al home de la tienda.
  useLayoutEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('dark', dark);
    const vars = deriveColorPalette(pagina.color, dark, pagina.colorSecundario);
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    return () => Object.keys(vars).forEach((k) => el.style.removeProperty(k));
  }, [pagina.color, pagina.colorSecundario, dark]);

  // Si el producto llega cambiado desde afuera (navegar a otro producto
  // desde "Más de esta tienda", o el botón atrás del navegador), el índice
  // de foto se realinea.
  useEffect(() => { setFotoIdx(0); }, [producto.id]);

  const wa = (tienda.whatsapp || '').replace(/\D/g, '');
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Pageview del producto — llegó por un link directo (WhatsApp/FB/etc) o
  // navegación interna, señal de interés puntual en ESTE producto.
  useEffect(() => { trackPageview(tienda.id, 'producto'); }, [tienda.id, producto.id]);

  const primary = 'var(--tp-primary)';
  const bg = 'var(--tp-bg)';
  const surf = 'var(--tp-surface)';
  const surf2 = 'var(--tp-surface2)';
  const txt = 'var(--tp-text)';
  const txtM = 'var(--tp-text-muted)';
  const border = 'var(--tp-border)';
  const onPrimary = 'var(--tp-on-primary)';
  const chipBg = 'var(--tp-primary-soft)';
  const chipColor = 'var(--tp-primary)';
  // Fondo tinte detrás de la foto (referencia "Rivly") — derivado de la
  // paleta de marca de la tienda, no un color fijo hardcodeado.
  const fotoFondo = 'var(--tp-primary-soft)';

  const compartir = useCallback(() => setShareOpen(true), []);

  // "Más de esta tienda": otros productos ACTIVOS del mismo catálogo,
  // mismo criterio que masDeLaTienda en ProductDetailModal.jsx pero acá
  // resuelto directo desde tienda.productos (ya viene completo — la misma
  // fuente que usa CatalogoSection/CatalogoModal).
  const productosTienda = useMemo(() => (tienda.productos || []).filter((p) => p.activo !== false && p.disponible !== false), [tienda.productos]);
  const masDeLaTienda = useMemo(() => productosTienda.filter((p) => p.id !== producto.id).slice(0, 8), [productosTienda, producto.id]);

  const navegarAOtroProducto = onNavegarAProducto ? (p) => onNavegarAProducto(tienda, p) : null;

  // Breadcrumb — Tienda › Categoría › Producto, usando categoryId (dato
  // INTERNO del producto, nunca va en la URL, mismo criterio que ofertas).
  const categoriaPath = useMemo(() => (producto.categoryId ? getCategoryPath(producto.categoryId) : []), [producto.categoryId]);

  const fotos = (producto.galeria?.length ? producto.galeria : producto.fotos?.length ? producto.fotos : [fotoDe(producto)]).filter(Boolean);
  const foto = fotos[fotoIdx];
  const badges = calcularBadges(producto);
  const badgeId = badges.find((id) => id !== 'oferta'); // "oferta" ya lo cubre el tachado de precio, no duplicar
  const badge = badgeId ? BADGE_CONFIG[badgeId] : null;
  const tieneDescuento = producto.precioOriginal != null && producto.precioOriginal > (producto.precio || 0);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: bg, color: txt, ...F }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', overscrollBehaviorY: 'contain', scrollbarWidth: 'none' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

          {/* ── HEADER — franja simple con botón atrás + identidad de la
              tienda, mismo lenguaje que OfertaIndividual (glow sutil de
              marca). En escritorio la fila se centra en una grilla de 3
              columnas para que la identidad de la tienda quede centrada de
              verdad respecto a la ventana. ── */}
          <header style={{ position: 'relative', background: bg, overflowX: 'clip' }}>
            <div aria-hidden="true" style={{
              position: 'absolute', top: -70, left: '50%', transform: 'translateX(-50%)',
              width: 360, height: 220, pointerEvents: 'none',
              background: 'radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in srgb, var(--tp-primary) 22%, transparent), transparent 72%)',
              filter: 'blur(50px)',
            }} />

            <style>{`
              .pi-hero-btn { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), background-color .15s ease; }
              @media (hover: hover) { .pi-hero-btn:hover { background: var(--tp-surface2) !important; } }
              .pi-hero-btn:active { transform: scale(0.9); transition: transform .06s ease; }

              .pi-header-info, .pi-main { --pi-margen: 18px; }
              .pi-header-info { padding: 30px var(--pi-margen) 18px; }
              .pi-main { padding: 12px var(--pi-margen) 24px; }
              @media ${DESKTOP_QUERY} {
                .pi-header-info, .pi-main { --pi-margen: 20px; }
              }

              .pi-nav-mobile { display: contents; }

              .pi-header-fila { display: block; }
              .pi-header-lado { display: none; }
              @media ${DESKTOP_QUERY} {
                .pi-header-fila {
                  display: grid; grid-template-columns: 1fr auto 1fr;
                  align-items: center; gap: 16px;
                }
                .pi-header-lado { display: flex; align-items: center; }
                .pi-header-lado-izq { justify-content: flex-start; }
                .pi-atras-flotante { display: none !important; }
                .pi-header-info { padding: var(--pi-margen) 28px; }
              }

              /* ── Grid principal: mobile apilado (foto arriba, info abajo);
                  escritorio 2 columnas — foto+thumbnails a la izquierda,
                  info a la derecha (referencia Rivly/Nostra). ── */
              .pi-main-grid { display: block; }
              @media ${DESKTOP_QUERY} {
                .pi-main-grid { display: grid; grid-template-columns: minmax(0, 480px) minmax(0, 1fr); gap: 48px; align-items: start; max-width: 1080px; margin: 0 auto; }
              }

              .pi-breadcrumb { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: 12.5px; color: var(--tp-text-muted); margin-bottom: 14px; max-width: 1080px; margin-inline: auto; }
              .pi-breadcrumb-item { color: var(--tp-text-muted); }
              .pi-breadcrumb-item.pi-breadcrumb-actual { color: var(--tp-text); font-weight: 700; }

              .pi-arrow { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), background-color .15s ease; }
              @media (hover: hover) { .pi-arrow:hover { background: #fff !important; } }
              .pi-arrow:active { transform: translateY(-50%) scale(0.9); }
              .pi-thumb { transition: border-color .15s ease, transform .12s cubic-bezier(0.34,1.56,0.64,1); cursor: pointer; }
              .pi-thumb:active { transform: scale(0.94); }
              .pi-share-btn { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
              @media (hover: hover) { .pi-share-btn:hover { filter: brightness(0.94); } }
              .pi-share-btn:active { transform: scale(0.96); transition: transform .06s ease; }
              .pi-wa-btn { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
              @media (hover: hover) { .pi-wa-btn:hover { filter: brightness(1.06); } }
              .pi-wa-btn:active { transform: scale(0.97); }
            `}</style>

            {/* Botón atrás — flotante sobre el contenido en mobile; primera
                columna de la fila del header en escritorio. */}
            <button onClick={onVolver} aria-label="Volver a la tienda" className="no-press pi-hero-btn pi-atras-flotante"
              style={{ position: 'fixed', top: 'calc(14px + env(safe-area-inset-top))', left: 'calc(10px + env(safe-area-inset-left))', zIndex: 20, width: 40, height: 40, borderRadius: 12, border: `1px solid ${border}`, cursor: 'pointer', background: 'color-mix(in srgb, var(--tp-surface) 80%, transparent)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: txt, boxShadow: '0 2px 8px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={19} />
            </button>

            <div className="pi-header-info" style={{ position: 'relative', zIndex: 1 }}>
              <div className="pi-header-fila">
                <div className="pi-header-lado pi-header-lado-izq">
                  <button onClick={onVolver} aria-label="Volver a la tienda" className="no-press pi-hero-btn"
                    style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${border}`, cursor: 'pointer', background: 'var(--tp-surface)', color: txt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={19} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, overflow: 'hidden', background: tienda.logo ? 'var(--tp-primary-soft)' : primary, boxShadow: '0 4px 16px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {tienda.logo
                      ? <img src={tienda.logo} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Store size={19} style={{ color: '#fff' }} />}
                  </div>
                  <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-.01em', color: txt }}>{tienda.nombre}</h1>
                </div>

                <div className="pi-header-lado" />
              </div>
            </div>
          </header>

          <main className="pi-main" style={{ flex: 1, width: '100%' }}>
            {/* Breadcrumb — Tienda › Categoría(s) › Producto. categoryId es
                dato interno del producto, no va en la URL (mismo criterio
                que ofertas). */}
            <nav className="pi-breadcrumb" aria-label="Ruta de navegación">
              <button onClick={onVolver} className="no-press pi-breadcrumb-item" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>{tienda.nombre}</button>
              {categoriaPath.map((c) => (
                <React.Fragment key={c.id}>
                  <ChevronRightCrumb size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
                  <span className="pi-breadcrumb-item">{c.name}</span>
                </React.Fragment>
              ))}
              <ChevronRightCrumb size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
              <span className="pi-breadcrumb-item pi-breadcrumb-actual">{nombreDe(producto)}</span>
            </nav>

            <div className="pi-main-grid">
              {/* ── Foto — fondo con tinte sutil de marca detrás (referencia
                  Rivly, no blanco/gris plano), SIEMPRE cuadrada 1:1, con
                  flechas a los costados + tira de thumbnails debajo
                  (referencia Nostra) cuando hay varias fotos. ── */}
              <div>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: RADIUS.xl, background: fotoFondo, overflow: 'hidden' }}>
                  {foto
                    ? <img src={foto} alt={nombreDe(producto)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 20 }} />
                    : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: txtM }}>
                        <ShoppingBag size={48} style={{ opacity: 0.4 }} />
                      </div>
                  }
                  {badge && (
                    <span style={{ position: 'absolute', top: 14, left: 14, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: RADIUS.sm, background: surf, color: txt, fontSize: 12, fontWeight: 800, boxShadow: SHADOW.sm }}>
                      <badge.Icon size={13} />
                      {badge.label}
                    </span>
                  )}
                  {fotos.length > 1 && (
                    <>
                      <button onClick={() => setFotoIdx((i) => (i - 1 + fotos.length) % fotos.length)} aria-label="Foto anterior" className="no-press pi-arrow"
                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: RADIUS.full, border: 'none', background: 'rgba(255,255,255,.9)', color: '#111', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: SHADOW.sm }}>
                        <ChevronLeft size={19} />
                      </button>
                      <button onClick={() => setFotoIdx((i) => (i + 1) % fotos.length)} aria-label="Foto siguiente" className="no-press pi-arrow"
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: RADIUS.full, border: 'none', background: 'rgba(255,255,255,.9)', color: '#111', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: SHADOW.sm }}>
                        <ChevronRight size={19} />
                      </button>
                    </>
                  )}
                </div>

                {/* Tira de thumbnails debajo de la foto principal — click
                    para cambiar la foto grande (referencia Nostra). Solo si
                    hay más de una foto. */}
                {fotos.length > 1 && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    {fotos.slice(0, 4).map((f, i) => (
                      <button key={i} onClick={() => setFotoIdx(i)} aria-label={`Ver foto ${i + 1}`}
                        className="no-press pi-thumb"
                        style={{
                          width: 64, height: 64, borderRadius: RADIUS.md, overflow: 'hidden', flexShrink: 0,
                          border: `2px solid ${i === fotoIdx ? primary : border}`, padding: 0, background: fotoFondo,
                        }}>
                        <img src={f} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Info — vendedor chico → nombre → precio grande (con
                  tachado si hay descuento) → descripción → acción, jerarquía
                  limpia sin elementos de más (referencia Rivly). ── */}
              <div style={{ paddingTop: 4 }}>
                <p style={{ margin: '0 0 6px', fontSize: 12.5, fontWeight: 700, color: primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tienda.nombre}</p>
                <h2 style={{ margin: '0 0 14px', fontSize: 26, fontWeight: 900, color: txt, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{nombreDe(producto)}</h2>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
                  {producto.precio != null
                    ? <span style={{ fontSize: 34, fontWeight: 900, color: txt, letterSpacing: '-0.02em' }}>{formatPrice(producto.precio)}</span>
                    : <span style={{ fontSize: 17, fontWeight: 700, color: txtM }}>Consultá el precio</span>}
                  {tieneDescuento && (
                    <span style={{ fontSize: 16, color: txtM, textDecoration: 'line-through' }}>{formatPrice(producto.precioOriginal)}</span>
                  )}
                </div>

                {producto.descripcion && (
                  <p style={{ margin: '0 0 24px', fontSize: 14.5, lineHeight: 1.65, color: txtM }}>{producto.descripcion}</p>
                )}

                {/* Bloque de acción — WhatsApp como CTA principal (LOKAL no
                    tiene checkout propio en catálogo, el "agregar al
                    carrito" real de la tienda vive en commerce-modern.jsx
                    cuando el módulo carrito está activo; acá el destino es
                    consultar directo al vendedor), compartir como
                    secundario. */}
                {wa && (
                  <a
                    href={`https://wa.me/54${wa}?text=${encodeURIComponent(`Hola ${tienda.nombre}, te consulto por "${nombreDe(producto)}" que vi en Lokal.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => trackClick(tienda.id, 'whatsapp', { productoId: producto.id })}
                    className="no-press pi-wa-btn"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, marginBottom: 12,
                      borderRadius: RADIUS.lg, border: 'none', background: 'linear-gradient(135deg,#25D366,#128C7E)',
                      color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', textDecoration: 'none', ...F,
                    }}
                  >
                    Consultar por WhatsApp
                    {producto.precio != null && (
                      <span style={{ fontWeight: 700, opacity: 0.85 }}>· {formatPrice(producto.precio)}</span>
                    )}
                  </a>
                )}

                <button onClick={compartir} className="no-press pi-share-btn" style={{
                  width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  border: `1.5px solid ${border}`, borderRadius: RADIUS.lg, background: surf, color: txt,
                  fontWeight: 800, fontSize: 15, cursor: 'pointer', ...F,
                }}>
                  <Share2 size={17} />
                  Compartir
                </button>
              </div>
            </div>

            {/* "Más de esta tienda" — carrusel de cards al pie (referencia
                "Related products" de Nostra), ya resuelto con
                ProductCardGrid/Carrusel — mismo componente que
                ProductDetailModal.jsx. */}
            {masDeLaTienda.length > 0 && navegarAOtroProducto && (
              <div style={{ maxWidth: 1080, margin: '40px auto 0' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800, color: txt, ...F }}>Más de esta tienda</h3>
                <Carrusel gap={10} padding="2px 2px" border={border} text={txt} surface={surf}>
                  {masDeLaTienda.map((p) => (
                    <div key={p.id} style={{ width: CM_GRID_CARD_W, flexShrink: 0 }}>
                      <ProductCardGrid
                        p={p}
                        onOpen={() => navegarAOtroProducto(p)}
                        surf={surf} surf2={surf2} border={border} txt={txt} txtM={txtM}
                        primary={primary} onPrimary={onPrimary}
                        chipBg={chipBg} chipColor={chipColor}
                      />
                    </div>
                  ))}
                </Carrusel>
              </div>
            )}
          </main>
        </div>

        {/* Footer de marca — mismo componente que el home/OfertaIndividual,
            cero divergencia. Fuera del bloque minHeight:100% a propósito. */}
        <TiendaFooter dark={dark} toggleDark={toggleTheme} tiendaId={tienda.id} />
      </div>

      {/* Bottom-nav — mismo componente que el home, solo mobile (en
          escritorio no hace falta: no hay acciones extra que mostrar acá,
          a diferencia de OfertaIndividual que sí tiene mapa/horarios). */}
      <div className="pi-nav-mobile">
        <TiendaNavBar onCompartir={compartir} />
      </div>

      {/* Share — mismo componente, con el link de ESTE producto */}
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} titulo={`${nombreDe(producto)} — ${tienda.nombre}`}
        onCompartido={(medio) => trackCompartir(tienda.id, medio, { productoId: producto.id })} />
    </div>
  );
}

export default ProductoIndividual;
