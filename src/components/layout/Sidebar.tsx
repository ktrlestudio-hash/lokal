/**
 * Sidebar Component (DesktopSidebar)
 * Navegación lateral con menú expandible
 */

import React, { ReactNode, useRef, useState } from 'react';
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
      <div
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="hidden lg:flex lg:flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-white/8 h-screen fixed top-0 left-0 z-[200] overflow-hidden"
        style={{
          width: expanded ? W_EXPANDED : W_COLLAPSED,
          transition: 'width 380ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* ─── Logo ─── */}
        <div className="border-b border-slate-100 dark:border-white/8 shrink-0">
          <div className="flex items-center h-14 px-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
              <div className="ui-icon-btn bg-cyan-500 hover:bg-cyan-600">
                <Store className="w-5 h-5 text-white" />
              </div>
            </div>
            <div
              className="overflow-hidden whitespace-nowrap ml-2"
              style={{
                opacity: expanded ? 1 : 0,
                transition: 'opacity 200ms ease',
                transitionDelay: expanded ? '120ms' : '0ms',
              }}
            >
              <p className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">
                Lokal
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Marketplace local</p>
            </div>
          </div>

          {/* New Button */}
          {onCreateNew && (
            <div className="px-3 pb-3">
              <button
                onClick={onCreateNew}
                className="w-full flex items-center bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-600 text-white rounded-lg transition-colors overflow-hidden"
                style={{ height: 40 }}
              >
                <div className="flex items-center justify-center w-10 h-10 shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <span
                  className="text-sm font-semibold whitespace-nowrap overflow-hidden"
                  style={{
                    opacity: expanded ? 1 : 0,
                    transition: 'opacity 160ms ease',
                    transitionDelay: expanded ? '90ms' : '0ms',
                  }}
                >
                  Nueva Demanda
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ─── Navigation Items ─── */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ label, icon: Icon, screen, badge }) => {
            const isActive = currentScreen === screen;
            const displayBadge = badge || (label === 'Historial' ? historyBadge : 0);

            return (
              <button
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
                className={`w-full flex items-center rounded-lg transition-colors overflow-hidden ${
                  isActive
                    ? 'bg-slate-100 dark:bg-white/8 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                style={{ height: 42 }}
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 shrink-0">
                  <Icon className="w-4.5 h-4.5" />
                </div>

                {/* Label */}
                <span
                  className="text-sm font-semibold whitespace-nowrap flex-1 text-left overflow-hidden"
                  style={{
                    opacity: expanded ? 1 : 0,
                    transition: 'opacity 160ms ease',
                    transitionDelay: expanded ? '80ms' : '0ms',
                  }}
                >
                  {label}
                </span>

                {/* Badge */}
                {displayBadge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2 shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                    style={{
                      opacity: expanded ? 1 : 0,
                      transition: 'opacity 160ms ease',
                      transitionDelay: expanded ? '80ms' : '0ms',
                    }}
                  >
                    {displayBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ─── Footer Links ─── */}
        <div
          className="px-3 pb-1 overflow-hidden text-center space-y-1"
          style={{
            opacity: expanded ? 1 : 0,
            transition: 'opacity 160ms ease',
            transitionDelay: expanded ? '80ms' : '0ms',
          }}
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
        </div>
      </div>

      {/* ─── Tooltip (Desktop Collapsed Only) ─── */}
      {tooltip && !expanded && (
        <div
          className="fixed left-20 z-[201] pointer-events-none"
          style={{
            top: `${tooltip.y}px`,
            transform: 'translateY(-50%)',
          }}
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
        </div>
      )}
    </>
  );
}

export default Sidebar;
