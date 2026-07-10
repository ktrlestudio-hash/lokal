import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Check, X, Lock, Zap, CreditCard, CheckCircle,
  TrendingUp, Award, MessageSquare, Phone, Star, Crown, Sparkles,
} from 'lucide-react';

const PRECIO_MENSUAL   = 4990;
const PRECIO_ANUAL     = 47900;
const PRECIO_ANUAL_MES = Math.round(PRECIO_ANUAL / 12);
const PRECIO_PREMIUM   = 9990;

// ── Badge premium — fuera del overflow, glassmorphism refinado ────────────────
export function PBadge({ children, variant = 'brand', className = '' }) {
  const styles = {
    brand:   'bg-brand text-white shadow-lg shadow-brand/30',
    premium: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30',
    ok:      'bg-ok text-white shadow-lg shadow-ok/30',
    muted:   'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/15',
  };
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1 rounded-full
      text-[11px] font-black tracking-wide uppercase
      ${styles[variant] || styles.brand} ${className}
    `}>
      {children}
    </span>
  );
}

// ── Card — sin overflow-hidden para que los badges externos no se corten ──────
export function PCard({ children, className = '', variant = 'default' }) {
  const variants = {
    default:  'bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-white/10 shadow-sm',
    glass:    'bg-white/80 dark:bg-[#0d1526]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/20',
    brand:    'bg-white dark:bg-[#0d1526] border-2 border-brand/50 dark:border-brand/40 shadow-xl shadow-brand/10 dark:shadow-brand/15',
    premium:  'bg-white dark:bg-[#0d1526] border-2 border-amber-400/60 dark:border-amber-500/40 shadow-xl shadow-amber-500/10',
  };
  return (
    <div className={`relative w-full rounded-2xl ${variants[variant] || variants.default} ${className}`}>
      {/* Glass sheen */}
      {(variant === 'glass' || variant === 'brand' || variant === 'premium') && (
        <div aria-hidden className="absolute inset-x-0 top-0 h-24 rounded-t-2xl pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)' }} />
      )}
      {children}
    </div>
  );
}

// ── Header de card ────────────────────────────────────────────────────────────
export function PHeader({ children, gradient, className = '' }) {
  return (
    <div className={`
      relative rounded-t-2xl overflow-hidden
      ${gradient
        ? `bg-gradient-to-br ${gradient} text-white`
        : 'bg-slate-50 dark:bg-white/4 border-b border-slate-100 dark:border-white/8 text-slate-900 dark:text-white'}
      p-6 ${className}
    `}>
      {gradient && (
        <>
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-black/10 rounded-full pointer-events-none" />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ── Precio ────────────────────────────────────────────────────────────────────
export function PPrice({ current, original, period = '/mes', discount, light = false, className = '' }) {
  return (
    <div className={`flex items-end gap-2 flex-wrap ${className}`}>
      {original && (
        <span className={`text-lg line-through mb-0.5 ${light ? 'text-white/50' : 'text-slate-400 dark:text-slate-500'}`}>
          {original}
        </span>
      )}
      <span className={`text-4xl font-black tracking-tight ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
        {current}
      </span>
      {period && (
        <span className={`text-sm pb-1 ${light ? 'text-white/65' : 'text-slate-500 dark:text-slate-400'}`}>
          {period}
        </span>
      )}
      {discount && (
        <span className="mb-1 text-[11px] font-black bg-ok/15 dark:bg-ok/20 text-ok-dark dark:text-ok px-2.5 py-0.5 rounded-full">
          {discount}
        </span>
      )}
    </div>
  );
}

// ── Lista de features ─────────────────────────────────────────────────────────
export function PList({ children, className = '' }) {
  return <ul className={`space-y-2.5 ${className}`}>{children}</ul>;
}

export function PListItem({ children, light = false }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5
        ${light ? 'bg-white/20' : 'bg-brand/10 dark:bg-brand/15'}`}>
        <Check className={`w-3 h-3 ${light ? 'text-white' : 'text-brand'}`} strokeWidth={2.5} />
      </div>
      <span className={light ? 'text-white/85' : 'text-slate-600 dark:text-slate-300'}>
        {children}
      </span>
    </li>
  );
}

// ── Separador con texto ───────────────────────────────────────────────────────
export function PSeparator({ children = 'o también', className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">{children}</span>
      <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
    </div>
  );
}

// ── Botón primario de pricing ─────────────────────────────────────────────────
export function PButton({ children, onClick, disabled, variant = 'brand', className = '' }) {
  const variants = {
    brand:   'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/25',
    premium: 'bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25',
    white:   'bg-white hover:bg-slate-50 text-slate-900 shadow-lg shadow-black/10',
    ghost:   'bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300',
    dark:    'bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Radio plan card (para modales de selección) ───────────────────────────────
function PlanRadioCard({ plan, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(plan.id)}
      className={`
        relative w-full text-left rounded-xl border-2 p-4 transition-all duration-200
        ${selected
          ? 'border-brand bg-brand/5 dark:bg-brand/8 dark:border-brand/60'
          : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/3'
        }
      `}
    >
      {plan.popular && (
        <div className="absolute -top-3 right-4">
          <PBadge variant="brand"><Star className="w-3 h-3" /> Más elegido</PBadge>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-slate-900 dark:text-white">{plan.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{plan.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-black text-xl text-slate-900 dark:text-white">{plan.price}</p>
          {plan.sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{plan.sub}</p>}
        </div>
      </div>
      {plan.features && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/8">
          <PList>
            {plan.features.map(f => <PListItem key={f}>{f}</PListItem>)}
          </PList>
        </div>
      )}
      {/* Radio indicator */}
      <div className={`
        absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
        ${selected ? 'bg-brand border-brand' : 'border-slate-300 dark:border-white/25'}
      `}>
        {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}

// ── PaywallModal ──────────────────────────────────────────────────────────────
export function PaywallModal({ onClose, onPagar, onTransferencia, vencioEl, renovando, renovError }) {
  const [selected, setSelected] = useState('anual');

  const planes = [
    {
      id: 'mensual',
      name: 'Plan Mensual',
      price: `$${PRECIO_MENSUAL.toLocaleString()}`,
      sub: 'ARS / mes',
      description: '+1 mes de regalo al renovar',
      features: ['Respondé demandas', 'Feed completo', 'Badge verificada'],
    },
    {
      id: 'anual',
      name: 'Plan Anual',
      price: `$${PRECIO_ANUAL_MES.toLocaleString()}`,
      sub: `ARS/mes · Total $${PRECIO_ANUAL.toLocaleString()}`,
      description: '12 meses + 1 de regalo — Ahorrás 20%',
      popular: true,
      features: ['Todo lo mensual', 'Precio fijo 12 meses', 'Soporte prioritario'],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-[9000] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <PCard variant="glass">
          {/* Header */}
          <PHeader gradient="from-[#0B132B] via-slate-800 to-slate-900">
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-20">
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="w-11 h-11 bg-rose-500/25 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-rose-300" />
            </div>
            <h2 className="font-black text-xl text-white mb-1">Suscripción vencida</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              {vencioEl ? `Tu plan venció el ${vencioEl}. ` : 'Tu plan ha vencido. '}
              Renovalo para seguir respondiendo demandas.
            </p>
          </PHeader>

          <div className="p-5 space-y-4">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Elegí tu plan
            </p>

            <div className="space-y-3">
              {planes.map(plan => (
                <PlanRadioCard key={plan.id} plan={plan} selected={selected === plan.id} onSelect={setSelected} />
              ))}
            </div>

            {renovError && (
              <p className="text-rose-500 dark:text-rose-400 text-sm text-center font-semibold">{renovError}</p>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => onTransferencia(selected)}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-lg shadow-emerald-500/20"
              >
                <CreditCard className="w-4 h-4" /> Transferencia
              </button>
              <button
                onClick={() => onPagar(selected)}
                disabled={renovando}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-[#009EE3] hover:bg-[#007EB5] text-white transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50"
              >
                {renovando ? 'Procesando...' : 'MercadoPago'}
              </button>
            </div>

            <p className="text-center text-slate-400 dark:text-slate-500 text-xs">
              Pagos seguros · Cancelás cuando querás
            </p>
          </div>
        </PCard>
      </motion.div>
    </div>
  );
}

// ── PremiumModal ──────────────────────────────────────────────────────────────
export function PremiumModal({ onClose, onUpgrade, renovando }) {
  const benefits = [
    { icon: Award,         text: 'Productos ilimitados' },
    { icon: TrendingUp,    text: 'Prioridad en búsquedas' },
    { icon: Zap,           text: 'IA Insights y consejos' },
    { icon: Crown,         text: 'Badge premium dorada' },
    { icon: MessageSquare, text: 'Búsquedas laborales ilimitadas' },
    { icon: Phone,         text: 'Soporte prioritario' },
  ];

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-[9000] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <PCard variant="premium">
          <PHeader gradient="from-amber-400 via-amber-500 to-amber-700">
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center transition-colors z-20">
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-black text-xl text-white mb-1">Plan Premium</h2>
            <p className="text-amber-100 text-sm leading-relaxed">
              Desbloqueá todo el potencial de tu negocio en Lokal.
            </p>
            <div className="mt-4">
              <PPrice current={`$${PRECIO_PREMIUM.toLocaleString()}`} period="ARS / mes" light />
            </div>
          </PHeader>

          <div className="p-5 space-y-5">
            <PList>
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{text}</span>
                </li>
              ))}
            </PList>

            <PSeparator>método de pago</PSeparator>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onUpgrade('transferencia')}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-lg shadow-emerald-500/20"
              >
                <CreditCard className="w-4 h-4" /> Transferencia
              </button>
              <PButton variant="premium" onClick={onUpgrade} disabled={renovando}>
                <Crown className="w-4 h-4" />
                {renovando ? 'Procesando...' : 'MercadoPago'}
              </PButton>
            </div>

            <button onClick={onClose}
              className="w-full py-2.5 text-sm font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              Ahora no
            </button>
          </div>
        </PCard>
      </motion.div>
    </div>
  );
}

// ── SuscripcionContent ────────────────────────────────────────────────────────
export function SuscripcionContent({
  planActual, isActiva, isEmpresa, isPremium, isEmprendimiento,
  vence, trial, trialHasta, dias,
  historialPagos, loadingHistorial,
  checkoutLoading, renovando,
  onPagar, onTransferencia,
  setShowPremiumModal,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.05 });

  const PLANES = [
    {
      id: 'emprendimiento',
      name: 'Emprendimiento',
      price: 'Gratis',
      period: '',
      desc: 'Para arrancar',
      gradient: 'from-slate-700 to-slate-900',
      features: ['Hasta 5 productos','Página pública','Ver demandas','1 búsqueda laboral','Mapa'],
    },
    {
      id: 'basico',
      name: 'Empresa',
      price: `$${PRECIO_MENSUAL.toLocaleString()}`,
      period: '/mes',
      priceSub: `o $${PRECIO_ANUAL_MES.toLocaleString()}/mes anual`,
      desc: 'Para crecer',
      gradient: 'from-brand to-brand-dark',
      popular: true,
      features: ['Hasta 20 productos','Respondé demandas','Feed completo','Estadísticas','Badge verificada','3 búsquedas laborales'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: `$${PRECIO_PREMIUM.toLocaleString()}`,
      period: '/mes',
      desc: 'Sin límites',
      gradient: 'from-amber-500 to-amber-700',
      features: ['Productos ilimitados','IA Insights','Prioridad búsquedas','Badge dorada','Stats avanzadas','Búsquedas ilimitadas','Soporte prioritario'],
    },
  ];

  const planIdx  = { emprendimiento: 0, basico: 1, premium: 2 };
  const currentIdx = planIdx[planActual] ?? 1;
  const current    = PLANES[currentIdx];

  return (
    <div ref={ref} className="p-4 lg:p-8 space-y-8 max-w-2xl mx-auto">

      {/* ── Plan activo ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
        <PCard variant={planActual === 'premium' ? 'premium' : 'brand'}>
          <PHeader gradient={current.gradient}>
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-3">
                  {isActiva
                    ? <PBadge variant="ok"><Check className="w-3 h-3" /> Activa</PBadge>
                    : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase bg-rose-500/25 text-rose-200">
                        <Lock className="w-3 h-3" /> Vencida
                      </span>}
                </div>
                <h2 className="font-black text-2xl text-white">{current.name}</h2>
                {vence && (
                  <p className="text-white/70 text-sm mt-1">
                    {isActiva ? 'Vence el' : 'Venció el'} {vence.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                {dias !== null && dias > 0 && dias <= 7 && (
                  <p className="text-amber-200 text-sm font-bold mt-1">⚠️ Vence en {dias} día{dias !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
                {planActual === 'premium' ? <Crown className="w-7 h-7 text-white" /> : <Zap className="w-7 h-7 text-white" />}
              </div>
            </div>
          </PHeader>
          <div className="p-5">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Tu plan incluye</p>
            <PList>
              {current.features.map(f => <PListItem key={f}>{f}</PListItem>)}
            </PList>
          </div>
        </PCard>
      </motion.div>

      {/* ── Comparativa ── */}
      <div>
        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Comparar planes</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANES.map((plan, i) => {
            const isCurrent = plan.id === planActual;
            const isUpgrade = i > currentIdx;
            return (
              <motion.div key={plan.id} className="relative pt-4"
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.08 }}>
                {/* Badge FUERA del card para no cortarse */}
                {plan.popular && !isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <PBadge variant="brand"><Star className="w-3 h-3" /> Popular</PBadge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <PBadge variant="ok"><Check className="w-3 h-3" /> Tu plan</PBadge>
                  </div>
                )}
                {plan.id === 'premium' && !isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <PBadge variant="premium"><Crown className="w-3 h-3" /> Premium</PBadge>
                  </div>
                )}

                <PCard variant={plan.popular && !isCurrent ? 'brand' : 'default'} className="h-full flex flex-col">
                  <div className={`${plan.popular && !isCurrent ? '' : ''} p-5 flex-1 flex flex-col`}>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{plan.desc}</p>
                    <PPrice
                      current={plan.price}
                      period={plan.period}
                      discount={plan.id === 'basico' ? '-20% anual' : undefined}
                      className="mb-1"
                    />
                    {plan.priceSub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4">{plan.priceSub}</p>}

                    <PSeparator className="my-3" />

                    <PList className="flex-1 mb-4">
                      {plan.features.map(f => <PListItem key={f}>{f}</PListItem>)}
                    </PList>

                    {isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl text-center text-xs font-bold bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400">
                        Plan actual
                      </div>
                    ) : isUpgrade ? (
                      plan.id === 'premium' ? (
                        <PButton variant="premium" onClick={() => setShowPremiumModal(true)}>
                          <Crown className="w-4 h-4" /> Upgrade Premium
                        </PButton>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button onClick={() => onTransferencia('mensual')}
                            className="py-2.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                            Transferencia
                          </button>
                          <button onClick={() => onPagar('mensual')} disabled={checkoutLoading}
                            className="py-2.5 rounded-xl text-[11px] font-bold bg-[#009EE3] hover:bg-[#007EB5] text-white transition-colors disabled:opacity-50">
                            MercadoPago
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="w-full py-2.5 rounded-xl text-center text-xs font-bold bg-slate-50 dark:bg-white/5 text-slate-400">
                        Plan base
                      </div>
                    )}
                  </div>
                </PCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Renovar ── */}
      {(!isActiva || (dias !== null && dias <= 7)) && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.3 }}>
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Renovar suscripción</p>
          <PCard variant="glass">
            <div className="p-5 space-y-4">
              {/* Mensual */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/4 border border-slate-100 dark:border-white/8">
                <div>
                  <p className="font-black text-sm text-slate-900 dark:text-white">Plan Mensual</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">+1 mes de regalo</p>
                </div>
                <PPrice current={`$${PRECIO_MENSUAL.toLocaleString()}`} period="/mes" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => onTransferencia('mensual')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                  <CreditCard className="w-4 h-4" /> Transferencia
                </button>
                <button onClick={() => onPagar('mensual')} disabled={checkoutLoading}
                  className="py-3 rounded-xl text-sm font-bold bg-[#009EE3] hover:bg-[#007EB5] text-white transition-colors disabled:opacity-50">
                  MercadoPago
                </button>
              </div>

              <PSeparator>o ahorrás con el anual</PSeparator>

              {/* Anual */}
              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-brand/40 bg-brand/5 dark:bg-brand/8 dark:border-brand/30">
                <div>
                  <p className="font-black text-sm text-slate-900 dark:text-white">Plan Anual</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total ${PRECIO_ANUAL.toLocaleString()} · 12+1 meses</p>
                </div>
                <div className="text-right">
                  <PBadge variant="ok" className="mb-1.5 text-[10px]">Ahorrás 20%</PBadge>
                  <PPrice current={`$${PRECIO_ANUAL_MES.toLocaleString()}`} period="/mes" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => onTransferencia('anual')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                  <CreditCard className="w-4 h-4" /> Transferencia
                </button>
                <button onClick={() => onPagar('anual')} disabled={checkoutLoading}
                  className="py-3 rounded-xl text-sm font-bold bg-[#009EE3] hover:bg-[#007EB5] text-white transition-colors disabled:opacity-50">
                  MercadoPago
                </button>
              </div>
            </div>
          </PCard>
        </motion.div>
      )}

      {/* ── Historial ── */}
      {(historialPagos?.length > 0 || loadingHistorial) && (
        <div>
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Historial de pagos</p>
          <PCard variant="default">
            <div className="p-4 space-y-2">
              {loadingHistorial && !historialPagos?.length ? (
                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-6">
                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  Cargando historial...
                </div>
              ) : historialPagos?.map((pago, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ok/10 dark:bg-ok/15 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-ok" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{pago.plan}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(pago.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {pago.monto && <p className="text-sm font-bold text-slate-900 dark:text-white">${Number(pago.monto).toLocaleString()}</p>}
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">MP #{String(pago.paymentId).slice(-6)}</p>
                  </div>
                </div>
              ))}
            </div>
          </PCard>
        </div>
      )}

      <p className="text-center text-slate-400 dark:text-slate-500 text-xs pb-6">
        Pagos seguros con MercadoPago · Cancelás cuando querás
      </p>
    </div>
  );
}
