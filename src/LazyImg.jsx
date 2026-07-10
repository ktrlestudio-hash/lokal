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
        transform: 'translateZ(0)', // GPU layer
      }}
      {...props}
    />
  );
}
