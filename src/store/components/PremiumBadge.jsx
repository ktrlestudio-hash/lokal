import React from 'react';

export default function PremiumBadge({ plan, role }) {
  // plan: 'basico' | 'premium' | 'mensual' | 'anual' | etc
  // role: 'emprendimiento' | 'empresa'

  const isEmprendimiento = role === 'emprendimiento';

  if (isEmprendimiento) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 uppercase tracking-wide">
        Emprendimiento
      </span>
    );
  }

  if (plan === 'premium') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 uppercase tracking-wide">
        Premium
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wide">
      Básico
    </span>
  );
}
