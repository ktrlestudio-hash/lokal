/**
 * StoreBottomNav (MEJORADO con Motion)
 * Navegación inferior de tienda con layoutId para indicador activo
 */

import React from 'react';
import { motion } from 'motion/react';
import { Package, MessageSquare, Plus, Store, Menu } from 'lucide-react';

export default function StoreBottomNav({ activeTab, onTabChange, notifCount, newDemandasCount, isEmprendimiento }) {
  const tabs = [
    { id: 'home', icon: Package, label: 'Inicio' },
    { id: 'feed', icon: Package, label: 'Feed', badge: newDemandasCount },
    { id: 'create', icon: Plus, label: 'Crear', special: true },
    { id: 'productos', icon: MessageSquare, label: 'Productos' },
    { id: 'perfil', icon: Store, label: isEmprendimiento ? 'Mi perfil' : 'Mi tienda' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/8 z-[4500]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-end justify-around px-2 pt-2 pb-3 max-w-md mx-auto relative">
        {tabs.map(({ id, icon: Icon, label, special, badge }) => {
          const isActive = activeTab === id;

          if (special) {
            return (
              <motion.button
                key={id}
                onClick={() => onTabChange('create')}
                className="flex flex-col items-center gap-1 min-w-[56px] -mt-3"
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: 'var(--brand-hex, #00B8D9)',
                    boxShadow: '0 4px 18px rgba(0,184,217,0.4)',
                  }}
                  whileHover={{ scale: 1.08, boxShadow: '0 6px 24px rgba(0,184,217,0.5)' }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Plus className="w-7 h-7 text-white" />
                </motion.div>
                <span className="text-[10px] font-semibold text-slate-400">{label}</span>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex flex-col items-center gap-1 min-w-[56px] relative"
              whileTap={{ scale: 0.9 }}
            >
              <div className="relative">
                <motion.div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  animate={{
                    backgroundColor: isActive ? 'rgba(0, 184, 217, 0.1)' : 'transparent',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-brand' : 'text-slate-500 dark:text-slate-400'
                    }`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </motion.div>

                {/* Badge */}
                {badge > 0 && (
                  <motion.span
                    className="absolute -top-0.5 -right-1 w-4 h-4 bg-brand text-white text-[9px] font-black rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    {badge > 9 ? '9+' : badge}
                  </motion.span>
                )}
              </div>

              <span className={`text-[10px] font-semibold transition-colors duration-200 ${
                isActive ? 'text-brand' : 'text-slate-400'
              }`}>
                {label}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand"
                  layoutId="bottom-nav-indicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
