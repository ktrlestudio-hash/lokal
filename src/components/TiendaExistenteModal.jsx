import React from 'react';
import { Store, MapPin, Phone, Globe, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LogoSymbol } from '../Brand';

// ── Tienda Existente Modal ────────────────────────────────────────────────────
// Se muestra cuando un usuario hace login con intent de "registrar tienda"
// pero YA tiene una tienda asociada a su cuenta.
export default function TiendaExistenteModal({ tienda, firebaseUser, onEnterStore, onClaim, onCancel }) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[8000] bg-black/60 animate-backdrop-in" />

      {/* Modal */}
      <div className="fixed inset-0 z-[8001] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-[#0B132B] rounded-3xl w-full max-w-sm shadow-2xl pointer-events-auto animate-sheet-up overflow-hidden">

          {/* Header con gradiente */}
          <div className="relative px-6 pt-6 pb-4"
            style={{ background: 'linear-gradient(135deg, #0B132B 0%, #0B132B 60%, #00B8D9 100%)' }}>
            <div className="flex items-center gap-2 mb-3">
              <LogoSymbol size={20} color="#00B8D9" />
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Lokal para comercios</span>
            </div>
            <h2 className="text-white font-black text-xl leading-tight">
              Ya tenés una tienda
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Encontramos este comercio vinculado a tu cuenta
            </p>
          </div>

          {/* Card de la tienda */}
          <div className="px-5 py-4">
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {tienda.logo ? (
                    <img src={tienda.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-base text-slate-900 dark:text-white truncate">{tienda.nombre}</p>
                  <p className="text-xs text-slate-400">{tienda.rubro || 'Comercio'}</p>
                </div>
              </div>

              {/* Detalles rápidos */}
              <div className="space-y-1.5">
                {tienda.direccion && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tienda.direccion}</span>
                  </div>
                )}
                {tienda.telefono && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{tienda.telefono}</span>
                  </div>
                )}
                {tienda.web && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tienda.web}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-ok shrink-0" />
                  <span className="text-ok font-semibold">Tienda activa</span>
                </div>
              </div>
            </div>

            {/* Email de la cuenta */}
            <p className="text-center text-xs text-slate-400 mt-3">
              Cuenta: <span className="font-semibold text-slate-600 dark:text-slate-300">{firebaseUser?.email}</span>
            </p>
          </div>

          {/* Acciones */}
          <div className="px-5 pb-5 space-y-2">
            {/* Es mi tienda → entrar */}
            <button
              onClick={onEnterStore}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-brand/20 active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Sí, es mi tienda — Entrar
            </button>

            {/* No es mi tienda → reclamar */}
            <button
              onClick={onClaim}
              className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold py-3 px-6 rounded-2xl transition-all active:scale-[0.98]"
            >
              <AlertTriangle className="w-4 h-4" />
              No es mi tienda — Reclamar
            </button>

            {/* Cancelar */}
            <button
              onClick={onCancel}
              className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
