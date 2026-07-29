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
  ChevronLeft, ChevronRight, ArrowUpRight,
} from 'lucide-react';
import { signInWithGoogle, renderBotonGoogle, gisDisponible } from './firebase';
import { LogoFull, KtrlMark } from './Brand';
import { TIENDA_SLUG_FIJA } from './config/constants';
import { API_BASE } from './config/flags';

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

// Palabra que rota en el título del hero — mismo recurso que usa Shopify en
// su home ("Estrella de la IA" / "Marca reconocida" / "Imperio global"): da
// movimiento sin sumar una librería de animación, y de paso dice en tres
// palabras lo que el producto hace en vez de tener que explicarlo.
//
// El ancho se reserva con la palabra MÁS LARGA, renderizada invisible: sin
// eso el texto de al lado (y el punto final) saltaría en cada cambio.
// prefers-reduced-motion deja la primera palabra fija, sin ciclo.
// Todas arrancan sin preposición: el "en" queda fijo en el título y solo
// cambia lo que sigue, que es lo que hace legible el efecto.
const PALABRAS_HERO = ['un solo link', 'WhatsApp', 'Instagram', 'tu bio'];

function PalabraRotativa({ palabras = PALABRAS_HERO, intervalo = 2600 }) {
  const [i, setI] = useState(0);
  const [saliendo, setSaliendo] = useState(false);
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduce || palabras.length < 2) return undefined;
    const id = setInterval(() => {
      // Dos tiempos: primero sale la palabra actual, y recién cuando
      // terminó de irse entra la siguiente — si se cambia el índice de
      // una, las dos se cruzan a mitad de camino.
      setSaliendo(true);
      setTimeout(() => {
        setI((n) => (n + 1) % palabras.length);
        setSaliendo(false);
      }, 260);
    }, intervalo);
    return () => clearInterval(id);
  }, [palabras.length, intervalo, reduce]);

  const masLarga = palabras.reduce((a, b) => (b.length > a.length ? b : a), '');

  // El punto final viaja DENTRO de este componente, pegado a la palabra: si
  // queda afuera, la reserva de ancho (que mide la palabra más larga) lo
  // empuja lejos y con las palabras cortas se ve un punto flotando solo.
  return (
    <span className="relative inline-grid align-bottom">
      {/* Reserva de ancho: ocupa lugar en el layout pero no se ve. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap">{masLarga}.</span>
      <span
        className="col-start-1 row-start-1 whitespace-nowrap justify-self-start motion-reduce:transition-none"
        style={{
          transition: 'opacity 240ms ease, transform 240ms ease',
          opacity: saliendo ? 0 : 1,
          transform: saliendo ? 'translateY(-0.35em)' : 'translateY(0)',
        }}
      >
        <span style={{ color: 'var(--brand-hex, #00B8D9)' }}>{palabras[i]}</span>.
      </span>
    </span>
  );
}

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
  const marcoRef = useRef(null);
  const [gisListo, setGisListo] = useState(false);
  // Sólo press: el hover es indetectable con el iframe encima (ver abajo).
  const [apretado, setApretado] = useState(false);

  // El iframe de Google se traga TODOS los eventos de puntero (probado:
  // pointer*/mouse* no llegan al marco ni en fase de captura, ni a
  // document; y al ser otro origen tampoco se puede mirar adentro). O sea
  // que el hover es imposible de detectar.
  //
  // Pero al presionarlo, el iframe toma el foco, y ESO sí se ve desde acá:
  // window dispara 'blur' con document.activeElement === el iframe. Es
  // justo el gesto que importa en mobile, así que alcanza para que el
  // botón visible reaccione al tocarlo en vez de sentirse muerto.
  useEffect(() => {
    const alPerderFoco = () => {
      const dentro = slotRef.current?.contains(document.activeElement);
      if (document.activeElement?.tagName === 'IFRAME' && dentro) {
        setApretado(true);
        // No hay un evento de "soltó": el foco se queda en el iframe
        // mientras se abre el sheet. Se suelta solo, con la duración de un
        // press normal.
        setTimeout(() => setApretado(false), 220);
      }
    };
    window.addEventListener('blur', alPerderFoco);
    return () => window.removeEventListener('blur', alPerderFoco);
  }, []);

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
        {/* Google NO permite desactivar el botón personalizado: no hay campo
            en IdConfiguration ni en GsiButtonConfiguration para forzar el
            texto genérico cuando hay sesión (verificado en la referencia de
            la API). Su botón SIEMPRE va a pasar de "Continuar con Google" a
            "Continuar como X" cuando resuelve la sesión, y ese salto es
            visible sí o sí mientras su botón sea el que se ve.

            Así que su botón no se ve nunca: va encima con opacity:0,
            recibiendo el click real — lo que mantiene el sheet nativo sin
            ventana intermedia — y debajo se ve SIEMPRE el nuestro, que no
            cambia de texto ni parpadea porque no depende del estado de
            sesión. Sin fundido cruzado, sin capa que aparezca y desaparezca.

            Contra: es una técnica que la doc de Google no cubre (ni la
            recomienda ni la prohíbe), así que depende de que su iframe siga
            siendo clickeable por encima. Si algún día dejara de funcionar,
            onPopup sigue como respaldo en el mismo botón. */}
        {/* El feedback (hover/press) lo maneja el efecto de arriba por
            posición del puntero, no :hover/:active de CSS: el iframe de
            Google está encima capturando el puntero y, al ser otro
            documento, esos estados nunca llegan a este contenedor. */}
        <div
          ref={marcoRef}
          className="relative lok-gbtn lok-tap"
          style={{
            width: BTN_W + 2,
            height: 42,
            borderRadius: 21,
            background: isDark
              ? 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.16), rgb(var(--brand, 0 184 217) / 0.04))'
              : 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.12), rgb(var(--brand, 0 184 217) / 0.03))',
            border: '1px solid rgb(var(--brand, 0 184 217) / 0.22)',
            boxShadow: apretado
              ? '0 3px 12px -6px rgb(var(--brand, 0 184 217) / 0.8)'
              : '0 6px 22px -10px rgb(var(--brand, 0 184 217) / 0.55)',
            transform: apretado ? 'scale(0.975)' : 'scale(1)',
            transition: 'transform 120ms ease, box-shadow 200ms ease',
          }}
        >
          {/* Lo que el usuario ve: nuestro botón, con el pill, el logo
              multicolor y el texto de Google. Estable de punta a punta.
              onClick queda como respaldo — si GIS cargó, el click nunca
              llega acá porque lo intercepta la capa de arriba. */}
          <button
            type="button"
            onClick={onPopup}
            disabled={loading}
            className="absolute inset-0 flex items-center justify-center gap-2.5 font-medium text-[15px] overflow-hidden"
            style={{
              borderRadius: 20,
              background: isDark ? '#fff' : '#131314',
              color: isDark ? '#1f1f1f' : '#e3e3e3',
              filter: apretado ? 'brightness(0.92)' : 'none',
              transition: 'filter 160ms ease',
            }}
          >
            {loading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <GoogleIcon size={18} />}
            Continuar con Google
          </button>

          {/* El botón real de Google: invisible pero clickeable, encima de
              todo. aria-hidden no: sigue siendo el control que recibe el
              click, y su iframe trae su propia accesibilidad. El nuestro de
              abajo queda como respaldo visual y de teclado. */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: 0 }}
          >
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

// Vista previa de la tienda REAL, no una reinterpretación.
//
// Antes acá había un mockup dibujado a mano: primero un teléfono de 248px
// con emojis, después una versión "minimalista" con degradados de colores en
// lugar de fotos. Las dos tenían el mismo problema de fondo — mostraban una
// idea de tienda, no la tienda. Alguien que evalúa el producto necesita ver
// lo que va a tener, con fotos de verdad, portada, perfil y publicaciones.
//
// TiendaPublica es el MISMO componente que sirve /:slug en público, así que
// lo que se ve acá es literalmente el producto funcionando, con los datos de
// la tienda de ejemplo (TIENDA_SLUG_FIJA, que es la que la raíz servía antes
// de que existiera esta landing).
//
// Colapsada se recorta a una altura fija y se le pone un degradado abajo:
// deja ver la portada, el perfil y las primeras publicaciones sin ocupar
// toda la pantalla. Expandida ocupa el viewport completo, con la tienda
// entera scrolleable y todo interactivo.
// Inclinación 3D siguiendo al puntero — el bloque entero (la tienda y sus
// cards flotantes) se mueve como una pieza sólida en el espacio, no como
// una imagen plana. Es puro CSS transform: sin librerías y compositable.
//
// En táctil funciona igual manteniendo el dedo apoyado, y se endereza al
// soltar. rAF para no recalcular más veces que frames pinta el navegador.
function useInclinacion3D(ref, { max = 7 } = {}) {
  const [tilt, setTilt] = useState(null); // null = en reposo, sin transform
  const rafRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const mover = (clientX, clientY) => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const r = el.getBoundingClientRect();
        // -0.5..0.5 desde el centro del bloque
        const px = (clientX - r.left) / r.width - 0.5;
        const py = (clientY - r.top) / r.height - 0.5;
        // El eje X se invierte: mover el puntero hacia ARRIBA tiene que
        // levantar el borde de arriba, no hundirlo.
        setTilt({ rx: -py * max * 2, ry: px * max * 2 });
      });
    };

    const onMouseMove = (e) => mover(e.clientX, e.clientY);
    const onTouchMove = (e) => { const t = e.touches[0]; if (t) mover(t.clientX, t.clientY); };
    const soltar = () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      setTilt(null);
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', soltar);
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', soltar);
    el.addEventListener('touchcancel', soltar);
    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', soltar);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', soltar);
      el.removeEventListener('touchcancel', soltar);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ref, max]);

  return tilt;
}

function TiendaPreview({ onVer }) {
  const cajaRef = useRef(null);
  const escenaRef = useRef(null);
  const tilt = useInclinacion3D(escenaRef);
  // Datos reales de la tienda de ejemplo para la card del hero: su portada,
  // su nombre y sus publicaciones con las fotos de verdad.
  //
  // La card NO monta TiendaPublica: ese componente se dibuja con 100dvh y
  // gestiona su propio scroll — está hecho para SER la página, no para
  // anidarse. Recortado en un contenedor de 340px no llega a dibujarse, y
  // dentro de un modal su contenido queda fuera de vista. Acá se leen los
  // mismos datos y se arma la muestra; el botón lleva a la tienda de verdad,
  // en su propia URL y con el "atrás" del navegador para volver.
  const [tienda, setTienda] = useState(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [tRes, oRes] = await Promise.all([
          fetch(`${API_BASE}/tiendas-crud?slug=${TIENDA_SLUG_FIJA}`),
          fetch(`${API_BASE}/ofertas?slug=${TIENDA_SLUG_FIJA}`),
        ]);
        if (!vivo || !tRes.ok) return;
        const t = await tRes.json();
        const ofertas = oRes.ok ? await oRes.json() : [];
        if (!vivo) return;
        setTienda({ ...t, ofertas: (Array.isArray(ofertas) ? ofertas : []).filter(o => o.activa !== false).slice(0, 2) });
      } catch { /* sin datos se muestra el esqueleto, no rompe la landing */ }
    })();
    return () => { vivo = false; };
  }, []);

  return (
    /* Contenedor sin recorte: las cards flotantes se salen del borde de la
       tienda a propósito (es lo que las hace leer como una capa por encima
       y no como parte del contenido). overflow-hidden vive en la caja de
       adentro, que sí necesita recortar la muestra.
       La perspectiva va acá y el giro en el hijo: así todo el conjunto
       —tienda y cards— se inclina como una sola pieza sólida. */
    /* En mobile la tienda se achica (86% del ancho) y queda centrada: sin
       ese margen las cards flotantes no tienen a dónde salirse y se leen
       como parte del contenido en vez de como una capa por encima. */
    <div ref={escenaRef} className="relative w-[86%] mx-auto sm:w-full" style={{ perspective: 1100 }}>
      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: tilt
            ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            : 'rotateX(0deg) rotateY(0deg)',
          // Vuelve al reposo con calma; mientras sigue al puntero la
          // transición es corta para que no se sienta con retardo.
          transition: tilt ? 'transform 120ms ease-out' : 'transform 600ms cubic-bezier(.22,1,.36,1)',
        }}
      >
      <div ref={cajaRef} className="relative rounded-3xl overflow-hidden border shadow-lg"
        style={{ borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)', background: 'rgb(var(--surface-dim, 245 245 245))' }}>
        {/* Muestra con los datos reales: portada, nombre y dos
            publicaciones con sus fotos. pointer-events:none porque no se
            navega desde acá — el clic lo toma el botón de abajo. */}
        <div style={{ height: 340, overflow: 'hidden', pointerEvents: 'none' }}>
          {/* Portada */}
          <div className="relative" style={{ height: 108, background: 'rgb(var(--brand, 0 184 217) / 0.18)' }}>
            {tienda?.galeria?.[0] && (
              <img src={tienda.galeria[0]} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            )}
          </div>

          {/* Identidad — sólo el LOGO se monta sobre el banner (margin
              negativo propio); el texto queda por debajo del corte de la
              foto, sobre el fondo de la card. Antes el bloque entero subía
              -26px y el nombre caía justo en el borde del banner, cortado a
              la mitad y sin contraste. */}
          <div className="relative z-10 px-4 flex items-end gap-3">
            <div className="w-14 h-14 rounded-2xl border-2 shadow-lg overflow-hidden shrink-0 flex items-center justify-center"
              style={{ borderColor: 'var(--surface-solid, #fff)', background: 'var(--surface-solid, #fff)', marginTop: -28 }}>
              {tienda?.foto
                ? <img src={tienda.foto} alt="" className="w-full h-full object-cover" />
                : <Store className="w-6 h-6" style={{ color: 'var(--brand-hex, #00B8D9)' }} />}
            </div>
            {/* El texto va sobre la superficie de la card, no sobre la foto:
                así se lee igual sin importar qué colores tenga la portada. */}
            <div className="min-w-0 py-2">
              <p className="font-black text-sm leading-tight truncate">{tienda?.nombre || 'Tu negocio'}</p>
              <p className="text-[11px] text-ink-dim truncate">{tienda?.ciudad || 'Tu ciudad'}</p>
            </div>
          </div>

          {/* Publicaciones reales */}
          <div className="px-4 pt-3 grid grid-cols-2 gap-3">
            {(tienda?.ofertas?.length ? tienda.ofertas : [null, null]).map((o, i) => (
              <div key={o?.id || i} className="min-w-0 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/10 bg-surface-card">
                <div className="relative w-full" style={{ aspectRatio: '1 / 1.414', background: 'rgb(var(--brand, 0 184 217) / 0.07)' }}>
                  {(o?.thumbUrl || o?.imageUrl) && (
                    <img src={o.thumbUrl || o.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
                {o?.nombre && <p className="px-2 py-1.5 text-[11px] font-bold text-center truncate">{o.nombre}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgb(var(--surface-dim, 245 245 245)) 32%, transparent)' }} />

        {/* Lleva a la tienda de ejemplo real, en su propia URL. Es
            navegación interna de la SPA (pushState, ver onVerEjemplo en
            Root): no abre pestaña ni recarga la página, y el "atrás" del
            navegador vuelve a la landing. */}
        <button
          onClick={onVer}
          className="lok-tap absolute inset-x-0 bottom-0 pt-10 pb-4 flex items-end justify-center"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full shadow-md"
            style={{ background: 'var(--brand-hex, #00B8D9)', color: '#fff' }}>
            Ver la tienda completa
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* ── Cards de interfaz flotando sobre la tienda ──
          La muestra de arriba dice cómo SE VE la página; estas dos dicen
          para qué sirve — que alguien la encuentra y que esa visita se
          convierte en una consulta. Son piezas reales del producto (el
          contador del panel y una consulta de WhatsApp), recortadas y
          superpuestas: el recurso que usa Shopify para que se lea "producto
          funcionando" sin montar un mockup entero.

          En mobile también se ven: la tienda se achica al 86% del ancho
          para dejarles lugar donde salirse sin taparla. */}
      <div aria-hidden="true"
        className="z-20 flex items-center gap-2 absolute -right-8 sm:-right-6 lg:-right-10 top-[14%] rounded-2xl px-3 py-2 lg:px-3.5 lg:py-2.5 shadow-xl border lok-flota"
        style={{
          background: 'var(--surface-solid, #fff)',
          borderColor: 'rgb(var(--brand, 0 184 217) / 0.16)',
          animationDelay: '0s',
        }}>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgb(var(--brand, 0 184 217) / 0.12)' }}>
          <BarChart3 className="w-4 h-4" style={{ color: 'var(--brand-hex, #00B8D9)' }} />
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-black tabular-nums">248</span>
          <span className="block text-[10px] text-ink-dim">visitas esta semana</span>
        </span>
      </div>

      <div aria-hidden="true"
        className="z-20 flex items-center gap-2 absolute -left-8 sm:-left-6 lg:-left-10 bottom-[30%] rounded-2xl px-3 py-2 lg:px-3.5 lg:py-2.5 shadow-xl border lok-flota"
        style={{
          background: 'var(--surface-solid, #fff)',
          borderColor: 'rgb(var(--brand, 0 184 217) / 0.16)',
          animationDelay: '1.4s',
        }}>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(37,211,102,.14)' }}>
          <MessageSquare className="w-4 h-4" style={{ color: '#25D366' }} />
        </span>
        <span className="leading-tight">
          <span className="block text-[11px] font-bold">Nueva consulta</span>
          <span className="block text-[10px] text-ink-dim">«¿Hasta qué hora abren?»</span>
        </span>
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
            className="lok-tap w-8 h-8 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
            style={{ background: 'rgb(var(--brand, 0 184 217) / 0.12)', color: 'var(--brand-hex, #00B8D9)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {PASOS.map((p, i) => (
              <button key={p.titulo} onClick={() => irA(i)} aria-label={`Ir al paso ${i + 1}`}
                className="lok-tap h-1.5 rounded-full transition-all"
                style={{
                  width: i === idx ? 20 : 6,
                  background: i === idx ? 'var(--brand-hex, #00B8D9)' : 'rgb(var(--brand, 0 184 217) / 0.25)',
                }} />
            ))}
          </div>
          <button onClick={() => irA(Math.min(PASOS.length - 1, idx + 1))} disabled={idx === PASOS.length - 1}
            aria-label="Paso siguiente"
            className="lok-tap w-8 h-8 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
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

export default function LandingScreen({ isDark, toggleTheme, onIrAlPanel, onVerEjemplo }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [faqOpen, setFaqOpen] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  // Cuánto del footer ya entró en pantalla: es lo que el botón flotante
  // tiene que levantarse para no taparlo (ver el efecto de scroll).
  const [topeFooter, setTopeFooter] = useState(0);
  const footerRef = useRef(null);

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
    let ultimoTope = null;
    const evaluar = () => {
      pendiente = false;
      const ahora = window.scrollY > 320;
      if (ahora !== ultimo) {
        ultimo = ahora;
        setScrolled(ahora);
      }
      // El botón flotante se apoya sobre el footer en vez de taparlo:
      // mientras el footer no entró en pantalla su tope es el borde
      // inferior del viewport (offset 0); cuando entra, se levanta lo
      // mismo que el footer ya subió. Al volver a scrollear hacia arriba
      // baja solo, porque el cálculo es la posición real del footer.
      const f = footerRef.current;
      if (f) {
        const invadido = window.innerHeight - f.getBoundingClientRect().top;
        const tope = Math.max(0, invadido);
        if (tope !== ultimoTope) {
          ultimoTope = tope;
          setTopeFooter(tope);
        }
      }
    };
    const onScroll = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(evaluar);
    };
    evaluar();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
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
    <div className="lok-app-surface relative min-h-screen overflow-x-hidden"
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
            {/* El toggle de tema NO va acá: ya vive en el footer, y en el
                header competía con "Entrar", que es la única acción que
                importa arriba. El tema no es una decisión que alguien toma
                al llegar, es un ajuste que busca cuando le molesta — y para
                eso el footer alcanza.

                "Entrar" lleva fondo y borde propios EN REPOSO, no sólo en
                hover: sin contorno se leía como texto suelto sobre el fondo,
                no como un control. Mismo lenguaje que la cápsula del botón
                de Google y las cards (turquesa a baja opacidad), sólo que
                más tenue por ser secundario.

                <button>, no <a>: un ancla arrastra el subrayado del
                navegador al activarse y además navegaba con recarga
                completa. Acá es una acción de la SPA. */}
            <button
              onClick={irAlPanel}
              className="lok-tap lok-chip-btn text-sm font-bold px-4 py-2 rounded-xl no-underline hover:text-brand text-ink-dim"
              style={{
                // Borde sólo en dark: sobre el fondo casi negro el relleno
                // al 7% no alcanza a definir la forma. En light el fondo ya
                // se ve solo y el borde sumaba ruido.
                background: `rgb(var(--brand, 0 184 217) / ${isDark ? 0.09 : 0.08})`,
                border: isDark ? '1px solid rgb(var(--brand, 0 184 217) / 0.18)' : '1px solid transparent',
              }}
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
                <span className="whitespace-nowrap">en <PalabraRotativa /></span>
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
          {/* Una sola vista para los dos tamaños: se ajusta al ancho que
              tenga disponible, igual que la tienda real. En desktop es la
              columna de al lado; en mobile queda debajo del CTA, sin
              empujarlo fuera de pantalla y sin ocupar todo el alto como el
              teléfono de 248px que había antes. */}
          <FadeUp delay={200}>
            <TiendaPreview onVer={onVerEjemplo} />
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

      {/* ── FAQ ── (antes del cierre: las dudas se resuelven ANTES de pedir
          la decisión, no después. Quien llega hasta acá con una objeción sin
          responder no va a bajar a leerla si primero le mostrás el CTA.) */}
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
                    /* rounded-2xl propio: sin él, el fondo de :active del
                       navegador se pintaba como un rectángulo recto que
                       asomaba fuera de las esquinas de la card al tocar.
                       lok-tap saca el resaltado azul de selección y el menú
                       contextual del long-press (ver components.css). */
                    className="lok-tap w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-brand/5 rounded-2xl"
                  >
                    <span className="font-bold text-sm">{item.q}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${abierto ? 'rotate-180 text-brand' : 'text-ink-dim'}`} />
                  </button>
                  {/* grid-rows 0fr→1fr: transición de alto real sin medir el
                      contenido con JS ni fijar un max-height inventado.

                      Mismo tratamiento que las secciones de LegalPages: la
                      transición va SÓLO en grid-template-rows (con "all" el
                      navegador vigila toda la caja, que además recorta) y el
                      contenido pasa a visibility:hidden al cerrar. Con
                      grid-rows en 0fr el texto mide cero pero el motor de
                      pintado lo sigue dibujando, y al scrollear lo arrastra
                      como texto fantasma. */}
                  <div className="grid motion-reduce:transition-none"
                    style={{
                      gridTemplateRows: abierto ? '1fr' : '0fr',
                      transition: 'grid-template-rows 300ms ease-out',
                      contain: 'paint',
                    }}>
                    <div className="overflow-hidden"
                      style={{
                        visibility: abierto ? 'visible' : 'hidden',
                        transition: abierto ? 'visibility 0s' : 'visibility 0s linear 300ms',
                      }}>
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

      {/* ── Precio — cierre de la página ──
          Sin cifras: el precio depende del rubro y lo va a fijar el admin
          general, así que publicar un número acá sería prometer algo que
          todavía no está definido (y quedaría desincronizado del panel).
          Se comunica lo único que hoy es cierto y verificable: la prueba
          gratis y que no hay permanencia. */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 py-14">
        <FadeUp>
          {/* El glow va como capa del propio background, no como un <div>
              absoluto recortado por overflow-hidden: esa combinación obliga
              a Chrome Android a recortar el degradado contra las esquinas
              redondeadas en cada frame del scroll, y ahí deja texto fantasma
              (ver el mismo caso en Highlight de LegalPages). */}
          <div className="rounded-[2rem] border p-8 lg:p-12 text-center"
            style={{
              background: `
                radial-gradient(ellipse 60% 160px at 50% 0%, rgb(var(--brand, 0 184 217) / 0.16), transparent),
                linear-gradient(165deg, rgb(var(--brand, 0 184 217) / 0.09), rgb(var(--brand, 0 184 217) / 0.02))
              `,
              borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
            }}>
            <div>
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

      </main>

      {/* ── Footer ── */}
      {/* El glow desde el borde superior separa el footer mejor que la línea
          de 1px que había antes: es el mismo recurso de la card de precio,
          así que el corte se lee como parte del lenguaje de la página y no
          como un divisor genérico. La línea queda, pero muy tenue, sólo para
          rematar el borde del degradado. */}
      {/* Glow como capa del background, no como <div> absoluto con
          overflow-hidden — ver el comentario en la card de precio. */}
      <footer ref={footerRef} className="relative z-10 mt-6"
        style={{
          borderTop: '1px solid rgb(var(--brand, 0 184 217) / 0.10)',
          background: 'radial-gradient(ellipse 70% 128px at 50% 0%, rgb(var(--brand, 0 184 217) / 0.12), transparent)',
        }}>
        {/* Mobile: tres filas centradas — (1) los dos logos enfrentados como
            en el footer de tienda, (2) el copyright, (3) los legales.
            Desktop: esas mismas tres piezas en una fila, con los legales al
            centro y cada logo en su extremo.

            El grid de 3 columnas (1fr auto 1fr) en vez de space-between hace
            que los legales queden centrados respecto al footer entero, sin
            depender de que ambos logos midan lo mismo — el mismo criterio
            que el footer de tienda. */}
        <div className="relative max-w-5xl mx-auto px-5 lg:px-8 py-8">
          {/* Fila 1 (mobile) / columnas laterales (desktop) */}
          {/* Fila de logos: LOKAL · toggle de tema · KTRL. El grid de 3
              columnas (1fr auto 1fr) deja el toggle VERDADERAMENTE centrado
              sin importar cuánto midan los logos a los costados — mismo
              criterio que el footer de tienda, donde con space-between el
              centro dependía de que ambos lados pesaran igual. */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4">
            <div className="justify-self-start">
              <LogoFull size={22} />
            </div>

            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="lok-tap lok-chip-btn justify-self-center w-[30px] h-[30px] rounded-[10px] inline-flex items-center justify-center text-ink hover:text-brand"
              style={{
                background: `rgb(var(--brand, 0 184 217) / ${isDark ? 0.09 : 0.08})`,
                border: isDark ? '1px solid rgb(var(--brand, 0 184 217) / 0.18)' : '1px solid transparent',
              }}
            >
              {isDark ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
            </button>

            {/* KTRL con el mismo color que el logo LOKAL (text-ink-dim), no
                al 50% como antes: son las dos marcas de la misma fila y una
                se veía notoriamente más apagada que la otra. */}
            <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
              className="lok-tap justify-self-end inline-flex items-center gap-1.5 text-ink-dim hover:text-brand transition-colors">
              <span className="text-[10px] font-semibold">Creado por</span>
              <KtrlMark style={{ height: 11, color: 'currentColor' }} />
            </a>
          </div>

          {/* Copyright + legales en la MISMA fila — antes iban en dos
              bloques apilados (mt-5 y mt-4) que estiraban el footer sin
              necesidad. En pantallas angostas vuelven a apilarse solos por
              el flex-wrap, con los legales primero (son lo accionable). */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <nav className="order-1 sm:order-2 flex items-center gap-5 text-xs font-semibold"
              style={{ color: 'var(--text-secondary, #999)' }}>
              <a href="/terminos-y-condiciones" className="lok-tap lok-link-btn hover:text-brand">Términos</a>
              <a href="/politica-de-privacidad" className="lok-tap lok-link-btn hover:text-brand">Privacidad</a>
              <a href="/condiciones-para-comercios" className="lok-tap lok-link-btn hover:text-brand">Comercios</a>
            </nav>
            <p className="order-2 sm:order-1 text-center text-[10px]" style={{ color: 'var(--text-secondary, #999)' }}>
              © {new Date().getFullYear()} LOKAL. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* ── Volver arriba — aparece recién cuando ya scrolleaste lo
          suficiente como para que el header quede lejos. ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Volver arriba"
        className={`lok-tap fixed right-5 z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-opacity duration-300 ${scrolled ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{
          background: 'var(--brand-hex, #00B8D9)',
          color: '#fff',
          // 20px del borde inferior, más lo que el footer haya subido: así
          // se apoya sobre el footer en vez de taparlo, y vuelve solo al
          // borde cuando se scrollea hacia arriba. Sin transición en bottom
          // (seguiría al scroll con retraso); la que queda es la de opacidad.
          bottom: 20 + topeFooter,
        }}
      >
        <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
