import React from 'react';
import { History, RotateCcw, Trash2 } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';

export default function HistorialScreen({ demandasHistorial, goBack, updateDemandaEstado, setShowConfirm, deleteDemanda, pageHeaderProps }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <PageHeader title="Historial" onBack={goBack} {...pageHeaderProps} />

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-4">
        {demandasHistorial.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-14 h-14 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-400">Sin historial todavia</p>
            <p className="text-sm text-slate-300 mt-1">Las demandas pausadas o finalizadas apareceran aqui</p>
          </div>
        ) : demandasHistorial.map(d => (
          <div key={d.id} className="bg-white rounded-3xl border-2 border-slate-100 p-5">
            <div className="flex gap-4 mb-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                {d.foto?.startsWith('http') ? <img src={d.foto} alt="" className="w-full h-full object-cover" /> : (d.foto || '📦')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold truncate">{d.titulo}</h3>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${d.estado === 'finalizada' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                    {d.estado === 'finalizada' ? 'RESUELTA' : 'PAUSADA'}
                  </span>
                </div>
                {d.descripcion && <p className="text-sm text-slate-400 line-clamp-1">{d.descripcion}</p>}
                <p className="text-xs text-slate-400 mt-1">{d.tiempoCreado}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {d.estado === 'pausada' && (
                <button onClick={() => updateDemandaEstado(d.id, 'activa')}
                  className="py-2.5 bg-primary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-primary-hover transition-colors">
                  <RotateCcw className="w-4 h-4" /> Reactivar
                </button>
              )}
              <button
                onClick={() => setShowConfirm({ title: 'Eliminar demanda', msg: 'Esta accion no se puede deshacer.', onOk: () => { deleteDemanda(d.id); setShowConfirm(null); } })}
                className={`py-2.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors ${d.estado !== 'pausada' ? 'col-span-2' : ''}`}>
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
