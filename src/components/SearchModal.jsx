/**
 * "Descubrir" — abierto desde el botón central del bottom nav mobile.
 * No es un buscador (eso ya existe bien resuelto en el header del Home y en
 * TodasOfertasScreen, con filtros/orden/vista) — es un ÁRBOL de preguntas
 * condicionales que va angostando resultados hasta llegar a pocas opciones
 * relevantes, tipo embudo. Cada pregunta depende de la respuesta anterior:
 * no tiene sentido preguntar "¿con carne o sin?" después de elegir "dulce".
 *
 * Sin IA: filtra directo sobre datos reales de las ofertas (categoryId,
 * attributes.apto_vegano, precio) — instantáneo, sin red, sin costo.
 * Devuelve resultados con ProductCardList (misma card que commerce-modern).
 */
import React, { useState, useMemo, useEffect } from 'react';
import { X, Users, Beef, IceCream, Soup, DollarSign, Sparkles, RotateCcw } from 'lucide-react';
import { ProductCardList } from '../tienda-publica/components/ProductCards.jsx';

const SEARCH_CARD_COLORS = {
  surf:  'var(--surface-solid)',
  surf2: 'var(--surface-solid-2)',
  border:'var(--border-solid)',
  txt:   'var(--text-primary)',
  txtM:  'var(--text-secondary)',
};

const DULCE_IDS = ['postres', 'helados', 'tortas', 'flanes_budines'];
const FRIO_IDS  = ['helados'];

const esDulce = (o) => DULCE_IDS.some(id => o.categoryId?.startsWith(id));
const esFrio  = (o) => FRIO_IDS.some(id => o.categoryId?.startsWith(id));

/* ── Árbol de preguntas: cada nodo sabe cómo filtrar y a qué nodo sigue.
   `next(respuestas)` decide dinámicamente la siguiente pregunta según todo
   lo respondido hasta ahora — así "carne" nunca aparece si ya eligió dulce,
   y "frío/templado" nunca aparece si eligió salado. */
const NODOS = {
  sabor: {
    id: 'sabor', label: '¿Dulce o salado?', Icon: IceCream,
    opciones: [
      { value: 'salado', label: 'Salado' },
      { value: 'dulce',  label: 'Dulce' },
      { value: null,     label: 'Da igual' },
    ],
    filtra: (o, v) => v == null || (v === 'dulce' ? esDulce(o) : !esDulce(o)),
    next: (r) => r.sabor === 'dulce' ? 'temperatura' : 'carne',
  },
  carne: {
    id: 'carne', label: '¿Con carne o sin?', Icon: Beef,
    opciones: [
      { value: 'con', label: 'Con carne' },
      { value: 'sin', label: 'Vegetariano / vegano' },
      { value: null,  label: 'Da igual' },
    ],
    filtra: (o, v) => v == null || (v === 'sin' ? o.attributes?.apto_vegano === 'Sí' : o.attributes?.apto_vegano !== 'Sí'),
    next: () => 'precio',
  },
  temperatura: {
    id: 'temperatura', label: '¿Frío o al natural?', Icon: Soup,
    opciones: [
      { value: 'frio',  label: 'Frío (helado)' },
      { value: 'natural', label: 'Al natural' },
      { value: null,    label: 'Da igual' },
    ],
    filtra: (o, v) => v == null || (v === 'frio' ? esFrio(o) : !esFrio(o)),
    next: () => 'precio',
  },
  precio: {
    id: 'precio', label: '¿Cuánto querés gastar?', Icon: DollarSign,
    opciones: [
      { value: 'bajo',  label: 'Hasta $3.000' },
      { value: 'medio', label: '$3.000 – $7.000' },
      { value: 'alto',  label: 'Más de $7.000' },
      { value: null,    label: 'Da igual' },
    ],
    filtra: (o, v) => {
      if (v == null) return true;
      if (v === 'bajo')  return o.precio <= 3000;
      if (v === 'medio') return o.precio > 3000 && o.precio <= 7000;
      return o.precio > 7000;
    },
    next: () => 'personas',
  },
  personas: {
    id: 'personas', label: '¿Para cuántos es?', Icon: Users,
    opciones: [
      { value: '1',  label: '1 persona' },
      { value: '2+', label: '2 o más' },
      { value: null, label: 'Da igual' },
    ],
    filtra: (o, v) => {
      if (v == null) return true;
      const p = o.attributes?.porcion || '';
      if (!p) return true; // sin dato: no descarta
      const esUna = /1 persona/i.test(p);
      return v === '1' ? esUna : !esUna;
    },
    next: () => null, // fin del árbol
  },
};

export default function SearchModal({
  open, onClose, visibleOfertas = [], setSelectedProduct, navigate, addRecentSearch,
}) {
  const [nodoActualId, setNodoActualId] = useState('sabor');
  const [respuestas, setRespuestas] = useState({});
  const [historial, setHistorial] = useState(['sabor']); // pila de nodos recorridos, para la barra de progreso

  useEffect(() => {
    if (open) { setNodoActualId('sabor'); setRespuestas({}); setHistorial(['sabor']); }
  }, [open]);

  const terminado = nodoActualId === null;

  const resultados = useMemo(() => {
    if (!terminado) return [];
    const activas = visibleOfertas.filter(o => o.activa !== false);
    return activas.filter(o => {
      for (const [preguntaId, valor] of Object.entries(respuestas)) {
        const nodo = NODOS[preguntaId];
        if (nodo && !nodo.filtra(o, valor)) return false;
      }
      return true;
    }).slice(0, 12);
  }, [terminado, respuestas, visibleOfertas]);

  const responder = (nodo, value) => {
    const nuevasRespuestas = { ...respuestas, [nodo.id]: value };
    setRespuestas(nuevasRespuestas);
    const siguienteId = nodo.next(nuevasRespuestas);
    setNodoActualId(siguienteId);
    if (siguienteId) setHistorial(h => [...h, siguienteId]);
  };

  const reiniciar = () => { setNodoActualId('sabor'); setRespuestas({}); setHistorial(['sabor']); };

  const selectOferta = (o) => {
    addRecentSearch?.(o.titulo);
    setSelectedProduct?.(o);
    onClose();
    navigate('product-detail');
  };

  if (!open) return null;

  const nodoActual = nodoActualId ? NODOS[nodoActualId] : null;
  const pasoActual = historial.length; // cuántas preguntas ya se ven (incluye la actual)

  return (
    <div className="fixed inset-0 z-[5000] bg-surface-dim flex flex-col animate-sheet-up">
      {/* Header — título centrado */}
      <div className="shrink-0 bg-surface-card border-b border-slate-100 dark:border-white/10 px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-4">
        <div className="relative flex items-center justify-center">
          <h1 className="text-base font-black text-ink flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand" /> Descubrir
          </h1>
          <button onClick={onClose} className="ui-icon-btn absolute right-0 text-ink-dim hover:bg-surface-card-2 transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Progreso — puntitos, cantidad dinámica según la rama recorrida */}
        {!terminado && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {historial.map((nodoId, i) => (
              <div key={nodoId} className={`h-1.5 rounded-full transition-all ${i < pasoActual - 1 ? 'w-4 bg-brand' : 'w-6 bg-brand'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-6">
        {!terminado ? (
          // ── Pregunta actual ──
          <div className="flex flex-col items-center pt-8">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
              <nodoActual.Icon className="w-7 h-7 text-brand" />
            </div>
            <p className="text-lg font-black text-ink mb-6 text-center">{nodoActual.label}</p>
            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              {nodoActual.opciones.map(opt => (
                <button key={opt.label} onClick={() => responder(nodoActual, opt.value)}
                  className="w-full py-3 rounded-2xl bg-surface-card border border-slate-100 dark:border-white/10 text-ink font-semibold text-sm hover:border-brand hover:text-brand transition-colors">
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // ── Resultados ──
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-brand uppercase tracking-wide">
                {resultados.length > 0 ? `${resultados.length} sugerencias para vos` : 'Sin coincidencias exactas'}
              </p>
              <button onClick={reiniciar} className="inline-flex items-center gap-1 text-xs font-bold text-ink-dim hover:text-ink transition-colors">
                <RotateCcw className="w-3 h-3" /> Empezar de nuevo
              </button>
            </div>
            {resultados.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-12 text-center gap-3">
                <p className="text-sm text-ink-dim">No encontramos algo que combine exacto — probá con otras respuestas.</p>
                <button onClick={reiniciar} className="px-4 py-2 rounded-full bg-brand/10 text-brand text-xs font-bold hover:bg-brand/15 transition-colors">
                  Volver a intentar
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {resultados.map(o => (
                  <ProductCardList key={o.id} p={o} onOpen={() => selectOferta(o)} {...SEARCH_CARD_COLORS} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
