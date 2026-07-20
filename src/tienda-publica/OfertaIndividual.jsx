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
import React, { useState, useLayoutEffect, useMemo, useEffect } from 'react';
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

export function OfertaIndividual({ tienda, oferta, isDark, toggleTheme, onVolver }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [horariosOpen, setHorariosOpen] = useState(false);
  const [mapaOpen, setMapaOpen] = useState(false);

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

  const img = oferta.imageUrl || oferta.thumbUrl;
  // Zoom de la foto de la oferta — MISMO usePhotoSwipe (y mismo diseño de
  // overlay: X arriba-izq, lupa arriba-der) que el banner/logo del hero de
  // tienda, reemplaza el lightbox casero que tenía esta pantalla antes
  // (fondo negro + botón X suelto, sin flechas/lupa, estilo desactualizado).
  const zoomOferta = usePhotoSwipe(img ? [img] : []);
  const wa = (tienda.whatsapp || '').replace(/\D/g, '');
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

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
                    onClick={() => trackClick(tienda.id, 'whatsapp', { productoId: oferta.id })}
                    style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {WA_ICON}
                  </a>
                )}
              </div>
            </div>
          </header>

          {/* ── CUERPO — foto grande de la oferta con zoom ── */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 14px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ display: 'inline-block', maxWidth: 640, width: '100%' }}>
                <style>{`
                  .oi-oferta-img { transition: transform .18s cubic-bezier(0.34,1.56,0.64,1), box-shadow .18s ease; }
                  @media (hover: hover) { .oi-oferta-img:hover { transform: scale(1.01); } }
                  .oi-oferta-img:active { transform: scale(0.98); box-shadow: 0 10px 30px rgba(0,0,0,.28) !important; }
                `}</style>
                <img src={img} alt={oferta.nombre} onClick={(e) => { trackClick(tienda.id, 'zoom', { origen: 'oferta', productoId: oferta.id }); zoomOferta.abrir(0, e); }} className="oi-oferta-img"
                  style={{ width: '100%', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.35)', cursor: 'zoom-in', display: 'block' }} />
                <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, margin: '14px 0 2px', color: txt }}>{oferta.nombre}</div>
              </div>
            </div>
          </main>

          {/* Footer de marca — MISMO componente que el home, cero divergencia */}
          <TiendaFooter dark={dark} toggleDark={toggleTheme} tiendaId={tienda.id} />
        </div>
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
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} titulo={`${oferta.nombre} — ${tienda.nombre}`}
        onCompartido={(medio) => trackCompartir(tienda.id, medio, { productoId: oferta.id })} />

      {/* Zoom de la oferta — overlay custom de PhotoSwipe (mismo diseño que
          el banner/logo del hero de tienda: X arriba-izq, lupa arriba-der). */}
      <PhotoSwipeStyles />
      <PhotoSwipeOverlay pswp={zoomOferta.pswp} />
    </div>
  );
}

export default OfertaIndividual;
