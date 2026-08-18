// PasoSubir — primer paso del wizard: elegir/soltar el archivo. Drag&drop +
// input nativo, mismos formatos que extraerTabla() acepta en el backend
// (xlsx/xls/csv/json, más texto plano vía paste). Sin fricción: no hay
// configuración previa que pedirle al usuario antes de esto.
import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, FileJson, FileText, AlertCircle } from 'lucide-react';

const EXTENSIONES_ACEPTADAS = ['.xlsx', '.xls', '.csv', '.json', '.txt'];

function iconoPorExtension(nombre) {
  const ext = (nombre || '').split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return FileSpreadsheet;
  if (ext === 'json') return FileJson;
  return FileText;
}

export function PasoSubir({ onArchivoElegido, error }) {
  const inputRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);

  const manejarArchivos = (files) => {
    const file = files?.[0];
    if (!file) return;
    onArchivoElegido(file);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-5">
      <div className="w-16 h-16 rounded-3xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
        <UploadCloud className="w-8 h-8 text-brand" />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="font-black text-xl mb-1.5">Importar lista de precios</h2>
        <p className="text-sm text-ink-dim leading-relaxed">
          Subí el archivo que te pasa tu proveedor (Excel, CSV, JSON o texto) y te ayudamos a actualizar precios, agregar productos nuevos y avisarte de los que ya no están.
        </p>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); manejarArchivos(e.dataTransfer.files); }}
        className={`w-full max-w-sm border-2 border-dashed rounded-3xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
          arrastrando ? 'border-brand bg-brand/5' : 'border-slate-200 dark:border-white/15 hover:border-brand/50 hover:bg-surface-card-2 dark:hover:bg-white/5'
        }`}
      >
        <UploadCloud className={`w-7 h-7 transition-colors ${arrastrando ? 'text-brand' : 'text-ink-dim'}`} />
        <div className="text-center">
          <p className="text-sm font-bold">Arrastrá el archivo acá</p>
          <p className="text-xs text-ink-dim mt-0.5">o tocá para elegirlo</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={EXTENSIONES_ACEPTADAS.join(',')}
          className="hidden"
          onChange={(e) => manejarArchivos(e.target.files)}
        />
      </label>

      <p className="text-[11px] text-ink-dim">Formatos aceptados: Excel, CSV, JSON o texto plano · hasta 5MB</p>

      {error && (
        <div className="w-full max-w-sm flex items-start gap-2 bg-danger/8 text-danger-dark dark:text-danger px-4 py-3 rounded-2xl text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export { iconoPorExtension };
