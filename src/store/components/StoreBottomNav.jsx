// StoreBottomNav — nav inferior mobile del admin de tienda (equivalente
// mobile de StoreSidebar). Tercer componente de "shell" extraído en la
// Fase 3. Segundo slot es Mensajes o Estadísticas según qué módulo esté
// activo, para mantener 5 items balanceados alrededor del FAB central en
// ambos casos, sin quedar descentrado.
//
// Publica su propia altura real como variable CSS global
// (--store-bottom-nav-h) vía ResizeObserver — así cada screen compensa el
// nav con exactamente su altura real (medida, no adivinada/hardcodeada
// como los pb-24 sueltos que había antes) y queda correcto automáticamente
// aunque cambie el contenido del nav, la safe-area, o la orientación del
// dispositivo. Cuando el nav no se renderiza (return null más abajo) la
// variable se limpia a 0 para que las screens que lo consultan no dejen un
// padding fantasma.
import React, { useRef } from 'react';
import { Tag, MessageSquare, TrendingUp, Plus, Store, Menu } from 'lucide-react';
import { isModuleActive } from '../../tienda-publica/utils.js';
import { usePublicarAlturaReal } from '../hooks/usePublicarAlturaReal.js';

export function StoreBottomNav({
  screen, inboxMobileView, tiendaData, unreadTotal, isEmprendimiento,
  navigateTo, setCreateSheetOpen, setCreateSheetClosing,
  createSheetOpen, closeCreateSheet, setMoreSheetOpen,
}) {
  const navRef = useRef(null);
  const visible = !(screen === 'mi-pagina' || (screen === 'mensajes' && inboxMobileView === 'chat'));
  usePublicarAlturaReal(navRef, visible, '--store-bottom-nav-h');

  if (!visible) return null;

  const resetCreate = () => { setCreateSheetOpen(false); setCreateSheetClosing(false); };

  return (
    <div ref={navRef} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-slate-100 dark:border-white/8 z-[4500]">
      <div className="flex items-end justify-around px-2 pt-2 pb-3 max-w-md mx-auto">
        <button onClick={() => { navigateTo('productos'); resetCreate(); }} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${screen === 'productos' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
            <Tag className={`w-5 h-5 ${screen === 'productos' ? 'text-primary' : 'text-ink-dim'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${screen === 'productos' ? 'text-primary' : 'text-ink-dim'}`}>{isModuleActive(tiendaData, 'catalogo') ? 'Productos' : 'Ofertas'}</span>
        </button>
        {/* Segundo slot: Mensajes si el módulo está activo (rubro tienda);
            si no (rubro ofertas tipo Bovril), Estadísticas — así el nav
            mantiene 5 items balanceados alrededor del FAB central en ambos
            casos, sin quedar descentrado. */}
        {isModuleActive(tiendaData, 'mensajes') ? (
        <button onClick={() => { navigateTo('mensajes'); resetCreate(); }} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${screen === 'mensajes' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
            <MessageSquare className={`w-5 h-5 ${screen === 'mensajes' ? 'text-primary' : 'text-ink-dim'}`} />
            {unreadTotal > 0 && screen !== 'mensajes' && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-brand text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-semibold ${screen === 'mensajes' ? 'text-primary' : 'text-ink-dim'}`}>Mensajes</span>
        </button>
        ) : (
        <button onClick={() => { navigateTo('stats'); resetCreate(); }} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${screen === 'stats' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
            <TrendingUp className={`w-5 h-5 ${screen === 'stats' ? 'text-primary' : 'text-ink-dim'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${screen === 'stats' ? 'text-primary' : 'text-ink-dim'}`}>Estadísticas</span>
        </button>
        )}
        <button onClick={() => createSheetOpen ? closeCreateSheet() : setCreateSheetOpen(true)} className="flex flex-col items-center gap-1 min-w-[56px] -mt-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${createSheetOpen ? 'bg-ink-dim rotate-45' : 'bg-primary hover:bg-primary-hover'}`}>
            <Plus className="w-7 h-7 text-white" />
          </div>
          <span className="text-[10px] font-semibold text-ink-dim">Crear</span>
        </button>
        <button onClick={() => { navigateTo('perfil'); resetCreate(); }} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${screen === 'perfil' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
            <Store className={`w-5 h-5 ${screen === 'perfil' ? 'text-primary' : 'text-ink-dim'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${screen === 'perfil' ? 'text-primary' : 'text-ink-dim'}`}>{isEmprendimiento ? 'Mi perfil' : 'Mi tienda'}</span>
        </button>
        <button onClick={() => setMoreSheetOpen(v => !v)} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/8 transition-colors">
            <Menu className="w-5 h-5 text-ink-dim" />
          </div>
          <span className="text-[10px] font-semibold text-ink-dim">Más</span>
        </button>
      </div>
    </div>
  );
}
