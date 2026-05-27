/**
 * Template: magazine
 * Banner full-width, layout asimétrico, galería masonry. Impacto visual.
 */
export const META = { label: 'Magazine', desc: 'Banner full-width y layout asimétrico. Para marcas con identidad fuerte.' };
import React from 'react';
import { Hero } from '../sections/Hero.jsx';
import { Sobre } from '../sections/Sobre.jsx';
import { ProductGrid } from '../sections/ProductGrid.jsx';
import { Horario } from '../sections/Horario.jsx';
import { Contacto } from '../sections/Contacto.jsx';
import { Galeria } from '../sections/Galeria.jsx';
import { MapaSection } from '../sections/MapaSection.jsx';

export function TemplateMagazine({ tienda, secciones, cart, onAdd, onRemove, note, isDark }) {
  const s = Object.fromEntries(secciones.map(s => [s.id, s]));
  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {s.hero?.activa      && <Hero        tienda={tienda} variant="banner" />}
      {s.sobre?.activa     && <Sobre       tienda={tienda} variant="card" />}
      {s.contacto?.activa  && <Contacto   tienda={tienda} variant="cards" cart={cart} note={note} />}
      {s.galeria?.activa   && <Galeria     tienda={tienda} variant="masonry" />}
      {s.productos?.activa && <ProductGrid productos={tienda.productos} variant="grid3" cart={cart} onAdd={onAdd} onRemove={onRemove} />}
      {s.horarios?.activa  && <Horario     tienda={tienda} variant="tabla" />}
      {s.mapa?.activa      && <MapaSection tienda={tienda} isDark={isDark} />}
    </div>
  );
}
