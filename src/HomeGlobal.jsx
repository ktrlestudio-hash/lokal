// HomeGlobal — Home marketplace multi-tienda, lo que ve un visitante que
// entra a la RAÍZ del sitio ("/"). Reemplaza a LandingScreen ahí (LandingScreen
// pasa a vivir en /vender, ver Root.jsx) — esta pantalla es un buscador +
// vidriera de TODAS las tiendas activas, no la landing de venta del producto.
//
// Estructura/interacción portada de LOKAL Global (ecosistema LOKAL\LOKAL\src\
// screens\HomeScreen.jsx): header con buscador en vivo, fila de categorías,
// hero de mapa, banner rotativo, carrusel de destacados, carrusel de tiendas.
// La sección "Mis demandas" del original NO se portó — ese concepto no existe
// en LOKAL LINKS. Paleta/footer/componentes son 100% del sistema YA maduro de
// LOKAL LINKS (tokens de src/index.css, Carrusel/Chip/ProductCardVertical de
// tienda-publica/components/ProductCards.jsx) — nada copiado tal cual del
// proyecto hermano, solo la FORMA se inspiró ahí (pedido explícito del usuario).
//
// El hero de mapa acá es solo una CARD clickeable con gradiente de marca — el
// mapa interactivo real (Leaflet, clustering estilo Mi Bovril) es una fase
// aparte, no se integra en esta pasada.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Store, MapPin, Tag, User, X, Sun, Moon, Home, ShoppingCart,
  ChevronLeft, ChevronRight, LayoutGrid, Sparkles, Rocket, ShoppingBag,
} from 'lucide-react';
import { LogoSymbol, LogoFull, KtrlMark } from './Brand';
import CategoryIcon from './CategoryIcon';
import { CATEGORIES, getCategoryPath } from './categories';
import NavArrowBtn from './components/ui/NavArrowBtn';
import useScrollEdges from './hooks/useScrollEdges';
import { Carrusel, ProductCardGrid, CM_GRID_BODY, CM_GRID_CARD_W } from './tienda-publica/components/ProductCards.jsx';
import { getEstadoApertura } from './tienda-publica/utils.js';
import { API_BASE } from './config/flags';
import { SheetLegal, CARD_TINTED } from './components/LegalSheet.jsx';
import ProximamenteModal from './components/ProximamenteModal.jsx';
import LoginSheet from './components/LoginSheet.jsx';
import { usePublicarAlturaReal } from './store/hooks/usePublicarAlturaReal.js';

// Categorías raíz de comida rápida/express (las primeras 12 de
// categories.js, con sus propias subcategorías debajo — no un rubro
// separado marcado en la data, es simplemente el bloque histórico de
// LOKAL COMIDAS RAPIDAS). Se excluyen acá a propósito: esta Home es el
// marketplace GENERAL (electrónica, ropa, ferretería, etc.), y esas 12
// van a tener su propia home dedicada cuando se construya el módulo de
// comida rápida — mezclarlas acá no aplica a ese contexto.
const CATEGORIAS_COMIDA_RAPIDA = new Set([
  'hamburguesas', 'pizzas', 'sandwiches', 'empanadas', 'tartas', 'platos',
  'papas', 'ensaladas', 'postres', 'bebidas', 'combos', 'otros',
]);
// Orden por relevancia para el marketplace general — categories.js las
// trae en el orden en que se fueron agregando a la data, no por qué tan
// buscadas son. Cualquier categoría raíz nueva que no esté en esta lista
// cae al final (fallback seguro: nunca desaparece de la fila).
const ORDEN_RELEVANCIA = [
  'servicios', 'alimentos', 'ropa', 'calzado', 'electronica', 'computacion',
  'electrodomesticos', 'hogar', 'salud', 'deportes', 'ferreteria',
  'construccion', 'automotores', 'mascotas', 'juguetes', 'libros', 'otros_general',
];
const catRoot = CATEGORIES
  .filter((c) => c.parentId === null && !CATEGORIAS_COMIDA_RAPIDA.has(c.id))
  .sort((a, b) => {
    const ia = ORDEN_RELEVANCIA.indexOf(a.id);
    const ib = ORDEN_RELEVANCIA.indexOf(b.id);
    return (ia === -1 ? ORDEN_RELEVANCIA.length : ia) - (ib === -1 ? ORDEN_RELEVANCIA.length : ib);
  });

// Colores fijos (no vienen de --tp-primary, que es la paleta POR TIENDA — acá
// se usan los tokens generales de marca de toda la app: brand/surface-card/ink).
const CM = {
  surf: 'rgb(var(--surface-solid-rgb))',
  surf2: 'rgb(var(--surface-solid-2-rgb))',
  border: 'var(--border-solid)',
  txt: 'var(--text-primary)',
  txtM: 'var(--text-secondary)',
  primary: 'var(--brand-hex, #00B8D9)',
  onPrimary: '#fff',
  // chip de precio de ProductCardGrid (Destacados): fondo NO es el color de
  // marca de ninguna tienda en particular (cada card es de un negocio
  // distinto acá, pintarla con la marca de uno solo no tiene sentido) —
  // gris suave neutro en los dos temas. Bug real corregido: sin
  // chipBg/chipColor explícitos, el chip leía var(--tp-primary-soft) — una
  // variable de paleta POR TIENDA que este árbol nunca define — y quedaba
  // sin fondo ni color.
  chipBg: 'rgb(var(--surface-solid-2-rgb))',
  // chipColor NEGRO/BLANCO ABSOLUTO (no var(--text-secondary), que se
  // había usado por error al armar chipBg de arriba y bajaba la fuerza
  // visual del precio a un gris apagado — antes, sin chip, el precio usaba
  // CM.txt/--text-primary, casi-negro pero no absoluto; el pedido explícito
  // acá es más fuerte todavía). var(--lk-ink-strong) no existe como token
  // real del proyecto — se define inline con la misma clase .dark que ya
  // usa el resto de la app para condicionar tema, sin inventar un token
  // nuevo persistente en index.css para un solo uso puntual.
  chipColor: 'var(--lk-chip-precio-fuerte, #000)',
};

// Fondo de los chips de categoría inactivos en DARK. Dos intentos previos
// fallaron por la misma razón: --surface-solid en dark es un gris CARBÓN
// NEUTRO (#1f1f1f, R=G=B casi iguales) — cualquier degradado translúcido
// de --brand ENCIMA de ese gris opaco sigue leyéndose gris (la mezcla
// alpha con un neutro puro no "tiñe" lo suficiente, aunque se suba la
// opacidad). La superficie de base tiene que ser un color YA azulado, no
// gris + tinte encima — se usa el mismo #040a14 enriquecido que el resto
// de fondos "de marca" de la app (AdminLogin/HomeGlobal/splash), con el
// degradado de --brand encima para dar el efecto glass.
const CHIP_TINTED_DARK = {
  background: 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.22), rgb(var(--brand, 0 184 217) / 0.08)), #0a1420',
  borderColor: 'rgb(var(--brand, 0 184 217) / 0.14)',
};

// Banner rotativo — CTAs propios de LOKAL LINKS (sin "demandas", que no
// existe acá). Los cuatro llevan a lugares reales: mapa, buscar/categorías,
// crear tienda, y destacados.
//
// El slide de mapa (dots=true) absorbe lo que antes era un hero SEPARADO
// (card estática "Explorá tu ciudad" arriba de este carrusel) — dos piezas
// casi redundantes en la misma pantalla, una al lado de la otra, se
// unificaron en una sola: este carrusel ahora es el único hero. Conserva el
// patrón de puntos SVG y el degradado profundo (--brand-deep) de esa pieza
// vieja, con el mismo mensaje ("N tiendas cerca tuyo" / "Explorá tu
// ciudad") — lo único nuevo es la etiqueta.
function useBanners(navigate, cantTiendas) {
  return useMemo(() => [
    {
      Icon: MapPin,
      title: cantTiendas > 0 ? `${cantTiendas} tienda${cantTiendas === 1 ? '' : 's'} cerca tuyo` : 'Explorá tu ciudad',
      sub: 'Comercios locales en el mapa',
      cta: 'Próximamente',
      action: () => navigate('mapa'),
      className: 'from-brand-deep via-brand-deep to-brand',
      dots: true,
    },
    {
      Icon: Sparkles,
      title: 'Descubrí tiendas nuevas',
      sub: 'Comercios locales recién sumados a LOKAL',
      cta: 'Explorar tiendas',
      action: () => navigate('tiendas'),
      className: 'from-brand via-brand to-brand-dark',
    },
    {
      Icon: Rocket,
      title: 'Creá tu propia tienda gratis',
      sub: 'Tu catálogo online con link propio en minutos',
      cta: 'Empezar ahora',
      action: () => { window.history.pushState({}, '', '/vender'); window.dispatchEvent(new PopStateEvent('popstate')); },
      // brand-deep→brand-dark, no slate-800/700 (gris azulado genérico
      // fuera de la paleta de marca) — mismo criterio que el resto de
      // slides: cada uno usa un tono real del sistema (--brand/--accent),
      // nunca un gris de Tailwind sin relación con --brand.
      className: 'from-brand-deep via-brand-dark to-brand-dark',
    },
    {
      Icon: Tag,
      title: 'Productos destacados',
      sub: 'Lo más nuevo de todas las tiendas, en un solo lugar',
      cta: 'Ver destacados',
      action: () => navigate('destacados'),
      className: 'from-accent-dark via-accent to-accent-light',
    },
  ], [navigate, cantTiendas]);
}

export default function HomeGlobal({ isDark, toggleTheme, onIrAlPanel }) {
  const [activeCat, setActiveCat] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loadingTiendas, setLoadingTiendas] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(true);

  // Login unificado — un solo modal ("Continuar con Google") disparado
  // desde el avatar del header o desde la bottom-nav; LoginSheet decide
  // internamente si el correo es de una tienda existente (onEsTienda:
  // navega a /admin, reusa el login de dueño de siempre sin tocarlo), de
  // un usuario existente, o si es la primera vez (ahí el propio sheet
  // ofrece "crear tienda" o "cuenta de usuario", sin cerrar y reabrir otro
  // modal — un solo flujo). usuarioActual es el usuario común YA logueado
  // en esta pantalla (null = nadie, o el dueño de una tienda que prefiere
  // ir directo a /admin en vez de quedarse acá).
  const [loginOpen, setLoginOpen] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Header glass — mismo mecanismo que LandingScreen.jsx: transparente en
  // el tope (para que el glow de fondo se vea entero detrás), y recién se
  // enciende el vidrio (blur + fondo translúcido) al pasar 24px de scroll.
  // rAF + comparación contra el valor anterior: el evento de scroll dispara
  // decenas de veces por segundo, sin esto cada uno dispara un re-render.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let pendiente = false;
    let ultimo = null;
    const evaluar = () => {
      pendiente = false;
      const ahora = window.scrollY > 24;
      if (ahora !== ultimo) { ultimo = ahora; setScrolled(ahora); }
    };
    const onScroll = () => { if (pendiente) return; pendiente = true; requestAnimationFrame(evaluar); };
    evaluar();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/tiendas-crud`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (mounted) setTiendas(Array.isArray(data) ? data : []); })
      .catch(() => { if (mounted) setTiendas([]); })
      .finally(() => { if (mounted) setLoadingTiendas(false); });
    fetch(`${API_BASE}/productos-globales?limit=24`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (mounted) setProductos(Array.isArray(data) ? data : []); })
      .catch(() => { if (mounted) setProductos([]); })
      .finally(() => { if (mounted) setLoadingProductos(false); });
    return () => { mounted = false; };
  }, []);

  // Navegación simple dentro de esta pantalla — HomeGlobal no tiene un router
  // interno propio todavía (no hay "product-detail"/"tienda-detail" acá,
  // fuera de scope de esta pasada); los únicos destinos reales son rutas de
  // verdad (una tienda por su slug, o /vender). "tiendas"/"destacados"/"mapa"
  // hacen scroll a su propia sección en esta misma página por ahora.
  const tiendasRef = useRef(null);
  const destacadosRef = useRef(null);
  const catSectionRef = useRef(null);
  const searchInputRef = useRef(null);
  // Modal "Muy pronto" — cubre TODO botón que hoy no tiene pantalla real
  // detrás (mapa interactivo Leaflet real: fase 2 aparte; carrito
  // multi-tienda: ver comentario en HomeGlobalBottomNav). Un solo estado
  // compartido con `content` variable en vez de un modal por feature —
  // banner, botón "Mapa" de Tiendas destacadas y bottom-nav disparan la
  // misma pieza con textos propios.
  const [proximamente, setProximamente] = useState(null);
  const navigate = (dest) => {
    if (dest === 'tiendas') tiendasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (dest === 'destacados') destacadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (dest === 'mapa') setProximamente({
      icono: MapPin, titulo: 'Mapa en camino',
      texto: 'Estamos construyendo el mapa interactivo para explorar tiendas cerca tuyo. Todavía no está listo, pero ya casi.',
    });
  };
  const irATienda = (slug) => { window.history.pushState({}, '', `/${slug}`); window.dispatchEvent(new PopStateEvent('popstate')); };
  const irAVender = () => { window.history.pushState({}, '', '/vender'); window.dispatchEvent(new PopStateEvent('popstate')); };

  // "+" de una card de Destacados — mismo gate en dos pasos que pidió el
  // usuario: sin sesión, primero hay que crear una cuenta (no tiene sentido
  // ofrecer "agregar al carrito" a alguien que no puede guardar nada
  // todavía); con sesión, el carrito multi-tienda real no existe aún (ver
  // onCarrito del bottom-nav, mismo mensaje) — se avisa en vez de fingir
  // que el toque hizo algo. onAdd recibe el producto completo (mismo
  // contrato que QtyControl espera) pero acá no hace falta usarlo, las dos
  // ramas son siempre el mismo destino sin importar qué producto se tocó.
  const agregarAlCarritoGlobal = () => {
    if (!usuarioActual) { setLoginOpen(true); return; }
    setProximamente({
      icono: ShoppingCart, titulo: 'Carrito multi-tienda en camino',
      texto: 'Pronto vas a poder armar un pedido con productos de distintas tiendas desde acá. Todavía no está listo, pero ya casi.',
    });
  };

  const cantTiendas = tiendas.length;
  const banners = useBanners(navigate, cantTiendas);
  const [bannerIdx, setBannerIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 4500); return () => clearInterval(t); }, [banners.length]);

  // ─── Búsqueda en vivo ─────────────────────────────────────────────────────
  const [q, setQ] = useState('');
  const [qOpen, setQOpen] = useState(false);
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const ms = (s) => s?.toLowerCase().includes(query);
    return [
      ...productos.filter((p) => ms(p.nombre) || ms(p.tiendaNombre)).slice(0, 4).map((p) => ({ _t: 'producto', ...p })),
      ...tiendas.filter((t) => ms(t.nombre) || (t.rubros || []).some(ms)).slice(0, 4).map((t) => ({ _t: 'tienda', ...t })),
    ];
  }, [q, productos, tiendas]);
  const selectResult = (item) => {
    setQ(''); setQOpen(false);
    if (item._t === 'tienda') irATienda(item.slug);
    if (item._t === 'producto') irATienda(item.tiendaSlug);
  };

  // ─── Filtro por categoría (rubro) ─────────────────────────────────────────
  const tiendasFiltradas = activeCat
    ? tiendas.filter((t) => (t.rubros || []).includes(activeCat))
    : tiendas;
  const productosFiltrados = activeCat
    ? productos.filter((p) => {
        if (!p.categoryId) return false;
        const path = getCategoryPath(p.categoryId);
        return path.some((c) => c.id === activeCat) || p.categoryId === activeCat;
      })
    : productos;

  const catScrollRef = useRef(null);
  const catEdges = useScrollEdges(catScrollRef);
  const scrollCat = (dir) => catScrollRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });

  // Stops del mask-image del carrusel de categorías — arma explícitamente
  // los 4 casos (sin overflow / solo izq / solo der / ambos) en vez de
  // concatenar strings condicionales, que se vuelve ilegible y frágil.
  const catMaskStops = [
    catEdges.left ? 'transparent, black 32px' : 'black 0px',
    catEdges.right ? 'black calc(100% - 48px), transparent' : 'black 100%',
  ].join(', ');

  return (
    // Fondo en dark: #040a14 fijo (mismo tono que AdminLogin/splash — negro
    // con tinte azulado de marca), no --surface-dim (#080808, "cero azul"
    // por diseño general del sistema) — con el glow celeste y CARD_TINTED
    // que ya tiene esta pantalla, el tinte da más cuerpo a la identidad en
    // vez de un negro neutro. En light sigue bg-surface-dim normal.
    <div className="relative min-h-[100dvh] flex flex-col bg-surface-dim text-ink" style={{
      ...(isDark ? { background: '#040a14' } : null),
      paddingBottom: 'var(--hg-bottom-nav-h, 0px)',
    }}>
      {/* Feedback táctil sistemático — todo elemento interactivo de esta
          pantalla que NO es un <button>/[role="button"] nativo (o que
          necesita algo más que el scale automático de index.css) recibe acá
          su propio hover+press, con el mismo lenguaje que el resto de LINKS
          (transición cubic-bezier con rebote al soltar, color-mix para
          tintar con la marca sin hardcodear un hex por estado). */}
      <style>{`
        /* --lk-chip-precio-fuerte: negro/blanco ABSOLUTO para el número del
           precio dentro del chip de ProductCardGrid en Destacados (ver
           CM.chipColor arriba) — más fuerte que cualquier token de texto
           existente (--text-primary es "casi-negro", no absoluto). Scoped
           acá (no en index.css global) porque es un pedido puntual de esta
           pantalla, no un token que el resto de la app deba heredar. */
        :root { --lk-chip-precio-fuerte: #000; }
        .dark { --lk-chip-precio-fuerte: #fff; }

        .hg-banner { transition: transform .16s ease, filter .15s ease; }
        @media (hover: hover) { .hg-banner:hover { filter: brightness(1.05); } }
        .hg-banner:active { transform: scale(0.98); transition: transform .06s ease; }

        .hg-tienda-card { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), border-color .18s ease, box-shadow .18s ease; }
        @media (hover: hover) { .hg-tienda-card:hover { border-color: rgb(var(--brand, 0 184 217) / 0.35); box-shadow: 0 8px 24px rgba(0,0,0,.08); } }
        .hg-tienda-card:active { transform: scale(0.97); transition: transform .06s ease; }

        .hg-clear-btn { transition: background-color .15s ease, color .15s ease; }
        @media (hover: hover) { .hg-clear-btn:hover { background: var(--surface-solid-2, rgba(0,0,0,.06)); color: var(--text-primary); } }

        /* Solo glow, sin el outline sólido del :focus-visible global de
           index.css — acá se apaga (outline:none) SOLO para este input,
           sin tocar el valor global que sigue usando el resto de la app.
           Un solo box-shadow CON blur (16px) — la capa "0 0 0 4px" que
           tenía antes era spread sin blur, así que dibujaba un anillo
           duro pegado al borde (se leía como un borde grueso extra), no
           un resplandor difuso. */
        /* input.hg-search-input (no solo .hg-search-input): src/styles/
           base.css tiene un selector de TAG genérico ("input, textarea,
           select { border-radius: var(--radius-md) ... }" y su propio
           input:focus con otro border-radius/color) que aplica a CUALQUIER
           <input> del proyecto sin necesitar clase — es un sistema de
           tokens legacy en paralelo (--radius-md = 8px vs los 16px reales
           de --ui-control-radius que usa .ui-input). No se puede borrar esa
           regla global: otros 7 inputs del proyecto dependen de ella hoy.
           Reforzar la especificidad acá (tag + clase) es lo que gana sí o
           sí, sin tocar ese CSS compartido. border-radius explícito en
           AMBOS estados — así no hay ningún punto donde el radio del tag
           legacy se cuele. */
        input.hg-search-input, input.hg-search-input:focus, input.hg-search-input:focus-visible {
          border-radius: var(--ui-control-radius, 1rem);
        }
        input.hg-search-input { transition: box-shadow .15s ease, border-color .15s ease; }
        /* :focus, no :focus-visible — ese solo se activa con teclado en
           algunos navegadores/contextos, con mouse puede no dispararse
           nunca. !important porque en dark el input lleva CARD_TINTED
           como style inline (con su propio borderColor), y un inline
           siempre le gana a una regla CSS normal (ver index.css: el
           border-color !important de ".dark input:not(...)" quedó
           desactivado por este mismo motivo). */
        input.hg-search-input:focus { outline: none; border-color: rgb(var(--brand, 0 184 217) / 0.5) !important; box-shadow: 0 0 20px rgb(var(--brand, 0 184 217) / 0.35); }

        .hg-avatar { transition: filter .15s ease, box-shadow .15s ease; }
        @media (hover: hover) { .hg-avatar:hover { filter: brightness(0.96); box-shadow: 0 4px 16px rgb(var(--brand, 0 184 217) / 0.35); } }
      `}</style>
      {/* Glow de marca — mismo lenguaje que LandingScreen/AdminLogin/splash:
          una luz radial tenue detrás del hero, no un div recortado con
          overflow-hidden (esa combinación hace que Chrome Android recorte
          el degradado contra bordes redondeados en cada frame de scroll y
          deje texto fantasma, mismo caso ya documentado en LegalPages). */}
      <div className="absolute inset-x-0 top-0 pointer-events-none z-0" style={{
        height: '60%',
        background: 'radial-gradient(ellipse 70% 45% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.14), transparent)',
      }} />

      {/* ── Header — glass sticky: en el tope tiene un degradado MÍNIMO
          (no transparente puro) para no verse flotando sin separación del
          contenido de abajo — antes ese aire lo daba la barra de
          categorías, que compartía el header; al moverla debajo del
          banner, el header quedó con muy poco contenido antes de que
          `scrolled` se dispare (24px), y se notaba el salto. Se enciende
          del todo (blur real) al scrollear, mismo mecanismo que
          LandingScreen.jsx. */}
      <div
        className="sticky top-0 z-20 transition-all duration-300"
        style={scrolled ? {
          background: isDark ? 'rgba(4,10,20,.72)' : 'rgba(255,255,255,.72)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        } : {
          background: isDark
            ? 'linear-gradient(to bottom, rgba(4,10,20,.55), rgba(4,10,20,.15))'
            : 'linear-gradient(to bottom, rgba(255,255,255,.6), rgba(255,255,255,.15))',
        }}
      >
        {/* py-4 (1rem, igual que px-4): mismo padding vertical que
            horizontal — los elementos de esquina (logo, avatar) quedan a
            la misma distancia de su borde superior que de su borde
            lateral, así se leen "en su esquina" en vez de apretados
            verticalmente contra un padding horizontal más generoso.
            min-h-14 en vez de h-14: mantiene el alto mínimo de antes pero
            deja que el padding real sume, no lo reemplace. */}
        <div className="max-w-5xl mx-auto px-4 lg:px-6 min-h-14 py-4 flex items-center gap-3">
          {/* size 22→26 (desktop) y 26→30 (mobile) — 32/36 quedó
              demasiado grande, este es el punto intermedio entre el
              original y eso. */}
          <a href="/" className="hidden lg:flex items-center shrink-0 no-underline text-ink">
            <LogoFull size={26} className="text-ink" animado />
          </a>
          <a href="/" className="lg:hidden w-10 h-10 flex items-center justify-center shrink-0 text-ink">
            <LogoSymbol size={30} className="text-ink" animado />
          </a>

          <div className="flex-1 relative max-w-md lg:mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim w-4 h-4 pointer-events-none z-10" />
            {/* Blanco sólido en light (ya estaba bien) — solo en DARK pasa
                a CARD_TINTED (degradado sutil de --brand + borde de marca,
                mismo look de las empty cards): un panel gris neutro plano
                (#1f1f1f) ahí se leía apagado/desconectado del resto de
                piezas ya tintadas de marca. bg-surface-card sigue de base
                para light; CARD_TINTED inline solo se aplica si isDark. */}
            {/* Sin focus:ring-2 manual — el :focus-visible GLOBAL de
                index.css ya pone el outline celeste en toda la app, y
                sumarle un ring de Tailwind acá duplicaba el efecto
                (parpadeo de dos focus distintos). El único ajuste real que
                hacía falta era el border-radius: el global es 8px fijo,
                pero este input redondea a 1rem (--ui-control-radius) — acá
                se corrige SOLO para este input, sin tocar el valor global
                que usa el resto de la app. */}
            <input
              ref={searchInputRef}
              value={q}
              onChange={(e) => { setQ(e.target.value); setQOpen(true); }}
              onFocus={() => setQOpen(true)}
              onBlur={() => setTimeout(() => setQOpen(false), 150)}
              placeholder="Buscar productos y tiendas..."
              className="hg-search-input ui-input w-full pl-10 pr-9 bg-surface-card text-sm text-ink placeholder:text-ink-dim transition-all shadow-sm border border-[var(--border-solid)]"
              style={isDark ? CARD_TINTED : undefined}
            />
            {q && (
              <button onMouseDown={() => setQ('')} aria-label="Limpiar búsqueda"
                className="hg-clear-btn no-press absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full grid place-items-center text-ink-dim">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {qOpen && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-card rounded-2xl shadow-xl border border-[var(--border-solid)] overflow-hidden z-50">
                {results.map((item, i) => (
                  <button key={`${item._t}-${item.id}-${i}`} onMouseDown={() => selectResult(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-card-2 text-left transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-surface-card-2 flex items-center justify-center shrink-0 overflow-hidden">
                      {(item.foto || item.tiendaFoto)
                        ? <img src={item.foto || item.tiendaFoto} alt="" className="w-full h-full object-cover" />
                        : item._t === 'tienda' ? <Store className="w-4 h-4 text-ink-dim" /> : <Tag className="w-4 h-4 text-ink-dim" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-ink">{item._t === 'tienda' ? item.nombre : item.nombre}</p>
                      <p className="text-[10px] text-ink-dim truncate">{item._t === 'tienda' ? (item.rubros || []).join(', ') : item.tiendaNombre}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle de tema sacado del header a pedido explícito — sigue
              disponible en el footer de esta misma pantalla, no hace falta
              repetirlo arriba también. */}
          {/* Blanco sólido en light (ya estaba bien) — solo en DARK pasa a
              CARD_TINTED (mismo look de la barra de búsqueda y las empty
              cards): bg-surface-card sólido (#1f1f1f gris carbón puro) ahí
              se leía apagado/desconectado del resto de piezas tintadas de
              marca. Hover con brightness + sombra, SIN ring: un ring-2 fijo
              que pasa de transparente a --brand de golpe, sumado al scale
              de press que ya aplica el CSS global, se leía como "crece Y le
              sale un borde grueso" a la vez. */}
          <button onClick={() => (usuarioActual ? null : setLoginOpen(true))} aria-label={usuarioActual ? usuarioActual.nombre || 'Tu cuenta' : 'Iniciar sesión'}
            className="hg-avatar ui-avatar-btn shrink-0 bg-surface-card border shadow-md overflow-hidden" style={isDark ? CARD_TINTED : undefined}>
            {usuarioActual?.foto
              ? <img src={usuarioActual.foto} alt="" className="w-full h-full object-cover" />
              : <User className="w-4 h-4 text-ink" />}
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1">
        <div className="max-w-5xl mx-auto pb-10">

          {/* ── Hero único: banner rotativo. El slide de mapa (dots:true)
              absorbe lo que antes era una card separada arriba de esto —
              dos piezas casi redundantes en la misma pantalla se
              unificaron en una sola (ver comentario en useBanners). ── */}
          {/* pt-3 (12px) — sin el border-bottom de 1px que el header tenía
              antes, ya no hay un corte firme que separe ambas piezas; la
              única separación real es el degradado (sutil) más este
              padding. pt-4 completo se sentía con demasiado aire sin ese
              borde marcando el límite — pt-3 es el punto medio entre el
              1rem de "header como pieza propia" y el pt-2 de cuando
              compartía composición con el banner. */}
          <div className="px-4 lg:px-6 pt-3">
            <div className="relative group">
              {/* height FIJO (no minHeight): con solo un mínimo, el slide
                  con el texto más largo ("Creá tu propia tienda gratis" /
                  "Lo más nuevo de todas las tiendas...") seguía pudiendo
                  crecer más que el resto si se envolvía a una línea de más
                  — el line-clamp de abajo evita el envolvido visual, pero
                  sin una altura fija real el contenedor podía igual
                  "respirar" distinto entre slides según el navegador.
                  Fijar el número es lo único que garantiza CERO salto al
                  rotar, sin importar el texto de cada slide. */}
              <div onClick={banners[bannerIdx].action}
                className={`hg-banner bg-gradient-to-br ${banners[bannerIdx].className} rounded-3xl p-6 cursor-pointer select-none shadow-lg relative overflow-hidden`}
                style={{ height: 150 }}>
                {banners[bannerIdx].dots && (
                  <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="hg-dots" x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.4" fill="white" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hg-dots)" />
                  </svg>
                )}
                {(() => { const BIcon = banners[bannerIdx].Icon; return <BIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 text-white opacity-15 pointer-events-none" />; })()}
                <div className="relative">
                  {/* line-clamp-2 también en el título — "Creá tu propia
                      tienda gratis" es más largo que el resto y podía
                      envolverse a 2 líneas en pantallas angostas mientras
                      los demás usaban 1, el mismo salto que tenía el
                      subtítulo. */}
                  <p className="text-white font-black text-xl leading-tight mb-1 line-clamp-2">{banners[bannerIdx].title}</p>
                  {/* line-clamp-2 + minHeight de 2 líneas SIEMPRE reservado
                      (no solo cuando el texto lo necesita): el subtítulo
                      del slide de "Productos destacados" es el más largo de
                      los 4 y se envolvía a 2 líneas mientras el resto usaba
                      1 — eso hacía que la card entera (con minHeight:150
                      como piso, no altura fija) creciera solo en ESE slide,
                      un salto de alto real al rotar entre banners. Con las
                      2 líneas siempre reservadas, el título y el CTA de
                      abajo quedan en la misma posición vertical sin
                      importar cuál slide esté activo. */}
                  <p className="text-white/75 text-sm mb-4 line-clamp-2" style={{ minHeight: '2.6em' }}>{banners[bannerIdx].sub}</p>
                  <span className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-1.5 rounded-xl">
                    {banners[bannerIdx].dots && <MapPin className="w-3 h-3" />}{banners[bannerIdx].cta} →
                  </span>
                </div>
              </div>
              {/* Mismo tamaño (w-7 h-7) y mismo criterio de "sobresalir"
                  que las flechas del carrusel de categorías (NavArrowBtn):
                  antes eran w-8 h-8 y vivían ADENTRO del borde del banner
                  (left-3/right-3) — acá quedan apoyadas sobre el borde, la
                  mitad afuera. En LIGHT ya no son "glass" (blanco/negro
                  translúcido con blur): pasan a blanco sólido + sombra +
                  ícono oscuro, mismo look que las flechas de categorías en
                  light — el glass quedaba fuera de tono al lado de un
                  control sólido. En DARK se mantiene el glass oscuro (con
                  blur, ícono blanco), con un borde tenue: bg-black/20 solo
                  sobre un banner que YA es oscuro (brand-deep) se perdía
                  por falta de contraste. */}
              {/* outline, no border: con dark:backdrop-blur-sm en el mismo
                  elemento, el border quedaba invisible (el blur crea su
                  propio compositing layer y el borde se pintaba "debajo"
                  ópticamente) — outline se dibuja siempre por ENCIMA del
                  contenido/fondo, sin ese problema. outline-offset:-1px lo
                  mete hacia adentro para que no se recorte contra el
                  rounded-full del botón. Color de marca (--brand), no
                  blanco genérico — mismo lenguaje que el borde del input
                  de búsqueda y las empty cards (CARD_TINTED), no un
                  contorno neutro suelto. */}
              <button onClick={(e) => { e.stopPropagation(); setBannerIdx((i) => (i - 1 + banners.length) % banners.length); }}
                className="absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white hover:bg-white/90 shadow-md text-ink dark:bg-black/20 dark:hover:bg-black/35 dark:text-white dark:shadow-none dark:backdrop-blur-sm rounded-full flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                style={{ outline: isDark ? '1px solid rgb(var(--brand, 0 184 217) / 0.5)' : 'none', outlineOffset: -1 }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setBannerIdx((i) => (i + 1) % banners.length); }}
                className="absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white hover:bg-white/90 shadow-md text-ink dark:bg-black/20 dark:hover:bg-black/35 dark:text-white dark:shadow-none dark:backdrop-blur-sm rounded-full flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                style={{ outline: isDark ? '1px solid rgb(var(--brand, 0 184 217) / 0.5)' : 'none', outlineOffset: -1 }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)} aria-label={`Banner ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-5 bg-brand' : 'w-1.5 bg-ink-dim/30'}`} />
              ))}
            </div>
          </div>

          {/* ── Categorías — debajo del banner (no dentro del header
              sticky): en la mayoría de ecommerce reales el buscador queda
              fijo arriba, pero la fila de rubros vive en el flujo normal
              del scroll, no apilada como una segunda barra fija. Se mueve
              con el resto de la página, sin su propio sticky. ── */}
          <div ref={catSectionRef} className="relative max-w-5xl mx-auto group/cat pt-5 scroll-mt-24">
            {/* mask-image en el propio contenedor scrolleable, NO un div de
                color superpuesto en los bordes — el fondo real detrás es un
                glow radial (--brand) que cambia de intensidad según la
                posición X/Y, así que ningún color plano (sólido u opaco)
                puede imitarlo bien en todos los puntos del degradado. El
                mask en cambio no pinta nada: atenúa el propio contenido del
                carrusel hasta transparente en los bordes, dejando ver
                exactamente lo que sea que haya detrás. Solo se aplica del
                lado con overflow real (catMaskStops), para no recortar el
                chip completo cuando no hace falta. */}
            <div ref={catScrollRef} className="flex overflow-x-auto px-4 lg:px-6 pb-3 pt-1 no-scrollbar" style={{
              scrollbarWidth: 'none',
              WebkitMaskImage: `linear-gradient(to right, ${catMaskStops})`,
              maskImage: `linear-gradient(to right, ${catMaskStops})`,
            }}>
              {/* Chip inactivo: bg-surface-card sólido en LIGHT (blanco
                  real — el negro del ícono sobre el tinte celeste
                  translúcido se leía raro/sucio, dos identidades de color
                  compitiendo). En DARK ni blanco ni el gris carbón neutro
                  de bg-surface-card funcionan de fondo para un ícono
                  oscuro — necesita una superficie con más cuerpo/claridad
                  que el fondo de página, no solo el tinte sutil de
                  CARD_TINTED solo (ese degradado por sí solo, sin una base
                  sólida debajo, quedaba casi tan oscuro como el fondo).
                  CHIP_TINTED_DARK combina la MISMA superficie sólida real
                  (--surface-solid-rgb, la que usa bg-surface-card) COMO
                  BASE, con el degradado de --brand encima — mismo patrón
                  que el input de búsqueda/avatar (bg-surface-card + estilo
                  CARD_TINTED juntos, no CARD_TINTED reemplazando la base). */}
              <button onClick={() => setActiveCat(null)} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors border shadow-sm ${!activeCat ? 'bg-brand border-transparent' : 'bg-surface-card border-transparent hover:border-brand/30'}`}
                  style={!activeCat ? undefined : (isDark ? CHIP_TINTED_DARK : undefined)}>
                  <LayoutGrid className={`w-5 h-5 ${!activeCat ? 'text-brand-fg' : 'text-ink'}`} />
                </div>
                <span className={`text-[10px] font-semibold leading-tight text-center ${!activeCat ? 'text-brand' : 'text-ink-dim'}`}>Todos</span>
              </button>
              {catRoot.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)} className="shrink-0 flex flex-col items-center gap-1 w-[58px]">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors border shadow-sm ${activeCat === cat.id ? 'bg-brand border-transparent' : 'bg-surface-card border-transparent hover:border-brand/30'}`}
                    style={activeCat === cat.id ? undefined : (isDark ? CHIP_TINTED_DARK : undefined)}>
                    <CategoryIcon name={cat.icon} className={`w-5 h-5 ${activeCat === cat.id ? 'text-brand-fg' : 'text-ink'}`} />
                  </div>
                  <span className={`text-[10px] font-semibold leading-tight text-center truncate w-full ${activeCat === cat.id ? 'text-brand' : 'text-ink-dim'}`}>
                    {cat.shortName || cat.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
            {/* Flechas: blur real (funciona sobre CUALQUIER fondo, no
                necesita adivinar un hex que calce con el glow) en vez de un
                color sólido — pero el TINTE del blur sí depende del tema:
                negro translúcido en dark, blanco translúcido en light. Un
                negro/15 sobre fondo claro se leía como una mancha gris
                sucia, no como un botón — mismo criterio que el resto de
                controles flotantes claros del proyecto (blanco + sombra).
                Sin distinción en dark: sin sombra ahí (dark:shadow-none),
                el negro/15 con blur solo, sobre el glow oscuro de fondo,
                no se distinguía bien. outline (no border) por el mismo
                motivo que las flechas del banner: con backdrop-blur en el
                mismo elemento, border queda invisible — outline se dibuja
                por encima. Color de marca (--brand), mismo lenguaje que el
                input de búsqueda y las empty cards. */}
            {/* top: calc real, no un número mágico — las flechas son
               `absolute` respecto al contenedor EXTERNO (pt-5 = 20px), que
               envuelve al contenedor scrolleable (pt-1 = 4px) donde recién
               empieza el chip (cuadrado w-11/h-11 = 44px, con el texto
               debajo aparte). Centro real del cuadrado desde el borde del
               externo: 20+4+22 = 46px. Menos la mitad de la propia flecha
               (28px/2=14) para que su CENTRO caiga ahí, no su borde
               superior: 46-14 = 32px. Antes era top-[26px] fijo, calculado
               sin contar el pt-5 externo — quedaban 20px más arriba del
               cuadrado real, alineadas con nada en particular. */}
            {/* lg:opacity-0 lg:group-hover/cat:opacity-100 (no opacity-0
                group-hover/cat:opacity-100 sin prefijo): en mobile no hay
                hover real, así que la flecha nunca llegaba a mostrarse —
                quedaba siempre en opacity-0 pese a que el pointer-events
                del !opacity-0 condicional (catEdges.left/right) SÍ la
                dejaba tocable, un botón invisible pero funcional. Mismo
                criterio que ya usan las flechas del banner (arriba, líneas
                ~564/569): visible por default (solo lg: la esconde salvo
                hover), catEdges sigue siendo la única razón real para
                ocultarla del todo. */}
            <NavArrowBtn dir="left" onClick={() => scrollCat(-1)}
              className={`absolute left-1 top-[32px] w-7 h-7 bg-white/70 hover:bg-white/90 shadow-md dark:bg-black/15 dark:hover:bg-black/25 dark:shadow-none backdrop-blur-sm text-ink dark:text-white z-10 lg:opacity-0 lg:group-hover/cat:opacity-100 transition-opacity ${!catEdges.left ? 'pointer-events-none !opacity-0' : ''}`}
              style={isDark ? { outline: '1px solid rgb(var(--brand, 0 184 217) / 0.5)', outlineOffset: -1 } : undefined} />
            <NavArrowBtn dir="right" onClick={() => scrollCat(1)}
              className={`absolute right-1 top-[32px] w-7 h-7 bg-white/70 hover:bg-white/90 shadow-md dark:bg-black/15 dark:hover:bg-black/25 dark:shadow-none backdrop-blur-sm text-ink dark:text-white z-10 lg:opacity-0 lg:group-hover/cat:opacity-100 transition-opacity ${!catEdges.right ? 'pointer-events-none !opacity-0' : ''}`}
              style={isDark ? { outline: '1px solid rgb(var(--brand, 0 184 217) / 0.5)', outlineOffset: -1 } : undefined} />
          </div>

          {/* ── Destacados de todas las tiendas ── */}
          <div ref={destacadosRef} className="mt-6 scroll-mt-24">
            <div className="px-4 lg:px-6 flex items-center justify-between mb-3">
              <h2 className="font-black text-[15px] text-ink flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand" /> Destacados
              </h2>
            </div>
            {loadingProductos && productosFiltrados.length === 0 ? (
              // Alto del skeleton = ancho de la card (foto cuadrada,
              // aspectRatio 1/1) + CM_GRID_BODY — ya no CM_VERT_IMG fijo:
              // ProductCardVertical (alargada, sin botón "+") se reemplazó
              // por ProductCardGrid (foto cuadrada + precio en chip + "+",
              // mismo patrón 2-por-fila que ya usa CatalogoSection.jsx —
              // pedido explícito: las cards de Destacados eran demasiado
              // altas y sin el botón de agregar). clamp() en vez de un
              // número fijo porque CM_GRID_CARD_W también es un clamp().
              <div className="px-4 lg:px-6 flex gap-3 overflow-hidden">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl bg-surface-card-2 animate-pulse shrink-0"
                    style={{ width: CM_GRID_CARD_W, aspectRatio: `1 / ${1 + CM_GRID_BODY / 148}` }} />
                ))}
              </div>
            ) : productosFiltrados.length === 0 ? (
              // Alto aproximado equivalente al de una fila de cards reales
              // (mismo criterio que antes: no saltar de altura entre
              // cargando→vacío→contenido) — ya no depende de las constantes
              // de la card vertical.
              <div className="px-4 lg:px-6">
                <div className="rounded-3xl border p-6 text-center flex flex-col items-center justify-center" style={{ ...CARD_TINTED, height: 220 }}>
                  <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-6 h-6 text-brand" />
                  </div>
                  <p className="text-sm font-semibold text-ink">{activeCat ? 'Sin productos en esta categoría todavía' : 'Todavía no hay productos publicados'}</p>
                </div>
              </div>
            ) : (
              <div className="px-4 lg:px-6">
                <Carrusel gap={12} padding="4px 2px" border={CM.border} text={CM.txt} surface={CM.surf}>
                  {productosFiltrados.map((p) => (
                    <div key={p.id} style={{ width: CM_GRID_CARD_W, flexShrink: 0 }}>
                      <ProductCardGrid
                        p={p}
                        onOpen={() => irATienda(p.tiendaSlug)}
                        onAdd={agregarAlCarritoGlobal}
                        surf={CM.surf} surf2={CM.surf2} border={CM.border} txt={CM.txt} txtM={CM.txtM}
                        primary={CM.primary} onPrimary={CM.onPrimary}
                        chipBg={CM.chipBg} chipColor={CM.chipColor}
                      />
                    </div>
                  ))}
                </Carrusel>
              </div>
            )}
          </div>

          {/* ── Tiendas destacadas ── */}
          <div ref={tiendasRef} className="mt-7 scroll-mt-24">
            <div className="px-4 lg:px-6 flex items-center justify-between mb-3">
              <h2 className="font-black text-[15px] text-ink flex items-center gap-2">
                <Store className="w-4 h-4 text-brand" /> Tiendas destacadas
              </h2>
              <button onClick={() => navigate('mapa')}
                className="h-7 px-2.5 rounded-full bg-brand/10 hover:bg-brand/15 border border-transparent hover:border-brand/30 flex items-center gap-1.5 text-brand transition-colors text-[11px] font-semibold">
                <MapPin className="w-3 h-3" />Mapa
              </button>
            </div>
            {loadingTiendas && tiendasFiltradas.length === 0 ? (
              <div className="px-4 lg:px-6 flex gap-3 overflow-hidden">
                {[0, 1, 2].map((i) => <div key={i} className="w-52 h-24 rounded-2xl bg-surface-card-2 animate-pulse shrink-0" />)}
              </div>
            ) : tiendasFiltradas.length === 0 ? (
              // Misma altura que el skeleton (h-24/96px) y la card real de
              // tienda (hg-tienda-card) — mismo criterio que Destacados: el
              // padding+contenido de esta card ancha pedían ~128px por
              // defecto, más que el resto de estados de esta sección.
              <div className="px-4 lg:px-6">
                <div className="h-24 rounded-3xl border text-center flex flex-col items-center justify-center" style={CARD_TINTED}>
                  <div className="w-9 h-9 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-1.5">
                    <Store className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-xs font-semibold text-ink px-4 truncate w-full">{activeCat ? 'Sin tiendas en esta categoría todavía' : 'Todavía no hay tiendas publicadas'}</p>
                </div>
              </div>
            ) : (
              <div className="px-4 lg:px-6">
                <Carrusel gap={12} padding="4px 2px" border={CM.border} text={CM.txt} surface={CM.surf}>
                  {tiendasFiltradas.map((t) => {
                    const estado = getEstadoApertura(t.horarios);
                    return (
                      <div key={t.id} onClick={() => irATienda(t.slug)} role="button" tabIndex={0}
                        className="hg-tienda-card w-52 shrink-0 bg-surface-card border border-[var(--border-solid)] rounded-2xl p-4 cursor-pointer select-none">
                        <div className="flex items-center gap-2.5 mb-2.5 pointer-events-none">
                          <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                            {t.foto ? <img src={t.foto} alt="" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-brand" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate text-ink">{t.nombre}</p>
                            <p className="text-[10px] text-ink-dim truncate">{(t.rubros || []).join(', ') || 'Comercio local'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs pointer-events-none">
                          {t.ciudad && <span className="flex items-center gap-1 text-ink-dim truncate"><MapPin className="w-3 h-3 shrink-0" />{t.ciudad}</span>}
                          <span className={`flex items-center gap-1 font-semibold ml-auto shrink-0 ${estado.abierta ? 'text-ok' : 'text-ink-dim'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${estado.abierta ? 'bg-ok' : 'bg-ink-dim/40'}`} />
                            {estado.abierta ? 'Abierto' : 'Cerrado'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </Carrusel>
              </div>
            )}
          </div>

        </div>
      </div>

      <HomeGlobalFooter dark={isDark} toggleDark={toggleTheme} onVender={irAVender} />

      <HomeGlobalBottomNav
        isDark={isDark}
        onInicio={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onMapa={() => navigate('mapa')}
        onTiendas={() => navigate('tiendas')}
        onCuenta={() => (usuarioActual ? null : setLoginOpen(true))}
        onCarrito={() => setProximamente({
          icono: ShoppingCart, titulo: 'Carrito multi-tienda en camino',
          texto: 'Pronto vas a poder armar un pedido con productos de distintas tiendas desde acá. Todavía no está listo, pero ya casi.',
        })}
      />

      <ProximamenteModal
        abierto={!!proximamente}
        isDark={isDark}
        onCerrar={() => setProximamente(null)}
        icono={proximamente?.icono}
        titulo={proximamente?.titulo}
        texto={proximamente?.texto}
      />

      <LoginSheet
        abierto={loginOpen}
        isDark={isDark}
        onCerrar={() => setLoginOpen(false)}
        onEsTienda={onIrAlPanel}
        onEsUsuario={setUsuarioActual}
        // Cuenta nueva (sin tienda ni perfil todavía): mismo destino que
        // onEsTienda (pushState a /admin) — Root.jsx es quien realmente
        // decide qué mostrar ahí (StoreApp, RegistroTienda, o ahora
        // ElegirRolScreen/RegistroUsuario según lo que resuelva su propio
        // whoami). HomeGlobal no necesita saber nada de ese árbol de
        // decisión, solo entregarle el control con la sesión ya activa.
        onNuevo={onIrAlPanel}
      />
    </div>
  );
}

// ── Bottom nav mobile — mismo espíritu que StoreBottomNav.jsx/BottomNav de
// LOKAL Global (padre): 5 posiciones, central elevado, oculta en desktop.
// La pieza nueva acá es el indicador ("guion") que se DESLIZA entre
// posiciones en vez de la pill de fondo estática que usan esos dos — mismo
// mecanismo que el .bnav-underline de MV Distribuciones (proyecto hermano,
// ya pulido): mide la posición real del botón activo con
// getBoundingClientRect() y anima su propio transform:translateX, en vez de
// promediar posiciones por índice — así funciona igual sin importar si
// algún ítem cambia de ancho (ej. textos más largos en otro idioma/tamaño).
//
// El central (Carrito) NO tiene animación de giro: ese gesto es propio de un
// botón que ABRE/CIERRA algo en el lugar donde está parado (el FAB "Crear"
// del admin, o el chat de MV Distribuciones) — achicándose a una X. Acá el
// central navega/abre un modal, una acción de "ir a", no un toggle con dos
// estados — abrir/cerrar no aplica, así que gira solo si en el futuro este
// slot pasa a ser un toggle real (queda anotado para no reinventarlo).
//
// Carrito multi-tienda: no existe todavía (el carrito real de hoy es POR
// TIENDA, CarritoSheet dentro de commerce-modern.jsx — no hay concepto de
// "un carrito para productos de distintas tiendas" ni backend para eso).
// onCarrito (prop) abre el modal ProximamenteModal compartido — ver
// HomeGlobal — en vez de fingir una acción real.
function HomeGlobalBottomNav({ onInicio, onMapa, onTiendas, onCuenta, onCarrito, isDark }) {
  const TABS = [
    { id: 'inicio', label: 'Inicio', Icon: Home, onClick: onInicio },
    { id: 'mapa', label: 'Mapa', Icon: MapPin, onClick: onMapa },
    { id: 'tiendas', label: 'Tiendas', Icon: Store, onClick: onTiendas },
    { id: 'cuenta', label: 'Cuenta', Icon: User, onClick: onCuenta },
  ];
  const [active, setActive] = useState('inicio');
  const navRef = useRef(null);
  const itemRefs = useRef({});
  usePublicarAlturaReal(navRef, true, '--hg-bottom-nav-h');

  // Posiciona la barrita bajo el botón activo — mismo cálculo que
  // moveBnavUnderline() de MV Distribuciones (getBoundingClientRect, sin
  // depender del índice), portado a un ref de React en vez de
  // document.getElementById directo. rAF antes de medir (igual que el
  // window.addEventListener('load', ...) del original): en el primer
  // render, layout/fuentes pueden no estar 100% asentados en el frame en
  // que el efecto corre, y una medida tomada un frame antes de tiempo deja
  // la barrita en una posición ligeramente incorrecta (o en 0,0 si el nav
  // todavía no tiene su ancho final).
  const [underline, setUnderline] = useState(null);
  useEffect(() => {
    const nav = navRef.current;
    const btn = itemRefs.current[active];
    if (!nav || !btn) { setUnderline(null); return; }
    const posicionar = () => {
      const navRect = nav.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const W = 18;
      setUnderline({ left: btnRect.left - navRect.left + btnRect.width / 2 - W / 2, width: W });
    };
    const raf = requestAnimationFrame(posicionar);
    window.addEventListener('resize', posicionar);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', posicionar); };
  }, [active]);

  const handleTab = (tab) => { setActive(tab.id); tab.onClick?.(); };

  return (
    // Mismo glass "enriquecido" que el header/footer/inputs de esta misma
    // pantalla (rgba con tinte de --brand en dark, no un surface-solid
    // plano) — antes esta nav usaba tokens neutros genéricos que desentonaban
    // con el resto de HomeGlobal, todo tintado de marca. position:relative
    // es necesario: sin esto el .hg-nav-underline (absolute) se posiciona
    // contra un ancestro lejano en vez de esta barra, y el translateX
    // calculado con getBoundingClientRect() cae en un punto sin sentido —
    // por eso la barrita no se veía pese a tener la animación correcta.
    <div ref={navRef} className="lg:hidden fixed bottom-0 left-0 right-0 z-[4500]" style={{
      background: isDark ? 'rgba(4,10,20,.82)' : 'rgba(255,255,255,.82)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgb(var(--brand, 0 184 217) / 0.14)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <style>{`
        .hg-nav-underline { position: absolute; bottom: 6px; height: 3px; border-radius: 2px; background: rgb(var(--brand, 0 184 217)); transition: transform .32s cubic-bezier(.34,1.2,.4,1), width .32s cubic-bezier(.34,1.2,.4,1); pointer-events: none; }
        @media (hover: hover) { .hg-nav-item:hover .hg-nav-icon { background: rgb(var(--brand, 0 184 217) / 0.08); } }
        .hg-nav-fab { transition: filter .15s ease, transform .12s cubic-bezier(0.34,1.56,0.64,1); }
        @media (hover: hover) { .hg-nav-fab:hover { filter: brightness(1.06); } }
        .hg-nav-fab:active { transform: scale(0.94); transition: transform .06s ease; }
      `}</style>
      {underline && (
        <div className="hg-nav-underline" style={{ left: underline.left, width: underline.width }} />
      )}
      <div className="relative flex items-end px-1 pt-2 pb-3 max-w-md mx-auto">
        {TABS.slice(0, 2).map((tab) => (
          <button key={tab.id} ref={(el) => { itemRefs.current[tab.id] = el; }}
            onClick={() => handleTab(tab)} className="hg-nav-item flex-1 flex flex-col items-center gap-0.5">
            <div className={`hg-nav-icon w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${active === tab.id ? 'text-brand' : 'text-ink-dim'}`}>
              <tab.Icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-semibold ${active === tab.id ? 'text-brand' : 'text-ink-dim'}`}>{tab.label}</span>
          </button>
        ))}

        {/* Central — más chico y menos elevado que el FAB "Crear" del admin
            (48px vs 56px, -14px vs -22px de antes): a ese tamaño/altura se
            leía "guaso", flotando suelto sobre la barra en vez de parte de
            ella. El anillo del mismo color que el fondo de la nav (no un
            borde blanco fijo — se recalcula por tema) es lo que realmente
            lo integra: "muerde" visualmente el glass de atrás, mismo
            recurso que el halo de --cream del FAB de chat en MV
            Distribuciones. Sombra más corta/tenue (mismo tono de --brand,
            menor blur y alpha) — la anterior era la del FAB de 56px del
            admin, demasiado pesada para un botón de "ir a buscar", que no
            necesita el mismo peso visual que un "Crear" que abre un sheet.
            Carrito, no Buscar: el buscador ya vive en el header, repetirlo
            acá era redundante. Sin backend de carrito multi-tienda todavía
            (ver comentario arriba) — onCarrito abre el modal "Muy pronto"
            compartido (ProximamenteModal, montado en HomeGlobal), mismo
            patrón que MI BOVRIL usa para cualquier botón sin pantalla real
            detrás todavía. */}
        <button onClick={onCarrito} className="flex-1 flex flex-col items-center" style={{ marginTop: -14 }}>
          <div className="hg-nav-fab w-12 h-12 rounded-2xl flex items-center justify-center" style={{
            background: 'rgb(var(--brand, 0 184 217))',
            boxShadow: `0 2px 10px rgb(var(--brand, 0 184 217) / 0.35), 0 0 0 4px ${isDark ? 'rgba(4,10,20,.82)' : 'rgba(255,255,255,.82)'}`,
          }}>
            <ShoppingCart className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="text-[10px] font-semibold mt-1 text-ink-dim">Carrito</span>
        </button>

        {TABS.slice(2).map((tab) => (
          <button key={tab.id} ref={(el) => { itemRefs.current[tab.id] = el; }}
            onClick={() => handleTab(tab)} className="hg-nav-item flex-1 flex flex-col items-center gap-0.5">
            <div className={`hg-nav-icon w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${active === tab.id ? 'text-brand' : 'text-ink-dim'}`}>
              <tab.Icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-semibold ${active === tab.id ? 'text-brand' : 'text-ink-dim'}`}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Footer — mismo lenguaje visual que LandingScreen.jsx (glow tenue de
// --brand en el borde superior, sin panel sólido), pero con los CTAs y el
// link de destino propios de la Home global. Franja CTA arriba, fila de
// logo/tema/KTRL, y fila de legales+copyright — mismas 2 filas que la
// landing (antes esta Home solo tenía la primera, sin legales ni año).
function HomeGlobalFooter({ dark, toggleDark, onVender }) {
  const [legalOpen, setLegalOpen] = useState(false);
  return (
    <>
      <style>{`
        .hg-footer-banner { transition: background-color .15s ease; }
        @media (hover: hover) { .hg-footer-banner:hover { background: color-mix(in srgb, var(--brand-hex) 16%, transparent) !important; } }
        .hg-footer-banner:active { background: color-mix(in srgb, var(--brand-hex) 20%, transparent) !important; }
        {/* Sin opacity en hover: un logo con texto/tinta sólida se ve gris
            apagado al bajarle la opacidad, no como un hover limpio — mismo
            mini-scale que el resto de botones (index.css), sin meterlos en
            un chip con fondo propio (cambiaría el layout del footer para
            un ajuste menor). */}
        .hg-footer-logo, .hg-footer-ktrl { transition: transform .12s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @media (hover: hover) { .hg-footer-logo:hover, .hg-footer-ktrl:hover { transform: scale(1.04); } }
        .hg-footer-logo:active, .hg-footer-ktrl:active { transform: scale(0.93); transition: transform .06s ease; }
        @media (hover: hover) { .hg-footer-theme:hover { background: color-mix(in srgb, var(--brand-hex) 10%, transparent) !important; color: var(--brand-hex) !important; } }
      `}</style>
      <button onClick={onVender} className="hg-footer-banner no-press w-full flex items-center justify-center gap-1.5 px-5 py-2 text-center"
        style={{ background: 'color-mix(in srgb, var(--brand-hex) 10%, transparent)', color: 'var(--brand-hex)', fontSize: 12, fontWeight: 700 }}>
        ¿Tenés un negocio? Creá tu tienda gratis →
      </button>
      {/* Glow tenue de --brand en el borde superior (mismo recurso que el
          footer de LandingScreen.jsx: "el glow desde el borde superior
          separa el footer mejor que una línea de 1px, se lee como parte
          del lenguaje de la página"), sin panel sólido detrás — hereda el
          fondo de la página en vez de un gris propio que desentonaba. */}
      <footer className="relative z-10 mt-2" style={{
        borderTop: '1px solid rgb(var(--brand, 0 184 217) / 0.10)',
        background: 'radial-gradient(ellipse 70% 96px at 50% 0%, rgb(var(--brand, 0 184 217) / 0.10), transparent)',
      }}>
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4">
            <a href="/" className="hg-footer-logo justify-self-start inline-flex items-center gap-1.5 no-underline hover:no-underline text-ink">
              <LogoFull size={22} className="text-ink" />
            </a>
            {/* Mismo fondo+borde que el toggle real de LandingScreen.jsx:
                tinte de marca translúcido en reposo (no transparente hasta
                el hover), con un borde sutil extra en dark que ahí ayuda a
                separarlo del fondo oscuro de página. */}
            <button onClick={toggleDark} aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="hg-footer-theme justify-self-center w-[30px] h-[30px] rounded-[10px] grid place-items-center bg-brand/[0.08] border border-transparent dark:border-brand/[0.18] text-ink-dim transition-colors">
              {dark ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
            </button>
            {/* hover:text-brand — igual que LandingScreen.jsx: acá SÍ se
                pinta con el color de marca en hover (currentColor baja
                hasta KtrlMark), a diferencia del logo de al lado (un <div>
                sin link ni hover en el original, no un <a>). */}
            <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
              className="hg-footer-ktrl justify-self-end inline-flex items-center gap-1.5 no-underline hover:no-underline text-ink hover:text-brand transition-colors">
              <span className="text-[10px] font-semibold">Creado por</span>
              <KtrlMark style={{ height: 11, color: 'currentColor' }} />
            </a>
          </div>

          {/* lok-link-btn: mismo chip real que usa LandingScreen.jsx para
              estos mismos links (ver src/styles/components.css) — antes
              acá eran texto suelto con solo un cambio de color en hover
              (hg-footer-link), sin el fondo/padding que los hace leerse
              como botones en vez de prosa subrayable. */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <nav className="order-1 sm:order-2 flex items-center justify-center gap-x-2 text-xs font-semibold text-ink-dim">
              {/* button con pushState, no <a href="/vender#quienes-somos">:
                  ese hash no existe (la sección real es la ruta separada
                  /quienes-somos, ver Root.jsx) — el <a href> a un fragmento
                  inexistente disparaba una recarga completa de página. */}
              <button onClick={() => { window.history.pushState({}, '', '/quienes-somos'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                className="lok-tap lok-link-btn hover:text-brand">Quiénes somos</button>
              <button onClick={() => setLegalOpen(true)} className="lok-tap lok-link-btn hover:text-brand">Legal</button>
            </nav>
            <p className="order-2 sm:order-1 text-center text-[10px] text-ink-dim">
              © {new Date().getFullYear()} LOKAL. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      <SheetLegal open={legalOpen} onClose={() => setLegalOpen(false)} />
    </>
  );
}
