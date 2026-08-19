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

export function useProductosOfertas(tiendaId) {
  const cacheKey = `productos-${tiendaId || 'store'}`;
  const [items, setItems] = useState(() => cacheGet(cacheKey) || []);
  const [loading, setLoading] = useState(false);

  // all=1: el dueño ve también vencidas/ocultas en su panel (para poder
  // reactivarlas); el listado público (GET ?slug=...) sigue filtrando solo
  // vigentes del lado del backend.
  //
  // Catálogo (con precio/stock/categoryId) y Ofertas (flyers simples, sin
  // precio) viven en dos endpoints/archivos R2 separados desde esta sesión
  // (productos.js → data/productos.json, ofertas.js → data/ofertas.json —
  // antes todo se mezclaba en ofertas.json). Este hook sigue exponiendo un
  // único array `items` combinado: ProductosScreen/OfertasScreen ya lo
  // filtran client-side por `typeof precio === 'number'`, así que el shape
  // de salida no cambia — solo la fuente pasa de 1 fetch a 2 en paralelo.
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
      const data = [...productos, ...ofertas];
      cacheSet(cacheKey, data, CACHE_TTL_MS);
      setItems(data);
    } catch { /* silencioso */ } finally {
      setLoading(false);
    }
  }, [tiendaId, cacheKey]);

  const update = useCallback((id, patch) => {
    setItems(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const replace = useCallback((id, nuevo) => {
    setItems(prev => prev.map(o => (o.id === id ? nuevo : o)));
  }, []);

  const upsert = useCallback((item) => {
    setItems(prev => {
      const existe = prev.some(o => o.id === item.id);
      return existe ? prev.map(o => (o.id === item.id ? item : o)) : [item, ...prev];
    });
  }, []);

  const remove = useCallback((id) => {
    setItems(prev => prev.filter(o => o.id !== id));
  }, []);

  return {
    items, loading, setItems, fetchAll,
    update, replace, upsert, remove,
  };
}
