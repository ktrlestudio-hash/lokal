# Guía para crear un template de TiendaPublica — LOKAL

Pasale este archivo junto con `detail.jsx` como ejemplo y pedile el template que quieras.

---

## Qué es un template

Un template es un único archivo `.jsx` que decide **cómo se ve la página pública de una tienda** (`/t/:slug`). Hay 4 actualmente: `detail`, `minimal`, `tarjetas`, `magazine`. Podés crear uno nuevo sin tocar nada más del sistema.

---

## Props que recibe siempre

```jsx
export function TemplateNombre({ tienda, secciones, cart, onAdd, onRemove, note, isDark }) {}
```

| Prop | Tipo | Descripción |
|------|------|-------------|
| `tienda` | object | Todos los datos de la tienda (ver abajo) |
| `secciones` | array | Secciones activas y en orden (ver abajo) |
| `cart` | array | Items en el carrito `[{ id, nombre, precio, qty }]` |
| `onAdd(producto)` | fn | Agrega un producto al carrito |
| `onRemove(id)` | fn | Quita una unidad del carrito |
| `note` | string | Nota del cliente para el pedido por WhatsApp |
| `isDark` | bool | Modo oscuro activado por la tienda |

---

## Objeto `tienda`

```js
{
  // Identidad
  nombre: string,
  tagline: string,
  descripcion: string,
  rubro: string,
  ciudad: string,

  // Imágenes
  logo: string | null,       // URL
  foto: string | null,       // foto de portada
  galeria: string[],         // array de URLs

  // Contacto
  whatsapp: string,          // número sin formato
  telefono: string,
  instagram: string,         // sin @
  emailContacto: string,
  website: string,

  // Ubicación
  direccion: string,
  lat: number,
  lng: number,

  // Horarios — cada valor es "HH:MM-HH:MM" o null si cierra ese día
  horarios: {
    lunes: string | null,
    martes: string | null,
    miercoles: string | null,
    jueves: string | null,
    viernes: string | null,
    sabado: string | null,
    domingo: string | null,
  },

  // Productos
  productos: Producto[],
}

// Producto
{
  id: string,
  nombre: string,
  descripcion: string,
  precio: number | null,    // null = "consultá precio"
  foto: string | null,
  galeria: string[],
  fotos: string[],
  activo: boolean,
}
```

---

## Array `secciones`

Solo contiene las secciones que el dueño activó, ya ordenadas:

```js
[
  { id: 'hero',      activa: true, orden: 1, label: 'Portada' },
  { id: 'productos', activa: true, orden: 2, label: 'Catálogo' },
  { id: 'horarios',  activa: true, orden: 3, label: 'Horarios' },
  { id: 'contacto',  activa: true, orden: 4, label: 'Contacto' },
  { id: 'galeria',   activa: true, orden: 5, label: 'Galería' },
  { id: 'sobre',     activa: true, orden: 6, label: 'Sobre nosotros' },
  { id: 'mapa',      activa: true, orden: 7, label: 'Ubicación' },
]
```

Para chequear si una sección está activa:
```js
const s = Object.fromEntries(secciones.map(s => [s.id, s]));
if (s.mapa?.activa) { /* mostrar mapa */ }
```

---

## Variables CSS disponibles (paleta dinámica)

El sistema deriva estos CSS vars automáticamente del color que elige la tienda. **Usá siempre estas vars, nunca colores hardcodeados.**

```css
var(--tp-bg)           /* fondo de página */
var(--tp-surface)      /* superficie de card */
var(--tp-surface2)     /* superficie secundaria (inputs, chips) */
var(--tp-border)       /* borde sutil */
var(--tp-text)         /* texto principal */
var(--tp-text-muted)   /* texto secundario */
var(--tp-primary)      /* color de marca de la tienda */
var(--tp-primary-soft) /* versión translúcida del primario (~10% opacity) */
var(--tp-on-primary)   /* blanco o negro según luminancia del primario */
```

En JS:
```js
const bg      = 'var(--tp-bg)';
const surf    = 'var(--tp-surface)';
const primary = 'var(--tp-primary)';
// etc.
```

Para modo oscuro manual dentro del template:
```js
const bg   = isDark ? '#0a0d16' : '#f7f8fa';
const surf = isDark ? '#1e293b' : '#fff';
const txt  = isDark ? '#f1f5f9' : '#0f172a';
const txtM = isDark ? '#94a3b8' : '#64748b';
```

---

## Helpers disponibles

```js
import { buildWhatsAppUrl, getEstadoApertura, formatPrice } from '../utils.js';

// Precio formateado en pesos AR
formatPrice(4500)  // → "$4.500"
formatPrice(null)  // → "A consultar"

// Estado de apertura en tiempo real
const { abierta, texto } = getEstadoApertura(tienda.horarios);
// abierta: true/false
// texto: "Abierto · Cierra a las 18:00" | "Cerrado · Abre a las 09:00"

// URL de WhatsApp con carrito armado
const wa = buildWhatsAppUrl(tienda, cart, note);
// Si la tienda no tiene WhatsApp/teléfono → null
```

---

## Secciones atómicas reutilizables

Podés importar y usar componentes ya construidos en vez de hacerlos desde cero:

```js
import { MapaSection } from '../sections/MapaSection.jsx';
// Renderiza thumbnail del mapa + modal interactivo con routing OSRM
// Props: tienda, isDark
// El mapa es clickeable y abre pantalla completa con "Cómo llegar"

import { HeroSection } from '../sections/Hero.jsx';
// Props: tienda, isDark, variant ('centered'|'split'|'minimal')

import { ContactoSection } from '../sections/Contacto.jsx';
// Props: tienda, isDark, variant ('minimal'|'cards')
```

---

## Tokens de diseño

```js
import { FONT, RADIUS, SHADOW, TRANSITION, SPACING } from '../tokens.js';

FONT.family         // "'Poppins', 'Inter', system-ui, sans-serif"
FONT.size.sm        // "0.85rem"
FONT.size.base      // "1rem"
FONT.size['2xl']    // "1.75rem"
FONT.weight.bold    // 700
FONT.weight.black   // 900

RADIUS.sm   // "8px"
RADIUS.md   // "14px"
RADIUS.lg   // "20px"
RADIUS.xl   // "28px"
RADIUS.full // "9999px"

SHADOW.sm   // "0 1px 8px rgba(0,0,0,.08)"
SHADOW.md   // "0 4px 20px rgba(0,0,0,.12)"
SHADOW.lg   // "0 8px 40px rgba(0,0,0,.18)"

TRANSITION.fast   // "all .12s ease"
TRANSITION.normal // "all .2s ease"
TRANSITION.slow   // "all .35s cubic-bezier(0.16,1,0.3,1)"
```

---

## Animación de entrada (opcional)

```js
const GLOBAL_CSS = `
  @keyframes tp-fade-up {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
`;

// En el JSX
<style>{GLOBAL_CSS}</style>

// En cada sección con delay escalonado
<div style={{ animation: `tp-fade-up .4s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both` }}>
```

---

## Registro automático (OBLIGATORIO)

El sistema detecta templates automáticamente con `import.meta.glob`. Para que un template sea reconocido **debe exportar `META`** en el mismo archivo:

```js
// Al principio del archivo, antes de los imports de React
export const META = {
  label: 'Nombre visible en el editor',   // ej: 'Editorial'
  desc:  'Descripción corta del estilo.', // ej: 'Estilo magazine con hero tipográfico.'
};
```

Y el componente debe exportarse con nombre que empiece en `Template`:
```js
export function TemplateNombre({ tienda, secciones, ... }) { ... }
// ✅ TemplateEditorial, TemplateBoutique, TemplateMinimalPro, etc.
```

**Eso es todo.** No hace falta tocar ningún otro archivo — el renderer lo detecta solo por estar en la carpeta `templates/`.

---

## Esqueleto mínimo de un template nuevo

```jsx
// 1. META primero — el sistema lo detecta automáticamente
export const META = { label: 'Nombre', desc: 'Descripción corta.' };

import React, { useState } from 'react';
import { MapaSection } from '../sections/MapaSection.jsx';
import { buildWhatsAppUrl, getEstadoApertura, formatPrice } from '../utils.js';
import { FONT, RADIUS, SHADOW } from '../tokens.js';

const F = { fontFamily: FONT.family };

export function TemplateNombre({ tienda, secciones, cart, onAdd, onRemove, note, isDark }) {
  const s = Object.fromEntries(secciones.map(s => [s.id, s]));
  const { abierta, texto } = getEstadoApertura(tienda.horarios);
  const wa = buildWhatsAppUrl(tienda, cart, note);

  const bg   = isDark ? '#0a0d16' : '#f7f8fa';
  const surf = isDark ? '#1e293b' : '#fff';
  const txt  = isDark ? '#f1f5f9' : '#0f172a';
  const txtM = isDark ? '#94a3b8' : '#64748b';

  return (
    <div style={{ background: bg, minHeight: '100dvh', ...F }}>

      {/* Hero */}
      {s.hero?.activa && (
        <div style={{ /* tu diseño */ }}>
          {tienda.logo
            ? <img src={tienda.logo} alt="" />
            : <span>{tienda.nombre?.[0]}</span>
          }
          <h1>{tienda.nombre}</h1>
        </div>
      )}

      {/* Productos */}
      {s.productos?.activa && (tienda.productos || []).filter(p => p.activo !== false).map(p => (
        <div key={p.id}>
          <p>{p.nombre}</p>
          <p>{formatPrice(p.precio)}</p>
          <button onClick={() => onAdd(p)}>Agregar</button>
        </div>
      ))}

      {/* Mapa (ya tiene modal interactivo incluido) */}
      {s.mapa?.activa && <MapaSection tienda={tienda} isDark={isDark} />}

      {/* WhatsApp */}
      {wa && <a href={wa}>Pedir por WhatsApp ({cart.length} items)</a>}

    </div>
  );
}
```

---

## Notas importantes

- **No uses Tailwind** — los templates usan inline styles para evitar conflictos con el resto de la app.
- **No hardcodees colores** — usá las CSS vars `var(--tp-primary)` etc. o las variables derivadas de `isDark`.
- **Todos los campos de `tienda` pueden ser null/undefined** — siempre chequeá antes de renderizar.
- **El carrito es opcional** — si tu template no tiene UI de carrito, igual recibís los props. Ignoralos.
- **`createPortal`** — si necesitás un modal full-screen, importá `createPortal` de `react-dom` y montalo en `document.body` para escapar de cualquier `overflow:hidden`.
- **Responsive** — el template se muestra en móvil y escritorio. Usá media queries en un `<style>` tag o manejalo con JS (`window.innerWidth`).
