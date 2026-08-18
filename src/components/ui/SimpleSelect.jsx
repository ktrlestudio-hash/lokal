import React from 'react';
import { ChevronDown, Check } from 'lucide-react';

const PANEL_MAX_HEIGHT = 220;

export default function SimpleSelect({ value, onChange, options, placeholder = 'Seleccionar', compact = false }) {
  const [open, setOpen] = React.useState(false);
  const [abrirHaciaArriba, setAbrirHaciaArriba] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  const selected = options.find(o => o.value === value);

  // Si no hay espacio hacia abajo pero sí hacia arriba, el panel se abre
  // hacia arriba en vez de quedar cortado/tapado por el borde de la
  // pantalla o el footer del wizard — se mide en el momento de abrir, no
  // reactivo a scroll (evita recalcular en cada frame por poco beneficio
  // real, el layout no suele cambiar mientras el panel está abierto).
  const toggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - rect.bottom;
      setAbrirHaciaArriba(espacioAbajo < PANEL_MAX_HEIGHT && rect.top > espacioAbajo);
    }
    setOpen(v => !v);
  };

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={toggle}
        className={`w-full flex items-center gap-2 text-left transition-colors focus:outline-none ${
          compact
            ? 'px-3 py-1.5 rounded-full border border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 hover:border-brand/50'
            : 'px-3 py-2.5 rounded-2xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 hover:border-brand'
        }`}
      >
        <span className="flex-1 truncate font-semibold text-sm text-ink">
          {selected ? selected.label : <span className="text-ink-dim">{placeholder}</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-ink-dim shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`absolute z-50 left-0 right-0 rounded-2xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-[#1c222e] shadow-xl overflow-hidden animate-dropdown-in ${
          abrirHaciaArriba ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        }`} style={{ maxHeight: PANEL_MAX_HEIGHT, overflowY: 'auto' }}>
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors
                ${o.value === value
                  ? 'bg-brand/10 dark:bg-brand/15 text-brand-dark dark:text-brand font-semibold'
                  : 'text-ink hover:bg-surface-card-2 dark:hover:bg-white/10'
                }`}
            >
              {o.value === value && <Check className="w-3.5 h-3.5 shrink-0" />}
              <span className={o.value === value ? '' : 'pl-5'}>{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
