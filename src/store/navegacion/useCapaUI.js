// useCapaUI — registra un sheet/modal/overlay como una capa del uiStack
// mientras está abierto, para que el botón atrás nativo lo cierre (y solo
// a él, no a toda la app). Ver uiStack.js para el modelo completo.
//
// Contrato:
//   abierto              -> mientras sea true, la capa está registrada
//   onCerrar()           -> cerrar de verdad (bajar el estado del componente)
//   confirmarAntesDeCerrar -> opcional: () => bool. Si devuelve true, en vez
//                             de cerrar se llama onPedirConfirmacion() y la
//                             capa se REABRE en el historial (el atrás queda
//                             neutralizado hasta que el usuario decida).
//   onPedirConfirmacion  -> opcional: mostrar el modal de "¿descartar?"
//
// Devuelve { cerrar } para el botón X / Escape: usa el mismo camino que el
// atrás nativo, así no hay dos formas distintas de cerrar la misma capa.
import { useCallback, useEffect, useRef } from 'react';
import { abrirCapa, cerrarCapa } from './uiStack.js';

export function useCapaUI({ abierto, onCerrar, confirmarAntesDeCerrar, onPedirConfirmacion }) {
  const idRef = useRef(null);
  // Refs para que el callback registrado en el stack siempre vea los
  // valores actuales sin tener que re-registrar la capa en cada render.
  const cbs = useRef({});
  cbs.current = { onCerrar, confirmarAntesDeCerrar, onPedirConfirmacion };

  useEffect(() => {
    if (!abierto) return undefined;

    const alRecibirAtras = () => {
      const { confirmarAntesDeCerrar: pedir, onPedirConfirmacion, onCerrar } = cbs.current;
      if (pedir?.()) {
        // Hay algo que se perdería: no cerramos. Volvemos a registrar la
        // capa (nueva entrada de historial) para que el atrás siga
        // "atrapado" acá mientras el usuario decide en el modal.
        idRef.current = abrirCapa(alRecibirAtras);
        onPedirConfirmacion?.();
        return;
      }
      idRef.current = null;
      onCerrar();
    };

    idRef.current = abrirCapa(alRecibirAtras);

    return () => {
      // Desmontaje/cierre por cualquier vía que no haya sido el atrás
      // nativo (botón X, acción exitosa, cambio de pantalla): consumir la
      // entrada de historial para no dejarla huérfana.
      if (idRef.current != null) {
        cerrarCapa(idRef.current);
        idRef.current = null;
      }
    };
  }, [abierto]);

  // Cierre programático que respeta la confirmación igual que el atrás.
  const cerrar = useCallback(() => {
    const { confirmarAntesDeCerrar: pedir, onPedirConfirmacion, onCerrar } = cbs.current;
    if (pedir?.()) { onPedirConfirmacion?.(); return; }
    onCerrar();
  }, []);

  // forzarCierre — para cuando el usuario YA confirmó en el modal: salta
  // la confirmación y cierra.
  const forzarCierre = useCallback(() => {
    cbs.current.onCerrar();
  }, []);

  return { cerrar, forzarCierre };
}
