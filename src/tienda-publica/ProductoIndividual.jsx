/**
 * ProductoIndividual — vista pública de UN producto de catálogo
 * (/:tienda/p/:producto), página completa (mobile Y desktop).
 *
 * ── Dos pieles, un solo componente (prop `origen`) ────────────────────────
 * El mismo producto se puede abrir desde dos lugares muy distintos, y la
 * página tiene que sentirse parte de AQUEL de donde vino:
 *
 *   origen='home'   → llegó desde la Home global (marketplace multi-tienda).
 *                     Identidad LOKAL: tokens generales (--brand, --ink,
 *                     --surface-card), header propio con el logo de LOKAL,
 *                     bottom-nav global, "Volver" regresa a la Home. NO se
 *                     aplica la paleta de la tienda: en un marketplace, el
 *                     producto de un comercio no debe repintar toda la app
 *                     con la marca de ese comercio.
 *   origen='tienda' → llegó desde la tienda individual (o por un link
 *                     externo de WhatsApp/FB, que no tiene origen previo).
 *                     Identidad de la TIENDA: paleta --tp-* vía
 *                     deriveColorPalette, header con su logo/nombre,
 *                     TiendaNavBar/TiendaFooter, "Volver" regresa a la tienda.
 *
 * Ambas pieles comparten EXACTAMENTE el mismo cuerpo (foto cuadrada,
 * breadcrumb de categorías, precio, acciones, "más de esta tienda") — lo que
 * cambia es el chrome y los colores, no la estructura.
 *
 * Layout: mobile apilado (foto → info → sugeridos); desktop 2 columnas con
 * la foto sticky (patrón e-commerce estándar: la foto acompaña mientras se
 * lee la info larga a la derecha).
 */
import React, { useState, useLayoutEffect, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Share2, ShoppingBag, Store, Home as HomeIcon } from 'lucide-react';
import { deriveColorPalette, resolvePagina, formatPrice } from './utils.js';
import { TiendaFooter } from './sections/TiendaFooter.jsx';
import { TiendaNavBar } from './sections/TiendaNavBar.jsx';
import { ShareSheet } from './sections/ShareSheet.jsx';
import { Carrusel, ProductCardGrid, CM_GRID_CARD_W, nombreDe, fotoDe } from './components/ProductCards.jsx';
import { calcularBadges, BADGE_CONFIG } from '../utils/productBadges.js';
import { trackPageview, trackClick, trackCompartir } from './track.js';
import { getCategoryPath } from '../categories.js';
import { LogoSymbol } from '../Brand.jsx';
import { FONT, RADIUS, SHADOW, DESKTOP_QUERY } from './tokens.js';

const F = { fontFamily: FONT.family };

// Paleta por piel. En 'home' son los tokens GENERALES de la app (los mismos
// que usa HomeGlobal.jsx en su objeto CM) — no los --tp-* por tienda, que en
// ese árbol ni siquiera están definidos.
const PALETA = {
  home: {
    bg: 'rgb(var(--surface-dim))',
    surf: 'rgb(var(--surface-solid-rgb))',
    surf2: 'rgb(var(--surface-solid-2-rgb))',
    border: 'var(--border-solid)',
    txt: 'var(--text-primary)',
    txtM: 'var(--text-secondary)',
    primary: 'var(--brand-hex, #00B8D9)',
    onPrimary: '#fff',
    // Tinte suave de marca detrás de la foto, mismo recurso que los glows
    // de la Home (rgb(var(--brand) / alpha)), no un gris plano.
    fotoFondo: 'rgb(var(--brand, 0 184 217) / 0.07)',
    chipBg: 'rgb(var(--surface-solid-2-rgb))',
    chipColor: 'var(--text-primary)',
  },
  tienda: {
    bg: 'var(--tp-bg)',
    surf: 'var(--tp-surface)',
    surf2: 'var(--tp-surface2)',
    border: 'var(--tp-border)',
    txt: 'var(--tp-text)',
    txtM: 'var(--tp-text-muted)',
    primary: 'var(--tp-primary)',
    onPrimary: 'var(--tp-on-primary)',
    fotoFondo: 'var(--tp-primary-soft)',
    chipBg: 'var(--tp-primary-soft)',
    chipColor: 'var(--tp-primary)',
  },
};

export function ProductoIndividual({
  tienda, producto, isDark, toggleTheme, onVolver, onNavegarAProducto,
  origen = 'tienda', onIrAlHome, onIrALaTienda,
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [fotoIdx, setFotoIdx] = useState(0);

  const esHome = origen === 'home';
  const C = esHome ? PALETA.home : PALETA.tienda;

  const pagina = useMemo(() => resolvePagina(tienda.pagina), [tienda]);
  const dark = isDark;

  // La paleta --tp-* (marca de LA tienda) se aplica SOLO en la piel de
  // tienda. En la piel de Home el producto vive dentro del marketplace: se
  // usa la identidad general de LOKAL, y repintar <html> con el color de un
  // comercio puntual rompería esa coherencia (además de teñir el header y la
  // nav globales, que son de la app, no del comercio).
  useLayoutEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('dark', dark);
    if (esHome) return undefined;
    const vars = deriveColorPalette(pagina.color, dark, pagina.colorSecundario);
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    return () => Object.keys(vars).forEach((k) => el.style.removeProperty(k));
  }, [pagina.color, pagina.colorSecundario, dark, esHome]);

  // Si el producto llega cambiado desde afuera (navegar a otro producto
  // desde "Más de esta tienda", o el botón atrás del navegador), el índice
  // de foto se realinea.
  useEffect(() => { setFotoIdx(0); }, [producto.id]);

  const wa = (tienda.whatsapp || '').replace(/\D/g, '');
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => { trackPageview(tienda.id, 'producto'); }, [tienda.id, producto.id]);

  const compartir = useCallback(() => setShareOpen(true), []);

  // "Más de esta tienda": otros productos ACTIVOS del mismo catálogo (viene
  // completo en tienda.productos, ver la rama slug+productoSlug de
  // functions/.netlify/functions/productos.js).
  const productosTienda = useMemo(
    () => (tienda.productos || []).filter((p) => p.activo !== false && p.disponible !== false),
    [tienda.productos],
  );
  const masDeLaTienda = useMemo(
    () => productosTienda.filter((p) => p.id !== producto.id).slice(0, 8),
    [productosTienda, producto.id],
  );

  const navegarAOtroProducto = onNavegarAProducto ? (p) => onNavegarAProducto(tienda, p) : null;

  // Breadcrumb — categoryId es dato INTERNO del producto, nunca va en la URL
  // (mismo criterio que ofertas).
  const categoriaPath = useMemo(
    () => (producto.categoryId ? getCategoryPath(producto.categoryId) : []),
    [producto.categoryId],
  );

  const fotos = (producto.galeria?.length ? producto.galeria : producto.fotos?.length ? producto.fotos : [fotoDe(producto)]).filter(Boolean);
  const foto = fotos[fotoIdx];
  const badges = calcularBadges(producto);
  const badgeId = badges.find((id) => id !== 'oferta'); // "oferta" ya lo cubre el tachado de precio
  const badge = badgeId ? BADGE_CONFIG[badgeId] : null;
  const tieneDescuento = producto.precioOriginal != null && producto.precioOriginal > (producto.precio || 0);
  const pctDescuento = tieneDescuento ? Math.round((1 - producto.precio / producto.precioOriginal) * 100) : null;

  const irAlOrigen = esHome ? (onIrAlHome || onVolver) : (onIrALaTienda || onVolver);

  // Ficha de datos — el HTML de referencia (ChatGPT) tenía una tabla de
  // "Características" con material/medidas/peso inventados. Acá se arma
  // SOLO con los campos que el producto realmente trae: si el dueño no los
  // cargó, la ficha no se muestra en vez de inventar filas vacías.
  const fichaDatos = useMemo(() => ([
    { k: 'Marca', v: producto.marca },
    { k: 'Código', v: producto.sku || producto.codigo },
    { k: 'Presentación', v: producto.presentacion || producto.unidad },
    { k: 'Stock', v: producto.stock != null ? `${producto.stock} disponibles` : null },
  ].filter((f) => f.v != null && f.v !== '')), [producto]);

  return (
    <div className="pi-root" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: C.bg, color: C.txt, ...F }}>
      <style>{`
        /* ── Escala de espaciado por breakpoint. Un solo juego de variables
           que consumen todos los bloques, en vez de repetir el media query
           en cada componente (patrón tomado del theme de la plantilla
           "Local" de Shopify, ver referencias). ── */
        .pi-root {
          --pi-gap: 24px; --pi-pad: 16px; --pi-radio-card: 24px;
          --pi-btn-h: 54px; --pi-header-h: 60px;
        }
        @media ${DESKTOP_QUERY} {
          .pi-root { --pi-gap: 56px; --pi-pad: 28px; --pi-radio-card: 28px; }
        }

        .pi-btn { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), background-color .15s ease, filter .15s ease, border-color .15s ease; }
        .pi-btn:active { transform: scale(0.96); transition: transform .06s ease; }
        @media (hover: hover) { .pi-btn-ghost:hover { background: ${C.surf2} !important; } }
        @media (hover: hover) { .pi-btn-solid:hover { filter: brightness(1.06); } }

        /* Flechas de la foto — MISMO patrón que las del carrusel del Home
           (HomeGlobal.jsx): blanco sólido + sombra en light, glass oscuro
           con outline de marca en dark. Y SIEMPRE visibles en mobile (el
           bug que tenían las de Categorías era quedar en opacity-0 sin
           hover); en desktop aparecen al pasar el mouse. */
        .pi-arrow { transition: opacity .18s ease, transform .12s cubic-bezier(0.34,1.56,0.64,1); }
        .pi-arrow:active { transform: translateY(-50%) scale(0.9); }
        @media ${DESKTOP_QUERY} {
          .pi-arrow { opacity: 0; }
          .pi-foto-card:hover .pi-arrow { opacity: 1; }
        }

        .pi-thumb { transition: border-color .15s ease, transform .12s cubic-bezier(0.34,1.56,0.64,1); }
        .pi-thumb:active { transform: scale(0.94); }
        .pi-crumb-link { background: none; border: none; padding: 0; font: inherit; cursor: pointer; color: ${C.txtM}; }
        @media (hover: hover) { .pi-crumb-link:hover { color: ${C.txt}; text-decoration: underline; } }

        /* Contenedor central — un único ancho máximo compartido por header,
           breadcrumb, cuerpo y sugeridos, para que todo quede alineado en la
           misma columna óptica en desktop. */
        .pi-wrap { width: 100%; max-width: 1100px; margin-inline: auto; padding-inline: var(--pi-pad); }

        /* Breadcrumb: scrollea en horizontal en vez de wrapear a 3 líneas
           cuando la categoría es profunda y el nombre largo (referencia
           component-breadcrumb.css). */
        .pi-crumbs {
          display: flex; align-items: center; gap: 5px; flex-wrap: nowrap;
          overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;
        }
        .pi-crumbs::-webkit-scrollbar { display: none; }
        .pi-crumbs > * { flex-shrink: 0; }

        /* Cuerpo: apilado en mobile, 2 columnas en desktop. La foto queda
           sticky mientras se lee la info (patrón e-commerce estándar). */
        .pi-body { display: flex; flex-direction: column; gap: var(--pi-gap); }
        @media ${DESKTOP_QUERY} {
          .pi-body { display: grid; grid-template-columns: minmax(0, 520px) minmax(0, 1fr); gap: var(--pi-gap); align-items: start; }
          .pi-col-foto { position: sticky; top: calc(var(--pi-header-h) + 24px); }
        }

        /* Acciones — en mobile son una barra fija abajo (referencia: las 4
           capturas de e-commerce mobile, todas resuelven la compra con una
           barra inferior); en desktop van en el flujo de la columna. */
        .pi-acciones { display: flex; gap: 10px; align-items: stretch; }
        /* bottom se apoya en --tp-nav-h (publicado por TiendaNavBar, 0px si
           no existe esa barra — piel Home) para quedar ARRIBA de esa nav,
           nunca tapándola: mapa/horarios/carrito de la tienda siguen
           alcanzables mientras se mira el producto. */
        .pi-barra-mobile {
          position: fixed; left: 0; right: 0; z-index: 45;
          bottom: var(--tp-nav-h, 0px);
          padding: 10px var(--pi-pad) calc(10px + env(safe-area-inset-bottom));
          background: ${isDark ? 'rgba(4,10,20,.88)' : 'rgba(255,255,255,.92)'};
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border-top: 1px solid ${C.border};
        }
        .pi-acciones-desktop { display: none; }
        .pi-main-pad { padding-bottom: calc(var(--pi-btn-h) + var(--tp-nav-h, 0px) + 24px + env(safe-area-inset-bottom)); }
        @media ${DESKTOP_QUERY} {
          .pi-barra-mobile { display: none; }
          .pi-acciones-desktop { display: flex; }
          .pi-main-pad { padding-bottom: 40px; }
        }
      `}</style>

      {/* ── HEADER — glass sticky. Piel Home: logo de LOKAL (identidad de la
          app). Piel tienda: logo/nombre del comercio. En ambas, el botón
          "atrás" es el único control extra, como corresponde a una vista de
          detalle a la que se llega desde algún lado. ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: isDark ? 'rgba(4,10,20,.72)' : 'rgba(255,255,255,.78)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div className="pi-wrap" style={{ minHeight: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onVolver} aria-label="Volver" className="no-press pi-btn pi-btn-ghost" style={{
            width: 40, height: 40, flexShrink: 0, borderRadius: 12, cursor: 'pointer',
            border: `1px solid ${C.border}`, background: C.surf, color: C.txt,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ArrowLeft size={19} />
          </button>

          {esHome ? (
            /* Identidad de LOKAL — la Home es el contexto, no la tienda. */
            <button onClick={onIrAlHome} className="no-press" aria-label="Ir al inicio" style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
              padding: 0, cursor: 'pointer', color: C.txt, minWidth: 0,
            }}>
              <LogoSymbol size={26} className="text-ink" />
            </button>
          ) : (
            /* Identidad de la tienda — su logo + nombre, clickeable para ir a
               su página completa. */
            <button onClick={irAlOrigen} className="no-press" style={{
              display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none',
              padding: 0, cursor: 'pointer', color: C.txt, minWidth: 0, textAlign: 'left',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                background: tienda.logo ? C.surf2 : C.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tienda.logo
                  ? <img src={tienda.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Store size={16} style={{ color: '#fff' }} />}
              </div>
              <span style={{
                fontSize: 15, fontWeight: 800, letterSpacing: '-.01em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{tienda.nombre}</span>
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* En la piel Home, un atajo directo al inicio del marketplace —
              coherente con la nav global, que en mobile va abajo. */}
          {esHome && (
            <button onClick={onIrAlHome} aria-label="Inicio" className="no-press pi-btn pi-btn-ghost" style={{
              width: 40, height: 40, flexShrink: 0, borderRadius: 12, cursor: 'pointer',
              border: `1px solid ${C.border}`, background: C.surf, color: C.txt,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HomeIcon size={18} />
            </button>
          )}
        </div>
      </header>

      {/* padding-bottom deja lugar a .pi-barra-mobile (fija) en mobile; en
          desktop no hace falta porque las acciones viven en el flujo. */}
      <main style={{ flex: 1, paddingTop: 18, paddingBottom: 40 }} className="pi-main-pad">
        {/* Breadcrumb — jerarquía real de navegación: origen › categorías ›
            producto. Los tramos previos son clickeables, el actual no. */}
        <nav className="pi-wrap pi-crumbs" aria-label="Ruta de navegación" style={{
          gap: 5, fontSize: 12.5, color: C.txtM, marginBottom: 16,
        }}>
          <button onClick={irAlOrigen} className="no-press pi-crumb-link">
            {esHome ? 'Inicio' : tienda.nombre}
          </button>
          {categoriaPath.map((c) => (
            <React.Fragment key={c.id}>
              <ChevronRight size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
              <span>{c.name}</span>
            </React.Fragment>
          ))}
          <ChevronRight size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
          <span style={{ color: C.txt, fontWeight: 700 }}>{nombreDe(producto)}</span>
        </nav>

        <div className="pi-wrap pi-body">
          {/* ── Columna foto — card blanca redondeada flotando sobre el
              fondo (referencia: las 4 capturas mobile, todas usan card en
              vez de foto full-bleed), flechas al costado SIEMPRE visibles
              en mobile y tira de thumbnails horizontal debajo. ── */}
          <div className="pi-col-foto">
            <div className="pi-foto-card" style={{
              position: 'relative', width: '100%', aspectRatio: '1 / 1',
              borderRadius: 'var(--pi-radio-card)', background: C.fotoFondo, overflow: 'hidden',
              border: `1px solid ${C.border}`, boxShadow: SHADOW.sm,
            }}>
              {foto
                ? <img src={foto} alt={nombreDe(producto)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 24 }} />
                : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: C.txtM }}>
                    <ShoppingBag size={48} style={{ opacity: 0.35 }} />
                  </div>}

              {/* Un solo distintivo arriba a la izquierda: el % de descuento
                  manda sobre el badge (es el dato más accionable); si no hay
                  descuento, se muestra el badge dinámico. */}
              {pctDescuento ? (
                <span style={{
                  position: 'absolute', top: 14, left: 14, padding: '6px 11px', borderRadius: RADIUS.full,
                  background: C.primary, color: C.onPrimary, fontSize: 12.5, fontWeight: 900,
                }}>−{pctDescuento}%</span>
              ) : badge && (
                <span style={{
                  position: 'absolute', top: 14, left: 14, display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 11px', borderRadius: RADIUS.full, background: C.surf, color: C.txt,
                  fontSize: 11.5, fontWeight: 800, boxShadow: SHADOW.sm,
                }}>
                  <badge.Icon size={12} />
                  {badge.label}
                </span>
              )}

              {fotos.length > 1 && (
                <>
                  {/* Mismo look que las flechas del Home: blanco sólido +
                      sombra en light; glass oscuro + outline de marca en
                      dark (ver HomeGlobal.jsx, flechas del banner). */}
                  {[-1, 1].map((dir) => (
                    <button key={dir}
                      onClick={() => setFotoIdx((i) => (i + dir + fotos.length) % fotos.length)}
                      aria-label={dir < 0 ? 'Foto anterior' : 'Foto siguiente'}
                      className="no-press pi-arrow"
                      style={{
                        position: 'absolute', [dir < 0 ? 'left' : 'right']: 12, top: '50%',
                        transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: RADIUS.full,
                        border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer',
                        background: isDark ? 'rgba(0,0,0,.35)' : '#fff',
                        color: isDark ? '#fff' : '#111',
                        backdropFilter: isDark ? 'blur(8px)' : undefined,
                        WebkitBackdropFilter: isDark ? 'blur(8px)' : undefined,
                        boxShadow: isDark ? 'none' : SHADOW.md,
                        outline: isDark ? '1px solid rgb(var(--brand, 0 184 217) / 0.5)' : 'none',
                        outlineOffset: -1,
                      }}>
                      {dir < 0 ? <ChevronLeft size={19} /> : <ChevronRight size={19} />}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Thumbnails — tira horizontal scrolleable (referencia
                "Elegance Coat"): no wrapea a varias filas empujando el
                precio fuera de pantalla. */}
            {fotos.length > 1 && (
              <div className="pi-crumbs" style={{ gap: 10, marginTop: 12 }}>
                {fotos.map((f, i) => (
                  <button key={i} onClick={() => setFotoIdx(i)} aria-label={`Ver foto ${i + 1}`} className="no-press pi-thumb"
                    style={{
                      width: 64, height: 64, borderRadius: RADIUS.md, overflow: 'hidden', flexShrink: 0, padding: 0,
                      border: `2px solid ${i === fotoIdx ? C.primary : C.border}`,
                      background: C.surf, cursor: 'pointer',
                      opacity: i === fotoIdx ? 1 : 0.66,
                    }}>
                    <img src={f} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5 }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Columna info — vendedor → nombre+precio → descripción →
              acciones. Jerarquía limpia, sin elementos de más. ── */}
          <div>
            {/* Quién lo vende. En la piel Home es información nueva y
                accionable (el usuario no venía de esa tienda); en la piel
                tienda ya está en el header, así que no se repite. */}
            {esHome && (
              <button onClick={onIrALaTienda} className="no-press pi-btn pi-btn-ghost" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14,
                padding: '7px 12px 7px 8px', borderRadius: RADIUS.full,
                border: `1px solid ${C.border}`, background: C.surf, cursor: 'pointer', maxWidth: '100%',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                  background: tienda.logo ? C.surf2 : C.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {tienda.logo
                    ? <img src={tienda.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Store size={13} style={{ color: '#fff' }} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tienda.nombre}
                </span>
                <ChevronRight size={15} style={{ color: C.txtM, flexShrink: 0 }} />
              </button>
            )}

            {/* Nombre y precio en UNA fila (referencia: las 4 capturas, todas
                ponen el precio a la derecha del título, no debajo). El
                tachado va arriba del precio, más chico y en gris. */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
              <h1 style={{
                flex: 1, margin: 0, fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 900,
                color: C.txt, letterSpacing: '-0.025em', lineHeight: 1.15, textWrap: 'balance',
              }}>{nombreDe(producto)}</h1>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {tieneDescuento && (
                  <div style={{ fontSize: 14, color: C.txtM, textDecoration: 'line-through', lineHeight: 1.2, marginBottom: 2 }}>
                    {formatPrice(producto.precioOriginal)}
                  </div>
                )}
                {producto.precio != null
                  ? <div style={{ fontSize: 'clamp(24px, 5.5vw, 32px)', fontWeight: 900, color: C.txt, letterSpacing: '-0.03em', lineHeight: 1, whiteSpace: 'nowrap' }}>
                      {formatPrice(producto.precio)}
                    </div>
                  : <div style={{ fontSize: 16, fontWeight: 700, color: C.txtM, whiteSpace: 'nowrap' }}>Consultá el precio</div>}
              </div>
            </div>

            {producto.descripcion && (
              <p style={{ margin: '0 0 26px', fontSize: 15, lineHeight: 1.65, color: C.txtM, maxWidth: '60ch' }}>
                {producto.descripcion}
              </p>
            )}

            {/* Acciones en el flujo — SOLO desktop (la referencia de las 4
                capturas mobile resuelve la compra con una barra fija abajo,
                no acá adentro del scroll; en desktop sí van en la columna,
                que ya está sticky). En mobile viven en .pi-barra-mobile. */}
            <div className="pi-acciones pi-acciones-desktop">
              <AccionesProducto wa={wa} tienda={tienda} producto={producto} C={C} compartir={compartir} trackClick={trackClick} F={F} />
            </div>

            {/* Ficha de datos — solo los campos que el producto REALMENTE
                trae. Reemplaza el bloque de "Características" del HTML de
                referencia, que ahí era contenido inventado. */}
            {fichaDatos.length > 0 && (
              <div style={{
                marginTop: 26, borderRadius: RADIUS.lg, border: `1px solid ${C.border}`,
                background: C.surf, overflow: 'hidden',
              }}>
                {fichaDatos.map(({ k, v }, i) => (
                  <div key={k} style={{
                    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16,
                    padding: '12px 16px', fontSize: 13.5,
                    borderTop: i ? `1px solid ${C.border}` : 'none',
                  }}>
                    <span style={{ color: C.txtM }}>{k}</span>
                    <span style={{ color: C.txt, fontWeight: 700, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sugeridos — mismas cards que el catálogo, sin un tercer estilo
            de card en la app. ── */}
        {masDeLaTienda.length > 0 && navegarAOtroProducto && (
          <div className="pi-wrap" style={{ marginTop: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.txt, letterSpacing: '-.01em' }}>
                Más de {tienda.nombre}
              </h2>
              <button onClick={irAlOrigen} className="no-press pi-crumb-link" style={{ fontSize: 13, fontWeight: 700, color: C.primary, whiteSpace: 'nowrap' }}>
                Ver todo
              </button>
            </div>
            <Carrusel gap={10} padding="2px 2px" border={C.border} text={C.txt} surface={C.surf}>
              {masDeLaTienda.map((p) => (
                <div key={p.id} style={{ width: CM_GRID_CARD_W, flexShrink: 0 }}>
                  <ProductCardGrid
                    p={p}
                    onOpen={() => navegarAOtroProducto(p)}
                    surf={C.surf} surf2={C.surf2} border={C.border} txt={C.txt} txtM={C.txtM}
                    primary={C.primary} onPrimary={C.onPrimary}
                    chipBg={C.chipBg} chipColor={C.chipColor}
                  />
                </div>
              ))}
            </Carrusel>
          </div>
        )}
      </main>

      {/* Footer de marca — solo en la piel de tienda (es el footer de la
          tienda pública). En la piel Home la página termina en los
          sugeridos: el footer de la Home vive en HomeGlobal.jsx y arrastrar
          sus CTAs de "¿Tenés un negocio?" hasta acá sería ruido en una vista
          de detalle de producto. */}
      {!esHome && <TiendaFooter dark={dark} toggleDark={toggleTheme} tiendaId={tienda.id} />}

      {/* Bottom-nav de la tienda — solo en la piel de tienda, por el mismo
          motivo (sus acciones son mapa/horarios/carrito DE esa tienda). En
          la piel Home no hay bottom-nav de tienda, así que la barra de
          compra mobile queda pegada al borde inferior real. */}
      {!esHome && (
        <TiendaNavBar onCompartir={compartir} />
      )}

      {/* Barra de compra fija — SOLO mobile (referencia: las 4 capturas de
          e-commerce mobile resuelven el CTA principal así, no adentro del
          scroll). Se apoya sobre --tp-nav-h para quedar ARRIBA del
          TiendaNavBar (que no es fixed, empuja el layout como cualquier
          hermano flex) sin taparlo — en la piel Home esa variable no
          existe y la barra cae directo al borde inferior real. */}
      <div className="pi-barra-mobile">
        <div className="pi-acciones">
          <AccionesProducto wa={wa} tienda={tienda} producto={producto} C={C} compartir={compartir} trackClick={trackClick} F={F} />
        </div>
      </div>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl}
        titulo={`${nombreDe(producto)} — ${tienda.nombre}`}
        onCompartido={(medio) => trackCompartir(tienda.id, medio, { productoId: producto.id })} />
    </div>
  );
}

// AccionesProducto — WhatsApp (ancho) + compartir (cuadrado al lado, mismo
// alto). Extraído a parte porque se renderiza DOS veces: en el flujo de la
// columna en desktop y en la barra fija en mobile — mismo componente, dos
// lugares, para no divergir el copy/comportamiento entre uno y otro.
function AccionesProducto({ wa, tienda, producto, C, compartir, trackClick, F }) {
  return (
    <>
      {wa && (
        <a
          href={`https://wa.me/54${wa}?text=${encodeURIComponent(`Hola ${tienda.nombre}, te consulto por "${nombreDe(producto)}" que vi en Lokal.`)}`}
          target="_blank" rel="noopener noreferrer"
          onClick={() => trackClick(tienda.id, 'whatsapp', { productoId: producto.id })}
          className="no-press pi-btn pi-btn-solid"
          style={{
            flex: 1, height: 'var(--pi-btn-h)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            borderRadius: RADIUS.lg, border: 'none', background: 'linear-gradient(135deg,#25D366,#128C7E)',
            color: '#fff', fontWeight: 800, fontSize: 15.5, cursor: 'pointer', textDecoration: 'none', ...F,
          }}
        >
          Consultar por WhatsApp
        </a>
      )}
      <button onClick={compartir} aria-label="Compartir" className="no-press pi-btn pi-btn-ghost"
        style={{
          width: wa ? 'var(--pi-btn-h)' : undefined, flex: wa ? undefined : 1, height: 'var(--pi-btn-h)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0,
          border: `1.5px solid ${C.border}`, borderRadius: RADIUS.lg, background: C.surf, color: C.txt,
          fontWeight: 800, fontSize: 15, cursor: 'pointer', ...F,
        }}>
        <Share2 size={18} />
        {!wa && 'Compartir'}
      </button>
    </>
  );
}

export default ProductoIndividual;
