// useBotonGoogleGIS — la LÓGICA de Google Identity Services (GIS/FedCM)
// detrás del botón de "Continuar con Google", separada del JSX visual, para
// poder montar el iframe invisible de Google DEBAJO de un botón propio con
// su propio look (a diferencia de components/BotonGoogle.jsx, que trae su
// propio visual fijo tipo pill — acá el visual queda 100% a cargo de quien
// use el hook, ej. LoginCard.jsx, que ya tenía su botón pulido).
//
// Uso:
//   const { slotRef, gisListo } = useBotonGoogleGIS({ isDark, onLogin, onError });
//   <button onClick={fallbackPopup}>...tu botón visual normal...</button>
//   <div style={{ position: 'absolute', inset: 0, opacity: 0 }}>
//     <div ref={slotRef} style={{ width: BTN_W + 20, height: 44 }} />
//   </div>
//
// El slot SIEMPRE se monta (nunca condicionado a gisListo) — si el <div
// ref={slotRef}> solo existiera cuando gisListo fuera true, el efecto de
// abajo encontraría slotRef.current === null en el primer render y nunca
// reintentaría (bug circular: el ref necesita el estado que el propio
// efecto debe setear). El caller decide el ancho real del slot con su
// propio estilo — este hook no impone un BTN_W fijo.
import { useEffect, useRef, useState } from 'react';
import { renderBotonGoogle, gisDisponible } from '../firebase';

export function useBotonGoogleGIS({ isDark, width = 260, onLogin, onError }) {
  const slotRef = useRef(null);
  const [gisListo, setGisListo] = useState(false);

  // Los callbacks viajan por ref, NO por dependencias: el caller los crea
  // inline en cada render, así que como dependencias reejecutarían este
  // efecto en bucle — montar el iframe, desmontarlo, montarlo otra vez — y
  // el botón nunca llegaría a estabilizarse (gisListo se quedaría en false
  // para siempre).
  const cbRef = useRef({ onLogin, onError });
  cbRef.current = { onLogin, onError };

  useEffect(() => {
    if (!gisDisponible() || !slotRef.current) return;
    let limpiar;
    let vivo = true;
    renderBotonGoogle(slotRef.current, {
      theme: isDark ? 'outline' : 'outline_dark',
      colorScheme: isDark ? 'dark' : 'light',
      width,
      onLogin: (u) => cbRef.current.onLogin?.(u),
      onError: (e) => cbRef.current.onError?.(e),
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
    return () => { vivo = false; limpiar?.(); };
    // isDark: Google no reestila un botón ya montado, hay que volver a
    // pedirlo para que acompañe el cambio de tema.
  }, [isDark, width]);

  return { slotRef, gisListo };
}
