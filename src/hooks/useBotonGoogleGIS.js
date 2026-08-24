// useBotonGoogleGIS — la LÓGICA de Google Identity Services (GIS/FedCM)
// detrás del botón de "Continuar con Google", separada del JSX visual, para
// poder montar el iframe invisible de Google DEBAJO de un botón propio con
// su propio look (a diferencia de components/BotonGoogle.jsx, que trae su
// propio visual fijo tipo pill — acá el visual queda 100% a cargo de quien
// use el hook, ej. LoginCard.jsx, que ya tenía su botón pulido).
//
// Uso:
//   const { slotRef, gisActivo } = useBotonGoogleGIS({ isDark, onLogin, onError, mountDelayMs: 260 });
//   <button onClick={fallbackPopup}>...tu botón visual normal...</button>
//   <div style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: gisActivo ? 'auto' : 'none' }}>
//     <div ref={slotRef} style={{ width: BTN_W + 20, height: 44 }} />
//   </div>
//
// El slot SIEMPRE se monta (nunca condicionado a gisActivo) — si el <div
// ref={slotRef}> solo existiera cuando gisActivo fuera true, el efecto de
// abajo encontraría slotRef.current === null en el primer render y nunca
// reintentaría (bug circular: el ref necesita el estado que el propio
// efecto debe setear). El caller decide el ancho real del slot con su
// propio estilo — este hook no impone un BTN_W fijo.
//
// FedCM bloqueado por el navegador (visto en producción): Chrome desactiva
// FedCM para un origen "temporalmente, según una acción previa del usuario"
// — ej. cerrar el sheet nativo sin loguearse una vez. El iframe de Google
// entonces falla puertas adentro (AbortError en su propio origen, nunca
// llega como evento a nuestro código — onError NO se dispara) y el botón
// visual queda "mudo": el click lo sigue recibiendo el iframe invisible
// (que no hace nada), nunca el fallback de popup de abajo.
//
// Detección INSTANTÁNEA (sin timeout, sin espera): al tocar el iframe,
// `window` pierde el foco (el sheet nativo lo toma). Cuando el sheet nativo
// se CIERRA — con éxito o cancelado — `window` recupera el foco de vuelta,
// disparando 'focus'. Si en ese momento no llegó onLogin ni onError, el
// intento se cerró sin completar: se remonta el iframe YA MISMO (misma key
// que "Reintentar" usaría manualmente), sin esperar ningún tiempo fijo —
// el próximo toque del usuario, sea inmediato o no, encuentra un iframe
// fresco. TIMEOUT_INTENTO_MS queda como red de seguridad SOLO para el caso
// en que el foco nunca vuelva a dispararse (poco común, pero posible según
// el navegador) — mucho más largo porque ya no es el mecanismo principal.
const TIMEOUT_INTENTO_MS = 8000;

import { useEffect, useRef, useState } from 'react';
import { renderBotonGoogle, gisDisponible } from '../firebase';

// `key` (no es la key de React, es un valor cualquiera que el caller
// controla) fuerza un remontaje REAL del iframe cuando cambia — mismo
// efecto que cerrar y reabrir el contenedor que aloja este botón. Caso de
// uso real: el usuario cierra el sheet nativo de Google sin loguearse pero
// deja el sheet de LOKAL abierto; ese iframe puede quedar "gastado" (Chrome
// niega FedCM de nuevo para el mismo iframe) sin que el timeout de arriba
// llegue a dispararse (el cierre del sheet nativo no siempre dispara
// 'blur'). El caller expone un botón "Reintentar" que incrementa `key`.
export function useBotonGoogleGIS({ isDark, width = 260, onLogin, onError, mountDelayMs = 0, key = 0, onIframeTouch, onFocoSinResultado }) {
  const slotRef = useRef(null);
  const [gisListo, setGisListo] = useState(false);
  const [gisActivo, setGisActivo] = useState(true);
  // gisEnCurso: true desde que el iframe toma el foco (el usuario tocó y
  // el sheet nativo se abrió) hasta que resuelve (onLogin/onError) o el
  // foco vuelve sin resultado — el caller lo usa para mostrar el mismo
  // loading visual que ya tenía para el popup de respaldo, así el botón
  // no se ve "muerto" mientras el sheet nativo está en curso.
  const [gisEnCurso, setGisEnCurso] = useState(false);
  const timeoutRef = useRef(null);
  const resolvioRef = useRef(false);

  // Los callbacks viajan por ref, NO por dependencias: el caller los crea
  // inline en cada render, así que como dependencias reejecutarían este
  // efecto en bucle — montar el iframe, desmontarlo, montarlo otra vez — y
  // el botón nunca llegaría a estabilizarse (gisListo se quedaría en false
  // para siempre).
  const cbRef = useRef({ onLogin, onError, onFocoSinResultado });
  cbRef.current = { onLogin, onError, onFocoSinResultado };

  const limpiarTimeoutIntento = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  useEffect(() => {
    if (!gisDisponible() || !slotRef.current) return;
    let limpiar;
    let vivo = true;

    // mountDelayMs: si este botón vive dentro de un sheet/modal que TODAVÍA
    // se está animando al montar (ej. LoginSheet.jsx: translateY entrando,
    // 240ms), Google calcula la posición/hit-area del iframe con el layout
    // del momento del montaje — si el contenedor sigue moviéndose, el
    // iframe puede terminar con su área de toque desalineada del botón
    // señuelo visible, o el usuario tocar antes de que Google termine de
    // instalar sus listeners internos. Esperar a que la animación de
    // entrada del contenedor termine antes de pedirle el botón a Google
    // evita ese desalineo — reportado en producción como "el sheet nativo
    // a veces no detecta el toque".
    const montar = () => {
      if (!vivo || !slotRef.current) return;
      renderBotonGoogle(slotRef.current, {
        theme: isDark ? 'outline' : 'outline_dark',
        colorScheme: isDark ? 'dark' : 'light',
        width,
        onLogin: (u) => { resolvioRef.current = true; setGisEnCurso(false); limpiarTimeoutIntento(); cbRef.current.onLogin?.(u); },
        onError: (e) => { resolvioRef.current = true; setGisEnCurso(false); limpiarTimeoutIntento(); cbRef.current.onError?.(e); },
        // El dominio no está en "Authorized JavaScript origins": el botón de
        // Google fallaría con "Acceso bloqueado" al tocarlo, así que se
        // esconde y el caller usa su fallback de popup.
        onOrigenRechazado: () => { if (vivo) setGisListo(false); },
      })
        .then((fn) => {
          if (!vivo) { fn?.(); return; }
          limpiar = fn;
          setGisListo(true);
        })
        .catch((err) => {
          console.warn('[LOKAL] Google Identity Services no cargó:', err?.message || err);
        });
    };

    // Antes de montar el iframe nuevo, limpiar cualquier contenido viejo
    // del slot (relevante en un remontaje por `key`: React no vacía el div
    // solo porque este efecto se re-ejecuta, el iframe anterior quedaría
    // colgado al lado del nuevo).
    if (slotRef.current) slotRef.current.innerHTML = '';
    setGisActivo(true);
    setGisListo(false);
    setGisEnCurso(false);
    resolvioRef.current = false;

    const t = mountDelayMs > 0 ? setTimeout(montar, mountDelayMs) : (montar(), null);
    return () => { vivo = false; if (t) clearTimeout(t); limpiar?.(); limpiarTimeoutIntento(); };
    // isDark: Google no reestila un botón ya montado, hay que volver a
    // pedirlo para que acompañe el cambio de tema. key: fuerza remontaje
    // manual (ver comentario del parámetro).
  }, [isDark, width, mountDelayMs, key]);

  // Detecta que el iframe recibió el click (mismo mecanismo que la técnica
  // original: al tocarlo, el iframe toma el foco y window dispara 'blur') Y
  // detecta cuándo VUELVE ese foco (el sheet nativo se cerró, con o sin
  // éxito). Si el foco vuelve y no llegó onLogin/onError, el intento se
  // cerró sin completar — se remonta el iframe DE INMEDIATO (mismo efecto
  // que "Reintentar" manual), sin depender de ningún tiempo fijo: el
  // próximo toque, sea instantáneo o no, ya encuentra un iframe fresco.
  useEffect(() => {
    let tocado = false;

    // document.hasFocus() NO sirve para distinguir "sheet real abierto" de
    // "foco interno del iframe" (se probó y se revirtió): el iframe vive
    // DENTRO del mismo documento, así que hasFocus() seguía devolviendo
    // true incluso con el sheet nativo YA abierto en la práctica — el
    // chequeo terminaba descartando toques reales y el sheet dejaba de
    // lanzarse (regresión reportada). Vuelve a marcarse gisEnCurso en el
    // blur mismo, sin esperar nada — es el comportamiento que sí lanzaba
    // el sheet siempre.
    //
    // El caso real que había que resolver (dedo sostenido sin soltar deja
    // "Entrando..." colgado para siempre) se resuelve distinto: como
    // salvavidas, se escucha 'pointerup'/'pointercancel' GLOBAL — mientras
    // el usuario no suelta el dedo el sheet nativo no puede haber
    // terminado de verdad (no hay forma de interactuar con un sheet del
    // sistema sin soltar primero el punto de contacto anterior), así que
    // si sigue tocado (gisEnCurso true, sin resolver) y el puntero se
    // suelta CERCA del slot (no se movió a otra parte de la pantalla,
    // señal de que fue el mismo gesto sostenido, no un segundo toque
    // distinto), se limpia gisEnCurso ahí. Si el toque real de verdad abrió
    // el sheet, blur/focus siguen siendo la señal principal — este listener
    // solo actúa si NO hay 'focus' porque el foco nunca salió del iframe.
    const alPerderFoco = () => {
      const dentro = slotRef.current?.contains(document.activeElement);
      if (document.activeElement?.tagName !== 'IFRAME' || !dentro || !gisActivo) return;
      tocado = true;
      resolvioRef.current = false;
      setGisEnCurso(true);
      onIframeTouch?.();
      limpiarTimeoutIntento();
      timeoutRef.current = setTimeout(() => setGisActivo(false), TIMEOUT_INTENTO_MS);
    };

    const alSoltarPointer = () => {
      if (!tocado || resolvioRef.current) return;
      // Margen corto tras soltar: si el sheet nativo se abrió de verdad
      // justo al soltar, document.hasFocus() puede tardar un instante en
      // reflejarlo — sin este margen se podía leer "true" (foco adentro
      // todavía) por una carrera de timing y cerrar el loading de un sheet
      // que sí estaba abierto.
      setTimeout(() => {
        if (tocado && !resolvioRef.current && document.hasFocus()) {
          tocado = false;
          setGisEnCurso(false);
          limpiarTimeoutIntento();
        }
      }, 300);
    };
    window.addEventListener('pointerup', alSoltarPointer, true);
    window.addEventListener('pointercancel', alSoltarPointer, true);

    // window recupera el foco cuando el sheet nativo se cierra, con o sin
    // login. Si no llegó onLogin/onError (resolvioRef sigue false), el
    // intento se cerró sin completar: avisarle YA MISMO al caller (que
    // remonta el iframe incrementando su `key`), sin esperar el timeout de
    // seguridad — esto es lo que hace que "el sheet se cierra o falla" deje
    // el botón listo para el próximo toque al instante, en vez de recién a
    // los 8s. El hook no posee `key` (es prop del caller), por eso delega.
    const alRecuperarFoco = () => {
      if (tocado && !resolvioRef.current) {
        tocado = false;
        setGisEnCurso(false);
        limpiarTimeoutIntento();
        cbRef.current.onFocoSinResultado?.();
      }
    };

    // visibilitychange como señal EXTRA: en algunos navegadores/sheets
    // nativos, la pestaña vuelve a quedar "visible" antes de que `window`
    // dispare 'focus' (reportado como "el botón queda unos segundos
    // bloqueado después de cerrar la ventana") — cualquiera de las dos
    // señales que llegue primero apaga el loading y limpia el intento.
    const alVolverVisible = () => {
      if (document.visibilityState === 'visible') alRecuperarFoco();
    };

    window.addEventListener('blur', alPerderFoco);
    window.addEventListener('focus', alRecuperarFoco);
    document.addEventListener('visibilitychange', alVolverVisible);
    return () => {
      window.removeEventListener('blur', alPerderFoco);
      window.removeEventListener('focus', alRecuperarFoco);
      window.removeEventListener('pointerup', alSoltarPointer, true);
      window.removeEventListener('pointercancel', alSoltarPointer, true);
      document.removeEventListener('visibilitychange', alVolverVisible);
    };
  }, [gisActivo]);

  return { slotRef, gisListo, gisActivo, gisEnCurso };
}
