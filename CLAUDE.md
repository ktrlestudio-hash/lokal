# LOKAL — reglas de proyecto (tienda-publica / commerce-modern)

## ⚠️ LEER PRIMERO: plan de recorte vigente

Antes de tocar cualquier pantalla fuera de `tienda-publica/`, leer
**`../MEMORIA_ANALISIS_PROYECTO.md` §8** (carpeta padre de `LOKAL/`, es decir
`ecosistema LOKAL/LOKAL COMIDAS RAPIDAS/MEMORIA_ANALISIS_PROYECTO.md`) — ahí
está el plan concreto y ya acordado con el usuario (2026-07-10) de qué
borrar (Demandas, Oportunidades, Viajes, Feed — el usuario tiene backup
completo, no hace falta ocultar con flags, se borra de verdad), qué queda
oculto (Mensajes/Chat), cómo se rediseña el Home (fusión buscador + chips +
carrusel de destacados con las mismas cards de `commerce-modern`, dropdown
de búsqueda existente fusionando `ProductDetailScreen`/`ProductDetailModal`),
el panel de vendedor simplificado, y el panel admin global (auditar antes
de tocar). Si el usuario pide "seguir el plan" o "minimizar/borrar lo que
sobra", es a ESE documento al que se refiere — no asumir alcance sin leerlo.

---

Contexto: LOKAL se está recortando a un solo caso de uso — comidas rápidas —
sobre `src/tienda-publica/` con el template `commerce-modern.jsx` como única
vista de tienda (no elegir entre los ~11 templates viejos). Ver
`MEMORIA_ANALISIS_PROYECTO.md` en la carpeta padre para la visión completa.

## Paleta / tokens de color — UN SOLO lugar de verdad

- Los tokens `--tp-*` (usados en todo `tienda-publica/`) son **alias**, no
  una paleta paralela. Viven definidos en `src/index.css` §4.bis
  (`--surface-solid`, `--surface-solid-2`, `--text-primary`,
  `--text-secondary`, `--border-solid`) y en `--surface`/`--surface-dim`
  (§4). `deriveColorPalette()` en `tienda-publica/utils.js` solo calcula
  `--tp-primary`/`--tp-primary-soft`/`--tp-on-primary` (el color de marca
  configurable por tienda) — todo lo demás son `var(...)` apuntando a esos
  tokens reales.
- **Nunca hardcodear un hex de superficie/texto en un componente nuevo.**
  Si hace falta un color nuevo (ej. otro nivel de superficie), agregarlo en
  `index.css` §4.bis, con su par `:root`/`.dark`, no en el componente.
- **Cuidado con variables RGB-sin-función** (`--surface`, `--surface-dim`,
  `--brand`, etc. — formato `"R G B"` pensado para
  `rgb(var(--surface-dim))` de Tailwind). Usarlas directo como
  `var(--surface-dim)` en un `background` produce un color inválido y el
  navegador NO cae al fallback (`var(x, fallback)` solo fallback si la
  variable no existe, no si su valor es inválido). Siempre envolver en
  `rgb(...)`.
- Colores semánticos fijos que **no deben togglear** con el tema: verde
  WhatsApp (`#25D366`), rojo de descuento (`#ef4444`), amarillo de estrella
  (`#fbbf24`), verde/rojo abierto-cerrado (`#16a34a`/`#ef4444`). Son
  intencionales, no un bug de contraste.
- Antes de tocar la paleta dark, medir contraste real (no a ojo). Ejemplo
  de script rápido:
  ```
  node -e "function lum(h){h=h.replace('#','');const r=parseInt(h.slice(0,2),16)/255,g=parseInt(h.slice(2,4),16)/255,b=parseInt(h.slice(4,6),16)/255;const lin=c=>c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);}function contrast(a,b){let l1=lum(a),l2=lum(b);if(l1<l2)[l1,l2]=[l2,l1];return(l1+0.05)/(l2+0.05);}console.log(contrast('#hex1','#hex2').toFixed(2)+':1');"
  ```
  Mínimo AA: 4.5:1 para texto normal, 3:1 para texto grande/UI. Escalera de
  superficies (fondo→card→input) no necesita ese ratio, pero sí un salto de
  luminosidad perceptible (evitar diferencias tipo 1.1:1, casi indistintas).
- **Controles de la misma jerarquía visual usan el mismo token.** Si el
  input de búsqueda usa `surf2`, el botón de toggle de vista y los chips de
  categoría de al lado también — mejor aún, que compartan la MISMA clase
  CSS (`.cm-input`) en vez de duplicar `background`/`color` en cada
  `style` inline, para que un ajuste futuro no requiera tocar 3 lugares.
- `:focus-visible` global de LOKAL usa `outline: 2.5px solid
  var(--brand-hex)` (turquesa fijo) — correcto para el resto de la app,
  pero compite mal con la paleta de marca de la tienda (puede ser
  cualquier color). Los controles de `tienda-publica` pisan esto con su
  propio `:focus-visible { outline: ... var(--tp-primary) }`.

## Modo claro/oscuro — UNO SOLO para toda la interfaz

- No crear un sub-modo aislado por tienda. `TiendaPublicaRenderer` acepta
  `isDark`/`onToggleTheme` como props opcionales:
  - Si vienen (navegación logueada desde dentro de LOKAL, `Root.jsx` los
    pasa) → se usan tal cual, es el mismo estado de toda la app.
  - Si no vienen (`standalone`, ej. link público `/t/:slug` sin sesión) →
    estado local propio, sembrado con `pagina.modoOscuro`, y ESE estado
    local también hace `document.documentElement.classList.toggle('dark')`
    real — el mismo mecanismo que usa la app, no una variable nueva.
- Cualquier botón de toggle nuevo en cualquier pantalla de `tienda-publica`
  debe cambiar ese mismo estado compartido, nunca uno propio aislado.

## Layout de cards — lecciones de esta sesión (evitar repetir)

- **Alto de card: SIEMPRE fijo (`height`), no `minHeight`.** Pensar el
  valor para el caso NORMAL (título 1 línea), no el peor caso (3 líneas) —
  si se calcula para el peor caso, sobra aire en el 95% de los productos
  reales. Un título excepcionalmente largo se corta con clamp, no estira
  la card.
- **Foto cuadrada: ancho y alto en `px` fijos e iguales**, nunca
  `aspect-ratio` combinado con `alignItems:stretch`/flex ambiguo (rompe: el
  navegador puede expandir la foto a pantalla completa por referencia
  circular de tamaño). Si hace falta que la foto siga la altura del texto
  de al lado, usar CSS Grid con columnas de `px` fijos, no flexbox suelto.
- **Grid de N columnas > flexbox anidado** para layouts tipo "foto | texto
  | stats": cada celda tiene un rol fijo, sin ambigüedad de quién se
  estira. Si dos celdas comparten fila y una crece (ej. descripción larga),
  usar `alignSelf: 'start'` en AMBAS para que no se estiren mutuamente.
- **Selector de cantidad (`QtyControl`): un solo diseño para todas las
  cards** (horizontal y vertical). No usar overlays flotantes
  (`position: absolute` sobre la foto) para "resolver" que tape el precio
  — mejor mantenerlo siempre en el flujo normal de la fila precio+control,
  aunque la card sea angosta y se apriete un poco. Consistencia visual >
  optimizar el caso de una card angosta.
- **Título vs. descripción, reparto dinámico de líneas**: componente
  `TituloDescripcion` mide con `ResizeObserver` cuántas líneas ocupa el
  título real y le da a la descripción `maxLineasTotal - lineasTitulo`
  líneas. El título tiene su propio tope (`maxLineasTitulo`) que nunca
  cede — la descripción es la que se ajusta al espacio sobrante, nunca al
  revés. Usar `textWrap: 'balance'` en la descripción para líneas de
  ancho parejo (evita la última línea huérfana muy corta).
- **Carrusel horizontal solo si aporta** (4+ ítems). Con 1 ítem, card
  normal; con 2-3, grilla ajustada al ancho sin scroll — un carrusel
  scrolleable con 2 cards flotando y espacio vacío al lado se ve mal.
- **FAB (carrito flotante) que no tape el footer**: `position: sticky`
  dentro de un wrapper de `height: 0` ubicado en el flujo normal del
  documento, justo antes del `<footer>`. Más simple y sin bugs que
  `IntersectionObserver` + `position: absolute` (probado, tenía bugs de
  anclaje).

## Antes de reportar "está roto" — descartar caché

Varias veces en esta sesión un "bug" resultó ser el navegador sirviendo el
build de JS anterior. Antes de investigar un problema de estilos reportado
por el usuario, confirmar `npx vite build` reciente y pedir **hard refresh**
(`Ctrl+Shift+R`) antes de asumir que el código está mal.

## Verificación de cambios

- `npx vite build` (no solo `tsc`/lint) valida sintaxis JSX real de todo el
  árbol — usarlo tras cambios estructurales grandes.
- Para micro-ajustes de color/spacing con el dev server ya corriendo,
  confiar en HMR de Vite en vez de rebuildear cada vez — reservar el build
  completo para antes de dar un cambio por terminado.
