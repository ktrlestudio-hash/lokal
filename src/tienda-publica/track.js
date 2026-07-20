/**
 * track.js — helper de analytics del lado cliente para la vista pública.
 *
 * Envía eventos a POST /analytics (netlify/functions/analytics.js), que a
 * su vez persiste en analytics-store.js (R2). No bloqueante: nunca debe
 * frenar ni romper la navegación del visitante — cualquier fallo de red se
 * traga en silencio (catch vacío), el tracking es best-effort por diseño.
 *
 * sessionId: identificador estable por VISITANTE (localStorage, no
 * sessionStorage — sobrevive cerrar/abrir pestaña, para que "sesiones
 * únicas"/"usuarios únicos" cuenten personas reales, no aperturas de tab).
 */
import { useEffect, useRef } from 'react';

const SESSION_KEY = 'lokal-tp-session';

function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // localStorage bloqueado (modo privado estricto, etc.) — sin persistir,
    // cae a un id de una sola vez; el evento igual se registra, solo no
    // agrupa bien con la siguiente visita de la misma persona.
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

const API_BASE = '/.netlify/functions';

/**
 * track(tipo, campos) — dispara un evento, sin esperar la respuesta.
 * campos: { tiendaId, productoId, pagina, categoria, valor, datos, ... }
 */
export function track(tipo, campos = {}) {
  const payload = {
    tipo,
    sessionId: getSessionId(),
    ...campos,
  };

  try {
    const body = JSON.stringify(payload);
    // sendBeacon: sobrevive el unload de la página (útil para el evento de
    // "tiempo en página" disparado en beforeunload/visibilitychange) — fetch
    // normal se cancela ahí en la mayoría de los navegadores.
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon(`${API_BASE}/analytics`, blob);
      if (ok) return;
    }
    fetch(`${API_BASE}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // best-effort — nunca romper la navegación por un fallo de tracking.
  }
}

// Atajos para las acciones más comunes de la vista pública — evita repetir
// la forma del evento (tipo/accion) en cada punto de uso.
export const trackPageview = (tiendaId, pagina) => track('pageview', { tiendaId, pagina });

// extra puede traer productoId (va al nivel top del evento, así el backend
// lo agrupa en metrics.porProducto) — el resto queda dentro de "datos".
export const trackClick = (tiendaId, accion, extra = {}) => {
  const { productoId, ...datosExtra } = extra;
  track('click', { tiendaId, productoId, pagina: 'tienda', datos: { accion, ...datosExtra } });
};

export const trackCompartir = (tiendaId, medio, extra = {}) => {
  const { productoId, ...datosExtra } = extra;
  track('click', { tiendaId, productoId, pagina: 'tienda', datos: { accion: 'compartir', medio, ...datosExtra } });
};

export const trackBusqueda = (tiendaId, query) =>
  track('busqueda', { tiendaId, datos: { query } });

/**
 * useTiempoEnPagina(tiendaId) — hook para trackear cuánto tiempo pasó el
 * visitante en la tienda antes de salir/cambiar de pestaña. Dispara en
 * visibilitychange (tab oculta) y en unmount — cubre tanto "cierra la
 * pestaña" como "navega a otra ruta dentro de la SPA".
 */
export function useTiempoEnPagina(tiendaId) {
  const startRef = useRef(Date.now());
  useEffect(() => {
    if (!tiendaId) return undefined; // sin tienda (ej. dueño viendo la suya) — no trackear
    startRef.current = Date.now();
    const enviar = () => {
      const segundos = Math.round((Date.now() - startRef.current) / 1000);
      if (segundos < 1) return; // rebote instantáneo, no aporta señal
      const scrollPct = document.documentElement.scrollHeight > window.innerHeight
        ? Math.min(100, Math.round(
            (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
          ))
        : 100;
      track('tiempo', { tiendaId, pagina: 'tienda', valor: segundos, datos: { scrollPct } });
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') enviar(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      enviar();
    };
  }, [tiendaId]);
}
