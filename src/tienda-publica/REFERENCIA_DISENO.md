# Referencia de Diseño — LOKAL Tienda Pública + Home
> Análisis de templates e-commerce reales. Fuente: carpeta `referencia templete/`.
> Usar como base para nuevos templates de tienda pública y rediseño del home de LOKAL.

---

## STACK DISPONIBLE PARA TEMPLATES

> Los templates renderizan **directamente en el DOM** (no en iframes). Todo lo que esté instalado en el proyecto está disponible sin configuración extra.

### ✅ Ya instalado y listo para usar

| Tecnología | Versión | Cómo usarla en un template |
|---|---|---|
| **Tailwind CSS** | v3.4 | Clases directamente en `className`. Arbitrary values: `bg-[#070b14]`, `shadow-[0_20px_50px_rgba(0,0,0,.55)]` |
| **Framer Motion** | v12 | `import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'` |
| **Lucide React** | v0.400 | `import { ShoppingBag, Search, X } from 'lucide-react'` |
| **CSS variables de tienda** | — | `var(--tp-primary)` / `var(--tp-on-primary)` / `var(--tp-bg)` — seteadas automáticamente por `deriveColorPalette()` según el color del store |
| **color-mix()** | CSS nativo | `color-mix(in srgb, var(--tp-primary) 18%, transparent)` — fondo dinámico de categoría activa |
| **Glassmorphism** | CSS/Tailwind | `backdrop-blur-2xl bg-white/[0.08] border-white/[0.12]` |
| **createPortal** | React | `import { createPortal } from 'react-dom'` — para modales sobre todo el DOM |
| **CSS custom keyframes** | Patrón GLOBAL_CSS | Agregar `<style>{GLOBAL_CSS}</style>` en el return — con prefijo único por template (`mk-`, `d3-`, etc.) |

### 🟡 No instalado — agregar si se necesita

| Tecnología | Para qué | Instalar |
|---|---|---|
| **Swiper.js** | Carousels con touch/swipe nativo | `npm i swiper` |
| **GSAP** | Animaciones timeline más complejas que Framer | `npm i gsap` |
| **React Three Fiber** | Efectos 3D / WebGL | `npm i three @react-three/fiber` |
| **Lottie React** | Animaciones vectoriales (JSON) | `npm i lottie-react` |
| **Embla Carousel** | Carousel liviano sin deps | `npm i embla-carousel-react` |

### Convención de template

```jsx
// Cada template debe exportar:
export const META = { label: 'Nombre visible', desc: 'Descripción corta' };
export function TemplateNombre({ tienda, secciones, cart, onAdd, onRemove, note, isDark }) { ... }

// secciones → array (resultado de getSeccionesActivas())
// tienda.productos → array de productos
// cart → array { id, nombre, precio, qty, foto }
// onAdd(producto) / onRemove(id) → manejo del carrito
// var(--tp-primary) → color principal del store (hex automático)
```

---

## FUENTES ANALIZADAS

| Archivo | Stack | Tipo | Utilidad |
|---------|-------|------|----------|
| `nextjs-ecommerce-template-main.zip` | Next.js + Tailwind | E-commerce completo | ⭐⭐⭐⭐⭐ |
| `Shop With Sidebar Page _ CozyCommerce.html` | Next.js + Tailwind | Shop con filtros | ⭐⭐⭐⭐⭐ |
| `Grocery 4 - Bazaar Next.js E-commerce Template.html` | Next.js + MUI | Supermercado/grocery | ⭐⭐⭐⭐ |
| `Vendor Dashboard - Bazaar Next.js E-commerce Template.html` | Next.js + MUI | Dashboard tienda | ⭐⭐⭐⭐ |
| `Bazaar - Next.js E-commerce Template.html` | Next.js + MUI | Landing + demos | ⭐⭐⭐ |
| `Free Next.js eCommerce Boilerplate Template _ NextMerce.html` | Next.js + Tailwind | Boilerplate e-comm | ⭐⭐⭐ |
| `AI Tool - Next.js Template for AI Tools.html` | Next.js + Tailwind | SaaS dark theme | ⭐⭐ (solo home) |
| `psFreeTemplate/website/index.html` | HTML + Bootstrap | Servicios IT | ⭐ |

---

## 1. NEXTJS-ECOMMERCE-TEMPLATE (ZIP — código real)

### ProductCard (`ProductItem.tsx`) — PATRÓN CLAVE
```tsx
<div className="group">
  <div className="relative overflow-hidden flex items-center justify-center
                  rounded-lg bg-[#F6F7FB] min-h-[270px] mb-4">
    <Image src={item.imgs.previews[0]} width={250} height={250} />

    {/* Botones ocultos, suben en hover */}
    <div className="absolute left-0 bottom-0 translate-y-full w-full
                    flex items-center justify-center gap-2.5 pb-5
                    ease-linear duration-200 group-hover:translate-y-0">
      {/* Quick View | Add to Cart | Wishlist */}
    </div>
  </div>

  {/* Rating 5 estrellas */}
  <div className="flex items-center gap-2.5 mb-2">
    {/* 5x icon-star.svg */}
    <p className="text-custom-sm">({item.reviews})</p>
  </div>

  {/* Nombre */}
  <h3 className="font-medium text-dark ease-out duration-200 hover:text-blue mb-1.5">

  {/* Precio tachado + actual */}
  <span className="flex items-center gap-2 font-medium text-lg">
    <span className="text-dark">${item.discountedPrice}</span>
    <span className="text-dark-4 line-through">${item.price}</span>
  </span>
</div>
```

### Sidebar de filtros móvil (`ShopWithSidebar/index.tsx`)
```tsx
// Estado: cerrado = fuera del viewport, abierto = visible
className={`sidebar-content fixed xl:z-1 z-9999 left-0 top-0
  xl:translate-x-0 xl:static max-w-[310px] xl:max-w-[270px] w-full
  ease-out duration-200
  ${productSidebar ? "translate-x-0 bg-white p-5 h-screen overflow-y-auto"
                   : "-translate-x-full"}`}

// Toggle button colgado afuera del sidebar
className={`xl:hidden absolute -right-12.5 sm:-right-8 flex items-center
  justify-center w-8 h-8 rounded-md bg-white shadow-1`}

// Click outside cierra
document.addEventListener("mousedown", handleClickOutside)
```

### Categories Carousel
```tsx
<Swiper slidesPerView={6} breakpoints={{
  0:    { slidesPerView: 2 },
  1000: { slidesPerView: 4 },
  1200: { slidesPerView: 6 },
}}>
```

### HeroFeature — trust strip de 4 iconos
```tsx
const featureData = [
  { img: "icon-01.svg", title: "Free Shipping",       description: "For all orders $200" },
  { img: "icon-02.svg", title: "1 & 1 Returns",       description: "Cancellation after 1 day" },
  { img: "icon-03.svg", title: "100% Secure Payments", description: "Gurantee secure payments" },
  { img: "icon-04.svg", title: "24/7 Dedicated Support", description: "Anywhere & anytime" },
]
// Layout: flex items-center gap-4 (icono 40px + texto)
```

### CSS Global relevante
```css
/* Overlay de hover en imagen */
.group-hover:translate-y-0 { transition: transform ease-linear 200ms; }

/* Dropdown nav */
.dropdown { xl:translate-y-10 xl:opacity-0 xl:invisible → xl:group-hover:opacity-100 }

/* Zoom imagen en detalle */
.img-zoom-container img { transition: 0.8s; }
.img-zoom-container img:hover { transform: scale(2); }

/* Scrollbar oculto */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }

/* Range slider precio */
.priceSlide .noUi-connect { background: blue; }
.range-slider__thumb::after { background: blue; border-radius: 100%; }
```

### Paleta de colores (tailwind.config.ts real)
```
blue:     #3C50E0  (primary CTA)
blue-dark:#1C3FB7
red:      #F23030  (errores, badges)
green:    #22AD5C  (stock, confirmaciones)
yellow:   #FBBF24  (rating stars)
teal:     #02AAA4
orange:   #F27430
dark:     #1C274C  (texto principal)
dark-3:   #606882  (texto secundario)
gray-1:   #F9FAFB  (fondo)
gray-3:   #E5E7EB  (borders)
fondo img:#F6F7FB
```

### Tipografía
- **Euclid Circular A** — geométrica moderna
- Tamaños custom: `heading-1: 60px/72px`, `heading-5: 28px/40px`, `custom-sm: 14px/22px`, `custom-xs: 12px/20px`, `2xs: 10px/17px`
- Transiciones: `ease-out duration-200` (botones), `ease-linear duration-200` (overlays)

### Sombras útiles
```
shadow-1: 0px 1px 2px rgba(166,175,195,.25)
shadow-2: 0px 6px 24px rgba(235,238,251,.40), 0px 2px 4px rgba(148,163,184,.05)
shadow-input: inset 0 0 0 2px #3C50E0
```

---

## 2. COZYCOMMERCE — Shop with Sidebar

### Promo banner top
```html
<p class="text-sm font-medium text-white">
  Get free delivery on orders over $80
</p>
```

### Filtros sidebar (estructura real extraída)
- Categorías con checkbox: `peer-checked:text-blue`
  - Laptop & PC (2), Watches (1), Mobile & Tablets (2), Health & Sports (1), Home Appliances (1), Games & Videos (2), Televisions (1)
- Colors: swatches
- Price: range slider
- Botón "Clean All": `text-blue`

### Badge de descuento / out of stock
```html
<!-- Descuento -->
<span class="px-2 py-1 text-xs font-medium text-white rounded-full bg-blue">
  12% OFF
</span>

<!-- Sin stock -->
<span class="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
  Out of Stock
</span>
```

### Precios
```html
<span class="line-through text-dark-4">$799</span>
<span class="text-dark">$700</span>
```

### Navegación
```
Nav: Popular | Shop | Pages (dropdown) | Blog (dropdown) | Contact
Header: Sign In | Wishlist (0) | Cart (0)
```

### Footer (4 columnas)
```
Help & Support | Account | Quick Link | Download App
+ Trust badges: Visa / PayPal / Mastercard / Apple Pay / Google Pay
```

### Sorting
```html
<select> Latest Products / Best Selling / Old Products </select>
<!-- "Showing 9 of 10 Products" + paginación Prev/Next -->
```

---

## 3. BAZAAR GROCERY 4

### Estructura visual real (MUI)
- Chip "HOT" sobre productos: `MuiChip-labelSmall`
- Precio: `$135.78` + `base-price: $146.00` tachado
- Nombre producto: `MuiTypography-noWrap` (trunca en 1 línea)
- Mega menú categorías: Market / Gadget / Grocery / Fashion / Furniture / Medical / Gift / Health & Beauty

### Patrón grocery único
- Chips de categoría horizontales scrolleables con ícono + label
- Carousel de ofertas con countdown timer
- Selector delivery/pickup en header
- "Delivery in 30 min" badge de urgencia

---

## 4. VENDOR DASHBOARD BAZAAR

### Sidebar del vendedor (estructura real)
```
Admin: Dashboard / Products / Categories / Brands / Orders / Customers / Refunds / Sellers
Vendor: Earnings / Refund Request / Reviews / Shop Setting / Support Tickets / Account Settings / Site Settings / Logout
```

### KPI cards del dashboard
```
Total balance:    15,350.25  (+9350 prev)
Gross Sale:       $10,360.66
Orders:           32,350      (+25.25%)
Sold Items:       2,360       (+2.65%)
Gross Sale:       $12,460.25  (+10.25%)
Total Shipping:   $6,240      (+13.15%)

Weekly Sales:     $10,240  (+25.25%)
Product Share:    39.56%   (+10.25%)
Total Order:      $12,260  (+2.65%)
Market Share:     $14,260  (+2.65%)
```

### Secciones del dashboard
- Analytics: gráfico Sales vs Expense (ApexCharts)
- Recent Purchases
- Stock Out Products

---

## 5. BAZAAR LANDING (DEMOS)

### Demos disponibles por categoría
```
Homepages: Market (2), Gadget (3), Grocery (4), Furniture (3), Fashion (3), Medical, Gift, Health & Beauty
Shop: Sales, Vendor Shop, Search, Product Details, Cart, Checkout, Payment
User Account: Order List/Details, View/Edit Profile, Address, Support Tickets, Wishlist
Vendor Account: Dashboard, Profile, Products (all/add-edit), Orders (all/details)
```

### Hero landing (MUI)
```
Chip "🔥 Trusted by 2000+ developers"
H1: "Build Stunning"
Sub: "30+ ready-to-use pages, TypeScript support..."
Stats: 75+ Ready Pages | 100% TypeScript | SEO Optimized
CTAs: "🚀 Get Bazaar Pro" + "View Live Demo"
```

---

## 6. NEXTMERCE

### Stack
Next.js 14 + Tailwind + Sanity CMS + Stripe + Algolia + NextAuth

### Páginas disponibles (referencia de qué pantallas tener)
- Shop With Sidebar (6 componentes)
- Shop Without Sidebar (2 componentes)
- Checkout (9 componentes)
- Cart (1), Wishlist (1), Contact (1), Error (1)
- Auth: Sign In, Sign Up
- Blog: Grid Sidebar, Grid, Details w/Sidebar, Details

### Feature highlights
- Sanity CMS para gestión de productos y contenido
- Algolia para búsqueda rápida
- Stripe para pagos
- One-click deploy en Vercel

---

## 7. AI TOOL (dark theme — útil para HOME de LOKAL)

### Hero
```
H1: "OpenAI + Next.js SaaS Boilerplate and Starter Kit"
Sub: "Ideal for developers looking to build SaaS applications"
CTA: "Try AI Examples"
Decorativos: blur-02.svg...blur-24.svg (círculos blur como capas de profundidad)
```

### Feature cards (grid 3 cols)
```
OpenAI Integration | Next.js 13, React 18, TS | Auth, DB, Sanity Blog
Cutting-edge Technologies | Pre-made AI Examples | Rich Documentation
```

### Testimonios "Wall of love"
Grid de avatares + nombre + @handle — patrón aplicable a reseñas de tiendas LOKAL

### Pricing
3 tiers (Starter/Medium/Business) — mismo formato útil para planes LOKAL

### Clases CSS dark theme rescatables
```
hero bg: fondo oscuro + blur layers
h1: "text-3xl font-extrabold text-white sm:text-5xl xl:text-heading-1"
feature h3: "text-lg font-semibold text-white"
p body: "mx-auto max-w-[500px] font-medium"
```

---

## 8. PSFREELANCER (HTML + Bootstrap)

### Estructura de header (Bootstrap clásico)
```html
<header class="header header-minimal">
  <nav class="header-fixed">
    <div class="col-auto d-none d-xl-block"> <!-- desktop nav -->
    <div class="col-auto d-block d-xl-none"> <!-- mobile hamburger -->
      <div class="main-mnu-btn">
        <span class="bar bar-1"></span>  <!-- hamburger lines -->
```

### Cards de servicios
```html
<a class="iitem item-style iitem-hover">
  <div class="iitem-icon">          <!-- ícono grande -->
  <div class="iitem-icon-bg">       <!-- ícono de fondo decorativo -->
  <h3 class="iitem-heading">        <!-- título -->
  <div class="iitem-desc">          <!-- descripción -->
```

### Botones
```html
<a class="btn btn-border btn-with-icon btn-small ripple">
  <svg class="btn-icon-right">...</svg>
</a>
```

---

## TEMPLATES IMPLEMENTADOS

### Sistema de templates
- Registro en `src/tienda-publica/tokens.js` → `TEMPLATES` object
- Auto-detección via `import.meta.glob('./templates/*.jsx', { eager: true })`
- Convención: cada archivo exporta `export const META = { label, desc }` + `export function TemplateNombre({ tienda, secciones, cart, onAdd, onRemove, note, isDark })`
- `secciones` llega como array (resultado de `getSeccionesActivas()`)
- CSS vars `var(--tp-primary)` / `var(--tp-on-primary)` seteadas por `deriveColorPalette()` en `TiendaPublicaRenderer`
- Tailwind + Framer Motion disponibles nativamente (templates NO están en iframes)
- Para preview con datos mock: `TiendaPublicaRenderer` con objeto `tienda` que incluya `tienda.productos[]` y `tienda.pagina.template`

### Template "detail" / "detail-3" (ya existe)
- Hero cinético con parallax + logo integrado
- Glassmorphism en chips y card de acciones
- Tilt 3D en producto cards + shimmer skeleton
- **Mejor para:** boutiques, moda, servicios premium, gastronómico moderno

### Template "market" ✅ IMPLEMENTADO
> `src/tienda-publica/templates/market.jsx` — `export function TemplateMarket`
- Siempre dark (#080c18, #0e1525) — ignora modoOscuro del store
- HeroBanner: cover image full-bleed + gradiente + logo + nombre + chips de categoría + CTA scroll al catálogo
- SidebarDesktop sticky: branding, filtros, horarios, trust, contacto
- ProductCard full-bleed: imagen cubre toda la card, gradiente overlay, nombre+precio+botón en bottom
- Bottom nav mobile (clase `.mk-bnav`)
- Pop animation en botón add-to-cart
- CSS prefijo `mk-` para evitar colisiones

### Template "minimal-pro" ✅ IMPLEMENTADO
> `src/tienda-publica/templates/minimal-pro.jsx` — `export function TemplateMinimalPro`
- Sin hero, arranca directo en productos
- Lista vertical (`ProductRow`): imagen 60×60 + nombre + desc + precio + add
- Agrupa por categoría cuando no hay filtro activo
- Header 3 filas: logo+nombre+status / search / chips categoría
- Footer 2 cols: trust badges + horario resumen
- **Mejor para:** profesionales, servicios, consultoras, catálogos chicos

### Template "market-dark" ✅ IMPLEMENTADO
> `src/tienda-publica/templates/market-dark.jsx` — `export function TemplateMarketDark`
- Igual a market.jsx pero con prefijo CSS `md-` (evita colisión si ambos se previsualizan)
- Código legible (no comprimido)

### Template "✦ Premium" ✅ IMPLEMENTADO — FLAGSHIP 2026
> `src/tienda-publica/templates/premium.jsx` — `export function TemplatePremium`
> Requiere: `framer-motion` (instalado) + `lucide-react` (instalado)

**Tecnologías:**
- Framer Motion: `motion.*`, `AnimatePresence`, `useScroll`, `useTransform`, variantes stagger
- Tailwind: `bg-[#070b14]`, `backdrop-blur-2xl`, `rounded-[28px]`, arbitrary values
- `color-mix(in srgb, var(--tp-primary) 18%, transparent)` para fondos de categoría activa
- `createPortal(jsx, document.body)` para el modal de carrito

**Variantes de animación:**
```js
const fadeUp  = { hidden:{opacity:0,y:20}, show:{opacity:1,y:0, transition:{duration:0.45,ease:[0.22,1,0.36,1]}} }
const stagger = { hidden:{}, show:{transition:{staggerChildren:0.06,delayChildren:0.1}} }
const cardVar = { hidden:{opacity:0,y:24,scale:0.97}, show:{opacity:1,y:0,scale:1,...} }
const slideUp = { hidden:{opacity:0,y:'100%'}, show:{opacity:1,y:0}, exit:{opacity:0,y:'100%'} }
```

**Parallax hero:**
```js
const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start','end start'] });
const imgScale   = useTransform(scrollYProgress, [0,1], [1.08,1.18]);
const imgOpacity = useTransform(scrollYProgress, [0,0.8], [0.55,0.2]);
const contentY   = useTransform(scrollYProgress, [0,1], [0,60]);
```

**Componentes:**
- `Hero`: parallax + ambient glow orbs con `var(--tp-primary)` + logo + AnimatePresence search
- `Sidebar` (desktop): Framer Motion slide-in, category highlight con `color-mix()`
- `ProductCard`: `motion.article` whileHover, `motion.img` hover scale, AnimatePresence badge
- `CartModal`: `createPortal` + AnimatePresence + slideUp variant
- Bottom nav mobile: `motion.button` whileTap spring
- CTA flotante: AnimatePresence fade in/out según cart.length
- **Mejor para:** marcas con identidad fuerte, moda premium, tech, cualquier tienda que quiera impacto visual máximo

---

## LO MEJOR PARA EL HOME DE LOKAL

> El home es un e-commerce de descubrimiento de tiendas (no landing page de info del servicio)

### Patrón recomendado: Bazaar Grocery + CozyCommerce fusionados

**Header sticky:**
```
[Logo LOKAL]  [Buscar tiendas o productos...🔍]  [📍 Ciudad]  [👤]
```

**Promo banner top:**
```
"Tiendas locales cerca tuyo · Pedidos por WhatsApp · Sin comisiones"
```
→ mismo patrón que CozyCommerce (`text-sm font-medium text-white bg-primary py-2`)

**Category chips horizontales (como Bazaar Grocery):**
```
🛒 Almacén | 💊 Farmacia | 🍕 Gastro | 👗 Moda | 🔧 Ferretería | 🐾 Pets | ...
```
→ Swiper con breakpoints: `0→3 items / 768→5 / 1200→8`

**Grid de tiendas (adaptado de ProductItem):**
```
Card tienda:
  [imagen hero 16:9]
    badge: "Abierto" (verde) / "Cerrado" (rojo)
    badge: "⭐ 4.8"
  [logo 40px circular] [Nombre tienda] [Rubro]
  [📍 Barrio · 🚚 Envío disponible]
  [CTA: Ver tienda →]
```
→ Grid: `col-12 mobile / col-md-6 tablet / col-lg-4 desktop`

**Trust strip (HeroFeature pattern):**
```
🏪 +200 tiendas · 📍 Tu ciudad · 💬 WhatsApp directo · 🆓 Sin comisiones
```

**Sección "Tiendas destacadas" (como BestSeller):**
→ Scroll horizontal con cards grandes

**Sección "Por categoría" (como Categories carousel):**
→ Grid de categorías con imagen de fondo + nombre overlay

**Footer (4 columnas como CozyCommerce):**
```
LOKAL | Para tiendas | Para compradores | Descargar app
+ Redes sociales + "Hecho en Argentina 🇦🇷"
```

### Paleta para HOME (fusión de lo mejor)
```
Primary:    #E4002B  (rojo LOKAL, ya definido)
Success:    #22AD5C  (verde — tienda abierta, confirmaciones)
Danger:     #F23030  (rojo — cerrado, sin stock)
Warning:    #FBBF24  (amarillo — rating stars)
Fondo:      #F8FAFC  (slate-50, no blanco puro)
Card bg:    #FFFFFF
Texto:      #1C274C
Texto-2:    #606882
Border:     #E5E7EB
```

### Tipografía para HOME
- Poppins (ya en uso) — para headings y brand
- Inter (ya en uso) — para body y UI
- Misma escala que NextMerce: H1 bold/extrabold, body `font-medium`

---

## PATRONES CSS UNIVERSALES RESCATADOS

```css
/* Hover reveal de acciones en card */
.card-actions {
  position: absolute; bottom: 0; left: 0; width: 100%;
  transform: translateY(100%);
  transition: transform 200ms ease-linear;
}
.card:hover .card-actions { transform: translateY(0); }

/* Badge porcentaje */
.badge-off {
  position: absolute; top: 8px; left: 8px;
  padding: 2px 8px; border-radius: 999px;
  background: #F23030; color: white;
  font-size: 10px; font-weight: 700;
}

/* Sidebar drawer móvil */
.sidebar {
  position: fixed; left: 0; top: 0; height: 100vh;
  transform: translateX(-100%);
  transition: transform 200ms ease-out;
}
.sidebar.open { transform: translateX(0); }

/* Scrollbar oculto en carousels */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }

/* Category chip activo */
.chip { background: #f1f5f9; border-radius: 999px; padding: 6px 14px; }
.chip.active { background: var(--primary); color: white; }

/* Precio tachado */
.price-original { text-decoration: line-through; color: #8D93A5; font-size: 13px; }
.price-current  { font-weight: 700; font-size: 16px; color: #1C274C; }

/* Trust strip */
.trust-item { display: flex; align-items: center; gap: 8px; }
.trust-item svg { color: var(--primary); }

/* Zoom imagen al hover */
.img-zoom { transition: transform 0.5s ease; }
.img-zoom:hover { transform: scale(1.06); }
```

---

## ANIMACIONES RESCATADAS

| Nombre | CSS | Uso |
|--------|-----|-----|
| Fade up | `opacity:0;translateY(20px)` → `opacity:1;translateY(0)` | Entrada de secciones |
| Hover reveal | `translateY(100%)` → `translateY(0)` | Botones en card |
| Chip width | `width:6px` → `width:20px` | Dots de carousel |
| Dropdown | `opacity:0;translateY(10px)` → `opacity:1;translateY(0)` | Menús |
| Shimmer | `background-position:-200%→200%` (1.6s infinite) | Skeleton loaders |
| Marquee | `translateX(0)` → `translateX(-50%)` (linear infinite) | Logo carousel |
| Scale press | `scale(1)` → `scale(0.93)` on active | Botones táctiles |

---

*Archivo generado: 2026-05-26. Fuente: análisis manual de templates en `referencia templete/`.*
