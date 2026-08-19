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
// que cerrar. Acá hay una sola pila, un solo listener, y un orden de
// cierre determinista (LIFO).
//
// ── Por qué hay una cola de operaciones ──────────────────────────────────
// pushState() es SÍNCRONO pero history.go()/back() son ASÍNCRONOS: el
// 'popstate' correspondiente llega en un tick posterior. Eso rompe las
// transiciones capa→capa que ocurren en el mismo tick, que es el patrón
// más común de la app (el sheet "+" se cierra y abre el formulario de
// producto en la misma función):
//
//   cerrarCapa(sheet)  -> go(-1)      [queda PENDIENTE]
//   abrirCapa(form)    -> pushState() [se aplica YA]
//   ...tick siguiente: llega el go(-1) y consume la entrada del FORM
//
// El formulario quedaba abierto pero sin entrada propia, así que el
// siguiente atrás saltaba a la pantalla base en vez de cerrarlo — que es
// exactamente el bug reportado. La cola serializa: mientras haya un go()
// en vuelo, las operaciones siguientes esperan a que su popstate llegue.
//
// Uso desde un componente: ver useCapaUI en ./useCapaUI.js — no se llama
// a estas funciones directo desde la UI.

let pila = [];              // [{ id, onCerrar }] — el último es el de arriba
let listenerInstalado = false;
let idSiguiente = 1;

// Cola de operaciones pendientes mientras hay un go() en vuelo.
let cola = [];
let esperandoPop = 0;       // cuántos popstate de un go() propio faltan llegar

const MARCA = 'lokalUiLayer';

function instalarListener() {
  if (listenerInstalado) return;
  listenerInstalado = true;

  window.addEventListener('popstate', () => {
    if (esperandoPop > 0) {
      // Es el eco de un go() que pedimos nosotros: no cierra nada (la capa
      // ya se sacó de la pila al pedir el cierre).
      esperandoPop--;
      if (esperandoPop === 0) drenarCola();
      return;
    }
    // Atrás nativo real: se cierra la capa de arriba. No se mira
    // history.state para decidir CUÁL (el state que llega es el de la
    // entrada a la que se volvió, no el de la que se fue) — la pila propia
    // es la fuente de verdad del orden.
    const capa = pila.pop();
    if (capa) capa.onCerrar();
  });
}

function encolar(op) {
  if (esperandoPop > 0) { cola.push(op); return; }
  op();
}

function drenarCola() {
  const pendientes = cola;
  cola = [];
  for (let i = 0; i < pendientes.length; i++) {
    pendientes[i]();
    // Si esta operación volvió a poner un go() en vuelo, el resto de la
    // cola original espera al próximo drenaje (se antepone a lo que ya
    // se haya encolado mientras tanto).
    if (esperandoPop > 0) {
      cola = pendientes.slice(i + 1).concat(cola);
      return;
    }
  }
}

// abrirCapa — registra una capa y empuja su entrada de historial.
// Devuelve el id, necesario para cerrarla programáticamente después.
// La capa entra en la pila de inmediato (para que el orden lógico sea
// correcto aunque el pushState real se difiera por la cola).
export function abrirCapa(onCerrar) {
  instalarListener();
  const id = idSiguiente++;
  pila.push({ id, onCerrar });
  encolar(() => window.history.pushState({ [MARCA]: id }, ''));
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
  encolar(() => {
    esperandoPop += cuantas;
    window.history.go(-cuantas);
  });
}

export function hayCapas() { return pila.length > 0; }
export function limpiarCapas() { pila = []; cola = []; esperandoPop = 0; }
