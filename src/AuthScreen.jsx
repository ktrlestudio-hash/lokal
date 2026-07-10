import React, { useState, useEffect, useRef, useCallback } from 'react';

/* Tailwind safelist — fuerza generación de clases dark: */
/* dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:border-white/10 */
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform, useAnimation } from 'motion/react';
import {
  Store, MapPin, Package, Star, Loader2, AlertCircle, CheckCircle,
  ChevronDown, ChevronUp, Zap, Shield, Clock, TrendingUp, MessageSquare,
  ArrowRight, Users, ShoppingBag, Bell, X, Check, Menu, Send,
  BarChart2, Tag, Heart, ExternalLink, Instagram, UserCircle2,
  Sun, Moon, Sparkles, Plus, Minus, Smartphone, Car, Wrench,
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
// useInView local - usa IntersectionObserver nativo (más ligero que motion para casos simples)
function useInViewLocal(threshold = 0.2) {
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

// ── AnimatedCounter con Motion ────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const count = useCounter(target, duration * 1000, isInView);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      {prefix}{count.toLocaleString()}{suffix}
    </motion.span>
  );
}

// ── Feature Voting (con descripciones expandibles y botón funcional) ─────────
function FeatureVoting() {
  const [votes, setVotes] = useState({
    'Viajes compartidos': { count: 47, voted: false },
    'Servicios y changas': { count: 38, voted: false },
    'Notificaciones push': { count: 52, voted: false },
    'App nativa iOS/Android': { count: 89, voted: false },
  });
  const [expanded, setExpanded] = useState(null);

  const handleVote = (label, e) => {
    e.stopPropagation();
    setVotes(prev => ({
      ...prev,
      [label]: {
        count: prev[label].voted ? prev[label].count - 1 : prev[label].count + 1,
        voted: !prev[label].voted,
      }
    }));
  };

  const maxVotes = Math.max(...Object.values(votes).map(v => v.count));

  const FEATURES = [
    { 
      icon: Car, 
      label: 'Viajes compartidos', 
      desc: 'Ofrecé o buscá viajes dentro de tu ciudad. Ahorrá en nafta y conocé gente de tu zona.',
    },
    { 
      icon: Wrench, 
      label: 'Servicios y changas', 
      desc: 'Encontrá plomeros, electricistas, profesores o cualquier servicio local. O ofrecé el tuyo.',
    },
    { 
      icon: Bell, 
      label: 'Notificaciones push', 
      desc: 'Recibí alertas instantáneas cuando una tienda responde tu demanda o hay ofertas cerca.',
    },
    { 
      icon: Smartphone, 
      label: 'App nativa iOS/Android', 
      desc: 'Descargá LOKAL como app nativa. Más rápida, con acceso offline y notificaciones en tiempo real.',
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {FEATURES.map(({ icon: Icon, label, desc }, i) => {
          const voteData = votes[label];
          const hasVoted = voteData.voted;
          const isExpanded = expanded === label;
          return (
            <motion.div
              key={label}
              onClick={() => setExpanded(isExpanded ? null : label)}
              className={`relative bg-white dark:bg-[#0d1526]/60 border rounded-2xl p-4 overflow-hidden transition-colors cursor-pointer ${
                hasVoted 
                  ? 'border-brand/30 dark:border-brand/30' 
                  : 'border-slate-200/60 dark:border-white/[0.06]'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: 'spring' }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              layout
            >
              {/* Voted indicator */}
              {hasVoted && (
                <motion.div
                  className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand to-brand-light"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                />
              )}

              <div className="flex items-start gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  hasVoted ? 'bg-brand/10' : 'bg-slate-100 dark:bg-white/5'
                }`}>
                  <Icon className={`w-4 h-4 ${hasVoted ? 'text-brand' : 'text-slate-400 dark:text-slate-500'}`} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{label}</p>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="shrink-0"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </motion.div>
              </div>

              {/* Description: expandable — 2 líneas completas cuando está colapsado */}
              <AnimatePresence initial={false}>
                <motion.div
                  initial={false}
                  animate={{ height: isExpanded ? 'auto' : 32 }}
                  className="overflow-hidden"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    {desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress bar */}
              <div className="flex items-center gap-1.5 mt-2.5 mb-2.5">
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${hasVoted ? 'bg-brand' : 'bg-brand/40'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(voteData.count / (maxVotes + 20)) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 tabular-nums">{voteData.count}</span>
              </div>

              {/* Vote button */}
              <motion.button
                onClick={(e) => handleVote(label, e)}
                className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  hasVoted
                    ? 'bg-brand/10 text-brand border border-brand/20'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-transparent hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {hasVoted ? (
                  <span className="flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" /> Votado
                  </span>
                ) : (
                  'Votar'
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      <FadeUp delay={200} className="text-center mt-6">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Los votos son anónimos y nos ayudan a decidir qué construir primero.
        </p>
      </FadeUp>

      <SuggestionBox />
    </>
  );
}

// ── Pricing Features List (colapsable en mobile) ──────────────────────────────
function PricingFeaturesList({ features, light }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      {/* Mobile: colapsable — solo descripción + botón expandir */}
      <div className="sm:hidden">
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className={`w-full flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-xl transition-colors ${
              light 
                ? 'text-white/70 bg-white/10 hover:bg-white/20' 
                : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            <span>Ver {features.length} características</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <PC_List>
              {features.map(f => (
                <PC_ListItem key={f} light={light}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${light ? 'bg-white/20' : 'bg-brand/15 dark:bg-brand/20'}`}>
                    <Check className={`w-2.5 h-2.5 ${light ? 'text-white' : 'text-brand'}`} strokeWidth={3} />
                  </div>
                  {f}
                </PC_ListItem>
              ))}
            </PC_List>
            <button
              onClick={() => setExpanded(false)}
              className="mt-2 text-xs font-bold text-brand flex items-center gap-1"
            >
              Ver menos
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Desktop: siempre expandido */}
      <div className="hidden sm:block">
        <PC_List>
          {features.map(f => (
            <PC_ListItem key={f} light={light}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${light ? 'bg-white/20' : 'bg-brand/15 dark:bg-brand/20'}`}>
                <Check className={`w-2.5 h-2.5 ${light ? 'text-white' : 'text-brand'}`} strokeWidth={3} />
              </div>
              {f}
            </PC_ListItem>
          ))}
        </PC_List>
      </div>
    </div>
  );
}

// ── Suggestion Box (layout ultra compacto) ────────────────────────────────────
function SuggestionBox() {
  const [suggestion, setSuggestion] = useState('');
  const [relatedFeature, setRelatedFeature] = useState('');
  const [showFeatureMenu, setShowFeatureMenu] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const menuRef = useRef(null);

  const FEATURE_OPTIONS = [
    { value: 'viajes', label: 'Viajes', icon: Car },
    { value: 'servicios', label: 'Servicios', icon: Wrench },
    { value: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { value: 'app', label: 'App nativa', icon: Smartphone },
    { value: 'general', label: 'General', icon: MessageSquare },
  ];

  const selected = FEATURE_OPTIONS.find(o => o.value === relatedFeature);

  useEffect(() => {
    const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowFeatureMenu(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = () => {
    if (!suggestion.trim()) return;
    console.log('Sugerencia:', { text: suggestion, relatedTo: selected?.label || 'General' });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSuggestion('');
      setRelatedFeature('');
    }, 3000);
  };

  return (
    <motion.div
      className="mt-10 bg-white dark:bg-[#0d1526]/40 border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-brand" />
        <p className="font-bold text-sm text-slate-900 dark:text-white">¿Tenés una sugerencia?</p>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
        Dejala acá. La leemos todas.
      </p>

      {submitted ? (
        <motion.div
          className="flex items-center gap-2 py-2 text-brand text-sm font-bold"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Check className="w-4 h-4" />
          ¡Gracias! Tu sugerencia fue enviada.
        </motion.div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Fila 1: Input + botón selector cuadrado */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Escribí tu idea..."
              className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/30 transition-all h-9"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            
            {/* Selector cuadrado con icono */}
            <div ref={menuRef} className="relative">
              <motion.button
                onClick={() => setShowFeatureMenu(!showFeatureMenu)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${
                  selected
                    ? 'bg-brand/10 border-brand/20 text-brand'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-400 hover:text-slate-600'
                }`}
                whileTap={{ scale: 0.9 }}
                title={selected ? selected.label : 'Relacionado con...'}
              >
                {selected ? <selected.icon className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
              </motion.button>

              <AnimatePresence>
                {showFeatureMenu && (
                  <motion.div
                    className="absolute right-0 bottom-11 z-30 bg-white dark:bg-[#0d1526] border border-slate-200/60 dark:border-white/10 rounded-xl shadow-xl overflow-hidden w-48"
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    {FEATURE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setRelatedFeature(opt.value); setShowFeatureMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 ${
                          relatedFeature === opt.value
                            ? 'bg-brand/10 text-brand font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                          relatedFeature === opt.value ? 'bg-brand/15' : 'bg-slate-100 dark:bg-white/5'
                        }`}>
                          <opt.icon className={`w-3 h-3 ${relatedFeature === opt.value ? 'text-brand' : 'text-slate-400'}`} />
                        </div>
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botón enviar cuadrado en mobile, rectangular en desktop */}
            <motion.button
              onClick={handleSubmit}
              disabled={!suggestion.trim()}
              className="w-9 h-9 sm:w-auto sm:px-4 flex items-center justify-center bg-brand hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
              whileTap={{ scale: 0.9 }}
            >
              <Send className="w-4 h-4 sm:w-3 sm:h-3" />
              <span className="hidden sm:inline ml-1.5 text-xs font-bold">Enviar</span>
            </motion.button>
          </div>

          {/* Label del seleccionado */}
          {selected && (
            <motion.div
              className="flex items-center gap-1.5 text-[10px] text-brand font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <selected.icon className="w-3 h-3" />
              Relacionado con: {selected.label}
              <button onClick={() => setRelatedFeature('')} className="text-slate-400 hover:text-slate-600 ml-1">
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Hero Mode Toggle (animado, alterna automáticamente) ───────────────────────
function HeroModeToggle() {
  const [activeMode, setActiveMode] = useState('usuarios');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMode(prev => prev === 'usuarios' ? 'tiendas' : 'usuarios');
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="relative inline-flex items-center gap-1 bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl p-1 mb-6"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
    >
      {/* Sliding pill background */}
      <motion.div
        className="absolute top-1 bottom-1 bg-white dark:bg-brand rounded-xl shadow-sm"
        style={{ width: 'calc(50% - 4px)' }}
        animate={{
          x: activeMode === 'tiendas' ? 'calc(100% + 4px)' : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      
      <button
        onClick={() => setActiveMode('usuarios')}
        className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
          activeMode === 'usuarios' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Users className="w-3 h-3" />
        Para vos
      </button>
      <button
        onClick={() => setActiveMode('tiendas')}
        className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
          activeMode === 'tiendas' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Store className="w-3 h-3" />
        Tu tienda
      </button>
    </motion.div>
  );
}

// ── FadeUp wrapper ────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInViewLocal(0.12);
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

// ── Function Accordion ────────────────────────────────────────────────────────
function FunctionAccordion({ icon: Icon, title, desc, color }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className="bg-white dark:bg-[#0d1526]/60 border border-slate-200/60 dark:border-white/[0.06] rounded-2xl overflow-hidden"
      layout
    >
      <motion.button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <span className="flex-1 font-bold text-sm text-slate-900 dark:text-white">{title}</span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Plus className="w-4 h-4 text-slate-400" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="px-4 pb-4 pl-[3.75rem]">
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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

function TestimonialCard({ t, i }) {
  return (
    <div className="bg-slate-100 border border-slate-200 rounded-3xl p-7 w-[340px] shrink-0 dark:bg-white/5 dark:border-white/10">
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
  );
}

function TestimonialsCarousel({ mode }) {
  const items = TESTIMONIALS[mode];

  return (
    <>
      {/* Mobile: Grid de 2 columnas scrollable horizontal con snap */}
      <div className="sm:hidden overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide snap-x snap-mandatory">
        <div className="flex gap-3 w-max">
          {items.map((t, i) => (
            <motion.div
              key={`${mode}-m-${i}`}
              className="snap-start w-[260px] shrink-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <TestimonialCard t={t} i={i} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Desktop: Carrusel infinito automático */}
      <div className="hidden sm:block overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_8%,white_92%,transparent)]">
        <TestimonialsInfinite mode={mode} items={items} />
      </div>
    </>
  );
}

function TestimonialsInfinite({ mode, items }) {
  const scrollerRef = useRef(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);
      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        scrollerRef.current?.appendChild(duplicatedItem);
      });
      setStart(true);
    }
  }, [mode]);

  return (
    <div
      ref={scrollerRef}
      className={`flex w-max gap-4 ${start ? 'animate-scroll-infinite' : ''} hover:[animation-play-state:paused]`}
      style={{ animationDuration: '35s' }}
    >
      {items.map((t, i) => (
        <motion.div
          key={`${mode}-${i}`}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <TestimonialCard t={t} i={i} />
        </motion.div>
      ))}
    </div>
  );
}

// ── FAQ Accordion (MEJORADO con Motion + shadcn/ui style) ────────────────────
const FAQ_ITEMS = [
  { q: '¿Es completamente gratis para usuarios?', a: 'Sí. Publicar demandas, recibir respuestas y chatear con tiendas es 100% gratuito para compradores. Sin tarjeta, sin límite de consultas.' },
  { q: '¿Cómo se verifican las tiendas?', a: 'Las tiendas acceden mediante link de invitación y se registran con cuenta Google. El equipo de Lokal revisa cada perfil antes de habilitarlo. Las tiendas con rating bajo o reclamos reiterados pueden ser suspendidas.' },
  { q: '¿Cuánto cuesta registrar mi tienda?', a: 'El plan mensual es $4.990 ARS/mes con 1 mes de regalo al activar. El plan anual sale $47.900 ARS/año (equivalente a $3.992/mes). Sin comisiones por venta, precio fijo.' },
  { q: '¿En qué ciudades está disponible?', a: 'Actualmente en fase de lanzamiento con cobertura nacional en Argentina. El feed filtra automáticamente las demandas de tu zona. Pronto incorporamos mapa interactivo de tiendas.' },
  { q: '¿Puedo cancelar mi suscripción?', a: 'Sí, cuando quieras desde tu panel. El acceso sigue activo hasta que venza el período pagado, sin cobros adicionales ni penalidades.' },
  { q: '¿Lokal garantiza que voy a vender?', a: 'No somos vendedores ni intermediarios en las transacciones. Ponemos el puente entre compradores con intención real y tiendas con lo que buscan. Los resultados dependen de cada comercio.' },
];

function FAQAccordion() {
  const [openItem, setOpenItem] = useState(null);
  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
          <motion.button
            onClick={() => setOpenItem(openItem === String(i) ? null : String(i))}
            className="no-press w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            whileTap={{ scale: 0.995 }}
          >
            <span className="font-semibold text-slate-900 dark:text-white text-sm pr-4">{item.q}</span>
            <motion.div
              animate={{ rotate: openItem === String(i) ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <ChevronDown
                className={`w-4 h-4 shrink-0 ${openItem === String(i) ? 'text-brand' : 'text-slate-400'}`}
              />
            </motion.div>
          </motion.button>
          <AnimatePresence initial={false}>
            {openItem === String(i) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                  transition: {
                    height: { type: 'spring', stiffness: 400, damping: 30 },
                    opacity: { duration: 0.2, delay: 0.05 },
                  },
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                  transition: {
                    height: { type: 'spring', stiffness: 400, damping: 30 },
                    opacity: { duration: 0.15 },
                  },
                }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-white/5 pt-4">
                  {item.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

// ── Primitivos inspirados en 21st.dev pricing-card ───────────────────────────
function PC_Card({ children, highlight = false, className = '' }) {
  return (
    <div className={`
      relative w-full rounded-2xl p-1.5
      shadow-xl backdrop-blur-xl border
      ${highlight
        ? 'bg-[#0B132B] dark:bg-[#060d1a] border-brand/40 shadow-brand/15'
        : 'bg-white dark:bg-[#0d1526] border-slate-200/80 dark:border-white/10'
      } ${className}
    `}>
      {children}
    </div>
  );
}

function PC_Header({ children, className = '' }) {
  return (
    <div className={`relative rounded-xl border p-4 mb-3
      bg-slate-50/80 dark:bg-white/5
      border-slate-200/60 dark:border-white/8 ${className}`}>
      {/* Glass sheen */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-48 rounded-[inherit] pointer-events-none"
        style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.03) 40%,transparent 100%)' }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function PC_HeaderDark({ children, gradient = 'from-brand to-brand-dark', className = '' }) {
  return (
    <div className={`relative rounded-xl border border-white/10 p-4 mb-3 bg-gradient-to-br ${gradient} overflow-hidden ${className}`}>
      <div aria-hidden className="absolute inset-x-0 top-0 h-48 rounded-[inherit] pointer-events-none"
        style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0.03) 40%,transparent 100%)' }} />
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function PC_Plan({ children }) {
  return <div className="mb-4 flex items-center justify-between">{children}</div>;
}

function PC_PlanName({ children, light = false }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-semibold [&>svg]:w-4 [&>svg]:h-4
      ${light ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
      {children}
    </div>
  );
}

function PC_Badge({ children, light = false }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold
      ${light
        ? 'border-white/25 text-white/80 bg-white/10'
        : 'border-brand/30 text-brand dark:text-brand bg-brand/8 dark:bg-brand/10'
      }`}>
      {children}
    </span>
  );
}

function PC_Price({ children }) {
  return <div className="mb-3 flex items-end gap-1">{children}</div>;
}

function PC_MainPrice({ children, light = false }) {
  return (
    <span className={`text-3xl font-extrabold tracking-tight
      ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
      {children}
    </span>
  );
}

function PC_Period({ children, light = false }) {
  return (
    <span className={`pb-1 text-sm ${light ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'}`}>
      {children}
    </span>
  );
}

function PC_OriginalPrice({ children, light = false }) {
  return (
    <span className={`ml-auto text-base line-through pb-1
      ${light ? 'text-white/55' : 'text-slate-400 dark:text-slate-500'}`}>
      {children}
    </span>
  );
}

function PC_Body({ children }) {
  return <div className="space-y-5 p-3">{children}</div>;
}

function PC_Description({ children, light = false }) {
  return (
    <p className={`text-xs leading-relaxed ${light ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'}`}>
      {children}
    </p>
  );
}

function PC_List({ children }) {
  return <ul className="space-y-2.5">{children}</ul>;
}

function PC_ListItem({ children, light = false }) {
  return (
    <li className={`flex items-start gap-2.5 text-sm
      ${light ? 'text-white/75' : 'text-slate-600 dark:text-slate-300'}`}>
      {children}
    </li>
  );
}

function PC_Separator({ children = 'Incluye también', light = false }) {
  const c = light ? 'text-white/40' : 'text-slate-400 dark:text-slate-500';
  const l = light ? 'bg-white/15' : 'bg-slate-200 dark:bg-white/10';
  return (
    <div className={`flex items-center gap-3 text-xs ${c}`}>
      <span className={`h-px flex-1 ${l}`} />
      <span className="shrink-0 font-medium">{children}</span>
      <span className={`h-px flex-1 ${l}`} />
    </div>
  );
}

// ── PricingCard principal ─────────────────────────────────────────────────────
function PricingCard({ plan, annual, onLogin, loadingPlan, anyLoading }) {
  const price     = annual ? plan.price.annual : plan.price.monthly;
  const light     = plan.highlight;
  const isPremium = plan.planKey === 'premium';
  const gradient  = isPremium ? 'from-amber-500 to-amber-700' : 'from-brand to-brand-dark';
  const loading   = loadingPlan === plan.id; // spinner solo en esta card

  const handleCta = () => {
    if (plan.role === 'empresa') {
      sessionStorage.setItem('lokal-register-intent', JSON.stringify({
        intent: 'register-store',
        plan: annual ? 'anual' : 'mensual',
        empresaPlan: plan.planKey || 'basico',
      }));
    } else if (plan.role === 'emprendimiento') {
      sessionStorage.setItem('lokal-register-intent', JSON.stringify({
        intent: 'register-emprendimiento',
        role: 'emprendimiento',
      }));
    } else {
      sessionStorage.setItem('lokal-register-intent', JSON.stringify({
        intent: 'register-user',
        role: 'usuario',
      }));
    }
    onLogin(plan.id);
  };

  return (
    <PC_Card highlight={light} className={`flex flex-col h-full transition-transform duration-200 ${light ? 'scale-[1.02]' : 'hover:scale-[1.005]'}`}>
      {light ? (
        <PC_HeaderDark gradient={gradient}>
          <PC_Plan>
            <PC_PlanName light>
              {plan.name}
            </PC_PlanName>
            {plan.tag && <PC_Badge light>{plan.tag}</PC_Badge>}
          </PC_Plan>
          <PC_Price>
            {price === 0
              ? <PC_MainPrice light>Gratis</PC_MainPrice>
              : <>
                  <PC_MainPrice light>${price.toLocaleString()}</PC_MainPrice>
                  <PC_Period light>/mes</PC_Period>
                  {annual && plan.annualTotal && (
                    <PC_OriginalPrice light>${Math.round(plan.annualTotal / 10).toLocaleString()}</PC_OriginalPrice>
                  )}
                </>
            }
          </PC_Price>
          {annual && plan.annualTotal && price > 0 && (
            <p className="text-[11px] text-white/60 -mt-2 mb-3">
              Facturado ${plan.annualTotal.toLocaleString()}/año
            </p>
          )}
          <button onClick={handleCta} disabled={anyLoading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-white text-slate-900 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {plan.cta}
          </button>
        </PC_HeaderDark>
      ) : (
        <PC_Header>
          <PC_Plan>
            <PC_PlanName>{plan.name}</PC_PlanName>
            {plan.tag && <PC_Badge>{plan.tag}</PC_Badge>}
          </PC_Plan>
          <PC_Price>
            {price === 0
              ? <PC_MainPrice>Gratis</PC_MainPrice>
              : <>
                  <PC_MainPrice>${price.toLocaleString()}</PC_MainPrice>
                  <PC_Period>/mes</PC_Period>
                </>
            }
          </PC_Price>
          {annual && plan.annualTotal && price > 0 && (
            <p className="text-[11px] text-brand -mt-2 mb-3">
              Facturado ${plan.annualTotal.toLocaleString()}/año
            </p>
          )}
          <button onClick={handleCta} disabled={anyLoading}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {plan.cta}
          </button>
        </PC_Header>
      )}

      <PC_Body>
        <PC_Description light={light}>{plan.desc}</PC_Description>
        <PricingFeaturesList features={plan.features} light={light} />
      </PC_Body>
    </PC_Card>
  );
}

// ── Theme Toggle button ───────────────────────────────────────────────────────
// ── Estilos de botón Google — módulo level para uso en todos los componentes ──
const BTN_GOOGLE_ADAPTIVE = [
  'flex items-center gap-2 font-bold transition-all disabled:opacity-50',
  'bg-slate-950 dark:!bg-white',
  'border border-slate-700/60 dark:border-white/20',
  'ring-1 ring-inset ring-white/8 dark:ring-black/5',
  'text-white dark:text-slate-900',
  'shadow-md shadow-black/20 dark:shadow-black/10',
  'hover:bg-slate-800 dark:hover:bg-slate-50',
].join(' ');

const BTN_GOOGLE_ON_DARK = [
  'flex items-center gap-2 font-bold transition-all disabled:opacity-50',
  'bg-white hover:bg-slate-50',
  'border border-slate-200/80',
  'shadow-lg shadow-black/15',
  'text-slate-900',
].join(' ');

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
function MobileDrawer({ open, onClose, onLogin, loading, anyLoading, mode, setMode, scrollTo, isDark, toggleTheme }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white dark:bg-[#0B132B] border-l border-slate-200 dark:border-white/10 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
              <LogoFull size={24} />
              <div className="flex items-center gap-1">
                <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
                <motion.button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-slate-400" />
                </motion.button>
              </div>
            </div>

            <div className="px-6 pt-5 pb-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Explorar como</p>
              <div className="flex flex-col gap-2">
                <motion.button
                  onClick={() => setMode('usuarios')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${mode === 'usuarios' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'}`}
                  whileTap={{ scale: 0.98 }}
                >
                  <Users className="w-4 h-4 shrink-0" /> Para compradores
                </motion.button>
                <motion.button
                  onClick={() => setMode('tiendas')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${mode === 'tiendas' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'}`}
                  whileTap={{ scale: 0.98 }}
                >
                  <Store className="w-4 h-4 shrink-0" /> Para tiendas
                </motion.button>
              </div>
            </div>

            <nav className="flex-1 px-6 pt-4 space-y-1">
              {[
                { label: 'Cómo funciona', id: 'como-funciona' },
                { label: 'Precios', id: 'precios' },
                { label: 'Preguntas frecuentes', id: 'faq' },
              ].map(({ label, id }, i) => (
                <motion.button
                  key={id}
                  onClick={() => { scrollTo(id); onClose(); }}
                  className="w-full text-left px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 rounded-xl transition-colors font-medium text-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                  whileHover={{ x: 4 }}
                >
                  {label}
                </motion.button>
              ))}
            </nav>

            <div className="px-6 pb-8 pt-4 border-t border-slate-100 dark:border-white/5">
              <motion.button
                onClick={() => { onLogin(); onClose(); }}
                disabled={anyLoading}
                className={`${BTN_GOOGLE_ADAPTIVE} w-full justify-center gap-3 py-4 px-6 rounded-2xl`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon size={18} />}
                Entrar con Google
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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

// ── MapCard con tilt ─────────────────────────────────────────────────────────
// Grilla: horizontales y=22,48,74 — verticales x=25,48,72
// User en intersección (48,48)
// viewBox 400x300 — ratio 4:3 igual a la card
const USER_POS = { x: 200, y: 150 };

// Pines en intersecciones exactas grilla 25×25 — viewBox 400×300
// top = gy/300*100  |  left = gx/400*100
const MAP_PINS = [
  { gx:  75, gy:  75, top: '25%',    left: '18.75%', color: '#22C55E', initial: 'T', label: 'TecnoStore', delay: 0   },
  { gx: 300, gy:  75, top: '25%',    left: '75%',    color: '#00B8D9', initial: 'F', label: 'Ferretería', delay: 0.3 },
  { gx: 275, gy: 175, top: '58.33%', left: '68.75%', color: '#8B5CF6', initial: 'M', label: 'Moda',       delay: 0.6 },
  { gx: 100, gy: 200, top: '66.67%', left: '25%',    color: '#F59E0B', initial: 'V', label: 'Verdulería', delay: 0.9 },
];

function routePath(pin) {
  const { x: ux, y: uy } = USER_POS;
  return `M ${ux} ${uy} L ${pin.gx} ${uy} L ${pin.gx} ${pin.gy}`;
}

function MapCard({ isDark }) {
  const ref = useRef(null);
  const [activePin, setActivePin] = useState(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-60, 60], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-60, 60], [-6, 6]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <motion.div
      className="relative order-2 lg:order-1"
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 150 }}
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={ref}
        className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl select-none"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', userSelect: 'none', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,184,217,0.18), transparent), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(0,184,217,0.08), transparent)' }}
      >
        {/* Grilla SVG */}
        {/*
          GRILLA: viewBox 400×300, celdas 50×50
          Verticales:   x = 50,100,150,200(centro),250,300,350
          Horizontales: y = 50,100,150(centro),200,250
          Intersección central: (200,150)
        */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
          {/* Grilla fina — celdas 25×25 */}
          {Array.from({length:15}, (_,i) => (i+1)*25).map(x => (
            x !== 200 && <line key={`v${x}`} x1={x} y1="0" x2={x} y2="300"
              stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="0.5" />
          ))}
          {Array.from({length:11}, (_,i) => (i+1)*25).map(y => (
            y !== 150 && <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y}
              stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="0.5" />
          ))}
          {/* Avenidas principales animadas — pasan exactamente por (200,150) */}
          <motion.line x1="0" y1="150" x2="400" y2="150" stroke={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'} strokeWidth="1.2"
            initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} />
          <motion.line x1="200" y1="0" x2="200" y2="300" stroke={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'} strokeWidth="1.2"
            initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }} />
          {/* Ruta animada al pin seleccionado */}
          <AnimatePresence>
            {activePin && (
              <motion.path
                key={activePin.label}
                d={routePath(activePin)}
                fill="none"
                stroke={activePin.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            )}
          </AnimatePresence>
        </svg>
        {/* Glow brand */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 50% at 48% 46%, rgba(0,184,217,0.20), transparent)' }} />
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: isDark
            ? 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 35%, rgba(8,13,28,0.9) 100%)'
            : 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 35%, rgba(237,242,248,0.9) 100%)',
        }} />
        {/* Pin usuario — centrado con flex para evitar desvíos de translate */}
        <motion.div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2, type: 'spring' }}>
          <div className="relative flex items-center justify-center w-10 h-10">
            {/* Onda 1 */}
            <motion.div className="absolute rounded-full bg-brand/30"
              animate={{ width: ['14px','70px'], height: ['14px','70px'], opacity: [0.7, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: [0.2, 0.6, 0.4, 1], repeatDelay: 0.4 }} />
            {/* Onda 2 — desfasada */}
            <motion.div className="absolute rounded-full bg-brand/20"
              animate={{ width: ['14px','70px'], height: ['14px','70px'], opacity: [0.5, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: [0.2, 0.6, 0.4, 1], delay: 1.2, repeatDelay: 0.4 }} />
            {/* Punto central con halo */}
            <div className="relative z-10 w-4 h-4 rounded-full bg-brand shadow-[0_0_0_3px_rgba(0,184,217,0.25),0_0_12px_rgba(0,184,217,0.5)]" />
          </div>
        </motion.div>
        {/* Store pins */}
        {MAP_PINS.map((pin) => (
          <motion.div key={pin.label} className="absolute z-10 cursor-pointer" style={{ top: pin.top, left: pin.left, marginTop: '-16px', marginLeft: '-16px' }}
            initial={{ scale: 0, y: 10 }} whileInView={{ scale: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.5 + pin.delay, type: 'spring' }}
            onClick={() => setActivePin(p => p?.label === pin.label ? null : pin)}>
            <motion.div className="relative flex flex-col items-center"
              animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: pin.delay }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-extrabold border-[3px] border-white dark:border-[#0d111e] shadow-lg"
                style={{ backgroundColor: pin.color, boxShadow: '0 2px 14px rgba(0,0,0,.28), 0 0 0 1.5px rgba(0,184,217,.5)' }}>
                {pin.initial}
              </div>
              <div className="mt-1.5 whitespace-nowrap bg-white dark:bg-[#1a2332] text-slate-700 dark:text-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md border border-slate-200/50 dark:border-white/10">
                {pin.label}
              </div>
            </motion.div>
          </motion.div>
        ))}
        {/* Barra búsqueda */}
        <div className="absolute top-3 left-3 right-3 z-20">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl shadow-lg"
            style={{ background: isDark ? 'rgba(15,22,40,0.6)' : 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.6)' }}
          >
            <MapPin className="w-3 h-3 text-brand shrink-0" />
            <span className="text-[11px] font-semibold" style={{ color: isDark ? 'rgba(226,232,240,0.9)' : '#475569' }}>Bovril, Entre Ríos</span>
          </div>
        </div>
        {/* Bottom info */}
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl shadow-lg"
            style={{ background: isDark ? 'rgba(15,22,40,0.6)' : 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.6)' }}
          >
            <div className="w-6 h-6 bg-brand/15 rounded-lg flex items-center justify-center shrink-0">
              <Store className="w-3.5 h-3.5 text-brand" />
            </div>
            <div>
              <p className="text-[11px] font-bold leading-none" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>4 tiendas cerca</p>
              <p className="text-[9px] mt-0.5" style={{ color: isDark ? 'rgba(148,163,184,0.8)' : '#94a3b8' }}>Bovril, Entre Ríos</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Testimonios ───────────────────────────────────────────────────────────────
const TESTIMONIOS = [
  { name: 'Lucía Fernández', role: 'Compradora frecuente', stars: 5, avatar: 'https://randomuser.me/api/portraits/women/44.jpg', text: 'Encontré exactamente lo que buscaba en dos minutos. Nunca pensé que una app local pudiera ser tan rápida y fácil.' },
  { name: 'Marcos Giménez', role: 'Emprendedor, Bovril', stars: 5, avatar: 'https://randomuser.me/api/portraits/men/32.jpg', text: 'En la primera semana ya tenía tres consultas nuevas. La app me conectó con clientes que ni sabían que existía mi negocio.' },
  { name: 'Romina Acosta', role: 'Mamá y compradora', stars: 5, avatar: 'https://randomuser.me/api/portraits/women/68.jpg', text: 'Me ahorra el viaje al centro. Busco lo que necesito, mando el mensaje y me lo traen. Así de simple.' },
  { name: 'Sebastián Torres', role: 'Ferretería Don Pedro', stars: 5, avatar: 'https://randomuser.me/api/portraits/men/75.jpg', text: 'Mis clientes me mandan mensaje desde la app y ya saben mis precios. Me simplificó un montón el día a día.' },
  { name: 'Valentina Cruz', role: 'Compradora', stars: 5, avatar: 'https://randomuser.me/api/portraits/women/12.jpg', text: 'Lo que más me gustó es ver si la tienda está abierta antes de ir. Nada peor que ir y encontrar la puerta cerrada.' },
  { name: 'Diego Morales', role: 'Almacén La Esquina', stars: 5, avatar: 'https://randomuser.me/api/portraits/men/54.jpg', text: 'La gente del barrio me encontró sin que yo hiciera publicidad. Solo cargué mis productos y empezaron a llegar consultas.' },
  { name: 'Florencia Ríos', role: 'Diseñadora independiente', stars: 5, avatar: 'https://randomuser.me/api/portraits/women/23.jpg', text: 'Publiqué mis servicios y en días me contactaron dos clientes nuevos de la ciudad. LOKAL funciona de verdad.' },
  { name: 'Nahuel Sosa', role: 'Comprador habitual', stars: 4, avatar: 'https://randomuser.me/api/portraits/men/18.jpg', text: 'La función de demandas es genial. Publiqué que buscaba repuestos y me respondieron tres tiendas en horas.' },
];

const row1 = TESTIMONIOS.slice(0, 4);
const row2 = TESTIMONIOS.slice(4, 8);

function TestimonialCardV2({ t }) {
  return (
    <div className="w-72 shrink-0 rounded-2xl border border-slate-200/70 dark:border-white/8 bg-white dark:bg-white/[0.04] p-5 shadow-sm select-none">
      {/* Estrellas */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className={`w-3.5 h-3.5 ${i < t.stars ? 'text-amber-400' : 'text-slate-200 dark:text-white/10'}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      {/* Texto */}
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">"{t.text}"</p>
      {/* Avatar + nombre */}
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-white/10" />
          <motion.div className="absolute inset-0 rounded-full ring-2 ring-brand/40"
            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', repeatDelay: 1 }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-900 dark:text-white leading-none">{t.name}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

const CARD_W = 288;
const GAP_W  = 16;

function TestimonialRow({ items, direction = 1, duration = 32 }) {
  const x        = useMotionValue(0);
  const controls = useAnimation();
  const paused   = useRef(false);
  const doubled  = [...items, ...items];
  // totalW = ancho real de una copia: N cards + N gaps (el gap después del último
  // existe porque el siguiente elemento —de la segunda copia— está pegado)
  const totalW   = items.length * (CARD_W + GAP_W);
  const origin   = direction > 0 ? 0 : -totalW;
  const target   = direction > 0 ? -totalW : 0;

  const startFrom = useCallback((from) => {
    const remaining = Math.abs(target - from) / totalW;
    controls.start({
      x: target,
      transition: { duration: duration * remaining, ease: 'linear' },
    }).then(() => {
      if (paused.current) return;   // detenido manualmente — no resetear
      x.set(origin);
      startFrom(origin);
    });
  }, [controls, totalW, duration, origin, target]);

  useEffect(() => { x.set(origin); startFrom(origin); }, []);

  return (
    <div
      className="overflow-hidden w-full cursor-grab active:cursor-grabbing"
      onMouseEnter={() => { paused.current = true;  controls.stop(); }}
      onMouseLeave={() => { paused.current = false; startFrom(x.get()); }}
    >
      <motion.div
        className="flex"
        style={{ x, gap: GAP_W, width: doubled.length * (CARD_W + GAP_W) }}
        drag="x"
        dragConstraints={{ left: -totalW, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => { paused.current = true;  controls.stop(); }}
        onDragEnd={()   => { paused.current = false; startFrom(x.get()); }}
        animate={controls}
      >
        {doubled.map((t, i) => <TestimonialCardV2 key={i} t={t} />)}
      </motion.div>
    </div>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-16 border-t border-slate-100 dark:border-white/5 overflow-hidden">
      <div className="max-w-5xl mx-auto px-5 lg:px-10 mb-10 text-center flex flex-col items-center">
        <FadeUp>
          <div className="inline-flex items-center gap-2 bg-amber-500/8 border border-amber-500/15 text-amber-500 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Lo que dicen los compradores
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-2">Lo que la gente dice.</h2>
          <p className="text-slate-500 dark:text-slate-400">Compradores y tiendas de toda la región.</p>
        </FadeUp>
      </div>
      <div className="flex flex-col gap-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <TestimonialRow items={row1} direction={1} duration={35} />
        <TestimonialRow items={row2} direction={-1} duration={40} />
      </div>
    </section>
  );
}

export default function AuthScreen({ isDark: isDarkProp, toggleTheme, onBack }) {
  // Si isDark no viene como prop (landing abierta sola), detectar del sistema
  const isDark = isDarkProp ?? (typeof window !== 'undefined' 
    ? localStorage.getItem('lokal-theme') === 'dark' || 
      (!localStorage.getItem('lokal-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    : false);
  const [loading, setLoading]         = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const anyLoading = loading || loadingPlan !== null; // cualquier flujo activo
  const [error, setError]           = useState(null);
  const [annual, setAnnual]   = useState(false);
  const [mode, setMode]       = useState('usuarios');
  const [drawerOpen, setDrawerOpen] = useState(false);


  const [statsRef, statsInView] = useInViewLocal(0.3);
  const u = useCounter(1240, 1800, statsInView);
  const d = useCounter(8430, 2000, statsInView);
  const r = useCounter(94,   1600, statsInView);
  const t = useCounter(215,  1900, statsInView);

  const content = CONTENT[mode];

  const handleGoogle = async (planId = null) => {
    if (!planId) setLoading(true);
    setLoadingPlan(planId);
    setError(null);

    const reset = () => { setLoading(false); setLoadingPlan(null); };

    try {
      const user = await signInWithGoogle();
      if (user === null) { reset(); return; } // redirect mobile
      reset();
    } catch (err) {
      if (err.code === 'popup-closed') {
        reset(); return; // usuario cerró el popup — sin mensaje de error
      }
      if (err.code === 'auth/unauthorized-domain') {
        setError('Dominio no autorizado. Agregá este dominio en Firebase Console → Authentication → Authorized domains.');
      } else {
        setError(`No se pudo iniciar sesión (${err.code || 'error'}). Intentá de nuevo.`);
      }
      reset();
    }
  };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const handleRegisterStore = () => {
    sessionStorage.setItem('lokal-register-intent', JSON.stringify({ intent: 'register-store', plan: 'mensual' }));
    handleGoogle();
  };

  const primaryCta = mode === 'tiendas' ? handleRegisterStore : handleGoogle;

  return (
    <div className={`text-slate-900 dark:text-white min-h-screen overflow-x-hidden bg-white dark:bg-[#0B132B] ${isDark ? 'dark' : ''}`}>

      {/* ── Navbar (MEJORADO con Motion) ────────────────────────────────────── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 lg:px-10 py-4 backdrop-blur-md border-b border-slate-100 dark:border-white/5"
        style={{ background: isDark ? 'rgba(11,19,43,0.92)' : 'rgba(255,255,255,0.92)' }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <motion.button
              onClick={onBack}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 dark:text-slate-400"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </motion.button>
          )}
          <motion.button
            onClick={() => scrollTo('hero')}
            className="flex items-center gap-2.5 shrink-0 no-press"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogoFull size={26} />
          </motion.button>
        </div>

        <div className="hidden lg:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-2xl px-1.5 py-1.5 dark:bg-white/5 dark:border-white/10">
          {[
            { label: 'Cómo funciona', id: 'como-funciona' },
            { label: 'Precios', id: 'precios' },
            { label: 'FAQ', id: 'faq' },
          ].map(({ label, id }) => (
            <motion.button
              key={id}
              onClick={() => scrollTo(id)}
              className="px-4 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {label}
            </motion.button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-2xl p-1 dark:bg-white/5 dark:border-white/10">
            <motion.button
              onClick={() => setMode('usuarios')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'usuarios' ? 'bg-white text-slate-900 shadow dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              whileTap={{ scale: 0.95 }}
            >
              <Users className="w-3 h-3" /> Para vos
            </motion.button>
            <motion.button
              onClick={() => setMode('tiendas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'tiendas' ? 'bg-brand text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              whileTap={{ scale: 0.95 }}
            >
              <Store className="w-3 h-3" /> Tu tienda
            </motion.button>
          </div>
          <motion.button
            onClick={handleGoogle}
            disabled={anyLoading}
            className={`${BTN_GOOGLE_ADAPTIVE} px-5 py-2.5 rounded-xl text-sm`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon size={16} />}
            Iniciar sesión
          </motion.button>
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <motion.button
            onClick={handleGoogle}
            disabled={anyLoading}
            className={`${BTN_GOOGLE_ADAPTIVE} px-4 py-2 rounded-xl text-sm`}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon size={15} />}
            Entrar
          </motion.button>
          <motion.button
            onClick={() => setDrawerOpen(true)}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.nav>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogin={handleGoogle}
        loading={anyLoading}
        anyLoading={anyLoading}
        mode={mode}
        setMode={(m) => { setMode(m); setDrawerOpen(false); }}
        scrollTo={scrollTo}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* ── Hero (UNIFICADO 2026) ────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-screen flex items-center pt-20 pb-16 px-5 lg:px-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-[80%] bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(0,184,217,0.10),transparent)]" />
          <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-brand/6 rounded-full blur-[130px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand/4 rounded-full blur-[140px]" />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
            {/* Left content - 7 columns */}
            <div className="lg:col-span-7">
              <motion.div
                className="inline-flex items-center gap-2 bg-brand/8 border border-brand/15 text-brand text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              >
                <motion.div
                  className="w-1.5 h-1.5 bg-brand rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Sistema operativo local
              </motion.div>

              {/* Toggle animado: Para vos / Tu tienda — alterna automáticamente */}
              <HeroModeToggle />

              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }}
              >
                Tu ciudad,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">conectada.</span>
                <br />
                <span className="text-3xl sm:text-4xl lg:text-5xl text-slate-500 dark:text-slate-400 font-bold">
                  Comprá, vendé, trabajá, viajá.
                </span>
              </motion.h1>

              <motion.p
                className="text-slate-500 dark:text-slate-400 text-base sm:text-lg leading-relaxed mb-6 max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                LOKAL es el sistema operativo de tu ciudad. Publicá lo que buscás, respondé demandas, 
                explorá el mapa de comercios, ofrecé servicios y viajá compartido. Todo en una sola app.
              </motion.p>

              {/* Feature pills - las funciones principales */}
              <motion.div
                className="flex flex-wrap gap-2 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[
                  { icon: Package, label: 'Demandas' },
                  { icon: Store, label: 'Tiendas' },
                  { icon: MapPin, label: 'Mapa' },
                  { icon: MessageSquare, label: 'Chat' },
                  { icon: Tag, label: 'Productos' },
                ].map(({ icon: Icon, label }, i) => (
                  <motion.div
                    key={label}
                    className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/8 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                  >
                    <Icon className="w-3 h-3 text-brand" />
                    {label}
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <motion.button
                  onClick={handleGoogle}
                  disabled={anyLoading}
                  className={`${BTN_GOOGLE_ADAPTIVE} gap-3 py-4 px-7 rounded-2xl text-base shadow-xl`}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                  Empezar gratis
                </motion.button>
                <motion.button
                  onClick={() => scrollTo('demandas')}
                  className="flex items-center gap-2 text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand font-semibold transition-colors text-sm"
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  Ver cómo funciona <ChevronDown className="w-4 h-4" />
                </motion.button>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    className="flex items-center gap-2 text-rose-500 dark:text-rose-400 text-sm mb-4"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.p
                className="text-xs text-slate-400 flex items-center gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Check className="w-3.5 h-3.5 text-brand" /> Sin tarjeta · Siempre gratis para usar
              </motion.p>
            </div>

            {/* Right visual - 5 columns */}
            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.3 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-brand/5 rounded-[2.5rem] blur-2xl scale-110" />
                <PhoneMockup />

                {/* Floating badges */}
                <motion.div
                  className="absolute -left-4 top-1/4 bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 shadow-xl z-20"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, type: 'spring' }}
                >
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-brand/15 rounded-xl flex items-center justify-center">
                        <Users className="w-4 h-4 text-brand" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">1,240+</p>
                        <p className="text-[10px] text-slate-400">Usuarios activos</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div
                  className="absolute -right-2 bottom-1/3 bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 shadow-xl z-20"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, type: 'spring' }}
                >
                  <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500/15 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">94% tasa</p>
                        <p className="text-[10px] text-slate-400">de respuesta</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats (MEJORADO con Motion) ─────────────────────────────────────── */}
      <section ref={statsRef} className="py-14 px-5 border-y border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { value: u, suffix: '+', label: 'Usuarios activos' },
            { value: d, suffix: '+', label: 'Demandas publicadas' },
            { value: r, suffix: '%', label: 'Tasa de respuesta' },
            { value: t, suffix: '+', label: 'Tiendas registradas' },
          ].map(({ value, suffix, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.5, type: 'spring', stiffness: 200 }}
            >
              <motion.p
                className="text-4xl sm:text-5xl font-black tabular-nums"
                initial={{ scale: 0.5 }}
                animate={statsInView ? { scale: 1 } : {}}
                transition={{ delay: i * 0.12 + 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              >
                <AnimatedCounter target={parseInt(label === 'Usuarios activos' ? 1240 : label === 'Demandas publicadas' ? 8430 : label === 'Tasa de respuesta' ? 94 : 215)} suffix={suffix} />
              </motion.p>
              <p className="text-slate-500 text-sm mt-2 font-medium">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Ecosistema (COMPACTO 2026) ───────────────────────────────────────── */}
      <section className="py-16 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <FadeUp className="text-center mb-10">
            <motion.div
              className="inline-flex items-center gap-2 bg-brand/8 border border-brand/15 text-brand text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <MapPin className="w-3.5 h-3.5" />
              Un solo lugar
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">
              Todo en una app.<br className="sm:hidden" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">Nada de saltar entre apps.</span>
            </h2>
          </FadeUp>

          {/* Grid compacto - 4 cols en desktop, 2 en mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Package, label: 'Demandas', desc: 'Pedí lo que buscás', color: 'bg-brand/10 text-brand', featured: true },
              { icon: Store, label: 'Tiendas', desc: 'Comercios locales', color: 'bg-blue-500/10 text-blue-500', featured: true },
              { icon: MapPin, label: 'Mapa', desc: 'Todo en tu zona', color: 'bg-emerald-500/10 text-emerald-500', featured: true },
              { icon: MessageSquare, label: 'Chat', desc: 'Hablá directo', color: 'bg-violet-500/10 text-violet-500', featured: false },
              { icon: Tag, label: 'Productos', desc: 'Nuevos y usados', color: 'bg-amber-500/10 text-amber-500', featured: false },
              { icon: BarChart2, label: 'Estadísticas', desc: 'Para comercios', color: 'bg-cyan-500/10 text-cyan-500', featured: false },
              { icon: Heart, label: 'Favoritos', desc: 'Guardá lo que te gusta', color: 'bg-rose-500/10 text-rose-500', featured: false },
              { icon: Clock, label: 'Próximamente', desc: 'Viajes, servicios, trabajo', color: 'bg-slate-500/10 text-slate-500', featured: false, soon: true },
            ].map(({ icon: Icon, label, desc, color, featured, soon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 200 }}
              >
                <motion.div
                  className={`relative bg-white border rounded-2xl p-4 h-full dark:bg-[#0d1526]/60 backdrop-blur-sm overflow-hidden group cursor-default transition-colors ${
                    featured 
                      ? 'border-brand/20 dark:border-brand/20' 
                      : 'border-slate-200/40 dark:border-white/[0.04]'
                  } ${soon ? 'opacity-50' : ''}`}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {/* Featured indicator */}
                  {featured && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand/40 to-transparent" />
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{label}</p>
                      <p className="text-[11px] text-slate-400 truncate">{desc}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demandas (CABALLO DE BATALLA) ────────────────────────────────────── */}
      <section id="demandas" className="py-16 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand/[0.03] rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* Left: Explicación */}
            <div>
              <FadeUp>
                <motion.div
                  className="inline-flex items-center gap-2 bg-brand/8 border border-brand/15 text-brand text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                >
                  <Package className="w-3.5 h-3.5" />
                  La función que cambia todo
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-black mb-4">
                  Publicá lo que buscás.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">Las tiendas responden.</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-6">
                  No recorrás 5 comercios. No llamás por teléfono. Subís una foto, describís lo que necesitás 
                  y las tiendas de tu zona te mandan precio y disponibilidad. Vos elegís.
                </p>
              </FadeUp>

              {/* Steps compactos - 2 por fila en desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { num: '01', icon: Package, title: 'Publicás tu pedido', desc: 'Foto, descripción y presupuesto. En menos de un minuto.' },
                  { num: '02', icon: Store, title: 'Tiendas responden', desc: 'Precio, disponibilidad y fotos. Sin llamar.' },
                  { num: '03', icon: CheckCircle, title: 'Elegís y comprás', desc: 'Comparás, charlás por chat y decidís.' },
                ].map(({ num, icon: Icon, title, desc }, i) => (
                  <motion.div
                    key={num}
                    className={i === 2 ? 'sm:col-span-2' : ''}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, type: 'spring' }}
                  >
                    <div className="flex items-start gap-3 bg-white dark:bg-[#0d1526]/60 border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4">
                      <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-brand" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-brand">{num}</span>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{title}</p>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Phone mockup o visual */}
            <motion.div
              className="relative flex justify-center"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 150 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-brand/5 rounded-[2.5rem] blur-2xl scale-110" />
                <PhoneMockup />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Mapa (Estilo real LOKAL — Bovril) ────────────────────────────────── */}
      <section id="mapa" className="py-16 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* Left: Visual — mapa estilo LOKAL real */}
            <MapCard isDark={isDark} />

            {/* Right: Text */}
            <div className="order-1 lg:order-2">
              <FadeUp>
                <motion.div
                  className="inline-flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/15 text-emerald-500 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Explorá tu ciudad
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-black mb-4">
                  Todo lo que necesitás,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-brand">a la vuelta de la esquina.</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-6">
                  El mapa de LOKAL muestra comercios, demandas, servicios y oportunidades en tiempo real.
                  Filtrá por categoría, distancia o estado abierto. Encontrá lo que buscás sin salir de tu zona.
                </p>
              </FadeUp>
              <div className="space-y-3">
                {[
                  { icon: Store, text: 'Comercios con horarios reales y estado abierto/cerrado' },
                  { icon: Package, text: 'Demandas activas en tu zona (qué buscan los vecinos)' },
                  { icon: Tag, text: 'Productos publicados cerca tuyo' },
                ].map(({ icon: Icon, text }, i) => (
                  <motion.div key={text} className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── Otras funciones (FAQ desplegables) ───────────────────────────────── */}
      <section id="funciones" className="py-16 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.015]">
        <div className="max-w-3xl mx-auto">
          <FadeUp className="text-center mb-10">
            <motion.div
              className="inline-flex items-center gap-2 bg-brand/8 border border-brand/15 text-brand text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Y mucho más
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">
              Todo lo que podés hacer.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              Clickeá para ver más detalles de cada función.
            </p>
          </FadeUp>

          <div className="space-y-3">
            {[
              { 
                icon: MapPin, 
                title: 'Mapa interactivo de tu ciudad',
                desc: 'Explorá comercios, oportunidades, servicios y demandas en un mapa en tiempo real. Filtrá por categoría, distancia y estado abierto/cerrado. Con clustering de markers y rutas a pie.',
                color: 'text-emerald-500 bg-emerald-500/10'
              },
              { 
                icon: Store, 
                title: 'Perfil público de tienda',
                desc: 'Cada comercio tiene su propia página pública con productos, horarios, fotos y chat directo. Compartila con un link único: lokal.ar/t/tu-tienda.',
                color: 'text-blue-500 bg-blue-500/10'
              },
              { 
                icon: MessageSquare, 
                title: 'Chat directo con comercios',
                desc: 'Hablá con la tienda antes de ir. Sin llamadas, sin filas. Adjuntá fotos, preguntá por stock, coordiná el retiro. Todo en la app.',
                color: 'text-violet-500 bg-violet-500/10'
              },
              { 
                icon: Tag, 
                title: 'Productos nuevos y usados',
                desc: 'Las tiendas publican su catálogo. Los usuarios pueden vender productos usados (3 gratis, 10 como emprendimiento). Todo aparece en el mapa y en búsquedas.',
                color: 'text-amber-500 bg-amber-500/10'
              },
              { 
                icon: BarChart2, 
                title: 'Estadísticas para comercios',
                desc: 'Vistas, clicks, conversiones. Sabé cuántos usuarios vieron tus productos y cuántos contactaron. Solo para planes pagos.',
                color: 'text-cyan-500 bg-cyan-500/10'
              },
              { 
                icon: Heart, 
                title: 'Favoritos y guardados',
                desc: 'Guardá tiendas, productos y ofertas que te interesen. Accedé rápido desde tu perfil. Recibí notificaciones cuando haya novedades.',
                color: 'text-rose-500 bg-rose-500/10'
              },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <FunctionAccordion icon={Icon} title={title} desc={desc} color={color} />
              </motion.div>
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

      {/* ── Lo que viene (Votación de features) ─────────────────────────────── */}
      <section id="proximamente" className="py-16 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5 relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative">
          <FadeUp className="text-center mb-10">
            <motion.div
              className="inline-flex items-center gap-2 bg-brand/8 border border-brand/15 text-brand text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Clock className="w-3.5 h-3.5" />
              En construcción
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">
              Lo que viene.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mx-auto">
              Estamos construyendo la plataforma para el comercio local de Argentina. 
              Votá por lo que más te interese y ayudanos a priorizar.
            </p>
          </FadeUp>

          <FeatureVoting />
        </div>
      </section>

      {/* ── Precios (REDISEÑADO 2026) ───────────────────────────────────────── */}
      <section id="precios" className="py-16 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand/[0.03] rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative">
          <FadeUp className="text-center mb-10">
            <motion.div
              className="inline-flex items-center gap-2 bg-brand/8 border border-brand/15 text-brand text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Tag className="w-3.5 h-3.5" />
              Precios
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-black mb-3">Simple y transparente.</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base mb-5">Sin sorpresas. Sin comisiones por venta.</p>
            
            {/* Toggle: Para vos / Tu tienda */}
            <motion.div
              className="relative inline-flex items-center bg-slate-100 border border-slate-200 rounded-2xl p-1 dark:bg-white/5 dark:border-white/10 mb-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {/* Sliding background pill */}
              <motion.div
                className="absolute top-1 bottom-1 bg-white dark:bg-brand rounded-xl shadow-sm"
                style={{ width: 'calc(50% - 4px)' }}
                animate={{
                  x: mode === 'tiendas' ? 'calc(100% + 4px)' : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
              <motion.button
                onClick={() => setMode('usuarios')}
                className={`relative z-10 px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${mode === 'usuarios' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                whileTap={{ scale: 0.95 }}
              >
                <Users className="w-3.5 h-3.5" />
                Para vos
              </motion.button>
              <motion.button
                onClick={() => setMode('tiendas')}
                className={`relative z-10 px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${mode === 'tiendas' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                whileTap={{ scale: 0.95 }}
              >
                <Store className="w-3.5 h-3.5" />
                Tu tienda
              </motion.button>
            </motion.div>
            
            {/* Toggle: Mensual / Anual */}
            <motion.div
              className="relative inline-flex items-center bg-slate-100 border border-slate-200 rounded-2xl p-1.5 dark:bg-white/5 dark:border-white/10"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {/* Sliding background pill */}
              <motion.div
                className="absolute h-[calc(100%-12px)] bg-white dark:bg-white rounded-xl shadow-sm"
                style={{ width: annual ? 100 : 90 }}
                animate={{
                  x: annual ? 94 : 6,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
              <motion.button
                onClick={() => setAnnual(false)}
                className={`relative z-10 px-5 py-2 rounded-xl text-sm font-bold transition-colors ${!annual ? 'text-slate-900' : 'text-slate-500 dark:text-slate-400'}`}
                whileTap={{ scale: 0.95 }}
              >
                Mensual
              </motion.button>
              <motion.button
                onClick={() => setAnnual(true)}
                className={`relative z-10 px-5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${annual ? 'text-slate-900' : 'text-slate-500 dark:text-slate-400'}`}
                whileTap={{ scale: 0.95 }}
              >
                Anual
                <motion.span
                  className="text-[10px] bg-brand text-white px-1.5 py-0.5 rounded-full font-bold"
                  animate={annual ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  -20%
                </motion.span>
              </motion.button>
            </motion.div>
          </FadeUp>

          {/* FIX: Cards ocupan todo el ancho en móvil, grid en desktop */}
          <div className={`grid gap-5 items-stretch ${
            mode === 'usuarios' 
              ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {(mode === 'usuarios' ? PLANS_USUARIOS : PLANS_TIENDAS).map((plan, i) => (
              <motion.div
                key={plan.id}
                className="w-full"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              >
                <motion.div
                  className="h-full"
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <PricingCard plan={plan} annual={annual} onLogin={(planId) => handleGoogle(planId)} loadingPlan={loadingPlan} anyLoading={anyLoading} />
                </motion.div>
              </motion.div>
            ))}
          </div>
          <motion.p 
            className="text-center text-slate-400 dark:text-slate-600 text-sm mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {mode === 'usuarios'
              ? 'Usuario y Emprendimiento son gratis para siempre · Sin comisiones por venta'
              : 'Pagos procesados por MercadoPago · Pagá 1 mes, el segundo es gratis · Sin comisiones por venta'
            }
          </motion.p>
        </div>
      </section>

      {/* ── Testimonios ──────────────────────────────────────────────────────── */}
      <TestimonialsSection isDark={isDark} />

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 px-5 lg:px-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.015]">
        <div className="max-w-2xl mx-auto">
          <FadeUp className="text-center mb-10">
            <p className="text-brand font-bold text-sm uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-black">Preguntas frecuentes.</h2>
          </FadeUp>
          <FadeUp>
            <FAQAccordion />
          </FadeUp>
        </div>
      </section>

      {/* ── CTA Final (MEJORADO con Motion) ─────────────────────────────────── */}
      <section className="py-16 px-5 border-t border-slate-100 dark:border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,rgba(0,184,217,0.08),transparent)] pointer-events-none" />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[100px]" />
        </motion.div>
        <div className="relative max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <motion.h2
              className="text-4xl sm:text-5xl font-black mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              {mode === 'tiendas' ? 'Tu próximo cliente ya está buscando.' : 'Encontrá lo que buscás.'}<br />
              <motion.span
                className="text-brand inline-block"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                Empezá hoy.
              </motion.span>
            </motion.h2>
            <motion.p
              className="text-slate-500 dark:text-slate-400 text-lg mb-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {mode === 'tiendas'
                ? 'Unite a la red de comercios que ya están respondiendo demandas reales de clientes de su ciudad.'
                : 'Miles de compradores ya publican sus pedidos y reciben respuestas de tiendas locales en minutos.'
              }
            </motion.p>
            <motion.button
              onClick={primaryCta}
              disabled={anyLoading}
              className={`${BTN_GOOGLE_ADAPTIVE} inline-flex gap-3 py-4 px-10 rounded-2xl text-lg shadow-2xl`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon size={22} />}
              {content.cta}
            </motion.button>
            <AnimatePresence>
              {error && (
                <motion.div
                  className="flex items-center justify-center gap-2 text-rose-500 dark:text-rose-400 text-sm mt-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.p
              className="text-xs text-slate-400 mt-5 max-w-sm mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
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
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer (REDISEÑADO 2026) ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 dark:border-white/5 px-5 lg:px-10 pt-8 pb-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6 mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo + descripción + Instagram — ocupa 5 columnas en desktop */}
            <div className="lg:col-span-5">
              <div className="flex items-start justify-between">
                <motion.div
                  className="mb-3"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <LogoFull size={26} />
                </motion.div>
                {/* Instagram alineado a la derecha del logo */}
                <motion.a
                  href="https://instagram.com/lokal.ar"
                  target="_blank"
                  rel="noopener"
                  className="w-9 h-9 bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
                  whileHover={{ scale: 1.15, y: -2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Instagram className="w-4 h-4 text-white" />
                </motion.a>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                Publicás lo que buscás. Las tiendas de tu ciudad responden. El mercado local, al revés.
              </p>
            </div>

            {/* Plataforma + Legal — misma fila en mobile, 4 columnas en desktop */}
            <div className="sm:col-span-1 lg:col-span-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Plataforma</p>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Cómo funciona', id: 'como-funciona' },
                      { label: 'Precios', id: 'precios' },
                      { label: 'FAQ', id: 'faq' },
                    ].map(({ label, id }) => (
                      <motion.button
                        key={label}
                        onClick={() => scrollTo(id)}
                        className="block text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand text-sm transition-colors"
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Legal</p>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Términos', path: '/terminos-y-condiciones' },
                      { label: 'Privacidad', path: '/politica-de-privacidad' },
                      { label: 'Comercios', path: '/condiciones-para-comercios' },
                    ].map(({ label, path }) => (
                      <motion.button
                        key={path}
                        onClick={() => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }}
                        className="block text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand text-sm transition-colors text-left"
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Acceso — 3 columnas en desktop */}
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Acceso</p>
              <motion.button
                onClick={handleGoogle}
                disabled={anyLoading}
                className={`${BTN_GOOGLE_ADAPTIVE} w-full justify-center py-3 px-4 rounded-xl text-sm mb-3`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon size={16} />}
                Iniciar sesión
              </motion.button>
              <motion.button
                onClick={handleRegisterStore}
                disabled={anyLoading}
                className="w-full flex items-center justify-center gap-2 bg-brand/10 border border-brand/20 text-brand font-bold py-3 px-4 rounded-xl hover:bg-brand/20 transition-all text-sm disabled:opacity-60"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Store className="w-4 h-4" />
                Registrar tienda
              </motion.button>
              {toggleTheme && (
                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="text-xs text-slate-400">Modo {isDark ? 'oscuro' : 'claro'}</span>
                  <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="border-t border-slate-100 dark:border-white/5 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-slate-400 dark:text-slate-600 text-xs text-center sm:text-left">
              © 2026 Lokal · Intermediador digital — no somos vendedor ni parte de las transacciones.
            </p>
            {/* Ktrl — color primario de base, hover más intenso */}
            <motion.a
              href="https://www.instagram.com/katriel.martinez"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 text-brand/60 hover:text-brand dark:text-brand/50 dark:hover:text-brand transition-colors group no-press"
              whileHover={{ y: -2, scale: 1.05 }}
            >
              <span className="text-[11px] font-medium">Creado por</span>
              <KtrlMark className="h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          </motion.div>
        </div>
      </footer>

    </div>
  );
}
