/**
 * Template: minimal
 * Columna única, mucho espacio, tipografía grande. Limpio y rápido.
 */
export const META = { label: 'Minimal', desc: 'Columna simple, mucho espacio. Ideal para servicios y profesionales.' };
import React from 'react';
import { Hero } from '../sections/Hero.jsx';
import { Sobre } from '../sections/Sobre.jsx';
import { ProductGrid } from '../sections/ProductGrid.jsx';
import { Horario } from '../sections/Horario.jsx';
import { Contacto } from '../sections/Contacto.jsx';
import { Galeria } from '../sections/Galeria.jsx';
import { MapaSection } from '../sections/MapaSection.jsx';

export function TemplateMinimal({ tienda, secciones, cart, onAdd, onRemove, note, isDark }) {
  const s = Object.fromEntries(secciones.map(s => [s.id, s]));
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      {s.hero?.activa      && <Hero        tienda={tienda} variant="centered" />}
      {s.sobre?.activa     && <Sobre       tienda={tienda} variant="simple" />}
      {s.contacto?.activa  && <Contacto   tienda={tienda} variant="minimal" cart={cart} note={note} />}
      {s.galeria?.activa   && <Galeria     tienda={tienda} variant="strip" />}
      {s.productos?.activa && <ProductGrid productos={tienda.productos} variant="list" cart={cart} onAdd={onAdd} onRemove={onRemove} />}
      {s.horarios?.activa  && <Horario    tienda={tienda} variant="simple" />}
      {s.mapa?.activa      && <MapaSection tienda={tienda} isDark={isDark} />}
    </div>
  );
}
