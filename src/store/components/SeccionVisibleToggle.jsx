// SeccionVisibleToggle — switch "Visible en tu tienda" en el header de
// Productos/Ofertas, mismo lugar donde el dueño gestiona el contenido de
// esa sección, en vez de tener que ir a "Diseño de página" para
// prender/apagar el módulo. Guarda optimista: el switch cambia al toque,
// el PATCH viaja en paralelo (mismo criterio que toggleVisible de cada
// card individual en OfertasScreen/ProductosScreen).
//
// Reemplaza a ProductosOfertasToggle (el selector Catálogo/Ofertas DENTRO
// de una sola pantalla "productos"): ahora Productos y Ofertas son dos
// pantallas propias siempre visibles en el nav — este switch no cambia
// QUÉ ve el dueño, solo si esa sección se publica en la tienda pública
// (y por lo tanto entra o no al feed de Destacados de la Home global).
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function SeccionVisibleToggle({ activa, onToggle }) {
  const [pendiente, setPendiente] = useState(false);

  const handleClick = async () => {
    if (pendiente) return;
    setPendiente(true);
    try {
      await onToggle(!activa);
    } finally {
      setPendiente(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={pendiente}
      className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
        activa ? 'text-ok' : 'text-ink-dim'
      }`}
    >
      {activa ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
      <span className="flex-1 text-left">
        {activa ? 'Visible en tu tienda' : 'Oculta en tu tienda'}
      </span>
      <span className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${activa ? 'bg-ok' : 'bg-surface-card-2 dark:bg-white/15'}`}>
        <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${activa ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
    </button>
  );
}
