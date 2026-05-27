import React, { useState } from 'react';
import {
  CheckCircle, ArrowLeft, Package, RotateCcw, Wrench,
  Link2, Copy, Tag, Sparkles
} from 'lucide-react';

const MATCH_TYPE_META = {
  'exacto-nuevo': {
    label: 'Exacto nuevo',
    desc: 'Original, sellado o sin estrenar',
    Icon: Package,
    tone: 'brand',
  },
  'exacto-usado': {
    label: 'Exacto usado',
    desc: 'Segunda mano, en buenas condiciones',
    Icon: RotateCcw,
    tone: 'brand',
  },
  reacondicionado: {
    label: 'Reacondicionado',
    desc: 'Revisado, reparado o restaurado',
    Icon: Wrench,
    tone: 'brand',
  },
  compatible: {
    label: 'Compatible',
    desc: 'Mismo uso o función, otra marca o modelo',
    Icon: Link2,
    tone: 'violet',
  },
  similar: {
    label: 'Similar',
    desc: 'Parecido, sin asegurar que sea exactamente igual',
    Icon: Copy,
    tone: 'violet',
  },
  imitacion: {
    label: 'Imitación o genérico',
    desc: 'Copia, réplica o versión no original',
    Icon: Tag,
    tone: 'violet',
  },
};

export default function MatchTypeSelector({ value, onChange }) {
  const [step, setStep] = useState('root');

  const select = (v) => { onChange(v); };
  const back = () => { onChange(null); setStep('root'); };

  const btnBase = 'w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.98]';
  const btnActive = (selected, tone = 'brand') => selected
    ? tone === 'brand'
      ? 'border-brand bg-brand/8 dark:bg-brand/10'
      : 'border-violet-400 bg-violet-50 dark:bg-violet-500/10'
    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/4';

  const renderOption = (id) => {
    const meta = MATCH_TYPE_META[id];
    const Icon = meta.Icon;
    const selected = value === id;
    const accent = meta.tone === 'brand'
      ? 'text-brand-dark dark:text-brand'
      : 'text-violet-700 dark:text-violet-400';
    const iconWrap = meta.tone === 'brand'
      ? 'bg-brand/10 text-brand'
      : 'bg-violet-100 text-violet-500 dark:bg-violet-500/10 dark:text-violet-400';

    return (
      <button key={id} onClick={() => select(id)} className={`${btnBase} ${btnActive(selected, meta.tone)}`}>
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-bold text-sm ${selected ? accent : 'text-slate-900 dark:text-white'}`}>{meta.label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{meta.desc}</p>
        </div>
        {selected && <CheckCircle className={`w-4 h-4 ml-auto shrink-0 mt-0.5 ${meta.tone === 'brand' ? 'text-brand' : 'text-violet-500'}`} />}
      </button>
    );
  };

  if (step === 'root') return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">¿Cómo coincide tu producto?</p>
      <button className={`${btnBase} ${btnActive(step === 'exacto', 'brand')}`} onClick={() => setStep('exacto')}>
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <CheckCircle className="w-4.5 h-4.5" />
        </div>
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-white">Tengo exactamente lo que pide</p>
          <p className="text-xs text-slate-400 mt-0.5">El mismo producto, misma marca o especificación</p>
        </div>
      </button>
      <button className={`${btnBase} ${btnActive(step === 'similar', 'violet')}`} onClick={() => setStep('similar')}>
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-500 dark:bg-violet-500/10 dark:text-violet-400">
          <Sparkles className="w-4.5 h-4.5" />
        </div>
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-white">No es exactamente, pero puede servir</p>
          <p className="text-xs text-slate-400 mt-0.5">Compatible, similar, alternativa o genérico</p>
        </div>
      </button>
    </div>
  );

  if (step === 'exacto') return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={back} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Es el mismo producto — ¿en qué estado?</p>
      </div>
      {['exacto-nuevo', 'exacto-usado', 'reacondicionado'].map(renderOption)}
    </div>
  );

  // similar
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={back} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">¿Qué tipo de alternativa es?</p>
      </div>
      {['compatible', 'similar', 'imitacion'].map(renderOption)}
    </div>
  );
}
