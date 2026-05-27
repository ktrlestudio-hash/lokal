/**
 * Template: tarjetas
 * Grid de productos 2x2, cards con sombra. Enfocado en catálogo.
 */
export const META = { label: 'Tarjetas', desc: 'Grid visual con cards. Ideal para comercios con catálogo de productos.' };
import React from 'react';
import { Hero } from '../sections/Hero.jsx';
import { Sobre } from '../sections/Sobre.jsx';
import { ProductGrid } from '../sections/ProductGrid.jsx';
import { Horario } from '../sections/Horario.jsx';
import { Contacto } from '../sections/Contacto.jsx';
import { Galeria } from '../sections/Galeria.jsx';
import { MapaSection } from '../sections/MapaSection.jsx';

export function TemplateTarjetas({ tienda, secciones, cart, onAdd, onRemove, note, isDark }) {
  const s = Object.fromEntries(secciones.map(s => [s.id, s]));
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {s.hero?.activa      && <Hero        tienda={tienda} variant="split" />}
      {s.sobre?.activa     && <Sobre       tienda={tienda} variant="card" />}
      {s.contacto?.activa  && <Contacto   tienda={tienda} variant="cards" cart={cart} note={note} />}
      {s.galeria?.activa   && <Galeria     tienda={tienda} variant="strip" />}
      {s.productos?.activa && <ProductGrid productos={tienda.productos} variant="grid2" cart={cart} onAdd={onAdd} onRemove={onRemove} />}
      {s.horarios?.activa  && <Horario     tienda={tienda} variant="tabla" />}
      {s.mapa?.activa      && <MapaSection tienda={tienda} isDark={isDark} />}
    </div>
  );
}
