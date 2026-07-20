import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, getRedirectResult, signOut } from './firebase';
import TiendaPublica from './TiendaPublica';
import OfertaPublica from './OfertaPublica';
import StoreApp from './StoreApp';
import AdminLogin from './AdminLogin';
import RegistroTienda from './RegistroTienda';
import AdminPanel from './AdminPanel';
import LegalPageView from './LegalPages';
import { apiFetch } from './api.js';
import { KtrlMark } from './Brand';
import { TIENDA_SLUG_FIJA } from './config/constants';
import { ADMIN_EMAILS } from './config/flags';

const API_BASE = '/.netlify/functions';

const LEGAL_PATHS = {
  '/terminos-y-condiciones': 'terminos',
  '/politica-de-privacidad': 'privacidad',
  '/condiciones-para-comercios': 'comercios',
};

function pathToLegal(pathname) {
  return LEGAL_PATHS[pathname] || null;
}

// Rutas reservadas del sistema — NO son slugs de tienda.
const RESERVED = new Set(['admin', 'terminos-y-condiciones', 'politica-de-privacidad', 'condiciones-para-comercios', '']);

// Detecta /:tienda/o/:oferta (oferta individual). Devuelve {tiendaSlug,
// ofertaSlug} o null. El separador /o/ distingue la oferta de futuras
// sub-secciones de la tienda sin ambigüedad.
function pathToOferta(pathname) {
  const segs = pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (segs.length === 3 && segs[1] === 'o' && !RESERVED.has(segs[0]) && segs[0] && segs[2]) {
    return { tiendaSlug: segs[0], ofertaSlug: segs[2] };
  }
  return null;
}

// Detecta /:tienda (home de una tienda por su slug). Devuelve el slug o null
// si la ruta es la raíz, una ruta reservada, o tiene más de 1 segmento.
function pathToTiendaSlug(pathname) {
  const segs = pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (segs.length === 1 && segs[0] && !RESERVED.has(segs[0])) return segs[0];
  return null;
}

// Logo SVG animado (draw del anillo + dot con pop + pulse) — portado literal
// del SplashScreen de LOKAL global (Root.jsx), en turquesa var(--brand-hex).
function LogoLoader() {
  const cx = 40.72, cy = 40.65, r = 11.23;
  return (
    <svg viewBox="0 0 81.18 81.44" width={72} height={72} xmlns="http://www.w3.org/2000/svg" aria-label="Cargando">
      <style>{`
        @keyframes lk-draw { from { stroke-dashoffset: 275; } to { stroke-dashoffset: 0; } }
        @keyframes lk-dot-in {
          0% { transform: scale(0); opacity: 0; }
          55% { transform: scale(1.3); opacity: 1; }
          75% { transform: scale(0.88); }
          90% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes lk-pulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.10); opacity: 0.7; }
        }
        .lk-ring {
          fill: none; stroke: var(--brand-hex, #00B8D9); stroke-width: 7.66;
          stroke-linecap: round; stroke-dasharray: 275; stroke-dashoffset: 275;
          animation: lk-draw 0.85s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
        }
        .lk-dot {
          fill: var(--brand-hex, #00B8D9); transform-origin: ${cx}px ${cy}px;
          animation: lk-dot-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.7s both,
                     lk-pulse 2.2s ease-in-out 1.35s infinite;
        }
      `}</style>
      <rect className="lk-ring" x="3.83" y="3.83" width="73.52" height="73.78" rx="14.83" />
      <circle className="lk-dot" cx={cx} cy={cy} r={r} />
    </svg>
  );
}

// Splash de carga — portado literal del SplashScreenFull de LOKAL global:
// glow radial que pulsa, logo animado, wordmark "lokal", "creado por KTRL".
function AdminLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#060d1a' }}>
      <style>{`
        @keyframes lk-brand-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lk-mark-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lk-glow-pulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.08); } }
      `}</style>

      {/* Glow radial superior — pulsa suave (turquesa) */}
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
        height: '65%',
        background: 'radial-gradient(ellipse 75% 55% at 50% 0%, rgba(0,184,217,0.22), transparent)',
        animation: 'lk-glow-pulse 3s ease-in-out 1.2s infinite',
      }} />
      {/* Reflejo inferior tenue */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{
        height: '40%',
        background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,184,217,0.07), transparent)',
      }} />

      <LogoLoader />

      <div style={{ animation: 'lk-brand-in 0.45s ease 1.0s both', marginTop: 18 }}>
        <span style={{ color: 'white', fontSize: 34, fontWeight: 800, letterSpacing: '0.01em', fontFamily: "'Inter', system-ui, sans-serif" }}>
          lokal
        </span>
      </div>

      <div className="absolute bottom-10 flex items-center gap-1.5"
        style={{ animation: 'lk-mark-in 0.5s ease 1.2s both', opacity: 0 }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          creado por
        </span>
        <KtrlMark className="text-white" style={{ height: 12, width: 'auto', opacity: 0.35 }} />
      </div>
    </div>
  );
}

// Decidido UNA vez al cargar el módulo (no durante el render) — mismo
// criterio que LOKAL global: el splash completo con logo+wordmark solo debe
// verse en una carga real de página (F5 / primera visita), no en cada
// resolución de auth durante una sesión SPA ya abierta. IS_FIRST_LOAD es
// true si no hubo un splash registrado en los últimos 20 minutos.
// Key separada por sección (admin vs. resto/tienda pública): antes era una
// sola key global — entrar a /admin "gastaba" el flag y la próxima visita
// al Home (u otra tienda) dentro de esos 20 min ya no veía el splash
// completo, aunque fuera su primera vez ahí.
const SPLASH_SECTION = window.location.pathname.startsWith('/admin') ? 'admin' : 'tienda';
const SPLASH_TS_KEY = `lokal-links-splash-ts-${SPLASH_SECTION}`;
const _lastSplash = Number(localStorage.getItem(SPLASH_TS_KEY) || 0);
const IS_FIRST_LOAD = Date.now() - _lastSplash > 20 * 60 * 1000;
if (IS_FIRST_LOAD) localStorage.setItem(SPLASH_TS_KEY, String(Date.now()));

// Loader liviano para esperas dentro de una sesión ya iniciada (navegación
// interna, refetch de tienda) — sin el splash a pantalla completa, que solo
// corresponde a una carga real de página.
function InlineLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'var(--surface-solid, #0a0a0a)' }}>
      <LogoLoader />
    </div>
  );
}

// AppLoader: elige entre el splash completo (primera carga) y el liviano
// (navegación dentro de la misma sesión) — reemplaza los usos directos de
// AdminLoader en las esperas de auth/tienda.
function AppLoader() {
  return IS_FIRST_LOAD ? <AdminLoader /> : <InlineLoader />;
}

export default function Root() {
  const [legalPage, setLegalPage] = useState(() => pathToLegal(window.location.pathname));
  const [ofertaRoute, setOfertaRoute] = useState(() => pathToOferta(window.location.pathname));
  // Oferta ya cargada en memoria (clic interno desde la tienda) — evita el
  // re-fetch: la tienda ya tenía el array completo de ofertas. Si es null y
  // hay ofertaRoute (link externo de WhatsApp/FB), OfertaPublica hace el
  // fetch como siempre. Navegación SPA real: URL cambia sin recargar.
  const [ofertaEnMemoria, setOfertaEnMemoria] = useState(null);

  // Clic en una oferta DESDE la tienda: ya tenemos tienda+oferta en memoria,
  // solo cambiamos la URL y montamos la vista al instante (sin loader).
  const navegarAOferta = (tienda, oferta) => {
    const ofertaSlug = oferta.slug || oferta.id;
    window.history.pushState({}, '', `/${tienda.slug}/o/${ofertaSlug}`);
    setOfertaEnMemoria({ tienda, oferta });
    setOfertaRoute({ tiendaSlug: tienda.slug, ofertaSlug });
    window.scrollTo(0, 0);
  };
  // isAdminRoute/isAdminPanelRoute leen window.location.pathname directo en
  // cada render (no son state) — cuando algo hace history.replaceState/
  // pushState fuera de un evento de navegador (popstate), React no sabe que
  // tiene que re-renderizar. Este contador se incrementa a mano después de
  // esos replaceState para forzar el recálculo.
  const [urlTick, setUrlTick] = useState(0);
  const forceUrlRecheck = () => setUrlTick((n) => n + 1);
  const isAdminPanelRoute = window.location.pathname === '/admin/panel';
  const isAdminRoute = (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) && !isAdminPanelRoute;

  // ── Dark mode — único estado compartido por toda la interfaz ─────────────
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('lokal-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lokal-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    document.documentElement.classList.add('theme-transitioning');
    setIsDark((d) => !d);
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);
  };

  // Sincronizar páginas legales + oferta individual con la URL del navegador
  useEffect(() => {
    const onPop = () => {
      setLegalPage(pathToLegal(window.location.pathname));
      const nextOferta = pathToOferta(window.location.pathname);
      setOfertaRoute(nextOferta);
      // Al salir de la ruta de oferta (atrás), soltar la copia en memoria —
      // así una futura visita por link externo no reusa datos viejos.
      if (!nextOferta) setOfertaEnMemoria(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openLegal = (page) => {
    const path = Object.keys(LEGAL_PATHS).find((k) => LEGAL_PATHS[k] === page) || '/';
    window.history.pushState({}, '', path);
    setLegalPage(page);
  };

  const closeLegal = () => {
    window.history.pushState({}, '', '/');
    setLegalPage(null);
  };

  // ── Auth — se escucha SIEMPRE, no solo en /admin. Antes el listener solo
  //    corría en rutas admin, así que en la vista pública de tienda la
  //    sesión de Firebase nunca se restauraba desde localStorage:
  //    firebaseUser quedaba en undefined ahí y el dueño logueado no era
  //    reconocido como tal en su propia página (esDueño=false siempre → sin
  //    FAB "+"/atajo al panel). La sesión persiste en localStorage y debe
  //    estar disponible en toda la navegación, no solo en el backoffice.
  //    getRedirectResult solo es relevante tras el login (rutas admin), pero
  //    llamarlo siempre es inocuo (devuelve null si no hubo redirect). ──────
  const [firebaseUser, setFirebaseUser]       = useState(undefined); // undefined = sin resolver aún
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [tiendaData, setTiendaData]           = useState(null);
  const [loadingTienda, setLoadingTienda]     = useState(false);
  const [tiendaFetchError, setTiendaFetchError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const redirectPromise = getRedirectResult(auth).catch(() => null);
    redirectPromise.finally(() => { if (mounted) setRedirectChecked(true); });

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      await redirectPromise;
      if (!mounted) return;
      setFirebaseUser(user || null);
    });
    return () => { mounted = false; unsub(); };
  }, []);

  // Cargar la tienda DEL USUARIO logueado (multi-tienda real: por googleUid,
  // no por el slug fijo — antes cualquiera que se logueara veía "principal"
  // sin verificar ownership). 404 = no tiene tienda todavía → RegistroTienda.
  useEffect(() => {
    if (!isAdminRoute || !firebaseUser) return undefined;
    let mounted = true;
    setLoadingTienda(true);
    setTiendaFetchError(null);
    apiFetch(`${API_BASE}/tiendas-crud?googleUid=${encodeURIComponent(firebaseUser.uid)}`, { authRequired: true })
      .then(async (r) => {
        // 404 = el usuario no tiene tienda todavía (caso esperado, no un
        // error) → RegistroTienda. Cualquier OTRO fallo (500, red caída) es
        // un error real: antes se trataba igual que 404 y un dueño real con
        // tienda podía terminar viendo el formulario de "creá tu tienda" por
        // un problema de red transitorio, en vez de un mensaje de error.
        if (r.status === 404) { if (mounted) setTiendaData(null); return; }
        if (!r.ok) throw new Error(`No se pudo cargar tu tienda (${r.status})`);
        const t = await r.json();
        if (mounted) setTiendaData(t);
      })
      .catch((err) => { if (mounted) { setTiendaData(null); setTiendaFetchError(err.message || 'No se pudo cargar tu tienda. Probá de nuevo.'); } })
      .finally(() => { if (mounted) setLoadingTienda(false); });
    return () => { mounted = false; };
  }, [isAdminRoute, firebaseUser]);

  const handleLogout = () => { signOut(auth); setTiendaData(null); };

  // ── Oferta individual (/:tienda/o/:oferta) — vista React que reusa los
  //    componentes del home. El link lo comparten WhatsApp/FB; el SSR
  //    responde a crawlers con OG y redirige humanos acá. ──────────────────
  if (ofertaRoute) {
    const volverATienda = () => {
      window.history.pushState({}, '', `/${ofertaRoute.tiendaSlug}`);
      setOfertaRoute(null);
      setOfertaEnMemoria(null);
    };
    // Si la oferta en memoria coincide con la URL actual (clic interno),
    // se la pasamos a OfertaPublica para render instantáneo sin fetch.
    const desdeMemoria = ofertaEnMemoria && ofertaEnMemoria.oferta
      && (ofertaEnMemoria.oferta.slug || ofertaEnMemoria.oferta.id) === ofertaRoute.ofertaSlug
      ? ofertaEnMemoria : null;
    return (
      <OfertaPublica
        tiendaSlug={ofertaRoute.tiendaSlug}
        ofertaSlug={ofertaRoute.ofertaSlug}
        tiendaInicial={desdeMemoria?.tienda}
        ofertaInicial={desdeMemoria?.oferta}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onVolver={volverATienda}
      />
    );
  }

  // ── Páginas legales (accesibles sin login, con URL propia) ───────────────
  if (legalPage) {
    return (
      <LegalPageView
        page={legalPage}
        onNavigate={openLegal}
        onBack={closeLegal}
      />
    );
  }

  // ── Panel de super-admin (/admin/panel) — invitaciones + aprobación de
  //    tiendas. Backend revalida isAdmin real en cada request; esto solo
  //    decide qué UI mostrar en el cliente. Si el email no está en
  //    ADMIN_EMAILS, redirige automáticamente a /admin (login normal de
  //    dueño de tienda) en vez de mostrar un error — nadie que escriba esta
  //    URL a mano sin permiso ve el panel ni un mensaje que confirme que
  //    existe, solo cae en el flujo común (RegistroTienda o StoreApp según
  //    corresponda, resuelto más abajo por isAdminRoute). ─────────────────
  if (isAdminPanelRoute) {
    if (firebaseUser === undefined || !redirectChecked) return <AppLoader />;
    if (!firebaseUser) return <AdminLogin isDark={isDark} toggleTheme={toggleTheme} />;
    const esAdmin = firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase());
    if (!esAdmin) {
      window.history.replaceState({}, '', '/admin');
      forceUrlRecheck();
      return <AppLoader />;
    }
    // onVolver: salir del panel de super-admin y volver al backoffice de la
    // tienda (/admin → StoreApp). Sin esto, la única salida era cerrar sesión.
    return <AdminPanel onLogout={handleLogout} onVolver={() => { window.history.pushState({}, '', '/admin'); forceUrlRecheck(); }} />;
  }

  // ── Backoffice del dueño de la tienda ─────────────────────────────────────
  if (isAdminRoute) {
    if (firebaseUser === undefined || !redirectChecked) return <AppLoader />;
    if (!firebaseUser) return <AdminLogin isDark={isDark} toggleTheme={toggleTheme} />;
    if (loadingTienda) return <AppLoader />;
    // Error real de red/servidor al buscar la tienda del usuario — distinto
    // de "no tiene tienda todavía" (404), que sí lleva a RegistroTienda.
    if (tiendaFetchError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ background: 'var(--surface-solid, #0a0a0a)', color: 'var(--text-primary, #fff)' }}>
          <div>
            <p className="font-bold mb-2">{tiendaFetchError}</p>
            <button onClick={() => window.location.reload()} className="text-xs underline" style={{ color: 'var(--text-secondary, #999)' }}>Reintentar</button>
          </div>
        </div>
      );
    }
    const esAdminLogueado = firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase());
    // Logueado sin tienda propia → registro (trial abierto o invitación,
    // según REGISTRO_MODO). Al crearla, onTiendaUpdate la deja lista para
    // el banner de evaluación de abajo (verificada:false salvo invitación).
    if (!tiendaData) {
      return (
        <RegistroTienda
          firebaseUser={firebaseUser}
          onCreada={setTiendaData}
          onLogout={handleLogout}
          // /admin también es el punto de entrada de login para dueños de
          // tienda — un admin que se loguea acá (sin tienda propia) puede
          // querer ir a /admin/panel en vez de crear una tienda de prueba.
          onIrAlPanelAdmin={esAdminLogueado ? () => { window.history.pushState({}, '', '/admin/panel'); forceUrlRecheck(); } : null}
        />
      );
    }
    return (
      <>
        {/* Trial sin aprobar todavía: puede cargar/probar todo en StoreApp,
            pero no está visible en público (tiendas-crud.js ya lo filtra).
            El link de invitación deja verificada:true desde el registro,
            así que este banner no le aparece a esas tiendas. */}
        {!tiendaData.verificada && (
          <div style={{ position: 'sticky', top: 0, zIndex: 500, padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, background: 'var(--brand-hex, #00B8D9)', color: '#fff' }}>
            Tu tienda está siendo evaluada — vas a poder salir a público en cuanto la aprobemos. Mientras tanto podés cargar ofertas y probar todo.
          </div>
        )}
        <StoreApp
          firebaseUser={firebaseUser}
          tiendaData={tiendaData}
          onLogout={handleLogout}
          onTiendaUpdate={setTiendaData}
          isDark={isDark}
          toggleTheme={toggleTheme}
          isAdmin={esAdminLogueado}
          onOpenAdmin={esAdminLogueado ? () => { window.history.pushState({}, '', '/admin/panel'); forceUrlRecheck(); } : undefined}
        />
      </>
    );
  }

  // ── Tienda pública por slug — multi-tienda: /:tienda resuelve la tienda
  //    de la URL. La raíz (sin slug) cae en TIENDA_SLUG_FIJA como fallback
  //    hasta que exista una landing real (Fase 3). ─────────────────────────
  const tiendaSlug = pathToTiendaSlug(window.location.pathname) || TIENDA_SLUG_FIJA;
  // firebaseUser: para que TiendaPublica detecte si el visitante logueado es
  // el dueño de ESTA tienda (uid === tienda.googleUid) y le ofrezca un
  // acceso directo a su panel, en vez de la vista pública a secas.
  return (
    <TiendaPublica
      slug={tiendaSlug}
      isDark={isDark}
      toggleTheme={toggleTheme}
      firebaseUser={firebaseUser}
      onIrAlPanel={() => { window.history.pushState({}, '', '/admin'); forceUrlRecheck(); }}
      onVerOferta={navegarAOferta}
      isFirstLoad={IS_FIRST_LOAD}
    />
  );
}
