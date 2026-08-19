// ImportadorFlotante — chip persistente que aparece cuando el wizard del
// importador está minimizado (el usuario navegó a otra pantalla mientras
// el archivo se procesaba). Mismo patrón que Gmail/Instagram: el trabajo
// real sigue en useImportador.js, esto solo es la ventanita de estado +
// botón para volver. Vive en StoreApp.jsx, así que persiste sin importar
// a qué pantalla del admin se navegue.
import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, ChevronUp, X } from 'lucide-react';

const RESUMEN_PASO = {
  subir: 'Leyendo tu archivo...',
  calibrar: 'Esperando que confirmes las columnas',
  revisar: 'Esperando que revises los cambios',
  resultado: 'Importación completa',
};

export function ImportadorFlotante({ visible, paso, cargando, error, archivoInfo, onReabrir, onDescartar }) {
  if (!visible) return null;

  const terminado = paso === 'resultado';
  const Icono = terminado ? CheckCircle2 : error ? AlertCircle : cargando ? Loader2 : FileSpreadsheet;
  const tono = terminado ? 'text-ok-dark dark:text-ok bg-ok/10' : error ? 'text-danger bg-danger/10' : 'text-brand bg-brand/10';

  return (
    <button
      onClick={onReabrir}
      className="fixed left-1/2 -translate-x-1/2 z-[5500] flex items-center gap-3 bg-surface-card border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl pl-3 pr-2 py-2.5 max-w-[calc(100vw-2rem)] w-80 text-left hover:shadow-2xl transition-shadow"
      style={{ bottom: 'calc(var(--store-bottom-nav-h, 0px) + env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tono}`}>
        <Icono className={`w-4 h-4 ${cargando && !terminado ? 'animate-spin' : ''}`} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{archivoInfo?.name || 'Importando precios'}</p>
        <p className="text-[11px] text-ink-dim truncate">{error || RESUMEN_PASO[paso] || 'Procesando...'}</p>
      </div>
      <ChevronUp className="w-4 h-4 text-ink-dim shrink-0" />
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onDescartar(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onDescartar(); } }}
        title="Descartar"
        className="ui-icon-btn w-7 h-7 shrink-0 text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}
