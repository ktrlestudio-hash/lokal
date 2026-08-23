// StoreSidebar — sidebar de escritorio del admin de tienda.
//
// Rediseño basado en 4 referencias reales relevadas por el usuario (DOM de
// producción, no capturas): Adobe (jerarquía logo → avatar de cuenta con
// menú → nav "Principal"), ChatGPT (botón de colapsar/expandir dedicado que
// cambia de forma según el estado, no solo rota; menú de perfil separado
// del nav), Pinterest (íconos grandes, aire generoso, W_COLLAPSED ~72px) y
// Gemini (agrupar: acciones principales arriba, nav con scroll al medio,
// cuenta/config siempre al fondo).
//
// 2 cambios de comportamiento que el sidebar anterior no tenía:
//   1. Hover-preview: con el sidebar colapsado y SIN pin, pasar el mouse
//      por encima lo expande temporalmente (mismo mecanismo que Gemini/
//      ChatGPT) — antes solo había un tooltip flotante por ítem, sin
//      expansión real del panel.
//   2. Footer como un solo control de cuenta (avatar + nombre de tienda)
//      que abre un menú flotante con Panel Admin/Ver mi tienda/Tema/Mock/
//      Salir — antes eran 5 botones fijos siempre apilados, mucho ruido
//      visual permanente comparado con Adobe (avatar → menú desplegable).
import React, { useState, useRef, useEffect } from 'react';
import {
  PanelLeftClose, PanelLeftOpen, Plus, MessageSquare, Zap, TrendingUp, CreditCard, Store, Palette,
  ShieldCheck, Globe, ExternalLink, Sun, Moon, FlaskConical, LogOut, ChevronsUpDown,
} from 'lucide-react';
import { LogoFull, KtrlMark } from '../../Brand';
import { isModuleActive } from '../../tienda-publica/utils.js';

const W_COLLAPSED = 72; // Pinterest: 72px de sidebar solo-íconos
const W_EXPANDED = 232;
const HOVER_OPEN_DELAY = 120;  // ms — evita que un mouse "de paso" dispare la expansión
const HOVER_CLOSE_DELAY = 200; // ms — margen para mover el mouse del ícono al panel sin que se cierre

export function StoreSidebar({
  expanded, sidebarPinned, setSidebarPinned, setSidebarExpanded,
  tiendaData, tiendaInfo, misProductosSinFiltrar, isEmprendimiento,
  screen, navigateTo, setCreateSheetOpen,
  isAdmin, onOpenAdmin, onLogout,
  isDark, toggleTheme, mockMode, toggleMockMode,
  renderAccountAvatar,
}) {
  const [tooltip, setTooltip] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const hoverTimer = useRef(null);
  const accountRef = useRef(null);

  // Hover-preview — solo tiene efecto cuando el sidebar NO está fijado
  // (sidebarPinned). Con pin, expanded ya es un estado fijo del usuario y
  // no debe alterarse por pasar el mouse.
  const handleMouseEnter = () => {
    if (sidebarPinned) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setSidebarExpanded(true), HOVER_OPEN_DELAY);
  };
  const handleMouseLeave = () => {
    if (sidebarPinned) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => { setSidebarExpanded(false); setAccountMenuOpen(false); }, HOVER_CLOSE_DELAY);
  };
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // Cerrar el menú de cuenta al hacer click afuera.
  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const onDocClick = (e) => { if (accountRef.current && !accountRef.current.contains(e.target)) setAccountMenuOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [accountMenuOpen]);

  const togglePin = () => {
    const next = !sidebarPinned;
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

  const accountMenuItems = [
    ...(isAdmin ? [{ label: 'Panel Admin', icon: ShieldCheck, onClick: () => onOpenAdmin?.(), tone: 'violet' }] : []),
    ...(tiendaInfo.slug ? [{ label: 'Ver mi tienda', icon: Globe, href: `/${tiendaInfo.slug}`, tone: 'brand' }] : []),
    { label: isDark ? 'Modo claro' : 'Modo oscuro', icon: isDark ? Sun : Moon, onClick: toggleTheme },
    ...(isAdmin ? [{ label: mockMode ? 'Mock ON' : 'Datos mock', icon: FlaskConical, onClick: toggleMockMode, tone: mockMode ? 'violet' : undefined }] : []),
    { label: 'Salir', icon: LogOut, onClick: onLogout, tone: 'rose' },
  ];

  const toneClasses = {
    violet: 'text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10',
    brand: 'text-brand hover:bg-brand/8 dark:hover:bg-brand/10',
    rose: 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10',
  };

  return (
    <>
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="hidden lg:flex lg:flex-col bg-surface-card border-r border-slate-100 dark:border-white/8 h-screen fixed top-0 left-0 z-[200] overflow-hidden"
      style={{
        width: expanded ? W_EXPANDED : W_COLLAPSED,
        transition: 'width 380ms cubic-bezier(0.16,1,0.3,1), box-shadow 380ms ease',
        // Flyout: expandido por hover (sin pin) flota ENCIMA del contenido
        // con sombra, en vez de empujarlo — el spacer en StoreApp.jsx solo
        // reacciona a sidebarPinned, así que sin esta sombra el borde
        // derecho del sidebar quedaría "pegado" visualmente al contenido
        // de atrás sin indicar que está superpuesto.
        boxShadow: expanded && !sidebarPinned ? '4px 0 24px rgba(0,0,0,.12)' : 'none',
      }}
    >
      {/* Header: logo + botón de colapsar/expandir dedicado (Adobe/ChatGPT
          — un control con forma propia por estado, no una flecha que solo
          rota). PanelLeftClose/PanelLeftOpen en vez de un solo ícono con
          rotate: el usuario pidió específicamente mirar "qué se hace botón
          para desplegar o colapsar". */}
      <div className="border-b border-slate-100 dark:border-white/8 shrink-0">
        <div className={`flex items-center h-16 px-4 overflow-hidden gap-1 ${expanded ? '' : 'justify-center'}`}>
          {expanded && (
            <div className="flex flex-col flex-1 min-w-0">
              <LogoFull size={17} className="dark:hidden" color="#2A0509" />
              <LogoFull size={17} className="hidden dark:inline-flex" light />
              <p className="text-[10px] text-brand font-semibold mt-0.5 truncate">Panel de tienda</p>
            </div>
          )}
          <button
            onClick={togglePin}
            title={sidebarPinned ? 'Colapsar sidebar' : 'Fijar sidebar expandido'}
            className={`ui-chip ui-icon-btn shrink-0 transition-colors ${sidebarPinned ? 'text-primary bg-primary/10' : 'text-ink-dim hover:text-ink dark:hover:text-white hover:bg-surface-card-2 dark:hover:bg-white/8'}`}
          >
            {expanded ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeftOpen className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* Botón Crear */}
        <div className="px-3.5 pb-3.5">
          <button
            onClick={() => setCreateSheetOpen(true)}
            className="w-full flex items-center bg-primary hover:bg-primary-hover text-white ui-chip transition-colors overflow-hidden"
            style={{ height: 42 }}
          >
            <div className="ui-icon-btn shrink-0">
              <Plus className="w-4.5 h-4.5" />
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

      {/* Nav — íconos más grandes (Pinterest), más aire entre ítems (Gemini
          separa "principales" del resto con scroll propio). */}
      <nav className="flex-1 py-3 px-3.5 overflow-y-auto no-scrollbar overflow-x-hidden">
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
              className={`w-full flex items-center ui-chip transition-colors overflow-hidden mb-1 ${expanded ? '' : 'justify-center px-0'} ${
                isActive
                  ? 'bg-surface-card-2 dark:bg-white/8 text-ink font-bold'
                  : 'text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 hover:text-ink dark:hover:text-ink-dim'
              }`}
              style={{ height: 44 }}
            >
              <div className="ui-icon-btn shrink-0 relative">
                <Icon className="w-5 h-5" />
                {newBadge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand text-white text-[7px] font-black rounded-full flex items-center justify-center leading-none">
                    {newBadge > 9 ? '9+' : newBadge}
                  </span>
                )}
              </div>
              {/* Colapsado: width:0 (no solo opacity:0) — con solo opacity el
                  texto seguía ocupando su ancho real + el gap de .ui-chip,
                  empujando el ícono lejos del centro de los W_COLLAPSED px
                  del sidebar colapsado. */}
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

      {/* Footer: un único control de cuenta (avatar + nombre de tienda +
          chevron) — mismo patrón que Adobe ("Catriel Martinez Account" con
          menú de Editar perfil/Config* colgando del avatar) en vez de 5
          botones fijos apilados. */}
      <div ref={accountRef} className="relative px-3 pb-3 border-t border-slate-100 dark:border-white/8 pt-3 shrink-0">
        {accountMenuOpen && (
          <div
            className="absolute bottom-full mb-2 bg-surface-card border border-slate-100 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden py-1.5"
            style={{ left: expanded ? 12 : W_COLLAPSED - 12, minWidth: 200 }}
          >
            {accountMenuItems.map(({ label, icon: Icon, onClick, href, tone }) => {
              const cls = `w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold transition-colors ${tone ? toneClasses[tone] : 'text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 hover:text-ink dark:hover:text-ink-dim'}`;
              if (href) {
                return (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" onClick={() => setAccountMenuOpen(false)} className={cls}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{label}</span>
                    <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
                  </a>
                );
              }
              return (
                <button key={label} onClick={() => { onClick?.(); setAccountMenuOpen(false); }} className={cls}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                </button>
              );
            })}
          </div>
        )}
        <button
          onClick={() => setAccountMenuOpen(v => !v)}
          onMouseEnter={e => { if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ label: tiendaInfo.nombre || 'Cuenta', y: r.top + r.height / 2 }); } }}
          onMouseLeave={() => setTooltip(null)}
          className={`w-full flex items-center gap-2.5 ui-chip transition-colors overflow-hidden ${expanded ? '' : 'justify-center px-0'} ${accountMenuOpen ? 'bg-surface-card-2 dark:bg-white/8' : 'hover:bg-surface-card-2 dark:hover:bg-white/5'}`}
          style={{ height: 46 }}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-surface-card-2 dark:bg-white/8">
            {renderAccountAvatar
              ? renderAccountAvatar()
              : <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm bg-brand">{(tiendaInfo.nombre || 'T')[0]?.toUpperCase()}</div>}
          </div>
          {expanded && (
            <>
              <span className="text-sm font-bold text-ink truncate flex-1 text-left" style={{ opacity: 1, transition: 'opacity 160ms ease', transitionDelay: '80ms' }}>
                {tiendaInfo.nombre || 'Mi tienda'}
              </span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-ink-dim shrink-0" />
            </>
          )}
        </button>
        <div className="pt-2.5 flex items-center gap-1.5 px-1" style={{ opacity: expanded ? 0.25 : 0, transition: 'opacity 160ms ease' }}>
          <span className="text-[10px] text-ink-dim">por</span>
          <KtrlMark className="h-2.5 text-ink-dim" />
        </div>
      </div>
    </div>

    {/* Tooltip flotante — solo cuando el sidebar está colapsado Y no hay
        hover-preview en curso (expanded ya cubre ese caso: si expanded es
        true por hover, el propio label del ítem ya es visible). */}
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
