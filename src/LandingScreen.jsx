// Landing pública de LOKAL LINKS — lo que ve alguien que entra a la raíz.
//
// Antes la raíz caía en TIENDA_SLUG_FIJA: mostraba una tienda concreta a
// cualquiera que llegara sin slug (ver Root.jsx). Esta pantalla la reemplaza
// como puerta de entrada real del producto.
//
// El eje narrativo es el de LINKS, no el de LOKAL global: acá no hay
// demandas ni compradores registrándose — el visitante final entra por el
// link directo de una tienda (/:slug). El único que se registra es el
// DUEÑO del negocio, así que todo apunta a "creá tu tienda".
import React, { useState, useRef, useEffect } from 'react';
import {
  Loader2, AlertCircle, Sun, Moon, Check, ChevronDown, Store, Tag,
  MessageSquare, Share2, Instagram, BarChart3, Sparkles,
} from 'lucide-react';
import { signInWithGoogle } from './firebase';
import { LogoFull, KtrlMark } from './Brand';

const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Aparición al entrar en viewport — IntersectionObserver nativo en vez de
// motion/react: la landing es lo primero que carga un visitante nuevo, no
// conviene sumarle una librería de animación al bundle crítico.
function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const PASOS = [
  { icon: Store,   titulo: 'Creá tu tienda',      desc: 'Entrás con Google y cargás nombre, foto y datos de contacto. Sin instalar nada.' },
  { icon: Tag,     titulo: 'Publicá tus ofertas', desc: 'Subís una foto, le ponés precio y fecha de vencimiento. Aparece al instante.' },
  { icon: Share2,  titulo: 'Compartí tu link',    desc: 'Tenés una dirección propia para mandar por WhatsApp o poner en tu Instagram.' },
];

const FEATURES = [
  { icon: Instagram,     titulo: 'Un link para todo',    desc: 'Tu catálogo entero en una sola dirección, lista para el perfil de Instagram o el estado de WhatsApp.' },
  { icon: MessageSquare, titulo: 'Consultas directas',   desc: 'Tus clientes te escriben desde la página y te llegan a un solo lugar, sin perder mensajes.' },
  { icon: BarChart3,     titulo: 'Sabés qué funciona',   desc: 'Ves cuánta gente entró a tu tienda y qué ofertas miran más.' },
  { icon: Sparkles,      titulo: 'Diseño que se adapta', desc: 'Elegís el color de tu marca y la página se arma sola, prolija en celular y computadora.' },
];

const FAQ = [
  { q: '¿Necesito saber de tecnología?', a: 'No. Entrás con tu cuenta de Google, cargás los datos de tu negocio y ya tenés tu página. Todo se edita desde el celular, como cualquier app.' },
  { q: '¿Qué pasa con mis clientes actuales?', a: 'Seguís atendiendo igual. LOKAL LINKS es la vidriera: tus clientes ven lo que ofrecés y te escriben directo por WhatsApp o desde el chat de la página.' },
  { q: '¿Puedo cambiar mi dirección web después?', a: 'Sí, la URL de tu tienda se edita cuando quieras desde el panel. Tené en cuenta que el link anterior deja de funcionar, así que conviene avisar si ya lo compartiste.' },
  { q: '¿Cuánto cuesta?', a: 'Arrancás con un período de prueba gratis. Después, el precio depende del rubro y del plan que elijas — lo ves en detalle desde tu panel antes de pagar nada.' },
  { q: '¿Puedo darla de baja?', a: 'Cuando quieras, desde tu panel. No hay permanencia ni penalidad: tu tienda deja de estar publicada y listo.' },
];

// Mockup del panel real (no una foto): réplica en miniatura del admin de
// ofertas — grilla de cards con su badge de vencimiento y la fila de
// acciones. Sirve para que el dueño reconozca la herramienta antes de
// registrarse. Inspirado en los mockups de la landing de LOKAL global,
// pero mostrando LA pantalla que realmente va a usar en LINKS.
function PanelMockup() {
  const OFERTAS = [
    { emoji: '🍕', nombre: 'Muzzarella grande', fecha: '31/07' },
    { emoji: '🍔', nombre: 'Combo doble',       fecha: null    },
    { emoji: '🥤', nombre: 'Gaseosa 1.5L',      fecha: '02/08' },
    { emoji: '🍟', nombre: 'Papas cheddar',     fecha: null    },
  ];
  return (
    <div className="relative w-[248px] mx-auto select-none" aria-hidden="true">
      <div className="absolute inset-0 rounded-full blur-[56px] scale-105 -z-0"
        style={{ background: 'rgb(var(--brand, 0 184 217) / 0.22)' }} />
      <div className="relative z-10 rounded-[2.6rem] p-2.5 shadow-2xl border border-white/10"
        style={{ background: '#0F172A' }}>
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 rounded-full bg-black z-20" />
        <div className="rounded-[2.2rem] overflow-hidden bg-white" style={{ height: 452 }}>
          <div className="px-4 pt-7 pb-3 border-b border-slate-100 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgb(var(--brand, 0 184 217) / 0.12)' }}>
              <Tag className="w-4 h-4" style={{ color: 'var(--brand-hex, #00B8D9)' }} strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-[12px] font-black text-slate-900 leading-none">Ofertas</p>
              <p className="text-[9px] text-slate-400 mt-1">4 publicaciones</p>
            </div>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2.5">
            {OFERTAS.map((o) => (
              <div key={o.nombre} className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
                <div className="relative bg-slate-100 flex items-center justify-center" style={{ aspectRatio: '1 / 1.1' }}>
                  <span className="text-2xl">{o.emoji}</span>
                  {o.fecha && (
                    <span className="absolute top-1.5 right-1.5 text-[7px] font-bold text-white px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,.55)' }}>
                      {o.fecha}
                    </span>
                  )}
                </div>
                <div className="p-1.5">
                  <p className="text-[8px] font-bold text-slate-700 text-center truncate">{o.nombre}</p>
                  <div className="grid grid-cols-3 gap-1 mt-1.5">
                    {[0, 1, 2].map(i => <span key={i} className="h-3.5 rounded bg-slate-100" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingScreen({ isDark, toggleTheme }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // signInWithGoogle puede resolver por popup (desktop) o navegar por
      // redirect (mobile). En ambos casos Root.jsx toma el control vía
      // onAuthStateChanged; acá solo hay que llevarlo al flujo de /admin,
      // que ya decide entre registro y panel según tenga tienda o no.
      window.location.href = '/admin';
    } catch (err) {
      const ignorados = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      if (!ignorados.includes(err.code)) {
        setError(
          err.code === 'auth/unauthorized-domain'
            ? 'Dominio no autorizado. Agregá este dominio en Firebase Console.'
            : (err.message || 'No se pudo iniciar sesión'),
        );
      }
      setLoading(false);
    }
  };

  const CtaGoogle = ({ full = true }) => (
    <button
      onClick={handleGoogle}
      disabled={loading}
      className={`${full ? 'w-full sm:w-auto' : ''} inline-flex items-center justify-center gap-3 bg-ink dark:bg-white hover:bg-ink/90 dark:hover:bg-white/90 text-white dark:text-[#18181b] font-bold py-3.5 px-7 rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:opacity-60 active:scale-[0.98]`}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon size={20} />}
      {loading ? 'Entrando...' : 'Creá tu tienda gratis'}
    </button>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: isDark ? '#040a14' : 'var(--surface-solid, #fff)', color: 'var(--text-primary)' }}>

      {/* Glow de marca — mismo lenguaje que AdminLogin/splash. */}
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
        height: '70%',
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.14), transparent)',
      }} />

      {/* ── Barra superior ── */}
      <header className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
        <LogoFull size={26} />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="w-10 h-10 rounded-full flex items-center justify-center text-ink-dim transition-colors hover:bg-brand/10 hover:text-brand"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a href="/admin"
            className="text-sm font-bold px-4 py-2 rounded-xl transition-colors hover:bg-brand/10 hover:text-brand text-ink-dim">
            Entrar
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="text-center lg:text-left">
            <FadeUp>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
                style={{ background: 'rgb(var(--brand, 0 184 217) / 0.12)', color: 'var(--brand-hex, #00B8D9)' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Probá gratis, sin tarjeta
              </span>
            </FadeUp>
            <FadeUp delay={80}>
              <h1 className="text-4xl lg:text-5xl font-black leading-[1.08] tracking-tight mb-5">
                Tu negocio,
                <br />
                <span style={{ color: 'var(--brand-hex, #00B8D9)' }}>en un solo link.</span>
              </h1>
            </FadeUp>
            <FadeUp delay={160}>
              <p className="text-base lg:text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0"
                style={{ color: 'var(--text-secondary, #999)' }}>
                Armá tu página con tus ofertas y compartila por WhatsApp o Instagram.
                Tus clientes ven todo lo que tenés y te escriben directo.
              </p>
            </FadeUp>
            <FadeUp delay={240}>
              <CtaGoogle />
              {error && (
                <div className="mt-4 flex items-center gap-2 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <p className="text-[11px] mt-4" style={{ color: 'var(--text-secondary, #999)' }}>
                Al continuar, aceptás los{' '}
                <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer"
                  className="underline hover:text-brand transition-colors">términos y condiciones</a>.
              </p>
            </FadeUp>
          </div>
          <FadeUp delay={200} className="hidden lg:block">
            <PanelMockup />
          </FadeUp>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 py-14">
        <FadeUp>
          <h2 className="text-2xl lg:text-3xl font-black text-center mb-3">Tres pasos y estás online</h2>
          <p className="text-center text-sm mb-10" style={{ color: 'var(--text-secondary, #999)' }}>
            No hace falta contratar a nadie ni saber de páginas web.
          </p>
        </FadeUp>
        {/* Numerados a propósito: acá el orden SÍ es información (uno
            habilita al siguiente), a diferencia de la grilla de ventajas
            de abajo, que es un conjunto sin secuencia. */}
        <ol className="grid sm:grid-cols-3 gap-4">
          {PASOS.map(({ icon: Icon, titulo, desc }, i) => (
            <FadeUp key={titulo} delay={i * 90}>
              <li className="h-full bg-surface-card border border-slate-100 dark:border-white/8 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgb(var(--brand, 0 184 217) / 0.12)' }}>
                    <Icon className="w-5 h-5" style={{ color: 'var(--brand-hex, #00B8D9)' }} strokeWidth={2.2} />
                  </span>
                  <span className="text-xs font-black tabular-nums" style={{ color: 'var(--text-secondary, #999)' }}>
                    Paso {i + 1}
                  </span>
                </div>
                <h3 className="font-black text-base mb-1.5">{titulo}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary, #999)' }}>{desc}</p>
              </li>
            </FadeUp>
          ))}
        </ol>
      </section>

      {/* ── Ventajas ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 py-14">
        <FadeUp>
          <h2 className="text-2xl lg:text-3xl font-black text-center mb-10">Todo lo que incluye</h2>
        </FadeUp>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, titulo, desc }, i) => (
            <FadeUp key={titulo} delay={i * 70}>
              <div className="h-full flex gap-4 bg-surface-card border border-slate-100 dark:border-white/8 rounded-3xl p-5">
                <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgb(var(--brand, 0 184 217) / 0.12)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--brand-hex, #00B8D9)' }} strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-black text-base mb-1">{titulo}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary, #999)' }}>{desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Precio ──
          Sin cifras: el precio depende del rubro y lo va a fijar el admin
          general, así que publicar un número acá sería prometer algo que
          todavía no está definido (y quedaría desincronizado del panel).
          Se comunica lo único que hoy es cierto y verificable: la prueba
          gratis y que no hay permanencia. */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 py-14">
        <FadeUp>
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 dark:border-white/8 bg-surface-card p-8 lg:p-12 text-center">
            <div className="absolute inset-x-0 top-0 h-40 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.10), transparent)' }} />
            <div className="relative">
              <h2 className="text-2xl lg:text-3xl font-black mb-3">Empezá sin pagar nada</h2>
              <p className="text-sm leading-relaxed max-w-md mx-auto mb-7" style={{ color: 'var(--text-secondary, #999)' }}>
                Creás tu tienda y la usás completa durante la prueba. Cuando termine,
                elegís el plan que te sirva desde tu panel. Sin permanencia y sin
                comisiones por venta.
              </p>
              <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 mb-8 text-sm font-semibold">
                {['Prueba gratis al crear tu tienda', 'Cancelás cuando quieras', 'Sin comisión por venta'].map(t => (
                  <li key={t} className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgb(var(--brand, 0 184 217) / 0.15)' }}>
                      <Check className="w-2.5 h-2.5" style={{ color: 'var(--brand-hex, #00B8D9)' }} strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <CtaGoogle full={false} />
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 max-w-2xl mx-auto px-5 lg:px-8 py-14">
        <FadeUp>
          <h2 className="text-2xl lg:text-3xl font-black text-center mb-10">Preguntas frecuentes</h2>
        </FadeUp>
        <div className="space-y-3">
          {FAQ.map((item, i) => {
            const abierto = faqOpen === i;
            return (
              <FadeUp key={item.q} delay={i * 50}>
                <div className="bg-surface-card border border-slate-100 dark:border-white/8 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setFaqOpen(abierto ? null : i)}
                    aria-expanded={abierto}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="font-bold text-sm">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${abierto ? 'rotate-180 text-brand' : 'text-ink-dim'}`} />
                  </button>
                  {/* grid-rows 0fr→1fr: transición de alto real sin medir el
                      contenido con JS ni fijar un max-height inventado. */}
                  <div className="grid transition-all duration-300 ease-out motion-reduce:transition-none"
                    style={{ gridTemplateRows: abierto ? '1fr' : '0fr' }}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm leading-relaxed border-t border-slate-100 dark:border-white/8 pt-4"
                        style={{ color: 'var(--text-secondary, #999)' }}>
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-slate-100 dark:border-white/8 mt-6">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <LogoFull size={22} />
          <nav className="flex items-center gap-5 text-xs font-semibold" style={{ color: 'var(--text-secondary, #999)' }}>
            <a href="/terminos-y-condiciones" className="hover:text-brand transition-colors">Términos</a>
            <a href="/politica-de-privacidad" className="hover:text-brand transition-colors">Privacidad</a>
            <a href="/condiciones-para-comercios" className="hover:text-brand transition-colors">Comercios</a>
          </nav>
          <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-ink-dim/50 hover:text-ink-dim/80 transition-colors">
            <span className="text-[10px] font-semibold">Creado por</span>
            <KtrlMark style={{ height: 11, color: 'currentColor' }} />
          </a>
        </div>
      </footer>
    </div>
  );
}
