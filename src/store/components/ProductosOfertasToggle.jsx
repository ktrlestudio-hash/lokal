// ProductosOfertasToggle — selector Ofertas/Catálogo que reemplaza el
// título en el header (StorePageHeader leftSlot) cuando la tienda tiene
// ambos módulos activos a la vez. Antes vivía como una barra aparte ENCIMA
// de la screen — eso le restaba altura real al h-[100dvh] interno de
// OfertasScreen/ProductosScreen y generaba scroll de sobra incluso con la
// lista vacía. Viviendo dentro del header no resta nada: el header ya
// tiene su propia altura fija (h-14 lg:h-16) que la screen ya descuenta.
import React from 'react';
import { Tag, Package } from 'lucide-react';

const TABS = [
  ['ofertas', 'Ofertas', Tag],
  ['catalogo', 'Catálogo', Package],
];

export function ProductosOfertasToggle({ value, onChange }) {
  const activeIdx = TABS.findIndex(([key]) => key === value);
  return (
    // h-10 (40px) — misma altura que el avatar de cuenta (.ui-avatar-btn) y
    // el resto de acciones del header, antes quedaba ~8px más bajo por
    // depender solo del padding vertical del texto.
    //
    // Cápsula con "thumb" deslizante (un solo div celeste con transform,
    // no cada botón pintando su propio fondo) — mismo patrón que el
    // selector de MV Distribuciones. relative/absolute en vez de grid con
    // transition de background-color porque un color que cambia de golpe
    // no se percibe como movimiento; el thumb necesita animar posición.
    // cubic-bezier con overshoot (en vez de ease-out) para el mini-rebote
    // pedido — Tailwind no trae una curva de rebote de fábrica.
    <div className="relative h-10 flex items-center gap-1 bg-surface-card-2 dark:bg-white/8 rounded-xl p-0.5">
      <div
        className="absolute top-0.5 bottom-0.5 rounded-lg bg-brand shadow-sm"
        style={{
          width: `calc(${100 / TABS.length}% - 4px)`,
          transform: `translateX(calc(${activeIdx * 100}% + ${activeIdx * 4}px))`,
          transition: 'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        aria-hidden="true"
      />
      {TABS.map(([key, label, Icon]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`relative z-10 h-full flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            value === key ? 'text-white' : 'text-ink-dim hover:text-ink'
          }`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
