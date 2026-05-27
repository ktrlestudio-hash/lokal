import React, { useState, useEffect, useRef } from 'react';
import {
  Store, MapPin, Package, Star, Loader2, AlertCircle, CheckCircle,
  ChevronDown, ChevronUp, Zap, Shield, Clock, TrendingUp, MessageSquare,
  ArrowRight, Users, ShoppingBag, Bell, X, Check, Menu, Send,
  BarChart2, Tag, Heart, ExternalLink, Instagram, UserCircle2,
  Sun, Moon,
} from 'lucide-react';
import { LogoBadge, LogoFull, KtrlMark } from './Brand';
import { signInWithGoogle } from './firebase';

// ── Google Icon ───────────────────────────────────────────────────────────────
const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useCounter(target, duration = 2000, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let v = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(v));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration, started]);
  return count;
}

// ── FadeUp wrapper ────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView(0.12);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Phone Mockup ──────────────────────────────────────────────────────────────
function PhoneMockup() {
  const [screen, setScreen] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setScreen(s => (s + 1) % 2), 3200);
    return () => clearInterval(t);
  }, []);

  const CATEGORIES = ['Todos', 'Tecnología', 'Ropa', 'Hogar', 'Bebés'];
  const STORES = [
    { name: 'TecnoStore', cat: 'Electrónica', dist: '0.8 km', rating: '4.9', reviews: 142, color: '#00B8D9' },
    { name: 'Ferretería Sur', cat: 'Herramientas', dist: '1.2 km', rating: '4.7', reviews: 89, color: '#3A86FF' },
    { name: 'Moda Central', cat: 'Indumentaria', dist: '0.4 km', rating: '4.8', reviews: 203, color: '#8B5CF6' },
  ];

  return (
    <div className="relative w-[260px] mx-auto select-none">
      <div className="absolute inset-0 bg-brand/25 blur-[60px] rounded-full scale-110 -z-0" />
      <div className="relative z-10 bg-[#0F172A] border border-white/10 rounded-[2.8rem] p-2.5 shadow-2xl">
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-full z-20" />
        <div className="bg-white rounded-[2.3rem] overflow-hidden" style={{ height: 530 }}>
          {screen === 0 && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-5 pt-6 pb-2 bg-white">
                <span className="text-[10px] text-slate-400 font-medium">9:41</span>
                <div className="flex gap-0.5">
                  <div className="w-2.5 h-1 bg-slate-300 rounded-sm" />
                  <div className="w-0.5 h-1 bg-slate-200 rounded-sm" />
                </div>
              </div>
              <div className="px-4 pb-3 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <LogoFull size={18} className="text-slate-800" />
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                    <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-brand">M</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
                  <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <span className="text-[10px] text-slate-400">Buscar productos y tiendas</span>
                </div>
              </div>
              <div className="px-3 pt-3 pb-1 bg-white">
                <div className="flex gap-1.5 overflow-hidden">
                  {CATEGORIES.map((c, i) => (
                    <span key={c} className={`text-[9px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${i === 0 ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`}>{c}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-hidden px-3 pt-2 bg-white">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tiendas cerca tuyo</p>
                <div className="space-y-2">
                  {STORES.map(s => (
                    <div key={s.name} className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: s.color + '22' }}>
                        <Store className="w-5 h-5" style={{ color: s.color }} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{s.name}</p>
                        <p className="text-[9px] text-slate-400">{s.cat}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" strokeWidth={0} />
                          <span className="text-[9px] font-semibold text-slate-700">{s.rating}</span>
                          <span className="text-[9px] text-slate-400">· {s.dist}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-semibold text-brand whitespace-nowrap">Ver →</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 flex items-center justify-around px-4 py-3 bg-white">
                {[
                  { Icon: Package, label: 'Pedir', active: true },
                  { Icon: Store, label: 'Tiendas', active: false },
                  { Icon: MapPin, label: 'Mapa', active: false },
                  { Icon: Users, label: 'Perfil', active: false },
                ].map(({ Icon, label, active }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-brand' : 'text-slate-300'}`} strokeWidth={active ? 2 : 1.5} />
                    <span className={`text-[8px] ${active ? 'text-brand font-semibold' : 'text-slate-300'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {screen === 1 && (
            <div className="flex flex-col h-full bg-white">
              <div className="px-4 pt-7 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-slate-100 rounded-xl flex items-center justify-center text-sm">📱</div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">Cable USB-C 2m</p>
                    <p className="text-[9px] text-brand font-semibold">3 tiendas respondieron</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 px-3 pt-3 space-y-2 overflow-hidden">
                {[
                  { name: 'TecnoStore', price: '$4.500', dist: '0.8 km', rating: '4.9', best: true, color: '#00B8D9' },
                  { name: 'Electro Sur', price: '$3.800', dist: '1.2 km', rating: '4.6', best: false, color: '#3A86FF' },
                  { name: 'DigiZone', price: '$5.100', dist: '0.3 km', rating: '4.9', best: false, color: '#8B5CF6' },
                ].map(r => (
                  <div key={r.name} className={`rounded-xl p-2.5 flex items-center gap-2 border ${r.best ? 'bg-brand/5 border-brand/20' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: r.color + '18' }}>
                      <Store className="w-4 h-4" style={{ color: r.color }} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800">{r.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" strokeWidth={0} />
                        <span className="text-[9px] text-slate-500">{r.rating} · {r.dist}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-[12px] font-black ${r.best ? 'text-brand' : 'text-slate-700'}`}>{r.price}</p>
                      {r.best && <span className="text-[8px] text-brand font-semibold">Mejor precio</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 pb-5 pt-2">
                <button className="w-full bg-brand text-white text-[11px] font-bold py-3 rounded-xl">
                  Contactar TecnoStore
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute -right-6 top-20 bg-white rounded-2xl shadow-2xl px-3 py-2.5 flex items-center gap-2 w-44 animate-bounce-slow z-20">
        <div className="w-7 h-7 bg-brand/15 rounded-xl flex items-center justify-center shrink-0">
          <MessageSquare className="w-3.5 h-3.5 text-brand" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-slate-900 text-[10px] font-bold leading-tight">Nueva respuesta</p>
          <p className="text-slate-400 text-[9px]">TecnoStore · $4.500</p>
        </div>
      </div>
      <div className="absolute -left-8 bottom-28 bg-white border border-slate-100 rounded-2xl shadow-xl px-3 py-2 flex items-center gap-1.5 z-20">
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" strokeWidth={0} />
        <div>
          <p className="text-slate-800 text-[10px] font-bold">4.9 · TecnoStore</p>
          <p className="text-slate-400 text-[9px]">142 reseñas</p>
        </div>
      </div>
    </div>
  );
}

// ── Store Dashboard Mockup ────────────────────────────────────────────────────
function StoreDashMockup() {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2200);
    return () => clearInterval(t);
  }, []);

  const DEMANDS = [
    { emoji: '📱', title: 'Cable USB-C 2m braided', user: 'Martina G.', time: '3 min', isNew: true },
    { emoji: '🎮', title: 'Joystick PS5 DualSense', user: 'Tomás R.', time: '8 min', isNew: false },
    { emoji: '🔧', title: 'Taladro percutor 600W', user: 'Carlos M.', time: '15 min', isNew: true },
  ];

  return (
    <div className="relative w-[260px] mx-auto select-none">
      <div className="absolute inset-0 bg-brand/25 blur-[60px] rounded-full scale-110 -z-0" />
      <div className="relative z-10 bg-[#0F172A] border border-white/10 rounded-[2.8rem] p-2.5 shadow-2xl">
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-full z-20" />
        <div className="bg-white rounded-[2.3rem] overflow-hidden" style={{ height: 530 }}>
          <div className="px-4 pt-7 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-0.5">
              <div>
                <p className="text-[12px] font-bold text-slate-800">Feed en vivo</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full transition-colors ${pulse ? 'bg-brand' : 'bg-brand/40'}`} />
                  <span className="text-[9px] text-brand font-semibold">12 nuevas hoy</span>
                </div>
              </div>
              <div className="w-7 h-7 bg-brand/10 rounded-xl flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-brand" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <div className="px-3 pt-2.5 space-y-2 flex-1">
            {DEMANDS.map((d, i) => (
              <div key={i} className={`rounded-xl p-2.5 border ${i === 0 ? 'bg-brand/5 border-brand/20' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-sm shrink-0">{d.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">{d.title}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{d.user} · hace {d.time}</p>
                  </div>
                  {d.isNew && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-brand/15 text-brand shrink-0">Nueva</span>
                  )}
                </div>
                {i === 0 && (
                  <button className="mt-2 w-full bg-brand text-white text-[9px] font-bold py-1.5 rounded-lg">
                    Responder →
                  </button>
                )}
              </div>
            ))}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-around mt-1">
              <div className="text-center">
                <p className="text-[13px] font-black text-slate-800">24</p>
                <p className="text-[8px] text-slate-400">Respuestas</p>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="text-center">
                <p className="text-[13px] font-black text-brand">87%</p>
                <p className="text-[8px] text-slate-400">Conversión</p>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="text-center">
                <p className="text-[13px] font-black text-amber-500">4.9</p>
                <p className="text-[8px] text-slate-400">Rating</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 flex items-center justify-around px-4 py-3 bg-white rounded-b-[2.3rem]">
            {[
              { Icon: Bell, label: 'Feed', active: true },
              { Icon: Package, label: 'Ofertas', active: false },
              { Icon: BarChart2, label: 'Stats', active: false },
              { Icon: Store, label: 'Perfil', active: false },
            ].map(({ Icon, label, active }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <Icon className={`w-4 h-4 ${active ? 'text-brand' : 'text-slate-300'}`} strokeWidth={active ? 2 : 1.5} />
                <span className={`text-[8px] ${active ? 'text-brand font-semibold' : 'text-slate-300'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -right-6 top-20 bg-white rounded-2xl shadow-2xl px-3 py-2.5 flex items-center gap-2 w-44 animate-bounce-slow z-20">
        <div className="w-7 h-7 bg-brand/10 rounded-xl flex items-center justify-center shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-brand" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-slate-800 text-[10px] font-bold">+3 nuevas demandas</p>
          <p className="text-slate-400 text-[9px]">En tu zona · Ahora</p>
        </div>
      </div>
      <div className="absolute -left-8 bottom-28 bg-white border border-slate-100 rounded-2xl shadow-xl px-3 py-2 flex items-center gap-1.5 z-20">
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" strokeWidth={0} />
        <div>
          <p className="text-slate-800 text-[10px] font-bold">Venta cerrada · $12.500</p>
          <p className="text-slate-400 text-[9px]">Cable USB-C · TecnoStore</p>
        </div>
      </div>
    </div>
  );
}

// ── Testimonials Carousel ─────────────────────────────────────────────────────
const AVATAR_COLORS = ['#00B8D9','#3A86FF','#8B5CF6','#F59E0B'];

function TestimonialAvatar({ name, isStore = false, index = 0 }) {
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <span
      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white font-black text-base"
      style={{ background: bg }}
    >
      {isStore ? <Store className="w-5 h-5" /> : name[0].toUpperCase()}
    </span>
  );
}

const TESTIMONIALS = {
  usuarios: [
    { name: 'Sofía M.', role: 'Compradora', city: 'Buenos Aires', text: 'Busqué un cable en 4 negocios sin éxito. En Lokal publiqué y en 20 minutos tenía 3 respuestas con precio y disponibilidad. Increíble.' },
    { name: 'Tomás R.', role: 'Gamer', city: 'Córdoba', text: 'Uso Lokal para todo lo de electrónica. Las tiendas responden rápido y siempre encuentro mejor precio que en las grandes plataformas.' },
    { name: 'Valentina C.', role: 'Mamá', city: 'Rosario', text: 'Me ahorré horas de búsqueda para el cumple de mi hijo. Publiqué, llegaron las respuestas solas, y elegí sin salir de casa.' },
    { name: 'Diego P.', role: 'Emprendedor', city: 'Mendoza', text: 'Para insumos de trabajo es ideal. Publico, me ofrecen precio mayorista, y elijo. Sin llamadas, sin recorrer zonas comerciales.' },
  ],
  tiendas: [
    { name: 'TecnoStore', role: 'Electrónica', city: 'Buenos Aires', text: 'El feed de demandas nos cambió. Respondemos solo a clientes que ya necesitan lo que tenemos. El ratio de conversión es el triple que en redes.', isStore: true },
    { name: 'Ferretería El Torno', role: 'Ferretería', city: 'Córdoba', text: 'Al principio dudé del modelo. Pero el primer mes recuperé la inversión. Los clientes que llegan por Lokal ya saben lo que quieren.', isStore: true },
    { name: 'FotoDigital Pro', role: 'Fotografía', city: 'Rosario', text: 'Cerramos ventas que no hubiéramos conseguido sin Lokal. El cliente llega con intención de compra, no a comparar precios online.', isStore: true },
    { name: 'Moda Central', role: 'Indumentaria', city: 'Mendoza', text: 'Subimos nuestros productos al perfil y los pedidos entraron solos. Nuestra página de Lokal ahora la compartimos en Instagram también.', isStore: true },
  ],
};

function TestimonialsCarousel({ mode }) {
  const items = TESTIMONIALS[mode];
  const [active, setActive] = useState(0);
  const prev = () => setActive(a => (a - 1 + items.length) % items.length);
  const next = () => setActive(a => (a + 1) % items.length);

  useEffect(() => {
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [items.length, mode]);
  useEffect(() => setActive(0), [mode]);

  return (
    <div className="relative">
      <button
        onClick={prev}
        className="no-press absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-8 z-10 w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors dark:bg-white/8 dark:border-white/10 dark:hover:bg-white/15"
        aria-label="Anterior"
      >
        <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-300 rotate-90" strokeWidth={2} />
      </button>
      <button
        onClick={next}
        className="no-press absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-8 z-10 w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors dark:bg-white/8 dark:border-white/10 dark:hover:bg-white/15"
        aria-label="Siguiente"
      >
        <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-300 -rotate-90" strokeWidth={2} />
      </button>

      <div className="overflow-hidden px-2">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {items.map((t, i) => (
            <div key={i} className="w-full shrink-0 px-1">
              <div className="bg-slate-100 border border-slate-200 rounded-3xl p-7 mx-auto max-w-lg dark:bg-white/5 dark:border-white/10">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, s) => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <TestimonialAvatar name={t.name} isStore={t.isStore} index={i} />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`no-press h-1.5 rounded-full transition-all ${i === active ? 'bg-brand w-6' : 'bg-slate-300 dark:bg-white/20 w-1.5'}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: '¿Es completamente gratis para usuarios?', a: 'Sí. Publicar demandas, recibir respuestas y chatear con tiendas es 100% gratuito para compradores. Sin tarjeta, sin límite de consultas.' },
  { q: '¿Cómo se verifican las tiendas?', a: 'Las tiendas acceden mediante link de invitación y se registran con cuenta Google. El equipo de Lokal revisa cada perfil antes de habilitarlo. Las tiendas con rating bajo o reclamos reiterados pueden ser suspendidas.' },
  { q: '¿Cuánto cuesta registrar mi tienda?', a: 'El plan mensual es $4.990 ARS/mes con 1 mes de regalo al activar. El plan anual sale $47.900 ARS/año (equivalente a $3.992/mes). Sin comisiones por venta, precio fijo.' },
  { q: '¿En qué ciudades está disponible?', a: 'Actualmente en fase de lanzamiento con cobertura nacional en Argentina. El feed filtra automáticamente las demandas de tu zona. Pronto incorporamos mapa interactivo de tiendas.' },
  { q: '¿Puedo cancelar mi suscripción?', a: 'Sí, cuando quieras desde tu panel. El acceso sigue activo hasta que venza el período pagado, sin cobros adicionales ni penalidades.' },
  { q: '¿Lokal garantiza que voy a vender?', a: 'No somos vendedores ni intermediarios en las transacciones. Ponemos el puente entre compradores con intención real y tiendas con lo que buscan. Los resultados dependen de cada comercio.' },
];

function FAQAccordion() {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="no-press w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <span className="font-semibold text-slate-900 dark:text-white text-sm pr-4">{item.q}</span>
            {open === i
              ? <ChevronUp className="w-4 h-4 text-brand shrink-0" />
              : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            }
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-white/5 pt-4 animate-fade-in">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
// ─── Precios (configurables desde admin en el futuro) ────────────────────────
const PRECIO_MENSUAL    = 4990;
const PRECIO_ANUAL      = 47900;
const PRECIO_ANUAL_MES  = Math.round(PRECIO_ANUAL / 12);
const PRECIO_PREMIUM    = 9990;  // Placeholder para plan premium
const PRECIO_PREMIUM_ANUAL = 95900;
const PRECIO_PREMIUM_ANUAL_MES = Math.round(PRECIO_PREMIUM_ANUAL / 12);

// ─── Planes por modo ──────────────────────────────────────────────────────────
// Modo 'usuarios': enfocado en personas que buscan/compran
// Modo 'tiendas': enfocado en negocios que venden

const PLANS_USUARIOS = [
  {
    id: 'usuario', name: 'Usuario', tag: null, role: 'usuario', highlight: false,
    desc: 'Para compradores que quieren encontrar lo que buscan',
    price: { monthly: 0, annual: 0 },
    cta: 'Empezar gratis',
    features: [
      'Publicá demandas ilimitadas',
      'Recibí respuestas de tiendas',
      'Chat directo con comercios',
      'Explorá productos y tiendas',
      'Creá tu CV para oportunidades',
    ],
  },
  {
    id: 'emprendimiento', name: 'Emprendimiento', tag: 'Gratis', role: 'emprendimiento', highlight: true,
    desc: 'Para emprendedores que quieren vender sin costo',
    price: { monthly: 0, annual: 0 },
    cta: 'Ser emprendimiento',
    features: [
      'Todo lo de Usuario',
      'Vendé hasta 5 productos',
      'Página pública en listados',
      '1 búsqueda laboral activa',
      'Aparecé en el mapa como negocio',
    ],
  },
];

const PLANS_TIENDAS = [
  {
    id: 'emprendimiento', name: 'Emprendimiento', tag: 'Gratis', role: 'emprendimiento', highlight: false,
    desc: 'Para emprendedores que recién empiezan',
    price: { monthly: 0, annual: 0 },
    cta: 'Empezar gratis',
    features: [
      'Vendé hasta 5 productos',
      'Página pública en listados',
      'Ver demandas (sin responder)',
      '1 búsqueda laboral activa',
      'Aparecé en el mapa',
    ],
  },
  {
    id: 'empresa-basico', name: 'Empresa', tag: 'Más popular', role: 'empresa', planKey: 'basico', highlight: true,
    desc: 'Para negocios que quieren crecer con herramientas completas',
    price: { monthly: PRECIO_MENSUAL, annual: PRECIO_ANUAL_MES },
    annualTotal: PRECIO_ANUAL,
    cta: 'Registrá tu empresa',
    features: [
      'Todo lo de Emprendimiento',
      'Vendé hasta 20 productos',
      'Respondé demandas de clientes',
      'Estadísticas básicas',
      'Feed completo de demandas',
      'Badge verificada',
      '3 búsquedas laborales',
      'Pagá 1 mes, el segundo es gratis',
    ],
  },
  {
    id: 'empresa-premium', name: 'Premium', tag: 'Máximo alcance', role: 'empresa', planKey: 'premium', highlight: false,
    desc: 'Para negocios que quieren dominar su zona',
    price: { monthly: PRECIO_PREMIUM, annual: PRECIO_PREMIUM_ANUAL_MES },
    annualTotal: PRECIO_PREMIUM_ANUAL,
    cta: 'Ser Premium',
    features: [
      'Todo lo de Empresa',
      'Productos ilimitados',
      'IA Insights y consejos',
      'Prioridad en búsquedas',
      'Badge premium dorada',
      'Estadísticas avanzadas',
      'Búsquedas laborales ilimitadas',
      'Soporte prioritario',
    ],
  },
];

function PricingCard({ plan, annual, onLogin, loading }) {
  const price = annual ? plan.price.annual : plan.price.monthly;
  const handleCta = () => {
    // Guardar intención de registro según el rol seleccionado
    if (plan.role === 'empresa') {
      // Empresa: va a StoreRegisterFlow con pago
      sessionStorage.setItem('lokal-register-intent', JSON.stringify({
        intent: 'register-store',
        plan: annual ? 'anual' : 'mensual',
        empresaPlan: plan.planKey || 'basico', // 'basico' o 'premium'
      }));
    } else if (plan.role === 'emprendimiento') {
      // Emprendimiento: va a OnboardingFlow preseleccionado
      sessionStorage.setItem('lokal-register-intent', JSON.stringify({
        intent: 'register-emprendimiento',
        role: 'emprendimiento',
      }));
    } else {
      // Usuario: va a OnboardingFlow normal (o directo a app)
      sessionStorage.setItem('lokal-register-intent', JSON.stringify({
        intent: 'register-user',
        role: 'usuario',
      }));
    }
    onLogin();
  };

  return (
    <div className={`relative flex flex-col rounded-3xl p-7 border transition-all h-full ${
      plan.highlight
        ? 'bg-brand border-brand-light shadow-2xl shadow-brand/25 scale-[1.02]'
        : 'bg-slate-100 border-slate-200 hover:bg-slate-200/70 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/8'
    }`}>
      {plan.tag && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap ${
          plan.highlight ? 'bg-white text-brand-dark' : 'bg-brand/15 text-brand border border-brand/30'
        }`}>
          {plan.tag}
        </div>
      )}
      <div className="mb-5">
        <h3 className={`font-black text-xl mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{plan.name}</h3>
        <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'}`}>{plan.desc}</p>
      </div>
      <div className="mb-6">
        {price === 0 ? (
          <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Gratis</span>
        ) : (
          <div>
            <div className="flex items-end gap-1">
              <span className={`text-sm font-semibold mb-1.5 ${plan.highlight ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'}`}>ARS $</span>
              <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{price.toLocaleString()}</span>
              <span className={`text-sm mb-1.5 ${plan.highlight ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'}`}>/mes</span>
            </div>
            {annual && plan.annualTotal && (
              <p className={`text-xs font-semibold mt-1 ${plan.highlight ? 'text-white/75' : 'text-brand'}`}>
                Facturado ${plan.annualTotal.toLocaleString()}/año
              </p>
            )}
            {!annual && plan.isStore && (
              <p className={`text-xs mt-1 ${plan.highlight ? 'text-white/75' : 'text-brand'}`}>+ 1 mes de regalo al activar</p>
            )}
          </div>
        )}
      </div>
      <button
        onClick={handleCta}
        disabled={loading}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all mb-6 ${
          plan.highlight
            ? 'bg-white text-brand-dark hover:bg-slate-50'
            : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:border dark:border-white/10'
        }`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {plan.cta}
      </button>
      <div className="space-y-2.5 flex-1">
        {plan.features.map(f => (
          <div key={f} className="flex items-start gap-2.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.highlight ? 'bg-white/20' : 'bg-brand/20'}`}>
              <Check className={`w-2.5 h-2.5 ${plan.highlight ? 'text-white' : 'text-brand'}`} />
            </div>
            <span className={`text-sm ${plan.highlight ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'}`}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Theme Toggle button ───────────────────────────────────────────────────────
function ThemeToggle({ isDark, toggleTheme }) {
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

// ── Mobile Drawer ─────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose, onLogin, loading, mode, setMode, scrollTo, isDark, toggleTheme }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 bottom-0 z-50 w-72 bg-white dark:bg-[#0B132B] border-l border-slate-200 dark:border-white/10 flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
          <LogoFull size={24} />
          <div className="flex items-center gap-1">
            <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="px-6 pt-5 pb-2">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Explorar como</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setMode('usuarios')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${mode === 'usuarios' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'}`}
            >
              <Users className="w-4 h-4 shrink-0" /> Para compradores
            </button>
            <button
              onClick={() => setMode('tiendas')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${mode === 'tiendas' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'}`}
            >
              <Store className="w-4 h-4 shrink-0" /> Para tiendas
            </button>
          </div>
        </div>

        <nav className="flex-1 px-6 pt-4 space-y-1">
          {[
            { label: 'Cómo funciona', id: 'como-funciona' },
            { label: mode === 'tiendas' ? 'Para tiendas' : 'Para compradores', id: 'beneficios' },
            { label: 'Precios', id: 'precios' },
            { label: 'Preguntas frecuentes', id: 'faq' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => { scrollTo(id); onClose(); }}
              className="w-full text-left px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 rounded-xl transition-colors font-medium text-sm"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="px-6 pb-8 pt-4 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={() => { onLogin(); onClose(); }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 px-6 rounded-2xl transition-all hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon size={18} />}
            Entrar con Google
          </button>
        </div>
      </div>
    </>
  );
}

// ── CONTENT por modo ──────────────────────────────────────────────────────────
const CONTENT = {
  usuarios: {
    badge: 'Descubrí, Comprá, Conectá.',
    headline: ['Publicá lo que', 'buscás.', 'Las tiendas', 'llegan a vos.'],
    highlightWord: 'buscás.',
    sub: 'Dejá de recorrer comercios. Publicá tu pedido, recibí respuestas de tiendas locales y elegí la mejor oferta — todo desde tu celu.',
    cta: 'Empezar gratis con Google',
    ctaNote: 'Sin tarjeta · Siempre gratis para compradores',
    steps: [
      { num: '01', icon: Package, title: 'Publicás tu pedido', desc: 'Foto, descripción y presupuesto. En menos de un minuto, sin registro complicado.' },
      { num: '02', icon: Store,   title: 'Las tiendas te responden', desc: 'Los comercios locales que tienen el producto te mandan precio y disponibilidad.' },
      { num: '03', icon: CheckCircle, title: 'Elegís y comprás', desc: 'Comparás opciones, charlás con la tienda y elegís la mejor oferta. Sin sorpresas.' },
    ],
    features: [
      { icon: Zap,           title: 'Respuestas en minutos',    desc: 'Las tiendas ven tu pedido en tiempo real y responden al instante.' },
      { icon: TrendingUp,    title: 'Mejores precios',          desc: 'Varios comercios pueden competir por tu pedido y ayudarte a comparar.' },
      { icon: MapPin,        title: 'Solo tiendas cercanas',    desc: 'Filtramos automáticamente los comercios de tu zona.' },
      { icon: MessageSquare, title: 'Chat directo',             desc: 'Chateá con la tienda antes de ir. Sin llamadas, sin filas.' },
      { icon: Shield,        title: 'Identidad verificada',     desc: 'Las tiendas se registran con cuenta real y son revisadas por el equipo.' },
      { icon: Package,       title: 'Historial completo',       desc: 'Accedé a todas tus demandas, respuestas y compras anteriores.' },
    ],
    featuresTitle: 'Tu tiempo vale.',
    featuresAccent: 'No lo gastes buscando.',
    featuresSub: 'Lokal invierte el proceso de compra. Vos pedís, las tiendas compiten por atenderte.',
    testimonialLabel: 'Lo que dicen los compradores',
  },
  tiendas: {
    badge: 'Cerca, como tiene que ser.',
    headline: ['Clientes que ya', 'quieren comprar.', 'En tu ciudad.', 'Ahora.'],
    highlightWord: 'quieren comprar.',
    sub: 'Dejá de esperar que entren clientes. En Lokal ves en tiempo real quién está buscando lo que vos vendés — y respondés directamente.',
    cta: 'Registrá tu tienda',
    ctaNote: '1 mes de regalo · Sin comisión por venta',
    steps: [
      { num: '01', icon: Bell,       title: 'Ves las demandas', desc: 'Un feed en tiempo real de clientes buscando productos que vos vendés, en tu ciudad.' },
      { num: '02', icon: Send,       title: 'Respondés lo que podés', desc: 'Mandás precio, disponibilidad y fotos. Sin intermediarios, sin algoritmos.' },
      { num: '03', icon: TrendingUp, title: 'Más ventas, menos ruido', desc: 'Clientes con intención de compra real. Sin publicidad, sin comisión por venta.' },
    ],
    features: [
      { icon: Bell,        title: 'Feed en tiempo real',       desc: 'Ves quién está buscando lo que vendés en tu zona. Respondés cuando querés.' },
      { icon: ShoppingBag, title: 'Sin comisión por venta',    desc: 'Precio fijo mensual. Todo lo que vendás es 100% tuyo.' },
      { icon: Store,       title: 'Perfil público de tienda',  desc: 'Tu info, horarios, fotos, y categorías visibles para todos los usuarios.' },
      { icon: ExternalLink,title: 'Página web propia',         desc: 'Compartí tu tienda con un link único: lokal.ar/t/tu-tienda.' },
      { icon: BarChart2,   title: 'Estadísticas de alcance',   desc: 'Cuántos usuarios vieron tus respuestas y cuántos convirtieron.' },
      { icon: Shield,      title: 'Red verificada',            desc: 'Solo comercios reales. Eso hace que los compradores confíen en la plataforma.' },
    ],
    featuresTitle: 'Clientes que llegan solos.',
    featuresAccent: 'Con intención de compra.',
    featuresSub: 'Sin publicidad paga, sin algoritmos. Solo demanda real de usuarios de tu ciudad buscando lo que vos vendés.',
    testimonialLabel: 'Lo que dicen las tiendas',
  },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function AuthScreen({ isDark, toggleTheme, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [annual, setAnnual]   = useState(false);
  const [mode, setMode]       = useState('usuarios');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [statsRef, statsInView] = useInView(0.3);
  const u = useCounter(1240, 1800, statsInView);
  const d = useCounter(8430, 2000, statsInView);
  const r = useCounter(94,   1600, statsInView);
  const t = useCounter(215,  1900, statsInView);

  const content = CONTENT[mode];

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      // En mobile signInWithGoogle devuelve null (redirect) — la página se recarga sola.
      // En desktop devuelve el user — Root.jsx toma el control. Reseteamos loading por si acaso.
      if (user === null) return; // redirect en curso, no resetear
      setLoading(false);
    } catch (err) {
      const ignored = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      if (!ignored.includes(err.code)) {
        setError(
          err.code === 'auth/unauthorized-domain'
            ? 'Dominio no autorizado. Agregá este dominio en Firebase Console → Authentication → Authorized domains.'
            : `No se pudo iniciar sesión (${err.code || 'error desconocido'}). Intentá de nuevo.`
        );
      }
      setLoading(false);
    }
  };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const handleRegisterStore = () => {
    sessionStorage.setItem('lokal-register-intent', JSON.stringify({ intent: 'register-store', plan: 'mensual' }));
    handleGoogle();
  };

  const primaryCta = mode === 'tiendas' ? handleRegisterStore : handleGoogle;

  return (
    <div className="text-slate-900 dark:text-white min-h-screen overflow-x-hidden bg-white dark:bg-[#0B132B]">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 lg:px-10 py-4 backdrop-blur-md border-b border-slate-100 dark:border-white/5"
        style={{ background: isDark ? 'rgba(11,19,43,0.92)' : 'rgba(255,255,255,0.92)' }}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
          )}
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-2.5 shrink-0 no-press">
            <LogoFull size={26} />
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-2xl px-1.5 py-1.5 dark:bg-white/5 dark:border-white/10">
          <button onClick={() => scrollTo('como-funciona')} className="px-4 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5">Cómo funciona</button>
          <button onClick={() => scrollTo('beneficios')} className="px-4 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5">Beneficios</button>
          <button onClick={() => scrollTo('precios')} className="px-4 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5">Precios</button>
          <button onClick={() => scrollTo('faq')} className="px-4 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5">FAQ</button>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-2xl p-1 dark:bg-white/5 dark:border-white/10">
            <button
              onClick={() => setMode('usuarios')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'usuarios' ? 'bg-white text-slate-900 shadow dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              <Users className="w-3 h-3" /> Para vos
            </button>
            <button
              onClick={() => setMode('tiendas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'tiendas' ? 'bg-brand text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              <Store className="w-3 h-3" /> Tu tienda
            </button>
          </div>
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-sm shadow-lg disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon size={16} />}
            Iniciar sesión
          </button>
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon size={15} />}
            Entrar
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogin={handleGoogle}
        loading={loading}
        mode={mode}
        setMode={(m) => { setMode(m); setDrawerOpen(false); }}
        scrollTo={scrollTo}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-screen flex items-center pt-24 pb-16 px-5 lg:px-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-[70%] bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(0,184,217,0.12),transparent)]" />
          <div className="absolute top-1/4 -left-60 w-[500px] h-[500px] bg-brand/8 rounded-full blur-[130px]" />
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-brand/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="flex lg:hidden items-center bg-slate-100 border border-slate-200 rounded-2xl p-1 mb-7 w-fit dark:bg-white/5 dark:border-white/10">
              <button onClick={() => setMode('usuarios')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'usuarios' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 dark:text-slate-400'}`}><Users className="w-3.5 h-3.5" /> Para vos</button>
              <button onClick={() => setMode('tiendas')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'tiendas' ? 'bg-brand text-white shadow' : 'text-slate-500 dark:text-slate-400'}`}><Store className="w-3.5 h-3.5" /> Tu tienda</button>
            </div>

            <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 text-brand text-sm font-semibold px-4 py-2 rounded-full mb-7">
              <div className="w-2 h-2 bg-brand-light rounded-full animate-pulse" />
              {content.badge}
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-black leading-[1.0] tracking-tight mb-6">
              {content.headline.map((line, i) => (
                <span key={i}>
                  {line === content.highlightWord
                    ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">{line}</span>
                    : line
                  }
                  {i < content.headline.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">{content.sub}</p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <button
                onClick={primaryCta}
                disabled={loading}
                className="flex items-center gap-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-4 px-7 rounded-2xl transition-all shadow-xl hover:shadow-2xl disabled:opacity-60 active:scale-[0.98] text-base"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                {content.cta}
              </button>
              <button onClick={() => scrollTo('como-funciona')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-semibold transition-colors text-sm">
                Ver cómo funciona <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 text-sm mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-brand" /> {content.ctaNote}
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="transition-all duration-500">
              {mode === 'usuarios' ? <PhoneMockup /> : <StoreDashMockup />}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-14 px-5 border-y border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03]">
        <FadeUp>
          <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: u, suffix: '+', label: 'Usuarios activos' },
              { value: d, suffix: '+', label: 'Demandas publicadas' },
              { value: r, suffix: '%', label: 'Tasa de respuesta' },
              { value: t, suffix: '+', label: 'Tiendas registradas' },
            ].map(({ value, suffix, label }) => (
              <div key={label}>
                <p className="text-4xl sm:text-5xl font-black tabular-nums">{value.toLocaleString()}{suffix}</p>
                <p className="text-slate-500 text-sm mt-2 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* ── Cómo funciona ───────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-5 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-brand font-bold text-sm uppercase tracking-widest mb-3">Cómo funciona</p>
            <h2 className="text-4xl sm:text-5xl font-black">Tres pasos.<br className="sm:hidden" /> Eso es todo.</h2>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {content.steps.map(({ num, icon: Icon, title, desc }, i) => (
              <FadeUp key={num} delay={i * 80}>
                <div className="bg-slate-100 border border-slate-200 rounded-3xl p-8 hover:bg-slate-200/70 transition-all hover:-translate-y-1 group h-full dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-brand/20 rounded-2xl flex items-center justify-center group-hover:bg-brand/30 transition-colors">
                      <Icon className="w-7 h-7 text-brand" />
                    </div>
                    <span className="text-5xl font-black text-slate-200 dark:text-white/[0.06]">{num}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Beneficios ──────────────────────────────────────────────────────── */}
      <section id="beneficios" className="py-24 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.015]">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-brand font-bold text-sm uppercase tracking-widest mb-3">{mode === 'tiendas' ? 'Para tiendas' : 'Para compradores'}</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              {content.featuresTitle}<br />
              <span className="text-brand">{content.featuresAccent}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">{content.featuresSub}</p>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {content.features.map(({ icon: Icon, title, desc }, i) => (
              <FadeUp key={title} delay={i * 60}>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:bg-slate-50 hover:-translate-y-0.5 transition-all h-full dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/8">
                  <div className="w-10 h-10 bg-brand/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand" />
                  </div>
                  <h3 className="font-bold mb-2">{title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp className="text-center">
            <button onClick={primaryCta} disabled={loading}
              className="inline-flex items-center gap-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-4 px-8 rounded-2xl transition-all shadow-xl disabled:opacity-60">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              {content.cta}
            </button>
          </FadeUp>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5">
        <div className="max-w-2xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-brand font-bold text-sm uppercase tracking-widest mb-3">{content.testimonialLabel}</p>
            <h2 className="text-3xl sm:text-4xl font-black">Lo que la gente dice.</h2>
          </FadeUp>
          <FadeUp>
            <TestimonialsCarousel mode={mode} />
          </FadeUp>
        </div>
      </section>

      {/* ── Próximamente ────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.015]">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-brand font-bold text-sm uppercase tracking-widest mb-3">En construcción</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">Lo que viene.</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mx-auto">Estamos construyendo la plataforma para el comercio local de Argentina. Esto es solo el comienzo.</p>
          </FadeUp>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: MapPin,    label: 'Mapa de tiendas',      desc: 'Explorá comercios cercanos en un mapa interactivo.' },
              { icon: Heart,     label: 'Favoritos',            desc: 'Guardá tus tiendas y ofertas preferidas.' },
              { icon: Tag,       label: 'Vouchers y promos',    desc: 'Descuentos exclusivos para usuarios Lokal.' },
              { icon: BarChart2, label: 'Analytics avanzado',   desc: 'Estadísticas detalladas de alcance y conversión.' },
            ].map(({ icon: Icon, label, desc }) => (
              <FadeUp key={label}>
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 relative overflow-hidden h-full dark:bg-white/[0.03] dark:border-white/[0.07]">
                  <div className="absolute top-3 right-3 text-[10px] font-bold bg-amber-500/20 text-amber-500 dark:text-amber-400 px-2 py-0.5 rounded-full">Pronto</div>
                  <Icon className="w-6 h-6 text-slate-400 dark:text-slate-600 mb-3" />
                  <h3 className="font-bold text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</h3>
                  <p className="text-slate-400 dark:text-slate-600 text-xs leading-relaxed">{desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para tiendas — info de acceso ───────────────────────────────────── */}
      {mode === 'tiendas' && (
        <section className="py-16 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <div className="bg-brand/8 border border-brand/20 rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-14 h-14 bg-brand/15 rounded-2xl flex items-center justify-center shrink-0">
                  <Clock className="w-7 h-7 text-brand" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg mb-1">Acceso por invitación</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Para mantener la calidad de la red, el registro de tiendas es por link de invitación. Activá tu cuenta con el link que recibiste, o contactá al administrador de tu ciudad.
                  </p>
                </div>
                <button onClick={() => scrollTo('precios')}
                  className="flex items-center gap-2 bg-brand hover:bg-brand-light text-white font-bold px-6 py-3 rounded-2xl transition-all whitespace-nowrap text-sm shrink-0">
                  Ver planes <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </FadeUp>
          </div>
        </section>
      )}

      {/* ── Precios ─────────────────────────────────────────────────────────── */}
      <section id="precios" className="py-24 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-brand font-bold text-sm uppercase tracking-widest mb-3">Precios</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-3">Simple y transparente.</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-8">Sin sorpresas. Sin comisiones por venta.</p>
            <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-2xl p-1.5 dark:bg-white/5 dark:border-white/10">
              <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${!annual ? 'bg-white dark:bg-white text-slate-900 shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                Mensual
              </button>
              <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${annual ? 'bg-white dark:bg-white text-slate-900 shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                Anual <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full">-20%</span>
              </button>
            </div>
          </FadeUp>

          <div className={`grid grid-cols-1 gap-5 items-stretch ${
            mode === 'usuarios' ? 'sm:grid-cols-2 max-w-3xl mx-auto' : 'sm:grid-cols-3'
          }`}>
            {(mode === 'usuarios' ? PLANS_USUARIOS : PLANS_TIENDAS).map((plan, i) => (
              <FadeUp key={plan.id} delay={i * 80}>
                <PricingCard plan={plan} annual={annual} onLogin={handleGoogle} loading={loading} />
              </FadeUp>
            ))}
          </div>
          <p className="text-center text-slate-400 dark:text-slate-600 text-sm mt-8">
            {mode === 'usuarios'
              ? 'Usuario y Emprendimiento son gratis para siempre · Sin comisiones por venta'
              : 'Pagos procesados por MercadoPago · Pagá 1 mes, el segundo es gratis · Sin comisiones por venta'
            }
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.015]">
        <div className="max-w-2xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-brand font-bold text-sm uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-black">Preguntas frecuentes.</h2>
          </FadeUp>
          <FadeUp>
            <FAQAccordion />
          </FadeUp>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 border-t border-slate-100 dark:border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,rgba(0,184,217,0.08),transparent)] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center">
          <FadeUp>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              {mode === 'tiendas' ? 'Tu próximo cliente ya está buscando.' : 'Encontrá lo que buscás.'}<br />
              <span className="text-brand">Empezá hoy.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-10">
              {mode === 'tiendas'
                ? 'Unite a la red de comercios que ya están respondiendo demandas reales de clientes de su ciudad.'
                : 'Miles de compradores ya publican sus pedidos y reciben respuestas de tiendas locales en minutos.'
              }
            </p>
            <button
              onClick={primaryCta}
              disabled={loading}
              className="inline-flex items-center gap-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-4 px-10 rounded-2xl transition-all shadow-2xl text-lg disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon size={22} />}
              {content.cta}
            </button>
            {error && (
              <div className="flex items-center justify-center gap-2 text-rose-500 dark:text-rose-400 text-sm mt-4">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-5 max-w-sm mx-auto leading-relaxed">
              Al continuar aceptás los{' '}
              <button onClick={() => { window.history.pushState({}, '', '/terminos-y-condiciones'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="underline hover:text-slate-700 dark:hover:text-slate-300">
                Términos y Condiciones
              </button>, la{' '}
              <button onClick={() => { window.history.pushState({}, '', '/politica-de-privacidad'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="underline hover:text-slate-700 dark:hover:text-slate-300">
                Política de Privacidad
              </button>{mode === 'tiendas' ? ' y las ' : ' y las '}
              <button onClick={() => { window.history.pushState({}, '', '/condiciones-para-comercios'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="underline hover:text-slate-700 dark:hover:text-slate-300">
                Condiciones para Comercios
              </button>.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 dark:border-white/5 px-5 lg:px-10 pt-14 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-3">
                <LogoFull size={26} />
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                Publicás lo que buscás. Las tiendas de tu ciudad responden. El mercado local, al revés.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <a href="https://instagram.com/lokal.ar" target="_blank" rel="noopener" className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10">
                  <Instagram className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Plataforma</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Cómo funciona', id: 'como-funciona' },
                  { label: 'Para compradores', id: 'beneficios' },
                  { label: 'Para tiendas', id: 'beneficios' },
                  { label: 'Precios', id: 'precios' },
                  { label: 'FAQ', id: 'faq' },
                ].map(({ label, id }) => (
                  <button key={label} onClick={() => scrollTo(id)} className="block text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-sm transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Legal</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Términos y condiciones', path: '/terminos-y-condiciones' },
                  { label: 'Política de privacidad', path: '/politica-de-privacidad' },
                  { label: 'Condiciones para comercios', path: '/condiciones-para-comercios' },
                ].map(({ label, path }) => (
                  <button key={path}
                    onClick={() => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }}
                    className="block text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-sm transition-colors text-left">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">Acceso</p>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 px-4 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-sm disabled:opacity-60 mb-3"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon size={16} />}
                Iniciar sesión
              </button>
              <button
                onClick={handleRegisterStore}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-brand/10 border border-brand/20 text-brand font-bold py-3 px-4 rounded-xl hover:bg-brand/20 transition-all text-sm disabled:opacity-60"
              >
                <Store className="w-4 h-4" />
                Registrar tienda
              </button>
              {toggleTheme && (
                <div className="mt-4 flex items-center justify-between px-1">
                  <span className="text-xs text-slate-400">Modo {isDark ? 'oscuro' : 'claro'}</span>
                  <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-slate-400 dark:text-slate-600 text-xs text-center sm:text-left">
              © 2026 Lokal · Intermediador digital — no somos vendedor ni parte de las transacciones.
            </p>
            <a href="https://www.instagram.com/katriel.martinez" target="_blank" rel="noopener"
              className="flex items-center gap-1.5 text-slate-300 hover:text-slate-500 dark:text-white/20 dark:hover:text-white/50 transition-colors group no-press">
              <span className="text-[11px]">Creado por</span>
              <KtrlMark className="h-3 opacity-40 group-hover:opacity-80 transition-opacity" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
