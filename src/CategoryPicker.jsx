import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Search, X, Check, Tag, Plus } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import {
  CATEGORIES as BASE_CATEGORIES,
  getChildren,
  getCategoryPath,
  searchCategories,
  hasChildren,
} from './categories';

// ─── CategoryPicker ────────────────────────────────────────────────────────────
// Props:
//   value              — id de categoría seleccionada (string | null)
//   onChange           — (id) => void
//   onCreateCategory   — async (name, parentId) => category — persiste y devuelve la nueva cat
//   categories         — array de categorías (base + custom). Si se omite usa BASE_CATEGORIES
//   placeholder        — string, default "Seleccionar categoría"
//   className          — extra clases para el wrapper
// ──────────────────────────────────────────────────────────────────────────────

export default function CategoryPicker({ value, onChange, onCreateCategory, categories: catsProp, placeholder = 'Seleccionar categoría', className = '' }) {
  const CATEGORIES = catsProp || BASE_CATEGORIES;
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState('');
  const [path, setPath]           = useState([]);   // ids de categorías navegadas (breadcrumb stack)
  const [creating, setCreating]   = useState(false);
  const [newName, setNewName]     = useState('');
  const containerRef              = useRef(null);
  const searchRef                 = useRef(null);

  // Cierra al clickear fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
        setCreating(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll suave para centrar el picker al abrir (evita que el dropdown quede fuera de vista)
  useEffect(() => {
    if (open && containerRef.current) {
      setTimeout(() => {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  }, [open]);

  // Categoría actualmente seleccionada
  const selectedCat = value ? CATEGORIES.find(c => c.id === value) : null;

  // Nivel actual en la navegación
  const currentParentId = path.length > 0 ? path[path.length - 1] : null;

  // Categorías visibles en el nivel actual (o resultados de búsqueda)
  const visibleCategories = useMemo(() => {
    if (query.trim().length >= 1) return searchCategories(query.trim(), CATEGORIES);
    return getChildren(currentParentId, CATEGORIES);
  }, [query, currentParentId, CATEGORIES]);

  // Breadcrumb: path de ids → array de categorías
  const breadcrumb = useMemo(() => {
    return path.map(id => CATEGORIES.find(c => c.id === id)).filter(Boolean);
  }, [path, CATEGORIES]);

  const handleOpen = () => {
    // Inicializar path al nivel de la categoría seleccionada
    if (value) {
      const catPath = getCategoryPath(value, CATEGORIES);
      setPath(catPath.slice(0, -1).map(c => c.id));
    } else {
      setPath([]);
    }
    setQuery('');
    setCreating(false);
    setOpen(true);
  };

  const handleSelect = (cat) => {
    onChange(cat.id);
    setOpen(false);
    setQuery('');
    setCreating(false);
    setNewName('');
  };

  const handleDrillDown = (cat) => {
    setPath(prev => [...prev, cat.id]);
    setQuery('');
  };

  const handleBack = () => {
    setPath(prev => prev.slice(0, -1));
    setQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const [creating_loading, setCreatingLoading] = useState(false);

  const handleCreateConfirm = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (onCreateCategory) {
      setCreatingLoading(true);
      try {
        const cat = await onCreateCategory(trimmed, currentParentId);
        onChange(cat.id);
      } catch {
        // fallback: usar el texto como id
        onChange(trimmed);
      } finally {
        setCreatingLoading(false);
      }
    } else {
      onChange(trimmed);
    }

    setOpen(false);
    setCreating(false);
    setNewName('');
  };

  // ── Render chip (categoría ya seleccionada) ─────────────────────────────────
  const selectedLabel = selectedCat
    ? getCategoryPath(selectedCat.id, CATEGORIES).map(c => c.name).join(' › ')
    : typeof value === 'string' && value
      ? value   // custom text
      : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ── Trigger button ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-left transition-colors hover:border-emerald-400 dark:hover:border-emerald-500 focus:outline-none focus:border-emerald-500"
      >
        <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        {selectedLabel ? (
          <span className="flex-1 text-sm text-slate-800 dark:text-slate-100 truncate">{selectedLabel}</span>
        ) : (
          <span className="flex-1 text-sm text-slate-400 dark:text-slate-500">{placeholder}</span>
        )}
        {selectedLabel && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {!selectedLabel && <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />}
      </button>

      {/* ── Dropdown panel ─────────────────────────────────────────────────── */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-dropdown-in">

          {/* Search bar */}
          <div className="p-2 border-b border-slate-100 dark:border-white/8">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setCreating(false); }}
                placeholder="Buscar categoría..."
                className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                </button>
              )}
            </div>
          </div>

          {/* Breadcrumb navigation */}
          {!query && breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 px-2 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Atrás
              </button>
              <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 overflow-hidden">
                {breadcrumb.map((cat, i) => (
                  <React.Fragment key={cat.id}>
                    {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
                    <button
                      type="button"
                      onClick={() => setPath(path.slice(0, i + 1))}
                      className="truncate hover:text-emerald-500 transition-colors max-w-[100px]"
                    >
                      {cat.icon && <CategoryIcon name={cat.icon} className="w-3 h-3 inline mr-0.5" />}
                      {cat.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* "Seleccionar este nivel" — disponible cuando estamos dentro de una categoría y hay coincidencia */}
          {!query && breadcrumb.length > 0 && (
            <div className="px-2 pt-1.5">
              <button
                type="button"
                onClick={() => handleSelect(breadcrumb[breadcrumb.length - 1])}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left
                  ${value === breadcrumb[breadcrumb.length - 1].id
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/8 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Seleccionar "<strong>{breadcrumb[breadcrumb.length - 1].name}</strong>"</span>
              </button>
            </div>
          )}

          {/* Lista de categorías */}
          <div className="p-2 max-h-56 overflow-y-auto space-y-0.5">
            {visibleCategories.length === 0 && !creating && (
              <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
                {query ? 'Sin resultados' : 'Sin subcategorías'}
              </p>
            )}

            {visibleCategories.map(cat => {
              const isSelected = value === cat.id;
              const canDrill   = !query && hasChildren(cat.id);
              return (
                <div key={cat.id} className="flex items-stretch gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleSelect(cat)}
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-colors
                      ${isSelected
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8'
                      }`}
                  >
                    {cat.icon && <CategoryIcon name={cat.icon} className="w-4 h-4 shrink-0" />}
                    <span className="flex-1 truncate">{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>

                  {/* Drill-down arrow — solo si tiene hijos y no estamos buscando */}
                  {canDrill && (
                    <button
                      type="button"
                      onClick={() => handleDrillDown(cat)}
                      className="flex items-center px-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title="Ver subcategorías"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* "No encuentro mi categoría" → crear */}
          {!creating && (
            <div className="px-2 pb-2 border-t border-slate-100 dark:border-white/8 pt-1.5">
              <button
                type="button"
                onClick={() => { setCreating(true); setNewName(query); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                No encuentro mi categoría
              </button>
            </div>
          )}

          {/* Formulario crear categoría */}
          {creating && (
            <div className="px-2 pb-2 border-t border-slate-100 dark:border-white/8 pt-2 space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
                Ingresá el nombre de tu categoría. Aparecerá solo en tu demanda.
              </p>
              <div className="flex gap-1.5">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateConfirm(); if (e.key === 'Escape') setCreating(false); }}
                  placeholder="Ej: Repuestos de tractor..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleCreateConfirm}
                  disabled={!newName.trim() || creating_loading}
                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  {creating_loading ? '...' : 'Usar'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-2 py-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
