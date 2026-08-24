// StoreMoreSheet — sheet mobile "Más" (avatar de cuenta, Ofertas,
// Estadísticas, Suscripción, Diseño de página, Panel Admin, mock, tema,
// salir). Cuarto componente de "shell" extraído en la Fase 3.
//
// "Ofertas" vive acá (no en la bottom-nav, que ya tiene sus 5 posiciones
// ocupadas con Productos/Mensajes-Estadísticas/Crear/Mi tienda/Más) — es
// un módulo secundario, mientras Productos (Catálogo) es el que sí merece
// slot fijo. En desktop (StoreSidebar.jsx) Ofertas SÍ tiene su propio
// ítem — ahí hay espacio de sobra.
import React from 'react';
import { Tag, TrendingUp, CreditCard, Palette, ShieldCheck, FlaskConical, Sun, Moon, LogOut } from 'lucide-react';

export function StoreMoreSheet({
  onClose,
  firebaseUser, tiendaInfo, tiendaData,
  navigateTo, setPaginaForm, setPublicPageForm, setPublicPageError, setScreen,
  isAdmin, onOpenAdmin, mockMode, toggleMockMode,
  isDark, toggleTheme, onLogout,
}) {
  const cerrar = () => onClose();

  const items = [
    // "Inicio (marketplace)" se sacó: es el feed multi-tienda del sitio
    // público, no aplica a la gestión de un mono-negocio. Estadísticas y
    // Suscripción ya no van gateadas por isEmpresa (ver navItems del
    // sidebar) — visibles para todo plan/rubro.
    { label: 'Ofertas', icon: Tag, action: () => { navigateTo('ofertas'); cerrar(); } },
    { label: 'Estadísticas', icon: TrendingUp, action: () => { navigateTo('stats'); cerrar(); } },
    { label: 'Suscripción', icon: CreditCard, action: () => { navigateTo('suscripcion'); cerrar(); } },
    {
      label: 'Diseño de página', icon: Palette, action: () => {
        setPaginaForm({ template: tiendaData?.pagina?.template || 'commerce-modern', color: tiendaData?.pagina?.color || '#e4002b', modoOscuro: tiendaData?.pagina?.modoOscuro || false });
        setPublicPageForm({ slug: tiendaData?.slug || '', tagline: tiendaData?.tagline || '', whatsapp: tiendaData?.whatsapp || tiendaData?.telefono || '', instagram: tiendaData?.instagram || '' });
        setPublicPageError(null);
        setScreen('mi-pagina');
        cerrar();
      },
    },
    isAdmin ? { label: 'Panel Admin', icon: ShieldCheck, action: () => { onOpenAdmin?.(); cerrar(); } } : null,
  ].filter(Boolean);

  return (
    <div className="lg:hidden fixed inset-0 z-[4400] flex flex-col justify-end" onClick={cerrar}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-surface-card rounded-t-3xl px-4 pt-3 pb-4 shadow-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)', animation: 'sheet-up .22s ease' }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-surface-card-2 dark:bg-white/15 mx-auto mb-4" />
        <div className="flex items-center gap-3 px-1 mb-3">
          <div className="w-11 h-11 bg-primary/10 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
            {firebaseUser?.photoURL ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-primary">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{firebaseUser?.displayName || 'Usuario'}</p>
            <p className="text-xs text-ink-dim truncate">{tiendaInfo.nombre}</p>
          </div>
        </div>
        <div className="space-y-0.5">
          {items.map(({ label, icon: Icon, action }) => (
            <button key={label} onClick={action} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors text-left">
              <Icon className="w-5 h-5 text-ink-dim shrink-0" />
              <span className="font-semibold text-sm">{label}</span>
            </button>
          ))}
          <div className="border-t border-slate-100 dark:border-white/8 my-2" />
          {isAdmin && (
            <button onClick={() => { toggleMockMode(); cerrar(); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors ${mockMode ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600' : 'hover:bg-surface-card-2 dark:hover:bg-white/5 text-ink-dim'}`}>
              <FlaskConical className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-sm">{mockMode ? 'Mock ON — desactivar' : 'Datos mock'}</span>
            </button>
          )}
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors">
            {isDark ? <Sun className="w-5 h-5 text-amber-400 shrink-0" /> : <Moon className="w-5 h-5 text-ink-dim shrink-0" />}
            <span className="font-semibold text-sm">{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 transition-colors">
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
