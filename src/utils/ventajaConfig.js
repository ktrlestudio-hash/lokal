import { Tag, Zap, CreditCard, Gift } from 'lucide-react';

export const VENTAJA_CONFIG = {
  precio:         { label: 'Mejor precio',   color: 'bg-primary',   pastel: 'bg-slate-100 dark:bg-white/8',     iconColor: 'text-primary',                           Icon: Tag        },
  disponibilidad: { label: 'Tenelo hoy',     color: 'bg-amber-400', pastel: 'bg-amber-50 dark:bg-amber-500/15', iconColor: 'text-amber-500 dark:text-amber-400',     Icon: Zap, stripe: true },
  financiacion:   { label: 'Financiación',   color: 'bg-slate-600', pastel: 'bg-slate-100 dark:bg-white/8',     iconColor: 'text-slate-500 dark:text-slate-400',     Icon: CreditCard },
  combo:          { label: 'Combo especial', color: 'bg-amber-500', pastel: 'bg-slate-100 dark:bg-white/8',     iconColor: 'text-amber-500 dark:text-amber-400',     Icon: Gift       },
};
