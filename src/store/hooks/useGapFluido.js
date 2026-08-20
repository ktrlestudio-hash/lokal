// useGapFluido — calcula, en tiempo real, cuánto espacio entre secciones
// (gap) hace falta para que el contenido de un contenedor encastre
// exactamente en el alto disponible, entre un piso y un techo.
//
// Por qué no alcanza con CSS puro (clamp + vh): clamp() interpola entre
// dos valores fijos según el viewport, pero no sabe cuánto mide el
// CONTENIDO real (cuántas secciones hay, cuánto ocupa cada una) — con
// clamp(min, Nvh, max) el resultado es el mismo gap para un formulario de
// 3 campos que para uno de 8, cuando lo que hace falta es lo opuesto: más
// gap cuando sobra espacio, menos cuando falta. Eso solo se puede medir
// con JS: alto disponible menos la suma de las secciones (sin gaps) da el
// espacio libre real, y dividirlo por la cantidad de huecos da el gap
// exacto para ocupar justo ese espacio — recortado al [min, max] pedido.
//
// El propio contenedor mide su gap actual (getBoundingClientRect ya
// incluye los gaps con los que se renderizó la última vez), así que el
// cálculo es autoconsistente sin depender de un layout "sin gap" hipotético.
import { useLayoutEffect, useState } from 'react';

// reservadoAbajoRef: ref a un elemento cuya altura real hay que descontar
// del disponible por debajo del contenedor (ej. el botón fijo de
// guardar) — se lee offsetHeight en cada recálculo, así que sigue el
// tamaño real aunque cambie (texto que envuelve dos líneas, etc.), no un
// número fijo adivinado. El propio contenedor.getBoundingClientRect().top
// ya refleja dónde lo dejó el layout real (header incluido), así que
// "disponible = innerHeight - top - alturaReservada" alcanza sin
// acoplarse al alto exacto de otros componentes.
export function useGapFluido(containerRef, { min, max, reservadoAbajoRef }) {
  const [gap, setGap] = useState(max);

  useLayoutEffect(() => {
    const contenedor = containerRef.current;
    if (!contenedor) return undefined;

    const recalcular = () => {
      const top = contenedor.getBoundingClientRect().top;
      const alturaReservada = reservadoAbajoRef?.current?.offsetHeight || 0;
      const disponible = window.innerHeight - top - alturaReservada;
      const hijos = Array.from(contenedor.children);
      if (hijos.length < 2) { setGap(max); return; }

      // La altura de CADA hijo no depende del gap entre ellos (es la caja
      // de esa sección sola), así que sumarlas da el alto "fijo" real sin
      // entrar en un ciclo con el propio gap que se está calculando —
      // clave para que ResizeObserver no oscile.
      const alturaTotalHijos = hijos.reduce((sum, h) => sum + h.getBoundingClientRect().height, 0);
      const huecos = hijos.length - 1;
      const espacioLibre = disponible - alturaTotalHijos;
      const gapIdeal = espacioLibre / huecos;
      setGap(Math.max(min, Math.min(max, gapIdeal)));
    };

    recalcular();
    // Observa el contenedor Y cada hijo por separado: un hijo que crece
    // por su propio contenido (ej. CategoryPicker desplegando el árbol de
    // categorías) cambia la altura de ESA sección sin necesariamente
    // disparar un resize del contenedor completo a tiempo para el próximo
    // frame — observarlos a todos cubre ambos casos.
    const ro = new ResizeObserver(recalcular);
    ro.observe(contenedor);
    Array.from(contenedor.children).forEach((h) => ro.observe(h));
    if (reservadoAbajoRef?.current) ro.observe(reservadoAbajoRef.current);
    window.addEventListener('resize', recalcular);
    return () => { ro.disconnect(); window.removeEventListener('resize', recalcular); };
  }, [containerRef, min, max, reservadoAbajoRef]);

  return gap;
}
