import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, Search, X, Check, Tag, Plus, Sparkles, Loader2 } from 'lucide-react';
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
  // expandedId: la ÚNICA categoría con hijos expandida inline en el árbol,
  // en cualquier nivel de profundidad (no un path de navegación por
  // pantallas — tocar una fila con flecha despliega sus hijos DEBAJO de
  // ella, en la misma lista, en vez de reemplazar toda la lista por un
  // nivel siguiente). Un solo id (no un Set) a propósito: expandir una
  // rama nueva cierra cualquier otra que estuviera abierta, para que el
  // árbol no crezca sin límite con varias ramas abiertas a la vez.
  const [expandedId, setExpandedId] = useState(null);
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
      // Expande el padre directo de la categoría elegida, así el árbol
      // abre mostrándola en contexto en vez de siempre desde la raíz.
      const catPath = getCategoryPath(value, CATEGORIES);
      setExpandedId(catPath.length > 1 ? catPath[catPath.length - 2].id : null);
    } else {
      setExpandedId(null);
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
    setSuggestion(null);
    setOpen(false);
  };

  const dismissSuggestion = () => {
    setSuggestion(null);
    setSuggDismissed(true);
  };

  // toggleExpand: tocar la fila de una categoría con hijos la expande
  // inline (sus hijos aparecen debajo, dentro de la misma lista) — o la
  // contrae si ya estaba expandida. Reemplaza el "drill-down" de antes,
  // que navegaba a una pantalla nueva del dropdown solo con la lista de
  // ese nivel.
  const toggleExpand = (cat) => {
    setExpandedId(prev => (prev === cat.id ? null : cat.id));
  };
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
        const cat = await onCreateCategory(trimmed, expandedId);
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
  const selectedCat = value ? CATEGORIES.find(c => c.id === value) : null;

  // Búsqueda: lista plana de resultados, como antes. Sin búsqueda: solo
  // las categorías raíz — el árbol se despliega desde ahí con toggleExpand,
  // ver <CategoryRow> más abajo (recursivo, se auto-observa expandedId).
  const visibleCategories = useMemo(() => {
    if (query.trim().length >= 1) return searchWithTaxonomy(query.trim(), CATEGORIES);
    return getChildren(null, CATEGORIES);
  }, [query, CATEGORIES]);

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

          {/* Árbol — sin búsqueda: categorías raíz, cada una expandible
              inline con toggleExpand (ver CategoryRow, componente
              recursivo definido al final del archivo). Con búsqueda: lista
              plana de resultados de searchWithTaxonomy, igual que antes —
              ahí no aplica expansión, cada resultado ya muestra su path
              completo como contexto. */}
          <div className="p-2 max-h-56 overflow-y-auto space-y-0.5">
            {query && visibleCategories.length > 0 && (
              <p className="text-xs text-ink-dim px-2 pb-1">
                {visibleCategories.length} resultado{visibleCategories.length !== 1 ? 's' : ''} para &quot;<span className="font-medium">{query}</span>&quot;
              </p>
            )}

            {visibleCategories.length === 0 && !creating && (
              <p className="text-center text-sm text-ink-dim py-4">
                {query ? 'Sin resultados — probá con otro término' : 'Sin categorías'}
              </p>
            )}

            {query
              ? visibleCategories.map(cat => {
                  const isSelected = value === cat.id;
                  const catPath = getCategoryPath(cat.id, CATEGORIES);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelect(cat)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-colors
                        ${isSelected
                          ? 'bg-brand/10 text-brand'
                          : 'text-ink dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'
                        }`}
                    >
                      {cat.icon && <CategoryIcon name={cat.icon} className="w-4 h-4 shrink-0 opacity-60" />}
                      <div className="flex-1 min-w-0">
                        <span className="truncate block">{cat.name}</span>
                        {catPath.length > 1 && (
                          <span className="text-xs text-ink-dim truncate block">
                            {catPath.slice(0, -1).map(c => c.name).join(' › ')}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })
              : visibleCategories.map(cat => (
                  <CategoryRow
                    key={cat.id}
                    cat={cat}
                    depth={0}
                    value={value}
                    expandedId={expandedId}
                    onSelect={handleSelect}
                    onToggleExpand={toggleExpand}
                    CATEGORIES={CATEGORIES}
                  />
                ))}
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
                  queda completo, respetando el padding del contenedor.
                  La X de cancelar vive DENTRO del input (a la derecha,
                  posición absoluta), como el ícono de limpiar del
                  buscador principal — antes era un botón aparte afuera,
                  que se leía como una tercera acción en vez de la forma
                  estándar de "cancelar este campo". */}
              <div className="flex gap-1.5">
                <div className="relative flex-1 min-w-0">
                  <input
                    autoFocus
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateConfirm(); if (e.key === 'Escape') setCreating(false); }}
                    placeholder="Ej: Repuestos de tractor..."
                    className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-surface-card-2 dark:bg-white/5 text-sm text-ink dark:text-ink-dim placeholder:text-ink-dim dark:placeholder:text-ink-dim outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    aria-label="Cancelar"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/10 hover:text-ink transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCreateConfirm}
                  disabled={!newName.trim() || creatingLoading}
                  className="shrink-0 px-3 py-2 rounded-xl bg-brand hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  {creatingLoading ? '...' : 'Usar'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── CategoryRow — fila recursiva del árbol de categorías ──────────────────────
// Sin hijos: solo un botón que selecciona (igual que antes).
// Con hijos: botón principal (selecciona igual) + flecha que expande/
// contrae. Al expandir aparecen, en este orden: un botón "Seleccionar
// {nombre}" (para quedarse con la categoría padre sin bajar más — el
// caso real es "no quiero especificar más") y la lista de hijos con
// depth+1, indentada. La flecha rota 90° cuando está expandida, mismo
// lenguaje visual que un acordeón.
function CategoryRow({ cat, depth, value, expandedId, onSelect, onToggleExpand, CATEGORIES }) {
  const isSelected = value === cat.id;
  const canExpand = hasChildren(cat.id, CATEGORIES);
  const isExpanded = expandedId === cat.id;
  const children = isExpanded ? getChildren(cat.id, CATEGORIES) : [];

  return (
    <div>
      <div className="flex items-stretch gap-0.5" style={{ paddingLeft: depth * 14 }}>
        <button
          type="button"
          onClick={() => onSelect(cat)}
          className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-colors
            ${isSelected
              ? 'bg-brand/10 text-brand'
              : 'text-ink dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'
            }`}
        >
          {cat.icon && <CategoryIcon name={cat.icon} className="w-4 h-4 shrink-0 opacity-60" />}
          <span className="flex-1 min-w-0 truncate">{cat.name}</span>
          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
        </button>

        {canExpand && (
          <button
            type="button"
            onClick={() => onToggleExpand(cat)}
            className="flex items-center px-2 rounded-xl text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 hover:text-ink dark:hover:text-ink-dim transition-colors"
            title={isExpanded ? 'Ocultar subcategorías' : 'Ver subcategorías'}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-0.5 space-y-0.5">
          <div style={{ paddingLeft: (depth + 1) * 14 }}>
            <button
              type="button"
              onClick={() => onSelect(cat)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-colors text-left
                ${isSelected
                  ? 'bg-brand/10 text-brand'
                  : 'bg-surface-card-2 dark:bg-white/5 text-ink-dim hover:bg-brand/8 hover:text-brand'
                }`}
            >
              <Check className="w-3 h-3 shrink-0" />
              <span>Seleccionar &quot;<strong>{cat.name}</strong>&quot;</span>
            </button>
          </div>
          {children.map(child => (
            <CategoryRow
              key={child.id}
              cat={child}
              depth={depth + 1}
              value={value}
              expandedId={expandedId}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              CATEGORIES={CATEGORIES}
            />
          ))}
        </div>
      )}
    </div>
  );
}
