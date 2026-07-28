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
  MessageSquare, Share2, Instagram, BarChart3, Sparkles, ArrowUp,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { signInWithGoogle, renderBotonGoogle, gisDisponible } from './firebase';
import { LogoFull, KtrlMark } from './Brand';

const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Superficie de card enriquecida con el azul de marca. Los tokens globales
// (--surface-solid/#f5f5f5) son gris neutro a propósito ("cero azul", ver
// index.css §4) — correcto para el panel, pero en la landing dejaban las
// cards planas y pálidas. Acá se les mezcla una pizca de marca, el mismo
// recurso que hace que la card de "Empezá sin pagar" se lea viva.
const CARD_TINTED = {
  background: 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.055), rgb(var(--brand, 0 184 217) / 0.015))',
  borderColor: 'rgb(var(--brand, 0 184 217) / 0.14)',
};

// Aparición al entrar en viewport — IntersectionObserver nativo en vez de
// motion/react: la landing es lo primero que carga un visitante nuevo, no
// conviene sumarle una librería de animación al bundle crítico.
function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  // Se apaga solo cuando la transición termina: mientras tanto, will-change
  // le da a este elemento su propia capa de compositing. Sin esto, con
  // varias instancias de FadeUp animando a la vez (FAQ tiene 5, cada una
  // con un acordeón overflow-hidden adentro) durante un scroll rápido,
  // Chrome Android competía por recompositar la misma capa que el
  // overflow-hidden del acordeón y dejaba texto fantasma en varias
  // posiciones — el layout ya había cambiado pero la capa compuesta previa
  // no se descartó a tiempo.
  const [animando, setAnimando] = useState(true);
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
      onTransitionEnd={() => setAnimando(false)}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        willChange: animando ? 'transform, opacity' : 'auto',
        opacity: inView ? 1 : 0,
        // translateZ(0) agregado al mismo translateY (no un transform
        // aparte): Tailwind y este style escriben la misma propiedad, y el
        // inline siempre gana — ponerlo suelto anulaba la traslación real.
        transform: inView ? 'translateY(0) translateZ(0)' : 'translateY(24px) translateZ(0)',
      }}
    >
      {children}
    </div>
  );
}

// Botón de Google. Vive FUERA de LandingScreen a propósito: declarado
// adentro, React lo trata como un tipo de componente nuevo en cada render
// del padre y desmonta/remonta el iframe de Google en cada cambio de estado
// (por ejemplo al scrollear). Eso hacía que el botón alternara entre mostrar
// el correo y "Continuar con Google", y que la página pegara un salto cuando
// el iframe cambiaba de alto al reconstruirse.
// Ancho pedido a GIS. Google agrega ~10px de margen invisible a cada lado
// (medido con Playwright: pedís 320 y el iframe real mide 340), así que el
// pill visible siempre queda BTN_W. Se probó 200 y 230: por debajo de ~250
// el texto "Continuar con Google" empieza a apretarse contra el logo.
const BTN_W = 260;
function BotonGoogle({ full = true, isDark, loading, onPopup, onLogin, onError }) {
  const slotRef = useRef(null);
  const [gisListo, setGisListo] = useState(false);

  // Los callbacks viajan por ref, NO por dependencias: el padre los crea
  // inline, así que son funciones nuevas en cada render. Como dependencias
  // reejecutaban este efecto en bucle — montar el iframe, desmontarlo,
  // montarlo otra vez — y el botón nunca llegaba a estabilizarse, por lo que
  // gisListo se quedaba en false y siempre se veía el botón de respaldo.
  const cbRef = useRef({ onLogin, onError });
  cbRef.current = { onLogin, onError };

  useEffect(() => {
    if (!gisDisponible() || !slotRef.current) return;
    let limpiar;
    let vivo = true;
    renderBotonGoogle(slotRef.current, {
      // Google solo da 4 combinaciones fijas de color para este botón (no
      // hay forma de pedirle un color propio): outline (#FFFFFF),
      // outline_dark (#131314 casi negro), filled_blue, filled_black. Antes
      // se elegía el theme que "combina" con el fondo real de la landing —
      // outline_dark (casi negro) sobre el fondo oscuro (#040a14, AÚN MÁS
      // oscuro que el botón) y outline (blanco) sobre el fondo claro
      // (blanco también) — así que el botón se fundía con la página en
      // los dos temas, quedando apagado.
      //
      // Se invierte a propósito: el theme CLARO sobre el fondo oscuro, y el
      // OSCURO sobre el fondo claro, para que el botón contraste contra la
      // página en vez de camuflarse con ella.
      theme: isDark ? 'outline' : 'outline_dark',
      // color_scheme sigue en isDark real (no en el theme invertido de
      // arriba): esto es lo que Google usa para decidir el color del
      // DIÁLOGO nativo que se abre al tocar el botón (la lista de cuentas),
      // que sí debe acompañar el tema de la página, no el color del botón.
      colorScheme: isDark ? 'dark' : 'light',
      width: BTN_W,
      onLogin: (u) => cbRef.current.onLogin?.(u),
      onError: (e) => cbRef.current.onError?.(e),
      // El dominio no está en "Authorized JavaScript origins": el botón de
      // Google fallaría con "Acceso bloqueado" al tocarlo, así que se
      // esconde y queda el propio, que usa el popup y no depende de esa lista.
      onOrigenRechazado: () => { if (vivo) setGisListo(false); },
    })
      .then((fn) => {
        if (!vivo) { fn?.(); return; }
        limpiar = fn;
        setGisListo(true);
      })
      .catch((err) => {
        // Silenciarlo dejaba el fallback en pantalla sin explicación: el
        // botón decía "Creá tu tienda gratis" y usaba el popup (con su
        // ventana intermedia) sin que nada indicara que GIS había fallado.
        console.warn('[LOKAL] Google Identity Services no cargó:', err?.message || err);
      });
    return () => { vivo = false; limpiar?.(); };
    // isDark: Google no reestila un botón ya montado, hay que volver a
    // pedirlo para que acompañe el cambio de tema.
  }, [isDark]);

  return (
    <div className={full ? 'w-full sm:w-auto' : ''}>
      {/* El slot de Google se renderiza SIEMPRE (oculto con CSS hasta que
          gisListo), nunca condicionado al mismo estado que marca "listo": si
          el <div ref={slotRef}> solo existía cuando gisListo era true, el
          efecto de abajo encontraba slotRef.current === null en el primer
          render, salía por esa guarda sin loguear nada, y nunca reintentaba
          — gisListo jamás llegaba a ponerse en true. Bug circular: el ref
          necesitaba el estado que el propio efecto debía setear. */}
      <div className="inline-flex flex-col gap-2">
        {/* Marco fijo de 320x40+2px de borde: SIEMPRE el mismo tamaño, tenga
            GIS listo o no. Adentro se superponen dos capas con position
            absolute — nuestro botón custom (mismo pill, mismo logo, mismo
            texto que "Continuar con Google") y el slot real de Google — y
            se cruzan con opacity. Antes, mientras cargaba, se veía un botón
            de FORMA distinta ("Creá tu tienda gratis" en bg-ink) que
            after cambiaba abruptamente al pill blanco/negro de Google — un
            salto de identidad visual, no solo de contenido. Ahora el marco
            nunca cambia de forma: lo único que se disuelve es cuál capa es
            la visible, con el mismo contorno.

            El fundido cruzado tampoco tapa el parpadeo INTERNO de Google
            (genérico → "Continuar como X", que ocurre del lado de adentro
            del iframe y no se puede evitar) — pero ese parpadeo ya pasa
            DESPUÉS de que el usuario ve nuestro botón calcado, con la misma
            forma exacta, así que se percibe como "el botón ya estaba ahí y
            se puso su nombre", no como dos botones distintos turnándose. */}
        <div
          className="relative overflow-hidden"
          style={{
            width: BTN_W + 2,
            height: 42,
            borderRadius: 21,
            background: isDark
              ? 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.16), rgb(var(--brand, 0 184 217) / 0.04))'
              : 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.12), rgb(var(--brand, 0 184 217) / 0.03))',
            border: '1px solid rgb(var(--brand, 0 184 217) / 0.22)',
            boxShadow: '0 6px 22px -10px rgb(var(--brand, 0 184 217) / 0.55)',
          }}
        >
          {/* Capa 1: nuestro botón, calcado del real de Google (mismo pill,
              mismo logo multicolor, mismo texto y tamaño) — visible desde
              el instante cero, con el theme correcto invertido (ver más
              abajo) para que ya contraste bien contra la página. */}
          <button
            type="button"
            onClick={onPopup}
            aria-hidden={gisListo}
            tabIndex={gisListo ? -1 : 0}
            disabled={loading}
            className="absolute inset-0 flex items-center justify-center gap-2.5 font-medium text-[15px] transition-opacity duration-300"
            style={{
              opacity: gisListo ? 0 : 1,
              pointerEvents: gisListo ? 'none' : 'auto',
              background: isDark ? '#fff' : '#131314',
              color: isDark ? '#1f1f1f' : '#e3e3e3',
            }}
          >
            {loading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <GoogleIcon size={18} />}
            Continuar con Google
          </button>

          {/* Capa 2: el slot real de Google, debajo del custom, que se
              revela con fade-in cuando gisListo. El swap interno de Google
              (genérico → personalizado) puede seguir ocurriendo acá, pero
              ya ocurre por encima de nuestro botón idéntico, no reemplazando
              a otro de forma distinta. */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
            style={{ opacity: gisListo ? 1 : 0 }}
          >
            {/* color-scheme sigue al tema real: forzarlo a light hacía que
                en modo oscuro el iframe se dibujara blanco contra el fondo
                casi negro de la landing (el iframe en sí SIEMPRE tiene
                fondo blanco donde no hay botón). */}
            {/* +20 = el margen invisible que Google agrega al iframe (~10px
                por lado, constante sin importar el width pedido). */}
            <div ref={slotRef} className="flex items-center justify-center shrink-0"
              style={{ colorScheme: isDark ? 'dark' : 'light', width: BTN_W + 20, height: 44 }} />
          </div>
        </div>
        <span className="text-[11px] font-semibold text-center" style={{ color: 'var(--text-secondary, #999)' }}>
          Gratis para empezar · sin tarjeta
        </span>
      </div>
    </div>
  );
}

const PASOS = [
  { icon: Store,   titulo: 'Creá tu tienda',      desc: 'Entrás con Google y cargás nombre, foto y contacto. Sin instalar nada.' },
  { icon: Tag,     titulo: 'Publicá tus ofertas', desc: 'Subís una foto, ponés precio y vencimiento. Aparece al instante.' },
  { icon: Share2,  titulo: 'Compartí tu link',    desc: 'Una dirección propia para WhatsApp o tu perfil de Instagram.' },
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
// registrarse.
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

// Los 3 pasos como carrusel horizontal con snap en mobile (evita la torre
// vertical de cards) y como fila de 3 en desktop, donde el ancho sobra.
function PasosCarrusel() {
  const scrollRef = useRef(null);
  const [idx, setIdx] = useState(0);

  // El índice se deriva del scroll real, no de un estado que "cree" dónde
  // está: así el swipe manual y las flechas nunca se desincronizan.
  //
  // El cálculo va en un rAF con guarda de cambio real (mismo patrón que el
  // listener del header) — sin esto, cada evento de scroll horizontal
  // llamaba setIdx sin throttle. Con un scroll horizontal ANIDADO dentro de
  // una página que scrollea vertical, un swipe rápido en diagonal hace que
  // el navegador reciba eventos de ambos ejes casi a la vez: sin el rAF, los
  // re-renders de este carrusel competían por el hilo principal justo
  // cuando el navegador tenía que decidir qué contenedor mover, y ahí
  // aparecía el frame con la sección duplicada / el scroll de la página
  // trabado un instante.
  const rafPendiente = useRef(false);
  const onScroll = () => {
    if (rafPendiente.current) return;
    rafPendiente.current = true;
    requestAnimationFrame(() => {
      rafPendiente.current = false;
      const el = scrollRef.current;
      if (!el) return;
      const nuevo = Math.round(el.scrollLeft / el.clientWidth);
      setIdx((prev) => (prev === nuevo ? prev : nuevo));
    });
  };

  const irA = (i) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <>
      {/* Mobile: carrusel */}
      <div className="sm:hidden">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-5 px-5"
          // overscrollBehaviorX: contain evita que un swipe horizontal
          // "se escape" hacia el scroll vertical de la página (y viceversa)
          // cuando el gesto no es perfectamente horizontal — que es el caso
          // típico de un dedo moviéndose rápido.
          style={{ scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}
        >
          {PASOS.map(({ icon: Icon, titulo, desc }, i) => (
            <div key={titulo} className="snap-center shrink-0 w-full pr-3">
              <div className="h-full rounded-3xl border p-5 flex gap-4" style={CARD_TINTED}>
                <span className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgb(var(--brand, 0 184 217) / 0.14)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--brand-hex, #00B8D9)' }} strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black mb-0.5 tabular-nums" style={{ color: 'var(--brand-hex, #00B8D9)' }}>
                    Paso {i + 1}
                  </p>
                  <h3 className="font-black text-base mb-1">{titulo}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary, #999)' }}>{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Puntos + flechas */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <button onClick={() => irA(Math.max(0, idx - 1))} disabled={idx === 0}
            aria-label="Paso anterior"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
            style={{ background: 'rgb(var(--brand, 0 184 217) / 0.12)', color: 'var(--brand-hex, #00B8D9)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {PASOS.map((p, i) => (
              <button key={p.titulo} onClick={() => irA(i)} aria-label={`Ir al paso ${i + 1}`}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === idx ? 20 : 6,
                  background: i === idx ? 'var(--brand-hex, #00B8D9)' : 'rgb(var(--brand, 0 184 217) / 0.25)',
                }} />
            ))}
          </div>
          <button onClick={() => irA(Math.min(PASOS.length - 1, idx + 1))} disabled={idx === PASOS.length - 1}
            aria-label="Paso siguiente"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
            style={{ background: 'rgb(var(--brand, 0 184 217) / 0.12)', color: 'var(--brand-hex, #00B8D9)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop: fila de 3, compactas. Numerados a propósito: acá el orden
          SÍ es información (uno habilita al siguiente), a diferencia de la
          grilla de ventajas, que es un conjunto sin secuencia. */}
      <ol className="hidden sm:grid sm:grid-cols-3 gap-4">
        {PASOS.map(({ icon: Icon, titulo, desc }, i) => (
          <FadeUp key={titulo} delay={i * 90}>
            <li className="h-full rounded-3xl border p-5" style={CARD_TINTED}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgb(var(--brand, 0 184 217) / 0.14)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--brand-hex, #00B8D9)' }} strokeWidth={2.2} />
                </span>
                <span className="text-[11px] font-black tabular-nums" style={{ color: 'var(--brand-hex, #00B8D9)' }}>
                  Paso {i + 1}
                </span>
              </div>
              <h3 className="font-black text-base mb-1">{titulo}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary, #999)' }}>{desc}</p>
            </li>
          </FadeUp>
        ))}
      </ol>
    </>
  );
}

export default function LandingScreen({ isDark, toggleTheme, onIrAlPanel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Un solo listener para dos cosas que dependen del scroll: el fondo del
  // header sticky y la aparición del botón "volver arriba".
  //
  // El trabajo se agenda en un rAF y se compara contra el valor anterior
  // antes de tocar el estado: el evento de scroll dispara decenas de veces
  // por segundo, y llamar a setState en cada uno hacía re-render durante
  // todo el gesto — en mobile eso compite con el compositor y se ve como
  // franjas de contenido repetido mientras se desplaza.
  useEffect(() => {
    let pendiente = false;
    let ultimo = null;
    const evaluar = () => {
      pendiente = false;
      const ahora = window.scrollY > 320;
      if (ahora !== ultimo) {
        ultimo = ahora;
        setScrolled(ahora);
      }
    };
    const onScroll = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(evaluar);
    };
    evaluar();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Navegación al panel SIN recargar la página: onIrAlPanel usa pushState +
  // forceUrlRecheck (el mismo mecanismo que el resto de la app). El
  // window.location.href que había antes forzaba una recarga completa —
  // pantalla en blanco y splash de nuevo entre landing y login.
  const irAlPanel = onIrAlPanel || (() => { window.location.href = '/admin'; });

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Resuelve por popup (desktop) o navega por redirect (mobile). En
      // ambos casos Root.jsx toma el control vía onAuthStateChanged; acá
      // solo hay que pasar a /admin, que decide entre registro y panel.
      irAlPanel();
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

  // Botón oficial de Google (GIS): resuelve el login en la misma página, sin
  // la ventana intermedia del popup de Firebase. Google lo dibuja dentro de
  // un iframe propio, así que no se puede estilar con nuestro CSS — de ahí
  // que la apariencia se configure por parámetros en renderBotonGoogle.
  //
  // Mismo problema de fondo que ya se corrigió una vez: un componente
  // declarado DENTRO de LandingScreen es una función nueva en cada render
  // del padre, así que React lo trata como un tipo distinto y desmonta todo
  // lo de abajo — el iframe de Google incluido. Antes pasaba por los
  // callbacks inline; ahora volvía a pasar porque CtaGoogle en sí vivía acá
  // adentro: cualquier re-render de LandingScreen (por ejemplo el estado
  // `scrolled` en cada scroll) recreaba CtaGoogle y remontaba BotonGoogle,
  // que es justo el parpadeo entre "Continuar con Google" y "Continuar como
  // X" al recargar o scrollear. Se llama a BotonGoogle directo, sin wrapper.
  const ctaGoogleProps = {
    isDark,
    loading,
    onPopup: handleGoogle,
    onLogin: irAlPanel,
    onError: (err) => setError(err?.message || 'No se pudo iniciar sesión'),
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden"
      style={{ background: isDark ? '#040a14' : 'var(--surface-solid, #fff)', color: 'var(--text-primary)' }}>

      {/* Salto al contenido — invisible hasta que se navega con teclado.
          Sin esto, quien usa teclado o lector de pantalla tiene que pasar
          por el header entero en cada carga. */}
      <a href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:font-bold focus:text-sm"
        style={{ background: 'var(--brand-hex, #00B8D9)', color: '#fff' }}>
        Saltar al contenido
      </a>

      {/* Glow de marca — mismo lenguaje que AdminLogin/splash. */}
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
        height: '70%',
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.14), transparent)',
      }} />

      {/* ── Barra superior — sticky, pero fundida con el fondo mientras
          estás arriba: sin fondo ni borde propios (así el glow del hero se
          ve entero detrás). Recién al scrollear aparece el vidrio, que es
          cuando hace falta separarlo del contenido que pasa por debajo. ── */}
      <header
        className="sticky top-0 z-30 transition-all duration-300"
        style={scrolled ? {
          background: isDark ? 'rgba(4,10,20,.72)' : 'rgba(255,255,255,.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgb(var(--brand, 0 184 217) / 0.10)',
        } : { background: 'transparent', borderBottom: '1px solid transparent' }}
      >
        <div className="max-w-5xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <LogoFull size={26} />
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-10 h-10 rounded-full flex items-center justify-center text-ink-dim transition-colors hover:bg-brand/10 hover:text-brand"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* <button>, no <a>: un ancla arrastra el subrayado del navegador
                al activarse y además navegaba con recarga completa. Acá es
                una acción de la SPA, así que el elemento correcto es button. */}
            <button
              onClick={irAlPanel}
              className="text-sm font-bold px-4 py-2 rounded-xl transition-colors no-underline hover:bg-brand/10 hover:text-brand text-ink-dim"
            >
              Entrar
            </button>
          </div>
        </div>
      </header>

      <main id="contenido">
      {/* ── Hero ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 pt-6 pb-16 lg:pt-12 lg:pb-24">
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
              <BotonGoogle {...ctaGoogleProps} />
              {error && (
                <div role="alert" aria-live="polite"
                  className="mt-4 flex items-center gap-2 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-left">
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
          <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary, #999)' }}>
            No hace falta contratar a nadie ni saber de páginas web.
          </p>
        </FadeUp>
        <PasosCarrusel />
      </section>

      {/* ── Ventajas ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 py-14">
        <FadeUp>
          <h2 className="text-2xl lg:text-3xl font-black text-center mb-10">Todo lo que incluye</h2>
        </FadeUp>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, titulo, desc }, i) => (
            <FadeUp key={titulo} delay={i * 70}>
              <div className="h-full flex gap-4 rounded-3xl border p-5" style={CARD_TINTED}>
                <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgb(var(--brand, 0 184 217) / 0.14)' }}>
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
          <div className="relative overflow-hidden rounded-[2rem] border p-8 lg:p-12 text-center"
            style={{
              background: 'linear-gradient(165deg, rgb(var(--brand, 0 184 217) / 0.09), rgb(var(--brand, 0 184 217) / 0.02))',
              borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
            }}>
            <div className="absolute inset-x-0 top-0 h-40 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.16), transparent)' }} />
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
                      style={{ background: 'rgb(var(--brand, 0 184 217) / 0.18)' }}>
                      <Check className="w-2.5 h-2.5" style={{ color: 'var(--brand-hex, #00B8D9)' }} strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <BotonGoogle {...ctaGoogleProps} full={false} />
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
                <div className="rounded-2xl border overflow-hidden" style={CARD_TINTED}>
                  <button
                    onClick={() => setFaqOpen(abierto ? null : i)}
                    aria-expanded={abierto}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-brand/5"
                  >
                    <span className="font-bold text-sm">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${abierto ? 'rotate-180 text-brand' : 'text-ink-dim'}`} />
                  </button>
                  {/* grid-rows 0fr→1fr: transición de alto real sin medir el
                      contenido con JS ni fijar un max-height inventado. */}
                  <div className="grid transition-all duration-300 ease-out motion-reduce:transition-none"
                    style={{ gridTemplateRows: abierto ? '1fr' : '0fr' }}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm leading-relaxed pt-4"
                        style={{ color: 'var(--text-secondary, #999)', borderTop: '1px solid rgb(var(--brand, 0 184 217) / 0.12)' }}>
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

      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 mt-6" style={{ borderTop: '1px solid rgb(var(--brand, 0 184 217) / 0.12)' }}>
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

      {/* ── Volver arriba — aparece recién cuando ya scrolleaste lo
          suficiente como para que el header quede lejos. ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Volver arriba"
        className={`fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${scrolled ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'}`}
        style={{ background: 'var(--brand-hex, #00B8D9)', color: '#fff' }}
      >
        <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
