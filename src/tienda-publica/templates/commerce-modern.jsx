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

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Star, MapPin, Clock, Share2,
  Users, ChevronLeft, ChevronRight, Navigation, Store, Globe, X, Check, Plus, BarChart3, Pencil,
  User,
} from 'lucide-react';

import { LogoSymbol } from '../../Brand.jsx';
import { MapaSection, MapaModal } from '../sections/MapaSection.jsx';
import { CatalogoSection, CatalogoModal } from '../sections/CatalogoSection.jsx';
import { OfertasSection, OfertasModal } from '../sections/OfertasSection.jsx';
import { HorariosSheet } from '../sections/HorariosSheet.jsx';
import { CarritoSheet } from '../sections/CarritoSheet.jsx';
import { TiendaNavBar } from '../sections/TiendaNavBar.jsx';
import { TiendaFooter } from '../sections/TiendaFooter.jsx';
import { ShareSheet } from '../sections/ShareSheet.jsx';
import { ProductDetailModal } from '../sections/ProductDetailModal.jsx';

import { getEstadoApertura } from '../utils.js';
import { usePhotoSwipe, PhotoSwipeStyles, PhotoSwipeOverlay } from '../hooks/usePhotoSwipe.jsx';
import { trackPageview, trackClick, trackCompartir, useTiempoEnPagina } from '../track.js';
import { OfertaQuickForm } from '../sections/OfertaQuickForm.jsx';
import { TiendaStatsSheet } from '../sections/TiendaStatsSheet.jsx';
import { FONT, RADIUS, SHADOW, DESKTOP_QUERY } from '../tokens.js';
import { Carrusel } from '../components/ProductCards.jsx';
import { OfertaAdminSheet } from '../sections/OfertaAdminSheet.jsx';

const F = { fontFamily: FONT.family };

// Íconos exactos del mockup aprobado (no los genéricos de lucide-react, que
// no coinciden visualmente con los logos reales de WhatsApp/Instagram).
function IconWhatsApp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.01c-.24.68-1.42 1.31-1.96 1.36-.5.05-1.14.07-1.84-.12-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.23-5.01-4.43-.15-.2-1.2-1.6-1.2-3.05s.76-2.16 1.03-2.46c.27-.3.59-.37.79-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.82 2.04.89 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.36 1.45.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.66-.15.27.1 1.71.81 2 .96.3.15.5.22.57.34.07.12.07.7-.17 1.38z"/>
    </svg>
  );
}
function IconInstagram(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  );
}

const GLOBAL_CSS = `
  @keyframes cm-spin { to { transform: rotate(360deg); } }
  .cm-spin { animation: cm-spin 0.8s linear infinite; }
  .cm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  @media (min-width: 620px) { .cm-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
  @media (min-width: 980px) { .cm-grid { grid-template-columns: repeat(4, 1fr); } }
  /* Pantallas anchas: más columnas en vez de cards gigantes. Con 4 columnas
     a 1440px cada oferta medía ~340px de ancho por ~480 de alto (son
     verticales, proporción A4), así que una sola fila ya no entraba en
     pantalla y obligaba a scrollear para ver el resto del catálogo. Con 5
     y 6 la fila entra completa y se ve más oferta de un vistazo, que es de
     lo que se trata la pantalla. */
  /* auto-fit + minmax en vez de un número fijo de columnas: una tienda con
     3 ofertas en una pantalla de 6 columnas dejaba media fila vacía a la
     derecha, con todo el bloque colgado a la izquierda. Así las columnas se
     crean solo si hay cards que ponerles, y justify-content:center apoya el
     conjunto en el medio. El minmax fija el ancho máximo de card: sin él,
     pocas ofertas se estiraban a media pantalla cada una. */
  @media (min-width: 1280px) {
    .cm-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 260px)); justify-content: center; }
  }
  .cm-chips::-webkit-scrollbar { display: none; }
  /* Scroll vertical principal de la página — mismo criterio: oculta la
     scrollbar en Chrome/Safari/mobile (::-webkit-scrollbar) y Firefox
     (scrollbar-width en el inline style), para que se sienta más nativo. */
  .cm-scroll::-webkit-scrollbar { display: none; }

  /* Los tokens --tp-* son alias de los tokens reales de LOKAL (ver
     src/index.css §4.bis) — ya no hace falta !important, no hay dos paletas
     compitiendo.
     :focus-visible SÍ hay que pisarlo: LOKAL define un outline turquesa fijo
     global (var(--brand-hex), 2.5px) para accesibilidad de teclado en TODA
     la app — correcto ahí, pero acá compite mal con la paleta de marca de
     la tienda (puede ser cualquier color, no turquesa). Reemplazado por un
     outline fino usando el color de marca de ESTA tienda. */
  /* ── Sistema de estados: inicial / hover / press / focus ──
     Un solo criterio para toda la interfaz de tienda: hover con
     brightness() SOLO en @media(hover:hover) (mouse real — evita que un
     toque en mobile deje el estado "pegado" hasta el próximo tap), press
     con brightness() más fuerte + el bounce global de scale ya existente
     en toda la app (index.css, aplica automático a cualquier <button>).
     brightness() funciona igual sobre fondo neutro o sobre un sólido de
     color (--tp-primary), sin necesitar un token de color distinto por
     estado y por variante. */
  .cm-input { background: var(--tp-surface2); color: var(--tp-text); border-color: var(--tp-border); }
  .cm-input:focus { border-color: var(--tp-primary); }
  .cm-input:focus-visible { outline: 1.5px solid var(--tp-primary); outline-offset: 1px; }
  .cm-input::placeholder { color: var(--tp-text-muted); opacity: 1; }
  /* Hover del buscador aplicado al WRAPPER completo (ícono + input juntos),
     no al <input> solo: la lupa está posicionada absolute ENCIMA del input
     con pointer-events:none, así que el hover "atraviesa" el ícono y cae
     sobre el input de abajo. Si el filter se aplica solo al input, la lupa
     (sin filter) queda con una discontinuidad de brillo respecto al fondo
     que tiene debajo — se leía como "el ícono desaparece/cambia de color".
     Aplicando el filter al WRAPPER, ícono e input se atenúan como una sola
     unidad visual, sin discontinuidad. */
  @media (hover: hover) {
    .cm-search-wrap:hover { filter: brightness(0.97); }
  }

  /* Barra sticky (buscador + chips) con efecto glass/liquid — fondo
     translúcido + blur, técnica cosechada de PARALLAX/detail-3 del padre.
     Fallback sólido (--tp-bg) primero para navegadores sin backdrop-filter;
     el @supports lo sobrescribe con la versión translúcida solo si hay
     soporte, así nunca queda texto detrás visible sin blur. */
  .cm-sticky-bar { background: var(--tp-bg); }
  @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .cm-sticky-bar {
      background: color-mix(in srgb, var(--tp-bg) 72%, transparent);
      -webkit-backdrop-filter: blur(18px) saturate(1.6);
              backdrop-filter: blur(18px) saturate(1.6);
    }
  }

  /* Botones de filtro/ordenar en la barra: el fondo es dinámico (inline
     style, sólido cuando hay filtro/orden activo) — un inline style no
     puede recibir :hover/:active de CSS, así que sin esto perdían todo
     feedback visual (el buscador SÍ lo tiene vía .cm-input arriba). */
  @media (hover: hover) {
    .cm-toggle-btn:hover { filter: brightness(0.96); }
  }
  /* Feedback de presión = escala, idéntico al gesto global del nav/footer
     (scale 0.93, curva bounce). El hover sigue con brillo/color aparte. */
  .cm-toggle-btn { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
  .cm-toggle-btn:active { transform: scale(0.93); transition: transform .06s ease; }

  /* Feedback suave en la card (sin el scale brusco global de LOKAL) */
  .cm-card { transition: box-shadow .18s ease, border-color .18s ease; }
  @media (hover: hover) {
    .cm-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.10); border-color: var(--tp-primary); }
  }
  .cm-card:active { box-shadow: 0 2px 10px rgba(0,0,0,.08); }

  /* Flechas del carrusel de fotos y chips de categoría: mismo criterio
     hover/press que el resto. */
  /* brightness(0.95-0.97) era casi imperceptible en íconos chicos sobre
     fondo claro — el press (active, más abajo) SÍ se notaba porque suma un
     transform de escala, pero el hover solo tenía el filter sutil. Subido
     a 0.85-0.88 (mismo nivel que ya usa :active en otros elementos) para
     que hover sea claramente visible, no solo técnicamente presente. */
  @media (hover: hover) {
    .cm-hero-arrow:hover { filter: brightness(0.85); }
    .cm-chip:hover { filter: brightness(0.88); }
    .cm-hero-social a:hover { color: var(--tp-primary) !important; border-color: var(--tp-primary) !important; background: color-mix(in srgb, var(--tp-primary) 10%, transparent) !important; }
    /* Compartir del hero (foto de portada) y X de limpiar búsqueda: no
       tenían transition ni :hover en absoluto (la X además tiene no-press,
       así que ni el active global la cubría). */
    .cm-hero-share-btn:hover { background: rgba(0,0,0,.65) !important; }
    .cm-clear-btn:hover { filter: brightness(0.85); }
  }
  .cm-hero-arrow, .cm-chip { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
  .cm-hero-arrow:active, .cm-chip:active { transform: scale(0.93); transition: transform .06s ease; }
  /* Flechas del carrusel de "Tiendas similares" (Carrusel genérico) y card
     de tienda similar: mismo hueco que el resto — no-press sin ninguna
     regla propia, quedaban sin hover/active. */
  @media (hover: hover) {
    .cm-carousel-arrow:hover { filter: brightness(0.85); }
    .cm-tienda-similar:hover { box-shadow: 0 6px 24px rgba(0,0,0,.10); border-color: var(--tp-primary); }
  }
  .cm-carousel-arrow { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
  .cm-carousel-arrow:active { transform: scale(0.93); transition: transform .06s ease; }
  .cm-tienda-similar:active { transform: scale(0.96); transition: transform .06s ease; }
  .cm-hero-share-btn { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), background .15s ease; }
  .cm-hero-share-btn:active { transform: scale(0.93); transition: transform .06s ease; }
  /* cm-clear-btn está centrado con translateY(-50%) — el scale de presión
     se compone con ese transform base para no descentrarlo. */
  .cm-clear-btn:active { transform: translateY(-50%) scale(0.88); transition: transform .06s ease; }
  /* Redes del hero: feedback de presión por escala, consistente con el
     resto (el hover de color vive arriba, en el bloque hover). */
  .cm-hero-social a { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), color .2s ease, border-color .2s ease, background .2s ease; }
  .cm-hero-social a:active { transform: scale(0.93); transition: transform .06s ease; }

  /* Pulso muy leve al agregar (reemplaza el scale(0.93) heredado) */
  .cm-add { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1); }
  .cm-add:active { transform: scale(0.92); }
  @keyframes cm-pop { 0% { transform: scale(1); } 40% { transform: scale(1.12); } 100% { transform: scale(1); } }
  .cm-pop { animation: cm-pop .28s ease-out; }

  /* ── HERO híbrido: carrusel de fondo con FUNDIDO por máscara + card
     flotante centrada. La foto se disuelve (mask-image) hacia el color de
     la card (--tp-surface), y el contenedor del hero es ese mismo color →
     un solo tono continuo, sin escalón. La card se distingue por sombra +
     borde, no por color. (Técnica validada: fundir con máscara evita el
     "gris lavado" de mezclar color-con-alpha encima de la foto.) ── */
  /* El hero se integra con el FONDO DE PÁGINA (--tp-bg): tanto el contenedor
     como el color al que funde la foto son --tp-bg, así el hero no es una
     isla de otro color sobre el fondo. La card SÍ es --tp-surface (distinto)
     y se distingue por color + sombra + borde, flotando sobre ese fondo. */
  .cm-hero { position: relative; background: var(--tp-bg); }
  .cm-hero-photo {
    position: relative; overflow: hidden; height: 240px; background: var(--tp-bg);
  }
  .cm-hero-photo img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    -webkit-mask-image: linear-gradient(to top, transparent 0%, rgba(0,0,0,.15) 52px, #000 150px);
            mask-image: linear-gradient(to top, transparent 0%, rgba(0,0,0,.15) 52px, #000 150px);
  }
  /* Oscurecido leve arriba: legibilidad de dots/compartir sobre la foto */
  .cm-hero-photo::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 80px; z-index: 1;
    background: linear-gradient(to bottom, rgba(0,0,0,.32) 0%, rgba(0,0,0,0) 100%);
    pointer-events: none;
  }
  /* Card con degradado propio: arriba --tp-surface (gris claro actual),
     abajo --tp-bg (el tono oscuro/negro del fondo) — la card también se
     funde hacia el fondo en su propia base, no es un bloque de color
     plano. Sombra CORTA (poco blur/offset): una sombra muy extendida corta
     feo contra el borde (límite duro entre "sombra" y "borde");
     acercándola, la transición se lee natural. */
  .cm-hero-card {
    position: relative; z-index: 2; margin: -60px 12px 0;
    background: linear-gradient(to bottom, var(--tp-surface) 0%, var(--tp-bg) 100%);
    border: 1px solid var(--tp-border);
    border-radius: 20px;
    box-shadow: 0 4px 10px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.05);
    padding: 0 16px 18px; display: flex; flex-direction: column; align-items: center; text-align: center;
  }
  /* En dark una sombra negra es invisible sobre fondo casi negro (--tp-bg
     ≈ --tp-surface ahí también) — se suma un resplandor claro muy sutil
     (borde luminoso) para que el volumen de la card se note igual. Mismo
     criterio para el logo cuadrado (su SHADOW.md también es negro fijo). */
  .dark .cm-hero-card {
    box-shadow: 0 4px 10px rgba(0,0,0,.35), 0 1px 3px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.06);
  }
  .dark .cm-hero-logo {
    box-shadow: 0 4px 14px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08) !important;
  }
  /* Flechas del carrusel: blanco + ícono oscuro en light, gris oscuro +
     ícono blanco en dark — mismo criterio del resto de la card (contraste
     garantizado por tema). Borde sutil, mismo espíritu que el de las cards. */
  .cm-hero-arrow { background: rgba(255,255,255,.9); color: #18181b; border: 1px solid rgba(0,0,0,.08) !important; }
  .dark .cm-hero-arrow { background: rgba(82,82,82,.65); color: #fff; border: 1px solid rgba(255,255,255,.12) !important; }
  /* Chips de acción neutros — ícono con color de marca de cada red */
  /* Fondo translúcido (no --tp-surface2 sólido) — mismo criterio que el
     mockup aprobado: chips livianos, que no compiten visualmente con la
     card. Usa currentColor con poca opacidad, así funciona igual en
     light/dark sin depender de un token de superficie específico. */
  .cm-action {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    height: 34px; border-radius: 999px; border: 1px solid var(--tp-border);
    background: color-mix(in srgb, var(--tp-text) 7%, transparent);
    color: var(--tp-text);
    font-size: 12.5px; font-weight: 700; cursor: pointer; text-decoration: none;
    transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease;
  }
  @media (hover: hover) {
    .cm-action:hover { filter: brightness(0.94); }
  }
  .cm-action:active { transform: scale(0.93); transition: transform .06s ease; }
  .cm-action.icon-only { width: 34px; }
  .cm-action.has-text { padding: 0 14px; }
  .cm-action svg { width: 16px; height: 16px; }

  /* Tooltip custom (mismo look que Sidebar.tsx del admin: fondo oscuro,
     texto blanco, rounded-md, shadow) — reemplaza el title nativo del
     navegador (gris, delay largo, sin estilo) en botones de ícono solo.
     Solo en mouse real (hover:hover); en touch no tiene sentido (no hay
     "hover" persistente antes del tap). */
  @media (hover: hover) {
    [data-tooltip] { position: relative; }
    [data-tooltip]::after {
      content: attr(data-tooltip);
      position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%) translateY(4px);
      background: #18181b; color: #fff; font-size: 11.5px; font-weight: 600;
      padding: 5px 9px; border-radius: 6px; white-space: nowrap;
      box-shadow: 0 4px 14px rgba(0,0,0,.25);
      opacity: 0; pointer-events: none; transition: opacity .15s ease, transform .15s ease;
      z-index: 50;
    }
    [data-tooltip]:hover::after { opacity: 1; transform: translateX(-50%) translateY(0); transition-delay: .35s; }
  }
`;

// nombreDe/fotoDe/iconoDeCategoria/esCategoriaVertical/catDe viven en
// CatalogoSection.jsx/OfertasSection.jsx/components/ProductCards.jsx — ya
// no se usan directo acá (Catálogo y Ofertas se movieron a sus modales,
// Fase 6 del plan).

export function TemplateCommerceModern({
  tienda, secciones, isDark,
  // modo gobierna diferencias de FORMA (no solo presencia de secciones):
  // 'standalone' = /t/:slug público, sin sesión; 'plataforma' = logueado
  // dentro de LOKAL. TiendaPublicaRenderer siempre pasa 'standalone'; el
  // wrapper que reemplaza TiendaDetailScreen pasa 'plataforma'.
  modo = 'standalone',
  // ── Props de "modo plataforma" — solo vienen cuando esta pantalla se
  // renderiza logueado dentro de LOKAL (currentScreen === 'tienda-detail'
  // en App.jsx); en standalone (/t/:slug público) quedan undefined y las
  // secciones correspondientes no se muestran. Chat/Llamar no están
  // disponibles como funcionalidad — la fila de contacto solo cubre
  // Navegar (mapa interno), WhatsApp e Instagram (estos dos vía datos de
  // la propia tienda, sin callback).
  onVerEnMapaGlobal,  // () => void — click-through del mapa al mapa global de LOKAL
  tiendasSimilares,   // Tienda[] | undefined
  onIrATienda,        // (tienda) => void
  onVerTodosFiltrado, // () => void — "Ver todos" en el catálogo, solo plataforma
  onVerOferta,        // (tienda, oferta) => void — clic interno SPA a la oferta (sin re-fetch); si no viene, el <a href> navega normal
  heroLayout = 'card',// 'card' (default, apilado centrado) | 'editorial' (foto banner + logo izq + info en columna a la derecha, composición horizontal que ahorra altura)
  footer,             // { dark, toggleDark } | null — render-prop del footer de marca (TiendaPublicaRenderer)
  // Dueño logueado viendo su propia tienda — habilita el FAB "+" de carga
  // rápida de oferta directo acá, sin ir al panel (ver OfertaQuickForm), y
  // el botón de 3 puntos por card (ver OfertaAdminSheet) para
  // ocultar/cambiar vencimiento/eliminar sin salir del catálogo público.
  // onIrAlPanel — atajo al panel admin completo, tercer FAB apilado (ver
  // más abajo, junto a "+"/estadísticas). Antes vivía como botón fijo
  // propio en TiendaPublica.jsx (bottom:16 sin relación al nav), ahora
  // sigue el mismo criterio de elevación que los otros dos.
  // onOfertaReintentar/onOfertaCancelarPendiente — solo actúan sobre la card
  // "pendiente" que aparece al instante tras publicar (ver más abajo, sección
  // Ofertas): reintenta la subida en segundo plano o la descarta sin haber
  // llegado a existir en el backend.
  esDueño, onOfertaCreada, onOfertaActualizada, onOfertaEliminada, onIrAlPanel,
  onOfertaReintentar, onOfertaCancelarPendiente,
}) {
  // Estado de sheets/modales del hero (mapa + horarios). onAbrirMapa se
  // resuelve más abajo una vez calculado si hay coordenadas.
  const [horariosOpen, setHorariosOpen] = useState(false);
  const [mapaOpen, setMapaOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [ofertaQuickOpen, setOfertaQuickOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [ofertaAdminTarget, setOfertaAdminTarget] = useState(null);
  // Módulo Ofertas — sheet de compartir propio (link individual con OG
  // dinámico, distinto del share genérico de la tienda de arriba).
  const [shareOfertaOpen, setShareOfertaOpen] = useState(false);
  const [ofertaCompartir, setOfertaCompartir] = useState(null);
  // Cuánto "invade" el banner CTA ("¿Tenés un negocio?") la franja inferior
  // del scroll — los FABs del dueño suben la misma cantidad de píxeles para
  // no taparlo al llegar al final. 0 mientras el banner no asomó todavía.
  const [fabLift, setFabLift] = useState(0);
  const ctaBannerRef = useRef(null);
  const s = Object.fromEntries(secciones.map(sec => [sec.id, sec]));

  const productos = (tienda.productos || []).filter(p => p.activo !== false && p.disponible !== false);

  const [detalle, setDetalle] = useState(null);
  // Catálogo: solo el interruptor del modal fullscreen queda acá — todo el
  // estado de búsqueda/filtro/orden/categoría vive dentro de CatalogoModal
  // (self-contained, Fase 6 del plan), sin consumidores fuera de su UI.
  const [catalogoModalOpen, setCatalogoModalOpen] = useState(false);

  // ── Carrito — reemplaza el patrón viejo de "armar un mensaje y mandarlo
  // por WhatsApp": acá se arma un pedido con link propio (POST /carrito, ya
  // construido en el backend) en vez de texto plano. Estado local simple
  // {ofertaId: qty} — se resetea si se recarga la página (mismo criterio que
  // un carrito de compra típico, no hace falta persistirlo). Se queda a
  // nivel de página (no dentro de CatalogoModal) para que el ícono con
  // contador de TiendaNavBar siga accesible con el catálogo cerrado.
  const [carritoQty, setCarritoQty] = useState({});
  const [carritoOpen, setCarritoOpen] = useState(false);
  const carritoCount = Object.values(carritoQty).reduce((a, b) => a + b, 0);
  const agregarAlCarrito = (p) => setCarritoQty(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }));
  const quitarDelCarrito = (id) => setCarritoQty(prev => {
    const next = { ...prev };
    if (next[id] <= 1) delete next[id];
    else next[id] -= 1;
    return next;
  });

  const { abierta, texto } = getEstadoApertura(tienda.horarios);

  // ── Ofertas: solo el interruptor del modal fullscreen y los arrays base
  // quedan acá — todo el estado de búsqueda/filtro/orden/categoría vive
  // dentro de OfertasModal (self-contained, Fase 6 del plan).
  const [ofertasModalOpen, setOfertasModalOpen] = useState(false);
  const ofertasBase = useMemo(() => (tienda.ofertas || []).filter(o => !o._localId), [tienda.ofertas]);
  // Las cards "pendiente"/error (o._localId) no participan del filtro/orden
  // — siempre se muestran primero, igual que antes de este cambio.
  const ofertasPendientes = useMemo(() => (tienda.ofertas || []).filter(o => o._localId), [tienda.ofertas]);

  // Carrusel de fotos del hero — crossfade por opacity (evita el parpadeo
  // de cambiar el src), mismo patrón que usaba TiendaDetailScreen.jsx.
  const [photoIdx, setPhotoIdx] = useState(0);

  const bg = 'var(--tp-bg)', surf = 'var(--tp-surface)', surf2 = 'var(--tp-surface2)';
  const border = 'var(--tp-border)', txt = 'var(--tp-text)', txtM = 'var(--tp-text-muted)';
  const primary = 'var(--tp-primary)', primarySoft = 'var(--tp-primary-soft)', onPrimary = 'var(--tp-on-primary)';

  // tienda.foto es la FOTO DE PERFIL (logo redondeado sobre el hero, ver
  // cm-hero-logo abajo) — nunca debe usarse como fondo/portada del hero.
  // El fondo sale de tienda.galeria (portada = galeria[0], ver MediaEditorModal
  // en StoreApp.jsx) — antes tienda.foto tenía prioridad acá, así que subir
  // SOLO una foto de perfil (sin cargar portada/galería) la hacía aparecer
  // como si fuera la portada del banner grande.
  const heroImg = tienda.galeria?.[0] || null;
  // Mismo dedupe que usa el hero abajo (evita mostrar heroImg repetida si ya
  // está en tienda.galeria) — se recalcula acá, a nivel de componente, para
  // poder llamar los hooks de zoom (reglas de hooks: no dentro del IIFE).
  const fotosHero = [...new Set([heroImg, ...(tienda.galeria || [])].filter(Boolean))];
  const zoomBanner = usePhotoSwipe(fotosHero);
  const zoomLogo = usePhotoSwipe(tienda.foto ? [tienda.foto] : []);
  // Solo uno puede estar abierto a la vez (banner O logo) — el overlay
  // custom (botones propios, ver PhotoSwipeOverlay) se monta con el que
  // esté activo en cada momento.
  const activePswp = zoomBanner.pswp || zoomLogo.pswp;

  // Tracking — NO se trackea al propio dueño viendo su tienda (esDueño):
  // el dato de interés es el visitante real, no el dueño revisando/editando
  // su propia página, que inflaría "vistas" y "tiempo" sin significar nada.
  useEffect(() => {
    if (!esDueño) trackPageview(tienda.id, 'tienda');
  }, [tienda.id, esDueño]);
  useTiempoEnPagina(esDueño ? null : tienda.id);

  // Los FABs del dueño ("+"/estadísticas/editar) suben a medida que el
  // banner CTA del footer entra por abajo del viewport — mismo criterio de
  // espaciado que ya respetan del borde derecho, ahora también del borde
  // superior de ese banner, para no taparlo nunca. rAF-throttle: el handler
  // de scroll puede disparar más rápido que un frame de pintado.
  useEffect(() => {
    if (!esDueño) return undefined;
    let raf = null;
    const medir = () => {
      raf = null;
      const el = ctaBannerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const invade = window.innerHeight - rect.top;
      setFabLift((prev) => {
        const next = Math.max(0, Math.min(invade, rect.height));
        return Math.abs(prev - next) < 0.5 ? prev : next;
      });
    };
    const onScroll = () => { if (raf === null) raf = requestAnimationFrame(medir); };
    medir();
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [esDueño]);

  // El chip de dirección abre el modal de mapa propio de la tienda (solo si
  // hay coordenadas). Ese modal — reusando MapaSection/MapaModal — muestra
  // SOLO el pin de esta tienda; dentro puede ofrecer "ver en el mapa global
  // de LOKAL" (onVerEnMapaGlobal) como opción secundaria en modo plataforma.
  const onAbrirMapa = (tienda.lat && tienda.lng) ? () => setMapaOpen(true) : undefined;

  // Sin prefijo /t/: el router real (Root.jsx, pathToTiendaSlug) espera
  // /:slug de un único segmento — /t/:slug no resuelve a ninguna tienda.
  const shareUrl = tienda.slug ? `${window.location.origin}/${tienda.slug}` : window.location.href;
  const compartir = () => setShareOpen(true);

  // Props de carrito por producto — solo si el catálogo (módulo "productos")
  // está activo. El dueño viendo su propia tienda no necesita agregar al
  // carrito. Antes se lo ocultaba al dueño viendo su propia tienda ("evita
  // que confunda su vista de vendedor con la del cliente"), pero el dueño
  // necesita poder probar el flujo real de carrito en su propia página —
  // decisión revertida a pedido explícito.
  const catalogoConCarrito = s.productos?.activa;
  const carritoPropsDe = (p) => catalogoConCarrito
    ? { qty: carritoQty[p.id] || 0, onAdd: agregarAlCarrito, onRemove: quitarDelCarrito }
    : {};

  // standalone (/t/:slug, sin sesión): este componente es la página entera,
  // necesita su propio scroll acotado a 100dvh — mismo patrón que
  // HomeScreen.jsx, contenedor raíz de altura fija + hijo con
  // overflow-y-auto, terminando antes de TiendaNavBar (shrink-0, afuera).
  //
  // plataforma (logueado dentro de LOKAL): el único scroll real de la app
  // es mainScrollRef en App.jsx (mismo contenedor que usan Home/Tiendas/
  // etc), que además lleva el paddingBottom que compensa el BottomNav
  // global fixed. Si este template crea OTRO scroll interno acá anidado
  // dentro de ese, el contenido de la tienda termina dentro de una caja
  // cuyo borde inferior no coincide con el padding-compensado — el footer
  // queda invisible bajo el BottomNav aunque "en teoría" se pueda scrollear
  // hasta el final de esta caja interna. En plataforma este <div> fluye en
  // el documento normal (sin height/scroll propios), delegando el único
  // scroll real al contenedor de App.jsx.
  const standaloneScroll = modo === 'standalone';
  return (
    <div style={standaloneScroll ? { position: 'relative', height: '100dvh', display: 'flex', flexDirection: 'column', background: bg, color: txt, ...F } : { position: 'relative', background: bg, color: txt, ...F }}>
      <style>{GLOBAL_CSS}</style>
      <PhotoSwipeStyles />
      <PhotoSwipeOverlay pswp={activePswp} />
      {/* Ambient orbs — resplandores difusos del color de marca de la tienda,
          de fondo. Solo en standalone (página entera): en modo plataforma el
          fondo lo controla App.jsx y un fixed acá se saldría del contenedor.
          pointer-events:none + zIndex:0 → puramente decorativos, el contenido
          (zIndex:1) queda por encima. Técnica de PARALLAX.jsx del padre. */}
      {standaloneScroll && (
        <div aria-hidden="true" className="cm-orbs" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          {/* El orb superior-izquierdo se sacó: quedaba detrás de la zona
              transparente del hero (donde el mask-image funde la foto de
              portada a transparente, arriba de la card) — su borde circular
              difuso se asomaba justo ahí, delatando "el final de un div" y
              rompiendo la ilusión de fundido continuo. Se queda solo el
              inferior, lejos del hero. */}
          <div style={{ position: 'absolute', right: '-15%', bottom: '-15%', width: 440, height: 440, borderRadius: '50%', background: 'color-mix(in srgb, var(--tp-primary) 12%, transparent)', filter: 'blur(140px)' }} />
        </div>
      )}
      <div className="cm-scroll" style={standaloneScroll ? { position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', overscrollBehaviorY: 'contain', scrollbarWidth: 'none' } : undefined}>
      {/* flex:1 — si el contenido (hero+secciones) es corto, este bloque se
          estira y empuja el footer al final de la pantalla, en vez de
          dejarlo flotando a mitad de página. */}
      <div style={standaloneScroll ? { flex: 1 } : undefined}>

      {/* ── HERO híbrido — carrusel de fondo (fundido por máscara) + card
          flotante centrada con logo, rating, estado, dirección, descripción
          y chips de acción. El estado abierto/cerrado abre el sheet de
          horarios; la dirección abre el modal de mapa (handlers conectados
          en la fase de interacciones). ── */}
      {s.hero?.activa !== false && (() => {
        // fotosHero ya calculado arriba (nivel de componente, para los hooks
        // de zoom) — reusado tal cual, mismo dedupe.
        const fotos = fotosHero;
        const multiFoto = fotos.length > 1;
        const wa = (tienda.whatsapp || '').replace(/\D/g, '');
        const igUser = tienda.instagram ? tienda.instagram.replace(/^@/, '') : null;
        const web = tienda.web || tienda.sitioWeb || null;

        // Variante EDITORIAL (opt-in por pagina.heroLayero) — composición
        // horizontal que ahorra altura. El hero 'card' de abajo queda intacto.
        if (heroLayout === 'editorial') {
          return (
            <HeroEditorial
              tienda={tienda} fotos={fotos} multiFoto={multiFoto}
              photoIdx={photoIdx} setPhotoIdx={setPhotoIdx}
              wa={wa} igUser={igUser} web={web}
              abierta={abierta} texto={texto}
              onAbrirMapa={onAbrirMapa} setHorariosOpen={setHorariosOpen}
              compartir={compartir} modo={modo}
              tokens={{ primary, primarySoft, surf, surf2, border, txt, txtM }}
            />
          );
        }

        return (
          <header className="cm-hero">
            <div className="cm-hero-photo">
              {fotos.length > 0
                ? fotos.map((src, i) => (
                    // pointerEvents:'none' en las no visibles — mismo bug real
                    // que en HeroEditorial: sin esto, el navegador puede
                    // aterrizar el click en la foto invisible superpuesta.
                    <img key={src} src={src} alt=""
                      onClick={(e) => { if (i === photoIdx) { trackClick(tienda.id, 'zoom', { origen: 'banner' }); zoomBanner.abrir(i, e); } }}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === photoIdx ? 1 : 0, transition: 'opacity .4s ease', cursor: i === photoIdx ? 'zoom-in' : 'default', pointerEvents: i === photoIdx ? 'auto' : 'none' }} />
                  ))
                : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${primary}, var(--tp-surface))` }} />}
              {/* Compartir flotante — solo en modo plataforma. En standalone
                  vive en TiendaNavBar (bottom-nav propio de la tienda), no
                  se duplica el mismo botón en dos lugares. */}
              {modo !== 'standalone' && (
                <button className="cm-hero-share-btn" onClick={compartir} aria-label="Compartir"
                  style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(6px)', transition: 'background-color .15s ease' }}>
                  <Share2 size={17} style={{ marginRight: 2 }} />
                </button>
              )}
              {/* Flechas + dots — solo si hay más de una foto. Navegación
                  LINEAL (sin loop): la flecha izquierda desaparece en la
                  primera foto, la derecha en la última — no cada botón
                  siempre visible como en un carrusel circular. */}
              {multiFoto && (
                <>
                  {photoIdx > 0 && (
                    <button className="cm-hero-arrow" onClick={() => setPhotoIdx(i => i - 1)} aria-label="Foto anterior"
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 32, height: 32, borderRadius: 10, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(6px)', boxShadow: SHADOW.sm }}>
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {photoIdx < fotos.length - 1 && (
                    <button className="cm-hero-arrow" onClick={() => setPhotoIdx(i => i + 1)} aria-label="Foto siguiente"
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 32, height: 32, borderRadius: 10, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(6px)', boxShadow: SHADOW.sm }}>
                      <ChevronRight size={18} />
                    </button>
                  )}
                  <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', gap: 5 }}>
                    {fotos.map((_, i) => (
                      <button key={i} onClick={() => setPhotoIdx(i)} aria-label={`Foto ${i + 1}`}
                        style={{ width: i === photoIdx ? 16 : 5, height: 5, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer', background: i === photoIdx ? '#fff' : 'rgba(255,255,255,.5)', transition: 'width .25s ease, background .25s ease' }} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="cm-hero-card">
              {/* Logo centrado, superpuesto sobre el fundido */}
              {/* Logo: SHADOW.md es negro fijo — se nota en light (fondo claro)
                  pero se pierde en dark (fondo casi negro). Se agrega la
                  clase cm-hero-logo para sumar el resplandor sutil de dark
                  vía CSS (mismo criterio que .cm-hero-card). */}
              {/* Silueta de persona cuando no hay foto propia — antes el
                  símbolo de LOKAL, que se leía como "el logo de la
                  plataforma", no como "esta tienda todavía no cargó su
                  foto de perfil". */}
              <div className="cm-hero-logo" style={{ width: 72, height: 72, marginTop: -36, marginBottom: 10, borderRadius: 18, background: tienda.foto ? primarySoft : primary, border: `4px solid ${surf}`, boxShadow: SHADOW.md, overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                {tienda.foto
                  ? <img src={tienda.foto} alt={tienda.nombre} onClick={(e) => { trackClick(tienda.id, 'zoom', { origen: 'logo' }); zoomLogo.abrir(0, e); }} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
                  : <User size={34} color="#fff" />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>{tienda.nombre}</h1>
                {tienda.rating && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: RADIUS.full, background: surf2, color: txtM, border: `1px solid ${border}`, fontSize: 11.5, fontWeight: 800 }}>
                    <Star size={12} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                    {tienda.rating}{tienda.totalReseñas ? ` (${tienda.totalReseñas})` : ''}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center', fontSize: 12, color: txtM }}>
                {texto && (
                  <button onClick={() => setHorariosOpen?.(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, color: abierta ? '#16a34a' : '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, ...F }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: abierta ? '#16a34a' : '#ef4444' }} />
                    {texto}
                  </button>
                )}
                {(tienda.direccion || tienda.ciudad) && (
                  <button onClick={() => { trackClick(tienda.id, 'mapa'); onAbrirMapa?.(); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: onAbrirMapa ? 'pointer' : 'default', padding: 0, color: txtM, fontSize: 12, ...F }}>
                    <MapPin size={13} />{[tienda.direccion, tienda.ciudad].filter(Boolean).join(', ')}
                  </button>
                )}
              </div>

              {tienda.descripcion && (
                <p style={{ margin: '9px 0 0', fontSize: 12.5, lineHeight: 1.5, color: txtM, maxWidth: 300 }}>{tienda.descripcion}</p>
              )}

              {/* Redes — cuadrados neutros 36x36, hover a color de marca
                  (no chips de color por red). Estilo del viejo LOKAL LINKS,
                  referencia predominante para este bloque. */}
              {(wa || igUser || web) && (
                <div className="cm-hero-social" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {wa && (
                    <a aria-label="WhatsApp" data-tooltip="WhatsApp"
                      href={`https://wa.me/54${wa}?text=${encodeURIComponent(`Hola ${tienda.nombre}, te contacto desde Lokal.`)}`}
                      target="_blank" rel="noopener noreferrer" onClick={() => trackClick(tienda.id, 'whatsapp')}
                      style={{ width: 36, height: 36, borderRadius: 11, background: surf2, border: `1px solid ${border}`, color: txtM, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color .2s, border-color .2s' }}>
                      <IconWhatsApp style={{ width: 17, height: 17 }} />
                    </a>
                  )}
                  {igUser && (
                    <a aria-label="Instagram" data-tooltip="Instagram"
                      href={`https://instagram.com/${igUser}`} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(tienda.id, 'instagram')}
                      style={{ width: 36, height: 36, borderRadius: 11, background: surf2, border: `1px solid ${border}`, color: txtM, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color .2s, border-color .2s' }}>
                      <IconInstagram style={{ width: 17, height: 17 }} />
                    </a>
                  )}
                  {web && (
                    <a aria-label="Sitio web" data-tooltip="Sitio web"
                      href={/^https?:\/\//.test(web) ? web : `https://${web}`} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(tienda.id, 'website')}
                      style={{ width: 36, height: 36, borderRadius: 11, background: surf2, border: `1px solid ${border}`, color: txtM, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color .2s, border-color .2s' }}>
                      <Globe size={17} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </header>
        );
      })()}

      {/* ── Ofertas — card-preview + modal fullscreen (Fase 6 del plan,
          mismo patrón que Catálogo/Mapa). Todo el contenido de búsqueda/
          filtro/orden/grilla vive en OfertasModal, montado fuera de este
          scroll (portal a document.body). Va PRIMERO (justo después del
          hero) — son los destacados/flyers de la tienda, la vidriera; el
          catálogo completo es la góndola, va después. ── */}
      {s.ofertas?.activa && (
        <OfertasSection
          ofertasBase={ofertasBase} ofertasPendientes={ofertasPendientes} onAbrirModal={() => setOfertasModalOpen(true)}
          tienda={tienda} esDueño={esDueño}
          onVerOferta={onVerOferta}
          onOpenAdminTarget={setOfertaAdminTarget}
          onOpenShareOferta={(o) => { setOfertaCompartir(o); setShareOfertaOpen(true); }}
        />
      )}

      {/* ── Catálogo — card-preview + modal fullscreen (Fase 6 del plan,
          mismo patrón que Mapa: MapaSection/MapaModal). Todo el contenido
          de búsqueda/filtro/orden/grilla vive en CatalogoModal, montado
          fuera de este scroll (portal a document.body). ── */}
      {s.productos?.activa && (
        <CatalogoSection
          productos={productos} onAbrirModal={() => setCatalogoModalOpen(true)}
          carritoPropsDe={carritoPropsDe} onOpenDetalle={setDetalle} onOpenAdminMenu={esDueño ? setOfertaAdminTarget : undefined}
        />
      )}
      {ofertaCompartir && (
        <ShareSheet
          open={shareOfertaOpen}
          onClose={() => setShareOfertaOpen(false)}
          url={`${typeof window !== 'undefined' ? window.location.origin : ''}/${tienda.slug}/o/${ofertaCompartir.slug || ofertaCompartir.id}`}
          titulo={`${ofertaCompartir.nombre} — ${tienda.nombre}`}
          onCompartido={(medio) => trackCompartir(tienda.id, medio, { productoId: ofertaCompartir.id })}
        />
      )}

      {/* ── Mapa ── */}
      {s.mapa?.activa && (
        <section style={{ paddingBottom: 20 }}>
          <MapaSection tienda={tienda} isDark={isDark} onVerEnMapaGlobal={onVerEnMapaGlobal}
            modalAbierto={mapaOpen} onAbrirMapa={() => setMapaOpen(true)} onCerrarMapa={() => setMapaOpen(false)} />
        </section>
      )}

      {/* ── Tiendas similares — solo en modo plataforma ── */}
      {modo === 'plataforma' && tiendasSimilares?.length > 0 && (
        <section style={{ padding: '4px 16px 20px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: txt, ...F }}>Tiendas similares</h2>
          <Carrusel>
            {tiendasSimilares.map(t => (
              <button key={t.id} onClick={() => onIrATienda?.(t)}
                className="no-press cm-tienda-similar"
                style={{ flexShrink: 0, width: 148, textAlign: 'left', background: surf, border: `1px solid ${border}`, borderRadius: RADIUS.lg, overflow: 'hidden', cursor: 'pointer', boxShadow: SHADOW.sm, ...F }}>
                <div style={{ width: '100%', aspectRatio: '1 / 1', background: surf2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {t.logo
                    ? <img src={t.logo} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Store size={26} style={{ color: txtM, opacity: 0.5 }} />}
                </div>
                <div style={{ padding: 10 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: txt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre}</p>
                  {t.rubro && <p style={{ margin: '2px 0 0', fontSize: 11, color: txtM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.rubro}</p>}
                </div>
              </button>
            ))}
          </Carrusel>
        </section>
      )}

      </div>{/* fin flex:1 del contenido (hero+secciones) */}

      {/* Footer de marca — fuera del flex:1, así queda pegado al final real
          de la pantalla cuando el contenido es corto (hueco vacío arriba lo
          empuja), en vez de flotar a mitad de página. */}
      {footer && <TiendaFooter dark={footer.dark} toggleDark={footer.toggleDark} tiendaId={tienda.id} ctaBannerRef={esDueño ? ctaBannerRef : undefined} />}
      </div>{/* fin scroll interno */}

      {/* ── Catálogo — modal fullscreen (zIndex 4700), montado a nivel raíz
          como el resto de sheets. onOpenDetalle/onOpenAdminMenu delegan al
          mismo detalle/ofertaAdminTarget que ya usa el resto de la página
          — un solo ProductDetailModal/OfertaAdminSheet, no uno por modal. ── */}
      {catalogoModalOpen && (
        <CatalogoModal
          tienda={tienda} esDueño={esDueño} productos={productos}
          onClose={() => setCatalogoModalOpen(false)}
          carritoPropsDe={carritoPropsDe}
          onOpenDetalle={setDetalle}
          onOpenAdminMenu={esDueño ? setOfertaAdminTarget : null}
          onVerTodosFiltrado={onVerTodosFiltrado}
        />
      )}

      {/* ── Detalle — vista tipo flyer (imagen + compartir, sin carrito).
          zIndex 4750 (ver ProductDetailModal.jsx) — queda por encima de
          CatalogoModal cuando se abre desde adentro. ── */}
      {detalle && (
        <ProductDetailModal producto={detalle} onClose={() => setDetalle(null)} onCompartir={compartir}
          productos={productos} onOpenProducto={setDetalle}
          {...(detalle ? carritoPropsDe(detalle) : {})} />
      )}

      {/* Modal de mapa compartido — el chip de dirección del hero lo abre
          aunque la sección "Mapa" (arriba) esté desactivada/no montada;
          cuando SÍ está montada, comparten el mismo estado (mapaOpen) sin
          duplicar el fetch. Montado ACÁ (fuera del .cm-scroll) — como los
          sheets — para que su position:fixed no quede atrapado en el
          stacking context del contenedor de scroll y tape el TiendaNavBar
          (patrón inmersivo nativo: el mapa full-screen oculta el nav). */}
      {mapaOpen && !s.mapa?.activa && (tienda.lat && tienda.lng) && (
        <MapaModal tienda={tienda} isDark={isDark} onClose={() => setMapaOpen(false)} />
      )}

      {/* ── Horarios (abierto desde el badge del hero) ── */}
      <HorariosSheet open={horariosOpen} onClose={() => setHorariosOpen(false)} horarios={tienda.horarios} abierta={abierta} texto={texto} />

      {/* ── Filtro / Ordenar de Catálogo y Ofertas: ahora dentro de
          CatalogoModal/OfertasModal (Fase 6 del plan) — ya no se montan
          acá a nivel raíz. ── */}

      {/* ── Ofertas — modal fullscreen (zIndex 4700). onOpenAdminTarget/
          onOpenShareOferta delegan al mismo ofertaAdminTarget/
          shareOfertaOpen que ya usa el resto de la página. ── */}
      {ofertasModalOpen && (
        <OfertasModal
          tienda={tienda} esDueño={esDueño}
          ofertasBase={ofertasBase} ofertasPendientes={ofertasPendientes}
          onClose={() => setOfertasModalOpen(false)}
          onVerOferta={onVerOferta}
          onOfertaReintentar={onOfertaReintentar}
          onOfertaCancelarPendiente={onOfertaCancelarPendiente}
          onOpenAdminTarget={setOfertaAdminTarget}
          onOpenShareOferta={(o) => { setOfertaCompartir(o); setShareOfertaOpen(true); }}
        />
      )}

      {/* ── Compartir — sheet con opciones (hero + TiendaNavBar) ── */}
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} titulo={tienda.nombre}
        onCompartido={(medio) => trackCompartir(tienda.id, medio)} />

      {/* ── Carrito — arma el pedido y dispara el POST. Al confirmarse,
          navega al link del pedido recién creado (/:slug/c/:carritoSlug,
          CarritoIndividual) en vez de duplicar una pantalla de "listo" acá:
          esa vista ya muestra items+total+estado, es la misma que ve
          después cualquiera que abra el link compartido. */}
      {catalogoConCarrito && (
        <CarritoSheet
          open={carritoOpen} onClose={() => setCarritoOpen(false)}
          tienda={tienda} productos={productos} carritoQty={carritoQty}
          onAdd={agregarAlCarrito} onRemove={quitarDelCarrito}
          onEnviado={(carrito) => { window.location.href = `${window.location.origin}/${tienda.slug}/c/${carrito.slug}`; }}
        />
      )}

      {/* ── Bottom-nav propio de la tienda — SOLO modo standalone. En modo
          plataforma ya existe el bottom-nav global de LOKAL, provisto por
          fuera del template (App.jsx), sin cambios acá. ── */}
      {modo === 'standalone' && (
        <div className="cm-nav-mobile">
          <style>{`
            /* display:contents — el wrapper no crea caja propia, así el nav
               sigue siendo hijo directo del flex-column raíz (lo necesita
               para quedar fijo abajo con flexShrink:0). En horizontal se
               oculta entero: sus acciones ya están en el hero. */
            .cm-nav-mobile { display: contents; }
            @media ${DESKTOP_QUERY} {
              .cm-nav-mobile { display: none; }
            }
          `}</style>
          <TiendaNavBar
            onAbrirMapa={onAbrirMapa}
            onAbrirHorarios={() => setHorariosOpen(true)}
            onCompartir={compartir}
            onAbrirCarrito={catalogoConCarrito ? () => setCarritoOpen(true) : null}
            carritoCount={carritoCount}
          />
        </div>
      )}

      {/* ── FAB "+" carga rápida de oferta — SOLO visible para el dueño
          logueado viendo su propia tienda (esDueño). Abre OfertaQuickForm
          directo acá, sin ir al panel admin. zIndex mayor al nav (250) para
          quedar sobre él; bottom más alto en standalone (hay bottom-nav
          propio debajo) que en plataforma (bottom-nav global de LOKAL,
          mismo criterio de elevación). */}
      {esDueño && (
        <>
          {/* Altura real del TiendaNavBar (solo standalone: en plataforma no
              hay nav propio acá, es el bottom-nav global de App.jsx) —
              padding 8+12 + ícono central 56px elevado (marginTop -14) +
              label ~14px + safe-area. Antes eran números mágicos (84/148px)
              sin relación con el nav real; ahora el primer FAB arranca justo
              del borde superior del nav + el MISMO padding (16px) que ya
              usan del borde derecho — simetría real, no un valor a ojo. */}
          <style>{`
            :root { --cm-navbar-h: ${modo === 'standalone' ? '92px' : '0px'}; }
            /* En horizontal el nav no se monta (sus acciones subieron al
               hero), así que los FABs no tienen que dejarle lugar: sin esto
               quedaban flotando 92px por encima del borde, sobre nada. */
            @media ${DESKTOP_QUERY} {
              :root { --cm-navbar-h: 0px; }
            }
            .cm-fab-add, .cm-fab-stats, .cm-fab-edit { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
            @media (hover: hover) { .cm-fab-add:hover, .cm-fab-stats:hover, .cm-fab-edit:hover { filter: brightness(1.08); } }
            .cm-fab-add:active, .cm-fab-stats:active, .cm-fab-edit:active { transform: scale(0.93); transition: transform .06s ease; }
          `}</style>
          {/* Los 3 FABs suben juntos (fabLift, en px) a medida que el banner
              CTA del footer asoma por abajo — nunca lo tapan, sin necesidad
              de que el dueño deje de verlo para llegar al final de su propia
              tienda. transition suave: fabLift se recalcula por frame de
              scroll (rAF), pero el salto entre valores igual se nota sin un
              easing corto acompañando. */}
          {/* Chip de stats — MISMA forma/tamaño que el "+" (56px, radius 18,
              misma sombra), solo cambia el color: neutro (surface) porque es
              la acción secundaria, el "+" en color de marca sigue siendo la
              primaria. Antes eran de tamaño/radio distintos, se veían como
              dos lenguajes de botón separados en vez de un mismo par. */}
          <button onClick={() => setStatsOpen(true)} aria-label="Estadísticas de tu tienda" data-tooltip="Estadísticas" className="no-press cm-fab-stats"
            style={{
              position: 'fixed', right: 16,
              bottom: `calc(var(--cm-navbar-h) + 16px + env(safe-area-inset-bottom) + ${fabLift}px)`,
              transition: 'bottom .1s linear',
              zIndex: 260, width: 56, height: 56, borderRadius: 18, border: `1px solid var(--tp-border)`, cursor: 'pointer',
              background: 'var(--tp-surface)', color: 'var(--tp-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: SHADOW.md,
            }}>
            <BarChart3 size={22} />
          </button>
          <button onClick={() => setOfertaQuickOpen(true)} aria-label="Nueva oferta" data-tooltip="Nueva oferta" className="no-press cm-fab-add"
            style={{
              position: 'fixed', right: 16,
              bottom: `calc(var(--cm-navbar-h) + 16px + 72px + env(safe-area-inset-bottom) + ${fabLift}px)`,
              transition: 'bottom .1s linear',
              zIndex: 260, width: 56, height: 56, borderRadius: 18, border: 'none', cursor: 'pointer',
              background: 'var(--tp-primary)', color: 'var(--tp-on-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px color-mix(in srgb, var(--tp-primary) 45%, transparent)',
            }}>
            <Plus size={26} />
          </button>
          {onIrAlPanel && (
            <button onClick={onIrAlPanel} aria-label="Editar mi tienda" data-tooltip="Editar mi tienda" className="no-press cm-fab-edit"
              style={{
                position: 'fixed', right: 16,
                bottom: `calc(var(--cm-navbar-h) + 16px + 144px + env(safe-area-inset-bottom) + ${fabLift}px)`,
                transition: 'bottom .1s linear',
                zIndex: 260, width: 56, height: 56, borderRadius: 18, border: `1px solid var(--tp-border)`, cursor: 'pointer',
                background: 'var(--tp-surface)', color: 'var(--tp-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: SHADOW.md,
              }}>
              <Pencil size={20} />
            </button>
          )}
          <OfertaQuickForm
            open={ofertaQuickOpen}
            onClose={() => setOfertaQuickOpen(false)}
            tienda={tienda}
            onCreated={onOfertaCreada}
          />
          <TiendaStatsSheet open={statsOpen} onClose={() => setStatsOpen(false)} tienda={tienda} />
          <OfertaAdminSheet
            open={!!ofertaAdminTarget}
            onClose={() => setOfertaAdminTarget(null)}
            oferta={ofertaAdminTarget}
            // El sheet ya NO se cierra solo tras "Ocultar" (queda abierto
            // para poder revertir ahí mismo) — sin refrescar también acá,
            // el botón seguiría mostrando el label viejo ("Ocultar" en vez
            // de "Mostrar") aunque el catálogo de fondo ya haya cambiado.
            onUpdated={(actualizada) => { setOfertaAdminTarget(actualizada); onOfertaActualizada(actualizada); }}
            onDeleted={onOfertaEliminada}
          />
        </>
      )}
    </div>
  );
}

/* ── HERO variante EDITORIAL — composición horizontal asimétrica (tendencia
   2026: editorial, type-first, negative space intencional). Foto como banner
   de acento (más fina que en 'card': acá NO es la protagonista, la info sí),
   logo grande superpuesto a la IZQUIERDA sobre el borde de la foto, y la
   info en COLUMNA a su derecha — nombre con jerarquía tipográfica fuerte,
   estado+dirección en fila, redes debajo. Ahorra altura vs. el apilado
   centrado. Cambios de tamaño justificados por la composición (foto acento
   más baja; nombre más grande porque pasa a ser el foco visual). ── */
// Gradientes reales por red — mismos valores que ShareSheet.jsx (GRADIENTS),
// para que el color de cada red sea consistente en toda la vista pública.
const ED_SOCIAL_GRADIENTS = {
  wa: 'linear-gradient(135deg,#25D366,#128C7E)',
  ig: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
};

function HeroEditorial({ tienda, fotos, multiFoto, photoIdx, setPhotoIdx, wa, igUser, web, abierta, texto, onAbrirMapa, setHorariosOpen, compartir, modo, tokens }) {
  const { primary, primarySoft, surf, surf2, border, txt, txtM } = tokens;
  const zoomBanner = usePhotoSwipe(fotos);
  const zoomLogo = usePhotoSwipe(tienda.foto ? [tienda.foto] : []);
  const activePswp = zoomBanner.pswp || zoomLogo.pswp;
  const socialStyle = (gradient) => ({ width: 36, height: 36, borderRadius: 11, background: gradient || surf2, border: gradient ? 'none' : `1px solid ${border}`, color: gradient ? '#fff' : txtM, display: 'flex', alignItems: 'center', justifyContent: 'center' });
  return (
    <header className="cm-hero-ed">
      <PhotoSwipeOverlay pswp={activePswp} />
      <style>{`
        .cm-hero-ed { position: relative; }
        /* Desktop: no expandir a los bordes exactos de la ventana — todo el
           hero (foto + fila logo/info + descripción) queda contenido en una
           franja centrada, con aire a los costados. En mobile no aplica
           (max-width 100% = comportamiento actual, borde a borde). */
        .cm-hero-ed-inner { max-width: 100%; margin: 0 auto; }
        @media (min-width: 860px) {
          .cm-hero-ed-inner { max-width: 720px; }
        }
        /* Foto banner de acento: más baja (150) que el hero 'card' (240) —
           acá la foto no es protagonista, es un remate visual; la info manda.
           Fundido inferior hacia el fondo para que la card de info se
           integre sin escalón. */
        .cm-hero-ed-photo { position: relative; height: 150px; overflow: hidden; background: var(--tp-bg); }
        .cm-hero-ed-photo img { width: 100%; height: 100%; object-fit: cover; display: block;
          -webkit-mask-image: linear-gradient(to top, transparent 0%, rgba(0,0,0,.2) 40px, #000 110px);
                  mask-image: linear-gradient(to top, transparent 0%, rgba(0,0,0,.2) 40px, #000 110px); }
        .cm-hero-ed-photo::before { content:''; position:absolute; inset:0 0 auto 0; height:64px; z-index:1;
          background: linear-gradient(to bottom, rgba(0,0,0,.3), transparent); pointer-events:none; }
        /* Fila principal: logo (izq) + info (der). marginTop negativo para
           que el logo pise el borde inferior de la foto (superposición
           editorial), como en el hero 'card' pero alineado a la izquierda. */
        .cm-hero-ed-row { position: relative; z-index: 2; display: flex; align-items: flex-end; gap: 14px; padding: 0 18px; margin-top: -40px; }
        .cm-hero-ed-logo { width: 84px; height: 84px; border-radius: 20px; flex-shrink: 0; overflow: hidden;
          border: 4px solid var(--tp-surface); box-shadow: ${SHADOW.md}; display: grid; place-items: center; }
        .dark .cm-hero-ed-logo { box-shadow: 0 4px 14px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08); }
        .cm-hero-ed-info { flex: 1; min-width: 0; padding-bottom: 4px; }
        /* Nombre más grande (22 vs 19 del 'card'): pasa a ser el foco visual
           de la composición, alineado a la izquierda (type-first 2026). */
        .cm-hero-ed-name { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: var(--tp-text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        /* WA/IG ya tienen gradiente propio de marca (fondo con color) — el
           hover es brillo, no teñido de --tp-primary. "Sitio web" sigue
           neutro (surf2) y sí se tiñe de marca en hover, como el resto de
           chips neutros de la app. */
        .cm-hero-ed-social a { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease, color .2s ease, border-color .2s ease; }
        @media (hover: hover) {
          .cm-hero-ed-social a[data-tooltip="Sitio web"]:hover { color: var(--tp-primary) !important; border-color: var(--tp-primary) !important; }
          .cm-hero-ed-social a:not([data-tooltip="Sitio web"]):hover { filter: brightness(1.08); }
        }
        .cm-hero-ed-social a:active { transform: scale(0.9); transition: transform .06s ease; }
        .cm-hero-ed-meta button { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1); }
        .cm-hero-ed-meta button:active { transform: scale(0.94); transition: transform .06s ease; }

        /* ── Acciones de la tienda en el hero, SOLO pantallas horizontales ──
           En mobile viven en la barra inferior (TiendaNavBar), al alcance
           del pulgar. En una pantalla apaisada esa barra fija abajo roba
           alto justo donde escasea y queda lejos del cursor, así que las
           mismas acciones suben acá — mismo criterio que ya usa la vista de
           oferta individual, para que pasar de una pantalla a la otra no
           mueva los controles de lugar. */
        .cm-acciones-tienda { display: none; }
        @media ${DESKTOP_QUERY} {
          /* Ancladas a la ESQUINA de la ventana, no al final de la franja
             centrada del hero: .cm-hero-ed-inner tiene max-width 720px, así
             que dentro de esa caja los botones terminaban a mitad de camino
             del borde derecho (x=1062 en una ventana de 1440), leyéndose
             como parte del bloque de identidad en vez de como los controles
             de la pantalla. Posicionadas contra .cm-hero-ed (ancho
             completo) quedan alineadas con el borde, igual que en la vista
             de oferta. */
          /* El ancla es .cm-hero-ed (el header entero, ancho completo).
             La foto de portada mide 150px y la fila logo+info sube 40px
             sobre ella (margin-top:-40), así que su centro cae a ~152px:
             ahí se alinean los botones con el logo y el nombre.
             A la DERECHA, igual que en la vista de oferta individual: son
             controles de la pantalla, y saltar de lado entre una pantalla y
             la otra no tendría lógica para quien navega. */
          /* Dentro del flujo de la barra (no absolute): así la barra crece
             o se achica con su contenido y las acciones acompañan, en vez
             de estar clavadas a una coordenada calculada a mano. Las reglas
             de posicionamiento fino de .cm-hero-ed-info/.cm-hero-ed-social
             quedaron consolidadas más abajo, en el bloque de la barra chip
             (buscar "TRES grupos separados") — acá solo el ancla a la
             esquina. */
          .cm-acciones-tienda {
            display: flex; align-items: center; gap: 8px;
            margin-left: auto; flex-shrink: 0;
          }
          .cm-hero-ed-info { flex: 0 1 auto; min-width: 0; }
          /* La franja del hero deja de estar acotada a 720px CENTRADOS: eso
             empujaba la identidad a 378px del borde en una ventana de 1440
             (y a 498 en 1680), o sea nada de "pegada a la izquierda". Ahora
             ocupa el ancho real y el logo arranca en el margen de la
             pantalla, como en la vista de oferta. */
          .cm-hero-ed-inner { max-width: none; }

          /* ══════════════════════════════════════════════════════════════
             ESCRITORIO — barra fija + portada como bloque

             El banner de 150px hacía de fondo del header: cortaba el logo
             por la mitad (que subía -40px para pisarlo) y dejaba a la
             identidad sin comportarse como una barra de navegación real.
             Acá se separan las dos funciones, que es como lo resuelven las
             páginas modernas:

               1. BARRA fija arriba — identidad + acciones, siempre visible
                  al scrollear, con fondo translúcido y blur (glass aplicado
                  solo donde hay superposición real, no decorativo).
               2. PORTADA como bloque de contenido propio — card ancha y
                  baja con esquinas redondeadas, no fondo de nada.

             Sirve igual a una despensa (que quiere mostrar productos ya) o
             a un restaurante (que quiere mostrar ambiente): si la tienda no
             subió fotos, el bloque de portada simplemente no se monta y el
             catálogo sube. ══════════════════════════════════════════════ */

          /* El header pasa a flex-column para poder REORDENAR sin tocar el
             JSX: en mobile la foto va primero (es el fondo del que cuelga
             el logo), en escritorio la barra sube arriba y la foto baja
             como bloque de contenido. Mismo marcado, dos composiciones. */
          .cm-hero-ed { display: flex; flex-direction: column; }
          /* align-self:stretch — al volver flex al header, sus hijos dejan
             de ocupar el ancho completo y se encogen al contenido: el inner
             medía 827px de 1440 y la barra arrancaba a 306px del borde, sin
             llegar nunca a las esquinas. */
          .cm-hero-ed > * { align-self: stretch; }
          .cm-hero-ed-inner { order: 1; width: 100%; }
          .cm-hero-ed-photo { order: 2; }
          .cm-hero-ed-desc  { order: 3; }
          /* La descripción deja de estar centrada al medio de la pantalla:
             con todo lo demás alineado a la izquierda, ese centrado se leía
             como un elemento suelto de otra composición. Va sobre una
             franja propia, apenas teñida, que cierra el bloque de la
             tienda antes de que empiece el catálogo. */
          /* Sin franja ni borde propios: con el chip flotando arriba, la
             descripción es texto suelto sobre el fondo de la página, que
             es lo que corresponde. Alineada con el margen del chip. */
          .cm-hero-ed-desc { text-align: left !important; padding: 4px 34px 14px !important; }
          .cm-hero-ed-desc p { margin: 0 !important; max-width: 68ch !important; font-size: 13.5px !important; }

          /* La portada NO se muestra en escritorio, por ahora. Estirada a
             todo el ancho perdía el encuadre que el dueño compuso pensando
             en vertical, y el mosaico de dos fotos tampoco terminó de
             funcionar. Es un problema de diseño abierto: mostrar fotos
             pensadas para 9:16 en una pantalla apaisada. Mientras tanto la
             pantalla arranca por lo que importa — la barra de la tienda y
             el catálogo — en vez de por una franja recortada.
             En mobile sigue intacta: ahí la proporción es la correcta. */
          .cm-hero-ed-photo { display: none; }

          /* La fila de identidad se despega de la foto: ya no sube a
             pisarla (margin-top negativo) ni se apoya abajo. Es la barra. */
          /* ── La barra como CHIP FLOTANTE ──
             No una franja pegada al borde superior, sino una píldora
             despegada de los bordes que flota sobre el contenido. El
             contenido pasa POR DEBAJO al scrollear y se ve a través del
             blur — que es donde el glass tiene sentido real (hay algo
             detrás que difuminar), no como decoración.
             El inner es quien queda sticky (ver más abajo) y este chip
             vive adentro con su propio margen. */
          .cm-hero-ed-row {
            margin: 14px 20px;
            padding: 10px 14px 10px 12px;
            align-items: center;
            gap: 12px;
            border-radius: 22px;
            /* Turquesa de la tienda mezclado en la superficie: translúcido
               para que el glass funcione, con un degradado que le da
               volumen en vez de un plano muerto. */
            background:
              linear-gradient(140deg,
                color-mix(in srgb, var(--tp-primary) 12%, color-mix(in srgb, var(--tp-surface) 80%, transparent)),
                color-mix(in srgb, var(--tp-primary) 4%, color-mix(in srgb, var(--tp-surface) 86%, transparent)));
            backdrop-filter: blur(24px) saturate(160%);
            -webkit-backdrop-filter: blur(24px) saturate(160%);
            /* Borde claro arriba + sombra difusa abajo: el par que hace que
               un elemento se lea como "flotando" y no como pegado. */
            border: 1px solid color-mix(in srgb, var(--tp-primary) 18%, transparent);
            box-shadow:
              0 8px 28px color-mix(in srgb, var(--tp-primary) 14%, transparent),
              0 2px 8px rgba(0,0,0,.04),
              inset 0 1px 0 rgba(255,255,255,.5);
            z-index: 20;
          }
          .dark .cm-hero-ed-row {
            box-shadow:
              0 8px 28px rgba(0,0,0,.34),
              inset 0 1px 0 rgba(255,255,255,.07);
          }
          /* El sticky va en el INNER (hijo directo del contenedor con
             scroll), no en la fila: sticky se ancla al ancestro scrollable
             más cercano, y anidado un nivel más abajo no se despega nunca.
             Sin fondo propio: el chip de adentro es lo único visible, y el
             contenido tiene que pasar por debajo para que el blur muestre
             algo. pointer-events se apaga acá y se enciende en el chip, si
             no esta caja transparente robaría los clics del catálogo. */
          .cm-hero-ed-inner {
            position: sticky; top: 0; z-index: 20;
            background: none; pointer-events: none;
          }
          .cm-hero-ed-row { pointer-events: auto; }
          /* Logo proporcionado a una barra, no a un avatar de perfil: el
             borde blanco de 4px existía para despegarlo de la foto que
             tenía detrás, y sin esa foto sobra. */
          .cm-hero-ed-logo {
            width: 42px; height: 42px; border-radius: 12px;
            border: 1px solid color-mix(in srgb, var(--tp-primary) 16%, transparent);
            box-shadow: 0 1px 6px color-mix(in srgb, var(--tp-primary) 12%, transparent);
          }
          /* Altura real ~62px (logo 42px + padding vertical 10×2) — antes
             14px de padding vertical la subía a ~70px, más alta de lo que
             el contenido pedía. border-radius:999px (no un px fijo): un
             valor fijo como 24px queda MUY por debajo de la mitad de la
             altura real, así los extremos no cierran en semicírculo sino
             en una esquina apenas curva — 999px siempre resuelve al
             semicírculo exacto sin tener que recalcular a mano cada vez
             que cambia el padding o el tamaño del logo. */
          /* width:fit-content (no estirada a los 1388px del ancla): con
             identidad+meta+redes+acciones sumando bastante menos que eso,
             una barra a ancho completo dejaba un tramo vacío entre las
             redes y "Mapa/Horarios/Compartir" sin ningún contenido que lo
             justifique — se leía como que faltaba algo ahí, no como
             espacio de respiro. Como chip real (no franja), se encoge a lo
             que su contenido pide y queda pegada a la izquierda. */
          .cm-hero-ed-row { width: fit-content; max-width: calc(100% - 52px); margin: 20px 26px; padding: 10px 18px; gap: 18px; border-radius: 999px; }
          .cm-hero-ed-info { padding-bottom: 0; }
          /* Nombre con más peso y tracking cerrado: en una barra de una
             línea la tipografía es lo único que carga la jerarquía. */
          .cm-hero-ed-name { font-size: 18px; letter-spacing: -0.03em; }
          /* En el JSX, identidad y redes viven en la MISMA fila (fila1,
             hermanos con space-between) porque en mobile van juntas arriba,
             pegadas al avatar — meta es la fila2, debajo. En escritorio se
             quiere identidad — meta — redes como TRES grupos separados en
             una sola línea, así que .cm-hero-ed-fila1 pasa a display:
             contents: deja de pintar su propia caja y sus dos hijos
             (identidad, social) se vuelven hijos flex DIRECTOS de
             .cm-hero-ed-info, hermanos reales de meta — recién ahí order
             puede intercalar meta entre ellos sin tocar el JSX ni duplicar
             el markup por breakpoint. */
          .cm-hero-ed-info { display: flex; align-items: center; gap: 22px; }
          /* !important: fila1 lleva su display:flex inline en el JSX
             (necesario en mobile, donde SÍ debe ser una caja flex real con
             space-between) — sin !important esa regla inline gana por
             especificidad y "contents" nunca se aplica acá, dejando a
             identidad/social atrapados en su propio flex en vez de volverse
             hermanos directos de meta. */
          .cm-hero-ed-fila1 { display: contents !important; }
          .cm-hero-ed-identidad { order: 1; flex: 0 0 auto; }
          .cm-hero-ed-meta {
            order: 2;
            margin-top: 0 !important; margin-left: 0; padding-left: 22px;
            flex-shrink: 0;
            border-left: 1px solid var(--tp-border);
          }
          /* Separador sutil entre meta y redes, empujada al extremo derecho
             de la barra (mismo ancla que .cm-acciones-tienda, que vive
             fuera de .cm-hero-ed-info). */
          .cm-hero-ed-social {
            order: 3;
            margin-left: auto;
            padding-left: 22px;
            border-left: 1px solid var(--tp-border);
          }
          /* Íconos sociales SIN fondo de color propio: en la barra chica
             competían como un cuarto lenguaje visual (círculos de marca vs.
             píldoras con borde vs. texto con puntito). Monocromos como
             "Sitio web" ya era — el color de marca se reserva para el
             hover, no para el reposo. */
          .cm-hero-ed-social a {
            width: 34px !important; height: 34px !important; border-radius: 11px !important;
            background: transparent !important;
            border: 1px solid var(--tp-border) !important;
            color: var(--tp-text-muted) !important;
          }
          .cm-hero-ed-social a svg { width: 15px !important; height: 15px !important; }
          @media (hover: hover) {
            .cm-hero-ed-social a[data-tooltip="WhatsApp"]:hover { color: #25D366 !important; border-color: #25D366 !important; }
            .cm-hero-ed-social a[data-tooltip="Instagram"]:hover { color: #E1306C !important; border-color: #E1306C !important; }
          }
        }
        .cm-accion {
          display: inline-flex; align-items: center; gap: 7px;
          height: 34px; padding: 0 13px; border-radius: 11px;
          /* Chip teñido de marca, no blanco sobre blanco: sobre la barra
             (que ya lleva su pizca de color) un fondo neutro desaparecía.
             Mismo criterio que los chips de la landing. */
          border: 1px solid color-mix(in srgb, var(--tp-primary) 16%, transparent);
          background: color-mix(in srgb, var(--tp-primary) 6%, transparent);
          color: var(--tp-text); cursor: pointer;
          font-size: 13px; font-weight: 700; font-family: inherit;
          transition: background-color .15s ease, color .15s ease, border-color .15s ease, transform .12s cubic-bezier(0.34,1.56,0.64,1);
        }
        @media (hover: hover) {
          .cm-accion:hover { background: color-mix(in srgb, var(--tp-primary) 10%, transparent); color: var(--tp-primary); border-color: var(--tp-primary); }
        }
        .cm-accion:active { transform: scale(0.94); }
      `}</style>

      {/* Foto banner de acento — a todo el ancho de la ventana, fuera del
          contenedor centrado (a diferencia de la fila de info/descripción,
          que sí se acota en desktop). */}
      {/* data-rol marca, para el CSS del mosaico en escritorio, cuál es la
          foto grande y cuál la que asoma al lado. En mobile ese atributo no
          se usa: siguen todas apiladas con crossfade, como siempre. */}
      <div className={`cm-hero-ed-photo${multiFoto ? ' cm-mosaico' : ''}`}>
        {fotos.length > 0
          ? fotos.map((src, i) => {
              const siguiente = (photoIdx + 1) % fotos.length;
              const rol = i === photoIdx ? 'principal' : (i === siguiente ? 'secundaria' : 'oculta');
              // pointerEvents:'none' en las fotos NO visibles — todas ocupan
              // el mismo inset:0 (crossfade), así que sin esto el navegador
              // puede aterrizar el click en la imagen invisible de arriba en
              // el DOM (aunque opacity:0), no en la visible debajo. Bug real
              // encontrado probando con Playwright: elementFromPoint devolvía
              // la foto oculta, el guard i===photoIdx bloqueaba todo en
              // silencio y el zoom nunca abría.
              return (
                <img key={src} src={src} alt="" data-rol={rol}
                  onClick={(e) => {
                    // En el mosaico, tocar la foto de al lado la trae al
                    // frente en vez de abrir el zoom: es el gesto que el
                    // usuario espera de una miniatura que asoma.
                    if (rol === 'secundaria') { setPhotoIdx(siguiente); return; }
                    if (i === photoIdx) { trackClick(tienda.id, 'zoom', { origen: 'banner' }); zoomBanner.abrir(i, e); }
                  }}
                  style={{ position: 'absolute', inset: 0, opacity: i === photoIdx ? 1 : 0, transition: 'opacity .4s ease', cursor: i === photoIdx ? 'zoom-in' : 'default', pointerEvents: i === photoIdx ? 'auto' : 'none' }} />
              );
            })
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${primary}, var(--tp-surface))` }} />}
        {modo !== 'standalone' && (
          <button className="cm-hero-share-btn" onClick={compartir} aria-label="Compartir"
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(6px)' }}>
            <Share2 size={17} style={{ marginRight: 2 }} />
          </button>
        )}
        {multiFoto && (
          <>
            {/* Flechas — mismo criterio del hero 'card': navegación LINEAL
                sin loop (la izquierda desaparece en la primera foto, la
                derecha en la última), clase .cm-hero-arrow ya estilada en
                GLOBAL_CSS (color/hover/press), reutilizada tal cual. */}
            {photoIdx > 0 && (
              <button className="cm-hero-arrow" onClick={() => setPhotoIdx(i => i - 1)} aria-label="Foto anterior"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 32, height: 32, borderRadius: 10, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(6px)', boxShadow: SHADOW.sm }}>
                <ChevronLeft size={18} />
              </button>
            )}
            {photoIdx < fotos.length - 1 && (
              <button className="cm-hero-arrow" onClick={() => setPhotoIdx(i => i + 1)} aria-label="Foto siguiente"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 32, height: 32, borderRadius: 10, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(6px)', boxShadow: SHADOW.sm }}>
                <ChevronRight size={18} />
              </button>
            )}
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', gap: 5 }}>
              {fotos.map((_, i) => (
                <button key={i} onClick={() => setPhotoIdx(i)} aria-label={`Foto ${i + 1}`}
                  style={{ width: i === photoIdx ? 16 : 5, height: 5, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer', background: i === photoIdx ? '#fff' : 'rgba(255,255,255,.5)', transition: 'width .25s ease, background .25s ease' }} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="cm-hero-ed-inner">
      {/* Fila: logo izquierda + info columna derecha. En escritorio es la
          BARRA fija de la tienda (ver CSS: sticky + glass), y el bloque de
          portada queda debajo como contenido propio. */}
      <div className="cm-hero-ed-row">
        <div className="cm-hero-ed-logo" style={{ background: tienda.foto ? primarySoft : primary }}>
          {tienda.foto
            ? <img src={tienda.foto} alt={tienda.nombre} onClick={(e) => { trackClick(tienda.id, 'zoom', { origen: 'logo' }); zoomLogo.abrir(0, e); }} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
            /* Símbolo de LOKAL en vez de un ícono de usuario genérico: la
               tienda todavía no tiene marca propia (sin foto), y hasta que
               la suba lo que representa la página ES la plataforma —
               mismo criterio que el logo del header en la vista de
               oferta individual (LogoSymbolSvg), que ya usaba el símbolo
               real en vez de un placeholder de "sin foto". */
            : <LogoSymbol size={40} color="#fff" />}
        </div>
        <div className="cm-hero-ed-info">
          {/* Fila 1 (mobile y escritorio): identidad a la izquierda, redes a
              la derecha — misma línea que el avatar/nombre, no debajo de
              meta. Fila 2: meta (estado + ubicación). En escritorio el CSS
              reordena estos DOS hermanos con `order`/flex para separar
              identidad de redes con el bloque de meta en el medio (ver
              media query 860px) — pero la base mobile los mantiene juntos
              en la fila de arriba, que es como ya funcionaba antes de
              tocar esto. */}
          <div className="cm-hero-ed-fila1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div className="cm-hero-ed-identidad" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
              <h1 className="cm-hero-ed-name">{tienda.nombre}</h1>
              {tienda.rating && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: RADIUS.full, background: surf2, color: txtM, border: `1px solid ${border}`, fontSize: 11.5, fontWeight: 800, flexShrink: 0 }}>
                  <Star size={12} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                  {tienda.rating}{tienda.totalReseñas ? ` (${tienda.totalReseñas})` : ''}
                </span>
              )}
            </div>
            {(wa || igUser || web) && (
              <div className="cm-hero-ed-social" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {wa && (
                  <a aria-label="WhatsApp" data-tooltip="WhatsApp" href={`https://wa.me/54${wa}?text=${encodeURIComponent(`Hola ${tienda.nombre}, te contacto desde Lokal.`)}`} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(tienda.id, 'whatsapp')} style={socialStyle(ED_SOCIAL_GRADIENTS.wa)}>
                    <IconWhatsApp style={{ width: 17, height: 17 }} />
                  </a>
                )}
                {igUser && (
                  <a aria-label="Instagram" data-tooltip="Instagram" href={`https://instagram.com/${igUser}`} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(tienda.id, 'instagram')} style={socialStyle(ED_SOCIAL_GRADIENTS.ig)}>
                    <IconInstagram style={{ width: 17, height: 17 }} />
                  </a>
                )}
                {web && (
                  <a aria-label="Sitio web" data-tooltip="Sitio web" href={/^https?:\/\//.test(web) ? web : `https://${web}`} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(tienda.id, 'website')} style={socialStyle()}>
                    <Globe size={17} />
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="cm-hero-ed-meta" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap', fontSize: 12, color: txtM }}>
            {texto && (
              <button onClick={() => setHorariosOpen?.(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, color: abierta ? '#16a34a' : '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, ...F }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: abierta ? '#16a34a' : '#ef4444' }} />
                {texto}
              </button>
            )}
            {(tienda.direccion || tienda.ciudad) && (
              <button onClick={() => { trackClick(tienda.id, 'mapa'); onAbrirMapa?.(); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: onAbrirMapa ? 'pointer' : 'default', padding: 0, color: txtM, fontSize: 12, ...F, minWidth: 0 }}>
                <MapPin size={13} style={{ flexShrink: 0 }} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[tienda.direccion, tienda.ciudad].filter(Boolean).join(', ')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Acciones de la tienda — SOLO en horizontal. En mobile esto NO se
            duplica con nada: TiendaNavBar (bottom-nav) se oculta por
            completo desde 860px porque estos 3 botones YA la reemplazan acá
            arriba (ver .cm-nav-mobile más abajo) — sin esta fila, Mapa/
            Horarios/Compartir no tendrían ningún botón accesible en
            escritorio. Que el texto de .cm-hero-ed-meta (estado/dirección)
            TAMBIÉN dispare mapa/horarios es un atajo adicional sobre el
            mismo texto informativo, no una duplicación de esta barra. */}
        {modo === 'standalone' && (
          <div className="cm-acciones-tienda">
            {onAbrirMapa && (
              <button className="cm-accion no-press" onClick={() => { trackClick(tienda.id, 'mapa'); onAbrirMapa(); }}>
                <MapPin size={15} /> Mapa
              </button>
            )}
            <button className="cm-accion no-press" onClick={() => setHorariosOpen?.(true)}>
              <Clock size={15} /> Horarios
            </button>
            <button className="cm-accion no-press" onClick={compartir}
              style={{ background: primary, color: 'var(--tp-on-primary)', borderColor: primary }}>
              <Share2 size={15} /> Compartir
            </button>
          </div>
        )}
      </div>
      </div>{/* fin .cm-hero-ed-inner */}

      {/* Descripción — bloque propio, ordenable: en mobile va debajo de la
          identidad; en escritorio baja junto a la portada (order 3). */}
      {tienda.descripcion && (
        <div className="cm-hero-ed-desc" style={{ padding: '12px 18px 0', textAlign: 'center' }}>
          <p style={{ margin: '0 auto', fontSize: 12.5, lineHeight: 1.5, color: txtM, maxWidth: 400 }}>{tienda.descripcion}</p>
        </div>
      )}
    </header>
  );
}

