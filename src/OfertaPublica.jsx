/**
 * OfertaPublica — contenedor de datos para /:tienda/o/:oferta.
 * Hace el fetch de la tienda + la oferta puntual y monta OfertaIndividual
 * (la vista React). Mismo loader animado que TiendaPublica para coherencia.
 *
 * El link lo comparten WhatsApp/FB; el SSR (oferta-ssr) responde a los
 * crawlers con OG y redirige a los humanos a esta ruta React.
 */
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { OfertaIndividual } from './tienda-publica/OfertaIndividual.jsx';
import { cacheGet, cacheSet } from './lokCache';

const API_BASE = '/.netlify/functions';

// Logo animado del loader — mismo que TiendaPublica, en turquesa var(--brand-hex).
function LogoLoader() {
  const cx = 40.72, cy = 40.65, r = 11.23;
  return (
    <svg viewBox="0 0 81.18 81.44" width={72} height={72} xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes op-draw { from{stroke-dashoffset:275}to{stroke-dashoffset:0} }
        @keyframes op-dot-in { 0%{transform:scale(0);opacity:0}55%{transform:scale(1.3);opacity:1}75%{transform:scale(.88)}90%{transform:scale(1.05)}100%{transform:scale(1);opacity:1} }
        @keyframes op-pulse { 0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.10);opacity:.7} }
        .op-ring{fill:none;stroke:var(--brand-hex,#00B8D9);stroke-width:7.66;stroke-linecap:round;stroke-dasharray:275;stroke-dashoffset:275;animation:op-draw .85s cubic-bezier(.4,0,.2,1) .1s forwards}
        .op-dot{fill:var(--brand-hex,#00B8D9);transform-origin:${cx}px ${cy}px;animation:op-dot-in .5s cubic-bezier(.34,1.56,.64,1) .7s both,op-pulse 2.2s ease-in-out 1.35s infinite}
      `}</style>
      <rect className="op-ring" x="3.83" y="3.83" width="73.52" height="73.78" rx="14.83" />
      <circle className="op-dot" cx={cx} cy={cy} r={r} />
    </svg>
  );
}

export default function OfertaPublica({ tiendaSlug, ofertaSlug, tiendaInicial, ofertaInicial, isDark, toggleTheme, onVolver }) {
  // Si venimos de un clic interno en la tienda, tienda+oferta ya están en
  // memoria: arrancamos con ellas y SIN loader (render instantáneo). Solo
  // el link externo (WhatsApp/FB) entra en frío y necesita fetch.
  const desdeMemoria = !!(tiendaInicial && ofertaInicial);
  const [tienda, setTienda] = useState(tiendaInicial || null);
  const [oferta, setOferta] = useState(ofertaInicial || null);
  const [loading, setLoading] = useState(!desdeMemoria);
  const [loaderHiding, setLoaderHiding] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Datos ya en memoria (navegación interna) — nada que buscar.
    if (desdeMemoria) return;

    const cachedTienda = cacheGet(`tp-tienda-${tiendaSlug}`);
    const startMs = Date.now();
    const MIN_LOADER_MS = 300;

    const reveal = (t, o) => {
      setTienda(t);
      setOferta(o);
      const wait = Math.max(0, MIN_LOADER_MS - (Date.now() - startMs));
      setTimeout(() => {
        setLoaderHiding(true);
        setTimeout(() => setLoading(false), 320);
      }, wait);
    };

    (async () => {
      try {
        // ofertas?slug=X&ofertaSlug=Y devuelve { oferta, tienda } juntos —
        // un solo fetch, sin duplicar la consulta a tiendas-crud.
        const oRes = await fetch(`${API_BASE}/ofertas?slug=${encodeURIComponent(tiendaSlug)}&ofertaSlug=${encodeURIComponent(ofertaSlug)}`);
        if (!oRes.ok) throw new Error('Oferta no encontrada');
        const data = await oRes.json();
        const o = data?.oferta;
        const t = data?.tienda;
        if (!o || !o.id || !t) throw new Error('Oferta no encontrada');
        cacheSet(`tp-tienda-${tiendaSlug}`, t);
        reveal(t, o);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    })();
  }, [tiendaSlug, ofertaSlug, desdeMemoria]);

  const showLoader = loading || loaderHiding;

  if (error && !oferta) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'rgb(var(--surface-dim))' }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Oferta no encontrada</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>El link puede estar vencido o la oferta ya no está disponible.</p>
        <a href={`/${tiendaSlug}`} className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-2xl text-sm text-white" style={{ background: 'var(--brand-hex)' }}>
          Ver la tienda
        </a>
      </div>
    </div>
  );

  return (
    <>
      {showLoader && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgb(var(--surface-dim))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          opacity: loaderHiding ? 0 : 1, transition: 'opacity .35s ease',
          pointerEvents: loaderHiding ? 'none' : 'auto',
        }}>
          <div style={{ position: 'absolute', inset: '0 0 35% 0', background: 'radial-gradient(ellipse 75% 55% at 50% 0%, rgba(0,184,217,0.22), transparent)', pointerEvents: 'none' }} />
          <LogoLoader />
        </div>
      )}

      {tienda && oferta && (
        <OfertaIndividual tienda={tienda} oferta={oferta} isDark={isDark} toggleTheme={toggleTheme} onVolver={onVolver} />
      )}
    </>
  );
}
