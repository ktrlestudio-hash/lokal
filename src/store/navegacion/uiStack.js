// uiStack — dueño ÚNICO del historial del navegador para las capas de UI
// del admin (sheets, modales, overlays fullscreen, sub-pantallas).
//
// El modelo es el que usan las apps grandes (Instagram, Gmail, Twitter en
// su versión web/PWA): cada capa de UI que se abre encima de la pantalla
// base es UNA entrada de historial. El botón atrás nativo saca la capa de
// arriba, nada más. Cuando ya no queda ninguna capa abierta, el atrás
// hace lo nativo (salir del sitio / cerrar la pestaña) — eso es correcto
// y no se pelea: intentar bloquearlo rompe la semántica del navegador y
// confunde al usuario.
//
// Por qué un único dueño y no un hook por componente: antes cada overlay
// registraba su propio listener de 'popstate' y empujaba su propia
// entrada, sin saber de los demás. Con dos o tres listeners reaccionando
// al MISMO evento, cada uno sacaba conclusiones distintas sobre qué había
// que cerrar — de ahí que "los flujos internos no funcionen". Acá hay una
// sola pila, un solo listener, y un orden de cierre determinista (LIFO).
//
// Uso desde un componente: ver useCapaUI en ./useCapaUI.js — no se llama
// a estas funciones directo desde la UI.

let pila = [];              // [{ id, onCerrar }] — el último es el de arriba
let listenerInstalado = false;
let idSiguiente = 1;

// Pops que va a generar un cierre programático (history.go(-n)) y que por
// lo tanto NO deben volver a sacar de la pila: la capa ya se sacó al
// pedir el cierre. Sin este contador, cerrar con el botón X cerraría
// también la capa de abajo (doble cierre).
let popsAIgnorar = 0;

const MARCA = 'lokalUiLayer';

function instalarListener() {
  if (listenerInstalado) return;
  listenerInstalado = true;

  window.addEventListener('popstate', () => {
    if (popsAIgnorar > 0) { popsAIgnorar--; return; }
    // Atrás nativo real: se cierra la capa de arriba. No se mira
    // history.state para decidir CUÁL (el state que llega es el de la
    // entrada a la que se volvió, no el de la que se fue) — la pila propia
    // es la fuente de verdad del orden.
    const capa = pila.pop();
    if (capa) capa.onCerrar();
  });
}

// abrirCapa — registra una capa y empuja su entrada de historial.
// Devuelve el id, necesario para cerrarla programáticamente después.
export function abrirCapa(onCerrar) {
  instalarListener();
  const id = idSiguiente++;
  pila.push({ id, onCerrar });
  window.history.pushState({ [MARCA]: id }, '');
  return id;
}

// cerrarCapa — cierre programático (botón X, guardar y salir, Escape, o
// el cleanup de React al desmontar). Consume la(s) entrada(s) de historial
// correspondientes para no dejar entradas muertas que el usuario tenga que
// "atravesar" con un atrás que no hace nada visible.
export function cerrarCapa(id) {
  const idx = pila.findIndex((c) => c.id === id);
  if (idx === -1) return;              // ya se cerró (por atrás nativo)
  // Cerrar una capa implica cerrar también las que estén encima (no puede
  // quedar una capa huérfana sobre una que ya no existe).
  const cuantas = pila.length - idx;
  pila = pila.slice(0, idx);
  popsAIgnorar += cuantas;
  window.history.go(-cuantas);
}

export function hayCapas() { return pila.length > 0; }
export function limpiarCapas() { pila = []; popsAIgnorar = 0; }
