import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Bell, Search, X } from 'lucide-react';

export default function PageHeader({
  title, onBack, children, searchInput, filtersSlot, hideTitle, showBell = false,
  searchValue = '', onSearchClear,
  searchAlwaysVisible = false,
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
  // searchAlwaysVisible (ej. TodasOfertasScreen, donde buscar ES el propósito
  // central de la pantalla): la barra nunca colapsa a lupa, ni en mobile —
  // el resto de las pantallas que usan PageHeader mantienen el comportamiento
  // colapsable de siempre (sin tocar su comportamiento).
  const showSearchBar = !hasSearch ? false : (searchAlwaysVisible || searchExpanded);
  const showLupa      = hasSearch && !searchAlwaysVisible && !searchExpanded;
  const searchOpen    = searchAlwaysVisible || searchExpanded;

  return (
    <div className="bg-surface-card sticky top-0 z-30">
      <div className="px-3 lg:px-8 h-14 flex items-center gap-2 border-b border-slate-100 dark:border-white/8">
        {/* Botón atrás — SIEMPRE visible si hay onBack, incluso con la
            barra de búsqueda abierta (antes se ocultaba en mobile cuando
            searchExpanded). */}
        {onBack && (
          <button onClick={onBack} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Título — oculto en mobile cuando el search está abierto */}
        {!searchOpen && (
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

        {/* Mobile: lupa cuando colapsado (no aplica si searchAlwaysVisible) */}
        {showLupa && (
          <button
            onClick={() => setSearchExpanded(true)}
            className="lg:hidden ui-icon-btn text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 shrink-0 ml-auto"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {/* Mobile: barra expandida — la X (limpiar/cerrar) vive DENTRO del
            input (via searchInput, cada pantalla la agrega en su propio
            <input>), no como botón aparte al costado — un solo elemento
            angosto en vez de input + botón compitiendo por ancho. */}
        {showSearchBar && (
          <div ref={searchWrapRef} onBlur={searchAlwaysVisible ? undefined : handleSearchBlur} className="lg:hidden flex-1 min-w-0 flex items-center relative">
            {searchInput}
          </div>
        )}

        {/* Spacer mobile cuando no hay search abierto */}
        {!searchOpen && !hasSearch && <div className="flex-1 lg:hidden" />}

        {children}

        {showBell && openNotifications && (
          <button onClick={openNotifications} className="ui-icon-btn text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 relative transition-colors shrink-0">
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
