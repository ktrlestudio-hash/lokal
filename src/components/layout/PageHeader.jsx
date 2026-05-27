import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Bell, Search, X } from 'lucide-react';

export default function PageHeader({
  title, onBack, children, searchInput, filtersSlot, hideTitle, showBell = false,
  searchValue = '',
  openNotifications, unreadCount = 0,
  firebaseUser, toggleProfileMenu, showProfileDropdown, profileDropdownNode,
  profileDropdownRef,
}) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchWrapRef = useRef(null);

  // Auto-foco al expandir
  useEffect(() => {
    if (searchExpanded) {
      const input = searchWrapRef.current?.querySelector('input');
      if (input) input.focus();
    }
  }, [searchExpanded]);

  // Colapsa si pierde foco y está vacío
  const handleSearchBlur = () => {
    if (!searchValue) {
      setTimeout(() => {
        // Re-check: el foco puede haber pasado a un hijo (ej: dropdown de resultados)
        if (!searchWrapRef.current?.contains(document.activeElement)) {
          setSearchExpanded(false);
        }
      }, 150);
    }
  };

  const hasSearch = !!searchInput;
  // En mobile: colapsable. En desktop: siempre expandido si hay searchInput.
  const showSearchBar = !hasSearch ? false : searchExpanded;
  const showLupa      = hasSearch && !searchExpanded;

  return (
    <div className="bg-white dark:bg-slate-900 sticky top-0 z-30">
      <div className="px-3 lg:px-8 h-14 flex items-center gap-2 border-b border-slate-100 dark:border-white/8">
        {onBack && !searchExpanded && (
          <button onClick={onBack} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Título — oculto en mobile cuando el search está expandido */}
        {!searchExpanded && (
          <h1 className={`font-bold text-base shrink-0 truncate max-w-[7rem] lg:max-w-fit ${hideTitle ? 'lg:block hidden' : ''}`}>
            {title}
          </h1>
        )}

        {/* Desktop: search bar siempre visible si hay searchInput */}
        {hasSearch && (
          <div className={`hidden lg:flex flex-1 min-w-0 relative`}>
            {searchInput}
          </div>
        )}
        {/* Desktop: spacer si no hay search */}
        {!hasSearch && <div className="hidden lg:flex flex-1" />}

        {/* Mobile: lupa cuando colapsado */}
        {showLupa && (
          <button
            onClick={() => setSearchExpanded(true)}
            className="lg:hidden ui-icon-btn text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 shrink-0 ml-auto"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {/* Mobile: barra expandida */}
        {showSearchBar && (
          <div ref={searchWrapRef} onBlur={handleSearchBlur} className="lg:hidden flex-1 min-w-0 flex items-center gap-1">
            {searchInput}
            {!searchValue && (
              <button
                onMouseDown={e => { e.preventDefault(); setSearchExpanded(false); }}
                className="ui-icon-btn shrink-0 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Spacer mobile cuando no hay search expandido */}
        {!searchExpanded && !hasSearch && <div className="flex-1 lg:hidden" />}

        {children}

        {showBell && openNotifications && (
          <button onClick={openNotifications} className="ui-icon-btn text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 relative transition-colors shrink-0">
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
          </button>
        )}

        {firebaseUser && toggleProfileMenu && (
          <>
            {/* Avatar mobile — oculto cuando search expandido */}
            {!searchExpanded && (
              <button onClick={toggleProfileMenu} className="ui-avatar-btn ring-2 ring-transparent hover:ring-primary transition-all shrink-0 lg:hidden">
                {firebaseUser.photoURL
                  ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-primary flex items-center justify-center font-bold text-white text-sm">{(firebaseUser.displayName || 'U')[0].toUpperCase()}</div>}
              </button>
            )}
            <div ref={profileDropdownRef} className="hidden lg:block relative">
              <button onClick={toggleProfileMenu} className={`ui-avatar-btn transition-all ring-2 ${showProfileDropdown ? 'ring-primary' : 'ring-transparent hover:ring-primary'}`}>
                {firebaseUser.photoURL
                  ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-primary flex items-center justify-center font-bold text-white text-sm">{(firebaseUser.displayName || 'U')[0].toUpperCase()}</div>}
              </button>
              {showProfileDropdown && profileDropdownNode}
            </div>
          </>
        )}
      </div>
      {filtersSlot && (
        <div className="border-b border-slate-100 dark:border-white/8">
          {filtersSlot}
        </div>
      )}
    </div>
  );
}
