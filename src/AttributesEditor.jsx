import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Check, ChevronDown } from 'lucide-react';
import { getSuggestedAttributes } from './categories';

// ─── AttributesEditor ─────────────────────────────────────────────────────────
// Props:
//   categoryId — id de categoría seleccionada
//   value      — { [key]: string }
//   onChange   — (newAttrs) => void
//
// UX: chips de atributos.
//   • Atributos con valor  → chip "Label: Valor ×" (filled)
//   • Sugeridos sin valor  → chip "+ Label"         (ghost, click to edit)
//   • Custom               → botón "+ Agregar detalle"
// ──────────────────────────────────────────────────────────────────────────────

export default function AttributesEditor({ categoryId, value = {}, onChange, categories }) {
  const suggested   = getSuggestedAttributes(categoryId, categories);
  const [active, setActive]       = useState(null);  // key del attr en edición
  const [draft, setDraft]         = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customKey, setCustomKey]   = useState('');
  const [customVal, setCustomVal]   = useState('');
  const inputRef = useRef(null);

  // Focus al activar un attr
  useEffect(() => {
    if (active && inputRef.current) inputRef.current.focus();
  }, [active]);

  const suggestedKeys = suggested.map(a => a.key);
  const customAttrs   = Object.entries(value).filter(([k]) => !suggestedKeys.includes(k));

  const set = (key, val) => {
    const v = typeof val === 'string' ? val.trim() : val;
    if (!v && v !== 0) {
      const next = { ...value };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...value, [key]: String(v) });
    }
  };

  // val puede venir del editor (select auto-confirma) o del draft (text/number)
  const confirm = (key, val) => {
    set(key, val ?? draft);
    setActive(null);
    setDraft('');
  };

  const remove = (key) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
    if (active === key) { setActive(null); setDraft(''); }
  };

  const activateAttr = (attr) => {
    setActive(attr.key);
    setDraft(value[attr.key] || '');
    setShowCustom(false);
  };

  const addCustom = () => {
    const k = customKey.trim();
    const v = customVal.trim();
    if (!k || !v) return;
    onChange({ ...value, [k]: v });
    setCustomKey('');
    setCustomVal('');
    setShowCustom(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const filledSuggested = suggested.filter(a => value[a.key] !== undefined && value[a.key] !== '');
  const unfilledSuggested = suggested.filter(a => value[a.key] === undefined || value[a.key] === '');

  return (
    <div className="space-y-3">

      {/* ── Chips con valor ─────────────────────────────────────────────────── */}
      {(filledSuggested.length > 0 || customAttrs.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {filledSuggested.map(attr => (
            <FilledChip
              key={attr.key}
              label={attr.label}
              val={value[attr.key]}
              isActive={active === attr.key}
              onClick={() => activateAttr(attr)}
              onRemove={() => remove(attr.key)}
            />
          ))}
          {customAttrs.map(([k, v]) => (
            <FilledChip
              key={k}
              label={k}
              val={v}
              onRemove={() => remove(k)}
            />
          ))}
        </div>
      )}

      {/* ── Editor inline del attr activo ────────────────────────────────────── */}
      {active && (() => {
        const attr = suggested.find(a => a.key === active);
        if (!attr) return null;
        return (
          <AttrEditor
            attr={attr}
            draft={draft}
            setDraft={setDraft}
            inputRef={inputRef}
            onConfirm={(val) => confirm(attr.key, val)}
            onCancel={() => { setActive(null); setDraft(''); }}
          />
        );
      })()}

      {/* ── Chips sin valor (sugeridos) ──────────────────────────────────────── */}
      {unfilledSuggested.length > 0 && !active && (
        <div className="flex flex-wrap gap-1.5">
          {unfilledSuggested.map(attr => (
            <button
              key={attr.key}
              type="button"
              onClick={() => activateAttr(attr)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-white/20 text-xs text-slate-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Plus className="w-3 h-3" />
              {attr.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Agregar atributo custom ──────────────────────────────────────────── */}
      {!active && !showCustom && (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar otro detalle
        </button>
      )}

      {showCustom && (
        <div className="flex gap-1.5 items-center">
          <input
            autoFocus
            type="text"
            value={customKey}
            onChange={e => setCustomKey(e.target.value)}
            placeholder="Propiedad"
            className="w-28 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500 transition-colors"
          />
          <span className="text-slate-400 text-xs">:</span>
          <input
            type="text"
            value={customVal}
            onChange={e => setCustomVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCustom(); if (e.key === 'Escape') setShowCustom(false); }}
            placeholder="Valor"
            className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customKey.trim() || !customVal.trim()}
            className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => { setShowCustom(false); setCustomKey(''); setCustomVal(''); }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Chip con valor ─────────────────────────────────────────────────────────────
function FilledChip({ label, val, isActive, onClick, onRemove }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors
        ${isActive
          ? 'bg-emerald-500/15 border border-emerald-400 text-emerald-700 dark:text-emerald-400'
          : 'bg-slate-100 dark:bg-white/8 border border-transparent text-slate-700 dark:text-slate-200'
        }`}
    >
      <span className="text-slate-400 dark:text-slate-500 font-normal">{label}:</span>
      <button
        type="button"
        onClick={onClick}
        className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      >
        {val}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-400 hover:text-red-400 transition-colors -mr-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ── Editor inline ──────────────────────────────────────────────────────────────
function AttrEditor({ attr, draft, setDraft, inputRef, onConfirm, onCancel }) {
  const handleKey = (e) => {
    if (e.key === 'Enter') onConfirm(draft);
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{attr.label}</p>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {attr.type === 'select' ? (
        // Select: click directo, sin confirmar
        <div className="flex flex-wrap gap-1.5">
          {(attr.options || []).map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onConfirm(opt)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                draft === opt
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-white/8 border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          ref={inputRef}
          type={attr.type === 'number' ? 'number' : 'text'}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Ingresar ${attr.label.toLowerCase()}...`}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500 transition-colors"
        />
      )}

      {/* Confirmar solo para text/number — select ya auto-confirma */}
      {attr.type !== 'select' && (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(draft)}
          disabled={!draft && draft !== 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Confirmar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          Cancelar
        </button>
      </div>
      )}
    </div>
  );
}
