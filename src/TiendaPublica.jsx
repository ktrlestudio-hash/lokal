import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TiendaPublicaRenderer } from './tienda-publica/TiendaPublicaRenderer.jsx';
import { AlertCircle, Pencil } from 'lucide-react';
import { LogoFull } from './Brand';
import { apiFetch } from './api.js';
import { SplashScreenFull, InlineLoader } from './LokalLoader.jsx';
import { uploadOfertaImages } from './storeFormUtils.jsx';

const API_BASE = '/.netlify/functions';

// ─── Cache helpers ────────────────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function cacheSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TiendaPublica({ slug, isDark, toggleTheme, firebaseUser, onIrAlPanel, onVerOferta, onVerProducto, isFirstLoad = false }) {
  // Si la tienda ya está en cache (ej. volver desde la oferta), arrancamos
  // CON los datos y SIN loader: la vuelta es instantánea, igual que la ida.
  // El splash/loader solo corresponde a la primera carga en frío.
  const cachedTiendaInicial = cacheGet(`tp-tienda-${slug}`);
  const [tienda, setTienda] = useState(cachedTiendaInicial || null);
  const [ofertas, setOfertas] = useState(() => cacheGet(`tp-ofertas-${slug}`) || []);
  // productos: catálogo real (precio/stock/categoryId), backend separado de
  // ofertas desde esta sesión (data/productos.json vs data/ofertas.json) —
  // antes tienda.productos siempre llegaba vacío porque nunca hubo fetch
  // propio acá, mismo patrón que ofertas pero a /productos.
  const [productos, setProductos] = useState(() => cacheGet(`tp-productos-${slug}`) || []);
  // Splash full-screen SOLO en carga fría real (F5/link externo, isFirstLoad)
  // Y sin cache. En navegación interna SPA (isFirstLoad=false) nunca se
  // muestra el loader de logo: la pantalla anterior ya estaba montada y el
  // Root persiste — un splash acá se encadenaba con el de la pantalla que se
  // dejaba, dando el "doble loader" que se veía a mitad de transición. Sin
  // cache en navegación interna, se resuelve rápido en background sin tapar.
  const [loading, setLoading] = useState(isFirstLoad && !cachedTiendaInicial);
  const [loaderHiding, setLoaderHiding] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('productos');

  useEffect(() => {
    const cacheKey = `tp-tienda-${slug}`;
    const cachedTienda = cacheGet(cacheKey);
    const cachedOfertas = cacheGet(`tp-ofertas-${slug}`);
    const cachedProductos = cacheGet(`tp-productos-${slug}`);
    const startMs = Date.now();
    // Mínimo para ver la animación del logo — solo aplica en carga fría (el
    // único caso donde el loader se muestra). En navegación interna no hay
    // loader, así que no hay espera artificial: los datos aparecen apenas
    // llegan, sin retención.
    const MIN_LOADER_MS = isFirstLoad ? 700 : 0;

    const reveal = (t, os, ps) => {
      // Carga datos inmediatamente — espera solo si el fetch fue muy rápido
      if (os) setOfertas(os);
      if (ps) setProductos(ps);
      setTienda(t); // pre-cargar todo mientras loader aún está visible
      // Sin loader activo (navegación interna): setear datos directo, sin la
      // secuencia de fade-out — no hay nada que desvanecer.
      if (!loading) return;
      const wait = Math.max(0, MIN_LOADER_MS - (Date.now() - startMs));
      setTimeout(() => {
        setLoaderHiding(true);
        setTimeout(() => setLoading(false), 320);
      }, wait);
    };

    // Con cache ya sembramos tienda/ofertas en el useState inicial (sin
    // loader) — acá solo refrescamos en segundo plano más abajo, sin reveal.
    if (cachedTienda && !tienda) {
      reveal(cachedTienda, cachedOfertas, cachedProductos);
    }

    // Esperar a que Firebase resuelva la sesión (undefined = sin resolver
    // aún) antes de pedir la tienda: si fetcheamos con auth a medio restaurar,
    // apiFetch iría sin token y el backend nos trataría como anónimos (sin
    // googleUid → esDueño=false). Cuando firebaseUser pasa a user|null, este
    // efecto re-corre (dep abajo) y ahí sí manda el token si corresponde.
    // Igual mostramos el cache mientras tanto (arriba), así no hay espera
    // visible — solo se difiere el fetch de red, no el render.
    if (firebaseUser === undefined) return;

    let cancelled = false;
    (async () => {
      try {
        // tiendas-crud con apiFetch (no fetch nativo): manda el token de
        // Firebase si hay sesión activa — sin esto, el backend NUNCA podía
        // saber que el visitante era el propio dueño (siempre lo trataba
        // como anónimo, sin importar que estuviera logueado en el navegador),
        // así que esDueño daba false siempre y el FAB/atajo al panel nunca
        // aparecían. ofertas sigue con fetch público normal, no lo necesita.
        const [tRes, oRes, pRes] = await Promise.all([
          apiFetch(`${API_BASE}/tiendas-crud?slug=${encodeURIComponent(slug)}`),
          fetch(`${API_BASE}/ofertas?slug=${encodeURIComponent(slug)}`),
          fetch(`${API_BASE}/productos?slug=${encodeURIComponent(slug)}`),
        ]);
        if (!tRes.ok) throw new Error('Tienda no encontrada');
        const t = await tRes.json();
        const os = oRes.ok ? await oRes.json() : [];
        const ps = pRes.ok ? await pRes.json() : [];
        const filtradas = Array.isArray(os) ? os.filter(o => o.activa !== false) : [];
        const productosFiltrados = Array.isArray(ps) ? ps.filter(p => p.activa !== false) : [];
        if (cancelled) return; // el efecto se re-disparó (cambió slug/sesión)
        // No cachear la versión de dueño (trae googleUid): el cache lo lee
        // cualquiera; solo persistimos la forma pública. La copia de dueño
        // vive solo en memoria (state), no en localStorage.
        const esVersionDueño = !!t.googleUid;
        if (!esVersionDueño) {
          cacheSet(cacheKey, t);
          cacheSet(`tp-ofertas-${slug}`, filtradas);
          cacheSet(`tp-productos-${slug}`, productosFiltrados);
        }
        if (!cachedTienda) reveal(t, filtradas, productosFiltrados);
        else { setTienda(t); setOfertas(filtradas); setProductos(productosFiltrados); }
      } catch (err) {
        if (!cancelled && !cachedTienda) { setError(err.message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [slug, firebaseUser]);

  // El dueño viendo su PROPIA tienda necesita ver también sus ofertas
  // ocultas/vencidas (para poder reactivarlas desde el sheet de 3 puntos sin
  // ir al panel admin completo) — el fetch de arriba es siempre el listado
  // público (solo vigentes), así que acá pedimos el listado completo
  // (all=1, autenticado) apenas confirmamos que es el dueño real.
  useEffect(() => {
    const esDueñoReal = !!(firebaseUser?.uid && tienda?.googleUid && firebaseUser.uid === tienda.googleUid);
    if (!esDueñoReal || !tienda?.id) return undefined;
    let cancelled = false;
    apiFetch(`${API_BASE}/ofertas?tiendaId=${encodeURIComponent(tienda.id)}&all=1`, { authRequired: true })
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const os = await res.json();
        if (!cancelled && Array.isArray(os)) setOfertas(os);
      })
      .catch(() => {});
    apiFetch(`${API_BASE}/productos?tiendaId=${encodeURIComponent(tienda.id)}&all=1`, { authRequired: true })
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const ps = await res.json();
        if (!cancelled && Array.isArray(ps)) setProductos(ps);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tienda?.id, tienda?.googleUid, firebaseUser]);

  // ─── Cola de subida de ofertas en segundo plano ────────────────────────────
  // Publicar una oferta ya NO bloquea el sheet (ver OfertaQuickForm.jsx): al
  // tocar "Publicar" el sheet cierra al instante y la oferta aparece acá
  // mismo, en la grilla, con estado "pendiente" (foto real vía blob URL +
  // spinner) mientras sube de verdad en background — mismo patrón que
  // "enviar una foto por WhatsApp": la ves aparecer ya, con su progreso
  // propio, podés cancelarla, y si falla queda en rojo con "Reintentar" sin
  // perder los datos. Varias cargas en paralelo (el dueño publica 2-3
  // ofertas seguidas sin esperar) conviven sin pisarse: cada una tiene su
  // propio _localId, y solo se actualiza/quita ESE ítem puntual del array.
  const abortRefs = useRef({}); // _localId -> AbortController, para poder cancelar

  const subirOfertaEnCola = useCallback((localId) => {
    setOfertas((prev) => prev.map((o) => (o._localId === localId ? { ...o, _status: 'uploading', _error: null } : o)));
    const controller = new AbortController();
    abortRefs.current[localId] = controller;

    (async () => {
      try {
        const item = (ofertasRef.current || []).find((o) => o._localId === localId);
        if (!item) return; // se canceló/descartó antes de arrancar
        const { imageUrl, thumbUrl, ogImageUrl } = await uploadOfertaImages(item.fotoFile);
        if (controller.signal.aborted) return;
        const payload = {
          tiendaId: tienda.id,
          nombre: item.nombre,
          imageUrl, thumbUrl, ogImageUrl,
          expireAt: item.expireAt,
          visible: true,
        };
        const res = await apiFetch(`${API_BASE}/ofertas`, {
          method: 'POST', authRequired: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (!res.ok) throw new Error('No se pudo publicar la oferta');
        const nueva = await res.json();
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        setOfertas((prev) => prev.map((o) => (o._localId === localId ? nueva : o)));
      } catch (e) {
        if (controller.signal.aborted) return; // cancelado a mano: no es un error real
        setOfertas((prev) => prev.map((o) => (o._localId === localId ? { ...o, _status: 'error', _error: e.message } : o)));
      } finally {
        delete abortRefs.current[localId];
      }
    })();
  }, [tienda?.id]);

  // ofertasRef: subirOfertaEnCola necesita leer el array MÁS RECIENTE dentro
  // de un closure creado antes de que esa oferta exista (se llama justo
  // después de insertarla) — sin esto, el closure vería el `ofertas` de
  // cuando se creó la función, sin la entrada nueva.
  const ofertasRef = useRef(ofertas);
  useEffect(() => { ofertasRef.current = ofertas; }, [ofertas]);

  const handleOfertaCreadaOptimista = useCallback((datos) => {
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pendiente = {
      _localId: localId, _status: 'uploading', _error: null,
      id: localId, // las cards del template usan o.id como key — reusamos el localId hasta tener el real
      nombre: datos.nombre,
      thumbUrl: datos.previewUrl, imageUrl: datos.previewUrl,
      previewUrl: datos.previewUrl, fotoFile: datos.fotoFile, expireAt: datos.expireAt,
      visible: true,
    };
    setOfertas((prev) => [pendiente, ...prev]);
    subirOfertaEnCola(localId);
  }, [subirOfertaEnCola]);

  const handleReintentarOferta = useCallback((localId) => {
    subirOfertaEnCola(localId);
  }, [subirOfertaEnCola]);

  const handleCancelarOfertaPendiente = useCallback((localId) => {
    abortRefs.current[localId]?.abort();
    delete abortRefs.current[localId];
    setOfertas((prev) => {
      const item = prev.find((o) => o._localId === localId);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((o) => o._localId !== localId);
    });
  }, []);

  const showLoader = loading || loaderHiding;

  if (error && !tienda) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="font-bold text-xl text-white mb-2">Tienda no encontrada</h2>
        <p className="text-ink-dim text-sm mb-6">El link puede estar desactualizado o la tienda ya no está disponible.</p>
        <a href="/" className="inline-flex items-center gap-2 bg-brand text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors">
          Ver tiendas en Lokal
        </a>
      </div>
    </div>
  );

  // Las ofertas del módulo "ofertas" (imagen + link compartible) ya NO se
  // mezclan dentro de tienda.productos — son otra cosa (sin precio/stock),
  // el módulo se renderiza en su propia sección dentro de commerce-modern.jsx.
  // productos: catálogo real, backend separado (data/productos.json) —
  // antes tienda.productos siempre llegaba vacío/undefined, nunca había
  // fetch propio acá.
  const tiendaConOfertas = tienda ? { ...tienda, ofertas, productos } : null;

  // ¿El visitante logueado es el dueño de ESTA tienda? Compara el uid de la
  // sesión Firebase con el googleUid guardado en la tienda — así el atajo al
  // panel solo aparece para el dueño real, no para cualquier sesión activa.
  const esDueño = !!(firebaseUser?.uid && tienda?.googleUid && firebaseUser.uid === tienda.googleUid);

  return (
    <>
      {/* Loader overlay — siempre encima, se desvanece suavemente. Splash
          completo (wordmark + KTRL) solo en carga real de página; en
          navegación interna dentro de la misma sesión, el ícono suelto. */}
      {showLoader && (
        <div style={{ opacity: loaderHiding ? 0 : 1, transition: 'opacity .35s ease', pointerEvents: loaderHiding ? 'none' : 'auto' }}>
          {isFirstLoad ? <SplashScreenFull /> : <InlineLoader />}
        </div>
      )}

      {/* Página — monta cuando el loader ya terminó, sin transición propia */}
      {tiendaConOfertas && (
        <TiendaPublicaRenderer
          tienda={tiendaConOfertas} isDark={isDark} onToggleTheme={toggleTheme} onVerOferta={onVerOferta} onVerProducto={onVerProducto}
          esDueño={esDueño}
          onOfertaCreada={handleOfertaCreadaOptimista}
          onOfertaReintentar={handleReintentarOferta}
          onOfertaCancelarPendiente={handleCancelarOfertaPendiente}
          // La oferta gestionada desde el sheet de 3 puntos puede venir tanto
          // del módulo catálogo (tienda.productos, con carrito) como del
          // módulo ofertas (state `ofertas` aparte, imagen+link sin precio)
          // — mismo backend/endpoint para las dos, pero dos colecciones
          // separadas en el front. Actualizamos/filtramos en ambas: el id no
          // se repite entre colecciones, así que es un no-op seguro en la
          // que no corresponda.
          onOfertaActualizada={(actualizada) => {
            setTienda((prev) => (prev ? {
              ...prev, productos: (prev.productos || []).map((p) => (p.id === actualizada.id ? actualizada : p)),
            } : prev));
            setOfertas((prev) => prev.map((o) => (o.id === actualizada.id ? actualizada : o)));
          }}
          onOfertaEliminada={(id) => {
            setTienda((prev) => (prev ? {
              ...prev, productos: (prev.productos || []).filter((p) => p.id !== id),
            } : prev));
            setOfertas((prev) => prev.filter((o) => o.id !== id));
          }}
          onIrAlPanel={onIrAlPanel}
        />
      )}
    </>
  );
}
