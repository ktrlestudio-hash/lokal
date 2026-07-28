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
import { ArrowLeft } from 'lucide-react';
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

  // Navegación entre ofertas hermanas — MISMO mecanismo que el carrusel de
  // fotos del hero de tienda (commerce-modern.jsx, .cm-hero-photo): TODAS
  // las fotos montadas apiladas en la misma posición, y solo cambia
  // `opacity` con un `transition: opacity .4s ease`. Nada de mover un track
  // ni de recalcular layout: la opacidad es una propiedad compositable, el
  // navegador la resuelve en GPU sin reflow, por eso ese carrusel se siente
  // fluido y no parpadea. Un intento previo con track deslizante daba
  // exactamente los problemas contrarios (fotos vecinas pegadas al borde,
  // parpadeo al soltar por el remount de React al cambiar de oferta).
  //
  // El swipe solo DECIDE a qué foto ir (como las flechas del hero), no
  // arrastra nada. touchStartRef guarda el punto de origen; swipeAxisRef
  // fija el eje DOMINANTE recién en el primer movimiento con desplazamiento
  // apreciable (>8px) — si el primer gesto real es más vertical que
  // horizontal, se cede el control al scroll nativo del navegador para el
  // resto del gesto (mismo criterio que el touchmove de mvsupermercado).
  const touchStartRef = useRef(null);
  const swipeAxisRef = useRef(null);
  const SWIPE_THRESHOLD = 60; // px para disparar cambio de oferta al soltar

  // Índice LOCAL de la oferta visible — igual que photoIdx en el hero de
  // tienda. Cambiarlo hace el crossfade al instante, sin remontar nada; la
  // URL se sincroniza aparte (ver efecto más abajo) para no acoplar la
  // animación a la navegación.
  const idxInicial = Math.max(0, ofertasHermanas.findIndex((o) => o.id === oferta.id));
  const [idxVisible, setIdxVisible] = useState(idxInicial);

  // Si la oferta llega cambiada desde afuera (link directo, botón atrás del
  // navegador), el índice local se realinea sin animación extra.
  useEffect(() => { setIdxVisible(idxInicial); }, [oferta.id]);

  const ofertaVisible = ofertasHermanas[idxVisible] || oferta;

  // Zoom de la foto — MISMO usePhotoSwipe (y mismo diseño de overlay: X
  // arriba-izq, lupa arriba-der) que el banner/logo del hero de tienda.
  // Se arma con la foto VISIBLE (no la de props): si el usuario ya pasó a
  // otra oferta con el swipe, el zoom debe abrir esa, no la original.
  const imgVisible = ofertaVisible.imageUrl || ofertaVisible.thumbUrl;
  const zoomOferta = usePhotoSwipe(imgVisible ? [imgVisible] : []);

  // La URL sigue al índice, no al revés: el crossfade ya ocurrió cuando esto
  // corre. Se salta el primer render (la URL ya es la correcta al montar).
  const primerRenderRef = useRef(true);
  useEffect(() => {
    if (primerRenderRef.current) { primerRenderRef.current = false; return; }
    if (!swipeNav || !ofertaVisible || ofertaVisible.id === oferta.id) return;
    onNavegarAOferta?.(ofertaVisible);
  }, [idxVisible]);

  const irA = (delta) => {
    if (!swipeNav) return;
    const total = ofertasHermanas.length;
    setIdxVisible((i) => (i + delta + total) % total);
  };

  const onTouchStart = (e) => {
    if (!swipeNav) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    swipeAxisRef.current = null;
  };
  const onTouchMove = (e) => {
    if (!swipeNav || !touchStartRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    if (swipeAxisRef.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      swipeAxisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    // Eje horizontal confirmado: no dejar que el navegador scrollee la
    // página en diagonal mientras se decide el swipe.
    if (swipeAxisRef.current === 'x') e.preventDefault();
  };
  const onTouchEnd = (e) => {
    if (swipeAxisRef.current === 'x' && touchStartRef.current) {
      const dx = (e.changedTouches?.[0]?.clientX ?? touchStartRef.current.x) - touchStartRef.current.x;
      if (Math.abs(dx) > SWIPE_THRESHOLD) irA(dx < 0 ? 1 : -1);
    }
    touchStartRef.current = null;
    swipeAxisRef.current = null;
  };

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
          <header style={{ position: 'relative', background: bg, overflowX: 'clip' }}>
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
            `}</style>

            {/* Botón atrás — STICKY flotante en la esquina: fixed, siempre
                visible aunque se scrollee la oferta. Glass sutil (blur +
                fondo translúcido de superficie) para que se despegue del
                contenido que pase por debajo. safe-area para el notch. */}
            <button onClick={onVolver} aria-label="Volver a la tienda" className="no-press oi-hero-btn"
              style={{ position: 'fixed', top: 'calc(14px + env(safe-area-inset-top))', left: 'calc(10px + env(safe-area-inset-left))', zIndex: 20, width: 40, height: 40, borderRadius: 12, border: `1px solid ${border}`, cursor: 'pointer', background: 'color-mix(in srgb, var(--tp-surface) 80%, transparent)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: txt, boxShadow: '0 2px 8px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={19} />
            </button>

            {/* Info de la tienda — fila horizontal, centrada, sobre el glow.
                Padding vertical balanceado (arriba deja aire para el botón
                atrás sin exagerar; abajo cierra parejo hacia la foto). */}
            <div style={{ position: 'relative', zIndex: 1, padding: '30px 18px 18px' }}>
              {/* alignItems:center asegura que logo (52px), texto, badge de
                  estado y botón WA (36px) queden centrados en la MISMA línea
                  vertical pese a la diferencia de altura entre ellos — antes
                  el WA quedaba con el color/estilo desactualizado, ahora
                  usa el mismo gradiente real de marca que el hero de tienda. */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ width: 52, height: 52, borderRadius: 15, flexShrink: 0, overflow: 'hidden', background: tienda.logo ? 'var(--tp-primary-soft)' : primary, boxShadow: '0 4px 16px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {tienda.logo
                    ? <img src={tienda.logo} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <LogoSymbolSvg size={28} color="#fff" />}
                </div>
                <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-.01em', color: txt }}>{tienda.nombre}</h1>
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
            </div>
          </header>

          {/* ── CUERPO — foto grande de la oferta con zoom + swipe horizontal
              entre ofertas de la tienda (solo si swipeNav existe, ver más
              arriba) ── */}
          <main
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 14px 24px', maxWidth: 900, margin: '0 auto', width: '100%', touchAction: swipeNav ? 'pan-y' : 'auto' }}>
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ display: 'inline-block', maxWidth: 640, width: '100%' }}>
                <style>{`
                  .oi-oferta-img { cursor: zoom-in; transition: opacity .4s ease, transform .18s cubic-bezier(0.34,1.56,0.64,1), box-shadow .18s ease; }
                  @media (hover: hover) { .oi-oferta-img:hover { transform: scale(1.01); } }
                  .oi-oferta-img:active { transform: scale(0.98); box-shadow: 0 10px 30px rgba(0,0,0,.28) !important; }
                `}</style>
                {/* Fotos apiladas con crossfade — EXACTAMENTE el mecanismo de
                    .cm-hero-photo en el hero de tienda: todas montadas en la
                    misma posición (absolute inset 0), y solo cambia opacity
                    con transition .4s. pointerEvents en las no visibles
                    apagado, si no el click puede aterrizar en una foto
                    invisible superpuesta (mismo bug real que documenta el
                    hero). El contenedor lleva aspectRatio propio para tener
                    altura estable: sin eso, apilar fotos absolutas colapsaría
                    la caja a cero. */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1.414', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.35)' }}>
                  {(swipeNav ? ofertasHermanas : [oferta]).map((o, i) => {
                    const visible = swipeNav ? i === idxVisible : true;
                    const src = o.imageUrl || o.thumbUrl;
                    return (
                      <img key={o.id} src={src} alt={visible ? o.nombre : ''} aria-hidden={!visible}
                        onClick={(e) => { if (!visible) return; trackClick(tienda.id, 'zoom', { origen: 'oferta', productoId: o.id }); zoomOferta.abrir(0, e); }}
                        className="oi-oferta-img"
                        style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                          opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none',
                        }} />
                    );
                  })}
                </div>
                <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, margin: '14px 0 2px', color: txt }}>{ofertaVisible.nombre}</div>
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

      {/* Bottom-nav — MISMO componente que el home. Home · Compartir · WhatsApp
          + Mapa/Horarios (según lo pedido). onAbrirMapa/onAbrirHorarios se
          conectan igual que en la tienda. */}
      <TiendaNavBar
        onAbrirMapa={tienda.lat && tienda.lng ? () => { trackClick(tienda.id, 'mapa'); setMapaOpen(true); } : undefined}
        onAbrirHorarios={() => setHorariosOpen(true)}
        onCompartir={() => setShareOpen(true)}
      />

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
