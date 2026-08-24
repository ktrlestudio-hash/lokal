// Modal "Muy pronto" — para botones ya visibles en la interfaz (bottom-nav,
// banner) que todavía no tienen pantalla real detrás (ej. el mapa
// interactivo, o un carrito multi-tienda: ver comentarios en HomeGlobal.jsx).
// En vez de dejarlos sin onClick (se sienten rotos al tocar) o navegar a una
// pantalla vacía, confirman que el botón "funciona" y avisan qué está por
// venir — sin prometer fecha.
//
// Portado de MI BOVRIL MAPA COMUNITARIO/frontend/src/components/
// ProximamenteModal.jsx (mismo patrón: portal a body, backdrop+pop),
// adaptado a los tokens de LOKAL (--brand/--surface-card) en vez de los de
// ese proyecto. Sin el botón de "Me interesa" (votaba a un endpoint
// /interes que no existe en LOKAL LINKS) — si se quiere esa señal acá, es
// una pieza de backend aparte, no algo que improvisar en este componente.
import React from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';

export default function ProximamenteModal({ abierto, isDark, onCerrar, icono: Icono = Sparkles, titulo, texto }) {
  if (!abierto) return null;

  // bg-surface-card sólo (--surface-solid) resuelve en dark a un gris
  // carbón NEUTRO (#1f1f1f, sin componente azulado) — se leía como un
  // panel gris genérico al lado del resto de piezas ya tintadas de marca
  // de esta misma pantalla (chips de categoría, avatar, input de
  // búsqueda). Mismo fix que se aplicó ahí: en dark, base sólida YA
  // azulada (#0a1420, hermano más claro del #040a14 del fondo de página)
  // con el degradado de --brand encima — un gris neutro puro no se tiñe
  // lo suficiente con un degradado translúcido por más que se suba la
  // opacidad, hace falta que la base misma sea azulada.
  const cardStyle = {
    boxShadow: '0 20px 60px rgba(0,0,0,.25)',
    animation: 'lk-proximamente-pop .22s cubic-bezier(0.34,1.56,0.64,1)',
    ...(isDark ? {
      background: 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.14), rgb(var(--brand, 0 184 217) / 0.05)), #0a1420',
    } : null),
  };

  return createPortal(
    <>
      {/* zIndex vía style inline, no clase z-[7500]/z-[7501]: Tailwind no
          las generaba (no aparecían en el CSS compilado — Vite/el scanner
          JIT no las tomó de este archivo nuevo), así que ambas capas
          quedaban con z-index auto y cualquier elemento posicionado de la
          página pasaba por encima. Mismo criterio que ya usa
          MapaSection.jsx (zIndex:9999 inline) para su modal fullscreen. */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 7500, background: 'rgba(0,0,0,.5)', animation: 'lk-proximamente-fade .18s ease' }}
        onClick={onCerrar}
      />
      <div className="fixed inset-0 flex items-center justify-center px-4" style={{ zIndex: 7501 }} onClick={onCerrar}>
        <div
          className="w-full max-w-sm rounded-3xl px-6 pt-7 pb-6 text-center relative bg-surface-card border border-[var(--border-solid)]"
          onClick={(e) => e.stopPropagation()}
          style={cardStyle}
        >
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="absolute w-7 h-7 rounded-full grid place-items-center bg-brand/[0.08] hover:bg-brand/[0.16] text-ink-dim transition-colors"
            style={{ top: 14, right: 14 }}
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="mx-auto mb-4 flex items-center justify-center rounded-2xl bg-brand/10" style={{ width: 64, height: 64 }}>
            <Icono className="w-7 h-7 text-brand" strokeWidth={2} />
          </div>

          <h3 className="text-[17px] font-black mb-1.5 text-ink">{titulo}</h3>
          <p className="text-sm leading-relaxed mb-6 text-ink-dim">{texto}</p>

          <button
            onClick={onCerrar}
            className="w-full py-3 rounded-2xl font-bold text-sm active:scale-[0.98] bg-ink dark:bg-white text-white dark:text-[#18181b] transition-transform"
          >
            Entendido
          </button>
        </div>
      </div>

      <style>{`
        @keyframes lk-proximamente-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lk-proximamente-pop { from { opacity: 0; transform: scale(.94) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </>,
    document.body
  );
}
