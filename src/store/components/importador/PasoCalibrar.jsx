// PasoCalibrar — nivel 3 del clasificador (calibración humana): el backend
// ya sugirió un campo por columna (nombre_encabezado / tipo_dato); acá el
// usuario confirma o corrige con ejemplos reales de sus propias filas a la
// vista, no en abstracto. Cuando la huella ya tenía calibración guardada
// (calibracionReusada), este paso se salta solo — ver ImportadorPrecios.jsx.
import React from 'react';
import { CheckCircle2, AlertTriangle, Table2 } from 'lucide-react';
import SimpleSelect from '../../../components/ui/SimpleSelect.jsx';
import { OPCIONES_CAMPO, labelCampo } from './camposDestino.js';

const CONFIANZA_ESTILO = {
  alta: { dot: 'bg-ok', texto: 'text-ok-dark dark:text-ok' },
  media: { dot: 'bg-amber-400', texto: 'text-amber-600 dark:text-amber-400' },
  ninguna: { dot: 'bg-danger', texto: 'text-danger' },
};

export function PasoCalibrar({ headers, filasPreview, sugerencias, mapeo, onCambiarMapeo, totalFilas }) {
  const camposUsados = Object.values(mapeo);
  const tieneNombre = camposUsados.includes('nombre');
  const tienePrecio = camposUsados.includes('precio');
  const listoParaContinuar = tieneNombre && tienePrecio;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="px-5 py-5 max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="font-black text-lg mb-1">Confirmá qué es cada columna</h2>
          <p className="text-sm text-ink-dim leading-relaxed">
            Detectamos {headers.length} columnas en {totalFilas} fila{totalFilas !== 1 ? 's' : ''}. Revisá que coincida — la próxima vez que subas un archivo con esta misma estructura, no vamos a preguntarte de nuevo.
          </p>
        </div>

        {!listoParaContinuar && (
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-2xl text-sm font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Necesitamos al menos <strong>Nombre</strong> y <strong>Precio</strong> asignados para poder seguir.</span>
          </div>
        )}

        <div className="space-y-2.5">
          {headers.map((header, i) => {
            const sugerencia = sugerencias?.[i];
            const estilo = CONFIANZA_ESTILO[sugerencia?.confianza] || CONFIANZA_ESTILO.ninguna;
            const valorActual = mapeo[header] ?? 'ignorar';
            return (
              <div key={header} className="bg-surface-card-2 dark:bg-white/5 rounded-2xl p-3.5 flex flex-col gap-2.5">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${estilo.dot}`} />
                    <p className="font-bold text-sm break-words">{header}</p>
                  </div>
                  {filasPreview?.[0]?.[i] !== undefined && (
                    <p className="text-xs text-ink-dim break-words">
                      ej: {filasPreview.slice(0, 2).map((fila) => fila[i]).filter(Boolean).join(' · ') || '—'}
                    </p>
                  )}
                </div>
                <SimpleSelect
                  value={valorActual}
                  onChange={(campo) => onCambiarMapeo(header, campo)}
                  options={OPCIONES_CAMPO}
                  compact
                />
              </div>
            );
          })}
        </div>

        {filasPreview?.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-2 flex items-center gap-1.5">
              <Table2 className="w-3 h-3" /> Vista previa del archivo
            </p>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-white/8">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-card-2 dark:bg-white/5">
                    {headers.map((h) => (
                      <th key={h} className="text-left font-bold px-3 py-2 whitespace-nowrap">
                        {mapeo[h] && mapeo[h] !== 'ignorar' ? (
                          <span className="flex items-center gap-1 text-brand"><CheckCircle2 className="w-3 h-3" />{labelCampo(mapeo[h])}</span>
                        ) : (
                          <span className="text-ink-dim">{h}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filasPreview.slice(0, 5).map((fila, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-white/8">
                      {fila.map((celda, j) => (
                        <td key={j} className="px-3 py-2 whitespace-nowrap text-ink-dim">{celda || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function calibracionLista(mapeo) {
  const valores = Object.values(mapeo);
  return valores.includes('nombre') && valores.includes('precio');
}
