import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Check, X, Lock, Zap, CreditCard, CheckCircle,
  TrendingUp, Award, MessageSquare, Phone, Star, Crown, Sparkles, Loader2, ChevronDown,
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
    muted:   'bg-surface-card-2 dark:bg-white/10 text-ink-dim dark:text-ink-dim border border-slate-200 dark:border-white/15',
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
        : 'bg-surface-card-2 dark:bg-white/4 border-b border-slate-100 dark:border-white/8 text-ink'}
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
        <span className={`text-lg line-through mb-0.5 ${light ? 'text-white/50' : 'text-ink-dim'}`}>
          {original}
        </span>
      )}
      <span className={`text-4xl font-black tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        {current}
      </span>
      {period && (
        <span className={`text-sm pb-1 ${light ? 'text-white/65' : 'text-ink-dim'}`}>
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
      <span className={light ? 'text-white/85' : 'text-ink-dim dark:text-ink-dim'}>
        {children}
      </span>
    </li>
  );
}

// ── Separador con texto ───────────────────────────────────────────────────────
export function PSeparator({ children = 'o también', className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="h-px flex-1 bg-surface-card-2 dark:bg-white/10" />
      <span className="text-xs font-semibold text-ink-dim shrink-0">{children}</span>
      <span className="h-px flex-1 bg-surface-card-2 dark:bg-white/10" />
    </div>
  );
}

// ── Botón compartido — jerarquía visual única para toda la app (admin y
// pricing): variantes + loading (spinner, bloquea el click sin depender de
// que cada caller recuerde poner disabled) + active:scale para feedback de
// toque, consistentes en light/dark. fullWidth=false para usarlo en pares
// grid-cols-2 (ej. Transferencia/MercadoPago) sin forzar w-full. ──────────
export function PButton({ children, onClick, disabled, loading, variant = 'brand', fullWidth = true, className = '' }) {
  const variants = {
    brand:   'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/25',
    premium: 'bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25',
    white:   'bg-white hover:bg-surface-card-2 text-ink shadow-lg shadow-black/10',
    ghost:   'bg-surface-card-2 dark:bg-white/8 hover:bg-surface-card-2 dark:hover:bg-white/15 text-ink dark:text-ink-dim',
    dark:    'bg-ink dark:bg-white/10 hover:bg-ink/90 dark:hover:bg-white/20 text-white',
    danger:  'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25',
    mercadopago: 'bg-[#009EE3] hover:bg-[#007EB5] text-white',
    transferencia: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${fullWidth ? 'w-full' : ''} py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

// ── FAQ de confianza — acordeón con las dudas típicas antes de pagar
// (cancelación, reembolso, cambio de plan). Vive detrás de un desglose
// colapsable, no todo apilado en texto plano en la card. ───────────────────
const FAQ_ITEMS = [
  { q: '¿Puedo cancelar cuando quiera?', a: 'Sí, no hay permanencia mínima. Podés cancelar cuando quieras y tu tienda pasa al plan Emprendimiento (gratis).' },
  { q: '¿Qué pasa si cancelo a mitad de mes?', a: 'Tu plan sigue activo hasta la fecha ya paga — no se descuenta nada de golpe. Al vencer, pasa automáticamente a Emprendimiento sin devolución del tiempo no usado.' },
  { q: '¿Puedo cambiar de plan más adelante?', a: 'Sí, en cualquier momento. Si subís de plan, el cambio es inmediato. Si bajás, se aplica desde tu próximo período de facturación.' },
];

export function PFaq({ className = '' }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className={`divide-y divide-slate-100 dark:divide-white/8 ${className}`}>
      {FAQ_ITEMS.map((item, i) => {
        const open = openIdx === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpenIdx(open ? null : i)}
              className="w-full flex items-center justify-between gap-3 py-3 text-left"
            >
              <span className="text-sm font-semibold text-ink dark:text-ink-dim">{item.q}</span>
              <ChevronDown className={`w-4 h-4 text-ink-dim shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-200 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <p className="text-xs text-ink-dim leading-relaxed pb-3">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
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
          <p className="font-black text-sm text-ink">{plan.name}</p>
          <p className="text-xs text-ink-dim mt-0.5 leading-relaxed">{plan.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-black text-xl text-ink">{plan.price}</p>
          {plan.sub && <p className="text-[10px] text-ink-dim mt-0.5">{plan.sub}</p>}
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
      // "Recibí pedidos / Feed completo / Badge verificada" era copy de
      // LOKAL global (marketplace con carrito y feed). LINKS no tiene nada
      // de eso: lo que da la suscripción es que la página siga publicada.
      features: ['Tu página publicada', 'Publicaciones sin límite', 'Estadísticas de visitas'],
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
        className="w-full max-w-md max-h-[90dvh]"
      >
        {/* max-h + flex-col: header fijo, body con scroll propio — con el
            FAQ sumado el contenido ya no entra siempre en pantallas bajas
            (mobile landscape, notebook chica) sin esto. */}
        <PCard variant="glass" className="max-h-[90dvh] flex flex-col overflow-hidden">
          {/* Header */}
          <PHeader gradient="from-[#2A0509] via-[#2e2e2e] to-[#1a1a1a]" className="shrink-0">
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-20">
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="w-11 h-11 bg-rose-500/25 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-rose-300" />
            </div>
            <h2 className="font-black text-xl text-white mb-1">Suscripción vencida</h2>
            <p className="text-ink-dim text-sm leading-relaxed">
              {vencioEl ? `Tu plan venció el ${vencioEl}. ` : 'Tu plan ha vencido. '}
              Renovalo para volver a publicar tu página. No se borró nada.
            </p>
          </PHeader>

          <div className="p-5 space-y-4 overflow-y-auto">
            <p className="text-[11px] font-black text-ink-dim uppercase tracking-widest">
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
              <PButton variant="transferencia" onClick={() => onTransferencia(selected)} disabled={renovando} fullWidth={false} className="shadow-lg shadow-emerald-500/20">
                <CreditCard className="w-4 h-4" /> Transferencia
              </PButton>
              <PButton variant="mercadopago" onClick={() => onPagar(selected)} loading={renovando} fullWidth={false} className="shadow-lg">
                MercadoPago
              </PButton>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-center text-ink-dim text-xs">
              <Lock className="w-3 h-3" /> Pagos seguros · Cancelás cuando querás
            </p>

            <PFaq className="pt-1 border-t border-slate-100 dark:border-white/8" />
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
        className="w-full max-w-md max-h-[90dvh]"
      >
        {/* max-h + flex-col en la card, overflow-y-auto solo en el body:
            el header con gradiente queda fijo, el contenido (beneficios +
            pago) scrollea debajo — en pantallas bajas (mobile landscape,
            notebook chica) antes se cortaba contra el borde sin poder
            llegar a los botones de pago. */}
        <PCard variant="premium" className="max-h-[90dvh] flex flex-col overflow-hidden">
          <PHeader gradient="from-amber-400 via-amber-500 to-amber-700" className="shrink-0">
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

          <div className="p-5 space-y-5 overflow-y-auto">
            <PList>
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-semibold text-ink dark:text-ink-dim">{text}</span>
                </li>
              ))}
            </PList>

            <PSeparator>método de pago</PSeparator>

            <div className="grid grid-cols-2 gap-2.5">
              <PButton variant="transferencia" onClick={() => onUpgrade('transferencia')} disabled={renovando} fullWidth={false} className="shadow-lg shadow-emerald-500/20">
                <CreditCard className="w-4 h-4" /> Transferencia
              </PButton>
              <PButton variant="premium" onClick={() => onUpgrade('mercadopago')} loading={renovando} fullWidth={false}>
                <Crown className="w-4 h-4" /> MercadoPago
              </PButton>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-center text-ink-dim text-xs">
              <Lock className="w-3 h-3" /> Pago seguro · Cancelás cuando quieras
            </p>

            <button onClick={onClose}
              className="w-full py-2.5 text-sm font-semibold text-ink-dim hover:text-ink-dim dark:hover:text-ink-dim transition-colors">
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
  checkoutLoading, checkoutError, renovando,
  onPagar, onTransferencia,
  setShowPremiumModal,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.05 });
  const [showNoRenovarModal, setShowNoRenovarModal] = useState(false);
  const [comparativaOpen, setComparativaOpen] = useState(false);

  const PLANES = [
    {
      id: 'emprendimiento',
      name: 'Emprendimiento',
      price: 'Gratis',
      period: '',
      desc: 'Para arrancar',
      gradient: 'from-[#333333] to-[#1a1a1a]',
      features: ['Hasta 5 productos','Página pública','1 búsqueda laboral','Mapa'],
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
      features: ['Hasta 20 productos','Feed completo','Estadísticas','Badge verificada','3 búsquedas laborales'],
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
    <>
    <div ref={ref} className="p-4 lg:p-8 space-y-8 max-w-2xl mx-auto">

      {/* ── Resumen de cuenta — panel de estado/gestión de la suscripción,
          tipo Stripe/ChatGPT: plan + estado, metadata (precio, próxima
          fecha) en fila, y acciones al pie (mejorar plan / no renovar).
          Sin lista de features acá — eso vive en "Comparar planes", esto
          es reporte de cuenta, no vidriera de venta. ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
        <PCard variant="default">
          <div className="p-5 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${planActual === 'premium' ? 'bg-amber-100 dark:bg-amber-500/15' : 'bg-brand/10 dark:bg-brand/15'}`}>
              {planActual === 'premium' ? <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" /> : <Zap className="w-6 h-6 text-brand" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-lg text-ink">{current.name}</h2>
                {isActiva
                  ? <PBadge variant="ok"><Check className="w-3 h-3" /> Activa</PBadge>
                  : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <Lock className="w-3 h-3" /> Vencida
                    </span>}
              </div>
              {dias !== null && dias > 0 && dias <= 7 && (
                <p className="text-amber-600 dark:text-amber-400 text-sm font-bold mt-1">Vence en {dias} día{dias !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>

          <div className="px-5 pb-5">
            <PSeparator className="mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-ink-dim uppercase tracking-widest mb-1">Precio</p>
                <p className="text-sm font-bold text-ink">{current.price}{current.period && <span className="text-ink-dim font-medium"> {current.period}</span>}</p>
              </div>
              {vence && (
                <div>
                  <p className="text-[10px] font-black text-ink-dim uppercase tracking-widest mb-1">{isActiva ? 'Próximo vencimiento' : 'Venció'}</p>
                  <p className="text-sm font-bold text-ink">{vence.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
            </div>

            {(planActual !== 'emprendimiento' || isActiva) && (
              <div className="flex gap-2.5 mt-5">
                {planActual !== 'premium' && (
                  <PButton variant="brand" onClick={() => setShowPremiumModal(true)} fullWidth={false} className="flex-1 py-2.5 text-sm">
                    <Crown className="w-4 h-4" /> Mejorar plan
                  </PButton>
                )}
                {planActual !== 'emprendimiento' && isActiva && (
                  <PButton variant="ghost" onClick={() => setShowNoRenovarModal(true)} fullWidth={false} className="flex-1 py-2.5 text-sm">
                    No renovar
                  </PButton>
                )}
              </div>
            )}
          </div>
        </PCard>
      </motion.div>

      {/* ── Historial — justo debajo del resumen: es lo que un usuario de
          cuenta quiere ver seguido, no al fondo de la pantalla. ── */}
      <div>
        <p className="text-[11px] font-black text-ink-dim uppercase tracking-widest mb-4">Historial de pagos</p>
        <PCard variant="default">
          <div className="p-4 space-y-2">
            {loadingHistorial && !historialPagos?.length ? (
              <div className="flex items-center justify-center gap-2 text-ink-dim text-sm py-6">
                <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                Cargando historial...
              </div>
            ) : !historialPagos?.length ? (
              <p className="text-center text-ink-dim text-sm py-6">Todavía no registrás pagos.</p>
            ) : historialPagos.map((pago, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-card-2 dark:bg-white/4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-ok/10 dark:bg-ok/15 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-ok" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink capitalize">{pago.plan}</p>
                    <p className="text-xs text-ink-dim">
                      {new Date(pago.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {pago.monto && <p className="text-sm font-bold text-ink">${Number(pago.monto).toLocaleString()}</p>}
                  <p className="text-[10px] text-ink-dim">MP #{String(pago.paymentId).slice(-6)}</p>
                </div>
              </div>
            ))}
          </div>
        </PCard>
      </div>

      {/* ── Comparativa — sección de upgrade, separada del resumen de
          cuenta de arriba. Colapsada por default: la mayoría de las
          visitas a esta pantalla son para chequear estado, no para
          comparar planes — mostrar 3 cards completas siempre expandidas
          empuja el resto de la pantalla (historial, FAQ) fuera de vista
          sin necesidad. No repite el badge "Tu plan" del plan activo
          (ya está claro en el resumen): acá el plan actual se muestra
          simplemente atenuado, sin badge extra. ── */}
      <div>
        <button
          onClick={() => setComparativaOpen(o => !o)}
          className="w-full flex items-center justify-between gap-3 mb-4"
        >
          <p className="text-[11px] font-black text-ink-dim uppercase tracking-widest">Comparar planes</p>
          <span className="flex items-center gap-1.5 text-xs font-bold text-brand">
            {comparativaOpen ? 'Ocultar' : 'Ver planes'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${comparativaOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>
        <div className={`grid transition-all duration-300 ease-out ${comparativaOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANES.map((plan, i) => {
            const isCurrent = plan.id === planActual;
            const isUpgrade = i > currentIdx;
            return (
              <motion.div key={plan.id} className={`relative pt-4 ${isCurrent ? 'opacity-60' : ''}`}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: isCurrent ? 0.6 : 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.08 }}>
                {/* Badge FUERA del card para no cortarse — el plan actual no
                    lleva badge acá (ya está claro en el resumen de arriba),
                    solo se atenúa para no competir visualmente con las
                    opciones de upgrade, que son la razón de ser de esta
                    sección. */}
                {plan.popular && !isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <PBadge variant="brand"><Star className="w-3 h-3" /> Popular</PBadge>
                  </div>
                )}
                {plan.id === 'premium' && !isCurrent && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <PBadge variant="premium"><Crown className="w-3 h-3" /> Premium</PBadge>
                  </div>
                )}

                <PCard variant={plan.popular && !isCurrent ? 'brand' : 'default'} className="h-full flex flex-col">
                  <div className={`${plan.popular && !isCurrent ? '' : ''} p-5 flex-1 flex flex-col`}>
                    <h3 className="font-black text-base text-ink">{plan.name}</h3>
                    <p className="text-xs text-ink-dim mb-3">{plan.desc}</p>
                    <PPrice
                      current={plan.price}
                      period={plan.period}
                      discount={plan.id === 'basico' ? '-20% anual' : undefined}
                      className="mb-1"
                    />
                    {plan.priceSub && <p className="text-[10px] text-ink-dim mb-4">{plan.priceSub}</p>}

                    <PSeparator className="my-3" />

                    <PList className="flex-1 mb-4">
                      {plan.features.map(f => <PListItem key={f}>{f}</PListItem>)}
                    </PList>

                    {isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl text-center text-xs font-bold bg-surface-card-2 dark:bg-white/8 text-ink-dim">
                        Plan actual
                      </div>
                    ) : isUpgrade ? (
                      plan.id === 'premium' ? (
                        <PButton variant="premium" onClick={() => setShowPremiumModal(true)}>
                          <Crown className="w-4 h-4" /> Upgrade Premium
                        </PButton>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          <PButton variant="transferencia" onClick={() => onTransferencia('mensual')} disabled={!!checkoutLoading} fullWidth={false} className="text-[11px] py-2.5">
                            Transferencia
                          </PButton>
                          <PButton variant="mercadopago" onClick={() => onPagar('mensual')} loading={checkoutLoading === 'mensual'} disabled={!!checkoutLoading && checkoutLoading !== 'mensual'} fullWidth={false} className="text-[11px] py-2.5">
                            MercadoPago
                          </PButton>
                        </div>
                      )
                    ) : (
                      <div className="w-full py-2.5 rounded-xl text-center text-xs font-bold bg-surface-card-2 dark:bg-white/5 text-ink-dim">
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
        </div>
      </div>

      {/* ── Renovar ── */}
      {(!isActiva || (dias !== null && dias <= 7)) && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.3 }}>
          <p className="text-[11px] font-black text-ink-dim uppercase tracking-widest mb-4">Renovar suscripción</p>
          <PCard variant="glass">
            <div className="p-5 space-y-4">
              {/* Mensual */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-card-2 dark:bg-white/4 border border-slate-100 dark:border-white/8">
                <div>
                  <p className="font-black text-sm text-ink">Plan Mensual</p>
                  <p className="text-xs text-ink-dim">+1 mes de regalo</p>
                </div>
                <PPrice current={`$${PRECIO_MENSUAL.toLocaleString()}`} period="/mes" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <PButton variant="transferencia" onClick={() => onTransferencia('mensual')} disabled={!!checkoutLoading} fullWidth={false}>
                  <CreditCard className="w-4 h-4" /> Transferencia
                </PButton>
                <PButton variant="mercadopago" onClick={() => onPagar('mensual')} loading={checkoutLoading === 'mensual'} disabled={!!checkoutLoading && checkoutLoading !== 'mensual'} fullWidth={false}>
                  MercadoPago
                </PButton>
              </div>

              <PSeparator>o ahorrás con el anual</PSeparator>

              {/* Anual */}
              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-brand/40 bg-brand/5 dark:bg-brand/8 dark:border-brand/30">
                <div>
                  <p className="font-black text-sm text-ink">Plan Anual</p>
                  <p className="text-xs text-ink-dim">Total ${PRECIO_ANUAL.toLocaleString()} · 12+1 meses</p>
                </div>
                <div className="text-right">
                  <PBadge variant="ok" className="mb-1.5 text-[10px]">Ahorrás 20%</PBadge>
                  <PPrice current={`$${PRECIO_ANUAL_MES.toLocaleString()}`} period="/mes" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <PButton variant="transferencia" onClick={() => onTransferencia('anual')} disabled={!!checkoutLoading} fullWidth={false}>
                  <CreditCard className="w-4 h-4" /> Transferencia
                </PButton>
                <PButton variant="mercadopago" onClick={() => onPagar('anual')} loading={checkoutLoading === 'anual'} disabled={!!checkoutLoading && checkoutLoading !== 'anual'} fullWidth={false}>
                  MercadoPago
                </PButton>
              </div>

              {checkoutError && (
                <p className="text-rose-500 dark:text-rose-400 text-sm text-center font-semibold">{checkoutError}</p>
              )}

              <p className="flex items-center justify-center gap-1.5 text-center text-ink-dim text-xs">
                <Lock className="w-3 h-3" /> Pago seguro · Cancelás cuando quieras
              </p>
            </div>
          </PCard>
        </motion.div>
      )}

      {/* ── FAQ de confianza ── */}
      <div>
        <p className="text-[11px] font-black text-ink-dim uppercase tracking-widest mb-4">Preguntas frecuentes</p>
        <PCard variant="default">
          <div className="px-4">
            <PFaq />
          </div>
        </PCard>
      </div>

      <p className="text-center text-ink-dim text-xs pb-6">
        Pagos seguros con MercadoPago · Cancelás cuando querás
      </p>
    </div>

    {/* ── Modal "No renovar" — no hay cobro recurrente automático que dar
        de baja (cada pago es una preferencia MP única), así que "cancelar"
        acá es en realidad "no volver a pagar": el plan sigue activo hasta
        la fecha ya paga, sin devolución, y después cae solo a
        Emprendimiento (gratis). El modal comunica eso explícitamente en
        vez de prometer una cancelación inmediata que no existe. ── */}
    {showNoRenovarModal && (
      <div className="fixed inset-0 z-[9500] flex items-end sm:items-center justify-center p-4" onClick={() => setShowNoRenovarModal(false)}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-surface-card rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-2xl bg-surface-card-2 dark:bg-white/8 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-ink-dim" />
          </div>
          <h3 className="font-black text-lg text-center mb-1">¿No renovar tu plan?</h3>
          <p className="text-sm text-ink-dim text-center leading-relaxed mb-6">
            No hay nada que cancelar ahora mismo: tu plan sigue activo
            {vence ? ` hasta el ${vence.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}, sin devolución del tiempo ya pago.
            Cuando venza, simplemente no te cobramos de nuevo y tu tienda pasa al plan Emprendimiento (gratis). Podés volver a suscribirte cuando quieras.
          </p>
          <button onClick={() => setShowNoRenovarModal(false)} className="w-full py-2.5 rounded-2xl bg-brand hover:bg-brand-dark text-white text-sm font-bold transition-colors">
            Entendido
          </button>
        </div>
      </div>
    )}
    </>
  );
}
