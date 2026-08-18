// ModalConfirmar — modal genérico de confirmación, mismo diseño visual que
// ya usaban los "¿Eliminar producto?" inline en cada screen (ProductosScreen,
// OfertasScreen) pero parametrizado para reusar en cualquier confirmación
// destructiva o de abandono (ej. "¿Descartar cambios?" al cerrar un wizard
// con el botón atrás — ver src/store/navegacion/useCapaUI.js).
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function ModalConfirmar({
  abierto, icono: Icono = AlertTriangle, tono = 'danger',
  titulo, mensaje,
  textoCancelar = 'Cancelar', textoConfirmar = 'Confirmar',
  onCancelar, onConfirmar,
}) {
  if (!abierto) return null;

  const tonos = {
    danger: { bg: 'bg-rose-50 dark:bg-rose-500/10', icono: 'text-rose-500', boton: 'bg-rose-500 hover:bg-rose-600' },
    warn: { bg: 'bg-amber-50 dark:bg-amber-500/10', icono: 'text-amber-600 dark:text-amber-400', boton: 'bg-amber-500 hover:bg-amber-600' },
  };
  const t = tonos[tono] || tonos.danger;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4" onClick={onCancelar}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-surface-card rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className={`w-12 h-12 rounded-2xl ${t.bg} flex items-center justify-center mx-auto mb-4`}>
          <Icono className={`w-6 h-6 ${t.icono}`} />
        </div>
        <h3 className="font-black text-lg text-center mb-1">{titulo}</h3>
        <p className="text-sm text-ink-dim text-center mb-6">{mensaje}</p>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors">
            {textoCancelar}
          </button>
          <button onClick={onConfirmar} className={`flex-1 py-2.5 rounded-2xl ${t.boton} text-white text-sm font-bold transition-colors`}>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
