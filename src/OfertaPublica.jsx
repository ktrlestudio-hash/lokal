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
import { InlineLoader } from './LokalLoader.jsx';

const API_BASE = '/.netlify/functions';

export default function OfertaPublica({ tiendaSlug, ofertaSlug, tiendaInicial, ofertaInicial, isDark, toggleTheme, onVolver, onNavegarAOferta, isFirstLoad = false }) {
  // Si venimos de un clic interno en la tienda, tienda+oferta ya están en
  // memoria: arrancamos con ellas y SIN loader (render instantáneo). Solo
  // el link externo (WhatsApp/FB) entra en frío y necesita fetch.
  const desdeMemoria = !!(tiendaInicial && ofertaInicial);
  const [tienda, setTienda] = useState(tiendaInicial || null);
  const [oferta, setOferta] = useState(ofertaInicial || null);
  // Splash full-screen SOLO en carga fría real (link externo WhatsApp/FB,
  // isFirstLoad) y sin datos en memoria. En navegación interna (isFirstLoad
  // false) nunca se muestra el loader de logo — evita el "doble loader"
  // encadenado con el splash de la pantalla que se dejaba.
  const [loading, setLoading] = useState(isFirstLoad && !desdeMemoria);
  const [loaderHiding, setLoaderHiding] = useState(false);
  const [error, setError] = useState(null);

  // Cuando cambia ofertaInicial (swipe entre ofertas de la MISMA tienda vía
  // onNavegarAOferta — Root.jsx actualiza ofertaEnMemoria/ofertaRoute pero
  // NO desmonta este componente), sincronizamos el state local sin re-fetch:
  // la oferta nueva ya viene completa desde tienda.ofertas, la misma tienda
  // en memoria no cambió.
  useEffect(() => {
    if (ofertaInicial) setOferta(ofertaInicial);
  }, [ofertaInicial]);

  useEffect(() => {
    // Datos ya en memoria (navegación interna) — nada que buscar.
    if (desdeMemoria) return;

    const cachedTienda = cacheGet(`tp-tienda-${tiendaSlug}`);
    const startMs = Date.now();
    // Solo aplica el mínimo de animación en carga fría (único caso con loader).
    const MIN_LOADER_MS = isFirstLoad ? 300 : 0;

    const reveal = (t, o) => {
      setTienda(t);
      setOferta(o);
      // Sin loader activo (navegación interna sin memoria): datos directo,
      // sin secuencia de fade-out — no hay splash que desvanecer.
      if (!loading) return;
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
        <div style={{ opacity: loaderHiding ? 0 : 1, transition: 'opacity .35s ease', pointerEvents: loaderHiding ? 'none' : 'auto' }}>
          <InlineLoader />
        </div>
      )}

      {tienda && oferta && (
        <OfertaIndividual tienda={tienda} oferta={oferta} isDark={isDark} toggleTheme={toggleTheme} onVolver={onVolver} onNavegarAOferta={onNavegarAOferta} />
      )}
    </>
  );
}
