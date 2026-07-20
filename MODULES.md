# Sistema de módulos de LOKAL LINKS

LOKAL LINKS es la **plantilla base modular** del ecosistema: el núcleo real
del código (hero, footer, bottom-nav, auth, tienda pública) es común a
cualquier tienda, y cada funcionalidad de negocio específica (galería de
ofertas, catálogo con carrito, alquileres, viajes...) es un **módulo**
independiente que se activa o no por tienda.

Esto es al revés del orden histórico del proyecto: antes, LOKAL COMIDAS
RAPIDAS existía como fork mutado del ecosistema con su propia lógica de
carrito/catálogo hardcodeada. A partir de ahora, LOKAL LINKS es la base, y
lo que haga falta migrar de comida rápida (o crear para viajes, alquileres,
etc.) se porta HACIA acá como un módulo nuevo, no al revés.

**Visión (no implementada todavía, solo el primer módulo lo es)**: no solo
"ofertas" o "catálogo" son módulos — mapa, horarios y hasta el propio
carrito deberían terminar siendo secciones tan dinámicas como cualquier
otra, activadas/completadas por el dueño desde el panel según el rubro de
su tienda. La idea final es pulir comida rápida usando esta misma base
modular en vez de mantener su lógica hardcodeada por separado.

Hay dos lugares distintos donde un módulo puede manifestarse, y no todo
módulo necesita ambos:

1. **Sección dentro del body** (`s.<modulo>?.activa` en el template) — el
   caso normal, ej. la grilla de Ofertas o el Catálogo.
2. **Ítem propio en el `TiendaNavBar`** (el bottom-nav de la tienda
   standalone) — reservado para funcionalidad que amerita acceso directo de
   un toque, como ya pasa con Mapa/Horarios/Compartir hoy. No todo módulo
   nuevo necesita un botón ahí: se evalúa caso por caso si la funcionalidad
   es lo bastante central para el rubro como para ganarse un lugar en esa
   barra (espacio limitado — hoy son 3 ítems, no hay lugar para que cada
   módulo futuro sume uno sin criterio).

## El mecanismo real (NO es un booleano suelto)

Cada tienda (`data/tiendas.json`, mismo dato que ya usa todo el ecosistema)
tiene `pagina.secciones`, y este sistema de módulos NO inventa un mecanismo
paralelo — usa exactamente el mismo que ya existía para el editor visual
"Mi página" (`src/tienda-publica/tokens.js` → `SECCIONES_DEFAULT`,
resuelto por `resolvePagina()`/`getSeccionesActivas()` en
`src/tienda-publica/utils.js`). Cada sección es un objeto, no un booleano:

```json
{
  "pagina": {
    "secciones": {
      "hero":      { "activa": true,  "orden": 1, "label": "Portada", "desc": "..." },
      "productos": { "activa": true,  "orden": 2, "label": "Catálogo", "desc": "..." },
      "horarios":  { "activa": true,  "orden": 3, "label": "Horarios", "desc": "..." },
      "ofertas":   { "activa": false, "orden": 8, "label": "Ofertas", "desc": "..." }
    }
  }
}
```

Un módulo de negocio (ofertas, catálogo, y a futuro alquileres/viajes) es
**una sección más** dentro de este mismo objeto — el dueño la activa,
desactiva y reordena desde el mismo panel donde ya maneja horarios, galería
o "sobre nosotros". No hay dos sistemas de configuración conviviendo.

- **`SECCIONES_DEFAULT`** (`src/tienda-publica/tokens.js`) es la fuente de
  verdad del lado FRONTEND — ahí hay que declarar toda sección con UI,
  incluidos los módulos de negocio.
- **`MODULES`** (`netlify/functions/_lib/modules.js`) es el espejo del lado
  BACKEND — mismos ids/orden, usado para calcular los defaults al crear la
  tienda y para el chequeo de autorización antes de escribir datos.
- **`rubros[]`** (ya existía en el esquema) sugiere qué módulos activar por
  default al crear la tienda vía `RUBRO_DEFAULTS`. Es un preset, no una
  jaula: el dueño puede combinar cualquier módulo con cualquier rubro.
- **`isModuleActive(tienda, 'ofertas')`** es el único chequeo que necesita
  hacer el backend de un módulo antes de operar. Falla "cerrado" (false) si
  la tienda no tiene la sección configurada o `activa` es false.
- El **frontend** hace el mismo chequeo antes de renderizar — ver
  `s.ofertas?.activa` en `commerce-modern.jsx`, mismo patrón que ya usaba
  `s.productos?.activa` o `s.mapa?.activa`.

## Módulos existentes

| Módulo | Backend | Frontend | Descripción |
|---|---|---|---|
| `ofertas` | `ofertas.js` + `oferta-ssr.js` | Sección en `commerce-modern.jsx` (grid imagen+nombre+compartir) | Galería de imágenes con `/o/:tiendaSlug/:ofertaSlug` y Open Graph dinámico al compartir — pieza confirmada ausente en el resto del ecosistema (ni el padre ni `TiendaPublicaRenderer` genera OG por ítem individual). |
| `catalogo` (alias de la sección histórica `productos`) | `tiendas-crud.js`/legado de comida rápida | Sección `productos` ya existente | Productos con precio, stock y carrito. Heredado tal cual de comida rápida — sin auditar/conectar a `isModuleActive` todavía. |

## Cómo agregar un módulo nuevo

1. Declararlo en `SECCIONES_DEFAULT` (`src/tienda-publica/tokens.js`) con
   `{activa: false, orden, label, desc}` — el frontend ya sabe listarlo en
   el editor de "Mi página" sin más cambios.
2. Declararlo también en `MODULES` (`netlify/functions/_lib/modules.js`),
   mismo `label`/`desc`/`orden`, para que el backend calcule sus defaults.
3. Sumar qué rubros lo activan por default en `RUBRO_DEFAULTS` (opcional —
   un módulo puede no tener ningún rubro que lo autoactive, y quedar
   disponible solo para que el dueño lo prenda a mano).
4. Escribir su backend como function(es) propia(s) en `netlify/functions/`,
   siguiendo el patrón de `ofertas.js`:
   - Leer/escribir su propio archivo de datos (`data/<modulo>.json` en R2,
     mismo patrón `isR2Configured()`/`readX()`/`writeX()`).
   - Llamar `isModuleActive(tienda, '<modulo>')` antes de cualquier
     operación de escritura (crear/editar/eliminar).
   - Si el módulo necesita compartir ítems individuales con preview
     enriquecido (WhatsApp/Facebook), sumar un `<modulo>-ssr.js` siguiendo
     `oferta-ssr.js` — SSR real con meta tags OG, nunca 404 duro (pantalla
     de "ya no disponible" con botón de vuelta).
5. Sumar el redirect en `netlify.toml` si el módulo tiene rutas propias
   tipo `/o/...`, antes del catch-all `/* → index.html`.
6. Renderizar su sección en `commerce-modern.jsx` (o el template que
   corresponda) leyendo `s.<modulo>?.activa` — mismo patrón que la sección
   de Ofertas ya agregada, junto a `s.mapa?.activa`/`s.productos?.activa`.

## Por qué esto es compatible con el ecosistema LOKAL global

`pagina.secciones` vive dentro del mismo objeto `tienda{}`, en el mismo
`data/tiendas.json` que ya lee/escribe `tiendas-crud.js` (el CRUD real del
padre). No hay dato paralelo ni migración pendiente: el día que LOKAL
(home/mapa global) quiera listar "todas las tiendas con el módulo ofertas
activo", es un filtro directo:

```js
tiendas.filter(t => t.pagina?.secciones?.ofertas?.activa)
```

Ver también `E:\Katriel Pc\WEB\2026\ecosistema LOKAL\ARQUITECTURA-ECOSISTEMA.md`
para el panorama completo de los 3 proyectos del ecosistema.
