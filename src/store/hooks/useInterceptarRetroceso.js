// useInterceptarRetroceso — hace que el botón atrás nativo (navegador
// desktop, gesto/botón Android) cierre un overlay fullscreen (wizard,
// detalle, sheet grande) en vez de salir de todo el admin. Sin esto, como
// StoreApp.jsx solo usa replaceState para el hash de screen (nunca
// pushState), el back nativo no tiene ninguna entrada de historial propia
// del overlay — salta directo a lo que había antes de abrir el admin.
//
// Patrón: al montar, empuja una entrada de historial "marcador" (state
// distintivo, no se navega a ningún hash real). Si el usuario aprieta
// atrás, el navegador ya consumió esa entrada y dispara 'popstate' — se
// intercepta ahí. Si NO hay cambios sin guardar, se cierra directo. Si SÍ
// los hay, se restaura la entrada (pushState de nuevo, neutralizando el
// atrás) y se pide confirmación con un modal React real (ModalConfirmar,
// no window.confirm) — recién si el usuario confirma se cierra de verdad.
//
// Si el overlay se cierra por otro medio (botón X, guardar y salir), hay
// que consumir la entrada de historial con history.back() — si no, queda
// una entrada fantasma y el PRÓXIMO atrás del usuario no hace nada visible
// (solo remueve esa entrada muerta).
import { useEffect, useRef, useState } from 'react';

const MARCA = 'lokal-overlay-marker';

export function useInterceptarRetroceso({ activo, hayCambiosSinGuardar, onCerrar }) {
  const [pidiendoConfirmacion, setPidiendoConfirmacion] = useState(false);
  const cerradoPorNosotros = useRef(false);

  useEffect(() => {
    if (!activo) return;

    cerradoPorNosotros.current = false;
    window.history.pushState({ [MARCA]: true }, '');

    const onPopState = () => {
      if (hayCambiosSinGuardar()) {
        // Neutralizar el atrás: recuperamos la entrada para que el
        // usuario no haya "salido" todavía mientras decide en el modal.
        window.history.pushState({ [MARCA]: true }, '');
        setPidiendoConfirmacion(true);
        return;
      }
      cerradoPorNosotros.current = true;
      onCerrar();
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (!cerradoPorNosotros.current && window.history.state?.[MARCA]) {
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo]);

  const confirmarDescartar = () => {
    setPidiendoConfirmacion(false);
    cerradoPorNosotros.current = true;
    onCerrar();
  };

  const cancelarDescartar = () => setPidiendoConfirmacion(false);

  // Para cierres que NO vienen del atrás nativo (botón X, etc.) pero
  // igual quieren la misma protección de "hay cambios sin guardar" —
  // el caller decide cuándo llamarla (normalmente ya sabe que
  // hayCambiosSinGuardar() es true, evita el doble chequeo).
  const pedirConfirmacion = () => setPidiendoConfirmacion(true);

  return { pidiendoConfirmacion, pedirConfirmacion, confirmarDescartar, cancelarDescartar };
}
