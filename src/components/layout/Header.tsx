/**
 * Header Component (PageHeader)
 * Encabezado sticky con búsqueda, filtros y menú de usuario
 */

import React, { ReactNode } from 'react';
import { ArrowLeft, Bell } from 'lucide-react';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  children?: ReactNode;
  searchInput?: ReactNode;
  filtersSlot?: ReactNode;
  hideTitle?: boolean;
  showBell?: boolean;
  unreadCount?: number;
  firebaseUser?: any;
  onProfileClick?: () => void;
  showProfileDropdown?: boolean;
  profileDropdownContent?: ReactNode;
}

/**
 * Header Component
 * Encabezado sticky con búsqueda, navegación y perfil
 *
 * @example
 * <Header
 *   title="Mi Página"
 *   onBack={() => goBack()}
 *   showBell={true}
 *   unreadCount={3}
 *   searchInput={<input placeholder="Buscar..." />}
 * >
 *   <button>Acción</button>
 * </Header>
 */
export function Header({
  title = '',
  onBack,
  children,
  searchInput,
  filtersSlot,
  hideTitle = false,
  showBell = false,
  unreadCount = 0,
  firebaseUser,
  onProfileClick,
  showProfileDropdown = false,
  profileDropdownContent,
}: HeaderProps) {
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="bg-surface-card sticky top-0 z-30">
      {/* Main Header */}
      <div className="px-4 lg:px-8 h-14 flex items-center gap-2 border-b border-slate-100 dark:border-white/8">
        {/* Back Button */}
        {onBack && (
          <button onClick={onBack} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Title */}
        <h1
          className={`font-bold text-base shrink-0 truncate max-w-[7rem] lg:max-w-fit ${
            hideTitle ? 'lg:block hidden' : ''
          }`}
        >
          {title}
        </h1>

        {/* Search Input */}
        {searchInput ? (
          <div className="flex-1 min-w-0 relative mx-2">{searchInput}</div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Additional Children (Buttons, Icons, etc) */}
        {children}

        {/* Bell Icon (Notifications) */}
        {showBell && (
          <button className="ui-icon-btn text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 relative transition-colors shrink-0">
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            )}
          </button>
        )}

        {/* Profile Avatar (Mobile) */}
        <button className="ui-avatar-btn ring-2 ring-transparent hover:ring-primary transition-all shrink-0 lg:hidden">
          {firebaseUser?.photoURL ? (
            <img src={firebaseUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center font-bold text-white text-sm">
              {(firebaseUser?.displayName || 'U')[0].toUpperCase()}
            </div>
          )}
        </button>

        {/* Profile Avatar (Desktop) with Dropdown */}
        <div ref={profileDropdownRef} className="hidden lg:block relative">
          <button
            onClick={onProfileClick}
            className={`ui-avatar-btn transition-all ring-2 ${
              showProfileDropdown ? 'ring-primary' : 'ring-transparent hover:ring-primary'
            }`}
          >
            {firebaseUser?.photoURL ? (
              <img src={firebaseUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center font-bold text-white text-sm">
                {(firebaseUser?.displayName || 'U')[0].toUpperCase()}
              </div>
            )}
          </button>
          {showProfileDropdown && profileDropdownContent}
        </div>
      </div>

      {/* Filters Slot */}
      {filtersSlot && (
        <div className="border-b border-slate-100 dark:border-white/8">
          {filtersSlot}
        </div>
      )}
    </div>
  );
}

export default Header;
