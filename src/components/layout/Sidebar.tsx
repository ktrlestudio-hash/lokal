/**
 * Sidebar Component (DesktopSidebar) - MEJORADO con Motion
 * Navegación lateral con menú expandible
 * Ahora con indicador activo animado y tooltips mejorados
 */

import React, { ReactNode, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon, Store, Camera } from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  screen: string;
  badge?: number;
}

interface SidebarProps {
  navItems: NavItem[];
  currentScreen: string;
  onNavigate: (screen: string) => void;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  onCreateNew?: () => void;
  isHome?: boolean;
  historyBadge?: number;
}

interface Tooltip {
  label: string;
  y: number;
  badge?: number;
}

/**
 * Sidebar Component
 * Navegación lateral expandible/colapsable
 *
 * @example
 * <Sidebar
 *   navItems={[
 *     { label: 'Inicio', icon: Home, screen: 'home' },
 *     { label: 'Demandas', icon: Package, screen: 'mis-demandas' }
 *   ]}
 *   currentScreen={currentScreen}
 *   onNavigate={setCurrentScreen}
 *   expanded={sidebarExpanded}
 *   onExpandChange={setSidebarExpanded}
 *   onCreateNew={() => navigate('crear')}
 * />
 */
export function Sidebar({
  navItems,
  currentScreen,
  onNavigate,
  expanded,
  onExpandChange,
  onCreateNew,
  isHome = false,
  historyBadge = 0,
}: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const W_COLLAPSED = 64;
  const W_EXPANDED = 224;

  // Expandir al entrar con mouse, colapsar al salir (solo en pantallas no-push)
  const handleMouseEnter = () => {
    if (!isHome) onExpandChange(true);
  };

  const handleMouseLeave = () => {
    if (!isHome) onExpandChange(false);
  };

  // Colapsar al hacer click fuera
  React.useEffect(() => {
    if (isHome) return;

    const handler = (e: MouseEvent) => {
      if (!sidebarRef.current?.contains(e.target as Node)) {
        onExpandChange(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isHome, onExpandChange]);

  return (
    <>
      <motion.div
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="hidden lg:flex lg:flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-white/8 h-screen fixed top-0 left-0 z-[200] overflow-hidden"
        animate={{ width: expanded ? W_EXPANDED : W_COLLAPSED }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* ─── Logo ─── */}
        <div className="border-b border-slate-100 dark:border-white/8 shrink-0">
          <div className="flex items-center h-14 px-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
              <motion.div
                className="ui-icon-btn bg-cyan-500 hover:bg-cyan-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Store className="w-5 h-5 text-white" />
              </motion.div>
            </div>
            <motion.div
              className="overflow-hidden whitespace-nowrap ml-2"
              animate={{
                opacity: expanded ? 1 : 0,
                x: expanded ? 0 : -10,
              }}
              transition={{ duration: 0.2, delay: expanded ? 0.12 : 0 }}
            >
              <p className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">
                Lokal
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Marketplace local</p>
            </motion.div>
          </div>

          {/* New Button */}
          {onCreateNew && (
            <div className="px-3 pb-3">
              <motion.button
                onClick={onCreateNew}
                className="w-full flex items-center bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-600 text-white rounded-lg transition-colors overflow-hidden"
                style={{ height: 40 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
              >
                <div className="flex items-center justify-center w-10 h-10 shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <motion.span
                  className="text-sm font-semibold whitespace-nowrap overflow-hidden"
                  animate={{
                    opacity: expanded ? 1 : 0,
                  }}
                  transition={{ duration: 0.16, delay: expanded ? 0.09 : 0 }}
                >
                  Nueva Demanda
                </motion.span>
              </motion.button>
            </div>
          )}
        </div>

        {/* ─── Navigation Items ─── */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ label, icon: Icon, screen, badge }) => {
            const isActive = currentScreen === screen;
            const displayBadge = badge || (label === 'Historial' ? historyBadge : 0);

            return (
              <motion.button
                key={label}
                onClick={() => {
                  onNavigate(screen);
                  setTooltip(null);
                }}
                onMouseEnter={(e) => {
                  if (!expanded) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      label,
                      y: rect.top + rect.height / 2,
                      badge: displayBadge,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
                className={`w-full flex items-center rounded-lg transition-colors overflow-hidden relative ${
                  isActive
                    ? 'bg-slate-100 dark:bg-white/8 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                style={{ height: 42 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active indicator - animated pill */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-r-full"
                    layoutId="sidebar-active-indicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 shrink-0">
                  <Icon className="w-4.5 h-4.5" />
                </div>

                {/* Label */}
                <motion.span
                  className="text-sm font-semibold whitespace-nowrap flex-1 text-left overflow-hidden"
                  animate={{
                    opacity: expanded ? 1 : 0,
                  }}
                  transition={{ duration: 0.16, delay: expanded ? 0.08 : 0 }}
                >
                  {label}
                </motion.span>

                {/* Badge */}
                <AnimatePresence>
                  {displayBadge > 0 && expanded && (
                    <motion.span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2 shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                      }`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      {displayBadge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>

        {/* ─── Footer Links ─── */}
        <motion.div
          className="px-3 pb-1 overflow-hidden text-center space-y-1"
          animate={{
            opacity: expanded ? 1 : 0,
          }}
          transition={{ duration: 0.16, delay: expanded ? 0.08 : 0 }}
        >
          <div className="flex items-center justify-center gap-2">
            {[
              { label: 'Términos', path: '/terminos-y-condiciones' },
              { label: 'Privacidad', path: '/politica-de-privacidad' },
            ].map(({ label, path }) => (
              <a
                key={path}
                href={path}
                className="text-[10px] text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors whitespace-nowrap"
              >
                {label}
              </a>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ─── Tooltip (Desktop Collapsed Only) ─── */}
      <AnimatePresence>
        {tooltip && !expanded && (
          <motion.div
            className="fixed left-20 z-[201] pointer-events-none"
            style={{
              top: `${tooltip.y}px`,
            }}
            initial={{ opacity: 0, x: -8, y: '-50%' }}
            animate={{ opacity: 1, x: 0, y: '-50%' }}
            exit={{ opacity: 0, x: -8, y: '-50%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
              {tooltip.label}
              {tooltip.badge && tooltip.badge > 0 && (
                <span className="ml-2 bg-rose-500 text-white text-[9px] px-1.5 rounded-full">
                  {tooltip.badge}
                </span>
              )}
              <div
                className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
                style={{ borderRightColor: 'inherit', borderRight: '4px solid inherit' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
