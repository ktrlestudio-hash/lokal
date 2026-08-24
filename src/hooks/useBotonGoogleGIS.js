// useBotonGoogleGIS — la LÓGICA de Google Identity Services (GIS/FedCM)
// detrás del botón de "Continuar con Google", separada del JSX visual, para
// poder montar el iframe invisible de Google DEBAJO de un botón propio con
// su propio look (a diferencia de components/BotonGoogle.jsx, que trae su
// propio visual fijo tipo pill — acá el visual queda 100% a cargo de quien
// use el hook, ej. LoginCard.jsx, que ya tenía su botón pulido).
//
// Uso:
//   const { slotRef, gisActivo } = useBotonGoogleGIS({ isDark, onLogin, onError });
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
// (que no hace nada), nunca el fallback de popup de abajo. Sin forma de
// detectar el fallo desde afuera del iframe, se usa un timeout de
// seguridad: si el usuario tocó el botón (el iframe pierde el foco, mismo
// mecanismo que detecta el "press" visual) y no llegó onLogin/onError en un
// tiempo razonable, se asume que FedCM está bloqueado y gisActivo pasa a
// false — pointerEvents:none en el overlay deja de interceptar el click, y
// el botón de abajo (popup) vuelve a responder en el siguiente toque.
const TIMEOUT_INTENTO_MS = 4000;

import { useEffect, useRef, useState } from 'react';
import { renderBotonGoogle, gisDisponible } from '../firebase';

export function useBotonGoogleGIS({ isDark, width = 260, onLogin, onError }) {
  const slotRef = useRef(null);
  const [gisListo, setGisListo] = useState(false);
  const [gisActivo, setGisActivo] = useState(true);
  const timeoutRef = useRef(null);

  // Los callbacks viajan por ref, NO por dependencias: el caller los crea
  // inline en cada render, así que como dependencias reejecutarían este
  // efecto en bucle — montar el iframe, desmontarlo, montarlo otra vez — y
  // el botón nunca llegaría a estabilizarse (gisListo se quedaría en false
  // para siempre).
  const cbRef = useRef({ onLogin, onError });
  cbRef.current = { onLogin, onError };

  const limpiarTimeoutIntento = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  useEffect(() => {
    if (!gisDisponible() || !slotRef.current) return;
    let limpiar;
    let vivo = true;
    renderBotonGoogle(slotRef.current, {
      theme: isDark ? 'outline' : 'outline_dark',
      colorScheme: isDark ? 'dark' : 'light',
      width,
      onLogin: (u) => { limpiarTimeoutIntento(); cbRef.current.onLogin?.(u); },
      onError: (e) => { limpiarTimeoutIntento(); cbRef.current.onError?.(e); },
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
    return () => { vivo = false; limpiar?.(); limpiarTimeoutIntento(); };
    // isDark: Google no reestila un botón ya montado, hay que volver a
    // pedirlo para que acompañe el cambio de tema.
  }, [isDark, width]);

  // Detecta que el iframe recibió el click (mismo mecanismo que la técnica
  // original: al tocarlo, el iframe toma el foco y window dispara 'blur').
  // Arranca el timeout de seguridad ahí — si FedCM completa (onLogin) o
  // falla de forma visible (onError), el timeout se cancela arriba.
  useEffect(() => {
    const alPerderFoco = () => {
      const dentro = slotRef.current?.contains(document.activeElement);
      if (document.activeElement?.tagName === 'IFRAME' && dentro && gisActivo) {
        limpiarTimeoutIntento();
        timeoutRef.current = setTimeout(() => setGisActivo(false), TIMEOUT_INTENTO_MS);
      }
    };
    window.addEventListener('blur', alPerderFoco);
    return () => window.removeEventListener('blur', alPerderFoco);
  }, [gisActivo]);

  return { slotRef, gisListo, gisActivo };
}
