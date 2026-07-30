import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Store, Shield, FileText, ShoppingBag, ChevronDown, Sun, Moon, Heart, Instagram, Smartphone, Palette, Unlock, Eye, X, Scale } from 'lucide-react';
import { useSheetOpen } from './tienda-publica/hooks/useSheetOpen.js';
import { LogoFull, KtrlMark } from './Brand';

// Mismo tratamiento de card que la landing (CARD_TINTED en LandingScreen):
// una pizca de turquesa de marca en fondo y borde. Los tokens globales son
// gris neutro a propósito (index.css §4) y acá dejaban las cards apagadas.
const CARD_TINTED = {
  background: 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.055), rgb(var(--brand, 0 184 217) / 0.015))',
  borderColor: 'rgb(var(--brand, 0 184 217) / 0.14)',
};

// ─── LegalLayout — wrapper reutilizable para todas las páginas legales ────────
// actualizado: la fecha estaba escrita a mano en el layout, así que las
// tres páginas decían lo mismo aunque se editara sólo una. Ahora la declara
// cada documento; si no la pasa, no se muestra la línea.
// Nav y footer compartidos: los usan tanto las páginas legales (a través de
// LegalLayout) como "Quiénes somos", que tiene cuerpo propio pero mismo
// marco. Extraídos para no duplicarlos entre los dos layouts.
// Misma aparición al entrar en viewport que FadeUp en LandingScreen.jsx —
// no se importa de ahí porque ese archivo no lo exporta y es un componente
// chico; copiarlo evita acoplar dos pantallas que no tienen por qué
// depender una de la otra.
function FadeUpLegal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
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
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : 'translateY(16px)',
      }}
    >
      {children}
    </div>
  );
}

function MarcoNav({ onBack }) {
  return (
    <nav className="sticky top-0 z-50 bg-surface-card/85 backdrop-blur border-b border-slate-100 dark:border-white/8">
      <div className="max-w-5xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="lok-tap ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <LogoFull size={26} />
        <div className="w-10 shrink-0" aria-hidden="true" />
      </div>
    </nav>
  );
}

// Sheet con los 3 documentos legales, disparado desde el link "Legal" del
// footer. Antes cada uno tenía su propio link ahí: con "Quiénes somos"
// sumado eran 4, y en mobile el wrap dejaba el último ("Comercios") solo en
// su fila, descentrado. Agruparlos acá deja el footer en una fila prolija
// en cualquier ancho.
function LegalSheet({ open, onClose, onElegir }) {
  const { mounted, visible } = useSheetOpen(open, 220, onClose);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!mounted) return null;

  const DOCS = [
    { page: 'terminos', label: 'Términos y Condiciones' },
    { page: 'privacidad', label: 'Política de Privacidad' },
    { page: 'comercios', label: 'Condiciones para Comercios' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4700, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <style>{`
        .lok-sheet-ov { opacity: 0; transition: opacity 220ms ease; }
        .lok-sheet-ov.in { opacity: 1; }
        .lok-sheet-panel { transform: translateY(100%); transition: transform 220ms cubic-bezier(.22,1,.36,1); }
        .lok-sheet-panel.in { transform: translateY(0); }
      `}</style>
      <div onClick={onClose} className={`lok-sheet-ov ${visible ? 'in' : ''}`} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div className={`lok-sheet-panel ${visible ? 'in' : ''}`} style={{
        position: 'relative', background: 'var(--surface-solid, #fff)', borderRadius: '20px 20px 0 0',
        maxWidth: 480, margin: '0 auto', width: '100%', boxShadow: '0 -8px 30px rgba(0,0,0,.15)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgb(var(--brand, 0 184 217) / 0.2)', margin: '10px auto 4px' }} />
        <div className="flex items-center gap-2.5 px-5 pt-2 pb-3" style={{ borderBottom: '1px solid rgb(var(--brand, 0 184 217) / 0.1)' }}>
          <Scale className="w-[18px] h-[18px]" style={{ color: 'var(--brand-hex, #00B8D9)' }} />
          <h3 className="flex-1 font-black text-[15px] m-0">Documentos legales</h3>
          <button onClick={onClose} aria-label="Cerrar" className="lok-tap w-8 h-8 rounded-lg grid place-items-center shrink-0"
            style={{ background: 'rgb(var(--brand, 0 184 217) / 0.08)', color: 'var(--text-secondary, #999)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2.5 pb-5">
          {DOCS.map((d) => (
            <button key={d.page} onClick={() => onElegir(d.page)}
              className="lok-tap w-full text-left px-3.5 py-3 rounded-xl font-semibold text-sm hover:text-brand"
              style={{ color: 'var(--text-primary)' }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarcoFooter() {
  const [legalSheetOpen, setLegalSheetOpen] = useState(false);
  return (
    <footer className="relative"
      style={{
        borderTop: '1px solid rgb(var(--brand, 0 184 217) / 0.10)',
        background: 'radial-gradient(ellipse 70% 128px at 50% 0%, rgb(var(--brand, 0 184 217) / 0.12), transparent)',
      }}>
      <div className="relative max-w-5xl mx-auto px-5 lg:px-8 py-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4">
          <div className="justify-self-start">
            <LogoFull size={22} />
          </div>

          <button
            onClick={temaLegal.toggleTheme}
            aria-label={temaLegal.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="lok-tap lok-chip-btn justify-self-center w-[30px] h-[30px] rounded-[10px] inline-flex items-center justify-center text-ink hover:text-brand"
            style={{
              background: `rgb(var(--brand, 0 184 217) / ${temaLegal.isDark ? 0.09 : 0.08})`,
              border: temaLegal.isDark ? '1px solid rgb(var(--brand, 0 184 217) / 0.18)' : '1px solid transparent',
            }}
          >
            {temaLegal.isDark ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
          </button>

          {/* text-ink, no text-ink-dim: KTRL quedaba gris y apagado al lado
              del logo LOKAL, que es negro/blanco pleno en la misma fila. */}
          <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
            className="lok-tap justify-self-end inline-flex items-center gap-1.5 text-ink hover:text-brand transition-colors">
            <span className="text-[10px] font-semibold">Creado por</span>
            <KtrlMark style={{ height: 11, color: 'currentColor' }} />
          </a>
        </div>

        {/* Copyright + legales en la misma fila (mt-4, no dos bloques
            apilados con mt-5/mt-4 separados): con los links agrupados
            detrás de "Legal" el bloque quedó angosto, y separarlo en dos
            filas con aire propio acentuaba la sensación de espacio de
            sobra contra la fila ancha de logos. */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <p className="order-2 text-center text-[10px]" style={{ color: 'var(--text-secondary, #999)' }}>
            © {new Date().getFullYear()} LOKAL. Todos los derechos reservados.
          </p>
          <nav className="order-1 flex items-center justify-center gap-x-5 text-xs font-semibold"
            style={{ color: 'var(--text-secondary, #999)' }}>
            <button onClick={() => navigateLegal('nosotros')} className="lok-tap lok-link-btn hover:text-brand">Quiénes somos</button>
            <button onClick={() => setLegalSheetOpen(true)} className="lok-tap lok-link-btn hover:text-brand">Legal</button>
          </nav>
        </div>
      </div>

      <LegalSheet
        open={legalSheetOpen}
        onClose={() => setLegalSheetOpen(false)}
        onElegir={(page) => { setLegalSheetOpen(false); navigateLegal(page); }}
      />
    </footer>
  );
}

// Título y descripción propios del documento, restaurados al desmontar.
// Compartido por los dos layouts.
function useMetaPropio(title, subtitle) {
  useEffect(() => {
    const tituloPrevio = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const descPrevia = meta?.getAttribute('content');

    document.title = `${title} — LOKAL`;
    if (meta && subtitle) meta.setAttribute('content', subtitle);

    return () => {
      document.title = tituloPrevio;
      if (meta && descPrevia) meta.setAttribute('content', descPrevia);
    };
  }, [title, subtitle]);
}

function LegalLayout({ title, subtitle, icon: Icon, children, onBack, actualizado }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sin esto las páginas heredaban los meta de index.html (los de la
  // landing), así que compartir el link de Términos en WhatsApp mostraba
  // "Tu negocio en un solo link".
  useMetaPropio(title, subtitle);

  // lok-app-surface: mismo tratamiento táctil que landing y login (sin
  // selección de texto ni menú contextual en los controles); el texto legal
  // sí se puede seleccionar, ver .lok-selectable más abajo.
  //
  // El fondo va por token y no con la clase sa-page-bg: esa vive dentro de
  // un <style> de StoreApp.jsx, que no se monta en estas páginas — el fondo
  // quedaba oscuro en modo claro y el título salía negro sobre negro.
  return (
    <div className="lok-app-surface min-h-screen text-ink"
      style={{ background: 'rgb(var(--surface-dim, 245 245 245))' }}>
      <MarcoNav onBack={onBack} />

      {/* Hero del documento */}
      <div className="border-b border-slate-100 dark:border-white/8 px-6 py-14 text-center"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.09), transparent)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgb(var(--brand, 0 184 217) / 0.14)' }}>
          {Icon && <Icon className="w-7 h-7" style={{ color: 'var(--brand-hex, #00B8D9)' }} />}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-3">{title}</h1>
        {subtitle && <p className="text-ink-dim text-base max-w-xl mx-auto">{subtitle}</p>}
        {actualizado && <p className="text-ink-dim text-xs mt-4">Última actualización: {actualizado}</p>}
      </div>

      {/* Contenido — space-y-3 en vez de space-y-10: ahora son cards de
          acordeón pegadas entre sí como el FAQ, no bloques sueltos de texto
          que necesitaban aire para separarse. La selección de texto se
          habilita adentro de cada sección (ver Section), no acá: los
          títulos son controles y no deberían seleccionarse al tocarlos. */}
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-3">
        {children}
      </div>

      <MarcoFooter />
    </div>
  );
}

// Función global para navegar entre páginas legales (se pisa desde el componente padre)
let navigateLegal = () => {};
// Tema — lo mismo que navigateLegal: lo escribe LegalPageView en cada render
// y lo lee el footer, sin pasar props por las tres páginas intermedias.
const temaLegal = { isDark: false, toggleTheme: () => {} };

// ─── Sección de contenido ─────────────────────────────────────────────────────
// Cada sección es un acordeón, igual que las preguntas frecuentes de la
// landing: un documento legal es una lista de temas que se consultan de a
// uno, no un texto que se lee de corrido. Colapsadas, los títulos funcionan
// como índice y se ve la estructura completa de un vistazo, en vez de una
// pared de texto de varias pantallas de alto.
//
// abiertaPorDefecto: la primera de cada documento arranca abierta, para que
// no parezca que la página no cargó.
function Section({ title, children, abiertaPorDefecto = false }) {
  const [abierta, setAbierta] = useState(abiertaPorDefecto);
  // Capa de compositing propia MIENTRAS anima, igual que FadeUp en la
  // landing. Sin esto, animar grid-template-rows con un overflow-hidden
  // anidado deja texto fantasma en varias posiciones al scrollear en Chrome
  // Android: el layout ya cambió pero la capa compuesta previa no se
  // descarta a tiempo. Se apaga en onTransitionEnd para no dejar capas GPU
  // acumuladas en todo el documento (Privacidad tiene 9 secciones).
  const [animando, setAnimando] = useState(false);
  return (
    <section className="rounded-2xl border overflow-hidden" style={CARD_TINTED}>
      <button
        onClick={() => { setAnimando(true); setAbierta((v) => !v); }}
        aria-expanded={abierta}
        // rounded propio: sin él el fondo de :active del navegador se pinta
        // recto y asoma fuera de las esquinas de la card (mismo detalle que
        // ya se corrigió en el acordeón de la landing).
        className="lok-tap w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-brand/5 rounded-2xl"
      >
        <h2 className="text-base sm:text-lg font-black text-ink">{title}</h2>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${abierta ? 'rotate-180 text-brand' : 'text-ink-dim'}`} />
      </button>
      {/* grid-rows 0fr→1fr: anima el alto real sin medir con JS ni fijar un
          max-height inventado.

          transition SÓLO en grid-template-rows, no transition-all: con "all"
          el navegador vigila todas las propiedades de una caja que además
          recorta con overflow-hidden, y termina recomponiendo el bloque
          entero en cada frame del scroll — de ahí el texto fantasma. Se nota
          sobre todo en la sección 1, que arranca abierta y es la más larga.

          contain:paint aísla el repintado a esta caja: lo de adentro no
          puede pintar fuera, así que el navegador no necesita reevaluar el
          resto del documento cuando esto cambia. */}
      <div className="grid motion-reduce:transition-none"
        onTransitionEnd={() => setAnimando(false)}
        style={{
          gridTemplateRows: abierta ? '1fr' : '0fr',
          transition: 'grid-template-rows 300ms ease-out',
          willChange: animando ? 'grid-template-rows' : 'auto',
          contain: 'paint',
        }}>
        {/* visibility:hidden al cerrar — el fantasma aparecía justamente con
            la sección COLAPSADA y se iba al abrirla: con grid-rows en 0fr el
            contenido mide cero pero sigue siendo visible para el motor de
            pintado, así que Chrome lo seguía dibujando y lo arrastraba al
            scrollear. visibility lo saca del pintado sin sacarlo del layout,
            así que la animación de alto sigue funcionando igual.

            El delay al abrir es 0 (tiene que verse mientras crece) y al
            cerrar espera los 300ms de la animación, para no cortar el texto
            de golpe apenas se toca. */}
        <div className="overflow-hidden"
          style={{
            transform: 'translateZ(0)',
            visibility: abierta ? 'visible' : 'hidden',
            transition: abierta ? 'visibility 0s' : 'visibility 0s linear 300ms',
          }}>
          <div className="lok-selectable px-5 pb-5 pt-4 space-y-3 text-ink-dim text-sm leading-relaxed"
            style={{ borderTop: '1px solid rgb(var(--brand, 0 184 217) / 0.12)' }}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

// Destacado — mismo recurso que la card de precio de la landing: glow desde
// el borde superior sobre fondo teñido, en vez de un bloque plano. Es lo
// primero que se lee de cada documento, así que conviene que se distinga de
// las secciones colapsables sin gritar.
function Highlight({ children }) {
  return (
    // El glow va como una capa MÁS del background propio, no como un <div>
    // absoluto con overflow-hidden encima. Esa combinación —degradado en
    // capa absoluta, recortado por un contenedor con overflow-hidden y
    // border-radius— obliga a Chrome Android a recortar el degradado contra
    // las esquinas en cada frame del scroll, y ahí lo arrastra: es el texto
    // fantasma que se veía sobre el primer desplegable, justo debajo.
    //
    // Con dos backgrounds superpuestos el resultado visual es el mismo y no
    // hay nada que recortar: el fondo ya respeta el border-radius solo.
    <div className="lok-selectable rounded-2xl border px-5 py-4 text-sm leading-relaxed text-ink"
      style={{
        background: `
          radial-gradient(ellipse 70% 80px at 50% 0%, rgb(var(--brand, 0 184 217) / 0.14), transparent),
          linear-gradient(165deg, rgb(var(--brand, 0 184 217) / 0.10), rgb(var(--brand, 0 184 217) / 0.025))
        `,
        borderColor: 'rgb(var(--brand, 0 184 217) / 0.20)',
      }}>
      {children}
    </div>
  );
}

function Warning({ children }) {
  return (
    <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl px-5 py-4 text-amber-200 text-sm leading-relaxed">
      {children}
    </div>
  );
}

function List({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="text-emerald-500 font-bold mt-0.5 shrink-0">—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TÉRMINOS Y CONDICIONES
// ═══════════════════════════════════════════════════════════════════════════════
function TerminosPage({ onBack }) {
  return (
    <LegalLayout
      title="Términos y Condiciones"
      subtitle="Lo que necesitás saber antes de usar Lokal. Sin letra chica."
      icon={FileText}
      actualizado="abril 2026"
      onBack={onBack}
    >
      <Highlight>
        <strong>Lo más importante primero:</strong> LOKAL te da una página web para tu negocio. No vendemos, no cobramos por vos y no intervenimos en lo que arreglás con tus clientes. Te damos la vidriera y el link; la venta la hacés vos, por donde quieras.
      </Highlight>

      <Section title="1. Qué es LOKAL" abiertaPorDefecto>
        <p>
          LOKAL LINKS es un servicio que te permite armar la página pública de tu negocio y compartirla con un link propio. Publicás lo que ofrecés, elegís cómo se ve la página y la difundís por WhatsApp, Instagram o donde te sirva.
        </p>
        <p>
          No somos un marketplace: no procesamos pagos, no gestionamos envíos, no almacenamos inventario y no somos parte de ningún acuerdo entre vos y quien te contacta. Tus clientes te escriben a vos y arreglan con vos.
        </p>
      </Section>

      <Section title="2. Quiénes pueden usar la plataforma">
        <List items={[
          'Para crear una tienda hay que ser mayor de 18 años y tener una cuenta de Google.',
          'Crear la tienda es gratis y viene con un período de prueba; para seguir publicada después hace falta una suscripción activa.',
          'Visitar la página de una tienda no requiere registro: cualquiera puede entrar con el link.',
          'Al usar LOKAL aceptás estos términos. Si lo hacés en nombre de un negocio, los aceptás también en nombre de ese negocio.',
        ]} />
      </Section>

      <Section title="3. Qué podés hacer en LOKAL">
        <p><strong className="text-ink">Como dueño de una tienda:</strong> armar tu página pública, publicar lo que ofrecés con foto y datos, elegir el color y las secciones de la página, recibir consultas de clientes y ver estadísticas básicas de visitas.</p>
        <p><strong className="text-ink">Como visitante:</strong> entrar a la página de una tienda con su link, ver lo que publica y contactarla por los medios que el negocio haya cargado.</p>
      </Section>

      <Section title="4. Lo que está prohibido">
        <List items={[
          'Publicar información falsa, engañosa o que induzca a error.',
          'Utilizar la plataforma para fines ilegales o contrarios a la moral.',
          'Hacer spam, automatizar interacciones o manipular el sistema.',
          'Publicar contenido discriminatorio, violento o que vulnere derechos de terceros.',
          'Intentar acceder a datos de otros usuarios sin autorización.',
          'Revender acceso a la plataforma o compartir credenciales de cuenta.',
        ]} />
      </Section>

      <Section title="5. Limitación de responsabilidad">
        <Warning>
          LOKAL no verifica ni garantiza la información que cada negocio publica en su página. La decisión de contactar, contratar o acordar con un negocio es exclusivamente de quien lo hace.
        </Warning>
        <p>
          En ningún caso LOKAL será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso de la plataforma, incluyendo pero no limitado a: pérdidas económicas, incumplimiento de acuerdos privados entre un negocio y sus clientes, o productos y servicios que no cumplan expectativas.
        </p>
        <p>
          El servicio se ofrece "tal como está" y puede presentar interrupciones ocasionales por mantenimiento o causas fuera de nuestro control.
        </p>
      </Section>

      <Section title="6. Contenido publicado por los usuarios">
        <p>
          El contenido que publicás en Lokal (texto, imágenes, videos) sigue siendo tuyo. Sin embargo, al publicarlo nos otorgás una licencia no exclusiva para mostrarlo dentro de la plataforma a otros usuarios y comercios.
        </p>
        <p>
          Nos reservamos el derecho de moderar, editar o eliminar cualquier contenido que viole estos términos, sin necesidad de previo aviso.
        </p>
      </Section>

      <Section title="7. Cuentas y acceso">
        <List items={[
          'Sos responsable de mantener la seguridad de tu cuenta.',
          'Si detectamos uso no autorizado, podemos suspender el acceso temporalmente.',
          'Podemos cerrar cuentas que violen estos términos de manera reiterada o grave.',
          'Podés solicitar la eliminación de tu cuenta en cualquier momento escribiendo a hola@lokal.com.ar.',
        ]} />
      </Section>

      <Section title="8. Modificaciones">
        <p>
          Podemos actualizar estos términos cuando sea necesario. Si los cambios son significativos, te lo vamos a comunicar. El uso continuado de la plataforma después de cualquier modificación implica aceptación de los nuevos términos.
        </p>
      </Section>

      <Section title="9. Ley aplicable">
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Para cualquier disputa, las partes se someten a la jurisdicción de los tribunales ordinarios competentes.
        </p>
        <p>
          Si tenés dudas o consultas, escribinos a <strong className="text-ink">hola@lokal.com.ar</strong>.
        </p>
      </Section>
    </LegalLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLÍTICA DE PRIVACIDAD
// ═══════════════════════════════════════════════════════════════════════════════
function PrivacidadPage({ onBack }) {
  return (
    <LegalLayout
      title="Política de Privacidad"
      subtitle="Tus datos son tuyos. Te explicamos qué usamos y para qué."
      icon={Shield}
      actualizado="abril 2026"
      onBack={onBack}
    >
      <Highlight>
        Lokal cumple con la Ley 25.326 de Protección de Datos Personales de la República Argentina. Nunca vendemos tus datos. Solo los usamos para que la plataforma funcione mejor para vos.
      </Highlight>

      <Section title="1. Qué datos recolectamos" abiertaPorDefecto>
        <p><strong className="text-ink">Datos de cuenta (vía Google):</strong> nombre, dirección de email y foto de perfil. No almacenamos contraseñas.</p>
        <p><strong className="text-ink">Datos de tu negocio:</strong> lo que cargás en tu página — nombre, descripción, contacto, horarios, ubicación y lo que publicás. Es información pensada para ser pública: cualquiera con el link puede verla.</p>
        <p><strong className="text-ink">Datos de uso:</strong> visitas a tu página y consultas recibidas, para armar las estadísticas que ves en tu panel.</p>
        <p><strong className="text-ink">Datos técnicos:</strong> dirección IP, tipo de dispositivo y navegador, para seguridad y funcionamiento del servicio.</p>
        <p><strong className="text-ink">Preferencias locales:</strong> guardamos en tu dispositivo datos como el tema visual elegido. Esa información no se comparte con terceros.</p>
        <p><strong className="text-ink">Ubicación:</strong> si cargás la dirección de tu negocio para mostrarla en el mapa de tu página, ese dato es público por decisión tuya.</p>
        <p><strong className="text-ink">Imágenes y archivos:</strong> fotos que subís a tu página o enviás en una conversación.</p>
      </Section>

      <Section title="2. Para qué usamos tus datos">
        <List items={[
          'Identificarte como dueño de tu tienda y mantener tu sesión activa.',
          'Publicar tu página y mostrarla a quien entre con tu link.',
          'Armar las estadísticas de visitas que ves en tu panel.',
          'Mejorar el funcionamiento y la experiencia de la plataforma.',
          'Comunicarnos con vos si hay algo importante sobre tu cuenta o tu suscripción.',
          'Detectar y prevenir usos fraudulentos o abusivos.',
        ]} />
        <p className="mt-3">
          <strong className="text-ink">No usamos tus datos para:</strong> publicidad de terceros, venta a otras empresas, ni perfilado comercial.
        </p>
      </Section>

      <Section title="3. Con quién compartimos tus datos">
        <p>
          No compartimos datos personales identificables con terceros, salvo en los siguientes casos:
        </p>
        <List items={[
           'Proveedores de infraestructura técnica necesarios para el funcionamiento (Firebase de Google para autenticación, Cloudflare para almacenamiento de archivos y Mercado Pago para procesar pagos de suscripciones de comercios). Estos servicios tienen sus propias políticas de privacidad.',
          'Cuando la ley lo requiera expresamente, por orden judicial u obligación legal.',
          'En caso de fusión o adquisición de Lokal, con aviso previo a los usuarios.',
        ]} />
      </Section>

      <Section title="4. Tus derechos (Ley 25.326)">
        <p>Como titular de tus datos tenés derecho a:</p>
        <List items={[
          'Acceder a los datos que tenemos sobre vos.',
          'Solicitar la rectificación de datos incorrectos.',
          'Solicitar la eliminación de tus datos ("derecho al olvido").',
          'Oponerte al tratamiento de tus datos en ciertos casos.',
        ]} />
        <p className="mt-3">
          Para ejercer cualquiera de estos derechos, escribinos a <strong className="text-ink">hola@lokal.com.ar</strong> con el asunto "Datos personales". Respondemos en un plazo máximo de 10 días hábiles.
        </p>
        <p>
          El organismo de control en Argentina es la <strong className="text-ink">Agencia de Acceso a la Información Pública (AAIP)</strong>, ante quien podés presentar una denuncia si considerás que tus derechos no fueron respetados.
        </p>
      </Section>

      <Section title="5. Cookies y tecnologías similares">
        <p>
          Usamos cookies estrictamente necesarias para el funcionamiento de la sesión. También usamos almacenamiento local del navegador para preferencias de usuario, como el modo oscuro/claro y configuraciones del mapa. No usamos cookies de seguimiento ni publicidad.
        </p>
        <p>
          Firebase Authentication (Google) puede usar cookies propias para mantener tu sesión. Podés consultar la política de privacidad de Google para más detalle.
        </p>
      </Section>

      <Section title="6. Retención de datos">
        <p>
          Tus datos se conservan mientras tu cuenta esté activa. Si solicitás la eliminación de tu cuenta, borramos tus datos personales en un plazo máximo de 30 días, salvo obligación legal de conservarlos por más tiempo.
        </p>
        <p>
          Las visitas e interacciones eliminadas pueden conservarse de manera anonimizada para fines estadísticos.
        </p>
      </Section>

      <Section title="7. Seguridad">
        <p>
          Implementamos medidas técnicas razonables para proteger tus datos: conexiones HTTPS, almacenamiento seguro en proveedores certificados y acceso restringido. Sin embargo, ningún sistema es 100% seguro — si detectás algo sospechoso, avisanos.
        </p>
      </Section>

      <Section title="8. Contacto">
        <p>
          Responsable del tratamiento de datos: <strong className="text-ink">Lokal</strong><br />
          Correo de contacto: <strong className="text-ink">hola@lokal.com.ar</strong>
        </p>
        <p>
          Si operás pagos con una integración activa, Mercado Pago actúa como proveedor independiente de servicios de pago y procesa los datos estrictamente necesarios para cobrar la suscripción correspondiente.
        </p>
      </Section>
    </LegalLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONDICIONES PARA COMERCIOS
// ═══════════════════════════════════════════════════════════════════════════════
function ComerciosPage({ onBack }) {
  return (
    <LegalLayout
      title="Condiciones para Comercios"
      subtitle="Todo lo que necesitás saber como tienda registrada en Lokal."
      icon={ShoppingBag}
      actualizado="abril 2026"
      onBack={onBack}
    >
      <Highlight>
        Al registrar tu comercio en Lokal aceptás estas condiciones específicas, que complementan los Términos y Condiciones generales. El punto clave: vos sos responsable de lo que publicás y ofrecés.
      </Highlight>

      <Section title="1. Tu rol en la plataforma" abiertaPorDefecto>
        <p>
          Como negocio registrado en LOKAL, sos un participante independiente. Te damos la página y el link para que te encuentren, pero <strong className="text-ink">no somos tu empleador, franquiciante ni socio comercial</strong>. Las condiciones de cada venta o acuerdo son responsabilidad tuya.
        </p>
        <Warning>
          Lokal no garantiza ventas, clientes o conversiones. La plataforma es una herramienta de contacto — los resultados dependen de la propuesta de valor de tu negocio.
        </Warning>
      </Section>

      <Section title="2. Responsabilidad sobre el contenido">
        <p>
          Todo lo que publicás en Lokal — mensajes, precios, fotos, videos, descripciones — es tu responsabilidad exclusiva. Eso incluye:
        </p>
        <List items={[
          'Que la información sea veraz y actualizada.',
          'Que los precios sean reales y no engañosos.',
          'Que las imágenes correspondan al producto o servicio que ofrecés.',
          'Que estés en condiciones legales de vender lo que ofrecés.',
          'Cumplir con las normas de defensa del consumidor vigentes (Ley 24.240).',
        ]} />
      </Section>

      <Section title="3. Conductas prohibidas">
        <p>Como comercio, no podés:</p>
        <List items={[
          'Publicar precios falsos o "gancho" que no representen la oferta real.',
          'Ofrecer productos o servicios que no tenés disponibles.',
          'Usar imágenes que no corresponden a tu stock real.',
          'Publicar contenido engañoso que induzca al usuario a un error.',
          'Ofrecer bienes o servicios de procedencia ilegal o ilícita.',
          'Contactar usuarios fuera de la plataforma para evadir el sistema.',
          'Crear múltiples cuentas para manipular el sistema o el feed.',
          'Publicar spam, mensajes masivos o respuestas automatizadas.',
        ]} />
      </Section>

      <Section title="4. Derecho de Lokal a moderar contenido">
        <Warning>
          Lokal puede eliminar, editar o suspender cualquier publicación, respuesta o perfil de comercio que viole estas condiciones, sin necesidad de previo aviso y sin derecho a compensación por parte del comercio afectado.
        </Warning>
        <p>
          Las causas de moderación incluyen —pero no se limitan a—: contenido engañoso, reportes de usuarios, inconsistencias detectadas por el equipo de Lokal, o incumplimiento de la normativa vigente.
        </p>
        <p>
          Si tu cuenta es suspendida por incumplimiento grave, no tenés derecho a devolución del período de suscripción restante.
        </p>
      </Section>

      <Section title="5. Calidad de lo que publicás">
        <p>
          Lo que aparece en tu página tiene que reflejar lo que realmente ofrecés. Publicaciones desactualizadas o engañosas afectan a quien te contacta y pueden derivar en la suspensión de tu cuenta.
        </p>
        <List items={[
          'Mantené al día lo que publicás: sacá o marcá como vencido lo que ya no ofrecés.',
          'Incluí información útil y veraz: precio, condiciones, formas de contacto.',
          'Respondé las consultas que recibas en un plazo razonable.',
          'No uses el chat para publicitar cosas ajenas a tu negocio.',
        ]} />
      </Section>

      <Section title="6. Suscripción y acceso">
        <p>
          Crear tu tienda es gratis e incluye un período de prueba con todo habilitado. Para que tu página siga publicada después hace falta una suscripción activa. Si vence:
        </p>
        <List items={[
          'Tu página deja de estar visible para quien entre con el link.',
          'Tus datos y publicaciones se conservan: no se borra nada.',
          'Podés renovar cuando quieras y tu página vuelve a publicarse tal como estaba.',
        ]} />
        <p>
          El precio depende del rubro y del plan. LOKAL se reserva el derecho de modificar los planes con un aviso razonable a las tiendas activas.
        </p>
      </Section>

      <Section title="7. Relación con tus clientes">
        <p>
          Lo que acordás con quien te contacta a través de tu página es un contrato privado entre vos y esa persona. LOKAL no es parte de ese acuerdo, no procesa el pago ni tiene responsabilidad sobre su cumplimiento.
        </p>
        <p>
          Si alguien reporta un problema con tu negocio, podemos ponernos en contacto para escuchar tu versión. En casos de incumplimiento reiterado o grave, podemos suspender tu acceso a la plataforma.
        </p>
      </Section>

      <Section title="8. Aviso legal">
        <p>
          Esta sección complementa los Términos y Condiciones generales. En caso de contradicción, prevalece la interpretación más protectora para los usuarios finales y la plataforma.
        </p>
        <p>
          Consultas o reclamos de comercios: <strong className="text-ink">tiendas@lokal.com.ar</strong>
        </p>
      </Section>
    </LegalLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — renderiza la página legal correcta
// ═══════════════════════════════════════════════════════════════════════════════

// "Quiénes somos" vive con las legales y no en el header a propósito: quien
// llega a la landing es un dueño de negocio evaluando una herramienta, y esa
// pregunta la busca DESPUÉS de que le interesó el producto, no antes. En el
// header competiría con "Entrar", que es la única acción que importa arriba.
//
// Pero el LAYOUT es propio, no el de las legales: un documento se consulta
// (por eso las secciones son acordeones, un índice colapsado), mientras que
// "quiénes somos" se LEE de corrido y quiere transmitir algo — necesita el
// mismo tipo de composición que la landing (hero, cards con FadeUp, la
// persona real visible de entrada) en vez de esconder todo detrás de
// desplegables.
//
// El contenido dice sólo lo que es verificable hoy: quién lo hace, por qué,
// y qué se puede esperar. Sin métricas inventadas ni "miles de comercios
// confían en nosotros" — el producto recién arranca y una cifra falsa se
// nota más que no tener ninguna.
function NosotrosPage({ onBack }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  useMetaPropio('Quiénes somos', 'Quién está detrás de LOKAL y para qué lo hicimos.');

  const PILARES = [
    { icon: Smartphone, titulo: 'Se usa solo', desc: 'Si necesitás que alguien te lo configure, fallamos. Todo se carga y se edita desde el celular.' },
    { icon: Palette, titulo: 'Es tu página', desc: 'Elegís el color y el orden. Nuestra marca aparece al pie y nada más — no es nuestra publicidad.' },
    { icon: Unlock, titulo: 'No te ata', desc: 'Sin comisión por lo que vendés, sin permanencia. Te quedás porque sirve, no porque no podés irte.' },
    { icon: Eye, titulo: 'Sin humo', desc: 'Preferimos decirte que algo todavía no está antes que prometerlo. Lo que ves es lo que hay.' },
  ];

  return (
    <div className="lok-app-surface min-h-screen text-ink"
      style={{ background: 'rgb(var(--surface-dim, 245 245 245))' }}>
      <MarcoNav onBack={onBack} />

      {/* ── Hero — mismo lenguaje que el de la landing: glow radial de
          fondo, badge, título grande. Acá el badge dice de dónde viene el
          producto en vez de un beneficio, que es lo que corresponde en una
          página que se trata de identidad y no de conversión. ── */}
      <section className="relative px-6 pt-16 pb-14 text-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.12), transparent)' }}>
        <FadeUpLegal>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: 'rgb(var(--brand, 0 184 217) / 0.12)', color: 'var(--brand-hex, #00B8D9)' }}>
            <Heart className="w-3.5 h-3.5" />
            Hecho en Bovril, Entre Ríos
          </span>
        </FadeUpLegal>
        <FadeUpLegal delay={80}>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] mb-4 max-w-2xl mx-auto">
            Le damos vidriera a los negocios que no tienen una
          </h1>
        </FadeUpLegal>
        <FadeUpLegal delay={160}>
          <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--text-secondary, #999)' }}>
            En los pueblos hay muchísimos comercios buenos sin dónde mostrar lo que venden. Contratar una página web no es una opción realista para la mayoría — por eso hicimos LOKAL.
          </p>
        </FadeUpLegal>
      </section>

      <div className="max-w-3xl mx-auto px-6 pb-4 space-y-14">

        {/* ── La persona, arriba y visible — no en un acordeón al fondo. ── */}
        <FadeUpLegal>
          <div className="rounded-3xl border p-6 sm:p-8 flex flex-col sm:flex-row gap-5 sm:items-center" style={CARD_TINTED}>
            <span className="w-20 h-20 rounded-3xl shrink-0 flex items-center justify-center mx-auto sm:mx-0"
              style={{
                background: 'var(--brand-hex, #00B8D9)', color: '#fff', fontSize: 32, fontWeight: 900,
                boxShadow: '0 6px 20px rgb(var(--brand, 0 184 217) / 0.4)',
              }}>
              K
            </span>
            <div className="text-center sm:text-left">
              <p className="font-black text-xl leading-tight">Katriel Martínez</p>
              <p className="text-sm font-bold mb-2" style={{ color: 'var(--brand-hex, #00B8D9)' }}>Diseño y desarrollo — KTRL</p>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary, #999)' }}>
                Armo y mantengo LOKAL de punta a punta. Trabajo con comercios de la zona, así que los problemas que resuelve la app son los que veo de cerca todos los días — no los que supongo desde afuera. Si escribís por algo, me llega a mí.
              </p>
              <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold rounded-lg px-2.5 py-1.5 no-underline"
                style={{ background: 'rgb(var(--brand, 0 184 217) / 0.10)', color: 'var(--brand-hex, #00B8D9)' }}>
                <Instagram className="w-3.5 h-3.5" />
                @katriel.martinez
              </a>
            </div>
          </div>
        </FadeUpLegal>

        {/* ── Por qué existe ── */}
        <FadeUpLegal>
          <div>
            <h2 className="text-2xl font-black text-center mb-6">Por qué existe LOKAL</h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary, #999)' }}>
              <p>
                Un comercio de barrio compite hoy con negocios que tienen web, catálogo online y presencia en redes. No porque vendan mejor, sino porque se los encuentra más fácil.
              </p>
              <p>
                La opción que quedaba era publicar fotos sueltas en el estado de WhatsApp o en una historia que se borra en 24 horas. Cada cliente que pregunta "¿tenés tal cosa?" o "¿hasta qué hora abrís?" es una venta que cuesta más trabajo de lo que debería.
              </p>
              <p>
                LOKAL LINKS es la respuesta simple a eso: una página con tus cosas, tu horario y tu ubicación, en un link que compartís donde quieras.
              </p>
            </div>
          </div>
        </FadeUpLegal>

        {/* ── Qué nos importa — grilla de cards, como "Todo lo que incluye"
            de la landing, en vez de una lista dentro de un acordeón. ── */}
        <FadeUpLegal>
          <div>
            <h2 className="text-2xl font-black text-center mb-6">Qué nos importa</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {PILARES.map(({ icon: Icon, titulo, desc }) => (
                <div key={titulo} className="rounded-2xl border p-5 flex gap-3.5" style={CARD_TINTED}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgb(var(--brand, 0 184 217) / 0.14)' }}>
                    <Icon className="w-5 h-5" style={{ color: 'var(--brand-hex, #00B8D9)' }} strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm mb-1">{titulo}</h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary, #999)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeUpLegal>

        {/* ── Hacia dónde va ── */}
        <FadeUpLegal>
          <div className="rounded-3xl border p-6 sm:p-8" style={CARD_TINTED}>
            <h2 className="text-xl font-black mb-3 text-center">Hacia dónde va</h2>
            <div className="space-y-3 text-sm leading-relaxed text-center max-w-lg mx-auto" style={{ color: 'var(--text-secondary, #999)' }}>
              <p>
                LOKAL LINKS es la primera pieza de algo más grande: que los comercios de una misma zona se puedan descubrir entre sí, y que un vecino encuentre lo que busca cerca sin depender de que ya conozca el negocio.
              </p>
              <p>
                No ponemos fechas — preferimos sacar cada cosa cuando funcione de verdad. Lo que sí podemos decir es que todo lo que agreguemos va a seguir la misma regla: que lo puedas usar solo, desde el celular, sin complicarte.
              </p>
            </div>
          </div>
        </FadeUpLegal>

        {/* ── Contacto — cierre, como el CTA de precio de la landing. ── */}
        <FadeUpLegal>
          <div className="text-center py-4">
            <h2 className="text-xl font-black mb-2">¿Tenés una duda o una idea?</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary, #999)' }}>
              Escribinos. Nos llega directo y contestamos.
            </p>
            <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
              className="lok-tap inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold no-underline"
              style={{ background: 'var(--brand-hex, #00B8D9)', color: '#fff' }}>
              <Instagram className="w-4 h-4" />
              Escribir en Instagram
            </a>
          </div>
        </FadeUpLegal>
      </div>

      <MarcoFooter />
    </div>
  );
}

export default function LegalPageView({ page, onNavigate, onBack, isDark, toggleTheme }) {
  // Expone la navegación y el tema al LegalLayout, que está tres niveles más
  // abajo. Mismo mecanismo que ya usaba navigateLegal, para no enhebrar las
  // mismas props por las tres páginas del documento.
  navigateLegal = onNavigate;
  temaLegal.isDark = isDark;
  temaLegal.toggleTheme = toggleTheme;

  if (page === 'terminos')   return <TerminosPage   onBack={onBack} />;
  if (page === 'privacidad') return <PrivacidadPage onBack={onBack} />;
  if (page === 'comercios')  return <ComerciosPage  onBack={onBack} />;
  if (page === 'nosotros')   return <NosotrosPage   onBack={onBack} />;
  return null;
}
