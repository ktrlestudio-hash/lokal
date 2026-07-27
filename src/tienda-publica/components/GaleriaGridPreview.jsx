/**
 * GaleriaGridPreview — grid de fotos sueltas (primera foto grande 2 columnas,
 * el resto en cuadrícula pareja). NO conectado a ningún render actual.
 *
 * Historial: este era el diseño original de la card "Galería" del panel
 * admin de tienda (StoreApp.jsx → PerfilScreen), cuando tienda.galeria se
 * mostraba ahí como si fuera un álbum de fotos suelto. Se descubrió que el
 * concepto estaba mal planteado: tienda.galeria en realidad ES la portada
 * del hero público (carrusel de fondo, ver commerce-modern.jsx →
 * fotosHero/heroImg) — no una galería de fotos independiente. Las "fotos
 * sueltas para dar un vistazo del local/productos" que un dueño esperaría de
 * una "galería" ya existen como concepto propio: son las Ofertas (imagen +
 * link, con su propia sección en el hero). Tener dos nombres ("galería" y
 * "ofertas") para des conceptos que se solapan confundía al dueño real.
 *
 * Se rescata este componente porque el diseño en sí (grid asimétrico, foto
 * destacada más grande) es válido y puede volver a hacer falta el día que
 * un rubro/módulo nuevo necesite una galería de fotos genuina, sin la carga
 * semántica de "portada de hero" ni "oferta compartible". Ver memoria
 * [[lokal-links-solo-comida-rapida]] sobre soporte multi-rubro pendiente.
 *
 * Uso: <GaleriaGridPreview fotos={arrayDeUrls} />
 */
import React from 'react';

export function GaleriaGridPreview({ fotos = [] }) {
  if (!fotos.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {fotos.map((url, i) => (
        <div key={i} className={`overflow-hidden rounded-2xl bg-surface-card-2 dark:bg-surface-card-2 ${i === 0 && fotos.length > 2 ? 'col-span-2' : ''}`}>
          <img src={url} alt="" loading="lazy" decoding="async" className="w-full object-cover aspect-video" />
        </div>
      ))}
    </div>
  );
}
