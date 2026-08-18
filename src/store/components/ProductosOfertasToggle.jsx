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
  return (
    <div className="flex items-center gap-1 bg-surface-card-2 dark:bg-white/8 rounded-xl p-0.5">
      {TABS.map(([key, label, Icon]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            value === key ? 'bg-brand text-white shadow-sm' : 'text-ink-dim hover:text-ink'
          }`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
