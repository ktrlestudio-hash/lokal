// StoreSidebar — sidebar de escritorio del admin de tienda (logo, botón
// Crear, nav de secciones, footer con panel admin/ver tienda/tema/mock/
// salir). Segundo componente de "shell" extraído en la Fase 3. Ya tenía
// estado propio (tooltip) — era efectivamente un componente invocado como
// función en vez de <Sidebar/>, extraerlo a un componente real no cambia
// su forma, solo dónde vive.
import React, { useState } from 'react';
import {
  PanelLeft, Plus, MessageSquare, Zap, TrendingUp, CreditCard, Store, Palette,
  ShieldCheck, Globe, ExternalLink, Sun, Moon, FlaskConical, LogOut,
} from 'lucide-react';
import { LogoFull, KtrlMark } from '../../Brand';
import { isModuleActive } from '../../tienda-publica/utils.js';

const W_COLLAPSED = 64;
const W_EXPANDED = 224;

export function StoreSidebar({
  expanded, sidebarPinned, setSidebarPinned, setSidebarExpanded,
  tiendaData, tiendaInfo, misProductosSinFiltrar, isEmprendimiento,
  screen, navigateTo, setCreateSheetOpen,
  isAdmin, onOpenAdmin, onLogout,
  isDark, toggleTheme, mockMode, toggleMockMode,
}) {
  const [tooltip, setTooltip] = useState(null);

  const togglePin = () => {
    const next = !expanded;
    setSidebarPinned(next);
    setSidebarExpanded(next);
    localStorage.setItem('lokal-store-sidebar-pinned', String(next));
  };

  const navItems = [
    // "Inicio" (feed marketplace multi-tienda) se sacó: no aplica a la
    // gestión de un mono-negocio.
    ...(isModuleActive(tiendaData, 'mensajes') ? [{ label: 'Mensajes', icon: MessageSquare, id: 'mensajes' }] : []),
    { label: isModuleActive(tiendaData, 'catalogo') ? 'Mis productos' : 'Ofertas', icon: Zap, id: 'productos', badge: misProductosSinFiltrar.filter(o => o.activa !== false && o.visible !== false).length || null },
    // Estadísticas y Suscripción: transversales a todo plan/rubro (la
    // suscripción es 1 mes gratis + monto por rubro que fija el admin
    // general). Antes gateadas con isEmpresa, lo que las ocultaba a las
    // tiendas Emprendimiento — que es justo el caso más común.
    { label: 'Estadísticas', icon: TrendingUp, id: 'stats' },
    { label: 'Suscripción', icon: CreditCard, id: 'suscripcion' },
    { label: isEmprendimiento ? 'Mi perfil' : 'Mi tienda', icon: Store, id: 'perfil' },
    { label: 'Diseño de página', icon: Palette, id: 'mi-pagina' },
  ];

  return (
    <>
    <div
      className="hidden lg:flex lg:flex-col bg-surface-card border-r border-slate-100 dark:border-white/8 h-screen fixed top-0 left-0 z-[200] overflow-hidden"
      style={{ width: expanded ? W_EXPANDED : W_COLLAPSED, transition: 'width 380ms cubic-bezier(0.16,1,0.3,1)' }}
    >
      {/* Logo + pin */}
      <div className="border-b border-slate-100 dark:border-white/8 shrink-0">
        <div className={`flex items-center h-14 px-3 overflow-hidden gap-1 ${expanded ? '' : 'justify-center'}`}>
          {expanded && (
            <div className="flex flex-col flex-1 min-w-0 px-1">
              <LogoFull size={16} className="dark:hidden" color="#2A0509" />
              <LogoFull size={16} className="hidden dark:inline-flex" light />
              <p className="text-[10px] text-brand font-semibold mt-0.5 truncate">Panel de tienda</p>
            </div>
          )}
          <button
            onClick={togglePin}
            title={sidebarPinned ? 'Soltar sidebar' : 'Fijar sidebar'}
            className={`ui-chip ui-icon-btn shrink-0 transition-colors ${sidebarPinned ? 'text-primary bg-primary/10' : 'text-ink-dim hover:text-ink dark:hover:text-white hover:bg-surface-card-2 dark:hover:bg-white/8'}`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Botón Crear */}
        <div className="px-3 pb-3">
          <button
            onClick={() => setCreateSheetOpen(true)}
            className="w-full flex items-center bg-primary hover:bg-primary-hover text-white ui-chip transition-colors overflow-hidden"
            style={{ height: 40 }}
          >
            <div className="ui-icon-btn shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <span
              className="text-sm font-semibold whitespace-nowrap overflow-hidden"
              style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '90ms' : '0ms' }}
            >
              Crear
            </span>
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto no-scrollbar overflow-x-hidden">
        {navItems.map(({ label, icon: Icon, id, badge, newBadge }) => {
          const isActive = screen === id;
          return (
            <button
              key={id}
              onClick={() => { navigateTo(id); setTooltip(null); }}
              onMouseEnter={e => {
                if (!expanded) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ label, y: rect.top + rect.height / 2, badge: newBadge || badge });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              className={`w-full flex items-center ui-chip transition-colors overflow-hidden mb-0.5 ${expanded ? '' : 'justify-center px-0'} ${
                isActive
                  ? 'bg-surface-card-2 dark:bg-white/8 text-ink font-bold'
                  : 'text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 hover:text-ink dark:hover:text-ink-dim'
              }`}
              style={{ height: 42 }}
            >
              <div className="ui-icon-btn shrink-0 relative">
                <Icon className="w-4.5 h-4.5" />
                {newBadge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand text-white text-[7px] font-black rounded-full flex items-center justify-center leading-none">
                    {newBadge > 9 ? '9+' : newBadge}
                  </span>
                )}
              </div>
              {/* Colapsado: width:0 (no solo opacity:0) — con solo opacity el
                  texto seguía ocupando su ancho real + el gap de .ui-chip,
                  empujando el ícono lejos del centro de los 64px del
                  sidebar colapsado. */}
              <span
                className="text-sm font-semibold whitespace-nowrap flex-1 text-left overflow-hidden"
                style={expanded
                  ? { opacity: 1, transition: 'opacity 160ms ease', transitionDelay: '80ms' }
                  : { opacity: 0, width: 0, flex: '0 0 0px', transition: 'opacity 160ms ease' }}
              >
                {label}
              </span>
              {badge > 0 && expanded && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2 shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-surface-card-2 dark:bg-white/10 text-ink-dim'}`}
                  style={{ opacity: 1, transition: 'opacity 160ms ease', transitionDelay: '80ms' }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-2 border-t border-slate-100 dark:border-white/8 pt-2 space-y-0.5 shrink-0">
        {isAdmin && (
          <button
            onClick={() => onOpenAdmin?.()}
            onMouseEnter={e => { if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ label: 'Panel Admin', y: r.top + r.height / 2 }); } }}
            onMouseLeave={() => setTooltip(null)}
            className="w-full flex items-center ui-chip text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors overflow-hidden"
            style={{ height: 42 }}
          >
            <div className="ui-icon-btn shrink-0"><ShieldCheck className="w-4.5 h-4.5" /></div>
            <span className="text-sm font-semibold whitespace-nowrap" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}>Panel Admin</span>
          </button>
        )}
        {tiendaInfo.slug && (
          <a
            href={`/${tiendaInfo.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={e => { if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ label: 'Ver mi tienda', y: r.top + r.height / 2 }); } }}
            onMouseLeave={() => setTooltip(null)}
            className="w-full flex items-center ui-chip text-brand hover:bg-brand/8 dark:hover:bg-brand/10 transition-colors overflow-hidden"
            style={{ height: 42 }}
          >
            <div className="ui-icon-btn shrink-0"><Globe className="w-4.5 h-4.5" /></div>
            <span className="text-sm font-semibold whitespace-nowrap flex-1" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}>Ver mi tienda</span>
            <ExternalLink className="w-3 h-3 mr-2 opacity-50 shrink-0" style={{ opacity: expanded ? 0.5 : 0, transition: 'opacity 160ms ease' }} />
          </a>
        )}
        <button
          onClick={toggleTheme}
          onMouseEnter={e => { if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ label: isDark ? 'Modo claro' : 'Modo oscuro', y: r.top + r.height / 2 }); } }}
          onMouseLeave={() => setTooltip(null)}
          className="w-full flex items-center ui-chip text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 hover:text-ink dark:hover:text-ink-dim transition-colors overflow-hidden"
          style={{ height: 42 }}
        >
          <div className="ui-icon-btn shrink-0">
            {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
          </div>
          <span className="text-sm font-semibold whitespace-nowrap" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}>
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </span>
        </button>
        {isAdmin && (
          <button
            onClick={toggleMockMode}
            onMouseEnter={e => { if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ label: mockMode ? 'Mock ON' : 'Mock', y: r.top + r.height / 2 }); } }}
            onMouseLeave={() => setTooltip(null)}
            className={`w-full flex items-center ui-chip transition-colors overflow-hidden ${mockMode ? 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20' : 'text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 hover:text-ink dark:hover:text-ink-dim'}`}
            style={{ height: 42 }}
          >
            <div className="ui-icon-btn shrink-0"><FlaskConical className="w-4.5 h-4.5" /></div>
            <span className="text-sm font-semibold whitespace-nowrap" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}>
              {mockMode ? 'Mock ON' : 'Datos mock'}
            </span>
          </button>
        )}
        <button
          onClick={onLogout}
          onMouseEnter={e => { if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ label: 'Salir', y: r.top + r.height / 2 }); } }}
          onMouseLeave={() => setTooltip(null)}
          className="w-full flex items-center ui-chip text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors overflow-hidden"
          style={{ height: 42 }}
        >
          <div className="ui-icon-btn shrink-0"><LogOut className="w-4.5 h-4.5" /></div>
          <span className="text-sm font-semibold whitespace-nowrap" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}>Salir</span>
        </button>
        <div className="pt-2 flex items-center gap-1.5 px-1" style={{ opacity: expanded ? 0.25 : 0, transition: 'opacity 160ms ease' }}>
          <span className="text-[10px] text-ink-dim">por</span>
          <KtrlMark className="h-2.5 text-ink-dim" />
        </div>
      </div>
    </div>

    {/* Tooltip flotante */}
    {tooltip && !expanded && (
      <div
        className="fixed z-[9999] pointer-events-none hidden lg:block"
        style={{ left: W_COLLAPSED + 8, top: tooltip.y, transform: 'translateY(-50%)' }}
      >
        <div className="relative flex items-center gap-2 bg-ink dark:bg-surface-card-2 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap">
          <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[6px] border-r-slate-900 dark:border-r-slate-700" />
          {tooltip.label}
          {tooltip.badge > 0 && (
            <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tooltip.badge}</span>
          )}
        </div>
      </div>
    )}
    </>
  );
}
