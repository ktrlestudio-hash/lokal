// usePublicarAlturaReal — mide la altura real de un elemento (vía
// ResizeObserver, no un valor adivinado/hardcodeado) y la publica como
// variable CSS global en :root. Extraído de StoreBottomNav.jsx (que ya
// resolvía el mismo problema para --store-bottom-nav-h) para reusarlo con
// cualquier otro elemento de altura variable que otras screens necesiten
// descontar del viewport — ej. el banner de suscripción vencida/por
// vencer en StoreApp.jsx, que es condicional y de altura variable, así
// que no se puede compensar con un número fijo como --store-bottom-nav-h.
import { useLayoutEffect } from 'react';

export function usePublicarAlturaReal(ref, activo, cssVar) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!activo) {
      root.style.setProperty(cssVar, '0px');
      return;
    }
    const el = ref.current;
    if (!el) return;
    const publicar = () => root.style.setProperty(cssVar, `${el.offsetHeight}px`);
    publicar();
    const ro = new ResizeObserver(publicar);
    ro.observe(el);
    return () => { ro.disconnect(); root.style.setProperty(cssVar, '0px'); };
  }, [ref, activo, cssVar]);
}
