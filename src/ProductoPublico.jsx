/**
 * ProductoPublico — contenedor de datos para /:tienda/p/:producto.
 * Calco de OfertaPublica.jsx (ver ese archivo para el detalle del criterio
 * de carga/loader): hace el fetch de la tienda + el producto puntual y monta
 * ProductoIndividual (la vista React, página completa).
 *
 * El link lo comparten WhatsApp/FB; el SSR (ogProducto en
 * functions/_middleware.js) responde a los crawlers con OG y redirige a los
 * humanos a esta ruta React.
 */
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { ProductoIndividual } from './tienda-publica/ProductoIndividual.jsx';
import { cacheGet, cacheSet } from './lokCache';
import { InlineLoader } from './LokalLoader.jsx';

const API_BASE = '/.netlify/functions';

export default function ProductoPublico({ tiendaSlug, productoSlug, tiendaInicial, productoInicial, isDark, toggleTheme, onVolver, onNavegarAProducto, origen = 'tienda', onIrAlHome, onIrALaTienda, isFirstLoad = false }) {
  // Si venimos de un clic interno (tienda o Home global), tienda+producto ya
  // están en memoria: arrancamos con ellas y SIN loader (render instantáneo).
  // Solo el link externo (WhatsApp/FB) entra en frío y necesita fetch.
  const desdeMemoria = !!(tiendaInicial && productoInicial);
  const [tienda, setTienda] = useState(tiendaInicial || null);
  const [producto, setProducto] = useState(productoInicial || null);
  // Splash full-screen SOLO en carga fría real (link externo WhatsApp/FB,
  // isFirstLoad) y sin datos en memoria. En navegación interna (isFirstLoad
  // false) nunca se muestra el loader de logo — evita el "doble loader"
  // encadenado con el splash de la pantalla que se dejaba.
  const [loading, setLoading] = useState(isFirstLoad && !desdeMemoria);
  const [loaderHiding, setLoaderHiding] = useState(false);
  const [error, setError] = useState(null);

  // Cuando cambia productoInicial (navegar a OTRO producto vía
  // onNavegarAProducto — Root.jsx actualiza productoEnMemoria/productoRoute
  // pero NO desmonta este componente), sincronizamos el state local sin
  // re-fetch cuando ya viene completo desde memoria.
  useEffect(() => {
    if (productoInicial) setProducto(productoInicial);
  }, [productoInicial]);

  useEffect(() => {
    // Datos ya en memoria (navegación interna) — nada que buscar.
    if (desdeMemoria) return;

    const cachedTienda = cacheGet(`tp-tienda-${tiendaSlug}`);
    const startMs = Date.now();
    // Solo aplica el mínimo de animación en carga fría (único caso con loader).
    const MIN_LOADER_MS = isFirstLoad ? 300 : 0;

    const reveal = (t, p) => {
      setTienda(t);
      setProducto(p);
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
        // productos?slug=X&productoSlug=Y devuelve { producto, tienda } juntos
        // — un solo fetch, sin duplicar la consulta a tiendas-crud.
        const pRes = await fetch(`${API_BASE}/productos?slug=${encodeURIComponent(tiendaSlug)}&productoSlug=${encodeURIComponent(productoSlug)}`);
        if (!pRes.ok) throw new Error('Producto no encontrado');
        const data = await pRes.json();
        const p = data?.producto;
        const t = data?.tienda;
        if (!p || !p.id || !t) throw new Error('Producto no encontrado');
        cacheSet(`tp-tienda-${tiendaSlug}`, t);
        reveal(t, p);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    })();
  }, [tiendaSlug, productoSlug, desdeMemoria]);

  const showLoader = loading || loaderHiding;

  if (error && !producto) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'rgb(var(--surface-dim))' }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Producto no encontrado</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>El link puede estar vencido o el producto ya no está disponible.</p>
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

      {tienda && producto && (
        <ProductoIndividual tienda={tienda} producto={producto} isDark={isDark} toggleTheme={toggleTheme} onVolver={onVolver} onNavegarAProducto={onNavegarAProducto}
          origen={origen} onIrAlHome={onIrAlHome} onIrALaTienda={onIrALaTienda} />
      )}
    </>
  );
}
