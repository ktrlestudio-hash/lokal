// useProductosOfertas — encapsula el estado + fetch + mutaciones CRUD de
// "mis productos/ofertas" (el array plano que después OfertasScreen y
// ProductosScreen filtran cada una por su cuenta, ver StoreApp.jsx). Primer
// paso de la Fase 3 del plan de profesionalización: extraer estado
// realmente COMPARTIDO (se usa en 30+ lugares de StoreApp.jsx — badge del
// nav, menciones de chat, onboarding checklist, no solo las 2 screens de
// productos) a su propio hook, sin tocar el layout JSX todavía.
//
// Deliberadamente NO incluye la cola de subida en segundo plano
// (subirOfertaEnColaAdmin/handleOfertaGuardadaOptimista en StoreApp.jsx):
// esa lógica tiene refs propios (ofertaPendientesRef, ofertaAbortRefs) y
// depende de más contexto del formulario de oferta — moverla ahora
// multiplicaría el riesgo de esta primera extracción. Queda para una
// segunda pasada una vez que este patrón esté validado en producción.
import { useState, useCallback } from 'react';
import { apiFetch } from '../../api';
import { cacheGet, cacheSet } from '../../lokCache';

const API_BASE = '/.netlify/functions';
const CACHE_TTL_MS = 10 * 60 * 1000;
// Una lista vacía es un dato mucho más estable que uno con productos: no
// "vence" sola, solo cambia cuando el propio dueño publica algo — y esa
// mutación (upsert) ya actualiza la caché en el momento. Guardarla con el
// mismo TTL corto de 10min hacía que, pasado ese rato, la cuenta "se
// olvidara" de que estaba vacía y volviera a mostrar el skeleton de carga
// como si no supiera nada, aunque la respuesta real no hubiera cambiado.
const EMPTY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function useProductosOfertas(tiendaId) {
  const cacheKey = `productos-${tiendaId || 'store'}`;
  // cacheGet devuelve null cuando no hay entrada (nunca se cacheó, o venció
  // el TTL) y el array real (incluso []) cuando sí la hay — por eso se lee
  // una sola vez acá y se distingue explícitamente de "no sé todavía".
  const cached = cacheGet(cacheKey);
  const [items, setItemsState] = useState(() => cached || []);
  // loading arranca en true SOLO si no hay ninguna pista en caché. Si la
  // caché dice que la lista está vacía ([]), eso ya es una respuesta real
  // (confirmada por el servidor la última vez que se sincronizó) — ir a
  // skeleton en ese caso sería mostrar una carga falsa antes de terminar
  // en el mismo empty state que ya sabíamos. El salto molesto era
  // exactamente ese: empty (antes de que loading se active) → skeleton →
  // empty otra vez. Con esto, "vacío confirmado" va directo al empty y
  // "no sé" va directo al skeleton, sin pasos intermedios de más.
  const [loading, setLoading] = useState(() => cached === null);

  // Todo setItems pasa por acá: sin esto, una mutación (crear/editar/
  // borrar/vaciar) solo actualizaba React state, nunca el snapshot de
  // localStorage — al refrescar la página dentro del TTL (10 min), el
  // hook volvía a arrancar desde el cache viejo y "resucitaba" ítems ya
  // borrados/editados en el servidor. cacheSet acepta el array directo,
  // no un updater function, así que soporta ambas formas de setState.
  const setItems = useCallback((updater) => {
    setItemsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      cacheSet(cacheKey, next, next.length === 0 ? EMPTY_CACHE_TTL_MS : CACHE_TTL_MS);
      return next;
    });
  }, [cacheKey]);

  // all=1: el dueño ve también vencidas/ocultas en su panel (para poder
  // reactivarlas); el listado público (GET ?slug=...) sigue filtrando solo
  // vigentes del lado del backend.
  //
  // Catálogo (con precio/stock/categoryId) y Ofertas (flyers simples, sin
  // precio) viven en dos endpoints/archivos R2 separados desde esta sesión
  // (productos.js → data/productos.json, ofertas.js → data/ofertas.json —
  // antes todo se mezclaba en ofertas.json). Este hook expone un único
  // array `items` combinado, con cada ítem marcado con _origen ('catalogo'
  // | 'ofertas') según de qué endpoint vino — ProductosScreen/OfertasScreen
  // filtran por _origen, NO por `typeof precio === 'number'` (ese filtro
  // por tipo clasificaba mal cualquier producto de catálogo real con
  // precio null/vacío, ej. filas del importador sin precio en el Excel:
  // terminaban apareciendo en Ofertas aunque vivieran en productos.json).
  const fetchAll = useCallback(async () => {
    if (!tiendaId) return;
    setLoading(true);
    try {
      const [resProductos, resOfertas] = await Promise.all([
        apiFetch(`${API_BASE}/productos?tiendaId=${tiendaId}&all=1`, { authRequired: true }),
        apiFetch(`${API_BASE}/ofertas?tiendaId=${tiendaId}&all=1`, { authRequired: true }),
      ]);
      const [productos, ofertas] = await Promise.all([
        resProductos.ok ? resProductos.json() : [],
        resOfertas.ok ? resOfertas.json() : [],
      ]);
      const data = [
        ...productos.map(p => ({ ...p, _origen: 'catalogo' })),
        ...ofertas.map(o => ({ ...o, _origen: 'ofertas' })),
      ];
      setItems(data);
    } catch { /* silencioso */ } finally {
      setLoading(false);
    }
  }, [tiendaId, setItems]);

  const update = useCallback((id, patch) => {
    setItems(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
  }, [setItems]);

  const replace = useCallback((id, nuevo) => {
    setItems(prev => prev.map(o => (o.id === id ? nuevo : o)));
  }, [setItems]);

  const upsert = useCallback((item) => {
    setItems(prev => {
      const existe = prev.some(o => o.id === item.id);
      return existe ? prev.map(o => (o.id === item.id ? item : o)) : [item, ...prev];
    });
  }, [setItems]);

  const remove = useCallback((id) => {
    setItems(prev => prev.filter(o => o.id !== id));
  }, [setItems]);

  return {
    items, loading, setItems, fetchAll,
    update, replace, upsert, remove,
  };
}
