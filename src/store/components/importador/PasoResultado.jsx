// PasoResultado — pantalla final del wizard, confirma qué se aplicó
// realmente (respuesta de accionAplicar). Cierra el círculo del feedback:
// el usuario armó una selección en PasoRevisar, acá ve que se guardó.
import React from 'react';
import { CheckCircle2, PackagePlus, RefreshCw, PackageX, AlertTriangle } from 'lucide-react';

export function PasoResultado({ resultado, onCerrar, onImportarOtro }) {
  const { altasAplicadas, actualizacionesAplicadas, bajasAplicadas, errores = [] } = resultado;
  const items = [
    { icono: PackagePlus, label: 'productos nuevos', valor: altasAplicadas },
    { icono: RefreshCw, label: 'productos actualizados', valor: actualizacionesAplicadas },
    { icono: PackageX, label: 'ocultados', valor: bajasAplicadas },
  ].filter((i) => i.valor > 0);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col items-center text-center px-6 py-8 gap-5">
      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${errores.length ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-ok/10'}`}>
        {errores.length
          ? <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          : <CheckCircle2 className="w-8 h-8 text-ok-dark dark:text-ok" />}
      </div>
      <div>
        <h2 className="font-black text-xl mb-1">{errores.length ? 'Catálogo actualizado, con algunos problemas' : 'Catálogo actualizado'}</h2>
        <p className="text-sm text-ink-dim">
          {errores.length
            ? `Se aplicaron los cambios válidos. ${errores.length} fila${errores.length !== 1 ? 's' : ''} no se pudo${errores.length !== 1 ? 'ieron' : ''} procesar.`
            : 'Los cambios ya están en tu tienda.'}
        </p>
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {items.map(({ icono: Icono, label, valor }) => (
            <div key={label} className="flex items-center gap-3 bg-surface-card-2 dark:bg-white/5 rounded-2xl px-4 py-3">
              <Icono className="w-4 h-4 text-brand shrink-0" />
              <span className="text-sm font-semibold flex-1 text-left">{label}</span>
              <span className="text-sm font-black text-brand">{valor}</span>
            </div>
          ))}
        </div>
      )}

      {errores.length > 0 && (
        <div className="w-full max-w-xs text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-2">Filas con problemas</p>
          <div className="flex flex-col gap-1.5">
            {errores.slice(0, 10).map((e, i) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-500/10 rounded-xl px-3 py-2 text-xs">
                <p className="font-semibold text-amber-700 dark:text-amber-400">{e.nombre || '(sin nombre)'}</p>
                <p className="text-ink-dim">{e.error}</p>
              </div>
            ))}
            {errores.length > 10 && <p className="text-xs text-ink-dim text-center">y {errores.length - 10} más...</p>}
          </div>
        </div>
      )}

      <div className="flex gap-3 w-full max-w-xs pt-2">
        <button onClick={onImportarOtro} className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors">
          Importar otro
        </button>
        <button onClick={onCerrar} className="flex-1 py-3 rounded-2xl bg-brand hover:bg-brand-light text-white text-sm font-bold transition-colors">
          Listo
        </button>
      </div>
    </div>
  );
}
