import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Store, Check, Loader2, AlertCircle,
  MapPin, Phone, Tag, FileText, CreditCard, X, Zap
} from 'lucide-react';
import { CATEGORIES } from './categories';
import CategoryIcon from './CategoryIcon';

const API_BASE = '/.netlify/functions';

// ─── Precios — deben coincidir con mp-checkout.js ────────────────────────────
export const PRECIO_MENSUAL = 4990;
export const PRECIO_ANUAL   = 47900;
const PRECIO_ANUAL_MES = Math.round(PRECIO_ANUAL / 12); // ~3.992

const ROOT_CATEGORIES = CATEGORIES.filter(c => c.parentId === null);

// ─── StoreRegisterFlow ───────────────────────────────────────────────────────
// Props:
//   firebaseUser   — Firebase user actual
//   initialPlan    — 'mensual' | 'anual' (pre-seleccionado desde la landing)
//   onCancel       — función para cancelar y volver
export default function StoreRegisterFlow({ firebaseUser, initialPlan, onCancel }) {
  const [step, setStep] = useState(0);
  const [tiendaInfo, setTiendaInfo] = useState({
    nombre:        '',
    descripcion:   '',
    ciudad:        '',
    telefono:      '',
    rubros:        [],
    emailContacto: firebaseUser?.email || '',
  });
  const [plan, setPlan]       = useState(initialPlan || 'mensual');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const updateField = (k, v) => setTiendaInfo(prev => ({ ...prev, [k]: v }));

  const toggleRubro = (id) =>
    setTiendaInfo(prev => ({
      ...prev,
      rubros: prev.rubros.includes(id) ? prev.rubros.filter(r => r !== id) : [...prev.rubros, id],
    }));

  const step0Valid = tiendaInfo.nombre.trim().length >= 2 && tiendaInfo.ciudad.trim().length >= 2;

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/mp-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          tiendaInfo,
          googleUid:   firebaseUser.uid,
          ownerNombre: firebaseUser.displayName || '',
          ownerEmail:  firebaseUser.email || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear preferencia de pago');
      window.location.href = data.initPoint || data.sandboxInitPoint;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center px-4 py-8">

        {/* Header */}
        <div className="w-full max-w-xl flex items-center justify-between mb-8">
          <button
            onClick={step === 0 ? onCancel : () => setStep(0)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 0 ? 'Volver' : 'Anterior'}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white text-lg">Lokal</span>
          </div>
          {/* Indicador de pasos */}
          <div className="flex items-center gap-1.5">
            {[0, 1].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-emerald-400 w-5' : i < step ? 'bg-emerald-400' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>

        {/* ── Step 0: Datos de la tienda ────────────────────────────────────── */}
        {step === 0 && (
          <div className="w-full max-w-xl">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white mb-2">Datos de tu tienda</h1>
              <p className="text-slate-400">Esta información será visible para los compradores.</p>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Nombre de la tienda *
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={tiendaInfo.nombre}
                    onChange={e => updateField('nombre', e.target.value)}
                    placeholder="Ej: TecnoStore, Mueblería Central..."
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Ciudad *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={tiendaInfo.ciudad}
                    onChange={e => updateField('ciudad', e.target.value)}
                    placeholder="Ej: Córdoba, Buenos Aires..."
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Teléfono <span className="text-slate-500 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={tiendaInfo.telefono}
                    onChange={e => updateField('telefono', e.target.value)}
                    placeholder="Ej: +54 9 351 123-4567"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  Descripción <span className="text-slate-500 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <textarea
                    value={tiendaInfo.descripcion}
                    onChange={e => updateField('descripcion', e.target.value)}
                    rows={2}
                    placeholder="Qué vendés, qué te diferencia..."
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Rubros */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <Tag className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
                  Categorías que manejás <span className="text-slate-500 font-normal">(elegí las que apliquen)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROOT_CATEGORIES.map(c => {
                    const sel = tiendaInfo.rubros.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleRubro(c.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          sel
                            ? 'bg-emerald-500 text-white border border-emerald-400'
                            : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {c.icon && <CategoryIcon name={c.icon} className="w-3.5 h-3.5" />}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!step0Valid}
              className="w-full mt-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-slate-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all text-base"
            >
              Elegir plan <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 1: Elegir plan ───────────────────────────────────────────── */}
        {step === 1 && (
          <div className="w-full max-w-xl">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white mb-2">Elegí tu plan</h1>
              <p className="text-slate-400">Al activar obtenés <span className="text-emerald-400 font-semibold">1 mes de regalo</span> además del período contratado.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Plan Mensual */}
              <button
                type="button"
                onClick={() => setPlan('mensual')}
                className={`relative text-left p-5 rounded-3xl border-2 transition-all ${
                  plan === 'mensual'
                    ? 'bg-white/8 border-emerald-500 shadow-lg shadow-emerald-500/15'
                    : 'bg-white/4 border-white/10 hover:border-white/25'
                }`}
              >
                {plan === 'mensual' && (
                  <div className="absolute top-3.5 right-3.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Mensual</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-slate-400 text-sm mb-1">ARS $</span>
                  <span className="text-4xl font-black text-white">{PRECIO_MENSUAL.toLocaleString()}</span>
                  <span className="text-slate-400 text-sm mb-1">/mes</span>
                </div>
                <p className="text-emerald-400 text-xs font-semibold">2 meses al activar</p>
                <div className="mt-4 space-y-2">
                  {['Acceso al feed de demandas', 'Respuestas ilimitadas', 'Perfil de tienda'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </button>

              {/* Plan Anual */}
              <button
                type="button"
                onClick={() => setPlan('anual')}
                className={`relative text-left p-5 rounded-3xl border-2 transition-all ${
                  plan === 'anual'
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/15'
                    : 'bg-white/4 border-white/10 hover:border-white/25'
                }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap">
                  AHORRÁS 20%
                </div>
                {plan === 'anual' && (
                  <div className="absolute top-3.5 right-3.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Anual</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-slate-400 text-sm mb-1">ARS $</span>
                  <span className="text-4xl font-black text-white">{PRECIO_ANUAL_MES.toLocaleString()}</span>
                  <span className="text-slate-400 text-sm mb-1">/mes</span>
                </div>
                <p className="text-slate-500 text-xs">Facturado ${PRECIO_ANUAL.toLocaleString()}/año</p>
                <p className="text-emerald-400 text-xs font-semibold mt-0.5">13 meses al activar</p>
                <div className="mt-4 space-y-2">
                  {['Todo lo del plan mensual', 'Ahorrás $' + ((PRECIO_MENSUAL * 12) - PRECIO_ANUAL).toLocaleString() + ' al año', 'Soporte prioritario'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </button>
            </div>

            {/* Resumen */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Resumen</p>
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold text-sm">
                  {tiendaInfo.nombre} — Plan {plan === 'anual' ? 'Anual' : 'Mensual'}
                </span>
                <span className="text-emerald-400 font-black">
                  ${(plan === 'anual' ? PRECIO_ANUAL : PRECIO_MENSUAL).toLocaleString()} ARS
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5" />
                {plan === 'anual' ? '13 meses de acceso al activar' : '2 meses de acceso al activar'}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-sm mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all text-base shadow-lg shadow-emerald-500/25"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirigiendo a MercadoPago...</>
                : <><CreditCard className="w-5 h-5" /> Pagar con MercadoPago</>
              }
            </button>

            <p className="text-center text-slate-600 text-xs mt-4">
              Pago seguro procesado por MercadoPago. Podés cancelar cuando quieras.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
