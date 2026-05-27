import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, size = 'md' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isSmall = size === 'sm';

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find(o => o.value === value);
  const btnCls = [
    'flex items-center gap-2 font-semibold bg-slate-100 dark:bg-white/5 border-2 transition-colors focus:outline-none',
    isSmall ? 'text-xs py-1.5 px-3' : 'text-sm py-2.5 px-4',
    open
      ? (isSmall ? 'rounded-t-xl rounded-b-none border-slate-200 dark:border-white/10 border-b-transparent' : 'rounded-t-2xl rounded-b-none border-slate-200 dark:border-white/10 border-b-transparent')
      : (isSmall ? 'rounded-xl border-transparent' : 'rounded-2xl border-transparent'),
  ].join(' ');

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen(o => !o)} className={btnCls}>
        <span className="relative">
          <span className="invisible select-none" aria-hidden>
            {options.reduce((a, b) => a.label.length >= b.label.length ? a : b).label}
          </span>
          <span className="absolute inset-0 flex items-center transition-opacity duration-150">{selected?.label}</span>
        </span>
        <ChevronDown className={['shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200', isSmall ? 'w-3 h-3' : 'w-4 h-4', open ? 'rotate-180' : ''].join(' ')} />
      </button>
      {open && (
        <div className={['absolute right-0 top-full z-50 min-w-full bg-white dark:bg-slate-900 border-2 border-t-0 border-slate-200 dark:border-white/10 shadow-2xl animate-dropdown-in p-1.5 space-y-1.5', isSmall ? 'rounded-b-xl' : 'rounded-b-2xl'].join(' ')}>
          {options.map(o => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              className={['w-full text-left px-3 font-semibold transition-colors rounded-xl', isSmall ? 'py-2 text-xs' : 'py-2.5 text-sm', o.value === value ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'hover:bg-slate-100 dark:hover:bg-white/10'].join(' ')}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
