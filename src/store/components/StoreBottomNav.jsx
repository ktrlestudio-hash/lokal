import React from 'react';
import { Package, MessageSquare, Plus, Store, Menu } from 'lucide-react';

export default function StoreBottomNav({ activeTab, onTabChange, notifCount, newDemandasCount, isEmprendimiento }) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/8 z-[4500]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-end justify-around px-2 pt-2 pb-3 max-w-md mx-auto">
        {/* Inicio */}
        <button
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center gap-1 min-w-[56px]"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === 'home' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-slate-100 dark:hover:bg-white/8'}`}>
            <Package className={`w-5 h-5 ${activeTab === 'home' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${activeTab === 'home' ? 'text-primary' : 'text-slate-400'}`}>Inicio</span>
        </button>

        {/* Feed */}
        <button
          onClick={() => onTabChange('feed')}
          className="flex flex-col items-center gap-1 min-w-[56px]"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === 'feed' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-slate-100 dark:hover:bg-white/8'}`}>
            <Package className={`w-5 h-5 ${activeTab === 'feed' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${activeTab === 'feed' ? 'text-primary' : 'text-slate-400'}`}>Feed</span>
          {newDemandasCount > 0 && (
            <span className="absolute top-1 ml-4 w-4 h-4 bg-brand text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {newDemandasCount > 9 ? '9+' : newDemandasCount}
            </span>
          )}
        </button>

        {/* Crear */}
        <button
          onClick={() => onTabChange('create')}
          className="flex flex-col items-center gap-1 min-w-[56px] -mt-3"
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${activeTab === 'create' ? 'bg-slate-700 dark:bg-slate-600 rotate-45' : 'bg-primary hover:bg-primary-hover'}`}>
            <Plus className="w-7 h-7 text-white" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Crear</span>
        </button>

        {/* Productos */}
        <button
          onClick={() => onTabChange('productos')}
          className="flex flex-col items-center gap-1 min-w-[56px]"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === 'productos' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-slate-100 dark:hover:bg-white/8'}`}>
            <MessageSquare className={`w-5 h-5 ${activeTab === 'productos' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${activeTab === 'productos' ? 'text-primary' : 'text-slate-400'}`}>Productos</span>
        </button>

        {/* Perfil */}
        <button
          onClick={() => onTabChange('perfil')}
          className="flex flex-col items-center gap-1 min-w-[56px]"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === 'perfil' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-slate-100 dark:hover:bg-white/8'}`}>
            <Store className={`w-5 h-5 ${activeTab === 'perfil' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${activeTab === 'perfil' ? 'text-primary' : 'text-slate-400'}`}>{isEmprendimiento ? 'Mi perfil' : 'Mi tienda'}</span>
        </button>
      </div>
    </div>
  );
}
