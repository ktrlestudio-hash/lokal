import React, { useState } from 'react';

// Imagen con lazy loading y transición suave desde blur
// Uso: <LazyImg src={url} alt="" className="w-full h-full object-cover" />
export default function LazyImg({ src, alt = '', className = '', style = {}, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  if (!src || error) return null;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      className={className}
      style={{
        ...style,
        transition: 'filter 0.35s ease, opacity 0.35s ease',
        filter:   loaded ? 'none' : 'blur(12px)',
        opacity:  loaded ? 1     : 0.6,
        // translateZ(0) SOLO mientras transiciona (!loaded), no para
        // siempre — con listas de cientos de ítems (ej. 446 ofertas), cada
        // imagen ya cargada quedaba con su propia capa GPU permanente, y el
        // navegador competía por recompositar cientos de capas a la vez
        // durante el scroll: mismo bug documentado en el FAQ del landing
        // (LandingScreen.jsx, FadeUp), acá multiplicado por toda la lista.
        transform: loaded ? 'none' : 'translateZ(0)',
      }}
      {...props}
    />
  );
}
