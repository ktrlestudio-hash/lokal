/**
 * OfertaIndividual — vista pública de UNA oferta (/:tienda/o/:oferta).
 *
 * Es el "home de tienda simplificado": mismo pipeline de tema/color que
 * TiendaPublicaRenderer (deriveColorPalette + clase .dark), y reusa LITERAL
 * los componentes del home (TiendaFooter, TiendaNavBar, ShareSheet) para que
 * NO haya divergencia de diseño. En vez de las secciones/catálogo, el cuerpo
 * es una foto grande de la oferta con zoom (lightbox inline, sin deps).
 *
 * El hero es la versión COMPACTA: franja de color de marca (no la foto de
 * galería) con fundido mask-image + card flotante (logo/nombre/estado/WA),
 * igual que el LOKAL LINKS viejo, más un botón "atrás" que vuelve a la tienda.
 *
 * La ruta la sirve el mismo link que comparte WhatsApp/FB: el SSR (oferta-ssr)
 * responde a los crawlers con OG meta tags y redirige a los humanos a esta
 * vista React.
 */
import React, { useState, useLayoutEffect, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Clock, Share2 } from 'lucide-react';
import { deriveColorPalette, resolvePagina, getEstadoApertura } from './utils.js';
import { TiendaFooter } from './sections/TiendaFooter.jsx';
import { TiendaNavBar } from './sections/TiendaNavBar.jsx';
import { ShareSheet } from './sections/ShareSheet.jsx';
import { HorariosSheet } from './sections/HorariosSheet.jsx';
import { MapaModal } from './sections/MapaSection.jsx';
import { usePhotoSwipe, PhotoSwipeStyles, PhotoSwipeOverlay } from './hooks/usePhotoSwipe.jsx';
import { trackPageview, trackClick, trackCompartir } from './track.js';
import { FONT } from './tokens.js';

const F = { fontFamily: FONT.family };

// Símbolo LOKAL (mismo path que usa el hero del template y el viejo).
function LogoSymbolSvg({ size = 30, color = '#fff' }) {
  return (
    <svg viewBox="0 0 81.18 81.44" width={size} height={size} fill={color} aria-hidden="true">
      <circle cx="40.72" cy="40.65" r="11.23" />
      <path d="M62.52,7.66c6.08,0,11,4.93,11,11v44.12c0,6.08-4.93,11-11,11H18.66c-6.08,0-11-4.93-11-11V18.66c0-6.08,4.93-11,11-11h43.86M62.52,0H18.66C8.37,0,0,8.37,0,18.66v44.12c0,10.29,8.37,18.66,18.66,18.66h43.86c10.29,0,18.66-8.37,18.66-18.66V18.66c0-10.29-8.37-18.66-18.66-18.66h0Z" />
    </svg>
  );
}

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width={17} height={17}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

export function OfertaIndividual({ tienda, oferta, isDark, toggleTheme, onVolver, onNavegarAOferta }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [horariosOpen, setHorariosOpen] = useState(false);
  const [mapaOpen, setMapaOpen] = useState(false);

  // Swipe horizontal entre ofertas de la MISMA tienda, en loop infinito
  // (última → primera y viceversa) — SOLO disponible cuando llegamos por un
  // clic interno en la tienda (onNavegarAOferta viene de Root.jsx únicamente
  // en ese caso, ver comentario ahí). Un link directo de WhatsApp/FB no
  // tiene la lista completa de ofertas de la tienda en memoria — ahí el
  // gesto simplemente no se habilita (swipeNav queda null).
  const ofertasHermanas = tienda.ofertas || [];
  const swipeNav = useMemo(() => {
    if (!onNavegarAOferta || ofertasHermanas.length < 2) return null;
    const idx = ofertasHermanas.findIndex((o) => o.id === oferta.id);
    if (idx === -1) return null;
    const total = ofertasHermanas.length;
    return {
      anterior: () => onNavegarAOferta(ofertasHermanas[(idx - 1 + total) % total]),
      siguiente: () => onNavegarAOferta(ofertasHermanas[(idx + 1) % total]),
    };
  }, [onNavegarAOferta, ofertasHermanas, oferta.id]);

  // Estado abierto/cerrado para el sheet de horarios (mismo cálculo que el
  // hero de la tienda, vía getEstadoApertura).
  const { abierta, texto } = getEstadoApertura(tienda.horarios);

  const pagina = useMemo(() => resolvePagina(tienda.pagina), [tienda]);
  const dark = isDark;

  // Mismo mecanismo que TiendaPublicaRenderer: setea los --tp-* en <html> y
  // la clase .dark, para que el tema/color sea idéntico al home.
  useLayoutEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('dark', dark);
    const vars = deriveColorPalette(pagina.color, dark, pagina.colorSecundario);
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    return () => Object.keys(vars).forEach((k) => el.style.removeProperty(k));
  }, [pagina.color, pagina.colorSecundario, dark]);

  const wa = (tienda.whatsapp || '').replace(/\D/g, '');
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Carrusel deslizante entre ofertas hermanas — MISMO patrón que el
  // .nov-track de DISTRIBUIDORA QR 2.0 (referencia de diseño del
  // ecosistema, public/index.html):
  //
  //   .nov-track { display:flex; transition: transform .35s cubic-bezier(.4,0,.2,1); touch-action:pan-y }
  //   .nov-slide { min-width:100% }
  //   track.style.transform = 'translateX(-' + (idx*100) + '%)'
  //
  // La clave está en que el track NO lleva width propio: se estira solo por
  // el flex y cada slide vale min-width:100% del contenedor, así el
  // translateX en % se resuelve limpio (un intento previo con width:300%
  // rompía justamente eso — el % del transform se calcula contra el ancho
  // del PROPIO elemento, así que movía 3 slots de más y las fotos
  // desaparecían de pantalla).
  //
  // Acá se suma el arrastre en vivo: mientras el dedo se mueve, el track lo
  // sigue en px (sin transition), y al soltar vuelve la transition para que
  // termine el recorrido — las fotos vecinas se ven entrando/saliendo de
  // verdad, no un fundido.
  const touchStartRef = useRef(null);
  const swipeAxisRef = useRef(null);
  const pistaRef = useRef(null);
  const [arrastreX, setArrastreX] = useState(0);   // px que el dedo lleva movidos
  const [arrastrando, setArrastrando] = useState(false); // sin transition mientras dura
  // El gesto pasa por distancia O por velocidad, lo que ocurra primero: con
  // solo distancia (60px) el carrusel se sentía duro, había que arrastrar
  // medio ancho de pantalla para que cediera. Un flick corto y rápido —
  // como el que se hace sin pensar — ahora también cuenta.
  const SWIPE_THRESHOLD = 40;      // px de arrastre para cambiar de oferta
  const SWIPE_VELOCIDAD = 0.35;    // px/ms: un flick rápido pasa aunque sea corto

  // Índice LOCAL de la oferta visible. Cambiarlo mueve el track al instante,
  // sin remontar nada; la URL se sincroniza aparte (ver efecto más abajo)
  // para no acoplar la animación a la navegación.
  const idxInicial = Math.max(0, ofertasHermanas.findIndex((o) => o.id === oferta.id));
  const [idxVisible, setIdxVisible] = useState(idxInicial);

  // Si la oferta llega cambiada desde afuera (link directo, botón atrás del
  // navegador), el índice local se realinea.
  useEffect(() => { setIdxVisible(idxInicial); }, [oferta.id]);

  const ofertaVisible = ofertasHermanas[idxVisible] || oferta;

  // Zoom de la foto — MISMO usePhotoSwipe (y mismo diseño de overlay: X
  // arriba-izq, lupa arriba-der) que el banner/logo del hero de tienda.
  // Se arma con la foto VISIBLE (no la de props): si el usuario ya pasó a
  // otra oferta con el swipe, el zoom debe abrir esa, no la original.
  const imgVisible = ofertaVisible.imageUrl || ofertaVisible.thumbUrl;
  const zoomOferta = usePhotoSwipe(imgVisible ? [imgVisible] : []);

  // La URL sigue al índice, no al revés: el deslizamiento ya ocurrió cuando
  // esto corre. Se salta el primer render (la URL ya es la correcta al
  // montar).
  const primerRenderRef = useRef(true);
  useEffect(() => {
    if (primerRenderRef.current) { primerRenderRef.current = false; return; }
    if (!swipeNav || !ofertaVisible || ofertaVisible.id === oferta.id) return;
    onNavegarAOferta?.(ofertaVisible);
  }, [idxVisible]);

  // Navegación LINEAL, sin loop — mismo criterio que las flechas del hero de
  // tienda (la primera no va a la última). Con loop, el track tendría que
  // saltar de un extremo al otro y ahí sí se vería un corte.
  const irA = (delta) => {
    if (!swipeNav) return;
    setIdxVisible((i) => Math.min(ofertasHermanas.length - 1, Math.max(0, i + delta)));
  };

  // Los listeners van a mano con { passive: false }, NO por props onTouch* de
  // React: React los registra como PASIVOS, y en un listener pasivo el
  // preventDefault() se ignora (el navegador avisa "Unable to preventDefault
  // inside passive event listener invocation"). Sin ese preventDefault, el
  // arrastre horizontal lo toma Chrome como gesto nativo de "atrás": la
  // oferta cambiaba bien y acto seguido un popstate devolvía a la tienda.
  const mainRef = useRef(null);
  // Los handlers leen estado (idxVisible, ofertasHermanas) que cambia entre
  // renders — con un ref siempre apuntando a la versión actual, el efecto
  // que registra los listeners no necesita volver a correr en cada cambio.
  const gestoRef = useRef();
  gestoRef.current = { idxVisible, total: ofertasHermanas.length, irA, swipeNav };

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return undefined;

    const alEmpezar = (e) => {
      if (!gestoRef.current.swipeNav) return;
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
      swipeAxisRef.current = null;
    };
    const alMover = (e) => {
      const g = gestoRef.current;
      if (!g.swipeNav || !touchStartRef.current) return;
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      if (swipeAxisRef.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        swipeAxisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (swipeAxisRef.current === 'x') setArrastrando(true);
      }
      if (swipeAxisRef.current === 'x') {
        // Eje horizontal confirmado: frena tanto el scroll en diagonal como
        // el gesto de navegación hacia atrás del navegador.
        e.preventDefault();
        // Resistencia en los extremos: sin loop, tirar más allá de la
        // primera o la última solo cede un tercio, señal física de "no hay
        // más" (mismo criterio que el rebote de las listas nativas).
        const enExtremo = (dx > 0 && g.idxVisible === 0) || (dx < 0 && g.idxVisible === g.total - 1);
        setArrastreX(enExtremo ? dx / 3 : dx);
      }
    };
    const alSoltar = (e) => {
      const g = gestoRef.current;
      if (swipeAxisRef.current === 'x' && touchStartRef.current) {
        const dx = (e.changedTouches?.[0]?.clientX ?? touchStartRef.current.x) - touchStartRef.current.x;
        const ms = Math.max(1, Date.now() - touchStartRef.current.t);
        const velocidad = Math.abs(dx) / ms; // px por ms
        // Pasa por distancia recorrida O por velocidad del flick. El flick
        // igual pide un mínimo de 12px: sin eso, un toque nervioso de 3px
        // hecho en 5ms daría una velocidad altísima y cambiaría de oferta
        // sin que el usuario haya querido arrastrar nada.
        const porDistancia = Math.abs(dx) > SWIPE_THRESHOLD;
        const porFlick = velocidad > SWIPE_VELOCIDAD && Math.abs(dx) > 12;
        if (porDistancia || porFlick) g.irA(dx < 0 ? 1 : -1);
      }
      // Soltar: se apaga el modo arrastre (vuelve la transition) y el offset
      // en px se limpia — el track termina el recorrido hasta el slide que
      // corresponda por índice.
      setArrastrando(false);
      setArrastreX(0);
      touchStartRef.current = null;
      swipeAxisRef.current = null;
    };

    el.addEventListener('touchstart', alEmpezar, { passive: true });
    el.addEventListener('touchmove', alMover, { passive: false });
    el.addEventListener('touchend', alSoltar, { passive: true });
    el.addEventListener('touchcancel', alSoltar, { passive: true });
    return () => {
      el.removeEventListener('touchstart', alEmpezar);
      el.removeEventListener('touchmove', alMover);
      el.removeEventListener('touchend', alSoltar);
      el.removeEventListener('touchcancel', alSoltar);
    };
  }, []);

  // Alto real disponible para la foto en escritorio. No se puede resolver
  // solo con CSS: el header crece o se achica según el nombre de la tienda y
  // qué acciones tenga (no todas las tiendas tienen mapa o WhatsApp), y
  // debajo van el título de la oferta y los dots. Se mide el hueco que queda
  // entre el borde inferior del header y el borde superior del pie, y se
  // publica como --oi-alto-foto para que la imagen lo use de max-height.
  const headerRef = useRef(null);
  const pieRef = useRef(null);
  useLayoutEffect(() => {
    const calcular = () => {
      const cuerpo = mainRef.current;
      if (!cuerpo) return;
      // Solo aplica en el layout horizontal; en mobile vertical manda el
      // ancho. Misma condición que el CSS (ver .oi-acciones-desktop): un
      // celular apaisado también entra acá, aunque no llegue a 860px.
      const esHorizontal = window.matchMedia('(min-width: 860px), (orientation: landscape) and (min-width: 700px)').matches;
      if (!esHorizontal) {
        cuerpo.style.removeProperty('--oi-alto-foto');
        cuerpo.style.removeProperty('--oi-ancho-foto');
        return;
      }
      const alto = cuerpo.clientHeight
        - (pieRef.current?.offsetHeight || 0)
        - 36; // respiro arriba y abajo, para que no quede pegada
      cuerpo.style.setProperty('--oi-alto-foto', `${Math.max(200, alto)}px`);

      // Ancho REAL que terminó teniendo la foto una vez escalada por altura
      // — las flechas se anclan a ese borde. Se calcula de la proporción
      // natural de la imagen en vez de medir su caja: al montar, la foto
      // todavía no cargó y getBoundingClientRect devuelve 0, dejando las
      // flechas pegadas al centro.
      const foto = cuerpo.querySelector('.oi-oferta-img');
      if (foto?.naturalWidth) {
        const anchoProporcional = (alto * foto.naturalWidth) / foto.naturalHeight;
        const anchoMaximo = cuerpo.clientWidth - 28; // no desbordar el contenedor
        cuerpo.style.setProperty('--oi-ancho-foto', `${Math.round(Math.min(anchoProporcional, anchoMaximo))}px`);
      }
    };
    calcular();
    window.addEventListener('resize', calcular);
    // Rotar el celular cambia de layout (vertical ↔ horizontal) sin que
    // siempre dispare un resize útil en el momento correcto.
    window.addEventListener('orientationchange', calcular);
    // El header cambia de alto si el texto se acomoda distinto (nombres
    // largos, wrap de las acciones) — un ResizeObserver lo capta sin
    // depender de que haya un resize de ventana.
    const ro = new ResizeObserver(calcular);
    if (headerRef.current) ro.observe(headerRef.current);
    if (mainRef.current) ro.observe(mainRef.current);
    // Al montar, las fotos todavía no tienen naturalWidth: se recalcula
    // cuando cada una termina de cargar (la primera que llegue ya alcanza,
    // todas comparten proporción).
    const fotos = [...(mainRef.current?.querySelectorAll('.oi-oferta-img') || [])];
    fotos.forEach((f) => f.addEventListener('load', calcular));
    return () => {
      window.removeEventListener('resize', calcular);
      window.removeEventListener('orientationchange', calcular);
      ro.disconnect();
      fotos.forEach((f) => f.removeEventListener('load', calcular));
    };
  }, [ofertasHermanas.length, wa, texto]);

  // Pageview de la oferta — llegó por un link directo (WhatsApp/FB/etc), es
  // la señal más fuerte de interés: alguien vio ESTA oferta puntual, no solo
  // la tienda en general.
  useEffect(() => { trackPageview(tienda.id, 'oferta'); }, [tienda.id, oferta.id]);

  const primary = 'var(--tp-primary)';
  const bg = 'var(--tp-bg)';
  const surf = 'var(--tp-surface)';
  const txt = 'var(--tp-text)';
  const border = 'var(--tp-border)';

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: bg, color: txt, ...F }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', overscrollBehaviorY: 'contain', scrollbarWidth: 'none' }}>
        {/* Bloque header+foto: minHeight 100% del contenedor con scroll (que
            ya termina justo antes de TiendaNavBar, ver ese componente) para
            que ocupe TODA la pantalla disponible al cargar — así el banner
            "¿Tenés un negocio?" y el footer de marca (TiendaFooter, más
            abajo) quedan bajo el fold, invisibles hasta que el usuario
            scrollea a propósito. Antes ese bloque medía solo lo que su
            contenido pedía, y el footer se asomaba de entrada, sensación de
            spam/anuncio para alguien que solo quería ver la oferta. */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

          {/* ── HERO COMPACTO — fondo liso con GLOW sutil de marca (sin card
              flotante ni franja de color con degradado). Info en fila
              horizontal: logo · nombre · estado · WhatsApp. El botón atrás
              es el único control flotante — el de compartir vive en el
              bottom-nav, no se duplica acá. ── */}
          {/* overflow-x clip (no hidden): contiene el desborde LATERAL del
              glow sin recortarlo por abajo — así se desvanece suave hacia la
              foto en vez de cortarse con una línea dura en el borde inferior
              del header. */}
          <header ref={headerRef} style={{ position: 'relative', background: bg, overflowX: 'clip' }}>
            {/* Glow difuso del color de marca, detrás de la info — mismo
                lenguaje que los ambient orbs del template de tienda. El
                gradiente radial ya desvanece a transparente en los bordes,
                reforzando que no haya corte visible. */}
            <div aria-hidden="true" style={{
              position: 'absolute', top: -70, left: '50%', transform: 'translateX(-50%)',
              width: 360, height: 220, pointerEvents: 'none',
              background: 'radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in srgb, var(--tp-primary) 22%, transparent), transparent 72%)',
              filter: 'blur(50px)',
            }} />

            <style>{`
              .oi-hero-btn { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), background-color .15s ease; }
              @media (hover: hover) { .oi-hero-btn:hover { background: var(--tp-surface2) !important; } }
              .oi-hero-btn:active { transform: scale(0.9); transition: transform .06s ease; }
              .oi-wa-btn { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
              @media (hover: hover) { .oi-wa-btn:hover { filter: brightness(1.08); } }
              .oi-wa-btn:active { transform: scale(0.9); transition: transform .06s ease; }

              /* ── Acciones del header, SOLO escritorio ──
                 En mobile viven en TiendaNavBar (barra inferior, al alcance
                 del pulgar). En una pantalla horizontal esa barra fija abajo
                 no tiene sentido: roba alto justo donde escasea y queda
                 lejísimos del cursor. Arriba de 860px la barra se oculta y
                 estas acciones aparecen en la misma fila del logo. */
              .oi-acciones-desktop { display: none; }
              /* display:contents — el wrapper no crea caja propia, así
                 TiendaNavBar sigue siendo hijo directo del flex-column raíz
                 (necesita serlo para quedar fijo abajo con flexShrink:0). */
              .oi-nav-mobile { display: contents; }
              /* El corte NO es solo por ancho: un celular en horizontal mide
                 844px de ancho pero apenas 390 de alto, y ahí lo escaso es
                 el alto igual que en un monitor. Se combina ancho mínimo CON
                 orientación apaisada, así ese caso entra al layout
                 horizontal (foto por altura, acciones arriba) en vez de
                 quedar con una foto de 905px que no entra en pantalla. */
              @media (min-width: 860px), (orientation: landscape) and (min-width: 700px) {
                .oi-acciones-desktop { display: flex; }
                .oi-nav-mobile { display: none; }
              }
              .oi-accion {
                display: inline-flex; align-items: center; gap: 7px;
                height: 36px; padding: 0 13px; border-radius: 11px;
                border: 1px solid var(--tp-border); background: var(--tp-surface);
                color: var(--tp-text-muted); cursor: pointer;
                font-size: 13px; font-weight: 700; font-family: inherit;
                transition: background-color .15s ease, color .15s ease, border-color .15s ease, transform .12s cubic-bezier(0.34,1.56,0.64,1);
              }
              @media (hover: hover) {
                .oi-accion:hover { background: color-mix(in srgb, var(--tp-primary) 10%, transparent); color: var(--tp-primary); border-color: var(--tp-primary); }
              }
              .oi-accion:active { transform: scale(0.94); }

              /* ── Flechas de navegación entre ofertas, SOLO escritorio ──
                 Con mouse no hay gesto de swipe, así que sin flechas no hay
                 forma evidente de pasar de oferta (los dots ya son
                 clickeables, pero son un blanco chico y se leen como
                 indicador, no como control). Se ocultan en táctil, donde el
                 swipe ya es el gesto natural. */
              .oi-flecha { display: none; }
              @media (min-width: 860px), (orientation: landscape) and (min-width: 700px) {
                .oi-flecha {
                  display: flex; align-items: center; justify-content: center;
                  position: absolute; top: 50%; transform: translateY(-50%);
                  width: 44px; height: 44px; border-radius: 14px; z-index: 3;
                  border: 1px solid var(--tp-border); cursor: pointer;
                  background: color-mix(in srgb, var(--tp-surface) 88%, transparent);
                  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                  color: var(--tp-text); box-shadow: 0 4px 16px rgba(0,0,0,.14);
                  transition: background-color .15s ease, color .15s ease, opacity .2s ease;
                }
                .oi-flecha:hover { background: var(--tp-primary); color: var(--tp-on-primary); border-color: var(--tp-primary); }
                .oi-flecha:active { transform: translateY(-50%) scale(0.92); }
                /* En los extremos se apaga pero MANTIENE su lugar (visibility,
                   no display): navegación lineal sin loop, igual que las
                   flechas del hero de tienda. Con display:none la
                   composición se descentraba al llegar al primero o al
                   último. */
                .oi-flecha[disabled] { opacity: 0; visibility: hidden; pointer-events: none; }
                /* Ancladas al borde REAL de la foto, no a los bordes de la
                   ventana: --oi-ancho-foto lo publica el JS midiendo la
                   imagen visible (su ancho cambia con el alto disponible,
                   porque la foto se escala por altura). Sin esto las flechas
                   quedaban flotando lejísimos, contra los bordes de la
                   pantalla. */
                .oi-flecha-prev { left: calc(50% - var(--oi-ancho-foto, 400px) / 2 - 58px); }
                .oi-flecha-next { left: calc(50% + var(--oi-ancho-foto, 400px) / 2 + 14px); }
              }

              /* ── Header en UNA fila (horizontal) ──
                 Grilla de 3 columnas con los laterales del MISMO ancho
                 (1fr): así la identidad de la tienda queda centrada de
                 verdad respecto a la ventana, sin que la corran el botón
                 atrás o las acciones. En mobile no aplica: ahí el botón
                 atrás sigue flotando sobre la foto (fixed) y el hero ocupa
                 todo el ancho, como estaba. */
              .oi-header-fila { display: block; }
              .oi-header-lado { display: none; }
              @media (min-width: 860px), (orientation: landscape) and (min-width: 700px) {
                .oi-header-fila {
                  display: grid; grid-template-columns: 1fr auto 1fr;
                  align-items: center; gap: 16px;
                }
                /* La flecha pasa a ser una columna más de la fila, no un
                   elemento flotante suelto en la esquina. */
                .oi-header-lado { display: flex; align-items: center; }
                .oi-header-lado-izq { justify-content: flex-start; }
                .oi-header-lado-der { justify-content: flex-end; }
                /* !important: el botón lleva display:flex en su style
                   inline (más específico que cualquier regla de clase), y
                   sin esto quedaban DOS flechas de atrás superpuestas — la
                   flotante y la de la fila. */
                .oi-atras-flotante { display: none !important; }
                /* El padding superior generoso existía para dejarle aire al
                   botón atrás flotante; ahora que es una columna más de la
                   fila, se empareja arriba y abajo. */
                .oi-header-info { padding: 14px 18px 14px; }
              }

              /* Pantalla MUY baja (celular apaisado, ~390px de alto): el
                 header con su padding generoso se come casi todo el espacio
                 que necesita la foto. Se compacta todo — logo más chico,
                 menos aire vertical, acciones y título más ajustados — para
                 que la imagen siga siendo la protagonista. */
              @media (orientation: landscape) and (max-height: 520px) {
                .oi-header-info { padding: 10px 18px 8px !important; }
                .oi-logo-tienda { width: 38px !important; height: 38px !important; border-radius: 11px !important; }
                .oi-nombre-tienda { font-size: 1rem !important; }
                .oi-accion { height: 32px; padding: 0 11px; font-size: 12.5px; }
                .oi-pie-nombre { font-size: .95rem !important; margin: 8px 0 0 !important; }
              }
            `}</style>

            {/* Botón atrás en MOBILE — flotante sobre la foto (fixed), que
                es donde tiene que estar cuando el hero ocupa todo el ancho.
                En horizontal se oculta (.oi-atras-flotante) porque pasa a
                ser la primera columna de la fila del header, ver abajo. */}
            <button onClick={onVolver} aria-label="Volver a la tienda" className="no-press oi-hero-btn oi-atras-flotante"
              style={{ position: 'fixed', top: 'calc(14px + env(safe-area-inset-top))', left: 'calc(10px + env(safe-area-inset-left))', zIndex: 20, width: 40, height: 40, borderRadius: 12, border: `1px solid ${border}`, cursor: 'pointer', background: 'color-mix(in srgb, var(--tp-surface) 80%, transparent)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: txt, boxShadow: '0 2px 8px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={19} />
            </button>

            {/* Info de la tienda — fila horizontal, centrada, sobre el glow.
                Padding vertical balanceado (arriba deja aire para el botón
                atrás sin exagerar; abajo cierra parejo hacia la foto). */}
            <div className="oi-header-info" style={{ position: 'relative', zIndex: 1, padding: '30px 18px 18px' }}>
              {/* Fila del header: [atrás] · [identidad de la tienda] ·
                  [acciones]. Las dos columnas laterales miden 1fr cada una,
                  así la identidad queda centrada respecto a la ventana y no
                  se corre según cuántas acciones haya. En mobile esto es un
                  bloque simple y solo se ve la identidad. */}
              <div className="oi-header-fila">
                {/* Columna izquierda — botón atrás en su lugar de la fila */}
                <div className="oi-header-lado oi-header-lado-izq">
                  <button onClick={onVolver} aria-label="Volver a la tienda" className="no-press oi-hero-btn"
                    style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${border}`, cursor: 'pointer', background: 'var(--tp-surface)', color: txt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={19} />
                  </button>
                </div>

                {/* alignItems:center asegura que logo (52px), texto, badge de
                    estado y botón WA (36px) queden centrados en la MISMA línea
                    vertical pese a la diferencia de altura entre ellos — antes
                    el WA quedaba con el color/estilo desactualizado, ahora
                    usa el mismo gradiente real de marca que el hero de tienda. */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div className="oi-logo-tienda" style={{ width: 52, height: 52, borderRadius: 15, flexShrink: 0, overflow: 'hidden', background: tienda.logo ? 'var(--tp-primary-soft)' : primary, boxShadow: '0 4px 16px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {tienda.logo
                      ? <img src={tienda.logo} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <LogoSymbolSvg size={28} color="#fff" />}
                  </div>
                  <h1 className="oi-nombre-tienda" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-.01em', color: txt }}>{tienda.nombre}</h1>
                  {texto && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `color-mix(in srgb, ${abierta ? '#22C55E' : '#EF4444'} 14%, transparent)`, color: abierta ? '#22C55E' : '#EF4444', padding: '5px 12px', borderRadius: 99, fontSize: '.72rem', fontWeight: 700 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: abierta ? '#22C55E' : '#EF4444' }} />{texto}
                    </span>
                  )}
                  {wa && (
                    <a href={`https://wa.me/54${wa}?text=${encodeURIComponent(`Hola ${tienda.nombre}, te contacto desde Lokal.`)}`}
                      target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" data-tooltip="WhatsApp" className="oi-wa-btn"
                      onClick={() => trackClick(tienda.id, 'whatsapp', { productoId: ofertaVisible.id })}
                      style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {WA_ICON}
                    </a>
                  )}
                </div>

                {/* Columna derecha — acciones que en mobile viven en la barra
                    inferior. Van con etiqueta escrita: hay ancho de sobra y
                    con mouse no hay que adivinar qué hace cada ícono. */}
                <div className="oi-header-lado oi-header-lado-der">
                  <div className="oi-acciones-desktop" style={{ alignItems: 'center', gap: 8 }}>
                    {tienda.lat && tienda.lng && (
                      <button className="oi-accion no-press" onClick={() => { trackClick(tienda.id, 'mapa'); setMapaOpen(true); }}>
                        <MapPin size={15} /> Mapa
                      </button>
                    )}
                    <button className="oi-accion no-press" onClick={() => setHorariosOpen(true)}>
                      <Clock size={15} /> Horarios
                    </button>
                    <button className="oi-accion no-press" onClick={() => setShareOpen(true)}
                      style={{ background: primary, color: 'var(--tp-on-primary)', borderColor: primary }}>
                      <Share2 size={15} /> Compartir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ── CUERPO — foto grande de la oferta con zoom + swipe horizontal
              entre ofertas de la tienda (solo si swipeNav existe, ver más
              arriba) ── */}
          <main
            ref={mainRef}
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 14px 24px', maxWidth: 900, margin: '0 auto', width: '100%', touchAction: swipeNav ? 'pan-y' : 'auto', overscrollBehaviorX: 'contain' }}>
            <div className="oi-cuerpo">
              <style>{`
                  /* Track deslizante — mismo patrón que el .nov-track de
                     DISTRIBUIDORA QR 2.0: flex, un slide por ancho de
                     pantalla, movimiento por translateX. La transition se
                     apaga con .oi-arrastrando mientras el dedo está abajo,
                     para que el track lo siga 1:1 en vez de ir con retardo.
                     Curva más larga (.45s) que el .35s de la referencia:
                     cada slide es una foto grande, no una tarjeta chica. */
                  .oi-pista { display: flex; align-items: center; width: 100%; transition: transform .45s cubic-bezier(.25,.9,.3,1); will-change: transform; }
                  .oi-pista.oi-arrastrando { transition: none; }
                  /* flex: 0 0 100% (no min-width): con width:100% en la pista,
                     el flex-basis se resuelve contra el ancho REAL del
                     contenedor, así cada slide mide exactamente un ancho de
                     pantalla. Con min-width:100% el porcentaje se resolvía
                     contra el contenido acumulado del flex y cada slide salía
                     al doble, descolocando todo el track. */
                  .oi-slide { flex: 0 0 100%; max-width: 100%; display: flex; justify-content: center; align-items: center; }

                  /* ── Cómo se dimensiona la foto ──
                     MOBILE: manda el ANCHO (la pantalla es angosta y alta),
                     la altura sale de la proporción 1:1.414 con la que se
                     suben las ofertas. Es el comportamiento de siempre.
                     Sin box-shadow: el track recorta con overflow-x y una
                     sombra proyectada se cortaba justo en ese borde,
                     dejando ver el filo del recorte al deslizar. */
                  .oi-cuerpo { width: 100%; max-width: 640px; margin: 0 auto; text-align: center; }
                  .oi-marco { overflow-x: hidden; margin-inline: -8px; }
                  .oi-oferta-img { cursor: zoom-in; display: block; width: 100%; aspect-ratio: 1 / 1.414; object-fit: cover; border-radius: 16px; }

                  /* ESCRITORIO: manda el ALTO. La pantalla es horizontal, así
                     que lo escaso es el alto, no el ancho: la foto se limita
                     con max-height al espacio que queda entre el header y el
                     pie, y el ancho lo deduce de su propia proporción
                     (width:auto + object-fit:contain = entra entera, sin
                     recorte ni scroll). --oi-alto-foto lo calcula el JS
                     midiendo el espacio real disponible. */
                  @media (min-width: 860px), (orientation: landscape) and (min-width: 700px) {
                    .oi-cuerpo { max-width: none; position: relative; }
                    .oi-marco { margin-inline: 0; }
                    .oi-slide { padding-inline: 0; }
                    .oi-oferta-img {
                      width: auto; max-width: 100%;
                      height: var(--oi-alto-foto, 60vh);
                      aspect-ratio: auto; object-fit: contain;
                      margin: 0 auto;
                    }
                  }
                `}</style>
              {/* overflow-x hidden recorta las fotos vecinas al borde del
                  contenedor: se las ve entrar y salir por los costados,
                  como en el carrusel de referencia. El padding lateral de
                  cada slide es el "espacio adecuado" entre fotos (van
                  pegadas si no, porque cada una vale 100% justo). */}
              <div className="oi-marco">
                <div
                  ref={pistaRef}
                  className={`oi-pista${arrastrando ? ' oi-arrastrando' : ''}`}
                  style={{ transform: `translateX(calc(${-idxVisible * 100}% + ${arrastreX}px))` }}>
                  {(swipeNav ? ofertasHermanas : [oferta]).map((o, i) => (
                    <div key={o.id} className="oi-slide" style={{ paddingInline: 8 }}>
                      <img src={o.imageUrl || o.thumbUrl} alt={o.nombre}
                        draggable="false"
                        onClick={(e) => { if (arrastrando || i !== idxVisible) return; trackClick(tienda.id, 'zoom', { origen: 'oferta', productoId: o.id }); zoomOferta.abrir(0, e); }}
                        className="oi-oferta-img" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Flechas — solo escritorio (con mouse no hay gesto de swipe).
                  Hermanas del marco, NO hijas: el marco recorta con
                  overflow-x para que las fotos vecinas entren y salgan, y
                  ahí adentro las flechas quedarían recortadas también. */}
              {swipeNav && ofertasHermanas.length > 1 && (
                <>
                  <button className="oi-flecha oi-flecha-prev no-press" onClick={() => irA(-1)}
                    disabled={idxVisible === 0} aria-label="Oferta anterior">
                    <ChevronLeft size={22} />
                  </button>
                  <button className="oi-flecha oi-flecha-next no-press" onClick={() => irA(1)}
                    disabled={idxVisible === ofertasHermanas.length - 1} aria-label="Oferta siguiente">
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
              {/* Pie del carrusel: nombre + dots. Va medido (pieRef) porque
                  el alto de la foto en escritorio se calcula restando esto
                  al espacio disponible. */}
              <div ref={pieRef}>
                <div className="oi-pie-nombre" style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, margin: '14px 0 2px', color: txt }}>{ofertaVisible.nombre}</div>
                {/* Puntitos indicadores — mismo lenguaje visual que los dots
                    del hero de tienda, solo visibles cuando hay hermanas. */}
                {swipeNav && ofertasHermanas.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
                    {ofertasHermanas.map((o, i) => (
                      <button key={o.id} onClick={() => setIdxVisible(i)} aria-label={`Oferta ${i + 1}`}
                        className="no-press"
                        style={{
                          width: i === idxVisible ? 16 : 5, height: 5, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer',
                          background: i === idxVisible ? primary : 'var(--tp-border)',
                          transition: 'width .25s ease, background .25s ease',
                        }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Footer de marca — MISMO componente que el home, cero divergencia.
            Vive FUERA del bloque minHeight:100% de arriba a propósito: así
            queda debajo del fold inicial, visible solo si el usuario
            scrollea buscando más — no se asoma de entrada como si fuera
            publicidad en la propia página del dueño. */}
        <TiendaFooter dark={dark} toggleDark={toggleTheme} tiendaId={tienda.id} />
      </div>

      {/* Bottom-nav — MISMO componente que el home, pero SOLO en mobile: en
          escritorio estas mismas acciones viven en el header (ver
          .oi-acciones-desktop), donde están al lado del cursor y no le
          roban alto a la foto, que es lo escaso en una pantalla horizontal. */}
      <div className="oi-nav-mobile">
        <TiendaNavBar
          onAbrirMapa={tienda.lat && tienda.lng ? () => { trackClick(tienda.id, 'mapa'); setMapaOpen(true); } : undefined}
          onAbrirHorarios={() => setHorariosOpen(true)}
          onCompartir={() => setShareOpen(true)}
        />
      </div>

      {/* Sheet de horarios — MISMO componente que la tienda, para no divergir */}
      <HorariosSheet open={horariosOpen} onClose={() => setHorariosOpen(false)} horarios={tienda.horarios} abierta={abierta} texto={texto} />

      {/* Mapa custom — el MISMO MapaModal de la tienda (ruta OSRM, satélite,
          etc.), en vez de mandar a Google Maps externo. */}
      {mapaOpen && tienda.lat && tienda.lng && (
        <MapaModal tienda={tienda} isDark={dark} onClose={() => setMapaOpen(false)} />
      )}

      {/* Share — MISMO componente, con el link de ESTA oferta */}
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} titulo={`${ofertaVisible.nombre} — ${tienda.nombre}`}
        onCompartido={(medio) => trackCompartir(tienda.id, medio, { productoId: ofertaVisible.id })} />

      {/* Zoom de la oferta — overlay custom de PhotoSwipe (mismo diseño que
          el banner/logo del hero de tienda: X arriba-izq, lupa arriba-der). */}
      <PhotoSwipeStyles />
      <PhotoSwipeOverlay pswp={zoomOferta.pswp} />
    </div>
  );
}

export default OfertaIndividual;
