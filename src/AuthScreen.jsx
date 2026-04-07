import React, { useState, useEffect, useRef } from 'react';
import {
  Store, MapPin, Package, Star, Loader2, AlertCircle, CheckCircle,
  ChevronDown, Zap, Shield, Clock, TrendingUp, MessageSquare,
  ArrowRight, Users, ShoppingBag, Bell, Search, Send, X, Check
} from 'lucide-react';
import { signInWithGoogle } from './firebase';

// ── KTRL Logo ────────────────────────────────────────────────────────────────
const KtrlLogo = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 1629.2 404.35" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M838.15,41.28v74.06c0,20.45-16.58,37.03-37.03,37.03h-55.55c-10.23,0-18.52,8.29-18.52,18.52v191.9c0,20.6-16.7,37.3-37.3,37.3h-73.53c-20.6,0-37.3-16.7-37.3-37.3v-191.86c0-10.24-8.31-18.54-18.56-18.52l-55.43.15c-20.48.04-37.11-16.55-37.11-37.03V41.28c0-20.45,16.58-37.03,37.03-37.03h296.26c20.45,0,37.03,16.58,37.03,37.03Z"/>
    <path d="M1629.2,289.56v74.06c0,20.45-16.58,37.03-37.03,37.03h-222.19c-20.45,0-37.03-16.58-37.03-37.03V41.84c0-20.45,16.58-37.03,37.03-37.03h74.06c20.45,0,37.03,16.58,37.03,37.03v192.17c0,10.23,8.29,18.52,18.52,18.52h92.58c20.45,0,37.03,16.58,37.03,37.03Z"/>
    <path d="M1098.1,152.38h-56.26c-10.23,0-18.52,8.29-18.52,18.52v191.97c0,20.45-16.58,37.03-37.03,37.03h-74.08c-20.45,0-37.03-16.58-37.03-37.03V78.31c0-40.9,33.16-74.06,74.06-74.06h247.71c40.9,0,74.06,33.16,74.06,74.06v100.72c0,9.82-3.9,19.24-10.85,26.19l-52.61,52.6c-6.78,6.72-8.03,18.46-.12,26.36l52.77,52.75c23.34,23.34,6.8,63.25-26.21,63.22l-95.66-.07c-9.82,0-19.24-3.9-26.19-10.85l-40.95-40.95c-6.94-6.94-10.85-16.36-10.85-26.19v-71.94c0-9.82,3.9-19.24,10.85-26.19l39.99-39.99c11.66-11.66,3.4-31.61-13.09-31.61Z"/>
    <path d="M83.04,14.06L10.79,86.32C3.88,93.22,0,102.59,0,112.36v179.62c0,9.77,3.88,19.14,10.79,26.05l72.26,72.26c23.21,23.21,62.88,6.77,62.88-26.05V40.11c0-32.82-39.68-49.25-62.88-26.05Z"/>
    <path d="M416.11,340.58l-52.97,52.97c-14.39,14.39-37.71,14.39-52.09,0l-117.4-117.4c-6.97-6.97-10.88-16.41-10.88-26.27v-95.43c0-9.85,3.91-19.3,10.88-26.27L311.04,10.79c14.39-14.39,37.71-14.39,52.09,0l52.97,52.97c14.39,14.39,14.39,37.71,0,52.09l-73.29,73.29c-7.19,7.19-7.19,18.85,0,26.05l73.29,73.29c14.39,14.39,14.39,37.71,0,52.09Z"/>
  </svg>
);

// ── Google Icon ───────────────────────────────────────────────────────────────
const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 2000, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, started]);
  return count;
}

// ── Intersection observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ── Phone Mockup ─────────────────────────────────────────────────────────────
function PhoneMockup() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 3), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-64 mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-110" />

      {/* Phone frame */}
      <div className="relative bg-slate-900 border-2 border-white/10 rounded-[2.5rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-slate-950 rounded-full" />

        {/* Screen */}
        <div className="bg-slate-950 rounded-[2rem] overflow-hidden" style={{ height: 520 }}>

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-7 pb-2">
            <span className="text-[10px] text-white font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1.5 bg-white rounded-sm" />
              <div className="w-0.5 h-1.5 bg-white/40 rounded-sm" />
            </div>
          </div>

          {/* App header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Store className="w-3 h-3 text-white" />
              </div>
              <span className="text-white font-bold text-sm">Lokal</span>
            </div>
            <div className="flex gap-2">
              <Bell className="w-4 h-4 text-slate-400" />
              <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-emerald-700">M</span>
              </div>
            </div>
          </div>

          {/* Content — animated slides */}
          <div className="px-3 pt-3 pb-2">

            {/* Slide 0: crear demanda */}
            {step === 0 && (
              <div className="animate-fade-in">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 mb-3">
                  <p className="text-white font-bold text-xs mb-0.5">Que estas buscando?</p>
                  <p className="text-emerald-100 text-[10px]">Publica tu demanda</p>
                </div>
                <p className="text-slate-400 text-[10px] font-semibold mb-2 px-1">MIS DEMANDAS</p>
                {[
                  { emoji: '📱', title: 'Cable USB-C 2m', resp: 3, color: 'emerald' },
                  { emoji: '🔧', title: 'Taladro percutor', resp: 1, color: 'amber' },
                ].map(d => (
                  <div key={d.title} className="bg-white/5 rounded-xl p-3 mb-2 flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-base shrink-0">{d.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{d.title}</p>
                      <p className={`text-${d.color}-400 text-[10px]`}>{d.resp} respuestas</p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                  </div>
                ))}
              </div>
            )}

            {/* Slide 1: respuestas de tiendas */}
            {step === 1 && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-base">📱</div>
                  <div>
                    <p className="text-white text-xs font-bold">Cable USB-C 2m</p>
                    <p className="text-emerald-400 text-[10px]">3 tiendas respondieron</p>
                  </div>
                </div>
                {[
                  { tienda: 'TecnoStore', precio: '$4.500', dist: '0.8km', stars: '4.8' },
                  { tienda: 'Electro Sur', precio: '$3.800', dist: '1.2km', stars: '4.6' },
                  { tienda: 'DigiZone', precio: '$5.100', dist: '0.3km', stars: '4.9' },
                ].map((r, i) => (
                  <div key={r.tienda} className={`rounded-xl p-3 mb-2 flex items-center gap-2 ${i === 1 ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-white/5'}`}>
                    <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                      <Store className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[11px] font-semibold">{r.tienda}</p>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-500" />
                        <p className="text-slate-400 text-[10px]">{r.dist}</p>
                        <span className="text-yellow-400 text-[10px]">★ {r.stars}</span>
                      </div>
                    </div>
                    <p className={`font-bold text-xs ${i === 1 ? 'text-emerald-400' : 'text-white'}`}>{r.precio}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Slide 2: notificacion */}
            {step === 2 && (
              <div className="animate-fade-in">
                <p className="text-slate-400 text-[10px] font-semibold mb-2 px-1">NOTIFICACIONES</p>
                {[
                  { icon: MessageSquare, bg: 'bg-emerald-500/20', text: 'text-emerald-400', msg: 'TecnoStore respondio tu demanda', time: 'Ahora' },
                  { icon: Star,          bg: 'bg-amber-500/20',   text: 'text-amber-400',   msg: 'Nueva oferta: Mouse Gaming en stock', time: '5 min' },
                  { icon: Bell,          bg: 'bg-violet-500/20',  text: 'text-violet-400',  msg: 'Tu demanda fue vista por 8 tiendas', time: '1h' },
                ].map((n, i) => (
                  <div key={i} className={`flex items-start gap-2.5 rounded-xl p-3 mb-2 ${i === 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5'}`}>
                    <div className={`w-7 h-7 ${n.bg} rounded-lg flex items-center justify-center shrink-0`}>
                      <n.icon className={`w-3.5 h-3.5 ${n.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[10px] font-semibold leading-tight">{n.msg}</p>
                      <p className="text-slate-500 text-[9px] mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 border-t border-white/5 flex items-center justify-around px-4 py-3">
            {[Package, Store, Bell, Users].map((Icon, i) => (
              <div key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-slate-800' : ''}`}>
                <Icon className={`w-4 h-4 ${i === 0 ? 'text-white' : 'text-slate-600'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating notification */}
      <div className="absolute -right-4 top-24 bg-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-2.5 w-48 animate-bounce-slow">
        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-slate-900 text-[11px] font-bold leading-tight">Nueva respuesta!</p>
          <p className="text-slate-500 text-[10px]">TecnoStore · $4.500</p>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -left-6 bottom-32 bg-slate-900 border border-white/10 rounded-2xl shadow-xl px-3 py-2.5 flex items-center gap-2">
        <div className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <Star className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <p className="text-white text-[10px] font-bold">4.9 rating</p>
          <p className="text-slate-500 text-[9px]">TecnoStore</p>
        </div>
      </div>
    </div>
  );
}

// ── Pricing ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    tag: null,
    desc: 'Para compradores que quieren encontrar lo que buscan',
    price: { monthly: 0, annual: 0 },
    cta: 'Empezar gratis',
    highlight: false,
    features: [
      'Publica hasta 5 demandas activas',
      'Recibe respuestas de tiendas',
      'Historial de compras',
      'Chat con tiendas',
      'Notificaciones en tiempo real',
    ],
    missing: ['Demandas ilimitadas', 'Prioridad en el feed'],
  },
  {
    id: 'comercio',
    name: 'Comercio',
    tag: 'Mas popular',
    desc: 'Para tiendas que quieren acceder a clientes activos',
    price: { monthly: 9990, annual: 7990 },
    cta: 'Empezar prueba gratis',
    highlight: true,
    features: [
      'Acceso al feed de demandas',
      'Respuestas ilimitadas',
      'Perfil de tienda verificado',
      'Estadisticas basicas',
      'Notificaciones de nuevas demandas',
      '14 dias de prueba gratis',
    ],
    missing: ['Estadisticas avanzadas', 'Posicion destacada'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tag: null,
    desc: 'Para tiendas que quieren maxima visibilidad y conversion',
    price: { monthly: 19990, annual: 15990 },
    cta: 'Empezar prueba gratis',
    highlight: false,
    features: [
      'Todo lo del plan Comercio',
      'Estadisticas avanzadas',
      'Posicion destacada en resultados',
      'Badge "Tienda verificada Pro"',
      'Soporte prioritario',
      'Reportes mensuales',
    ],
    missing: [],
  },
];

function PricingCard({ plan, annual, onLogin, loading }) {
  const price = annual ? plan.price.annual : plan.price.monthly;
  const yearlyTotal = plan.price.annual * 12;
  const saving = (plan.price.monthly - plan.price.annual) * 12;

  return (
    <div className={`relative flex flex-col rounded-3xl p-7 border transition-all ${
      plan.highlight
        ? 'bg-emerald-500 border-emerald-400 shadow-2xl shadow-emerald-500/30 scale-[1.02]'
        : 'bg-white/5 border-white/10 hover:bg-white/8'
    }`}>
      {plan.tag && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap ${
          plan.highlight ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white'
        }`}>
          {plan.tag}
        </div>
      )}

      <div className="mb-6">
        <h3 className={`font-black text-xl mb-1 ${plan.highlight ? 'text-white' : 'text-white'}`}>{plan.name}</h3>
        <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-emerald-100' : 'text-slate-400'}`}>{plan.desc}</p>
      </div>

      <div className="mb-6">
        {price === 0 ? (
          <div className="flex items-end gap-1">
            <span className="text-5xl font-black text-white">Gratis</span>
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-1">
              <span className={`text-sm font-semibold mb-2 ${plan.highlight ? 'text-emerald-100' : 'text-slate-400'}`}>ARS $</span>
              <span className="text-5xl font-black text-white">{price.toLocaleString()}</span>
              <span className={`text-sm mb-2 ${plan.highlight ? 'text-emerald-100' : 'text-slate-400'}`}>/mes</span>
            </div>
            {annual && saving > 0 && (
              <p className={`text-xs font-semibold mt-1 ${plan.highlight ? 'text-emerald-100' : 'text-emerald-400'}`}>
                Ahorras ${saving.toLocaleString()} al año
              </p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onLogin}
        disabled={loading}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all mb-6 ${
          plan.highlight
            ? 'bg-white text-emerald-600 hover:bg-slate-50'
            : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
        }`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {plan.cta}
      </button>

      <div className="space-y-2.5 flex-1">
        {plan.features.map(f => (
          <div key={f} className="flex items-start gap-2.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              plan.highlight ? 'bg-white/20' : 'bg-emerald-500/20'
            }`}>
              <Check className={`w-2.5 h-2.5 ${plan.highlight ? 'text-white' : 'text-emerald-400'}`} />
            </div>
            <span className={`text-sm ${plan.highlight ? 'text-emerald-50' : 'text-slate-300'}`}>{f}</span>
          </div>
        ))}
        {plan.missing.map(f => (
          <div key={f} className="flex items-start gap-2.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              plan.highlight ? 'bg-white/30' : 'bg-slate-700'
            }`}>
              <X className={`w-2.5 h-2.5 ${plan.highlight ? 'text-white/70' : 'text-slate-400'}`} />
            </div>
            <span className={`text-sm line-through decoration-1 ${
              plan.highlight ? 'text-white/50' : 'text-slate-500'
            }`}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [annual, setAnnual]   = useState(false);

  const [statsRef, statsInView] = useInView(0.3);
  const u = useCounter(1240, 1800, statsInView);
  const d = useCounter(8430, 2000, statsInView);
  const r = useCounter(94,   1600, statsInView);
  const t = useCounter(215,  1900, statsInView);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('No se pudo iniciar sesion. Intenta de nuevo.');
      }
      setLoading(false);
    }
  };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="bg-slate-950 text-white min-h-screen overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 py-4 bg-slate-950/80 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight">Lokal</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm text-slate-400">
          <button onClick={() => scrollTo('como-funciona')} className="hover:text-white transition-colors">Como funciona</button>
          <button onClick={() => scrollTo('tiendas')} className="hover:text-white transition-colors">Para tiendas</button>
          <button onClick={() => scrollTo('precios')} className="hover:text-white transition-colors">Precios</button>
        </div>
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex items-center gap-2 bg-white text-slate-900 font-bold px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-all text-sm shadow-lg disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon size={16} />}
          <span className="hidden sm:inline">Iniciar sesion</span>
          <span className="sm:hidden">Entrar</span>
        </button>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 pb-12 px-6 lg:px-10 overflow-hidden">

        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-full bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.15),transparent)]" />
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px]" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — texto */}
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold px-4 py-2 rounded-full mb-8">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              El mercado inverso de tu ciudad
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-black leading-[1.0] tracking-tight mb-6">
              Publica lo que<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                buscas.
              </span> Las<br />
              tiendas llegan<br />
              a vos.
            </h1>

            <p className="text-slate-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">
              Deja de recorrer comercios. Publica tu pedido, recibe respuestas de tiendas locales y elige la mejor oferta — todo desde tu celu.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 px-7 rounded-2xl transition-all shadow-xl hover:shadow-2xl disabled:opacity-60 active:scale-[0.98] text-base"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <GoogleIcon />}
                Empezar gratis con Google
              </button>
              <button
                onClick={() => scrollTo('como-funciona')}
                className="flex items-center gap-2 text-slate-400 hover:text-white font-semibold transition-colors"
              >
                Ver como funciona
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-sm mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Gratis para usuarios</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Sin tarjeta</div>
              <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Entra con Google</div>
            </div>
          </div>

          {/* Right — phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ── Stats / counters ───────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-16 px-6 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { value: u, suffix: '+', label: 'Usuarios activos' },
            { value: d, suffix: '+', label: 'Demandas publicadas' },
            { value: r, suffix: '%', label: 'Tasa de respuesta' },
            { value: t, suffix: '+', label: 'Tiendas registradas' },
          ].map(({ value, suffix, label }) => (
            <div key={label}>
              <p className="text-4xl sm:text-5xl font-black text-white tabular-nums">
                {value.toLocaleString()}{suffix}
              </p>
              <p className="text-slate-500 text-sm mt-2 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-3">Como funciona</p>
            <h2 className="text-4xl sm:text-5xl font-black">Tres pasos.<br className="sm:hidden" /> Eso es todo.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
            {/* Linea conectora desktop */}
            <div className="hidden sm:block absolute top-16 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

            {[
              { num: '01', icon: Package, title: 'Publica tu pedido', desc: 'Foto, descripcion y presupuesto. En menos de un minuto sin registro complicado.' },
              { num: '02', icon: Store,   title: 'Las tiendas te responden', desc: 'Los comercios locales que tienen el producto te mandan precio y disponibilidad.' },
              { num: '03', icon: Star,    title: 'Elegis y compras', desc: 'Compara opciones, chatea con la tienda y elige la mejor oferta. Sin sorpresas.' },
            ].map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="relative bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/8 transition-all hover:-translate-y-1 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                    <Icon className="w-7 h-7 text-emerald-400" />
                  </div>
                  <span className="text-5xl font-black text-white/[0.06]">{num}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Beneficios usuario ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-10 bg-white/[0.015] border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-3">Para compradores</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Tu tiempo vale.<br /><span className="text-emerald-400">No lo gastes buscando.</span></h2>
            <p className="text-slate-400 text-lg max-w-md mx-auto">Lokal invierte el proceso de compra. Vos pedis, las tiendas compiten por atenderte.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Zap,            title: 'Respuestas en minutos',       desc: 'Las tiendas ven tu pedido en tiempo real y responden al instante.' },
              { icon: TrendingUp,     title: 'Mejor precio garantizado',    desc: 'Multiples tiendas compitiendo por vos = el mejor precio posible.' },
              { icon: MapPin,         title: 'Solo tiendas cercanas',       desc: 'Filtramos automaticamente los comercios de tu zona.' },
              { icon: MessageSquare,  title: 'Chat directo',                desc: 'Chatea con la tienda antes de ir. Sin llamadas, sin filas.' },
              { icon: Shield,         title: 'Tiendas verificadas',         desc: 'Todos los comercios pasan por un proceso de verificacion.' },
              { icon: Package,        title: 'Historial completo',          desc: 'Accede a todas tus demandas, respuestas y compras anteriores.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:-translate-y-0.5 transition-all">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="inline-flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 px-8 rounded-2xl transition-all shadow-xl disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <GoogleIcon />}
              Empezar gratis ahora
            </button>
          </div>
        </div>
      </section>

      {/* ── Para tiendas ───────────────────────────────────────────────────── */}
      <section id="tiendas" className="py-24 px-6 lg:px-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-3">Para tiendas</p>
              <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
                Clientes que ya<br />
                <span className="text-emerald-400">quieren comprar.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Deja de esperar que entren clientes. En Lokal ves en tiempo real quien esta buscando lo que vos vendes — y respondes directamente.
              </p>
              <div className="space-y-3">
                {[
                  'Acceso al feed de demandas activas de tu zona',
                  'Responde solo a lo que podes vender',
                  'Sin comision por venta — precio fijo mensual',
                  'Perfil publico con info, horarios y calificaciones',
                  'Estadisticas de alcance y conversion',
                ].map(f => (
                  <div key={f} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-slate-300 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: ShoppingBag, value: '8.400+', label: 'Demandas activas por mes', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
                { icon: Users,       value: '1.200+', label: 'Compradores buscando hoy', bg: 'bg-teal-500/20',    text: 'text-teal-400' },
                { icon: TrendingUp,  value: '94%',    label: 'Tasa de respuesta promedio', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
                { icon: Star,        value: '4.8',    label: 'Puntuacion media de tiendas', bg: 'bg-amber-500/20', text: 'text-amber-400' },
              ].map(({ icon: Icon, value, label, bg, text }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center hover:bg-white/8 transition-all">
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`w-5 h-5 ${text}`} />
                  </div>
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-slate-500 text-xs mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Invite info */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Clock className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-lg mb-1">Acceso por invitacion</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Para mantener la calidad de la red, el registro de tiendas es por link de invitacion. Contacta al administrador de tu ciudad para obtener el tuyo.
              </p>
            </div>
            <button onClick={() => scrollTo('precios')}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-2xl transition-all whitespace-nowrap text-sm shrink-0">
              Ver planes <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="precios" className="py-24 px-6 lg:px-10 border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-12">
            <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-3">Precios</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Simple y transparente.</h2>
            <p className="text-slate-400 text-lg mb-8">Sin sorpresas. Sin comisiones por venta.</p>

            {/* Toggle mensual/anual */}
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-1.5">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${!annual ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${annual ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Anual
                <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
            {PLANS.map(plan => (
              <PricingCard
                key={plan.id}
                plan={plan}
                annual={annual}
                onLogin={handleGoogle}
                loading={loading}
              />
            ))}
          </div>

          <p className="text-center text-slate-600 text-sm mt-8">
            Todos los planes de tienda incluyen 14 dias de prueba gratis. Sin tarjeta de credito.
          </p>
        </div>
      </section>

      {/* ── CTA Final ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,rgba(16,185,129,0.12),transparent)] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Encontra lo que buscas.<br />
            <span className="text-emerald-400">Empieza hoy.</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Miles de compradores ya publican sus pedidos y reciben respuestas de tiendas locales en minutos.
          </p>
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="inline-flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 px-10 rounded-2xl transition-all shadow-2xl text-lg disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <GoogleIcon size={22} />}
            Empezar gratis con Google
          </button>
          {error && (
            <div className="flex items-center justify-center gap-2 text-rose-400 text-sm mt-4">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 lg:px-10 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-black">Lokal</span>
          </div>
          <p className="text-slate-600 text-xs">© 2026 Lokal. Todos los derechos reservados.</p>
          <a
            href="https://www.instagram.com/katriel.martinez"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 text-white/20 hover:text-white/50 transition-colors group"
          >
            <span className="text-[11px]">Creado por</span>
            <KtrlLogo className="h-3 opacity-40 group-hover:opacity-80 transition-opacity" />
          </a>
        </div>
      </footer>

    </div>
  );
}
