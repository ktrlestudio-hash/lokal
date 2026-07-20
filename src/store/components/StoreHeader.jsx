import React from 'react';
import { Menu, Bell, ArrowLeft } from 'lucide-react';

export default function StoreHeader({ title, onBack, onMenu, onNotifications, notifCount }) {
  return (
    <div className="bg-surface-card sticky top-0 z-20">
      <div className="px-4 lg:px-8 h-14 flex items-center gap-2 border-b border-slate-100 dark:border-white/8">
        {onBack && (
          <button onClick={onBack} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="font-bold text-base truncate shrink-0">{title}</h1>
        <div className="flex-1" />
        {onNotifications && (
          <button
            onClick={onNotifications}
            className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim transition-colors shrink-0 relative"
            aria-label="Notificaciones"
          >
            <Bell className="w-4.5 h-4.5" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>
        )}
        {onMenu && (
          <button
            onClick={onMenu}
            className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim transition-colors shrink-0"
            aria-label="Menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
