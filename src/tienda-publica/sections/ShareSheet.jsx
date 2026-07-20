/**
 * ShareSheet — bottom sheet de compartir con opciones (Copiar link,
 * WhatsApp, Facebook, Instagram). Botones portados LITERAL de
 * DISTRIBUIDORA QR 2.0 (public/index.html, .sh-opt/.sh-opt-ico): 48px,
 * radius 14px, gradientes reales por red, hover scale+translateY — no una
 * aproximación con color plano.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Link2 } from 'lucide-react';
import { RADIUS, SHADOW, FONT } from '../tokens.js';
import { useSheetOpen } from '../hooks/useSheetOpen.js';
import { SHEET_TRANSITION_CSS } from './sheetTransitionCss.js';

const F = { fontFamily: FONT.family };

function IconWhatsApp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}
function IconFacebook(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function IconInstagram(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Gradientes literales de .sh-opt-ico.{wa,cp,fb,ig} en DISTRIBUIDORA QR.
const GRADIENTS = {
  cp: 'linear-gradient(135deg,#6B6B6B,#4a4a4a)',
  wa: 'linear-gradient(135deg,#25D366,#128C7E)',
  fb: 'linear-gradient(135deg,#1877F2,#0d5cb6)',
  ig: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
};

// Sin fondo de base en el botón completo — solo el ícono lleva su gradiente
// de marca, flotando sobre el fondo del sheet. El área del botón entero
// (rectángulo) queda reservada para el HOVER (aparece un fondo sutil recién
// ahí, ver .sh-opt:hover), no como superficie visible de entrada.
function ShareOpt({ onClick, gradient, Icon, label }) {
  return (
    <button onClick={onClick} className="no-press sh-opt" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      padding: '14px 8px', background: 'transparent', border: 'none',
      borderRadius: RADIUS.lg, cursor: 'pointer', textAlign: 'center', ...F,
    }}>
      <span className="sh-opt-ico" style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: gradient, color: '#fff' }}>
        <Icon width={24} height={24} style={{ display: 'block' }} />
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tp-text)' }}>{label}</span>
    </button>
  );
}

// onCompartido(medio) — opcional, para que el caller trackee analytics sin
// que este componente reusable sepa nada de tiendaId/track.js (no lo acopla
// a un dominio concreto, solo avisa "medio elegido").
export function ShareSheet({ open, onClose, url, titulo, mensaje, onCompartido }) {
  const [copiado, setCopiado] = useState(false);
  const { mounted, visible } = useSheetOpen(open, 220, onClose);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!mounted) return null;

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const texto = mensaje || `Mirá ${titulo || 'esta tienda'} en LOKAL`;

  // copiarAlPortapapeles: la mecánica de copiar en sí, SIN trackear — la
  // usan tanto "Copiar link" como el fallback de Instagram, cada uno con
  // su propio medio real en onCompartido (si compartirIG llamara a
  // copiarLink directo, pisaría el medio 'instagram' con 'copiar-link').
  const copiarAlPortapapeles = () => {
    navigator.clipboard?.writeText(shareUrl);
    setCopiado(true);
    setTimeout(() => { setCopiado(false); onClose(); }, 900);
  };
  const copiarLink = () => { onCompartido?.('copiar-link'); copiarAlPortapapeles(); };
  const compartirWA = () => {
    onCompartido?.('whatsapp');
    window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${shareUrl}`)}`, '_blank');
    onClose();
  };
  const compartirFB = () => {
    onCompartido?.('facebook');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    onClose();
  };
  const compartirIG = () => {
    onCompartido?.('instagram');
    // Instagram no tiene web-intent de compartir link — mismo criterio que
    // DISTRIBUIDORA QR: copia el link para pegarlo en una publicación/story.
    copiarAlPortapapeles();
  };

  // Portal a <body>: mismo fix que MapaModal — el ShareSheet de la tienda
  // se monta fuera del .cm-scroll (tapa el nav bien), pero el de las cards
  // de oferta vive DENTRO de ese contenedor con scroll — su position:fixed
  // quedaba atrapado en ese stacking context y el nav (zIndex más bajo mismo,
  // pero en su propio contexto) lo tapaba. El portal lo saca siempre a
  // <body>, sin importar desde dónde se monte.
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 4720, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <style>{SHEET_TRANSITION_CSS}</style>
      <style>{`
        @media (hover: hover) {
          .sh-opt:hover { background: color-mix(in srgb, var(--tp-text) 6%, transparent); }
          .sh-opt:hover .sh-opt-ico { transform: scale(1.08); }
        }
        .sh-opt:active { transform: scale(.96); }
        .sh-opt-ico { transition: transform .2s; }
        .sh-opt { transition: background-color .15s ease, transform .2s ease; }
        /* Separadores verticales entre las 4 opciones — línea que se
           desvanece arriba y abajo (fade), no un borde sólido de punta a
           punta. Mismo lenguaje que el separador logo/CTA del footer. */
        .sh-opt-grid > *:not(:last-child) { position: relative; }
        .sh-opt-grid > *:not(:last-child)::after {
          content: ''; position: absolute; top: 8px; bottom: 8px; right: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, var(--tp-border) 30%, var(--tp-border) 70%, transparent);
        }
      `}</style>
      <div onClick={onClose} className={`tp-sheet-ov ${visible ? 'in' : ''}`} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div className={`tp-sheet-panel ${visible ? 'in' : ''}`} style={{
        position: 'relative', background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
        boxShadow: SHADOW.xl, ...F,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--tp-border)', margin: '10px auto 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 14px', borderBottom: '1px solid var(--tp-border)' }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 800, color: 'var(--tp-text)' }}>Compartir</h3>
          {/* Sin className/:hover — mismo hueco que el resto de X de sheets. */}
          <style>{`
            @media (hover: hover) { .tp-sheet-close:hover { filter: brightness(0.85); } }
            .tp-sheet-close:active { transform: scale(0.9); transition: transform .06s ease; }
          `}</style>
          <button onClick={onClose} aria-label="Cerrar" className="tp-sheet-close" style={{
            width: 32, height: 32, border: 'none', borderRadius: 12, background: 'var(--tp-surface2)',
            color: 'var(--tp-text-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease',
          }}><X size={16} /></button>
        </div>

        <div className="sh-opt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '16px 18px 24px' }}>
          <ShareOpt onClick={copiarLink} gradient={GRADIENTS.cp} Icon={Link2} label={copiado ? '¡Copiado!' : 'Copiar link'} />
          <ShareOpt onClick={compartirWA} gradient={GRADIENTS.wa} Icon={IconWhatsApp} label="WhatsApp" />
          <ShareOpt onClick={compartirFB} gradient={GRADIENTS.fb} Icon={IconFacebook} label="Facebook" />
          <ShareOpt onClick={compartirIG} gradient={GRADIENTS.ig} Icon={IconInstagram} label="Instagram" />
        </div>
      </div>
    </div>,
    document.body
  );
}
