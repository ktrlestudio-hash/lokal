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

// "¿Esta tienda tiene productos/ofertas?" es un HECHO, no un dato que
// vence — no cambia solo con el paso del tiempo, cambia únicamente cuando
// el dueño publica o borra algo (y ahí ya se actualiza en el momento, ver
// setVacioConocido más abajo). Por eso vive aparte del caché normal
// (que sí tiene TTL, pensado para datos que sí pueden quedar viejos): un
// simple '1'/'0' en localStorage, sin fecha de vencimiento. Antes esto
// usaba el mismo cacheSet/TTL que el resto (7 días) — el usuario reportó
// que en la práctica "no andaba", y tiene sentido: pasado ese plazo la
// cuenta volvía a "no saber" si estaba vacía y mostraba el skeleton de
// nuevo, aunque la respuesta real siguiera siendo la misma.
const vacioKey = (tiendaId) => `lokal-vacio-conocido:${tiendaId || 'store'}`;
function getVacioConocido(tiendaId) {
  try { return localStorage.getItem(vacioKey(tiendaId)) === '1'; } catch { return false; }
}
function setVacioConocido(tiendaId, vacio) {
  try {
    if (vacio) localStorage.setItem(vacioKey(tiendaId), '1');
    else localStorage.removeItem(vacioKey(tiendaId));
  } catch { /* storage lleno/bloqueado — ignorar */ }
}

export function useProductosOfertas(tiendaId) {
  const cacheKey = `productos-${tiendaId || 'store'}`;
  // cacheGet devuelve null cuando no hay entrada (nunca se cacheó, o venció
  // el TTL normal de 10min) y el array real cuando sí la hay.
  const cached = cacheGet(cacheKey);
  const [items, setItemsState] = useState(() => cached || []);
  // loading arranca en true salvo que ya sepamos la respuesta de antemano:
  // hay datos cacheados recientes, O el flag permanente confirma que la
  // cuenta está vacía. Sin esto se veía el salto empty→skeleton→empty: el
  // primer render (antes de que loading se active) ya mostraba el empty
  // state con items=[], luego loading pasaba a true y aparecía el
  // skeleton, y al terminar el fetch volvía al mismo empty de siempre.
  const [loading, setLoading] = useState(() => cached === null && !getVacioConocido(tiendaId));

  // Todo setItems pasa por acá: sin esto, una mutación (crear/editar/
  // borrar/vaciar) solo actualizaba React state, nunca el snapshot de
  // localStorage — al refrescar la página dentro del TTL (10 min), el
  // hook volvía a arrancar desde el cache viejo y "resucitaba" ítems ya
  // borrados/editados en el servidor. cacheSet acepta el array directo,
  // no un updater function, así que soporta ambas formas de setState.
  const setItems = useCallback((updater) => {
    setItemsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      cacheSet(cacheKey, next, CACHE_TTL_MS);
      setVacioConocido(tiendaId, next.length === 0);
      return next;
    });
  }, [cacheKey, tiendaId]);

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
    // Solo mostrar skeleton si de verdad no sabemos qué hay — con el flag
    // de "vacío conocido" en true, este fetch sigue corriendo igual (para
    // detectar si algo cambió desde otro dispositivo), pero en silencio:
    // la pantalla ya muestra el empty state correcto de entrada.
    if (!getVacioConocido(tiendaId)) setLoading(true);
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
