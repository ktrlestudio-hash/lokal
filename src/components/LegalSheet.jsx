// SheetLegal + CARD_TINTED — extraídos de LandingScreen.jsx para
// compartirlos con HomeGlobal.jsx sin duplicar código. Antes SheetLegal
// vivía como función interna no exportada ahí (comentario original: "copiado
// acá en vez de importado para no acoplar la landing a LegalPages.jsx por un
// componente chico") — con un segundo consumidor real (la Home global)
// duplicarlo ya no tenía sentido, así que pasa a vivir en un archivo propio
// que ambos importan igual.
import React, { useEffect } from 'react';
import { Scale, X } from 'lucide-react';
import { useSheetOpen } from '../tienda-publica/hooks/useSheetOpen.js';

// Superficie de card enriquecida con el azul de marca. Los tokens globales
// (--surface-solid/#f5f5f5 en light, #1f1f1f en dark) son gris neutro a
// propósito ("cero azul", ver index.css §4) — correcto para paneles
// funcionales, pero en piezas hero/vacías se leían planas y apagadas. Se les
// mezcla una pizca de --brand, el mismo recurso que hace que la card de
// "Empezá sin pagar" de la landing se lea viva en vez de un panel gris suelto.
export const CARD_TINTED = {
  background: 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.055), rgb(var(--brand, 0 184 217) / 0.015))',
  borderColor: 'rgb(var(--brand, 0 184 217) / 0.14)',
};

// Sheet con los 3 documentos legales — agrupa Términos/Privacidad/Comercios
// detrás de un solo link "Legal": con "Quiénes somos" sumado eran 4 links
// sueltos, y en mobile el último quedaba solo en su fila, descentrado.
export function SheetLegal({ open, onClose }) {
  const { mounted, visible } = useSheetOpen(open, 220, onClose);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!mounted) return null;

  const DOCS = [
    { href: '/terminos-y-condiciones', label: 'Términos y Condiciones' },
    { href: '/politica-de-privacidad', label: 'Política de Privacidad' },
    { href: '/condiciones-para-comercios', label: 'Condiciones para Comercios' },
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
            <a key={d.href} href={d.href}
              className="lok-tap block w-full text-left px-3.5 py-3 rounded-xl font-semibold text-sm no-underline hover:text-brand"
              style={{ color: 'var(--text-primary)' }}>
              {d.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
