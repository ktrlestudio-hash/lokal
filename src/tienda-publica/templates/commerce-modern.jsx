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
  Star, MapPin, Clock, Search, Share2, ShoppingBag,
  Tag, Users, ChevronLeft, ChevronRight, Navigation, Store, Globe, Filter, ArrowUpDown, X, Check, Plus, BarChart3, MoreVertical,
} from 'lucide-react';

import { MapaSection, MapaModal } from '../sections/MapaSection.jsx';
import { HorariosSheet } from '../sections/HorariosSheet.jsx';
import { FiltrosSheet, OrdenarSheet } from '../sections/FiltrosOrdenSheet.jsx';
import { TiendaNavBar } from '../sections/TiendaNavBar.jsx';
import { TiendaFooter } from '../sections/TiendaFooter.jsx';
import { ShareSheet } from '../sections/ShareSheet.jsx';
import { ProductDetailModal } from '../sections/ProductDetailModal.jsx';
import { LogoSymbol } from '../../Brand.jsx';

import { getEstadoApertura, formatPrice } from '../utils.js';
import { usePhotoSwipe, PhotoSwipeStyles, PhotoSwipeOverlay } from '../hooks/usePhotoSwipe.jsx';
import { trackPageview, trackClick, trackCompartir, trackBusqueda, useTiempoEnPagina } from '../track.js';
import { OfertaQuickForm } from '../sections/OfertaQuickForm.jsx';
import { TiendaStatsSheet } from '../sections/TiendaStatsSheet.jsx';
import { FONT, RADIUS, SHADOW, TRANSITION } from '../tokens.js';
import {
  nombreDe, fotoDe, descuentoPct, Precio, TituloDescripcion,
  ProductCardList, ProductCardVertical, OfertaMenuButton,
  CM_LIST_H, CM_LIST_SIDE, CM_VERT_W, CM_VERT_IMG, CM_VERT_BODY,
  iconoDeCategoria, esCategoriaVertical,
} from '../components/ProductCards.jsx';
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
  .cm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  @media (min-width: 620px) { .cm-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
  @media (min-width: 980px) { .cm-grid { grid-template-columns: repeat(4, 1fr); } }
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

// Lectura tolerante: catálogo real usa `titulo`/`fotos[]`; mock usa `nombre`/`foto`.
// (nombreDe/fotoDe viven en components/ProductCards.jsx, compartidos con el Home)
const catDe    = p => p.categoria || p.categoryId || null;

// iconoDeCategoria / esCategoriaVertical viven en components/ProductCards.jsx
// (compartidos con HomeScreen, que arma secciones globales por rubro con el
// mismo criterio visual).

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
  esDueño, onOfertaCreada, onOfertaActualizada, onOfertaEliminada,
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
  const s = Object.fromEntries(secciones.map(sec => [sec.id, sec]));

  const productos = (tienda.productos || []).filter(p => p.activo !== false && p.disponible !== false);

  const [detalle, setDetalle] = useState(null);
  const [query, setQuery] = useState('');
  const [catActiva, setCatActiva] = useState('__todas');
  const [layout, setLayout] = useState('lista');
  const searchInputRef = useRef(null);

  // Tracking de búsqueda — debounce 800ms: sin esto se mandaría un evento
  // por cada tecla tipeada. No se trackea al propio dueño (ver pageview).
  useEffect(() => {
    if (esDueño || !query.trim()) return undefined;
    const t = setTimeout(() => trackBusqueda(tienda.id, query.trim()), 800);
    return () => clearTimeout(t);
  }, [query, tienda.id, esDueño]);

  // Filtro + orden — subconjunto acotado del sistema completo de
  // TodasOfertasScreen.jsx (categoría se cubre con los chips ya
  // existentes, no se duplica en el sheet de filtros).
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [soloDescuento, setSoloDescuento] = useState(false);
  const [filtrosAtributos, setFiltrosAtributos] = useState({});
  const [sortBy, setSortBy] = useState('relevancia');
  const SORT_OPTIONS = [
    { value: 'relevancia',  label: 'Relevancia' },
    { value: 'precio-asc',  label: 'Menor precio' },
    { value: 'precio-desc', label: 'Mayor precio' },
    { value: 'nombre-az',   label: 'Nombre A-Z' },
    { value: 'destacados',  label: 'Destacados' },
  ];
  const activeAttrCount = Object.values(filtrosAtributos).filter(v => v && v.length > 0).length;
  const activeFilterCount = [precioMin !== '' || precioMax !== '', soloDescuento].filter(Boolean).length + activeAttrCount;

  // Atributos dinámicos — derivados de tienda.productos[].attributes (ej.
  // tamaño, apto_celiaco, con_extra), mismo criterio que
  // TodasOfertasScreen.jsx: solo aparece si hay 2+ valores distintos.
  const atributosDisponibles = useMemo(() => {
    const map = {};
    const SKIP_KEYS = new Set(['modelo', 'estado']);
    productos.forEach(p => {
      if (!p.attributes) return;
      Object.entries(p.attributes).forEach(([k, v]) => {
        if (SKIP_KEYS.has(k) || !v) return;
        if (!map[k]) map[k] = { key: k, label: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '), values: new Set() };
        map[k].values.add(String(v));
      });
    });
    return Object.values(map).filter(a => a.values.size >= 2).map(a => ({ ...a, values: [...a.values].sort() }));
  }, [productos]);

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
    const pMin = precioMin !== '' ? Number(precioMin) : null;
    const pMax = precioMax !== '' ? Number(precioMax) : null;
    const base = productos.filter(p => {
      if (catActiva !== '__todas' && catDe(p) !== catActiva) return false;
      if (q && !nombreDe(p).toLowerCase().includes(q) && !(p.descripcion || '').toLowerCase().includes(q)) return false;
      if (soloDescuento && !(p.precioOriginal && Number(p.precioOriginal) > Number(p.precio || 0))) return false;
      if (pMin !== null && (p.precio == null || Number(p.precio) < pMin)) return false;
      if (pMax !== null && (p.precio == null || Number(p.precio) > pMax)) return false;
      for (const [key, vals] of Object.entries(filtrosAtributos)) {
        if (!vals || vals.length === 0) continue;
        if (!p.attributes || !vals.includes(String(p.attributes[key]))) return false;
      }
      return true;
    });
    if (sortBy === 'relevancia') return base;
    return [...base].sort((a, b) => {
      if (sortBy === 'precio-asc')  return (a.precio ?? Infinity) - (b.precio ?? Infinity);
      if (sortBy === 'precio-desc') return (b.precio ?? 0) - (a.precio ?? 0);
      if (sortBy === 'nombre-az')   return nombreDe(a).localeCompare(nombreDe(b), 'es');
      if (sortBy === 'destacados')  return (b.rating ?? 0) - (a.rating ?? 0);
      return 0;
    });
  }, [productos, query, catActiva, soloDescuento, precioMin, precioMax, filtrosAtributos, sortBy]);

  // Con orden explícito (no "relevancia"), el agrupado por categoría no
  // tiene sentido — el usuario pidió ordenar TODOS los resultados, no cada
  // grupo por separado. Colapsa a una sola sección "Resultados".
  const grupos = useMemo(() => {
    if (sortBy !== 'relevancia') {
      return filtrados.length > 0 ? [['Resultados', filtrados]] : [];
    }
    const map = new Map();
    for (const p of filtrados) {
      const c = catDe(p) || 'Otros';
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(p);
    }
    return [...map.entries()];
  }, [filtrados, sortBy]);

  // Carrusel de fotos del hero — crossfade por opacity (evita el parpadeo
  // de cambiar el src), mismo patrón que usaba TiendaDetailScreen.jsx.
  const [photoIdx, setPhotoIdx] = useState(0);

  const bg = 'var(--tp-bg)', surf = 'var(--tp-surface)', surf2 = 'var(--tp-surface2)';
  const border = 'var(--tp-border)', txt = 'var(--tp-text)', txtM = 'var(--tp-text-muted)';
  const primary = 'var(--tp-primary)', primarySoft = 'var(--tp-primary-soft)', onPrimary = 'var(--tp-on-primary)';

  const heroImg = tienda.foto || tienda.galeria?.[0] || tienda.fotoPortada || null;
  // Mismo dedupe que usa el hero abajo (evita mostrar heroImg repetida si ya
  // está en tienda.galeria) — se recalcula acá, a nivel de componente, para
  // poder llamar los hooks de zoom (reglas de hooks: no dentro del IIFE).
  const fotosHero = [...new Set([heroImg, ...(tienda.galeria || [])].filter(Boolean))];
  const zoomBanner = usePhotoSwipe(fotosHero);
  const zoomLogo = usePhotoSwipe(tienda.logo ? [tienda.logo] : []);
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

  // El chip de dirección abre el modal de mapa propio de la tienda (solo si
  // hay coordenadas). Ese modal — reusando MapaSection/MapaModal — muestra
  // SOLO el pin de esta tienda; dentro puede ofrecer "ver en el mapa global
  // de LOKAL" (onVerEnMapaGlobal) como opción secundaria en modo plataforma.
  const onAbrirMapa = (tienda.lat && tienda.lng) ? () => setMapaOpen(true) : undefined;

  // Sin prefijo /t/: el router real (Root.jsx, pathToTiendaSlug) espera
  // /:slug de un único segmento — /t/:slug no resuelve a ninguna tienda.
  const shareUrl = tienda.slug ? `${window.location.origin}/${tienda.slug}` : window.location.href;
  const compartir = () => setShareOpen(true);

  const cardProps = {
    surf, surf2, border, txt, txtM, primary, onPrimary,
    onOpenAdminMenu: esDueño ? setOfertaAdminTarget : null,
  };

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
          <div style={{ position: 'absolute', left: '-15%', top: '-10%', width: 440, height: 440, borderRadius: '50%', background: 'color-mix(in srgb, var(--tp-primary) 18%, transparent)', filter: 'blur(120px)' }} />
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
              {/* Fondo de marca + símbolo LOKAL en blanco cuando no hay foto
                  propia — igual criterio que el viejo LOKAL LINKS (referencia
                  aprobada), en vez de la inicial del nombre. */}
              <div className="cm-hero-logo" style={{ width: 72, height: 72, marginTop: -36, marginBottom: 10, borderRadius: 18, background: tienda.logo ? primarySoft : primary, border: `4px solid ${surf}`, boxShadow: SHADOW.md, overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                {tienda.logo
                  ? <img src={tienda.logo} alt={tienda.nombre} onClick={(e) => { trackClick(tienda.id, 'zoom', { origen: 'logo' }); zoomLogo.abrir(0, e); }} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
                  : <LogoSymbol size={38} color="#fff" />}
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

      {/* ── Barra sticky: buscador + chips + toggle ── */}
      {s.productos?.activa && productos.length > 0 && (
        <div className="cm-sticky-bar" style={{ position: 'sticky', top: 0, zIndex: 50, paddingTop: 16, marginTop: 18, borderBottom: `1px solid ${border}` }}>
          <div style={{ padding: '0 16px', display: 'flex', gap: 10, marginBottom: 12 }}>
            <div className="cm-search-wrap" style={{ position: 'relative', flex: 1 }}>
              <Search size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: txtM, pointerEvents: 'none' }} />
              <input
                ref={searchInputRef}
                className="cm-input"
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Buscar productos…"
                style={{
                  width: '100%', padding: `12px ${query ? '36px' : '14px'} 12px 38px`, borderRadius: RADIUS.md,
                  borderWidth: '1.5px', borderStyle: 'solid', outline: 'none', fontSize: 14, fontWeight: 500,
                  ...F,
                }}
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda" className="no-press cm-clear-btn"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', border: 'none', background: surf2, color: txtM, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'filter .15s ease, transform .12s ease' }}>
                  <X size={13} />
                </button>
              )}
            </div>
            {/* Filtro y Ordenar — reemplazan el toggle lista/grilla en la
                barra; ambos abren un sheet (patrón portado tal cual de
                TodasOfertasScreen.jsx: botón SÓLIDO cuando hay filtros
                activos, con un dot chico en la esquina — no un contador
                numérico, eso queda solo para el sidebar desktop). */}
            <button
              className="cm-toggle-btn"
              onClick={() => setFiltersOpen(true)}
              aria-label="Filtros" data-tooltip="Filtros"
              style={{
                width: 46, borderRadius: RADIUS.md, border: `1.5px solid ${activeFilterCount > 0 ? primary : border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, position: 'relative',
                background: activeFilterCount > 0 ? primary : surf2, color: activeFilterCount > 0 ? onPrimary : txt,
              }}>
              <Filter size={18} />
              {activeFilterCount > 0 && (
                <span style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: primary, boxShadow: `0 0 0 2px ${surf}` }} />
              )}
            </button>
            <button
              className="cm-toggle-btn"
              onClick={() => setSortOpen(true)}
              aria-label="Ordenar" data-tooltip="Ordenar"
              style={{ width: 46, borderRadius: RADIUS.md, border: `1.5px solid ${sortBy !== 'relevancia' ? primary : border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, background: surf2, color: sortBy !== 'relevancia' ? primary : txt }}>
              <ArrowUpDown size={18} />
            </button>
          </div>

          {categorias.length > 0 && (
            <div style={{ padding: '0 16px 13px' }}>
              {/* Mismo sistema de scroll que HomeScreen.jsx: fade en el
                  borde con más chips por descubrir + flechas que aparecen
                  solo cuando hay overflow en esa dirección (reusa el
                  componente Carrusel ya usado en el catálogo). */}
              <Carrusel gap={8} className="cm-chips" arrowOffset={10}>
                <Chip label="Todos" Icon={Tag} active={catActiva === '__todas'} onClick={() => setCatActiva('__todas')}
                  primary={primary} onPrimary={onPrimary} surf2={surf2} border={border} txt={txt} />
                {categorias.map(c => (
                  <Chip key={c} label={c} Icon={iconoDeCategoria(c)} active={catActiva === c}
                    onClick={() => setCatActiva(catActiva === c ? '__todas' : c)}
                    primary={primary} onPrimary={onPrimary} surf2={surf2} border={border} txt={txt} />
                ))}
              </Carrusel>
            </div>
          )}
        </div>
      )}

      {/* ── Catálogo agrupado ── */}
      {/* s.productos viene undefined si la sección nunca se activó (no está
          en el array de getSeccionesActivas) — antes `undefined !== false`
          daba true y mostraba el catálogo (con su empty state "no hay
          productos") igual, aunque la tienda no use ese módulo. */}
      {s.productos?.activa && (
        <div style={{ padding: '18px 16px 0' }}>
          {filtrados.length === 0 ? (
            // Dos vacíos distintos: búsqueda sin resultados (ícono lupa,
            // enfocado en "probá otra búsqueda") vs. catálogo realmente
            // vacío (ícono bolsa, "todavía no hay productos"). Antes
            // compartían el mismo ícono de bolsa (poco lógico para un
            // resultado de búsqueda) con mal centrado (marginBottom en vez
            // de flex real).
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: 56, height: 56, borderRadius: RADIUS.full, background: surf2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                {query
                  ? <Search size={24} style={{ color: txtM }} />
                  : <ShoppingBag size={24} style={{ color: txtM }} />}
              </div>
              {query ? (
                <>
                  <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: txt }}>Sin resultados para "{query}"</p>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: txtM }}>Probá con otra palabra o revisá la ortografía</p>
                  <button onClick={() => setQuery('')} style={{ padding: '9px 18px', borderRadius: RADIUS.md, border: `1.5px solid ${border}`, background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: txt, ...F }}>
                    Limpiar búsqueda
                  </button>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: txtM }}>Todavía no hay productos</p>
              )}
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
                      {/* "Ver todos" con filtro por ESTA categoría — solo modo
                          plataforma. Standalone ya muestra el 100% del
                          catálogo de esta tienda acá mismo, no aplica un
                          "ver más" hacia otro lado. Antes era un único
                          botón global flotando sobre el buscador, sin
                          relación con ninguna categoría puntual — ahora
                          cada sección tiene el suyo. */}
                      {onVerTodosFiltrado && (
                        <button onClick={() => onVerTodosFiltrado(cat)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12.5, fontWeight: 700, color: primary, ...F }}>
                          Ver todos →
                        </button>
                      )}
                    </h2>
                  )}

                  {vertical && items.length > 3 ? (
                    // 4+ bebidas: carrusel horizontal con cards más altas
                    // que anchas (foto vertical), flechas + fade en los bordes
                    // — mismo patrón que LOKAL usa en TiendaDetailScreen.
                    <Carrusel>
                      {items.map(p => (
                        <ProductCardVertical key={p.id} p={p} onOpen={() => setDetalle(p)} {...cardProps} />
                      ))}
                    </Carrusel>
                  ) : items.length === 1 ? (
                    // 1 sola: card horizontal normal, como cualquier otra categoría.
                    <ProductCardList p={items[0]} onOpen={() => setDetalle(items[0])} {...cardProps} />
                  ) : pocasVerticales ? (
                    // 2-3 bebidas: se ajustan al ancho disponible, sin scroll.
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10 }}>
                      {items.map(p => (
                        <ProductCardVertical key={p.id} p={p} onOpen={() => setDetalle(p)} fluida {...cardProps} />
                      ))}
                    </div>
                  ) : layout === 'grilla' ? (
                    <div className="cm-grid">
                      {items.map(p => (
                        <ProductCardGrid key={p.id} p={p} onOpen={() => setDetalle(p)} {...cardProps} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {items.map(p => (
                        <ProductCardList key={p.id} p={p} onOpen={() => setDetalle(p)} {...cardProps} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
      )}

      {/* ── Ofertas — módulo LOKAL LINKS: imágenes con link individual y
          Open Graph dinámico al compartir (netlify/functions/ofertas.js +
          oferta-ssr.js). Sin precio/stock — solo imagen + nombre + compartir,
          a diferencia del catálogo. Ver MODULES.md. ── */}
      {s.ofertas?.activa && (() => {
        const ofertasList = tienda.ofertas || [];
        return (
          <section style={{ padding: '18px 16px 20px' }}>
            {/* Título con ícono — mismo diseño literal del viejo LOKAL LINKS
                (section-ico: 34x34, radius 11, fondo brand-muted). */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, background: primarySoft, color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tag size={18} />
                </span>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: txt, ...F }}>Ofertas</h2>
              </div>
              {ofertasList.length > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: txtM, ...F }}>
                  {ofertasList.length} {ofertasList.length === 1 ? 'oferta' : 'ofertas'}
                </span>
              )}
            </div>

            {ofertasList.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ width: 56, height: 56, borderRadius: RADIUS.full, background: surf2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Tag size={24} style={{ color: txtM }} />
                </div>
                <p style={{ margin: 0, fontSize: 14, color: txtM, ...F }}>Todavía no hay ofertas publicadas</p>
              </div>
            ) : (
              <div className="cm-grid">
                {ofertasList.map((o) => {
                  // Vencida/oculta: solo pueden llegar acá cuando esDueño
                  // (el fetch público ya las filtra) — atenuadas + badge,
                  // mismo criterio visual que el panel admin completo
                  // (StoreApp.jsx → OfertaCard), para que el dueño reconozca
                  // de un vistazo cuál necesita reactivar.
                  const ofVencida = o.expireAt && new Date(o.expireAt).getTime() < Date.now();
                  const ofOculta = o.visible === false;
                  const ofInactiva = ofVencida || ofOculta;
                  return (
                  <a key={o.id} href={`/${tienda.slug}/o/${o.slug || o.id}`}
                    onClick={(e) => {
                      trackClick(tienda.id, 'card', { productoId: o.id });
                      // Clic izquierdo normal → navegación SPA interna (sin
                      // re-fetch): la oferta ya está en memoria. Ctrl/Cmd/click
                      // medio (abrir en pestaña nueva) NO se intercepta —
                      // dejamos que el href haga su trabajo. Igual el crawler
                      // y el SEO ven el href real.
                      if (onVerOferta && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                        e.preventDefault();
                        onVerOferta(tienda, o);
                      }
                    }}
                    style={{ position: 'relative', display: 'block', aspectRatio: '1/1.414', borderRadius: RADIUS.lg, overflow: 'hidden', background: surf2, border: `1px solid ${border}`, textDecoration: 'none', opacity: ofInactiva ? 0.55 : 1 }}>
                    <img src={o.thumbUrl || o.imageUrl} alt={o.nombre} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {ofInactiva && (
                      <span style={{ position: 'absolute', top: 8, left: 8, zIndex: 3, padding: '3px 8px', borderRadius: RADIUS.sm, background: ofVencida ? '#EF4444' : 'rgba(0,0,0,.6)', color: '#fff', fontSize: 10, fontWeight: 800 }}>
                        {ofVencida ? 'Vencida' : 'Oculta'}
                      </span>
                    )}
                    {/* Botón compartir flotante — igual que .card-share del viejo
                        LOKAL LINKS: círculo semitransparente sobre la foto, sin
                        barra de texto abajo. Cuando el dueño está viendo su
                        propia tienda, el botón de gestión (3 puntos) toma la
                        esquina y comparte se desplaza a su izquierda — mismo
                        criterio que las cards del catálogo (ver ProductCards.jsx). */}
                    <button
                      onClick={(e) => {
                        // preventDefault: no seguir el href del <a> padre.
                        // stopPropagation: sin esto, el click seguía
                        // burbujeando hasta el onClick de la card completa
                        // (línea de arriba) y disparaba onVerOferta — abría
                        // la oferta en vez de (o además de) el sheet.
                        e.preventDefault();
                        e.stopPropagation();
                        setOfertaCompartir(o);
                        setShareOfertaOpen(true);
                      }}
                      aria-label="Compartir oferta" className="no-press cm-hero-share-btn"
                      style={{ position: 'absolute', top: 8, right: esDueño ? 46 : 8, zIndex: 3, width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color .15s ease' }}>
                      <Share2 size={15} />
                    </button>
                    {esDueño && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOfertaAdminTarget(o); }}
                        aria-label="Gestionar oferta" className="no-press cm-hero-share-btn"
                        style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,.45)', color: '#fff', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MoreVertical size={15} />
                      </button>
                    )}
                  </a>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}
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
      {footer && <TiendaFooter dark={footer.dark} toggleDark={footer.toggleDark} tiendaId={tienda.id} />}
      </div>{/* fin scroll interno */}

      {/* ── Detalle — vista tipo flyer (imagen + compartir, sin carrito) ── */}
      {detalle && (
        <ProductDetailModal producto={detalle} onClose={() => setDetalle(null)} onCompartir={compartir} />
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

      {/* ── Filtro / Ordenar del catálogo ── */}
      <FiltrosSheet
        open={filtersOpen} onClose={() => setFiltersOpen(false)}
        precioMin={precioMin} setPrecioMin={setPrecioMin}
        precioMax={precioMax} setPrecioMax={setPrecioMax}
        soloDescuento={soloDescuento} setSoloDescuento={setSoloDescuento}
        atributosDisponibles={atributosDisponibles}
        filtrosAtributos={filtrosAtributos} setFiltrosAtributos={setFiltrosAtributos}
        layout={layout} setLayout={setLayout}
        activeFilterCount={activeFilterCount}
        onLimpiar={() => { setPrecioMin(''); setPrecioMax(''); setSoloDescuento(false); setFiltrosAtributos({}); setFiltersOpen(false); }}
      />
      <OrdenarSheet open={sortOpen} onClose={() => setSortOpen(false)} sortBy={sortBy} setSortBy={setSortBy} options={SORT_OPTIONS} />

      {/* ── Compartir — sheet con opciones (hero + TiendaNavBar) ── */}
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} titulo={tienda.nombre}
        onCompartido={(medio) => trackCompartir(tienda.id, medio)} />

      {/* ── Bottom-nav propio de la tienda — SOLO modo standalone. En modo
          plataforma ya existe el bottom-nav global de LOKAL, provisto por
          fuera del template (App.jsx), sin cambios acá. ── */}
      {modo === 'standalone' && (
        <TiendaNavBar
          onAbrirMapa={onAbrirMapa}
          onAbrirHorarios={() => setHorariosOpen(true)}
          onCompartir={compartir}
        />
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
            .cm-fab-add, .cm-fab-stats { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
            @media (hover: hover) { .cm-fab-add:hover, .cm-fab-stats:hover { filter: brightness(1.08); } }
            .cm-fab-add:active, .cm-fab-stats:active { transform: scale(0.93); transition: transform .06s ease; }
          `}</style>
          {/* Chip de stats — MISMA forma/tamaño que el "+" (56px, radius 18,
              misma sombra), solo cambia el color: neutro (surface) porque es
              la acción secundaria, el "+" en color de marca sigue siendo la
              primaria. Antes eran de tamaño/radio distintos, se veían como
              dos lenguajes de botón separados en vez de un mismo par. */}
          <button onClick={() => setStatsOpen(true)} aria-label="Estadísticas de tu tienda" data-tooltip="Estadísticas" className="no-press cm-fab-stats"
            style={{
              position: 'fixed', right: 16,
              bottom: 'calc(var(--cm-navbar-h) + 16px + env(safe-area-inset-bottom))',
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
              bottom: 'calc(var(--cm-navbar-h) + 16px + 72px + env(safe-area-inset-bottom))',
              zIndex: 260, width: 56, height: 56, borderRadius: 18, border: 'none', cursor: 'pointer',
              background: 'var(--tp-primary)', color: 'var(--tp-on-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px color-mix(in srgb, var(--tp-primary) 45%, transparent)',
            }}>
            <Plus size={26} />
          </button>
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
  const zoomLogo = usePhotoSwipe(tienda.logo ? [tienda.logo] : []);
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
      `}</style>

      {/* Foto banner de acento — a todo el ancho de la ventana, fuera del
          contenedor centrado (a diferencia de la fila de info/descripción,
          que sí se acota en desktop). */}
      <div className="cm-hero-ed-photo">
        {fotos.length > 0
          ? fotos.map((src, i) => (
              // pointerEvents:'none' en las fotos NO visibles — todas ocupan
              // el mismo inset:0 (crossfade), así que sin esto el navegador
              // puede aterrizar el click en la imagen invisible de arriba en
              // el DOM (aunque opacity:0), no en la visible debajo. Bug real
              // encontrado probando con Playwright: elementFromPoint devolvía
              // la foto oculta, el guard i===photoIdx bloqueaba todo en
              // silencio y el zoom nunca abría.
              <img key={src} src={src} alt=""
                onClick={(e) => { if (i === photoIdx) { trackClick(tienda.id, 'zoom', { origen: 'banner' }); zoomBanner.abrir(i, e); } }}
                style={{ position: 'absolute', inset: 0, opacity: i === photoIdx ? 1 : 0, transition: 'opacity .4s ease', cursor: i === photoIdx ? 'zoom-in' : 'default', pointerEvents: i === photoIdx ? 'auto' : 'none' }} />
            ))
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
      {/* Fila: logo izquierda + info columna derecha */}
      <div className="cm-hero-ed-row">
        <div className="cm-hero-ed-logo" style={{ background: tienda.logo ? primarySoft : primary }}>
          {tienda.logo
            ? <img src={tienda.logo} alt={tienda.nombre} onClick={(e) => { trackClick(tienda.id, 'zoom', { origen: 'logo' }); zoomLogo.abrir(0, e); }} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
            : <LogoSymbol size={44} color="#fff" />}
        </div>
        <div className="cm-hero-ed-info">
          {/* Título+chip a la izquierda, redes a la derecha (aprovecha el
              ancho que sobraba en esta fila — antes compartían línea con la
              descripción abajo, forzando más altura). Si nombre+rating+redes
              no entran en una fila, el grupo de redes se envuelve DEBAJO
              (columna propia), no se apilan verticalmente los 2/3 botones
              entre sí — más legible que un stack de íconos angosto. */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
              <h1 className="cm-hero-ed-name">{tienda.nombre}</h1>
              {tienda.rating && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: RADIUS.full, background: surf2, color: txtM, border: `1px solid ${border}`, fontSize: 11.5, fontWeight: 800, flexShrink: 0 }}>
                  <Star size={12} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                  {tienda.rating}{tienda.totalReseñas ? ` (${tienda.totalReseñas})` : ''}
                </span>
              )}
            </div>
            {(wa || igUser || web) && (
              <div className="cm-hero-ed-social" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
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
      </div>

      {/* Descripción — sola, centrada al ancho de la pantalla (las redes ya
          subieron a la fila del título, que sigue alineada a la izquierda). */}
      {tienda.descripcion && (
        <div style={{ padding: '12px 18px 0', textAlign: 'center' }}>
          <p style={{ margin: '0 auto', fontSize: 12.5, lineHeight: 1.5, color: txtM, maxWidth: 400 }}>{tienda.descripcion}</p>
        </div>
      )}
      </div>{/* fin .cm-hero-ed-inner */}
    </header>
  );
}

/* ── Chip de categoría con ícono (estilo LOKAL: rounded parcial) ── */
function Chip({ label, Icon, active, onClick, primary, onPrimary, surf2, border, txt }) {
  return (
    <button className="cm-chip" onClick={onClick} style={{
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

/* ── Precio / TituloDescripcion / descuentoPct / QtyControl / ProductCardList: ver ../components/ProductCards.jsx ── */


/* ── Carrusel horizontal con flechas + fade en los bordes — mismo patrón
   visual que LOKAL usa en TiendaDetailScreen (useScrollEdges + NavArrowBtn),
   reimplementado acá con los tokens de tienda-publica para no acoplar este
   template al resto de la app. ── */
function Carrusel({ children, gap = 12, className = 'cm-chips', padding = '0', arrowOffset = 2 }) {
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
      <div ref={ref} style={{ display: 'flex', gap, overflowX: 'auto', padding, scrollbarWidth: 'none' }} className={className}>
        {children}
      </div>
      {/* Fade con stops explícitos (no solo color→transparent) para evitar el
          artefacto de 1px que deja el navegador al interpolar transparencia
          en un color con canal alpha implícito — mismo tono en ambos
          extremos del gradiente, solo cambia la opacidad. */}
      {edges.left && (
        <>
          <div style={{ pointerEvents: 'none', position: 'absolute', left: 0, top: 0, bottom: 0, width: 28, background: 'linear-gradient(to right, var(--tp-bg) 0%, var(--tp-bg) 15%, transparent 100%)' }} />
          {/* top:50% + translateY(-50%) en vez de un % fijo (era 38%,
              ajustado a ojo para las cards altas del catálogo) — así queda
              centrado de verdad sin importar la altura del contenido
              (chips bajitos, cards altas, lo que sea). */}
          <button onClick={() => scrollBy(-1)} aria-label="Anterior" className="no-press cm-carousel-arrow"
            style={{ position: 'absolute', left: -arrowOffset, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: 10, border: '1px solid var(--tp-border)', background: 'var(--tp-surface)', color: 'var(--tp-text)', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: SHADOW.sm, zIndex: 2 }}>
            <ChevronLeft size={16} />
          </button>
        </>
      )}
      {edges.right && (
        <>
          <div style={{ pointerEvents: 'none', position: 'absolute', right: 0, top: 0, bottom: 0, width: 28, background: 'linear-gradient(to left, var(--tp-bg) 0%, var(--tp-bg) 15%, transparent 100%)' }} />
          <button onClick={() => scrollBy(1)} aria-label="Siguiente" className="no-press cm-carousel-arrow"
            style={{ position: 'absolute', right: -arrowOffset, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: 10, border: '1px solid var(--tp-border)', background: 'var(--tp-surface)', color: 'var(--tp-text)', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: SHADOW.sm, zIndex: 2 }}>
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

/* ── Card VERTICAL: ver ProductCardVertical en ../components/ProductCards.jsx ── */

/* ── Card GRILLA: foto arriba, info abajo (catálogo visual). Sin selector de
   cantidad — click en la card lleva directo al detalle. ── */
function ProductCardGrid({ p, onOpen, surf, surf2, border, txt, txtM, onOpenAdminMenu }) {
  const img = fotoDe(p);
  const pct = descuentoPct(p);
  return (
    <div onClick={onOpen} role="button" tabIndex={0} className="no-press cm-card"
      style={{ background: surf, border: `1px solid ${border}`, borderRadius: RADIUS.lg, overflow: 'hidden', cursor: 'pointer', boxShadow: SHADOW.sm, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: surf2 }}>
        {img ? <img src={img} alt={nombreDe(p)} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}><ShoppingBag size={26} style={{ color: txtM, opacity: 0.5 }} /></div>}
        {pct && <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: RADIUS.sm, background: 'var(--tp-secondary)', color: 'var(--tp-on-secondary)', fontSize: 11, fontWeight: 900 }}>-{pct}%</span>}
        <OfertaMenuButton onOpen={onOpenAdminMenu ? () => onOpenAdminMenu(p) : null} />
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
