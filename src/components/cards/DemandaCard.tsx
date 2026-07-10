/**
 * DemandaCard Component (MEJORADO con Motion)
 * Tarjeta individual para mostrar una demanda (búsqueda/necesidad)
 * Ahora con animaciones de hover, stagger y layout
 */

import React from 'react';
import { motion } from 'motion/react';
import { Package, MessageSquare, ChevronRight } from 'lucide-react';

interface Demanda {
  id: string;
  titulo: string;
  descripcion?: string;
  foto?: string;
  fotos?: string[];
  categoryId: string;
  estado: 'activa' | 'pausada' | 'resuelto';
  presupuesto?: { max: number };
  respuestas: number;
  tiempoCreado?: string;
  attributes?: Record<string, string>;
}

interface DemandaCardProps {
  demanda: Demanda;
  onClick: () => void;
  viewMode?: 'grid' | 'list';
  categoryLabel?: string;
  index?: number;
}

const estadoConfig = {
  activa: { color: 'bg-green-500', text: 'Activa' },
  pausada: { color: 'bg-amber-400', text: 'Pausada' },
  resuelto: { color: 'bg-slate-400', text: 'Resuelta' },
};

// Variantes de animación para stagger
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

/**
 * DemandaCard - Versión Grid
 */
function DemandaCardGrid({ demanda, onClick, categoryLabel, index = 0 }: DemandaCardProps & { viewMode?: 'grid' }) {
  const foto = demanda.fotos?.[0] || demanda.foto;
  const isActive = demanda.estado === 'activa';
  const ec = estadoConfig[demanda.estado] || estadoConfig.activa;

  return (
    <motion.div
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      layout
    >
      <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/6 dark:to-white/10 relative overflow-hidden">
        {foto ? (
          <motion.img
            src={foto}
            alt={demanda.titulo}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-slate-300 dark:text-white/20" />
          </div>
        )}
        {!isActive && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <span className="text-[9px] font-black text-white uppercase tracking-wider">{ec.text}</span>
          </div>
        )}
        <span className={`absolute top-2 left-2 ${ec.color} w-2 h-2 rounded-full shadow`} />
      </div>

      <div className="p-2.5">
        {categoryLabel && (
          <p className="text-[10px] font-bold text-primary dark:text-cyan-400 truncate mb-0.5">
            {categoryLabel.split(/\s+(?:y|e|&)\s+/i)[0]}
          </p>
        )}
        <p className="text-xs font-bold line-clamp-2 leading-snug text-slate-900 dark:text-white">
          {demanda.titulo}
        </p>
        <div className="flex items-center justify-between mt-1.5 gap-1">
          {demanda.presupuesto?.max ? (
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              ${Number(demanda.presupuesto.max).toLocaleString()}
            </span>
          ) : (
            <span />
          )}
          <motion.span
            className={`flex items-center gap-0.5 text-[10px] font-bold shrink-0 ${
              demanda.respuestas > 0 ? 'text-primary dark:text-cyan-400' : 'text-slate-400'
            }`}
            initial={false}
            animate={demanda.respuestas > 0 ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <MessageSquare className="w-2.5 h-2.5" />
            {demanda.respuestas}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * DemandaCard - Versión Lista
 */
function DemandaCardList({ demanda, onClick, categoryLabel, index = 0 }: DemandaCardProps & { viewMode?: 'list' }) {
  const foto = demanda.fotos?.[0] || demanda.foto;
  const isActive = demanda.estado === 'activa';
  const ec = estadoConfig[demanda.estado] || estadoConfig.activa;

  return (
    <motion.div
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex gap-3.5 cursor-pointer transition-shadow duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 group"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={{ scale: 1.01, x: 2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      layout
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/6 dark:to-white/10 shrink-0 overflow-hidden relative flex items-center justify-center self-start mt-0.5">
        {foto ? (
          <img src={foto} alt={demanda.titulo} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-7 h-7 text-slate-300 dark:text-white/20" />
        )}
        {!isActive && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-[8px] font-black text-white uppercase tracking-wider">{ec.text}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`w-1.5 h-1.5 rounded-full ${ec.color} shrink-0`} />
          {categoryLabel && (
            <span className="text-[10px] font-bold text-primary dark:text-cyan-400 truncate">
              {categoryLabel.split(/\s+(?:y|e|&)\s+/i)[0]}
            </span>
          )}
          <span className="text-[10px] text-slate-300 dark:text-white/20">·</span>
          <span className="text-[10px] text-slate-400 shrink-0">{demanda.tiempoCreado}</span>
        </div>

        <h3 className="font-bold text-sm leading-snug line-clamp-1 mb-1 text-slate-900 dark:text-white">
          {demanda.titulo}
        </h3>

        {demanda.descripcion && (
          <p className="text-xs text-slate-400 line-clamp-1 mb-2">{demanda.descripcion}</p>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {demanda.presupuesto?.max && (
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/8 px-2 py-0.5 rounded-full">
              hasta ${Number(demanda.presupuesto.max).toLocaleString()}
            </span>
          )}

          {demanda.attributes &&
            Object.entries(demanda.attributes)
              .slice(0, 1)
              .map(([k, v]) => (
                <span
                  key={k}
                  className="text-[10px] bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium"
                >
                  {k}: {v}
                </span>
              ))}

          <motion.span
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ml-auto shrink-0 ${
              demanda.respuestas > 0
                ? 'text-primary dark:text-cyan-400 bg-primary/8 dark:bg-primary/10'
                : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/6'
            }`}
            initial={false}
            animate={demanda.respuestas > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <MessageSquare className="w-2.5 h-2.5" />
            {demanda.respuestas} resp.
          </motion.span>
        </div>
      </div>

      <motion.div
        className="self-center shrink-0"
        initial={{ opacity: 0, x: -4 }}
        whileHover={{ opacity: 1, x: 0 }}
      >
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-brand transition-colors" />
      </motion.div>
    </motion.div>
  );
}

/**
 * DemandaCard Component
 * Renderiza la tarjeta en grid o list mode
 *
 * @example
 * <DemandaCard
 *   demanda={demanda}
 *   viewMode="grid"
 *   categoryLabel="Electrónica"
 *   onClick={() => navigate('detalle')}
 * />
 */
export function DemandaCard({
  demanda,
  onClick,
  viewMode = 'grid',
  categoryLabel,
  index = 0,
}: DemandaCardProps) {
  if (viewMode === 'list') {
    return (
      <DemandaCardList demanda={demanda} onClick={onClick} categoryLabel={categoryLabel} index={index} />
    );
  }

  return (
    <DemandaCardGrid demanda={demanda} onClick={onClick} categoryLabel={categoryLabel} index={index} />
  );
}

// Exportar versiones individuales si se necesitan
export { DemandaCardGrid, DemandaCardList };
