// usePhotoSwipe — abre PhotoSwipe (zoom real con pinch/scroll + swipe entre
// fotos) con una UI de botones PROPIA en vez de la nativa de la librería —
// mismo patrón que usa DISTRIBUIDORA QR 2.0 (referencia de diseño del
// ecosistema): se ocultan los botones nativos (.pswp__button--*, .pswp__counter
// con display:none) y se dibuja un overlay HTML propio sincronizado por
// eventos (afterInit/change/close), con la MISMA disposición que esa
// referencia — cerrar arriba-izq, zoom arriba-der, flechas abajo en mobile
// (centradas verticalmente en desktop), contador centrado abajo — pero con
// los tokens/filosofía visual de esta app (blur+fondo oscuro translúcido,
// scale(0.93) en press, iconos Lucide) en vez de los genéricos de PhotoSwipe.
//
// Uso:
//   const abrir = usePhotoSwipe(fotos);
//   <img onClick={(e) => abrir(i, e)} />
//   <PhotoSwipeStyles /> — montar UNA vez en el árbol (inyecta el <style>
//   que oculta la UI nativa; no depende de que loadPhotoSwipe ya haya
//   corrido, así que se puede montar siempre sin costo).
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { BP } from '../tokens.js';

let PhotoSwipeLightboxPromise = null;
function loadPhotoSwipe() {
  // import() dinámico: PhotoSwipe (con su CSS) solo se descarga la PRIMERA
  // vez que el usuario realmente abre un zoom, no en el bundle inicial de
  // toda página de tienda/oferta.
  if (!PhotoSwipeLightboxPromise) {
    PhotoSwipeLightboxPromise = Promise.all([
      import('photoswipe/lightbox'),
      import('photoswipe/style.css'),
    ]).then(([mod]) => mod.default);
  }
  return PhotoSwipeLightboxPromise;
}

// Botón base — mismo lenguaje que el resto de la app: fondo oscuro
// translúcido + blur, borde blanco sutil, sombra, scale(0.93) en press
// (no el scale(1.1)/.95 genérico de la referencia — unificado con el resto
// de botones flotantes de la vista pública, ver .oi-hero-btn/.cm-hero-arrow).
const PSWP_UI_CSS = `
  .pswp__button--close, .pswp__button--arrow, .pswp__button--zoom, .pswp__counter { display: none !important; }
  .pswp-ui-btn {
    position: absolute; z-index: 2; border: 1px solid rgba(255,255,255,.16);
    background: rgba(0,0,0,.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    color: #fff; display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.3);
    transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), background-color .15s ease;
  }
  @media (hover: hover) { .pswp-ui-btn:hover { background: rgba(0,0,0,.55); } }
  .pswp-ui-btn:active { transform: scale(0.93); transition: transform .06s ease; }
  .pswp-ui-btn.disabled { opacity: .25; pointer-events: none; }
  .pswp-ui-close { top: 16px; left: 16px; width: 40px; height: 40px; border-radius: 12px; }
  .pswp-ui-zoom { top: 16px; right: 16px; width: 40px; height: 40px; border-radius: 12px; }
  .pswp-ui-nav { bottom: 20px; width: 44px; height: 44px; border-radius: 12px; }
  .pswp-ui-prev { left: 16px; }
  .pswp-ui-next { right: 16px; }
  .pswp-ui-counter {
    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,.45); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    color: #fff; padding: 7px 16px; border-radius: 12px; font-size: 12.5px; font-weight: 800;
    letter-spacing: .02em; box-shadow: 0 4px 16px rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.12);
    pointer-events: none;
  }
  /* Desktop: flechas centradas verticalmente en vez de abajo (igual criterio
     que la referencia — abajo en mobile, a los costados en pantallas anchas). */
  @media (min-width: ${BP.md}px) {
    .pswp-ui-nav { bottom: auto; top: 50%; transform: translateY(-50%); }
    .pswp-ui-nav:active { transform: translateY(-50%) scale(0.93); }
  }
`;

// Monta el <style> que oculta la UI nativa — una sola vez, costo nulo
// (no depende de que PhotoSwipe esté cargado, solo es CSS puro).
export function PhotoSwipeStyles() {
  return <style>{PSWP_UI_CSS}</style>;
}

export function usePhotoSwipe(fotos) {
  const fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  const [pswp, setPswp] = useState(null); // instancia activa, para el overlay

  return {
    abrir: useCallback(async (index, clickEvent) => {
      const list = fotosRef.current || [];
      if (!list.length) return;

      const originEl = clickEvent?.currentTarget;
      // initialPoint: coordenadas reales del click — sin esto PhotoSwipe abre
      // con un zoom genérico desde el centro, no "desde donde tocaste".
      const initialPoint = clickEvent && (clickEvent.clientX || clickEvent.clientY)
        ? { x: clickEvent.clientX, y: clickEvent.clientY }
        : null;

      let PhotoSwipeLightbox;
      try {
        PhotoSwipeLightbox = await loadPhotoSwipe();
      } catch (err) {
        console.error('[usePhotoSwipe] fallo al cargar PhotoSwipe:', err);
        return;
      }

      const dataSource = list.map((src) => ({
        src,
        width: originEl?.naturalWidth || 1600,
        height: originEl?.naturalHeight || 1600,
      }));

      const lightbox = new PhotoSwipeLightbox({
        dataSource,
        showHideAnimationType: 'zoom',
        bgOpacity: 0.95,
        wheelToZoom: true,
        pswpModule: () => import('photoswipe'),
      });
      // Solo afterInit/destroy setean el state — con la instancia REAL de
      // pswp, nunca una copia. PhotoSwipeOverlay se re-renderiza solo (su
      // propio listener 'change', ver más abajo) sin tocar esta referencia:
      // reemplazarla por un objeto plano en cada 'change' rompía los métodos
      // (.next/.prev/.close no sobreviven a un spread) y crasheaba al usarlos.
      lightbox.on('afterInit', () => setPswp(lightbox.pswp));
      lightbox.on('destroy', () => setPswp(null));
      lightbox.init();
      lightbox.loadAndOpen(index, undefined, initialPoint);
    }, []),
    // pswp real (no el objeto shallow-copy de 'change') — el overlay lee
    // currIndex/prev/next/toggleZoom/close directo de la instancia viva.
    pswp,
  };
}

// Overlay de botones — portal a <body> (mismo criterio que MapaModal/
// ShareSheet: nunca queda atrapado en el stacking context de un contenedor
// con scroll). Se renderiza SOLO mientras hay una instancia de PhotoSwipe
// abierta; useEffect fuerza un re-render en cada 'change' para que el
// contador y el estado disabled de las flechas se mantengan al día (la
// instancia pswp muta in-place, React no lo detecta solo).
export function PhotoSwipeOverlay({ pswp }) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!pswp) return undefined;
    const onChange = () => forceTick((n) => n + 1);
    pswp.on('change', onChange);
    return () => pswp.off('change', onChange);
  }, [pswp]);

  if (!pswp) return null;

  const total = pswp.options?.dataSource?.length ?? 0;
  const idx = pswp.currIndex ?? 0;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, pointerEvents: 'none' }}>
      <button className="pswp-ui-btn pswp-ui-close" style={{ pointerEvents: 'auto' }}
        aria-label="Cerrar" onClick={() => pswp.close()}>
        <X size={18} />
      </button>
      <button className="pswp-ui-btn pswp-ui-zoom" style={{ pointerEvents: 'auto' }}
        aria-label="Zoom" onClick={() => pswp.toggleZoom()}>
        <ZoomIn size={18} />
      </button>
      {total > 1 && (
        <>
          <button className={`pswp-ui-btn pswp-ui-nav pswp-ui-prev ${idx <= 0 ? 'disabled' : ''}`}
            style={{ pointerEvents: 'auto' }} aria-label="Anterior" onClick={() => pswp.prev()}>
            <ChevronLeft size={20} />
          </button>
          <button className={`pswp-ui-btn pswp-ui-nav pswp-ui-next ${idx >= total - 1 ? 'disabled' : ''}`}
            style={{ pointerEvents: 'auto' }} aria-label="Siguiente" onClick={() => pswp.next()}>
            <ChevronRight size={20} />
          </button>
          <div className="pswp-ui-counter">{idx + 1} / {total}</div>
        </>
      )}
    </div>,
    document.body
  );
}
