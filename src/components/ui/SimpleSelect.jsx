import React from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function SimpleSelect({ value, onChange, options, placeholder = 'Seleccionar', compact = false }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 text-left transition-colors focus:outline-none ${
          compact
            ? 'px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/8 hover:border-primary/40'
            : 'px-3 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-500'
        }`}
      >
        <span className={`flex-1 truncate font-semibold ${compact ? 'text-sm text-slate-600 dark:text-slate-300' : 'text-sm text-slate-800 dark:text-slate-100'}`}>
          {selected ? selected.label : <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 bottom-full mb-1.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-dropdown-in" style={{ maxHeight: 220, overflowY: 'auto' }}>
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors
                ${o.value === value
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
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
