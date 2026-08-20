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

      {/* Trigger — borde celeste mientras open=true, no solo en :hover:
          sin esto, con el dropdown ya abierto el trigger se veía idéntico
          a cerrado (borde gris fijo), sin ninguna señal de que este campo
          es el que está activo. */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={e => e.key === 'Enter' && handleOpen()}
        className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl border-2 bg-surface-card text-left transition-colors hover:border-brand cursor-pointer select-none active:scale-100 ${open ? 'border-brand' : 'border-slate-200 dark:border-white/10'}`}
      >
        <Tag className="w-4 h-4 text-ink-dim shrink-0" />
        {selectedLabel ? (
          <span className="flex-1 text-sm text-ink dark:text-ink-dim truncate">{selectedLabel}</span>
        ) : (
          <span className="flex-1 text-sm text-ink-dim">{placeholder}</span>
        )}
        {selectedLabel ? (
          <button type="button" onClick={e => { e.stopPropagation(); handleClear(e); }}
            className="shrink-0 p-1 rounded-full hover:bg-surface-card-2 dark:hover:bg-white/10 text-ink-dim hover:text-ink-dim dark:hover:text-ink-dim transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-surface-card shadow-xl overflow-hidden animate-dropdown-in">

          {/* Search — sin autoFocus: abrir el selector no debe levantar el
              teclado del celular. Buscar es opcional (la mayoría navega la
              lista), así que el teclado aparece recién si el usuario toca
              el campo a propósito.
              focus-within en el contenedor (no focus en el <input>): el
              recuadro que el usuario ve es este chip con la lupa, así que
              el resaltado de foco tiene que marcarlo a él. El input interno
              es transparente y sin borde propio — marcarlo a él dibujaba un
              segundo recuadro adentro del primero. */}
          <div className="p-2 border-b border-slate-100 dark:border-white/8">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-card-2 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus-within:border-brand transition-colors">
              <Search className="w-3.5 h-3.5 text-ink-dim shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setCreating(false); }}
                placeholder="Buscar por nombre, marca, tipo..."
                className="flex-1 min-w-0 text-sm bg-transparent outline-none text-ink dark:text-ink-dim placeholder:text-ink-dim dark:placeholder:text-ink-dim"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}>
                  <X className="w-3.5 h-3.5 text-ink-dim hover:text-ink-dim dark:hover:text-ink-dim" />
                </button>
              )}
            </div>
          </div>

          {/* Sugerencia IA */}
          {suggestionContext && !query && (() => {
            if (suggLoading) return (
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/8 flex items-center gap-2 text-xs text-ink-dim">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analizando con IA...
              </div>
            );

            if (suggestion?.source === 'error') return (
              <div className="px-3 py-2 border-b border-slate-100 dark:border-white/8 flex items-center justify-between">
                <span className="text-xs text-ink-dim">IA no disponible en este momento</span>
                <button type="button" onClick={dismissSuggestion} className="p-1 text-ink-dim hover:text-ink-dim">
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
                <button type="button" onClick={dismissSuggestion} className="p-1.5 text-ink-dim hover:text-ink-dim dark:hover:text-ink-dim">
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
                      <p className="text-xs text-brand/70 truncate">{suggestion.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={applySuggestion}
                      className="px-2.5 py-1 rounded-lg bg-brand hover:bg-brand-light text-white text-xs font-medium transition-colors"
                    >
                      Usar
                    </button>
                    <button type="button" onClick={dismissSuggestion} className="p-1 text-brand/60 hover:text-brand-dark">
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
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Atrás
              </button>
              <div className="flex items-center gap-1 text-xs text-ink-dim overflow-hidden">
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
                    ? 'bg-brand/10 text-brand'
                    : 'bg-surface-card-2 dark:bg-white/5 text-ink-dim dark:text-ink-dim hover:bg-brand/8 hover:text-brand'
                  }`}
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Seleccionar &quot;<strong>{breadcrumb[breadcrumb.length - 1].name}</strong>&quot;</span>
              </button>
            </div>
          )}

          {/* Lista */}
          <div className="p-2 max-h-56 overflow-y-auto space-y-0.5">
            {/* hint cuando hay resultados de búsqueda con taxonomy */}
            {query && visibleCategories.length > 0 && (
              <p className="text-xs text-ink-dim px-2 pb-1">
                {visibleCategories.length} resultado{visibleCategories.length !== 1 ? 's' : ''} para &quot;<span className="font-medium">{query}</span>&quot;
              </p>
            )}

            {visibleCategories.length === 0 && !creating && (
              <p className="text-center text-sm text-ink-dim py-4">
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
                        ? 'bg-brand/10 text-brand'
                        : 'text-ink dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'
                      }`}
                  >
                    {cat.icon && <CategoryIcon name={cat.icon} className="w-4 h-4 shrink-0 opacity-60" />}
                    <div className="flex-1 min-w-0">
                      <span className="truncate block">{cat.name}</span>
                      {/* En búsqueda mostrar el path completo como contexto */}
                      {catPath && catPath.length > 1 && (
                        <span className="text-xs text-ink-dim truncate block">
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
                      className="flex items-center px-2 rounded-xl text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 hover:text-ink-dim dark:hover:text-ink-dim transition-colors"
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
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 hover:text-ink dark:hover:text-ink-dim transition-colors"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                No encuentro mi categoría
              </button>
            </div>
          )}

          {creating && (
            <div className="px-2 pb-2 border-t border-slate-100 dark:border-white/8 pt-2 space-y-2">
              <p className="text-xs text-ink-dim px-1">
                Ingresá el nombre de tu categoría.
              </p>
              {/* min-w-0 en el input y shrink-0 en el botón: sin eso el
                  input reclamaba su ancho de contenido y empujaba el botón
                  "Usar" fuera del dropdown, que lo recortaba contra el
                  borde derecho. Con min-w-0 el input cede ancho y el botón
                  queda completo, respetando el padding del contenedor. */}
              <div className="flex gap-1.5">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateConfirm(); if (e.key === 'Escape') setCreating(false); }}
                  placeholder="Ej: Repuestos de tractor..."
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-surface-card-2 dark:bg-white/5 text-sm text-ink dark:text-ink-dim placeholder:text-ink-dim dark:placeholder:text-ink-dim outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={handleCreateConfirm}
                  disabled={!newName.trim() || creatingLoading}
                  className="shrink-0 px-3 py-2 rounded-xl bg-brand hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  {creatingLoading ? '...' : 'Usar'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-2 py-2 rounded-xl text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 transition-colors"
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
