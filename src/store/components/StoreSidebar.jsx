import React from 'react';
import {
  Home, Package, Zap, TrendingUp, Store, Globe, ExternalLink,
  Sun, Moon, LogOut
} from 'lucide-react';
import { LogoFull, KtrlMark } from '../../Brand';

export default function StoreSidebar({ activeScreen, onNavigate, isEmprendimiento, isPremium, tiendaData, dias, isActiva }) {
  const tiendaInfo = tiendaData || {};
  const isEmpresa = !isEmprendimiento;
  const newDemandasCount = tiendaData?._newDemandasCount || 0;
  const misProductosCount = tiendaData?._misProductosCount || 0;

  const navItems = [
    { label: 'Inicio', icon: Home, id: 'home' },
    ...(isEmprendimiento
      ? [{ label: 'Demandas', icon: Package, id: 'feed' }]
      : [{ label: 'Demandas', icon: Package, id: 'feed', newBadge: newDemandasCount }]
    ),
    { label: 'Mis productos', icon: Zap, id: 'productos', badge: misProductosCount || null },
    ...(isEmpresa ? [{ label: 'Estadísticas', icon: TrendingUp, id: 'stats' }] : []),
    { label: isEmprendimiento ? 'Mi perfil' : 'Mi tienda', icon: Store, id: 'perfil' },
  ];

  return (
    <div className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-slate-900 border-r-2 border-slate-100 dark:border-white/10 h-screen sticky top-0 shrink-0">
      <div className="p-5 border-b-2 border-slate-100 dark:border-white/10">
        <LogoFull size={20} className="dark:hidden mb-4" color="#0B132B" />
        <LogoFull size={20} className="hidden dark:inline-flex mb-4" light />
        <div className="min-w-0">
          <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{tiendaInfo.nombre}</p>
          <p className="text-xs text-brand font-semibold">Panel de tienda</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ label, icon: Icon, id, badge, newBadge }) => {
          const isActive = id === 'feed' ? (activeScreen === 'feed' || activeScreen === 'demanda-detail') : activeScreen === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${isActive ? 'bg-slate-900 dark:bg-brand/15 text-white dark:text-brand' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}`}
            >
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {newBadge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-brand text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                    {newBadge > 9 ? '9+' : newBadge}
                  </span>
                )}
              </div>
              <span className="font-semibold flex-1">{label}</span>
              {badge > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t-2 border-slate-100 dark:border-white/10 space-y-1">
        {tiendaInfo.slug && (
          <a
            href={`/t/${tiendaInfo.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-brand hover:bg-brand/8 dark:hover:bg-brand/10 transition-colors"
          >
            <Globe className="w-5 h-5" />
            <span className="font-semibold">Ver mi tienda</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
          </a>
        )}
        <button
          onClick={() => onNavigate('toggleTheme')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <Sun className="w-5 h-5 text-amber-400" />
          <span className="font-semibold">Tema</span>
        </button>
        <button
          onClick={() => onNavigate('logout')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Cerrar sesión</span>
        </button>
        <div className="pt-3 flex items-center gap-1.5 px-1 opacity-25">
          <span className="text-[10px] text-slate-400">por</span>
          <KtrlMark className="h-2.5 text-slate-400" />
        </div>
      </div>
    </div>
  );
}
