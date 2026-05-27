import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Search, X, Check, Tag, Plus, Sparkles, Loader2 } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import {
  CATEGORIES as BASE_CATEGORIES,
  getChildren,
  getCategoryPath,
  hasChildren,
} from './categories';
import { TAXONOMY, matchCategoryLocal, normalizeText } from './data/taxonomy';

const API_BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions';

// ─── Busca en taxonomy por keywords/aliases/brands + nombre de categoría ──────
function searchWithTaxonomy(query, CATEGORIES) {
  if (!query.trim()) return [];
  const norm = normalizeText(query);

  const scored = CATEGORIES.map(cat => {
    const taxNode = TAXONOMY.find(t => t.id === cat.id);
    let score = 0;

    // nombre directo
    if (normalizeText(cat.name).includes(norm)) score += 10;

    if (taxNode) {
      const pool = [
        ...(taxNode.keywords || []),
        ...(taxNode.aliases  || []),
        ...(taxNode.brands   || []),
      ];
      for (const term of pool) {
        const t = normalizeText(term);
        if (t === norm)            score += 8;
        else if (t.startsWith(norm)) score += 5;
        else if (t.includes(norm))   score += 3;
      }
    }

    return { cat, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(s => s.cat);
}

// ─── CategoryPicker ─────────────────────────────────────────────────────────────
// Props:
//   value              — id de categoría seleccionada (string | null)
//   onChange           — (id) => void
//   onCreateCategory   — async (name, parentId) => category
//   categories         — array de categorías. Si se omite usa BASE_CATEGORIES
//   placeholder        — string
//   className          — extra clases para el wrapper
//   suggestionContext  — { titulo?, descripcion?, storeCategory? }
//                        Si se pasa, activa sugerencia IA al abrir
// ───────────────────────────────────────────────────────────────────────────────

export default function CategoryPicker({
  value,
  onChange,
  onCreateCategory,
  categories: catsProp,
  placeholder = 'Seleccionar categoría',
  className = '',
  suggestionContext = null,
}) {
  const CATEGORIES = catsProp || BASE_CATEGORIES;

  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [path, setPath]         = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');
  const [creatingLoading, setCreatingLoading] = useState(false);

  // IA
  const [suggestion, setSuggestion]     = useState(null); // { categoryId, confidence, reason, source }
  const [suggLoading, setSuggLoading]   = useState(false);
  const [suggDismissed, setSuggDismissed] = useState(false);

  const containerRef = useRef(null);
  const searchRef    = useRef(null);

  // ── Cerrar al click fuera ────────────────────────────────────────────────────
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

  useEffect(() => {
    if (open && containerRef.current) {
      setTimeout(() => containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    }
  }, [open]);

  // ── Sugerencia local al abrir ───────────────────────────────────────────────
  const runLocalSuggestion = useCallback(() => {
    if (!suggestionContext || suggDismissed) return;
    const text = [suggestionContext.titulo, suggestionContext.descripcion].filter(Boolean).join(' ');
    if (!text.trim()) return;

    const local = matchCategoryLocal(text);
    if (local && local.confidence >= 0.4) {
      setSuggestion({ ...local, source: 'local' });
    } else {
      // confianza baja → ofrecer Groq
      setSuggestion({ categoryId: null, confidence: 0, source: 'pending' });
    }
  }, [suggestionContext, suggDismissed]);

  const runGroqSuggestion = async () => {
    if (!suggestionContext) return;
    setSuggLoading(true);
    try {
      const res = await fetch(`${API_BASE}/suggest-category`, {
        signal: AbortSignal.timeout(8000),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo:      suggestionContext.titulo      || '',
          descripcion: suggestionContext.descripcion || '',
          attributes:  {},
        }),
      });
      const data = await res.json();
      if (data.categoryId) {
        setSuggestion({ categoryId: data.categoryId, confidence: data.confidence, reason: data.reason, source: 'groq' });
      }
    } catch (err) {
      // En dev sin netlify dev corriendo, mostrar error amigable
      if (err?.message?.includes('404') || err?.name === 'TypeError') {
        setSuggestion({ categoryId: null, confidence: 0, source: 'error' });
      } else {
        setSuggestion(null);
      }
    } finally {
      setSuggLoading(false);
    }
  };

  // ── Abrir picker ────────────────────────────────────────────────────────────
  const handleOpen = () => {
    if (value) {
      const catPath = getCategoryPath(value, CATEGORIES);
      setPath(catPath.slice(0, -1).map(c => c.id));
    } else {
      setPath([]);
    }
    setQuery('');
    setCreating(false);
    setOpen(true);
    if (!suggestion && !suggDismissed) runLocalSuggestion();
  };

  // ── Selección ───────────────────────────────────────────────────────────────
  const handleSelect = (cat) => {
    onChange(cat.id);
    setOpen(false);
    setQuery('');
    setCreating(false);
    setNewName('');
  };

  const applySuggestion = () => {
    if (!suggestion?.categoryId) return;
    const cat = CATEGORIES.find(c => c.id === suggestion.categoryId);
    if (!cat) return;
    onChange(cat.id);
    // navegar al nivel del nodo sugerido
    const catPath = getCategoryPath(cat.id, CATEGORIES);
    setPath(catPath.slice(0, -1).map(c => c.id));
    setSuggestion(null);
    setOpen(false);
  };

  const dismissSuggestion = () => {
    setSuggestion(null);
    setSuggDismissed(true);
  };

  const handleDrillDown = (cat) => { setPath(prev => [...prev, cat.id]); setQuery(''); };
  const handleBack      = ()    => { setPath(prev => prev.slice(0, -1)); setQuery(''); };
  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    setSuggestion(null);
    setSuggDismissed(false);
    setOpen(false);
  };

  const handleCreateConfirm = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (onCreateCategory) {
      setCreatingLoading(true);
      try {
        const cat = await onCreateCategory(trimmed, currentParentId);
        onChange(cat.id);
      } catch { onChange(trimmed); }
      finally { setCreatingLoading(false); }
    } else {
      onChange(trimmed);
    }
    setOpen(false);
    setCreating(false);
    setNewName('');
  };

  // ── Datos derivados ─────────────────────────────────────────────────────────
  const selectedCat    = value ? CATEGORIES.find(c => c.id === value) : null;
  const currentParentId = path.length > 0 ? path[path.length - 1] : null;

  const visibleCategories = useMemo(() => {
    if (query.trim().length >= 1) return searchWithTaxonomy(query.trim(), CATEGORIES);
    return getChildren(currentParentId, CATEGORIES);
  }, [query, currentParentId, CATEGORIES]);

  const breadcrumb = useMemo(() => {
    return path.map(id => CATEGORIES.find(c => c.id === id)).filter(Boolean);
  }, [path, CATEGORIES]);

  const selectedLabel = selectedCat
    ? getCategoryPath(selectedCat.id, CATEGORIES).map(c => c.name).join(' › ')
    : typeof value === 'string' && value ? value : null;

  const suggCat = suggestion?.categoryId
    ? CATEGORIES.find(c => c.id === suggestion.categoryId)
    : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={`relative ${className}`}>

      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={e => e.key === 'Enter' && handleOpen()}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-left transition-colors hover:border-primary dark:hover:border-primary cursor-pointer select-none active:scale-100"
      >
        <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        {selectedLabel ? (
          <span className="flex-1 text-sm text-slate-800 dark:text-slate-100 truncate">{selectedLabel}</span>
        ) : (
          <span className="flex-1 text-sm text-slate-400 dark:text-slate-500">{placeholder}</span>
        )}
        {selectedLabel ? (
          <button type="button" onClick={e => { e.stopPropagation(); handleClear(e); }}
            className="shrink-0 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-dropdown-in">

          {/* Search */}
          <div className="p-2 border-b border-slate-100 dark:border-white/8">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setCreating(false); }}
                placeholder="Buscar por nombre, marca, tipo..."
                autoFocus
                className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                </button>
              )}
            </div>
          </div>

          {/* Sugerencia IA */}
          {suggestionContext && !query && (() => {
            if (suggLoading) return (
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/8 flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analizando con IA...
              </div>
            );

            if (suggestion?.source === 'error') return (
              <div className="px-3 py-2 border-b border-slate-100 dark:border-white/8 flex items-center justify-between">
                <span className="text-xs text-slate-400">IA no disponible en este momento</span>
                <button type="button" onClick={dismissSuggestion} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );

            if (suggestion?.source === 'pending') return (
              <div className="px-2 py-2 border-b border-slate-100 dark:border-white/8 flex items-center gap-2">
                <button
                  type="button"
                  onClick={runGroqSuggestion}
                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  Sugerir categoría con IA
                </button>
                <button type="button" onClick={dismissSuggestion} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );

            if (suggestion?.source && suggestion.categoryId && suggCat) return (
              <div className="px-2 py-2 border-b border-slate-100 dark:border-white/8">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary-dark dark:text-primary font-medium truncate">
                      Sugerido: <strong>{getCategoryPath(suggCat.id, CATEGORIES).map(c => c.name).join(' › ')}</strong>
                    </p>
                    {suggestion.reason && (
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 truncate">{suggestion.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={applySuggestion}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium transition-colors"
                    >
                      Usar
                    </button>
                    <button type="button" onClick={dismissSuggestion} className="p-1 text-emerald-500/60 hover:text-emerald-600 dark:hover:text-emerald-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );

            return null;
          })()}

          {/* Breadcrumb */}
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
                      className="truncate hover:text-primary transition-colors max-w-[100px]"
                    >
                      {cat.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Seleccionar nivel actual */}
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

          {/* Lista */}
          <div className="p-2 max-h-56 overflow-y-auto space-y-0.5">
            {/* hint cuando hay resultados de búsqueda con taxonomy */}
            {query && visibleCategories.length > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 px-2 pb-1">
                {visibleCategories.length} resultado{visibleCategories.length !== 1 ? 's' : ''} para "<span className="font-medium">{query}</span>"
              </p>
            )}

            {visibleCategories.length === 0 && !creating && (
              <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
                {query ? 'Sin resultados — probá con otro término' : 'Sin subcategorías'}
              </p>
            )}

            {visibleCategories.map(cat => {
              const isSelected = value === cat.id;
              const canDrill   = !query && hasChildren(cat.id, CATEGORIES);
              const catPath    = query ? getCategoryPath(cat.id, CATEGORIES) : null;

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
                    {cat.icon && <CategoryIcon name={cat.icon} className="w-4 h-4 shrink-0 opacity-60" />}
                    <div className="flex-1 min-w-0">
                      <span className="truncate block">{cat.name}</span>
                      {/* En búsqueda mostrar el path completo como contexto */}
                      {catPath && catPath.length > 1 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate block">
                          {catPath.slice(0, -1).map(c => c.name).join(' › ')}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>

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

          {/* Crear categoría */}
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

          {creating && (
            <div className="px-2 pb-2 border-t border-slate-100 dark:border-white/8 pt-2 space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
                Ingresá el nombre de tu categoría.
              </p>
              <div className="flex gap-1.5">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateConfirm(); if (e.key === 'Escape') setCreating(false); }}
                  placeholder="Ej: Repuestos de tractor..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleCreateConfirm}
                  disabled={!newName.trim() || creatingLoading}
                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  {creatingLoading ? '...' : 'Usar'}
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
