// useFormDraft — guarda automáticamente el texto de un formulario (título,
// descripción, precio, etc.) en localStorage mientras el usuario escribe,
// y lo restaura si vuelve a entrar sin haber guardado/cancelado.
//
// Deliberadamente NO incluye fotos/archivos: un File del sistema no es
// serializable, así que no sobrevive a un refresh sin importar dónde se
// guarde — misma limitación que useImportador.js con el archivo subido.
// Elegir una foto no se pierde SOLO si el usuario no refresca; el texto sí
// se recupera siempre. Esta es la versión simple del pedido real (que era
// un borrador real en el servidor, con la foto ya subida y visible como
// card oculta) — se anota aparte para una sesión futura, ver memoria
// lokal-links-borrador-real-productos-ofertas.
//
// Uso: const draft = useFormDraft(tiendaId, 'producto', esVacio);
//   draft.leer()           -> datos guardados o null
//   draft.guardar(datos)   -> persiste (con debounce lo llama el caller)
//   draft.limpiar()        -> borra el draft (al publicar/cancelar)
import { useCallback, useRef } from 'react';

const DEBOUNCE_MS = 600;

function storageKey(tiendaId, tipo) {
  return `lokal-draft-${tipo}:${tiendaId || 'store'}`;
}

export function useFormDraft(tiendaId, tipo) {
  const timerRef = useRef(null);

  const leer = useCallback(() => {
    if (!tiendaId) return null;
    try {
      const raw = localStorage.getItem(storageKey(tiendaId, tipo));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, [tiendaId, tipo]);

  // esVacio: función que recibe los datos y decide si "no hay nada real
  // que guardar" (ej. todos los campos de texto vacíos) — en ese caso no
  // se persiste nada, para no dejar un draft fantasma de un formulario
  // que el usuario abrió y cerró sin tocar.
  const guardar = useCallback((datos, esVacio) => {
    if (!tiendaId) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        if (esVacio?.(datos)) {
          localStorage.removeItem(storageKey(tiendaId, tipo));
        } else {
          localStorage.setItem(storageKey(tiendaId, tipo), JSON.stringify(datos));
        }
      } catch { /* storage lleno/bloqueado — no es crítico */ }
    }, DEBOUNCE_MS);
  }, [tiendaId, tipo]);

  const limpiar = useCallback(() => {
    if (!tiendaId) return;
    clearTimeout(timerRef.current);
    try { localStorage.removeItem(storageKey(tiendaId, tipo)); } catch { /* ignorar */ }
  }, [tiendaId, tipo]);

  return { leer, guardar, limpiar };
}
