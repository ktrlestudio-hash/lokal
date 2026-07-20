import React, { useState, useEffect } from 'react';
import { TiendaPublicaRenderer } from './tienda-publica/TiendaPublicaRenderer.jsx';
import { AlertCircle, Pencil } from 'lucide-react';
import { LogoFull, KtrlMark } from './Brand';
import { apiFetch } from './api.js';

const API_BASE = '/.netlify/functions';

function LogoLoader() {
  const cx = 40.72, cy = 40.65, r = 11.23;
  return (
    <svg viewBox="0 0 81.18 81.44" width={72} height={72} xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes tp-draw { from{stroke-dashoffset:275}to{stroke-dashoffset:0} }
        @keyframes tp-dot-in { 0%{transform:scale(0);opacity:0}55%{transform:scale(1.3);opacity:1}75%{transform:scale(.88)}90%{transform:scale(1.05)}100%{transform:scale(1);opacity:1} }
        @keyframes tp-pulse { 0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.10);opacity:.7} }
        .tp-ring{fill:none;stroke:var(--brand-hex,#00B8D9);stroke-width:7.66;stroke-linecap:round;stroke-dasharray:275;stroke-dashoffset:275;animation:tp-draw .85s cubic-bezier(.4,0,.2,1) .1s forwards}
        .tp-dot{fill:var(--brand-hex,#00B8D9);transform-origin:${cx}px ${cy}px;animation:tp-dot-in .5s cubic-bezier(.34,1.56,.64,1) .7s both,tp-pulse 2.2s ease-in-out 1.35s infinite}
      `}</style>
      <rect className="tp-ring" x="3.83" y="3.83" width="73.52" height="73.78" rx="14.83" />
      <circle className="tp-dot" cx={cx} cy={cy} r={r} />
    </svg>
  );
}

// Splash completo (logo + wordmark "lokal" + "creado por KTRL") — mismo
// diseño que AdminLoader/SplashScreenFull de Root.jsx, portado acá para la
// primera carga real de una tienda pública (F5 / visita directa al link).
// En navegación interna (ej. volver de una oferta individual) se usa el
// LogoLoader suelto de arriba, sin este envoltorio — ver isFirstLoad prop.
function SplashScreenFull() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden" style={{ background: '#060d1a' }}>
      <style>{`
        @keyframes lk-brand-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lk-mark-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lk-glow-pulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.08); } }
      `}</style>
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: '65%', background: 'radial-gradient(ellipse 75% 55% at 50% 0%, rgba(0,184,217,0.22), transparent)', animation: 'lk-glow-pulse 3s ease-in-out 1.2s infinite' }} />
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '40%', background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,184,217,0.07), transparent)' }} />
      <LogoLoader />
      <div style={{ animation: 'lk-brand-in 0.45s ease 1.0s both', marginTop: 18 }}>
        <span style={{ color: 'white', fontSize: 34, fontWeight: 800, letterSpacing: '0.01em', fontFamily: "'Inter', system-ui, sans-serif" }}>lokal</span>
      </div>
      <div className="absolute bottom-10 flex items-center gap-1.5" style={{ animation: 'lk-mark-in 0.5s ease 1.2s both', opacity: 0 }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>creado por</span>
        <KtrlMark className="text-white" style={{ height: 12, width: 'auto', opacity: 0.35 }} />
      </div>
    </div>
  );
}

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
export default function TiendaPublica({ slug, isDark, toggleTheme, firebaseUser, onIrAlPanel, onVerOferta, isFirstLoad = false }) {
  // Si la tienda ya está en cache (ej. volver desde la oferta), arrancamos
  // CON los datos y SIN loader: la vuelta es instantánea, igual que la ida.
  // El splash/loader solo corresponde a la primera carga en frío.
  const cachedTiendaInicial = cacheGet(`tp-tienda-${slug}`);
  const [tienda, setTienda] = useState(cachedTiendaInicial || null);
  const [ofertas, setOfertas] = useState(() => cacheGet(`tp-ofertas-${slug}`) || []);
  const [loading, setLoading] = useState(!cachedTiendaInicial);
  const [loaderHiding, setLoaderHiding] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('productos');

  useEffect(() => {
    const cacheKey = `tp-tienda-${slug}`;
    const cachedTienda = cacheGet(cacheKey);
    const cachedOfertas = cacheGet(`tp-ofertas-${slug}`);
    const startMs = Date.now();
    const MIN_LOADER_MS = 700; // mínimo para ver la animación del logo (solo carga en frío)

    const reveal = (t, os) => {
      // Carga datos inmediatamente — espera solo si el fetch fue muy rápido
      if (os) setOfertas(os);
      setTienda(t); // pre-cargar todo mientras loader aún está visible
      const wait = Math.max(0, MIN_LOADER_MS - (Date.now() - startMs));
      setTimeout(() => {
        setLoaderHiding(true);
        setTimeout(() => setLoading(false), 320);
      }, wait);
    };

    // Con cache ya sembramos tienda/ofertas en el useState inicial (sin
    // loader) — acá solo refrescamos en segundo plano más abajo, sin reveal.
    if (cachedTienda && !tienda) {
      reveal(cachedTienda, cachedOfertas);
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
        const [tRes, oRes] = await Promise.all([
          apiFetch(`${API_BASE}/tiendas-crud?slug=${encodeURIComponent(slug)}`),
          fetch(`${API_BASE}/ofertas?slug=${encodeURIComponent(slug)}`),
        ]);
        if (!tRes.ok) throw new Error('Tienda no encontrada');
        const t = await tRes.json();
        const os = oRes.ok ? await oRes.json() : [];
        const filtradas = Array.isArray(os) ? os.filter(o => o.activa !== false) : [];
        if (cancelled) return; // el efecto se re-disparó (cambió slug/sesión)
        // No cachear la versión de dueño (trae googleUid): el cache lo lee
        // cualquiera; solo persistimos la forma pública. La copia de dueño
        // vive solo en memoria (state), no en localStorage.
        const esVersionDueño = !!t.googleUid;
        if (!esVersionDueño) {
          cacheSet(cacheKey, t);
          cacheSet(`tp-ofertas-${slug}`, filtradas);
        }
        if (!cachedTienda) reveal(t, filtradas);
        else { setTienda(t); setOfertas(filtradas); }
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
    return () => { cancelled = true; };
  }, [tienda?.id, tienda?.googleUid, firebaseUser]);

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
  const tiendaConOfertas = tienda ? { ...tienda, ofertas } : null;

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
        isFirstLoad ? (
          <div style={{ opacity: loaderHiding ? 0 : 1, transition: 'opacity .35s ease', pointerEvents: loaderHiding ? 'none' : 'auto' }}>
            <SplashScreenFull />
          </div>
        ) : (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgb(var(--surface-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
            opacity: loaderHiding ? 0 : 1,
            transition: 'opacity .35s ease',
            pointerEvents: loaderHiding ? 'none' : 'auto',
          }}>
            <div style={{ position: 'absolute', inset: '0 0 35% 0', background: 'radial-gradient(ellipse 75% 55% at 50% 0%, rgba(0,184,217,0.22), transparent)', pointerEvents: 'none' }} />
            <LogoLoader />
          </div>
        )
      )}

      {/* Página — monta cuando el loader ya terminó, sin transición propia */}
      {tiendaConOfertas && (
        <TiendaPublicaRenderer
          tienda={tiendaConOfertas} isDark={isDark} onToggleTheme={toggleTheme} onVerOferta={onVerOferta}
          esDueño={esDueño}
          onOfertaCreada={(nueva) => setOfertas((prev) => [nueva, ...prev])}
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
        />
      )}

      {/* Botón flotante SOLO para el dueño logueado viendo su propia tienda
          (uid de sesión === googleUid de la tienda). Un visitante común, o
          un dueño mirando la tienda de otro, no lo ven. Atajo a su panel. */}
      {esDueño && !showLoader && (
        <button
          onClick={onIrAlPanel}
          style={{
            position: 'fixed', right: 16, bottom: 'max(16px, env(safe-area-inset-bottom))',
            zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 18px', borderRadius: 9999, border: 'none', cursor: 'pointer',
            background: 'var(--brand-hex, #00B8D9)', color: '#fff',
            fontSize: 14, fontWeight: 700, boxShadow: '0 6px 20px rgba(0,0,0,.25)',
          }}
        >
          <Pencil style={{ width: 16, height: 16 }} />
          Editar mi tienda
        </button>
      )}
    </>
  );
}
