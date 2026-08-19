import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { auth, onAuthStateChanged, getRedirectResult, signOut } from './firebase';
import TiendaPublica from './TiendaPublica';
import OfertaPublica from './OfertaPublica';
import CarritoPublica from './CarritoPublica';
import AdminLogin from './AdminLogin';
import LegalPageView from './LegalPages';
import LandingScreen from './LandingScreen';

// Estas cuatro se cargan aparte, sólo cuando se entra a ellas. Antes todo
// venía en un único bundle de 1.24 MB: alguien que llegaba a la landing
// desde un link, la miraba y se iba, descargaba igual el admin entero, el
// panel de super-admin y el registro.
//
// NO se dividen: landing, login, legales y tienda pública. Son las cuatro
// que puede ver alguien que llega de afuera, y ahí un chunk extra sería un
// parpadeo en la primera impresión — justo lo que no se quiere ganar a
// cambio de unos kB.
//
// StoreApp entra en esta lista aunque sea la más usada por el dueño: cuando
// llega a ella ya pasó por el login, así que la descarga ocurre mientras
// mira una pantalla que igual está esperando datos del servidor.
const StoreApp       = lazy(() => import('./StoreApp'));
const RegistroTienda = lazy(() => import('./RegistroTienda'));
const AdminPanel     = lazy(() => import('./AdminPanel'));
import { apiFetch } from './api.js';
import { ADMIN_EMAILS } from './config/flags';
import { TIENDA_SLUG_FIJA } from './config/constants';
import { SplashScreenFull, InlineLoader } from './LokalLoader.jsx';

const API_BASE = '/.netlify/functions';

const LEGAL_PATHS = {
  '/terminos-y-condiciones': 'terminos',
  '/politica-de-privacidad': 'privacidad',
  '/condiciones-para-comercios': 'comercios',
  '/quienes-somos': 'nosotros',
};

function pathToLegal(pathname) {
  return LEGAL_PATHS[pathname] || null;
}

// Rutas reservadas del sistema — NO son slugs de tienda.
const RESERVED = new Set(['admin', 'terminos-y-condiciones', 'politica-de-privacidad', 'condiciones-para-comercios', 'quienes-somos', '']);

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

// Detecta /:tienda/c/:carrito (pedido individual, módulo "catalogo"). Mismo
// shape que pathToOferta, separador /c/ en vez de /o/ — nunca colisionan.
function pathToCarrito(pathname) {
  const segs = pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (segs.length === 3 && segs[1] === 'c' && !RESERVED.has(segs[0]) && segs[0] && segs[2]) {
    return { tiendaSlug: segs[0], carritoSlug: segs[2] };
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

// AppLoader: elige entre el splash completo (primera carga) y el liviano
// (navegación dentro de la misma sesión) — ambos importados de LokalLoader.jsx
// (única fuente compartida con TiendaPublica/OfertaPublica, ver ese archivo).
// key fija ('app-loader') en todos los usos: garantiza que React reconcilie
// el loader como EL MISMO nodo del DOM entre fases de carga (auth → fetch
// tienda), en vez de desmontar uno y montar otro. Si se remonta, el SVG se
// re-crea y su animación CSS (lk-draw/lk-dot-in, que corre una sola vez con
// `forwards`) reinicia desde cero — ese era el bug del logo "que se anima,
// se reinicia y vuelve a animarse". Con la key estable el nodo persiste y la
// animación sigue su curso sin cortes aunque la condición que lo muestra
// cambie de rama (undefined→loading→loadingTienda).
//
// La variante se decide UNA sola vez por carga de página (constante de
// módulo), NO por render. Una versión anterior la recalculaba en cada
// render contra un flag mutable ("¿ya se mostró el completo?"), y eso
// producía justo el bug que quería evitar: el splash completo aparecía,
// y a mitad de la espera el flag cambiaba, React veía otro tipo de
// componente en la misma posición, desmontaba SplashScreenFull y montaba
// InlineLoader — se veía como "un splash que se corta y arranca otro con
// solo el logo". Un loader que cambia de forma mientras está en pantalla
// nunca es correcto: la variante es una propiedad de ESTA carga, no del
// momento. Si es la primera carga real (IS_FIRST_LOAD), toda espera de
// esta carga muestra el splash de marca completo; si no, todas muestran
// el liviano.
function AppLoader() {
  return IS_FIRST_LOAD
    ? <SplashScreenFull key="app-loader" />
    : <InlineLoader key="app-loader" />;
}

// Duración real de la secuencia de SplashScreenFull (LokalLoader.jsx): el
// último elemento en entrar es "creado por KTRL" con delay 1.2s + 0.5s de
// animación = 1.7s. Se mantiene en pantalla ese tiempo mínimo aunque los
// datos ya estén listos: cortar la animación de marca a mitad se ve peor
// que esperar 300ms de más. Solo aplica a la primera carga real.
const SPLASH_MIN_MS = 1700;

export default function Root() {
  // Ref (no state) leída por el listener global de popstate más abajo, que
  // se registra una sola vez — evita reconectar ese listener en cada
  // login/logout solo para tener el valor fresco de firebaseUser.
  const firebaseUserRef = useRef(undefined);

  // Piso de tiempo mínimo para el splash completo (SOLO primera carga real,
  // IS_FIRST_LOAD) — sin esto, en una conexión rápida los datos (auth +
  // tienda) podían estar listos antes de que la animación del logo+wordmark
  // (ring 0.85s → dot 0.7s+0.5s → "lokal" 1.0s+0.45s → "creado por KTRL"
  // 1.2s+0.5s, termina a los ~1.7s) llegara a completarse, cortándola a
  // mitad de camino. 1700ms cubre esa secuencia completa una sola vez; no
  // aplica a InlineLoader (pull-to-refresh, navegación interna), que no
  // tiene el mismo problema — ahí solo gira el logo sin secuencia.
  const [splashMinCumplido, setSplashMinCumplido] = useState(!IS_FIRST_LOAD);
  useEffect(() => {
    if (!IS_FIRST_LOAD) return;
    const t = setTimeout(() => setSplashMinCumplido(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  const [legalPage, setLegalPage] = useState(() => pathToLegal(window.location.pathname));
  const [ofertaRoute, setOfertaRoute] = useState(() => pathToOferta(window.location.pathname));
  const [carritoRoute, setCarritoRoute] = useState(() => pathToCarrito(window.location.pathname));
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
      // Las capas de UI del admin (sheets, modales, overlays) NO se
      // manejan acá: tienen su propio dueño del historial en
      // src/store/navegacion/uiStack.js — ver ese archivo para el modelo
      // completo. Este handler solo resuelve rutas REALES (pathname).
      setLegalPage(pathToLegal(window.location.pathname));
      const nextOferta = pathToOferta(window.location.pathname);
      setOfertaRoute(nextOferta);
      // Al salir de la ruta de oferta (atrás), soltar la copia en memoria —
      // así una futura visita por link externo no reusa datos viejos.
      if (!nextOferta) setOfertaEnMemoria(null);
      setCarritoRoute(pathToCarrito(window.location.pathname));
      // El resto de las rutas (raíz/landing, /:slug de tienda, /admin) se
      // resuelven leyendo location.pathname en el render, no desde estado:
      // sin este recheck, volver con el botón "atrás" cambiaba la URL pero
      // dejaba la pantalla anterior montada.
      forceUrlRecheck();
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
  // Chunks lazy del backoffice (StoreApp/RegistroTienda) ya descargados —
  // el gate del splash los espera para no soltar el splash y caer en el
  // fallback del Suspense (ver el precargado en el listener de auth).
  const [chunksAdminListos, setChunksAdminListos] = useState(false);
  // Sesión activa y la ruta actual es específicamente "/" (no una ruta
  // reservada como /admin): alguien logueado que llega a la landing por URL
  // directa rebota a /admin en vez de ver botones de login ambiguos con una
  // sesión ya activa detrás. Declarado ACÁ (antes de los useEffect que lo
  // usan) para que el fetch de tienda de abajo pueda arrancar en el mismo
  // ciclo, sin esperar a que el pushState a /admin (ver el otro useEffect
  // que lo consume, más abajo) complete un round-trip extra de render.
  const enRaiz = window.location.pathname === '/';
  const rebotarLandingLogueada = firebaseUser && enRaiz;
  // Arranca en true si entramos directo a /admin: así NO hay un render
  // intermedio con loadingTienda=false entre "auth resuelto" y "el useEffect
  // de carga de tienda arrancó" (el effect corre DESPUÉS del primer render).
  // Sin esto, el AppLoader se desmontaba un frame en ese hueco y volvía a
  // montarse, reiniciando la animación del logo (bug del "loading que se
  // reinicia solo"). El propio effect lo vuelve a poner en true igual.
  const [loadingTienda, setLoadingTienda]     = useState(isAdminRoute);
  const [tiendaFetchError, setTiendaFetchError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const redirectPromise = getRedirectResult(auth).catch(() => null);
    redirectPromise.finally(() => { if (mounted) setRedirectChecked(true); });

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      await redirectPromise;
      if (!mounted) return;
      firebaseUserRef.current = user || null;
      setFirebaseUser(user || null);

      // Con sesión confirmada, el próximo destino es StoreApp o
      // RegistroTienda. Se piden ya, en paralelo con el fetch de la tienda,
      // para que el chunk esté listo cuando toque renderizar: así dividir el
      // bundle no agrega una espera visible, sólo la mueve a un momento en
      // que la pantalla ya estaba esperando datos.
      //
      // El resultado se marca en estado (no se descarta): el gate del splash
      // lo espera. Sin esto, al liberarse el gate con el chunk todavía en
      // vuelo, el <Suspense fallback={<AppLoader/>}> de más abajo montaba un
      // loader NUEVO en otra posición del árbol — otro remontaje, otra
      // animación cortada. Marcar el fallo igual que el éxito es a propósito:
      // si el chunk no baja, que el Suspense muestre su fallback y el error
      // salga por su camino normal, sin dejar el splash colgado para siempre.
      if (user) {
        Promise.all([import('./StoreApp'), import('./RegistroTienda')])
          .catch(() => {})
          .finally(() => { if (mounted) setChunksAdminListos(true); });
      }
    });
    return () => { mounted = false; unsub(); };
  }, []);

  // Cargar la tienda DEL USUARIO logueado (multi-tienda real: por googleUid,
  // no por el slug fijo — antes cualquiera que se logueara veía "principal"
  // sin verificar ownership). 404 = no tiene tienda todavía → RegistroTienda.
  // rebotarLandingLogueada también dispara este fetch UN CICLO ANTES de que
  // el pushState a /admin complete — así isAdminRoute pasa a true recién en
  // el próximo render, pero el
  // fetch de tienda ya viene en vuelo. Sin esto, la cadena de renders con
  // sesión activa en "/" pasaba por varias ramas de AppLoader en secuencia
  // (esperando pushState → esperando isAdminRoute → esperando loadingTienda),
  // y cada una remontaba el splash completo desde cero (animación de ~1.7s
  // reiniciándose una y otra vez, se veía como "3 splashes cortándose").
  const debeCargarTiendaDeUsuario = (isAdminRoute || rebotarLandingLogueada) && !!firebaseUser;
  useEffect(() => {
    if (!debeCargarTiendaDeUsuario) return undefined;
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
  }, [debeCargarTiendaDeUsuario, firebaseUser]);

  const handleLogout = () => { signOut(auth); setTiendaData(null); };

  // enRaiz/rebotarLandingLogueada ya se declararon más arriba (justo
  // después de firebaseUser) — este hook DEBE vivir antes de cualquier
  // return condicional (ofertaRoute/carritoRoute/legalPage/etc. más abajo),
  // no es el caso del botón atrás (eso lo cubre el centinela del listener
  // de popstate más arriba) — acá location.pathname realmente cambió a "/".
  // Mientras Firebase Auth todavía no resolvió si hay sesión (undefined,
  // distinto de null = "resuelto, sin sesión"), NO hay que mostrar el
  // landing en la raíz todavía — si termina habiendo sesión activa, el
  // rebote de arriba entra recién en el efecto siguiente, así que sin este
  // loader se veía el landing "flashear" un par de segundos antes de saltar
  // al admin en cada carga con sesión guardada (aunque la tab ya hubiera
  // estado en segundo plano con la app cargada, el listener de auth vuelve
  // a arrancar en undefined en cada montaje de Root).
  // Timeout de seguridad: onAuthStateChanged con sesión persistida resuelve
  // casi instantáneo en el caso normal (lectura local, no espera red), pero
  // si por lo que sea tarda de más, no hay que dejar a un visitante SIN
  // sesión mirando un loader vacío más de un instante — mejor mostrarle el
  // landing igual y, en el caso raro de que después resulte haber sesión,
  // rebotarLandingLogueada ya se encarga de saltar a /admin apenas resuelva.
  const [authTimedOut, setAuthTimedOut] = useState(false);
  useEffect(() => {
    if (firebaseUser !== undefined) return;
    const t = setTimeout(() => setAuthTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, [firebaseUser]);
  const esperandoAuthEnRaiz = firebaseUser === undefined && enRaiz && !authTimedOut;
  useEffect(() => {
    if (!rebotarLandingLogueada) return;
    window.history.replaceState({}, '', '/admin');
    forceUrlRecheck();
  }, [rebotarLandingLogueada]);

  // Gate único de la primera carga: mientras esté activo, TODA la app
  // muestra un solo <AppLoader/> desde esta misma línea — un único nodo que
  // nunca se desmonta, así la animación de marca corre entera una vez y no
  // se reinicia. Se sale del gate recién cuando no queda nada por resolver
  // que fuera a mostrar OTRO loader después (auth, tienda del usuario,
  // chunk lazy del backoffice); cada una de esas esperas vive más abajo en
  // una rama distinta del árbol, y soltar el splash antes de tiempo hacía
  // que React montara un loader nuevo ahí — el "segundo splash cortado".
  //
  // Las esperas de sesión aplican SOLO a rutas que dependen de auth (admin,
  // admin/panel, o la raíz que puede rebotar a admin): una oferta
  // compartida o una tienda pública no deben esperar a Firebase.
  const rutaDependeDeAuth = isAdminRoute || isAdminPanelRoute || enRaiz;
  const authSinResolver = rutaDependeDeAuth && (firebaseUser === undefined || !redirectChecked);
  const vaAlBackoffice = (isAdminRoute || rebotarLandingLogueada) && !!firebaseUser;
  const backofficeSinPreparar = vaAlBackoffice && (loadingTienda || !chunksAdminListos);
  const mostrandoSplash = IS_FIRST_LOAD && (!splashMinCumplido || authSinResolver || backofficeSinPreparar);

  // El <meta theme-color> del <head> arranca en el oscuro del splash
  // (#040a14, ver index.html) para no saltar celeste→oscuro→celeste en la
  // barra de estado de la PWA durante la carga (Android/iOS la calculan
  // del color de fondo real, no solo de la meta tag). Una vez que el
  // splash se retira y hay contenido real en pantalla, hay que devolverla
  // al color de marca — sin esto quedaría oscura para siempre, incluso
  // dentro del admin en tema claro.
  useEffect(() => {
    if (mostrandoSplash) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#00B8D9');
  }, [mostrandoSplash]);

  if (mostrandoSplash) return <AppLoader />;

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
        // Swipe horizontal entre ofertas de la MISMA tienda (ver
        // OfertaIndividual.jsx) — solo tiene sentido si llegamos desde un
        // clic interno en la tienda (desdeMemoria trae tienda.ofertas
        // completo). Un link directo de WhatsApp/FB nunca tiene esa lista,
        // así que el gesto simplemente no se habilita ahí (no hay prop que
        // pasarle). Reusa navegarAOferta: mismo mecanismo de cambiar
        // URL+memoria que ya usa el clic normal desde la tienda.
        onNavegarAOferta={desdeMemoria ? (nuevaOferta) => navegarAOferta(desdeMemoria.tienda, nuevaOferta) : null}
        isFirstLoad={IS_FIRST_LOAD}
      />
    );
  }

  // ── Pedido individual (/:tienda/c/:carrito) — link que reemplaza al
  //    mensaje de texto plano a WhatsApp: acá el link ES el pedido, con su
  //    propio OG dinámico (carrito-og edge function) y una vista donde el
  //    vendedor puede confirmar/cancelar si es el dueño. ────────────────────
  if (carritoRoute) {
    const volverATienda = () => {
      window.history.pushState({}, '', `/${carritoRoute.tiendaSlug}`);
      setCarritoRoute(null);
    };
    return (
      <CarritoPublica
        tiendaSlug={carritoRoute.tiendaSlug}
        carritoSlug={carritoRoute.carritoSlug}
        firebaseUser={firebaseUser}
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
        isDark={isDark}
        toggleTheme={toggleTheme}
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
    if (!firebaseUser) return (
      <AdminLogin
        isDark={isDark}
        toggleTheme={toggleTheme}
        // Sin onVolver, AdminLogin cae a window.location.href='/' y recarga
        // la página entera para volver a la landing: pantalla en blanco y
        // splash de nuevo. Es el mismo salto que ya se corrigió en el
        // sentido landing→login; acá va el inverso, con el pushState que
        // usa el resto de la app.
        onVolver={() => { window.history.pushState({}, '', '/'); forceUrlRecheck(); }}
      />
    );
    const esAdmin = firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase());
    if (!esAdmin) {
      window.history.replaceState({}, '', '/admin');
      forceUrlRecheck();
      return <AppLoader />;
    }
    // onVolver: salir del panel de super-admin y volver al backoffice de la
    // tienda (/admin → StoreApp). Sin esto, la única salida era cerrar sesión.
    // Suspense con el MISMO AppLoader que ya usa el resto del flujo: al
    // dividir el bundle, la espera por el chunk se ve igual que la espera
    // por los datos, sin introducir un loader distinto.
    return (
      <Suspense fallback={<AppLoader />}>
        <AdminPanel onLogout={handleLogout} onVolver={() => { window.history.pushState({}, '', '/admin'); forceUrlRecheck(); }} />
      </Suspense>
    );
  }

  // ── Backoffice del dueño de la tienda ─────────────────────────────────────
  // rebotarLandingLogueada entra por acá TAMBIÉN (no solo isAdminRoute): con
  // sesión activa en "/", el destino final siempre es este mismo bloque, así
  // que tratarlo como una rama aparte (como antes) hacía que React viera un
  // árbol JSX distinto entre "esperando el pushState" y "ya en /admin",
  // remontando el splash de la nada — ver debeCargarTiendaDeUsuario más
  // arriba para el mismo criterio aplicado al fetch de tienda.
  if (isAdminRoute || rebotarLandingLogueada) {
    if (firebaseUser === undefined || !redirectChecked) return <AppLoader />;
    if (!firebaseUser) return (
      <AdminLogin
        isDark={isDark}
        toggleTheme={toggleTheme}
        // Sin onVolver, AdminLogin cae a window.location.href='/' y recarga
        // la página entera para volver a la landing: pantalla en blanco y
        // splash de nuevo. Es el mismo salto que ya se corrigió en el
        // sentido landing→login; acá va el inverso, con el pushState que
        // usa el resto de la app.
        onVolver={() => { window.history.pushState({}, '', '/'); forceUrlRecheck(); }}
      />
    );
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
        <Suspense fallback={<AppLoader />}>
          <RegistroTienda
            firebaseUser={firebaseUser}
            onCreada={setTiendaData}
            onLogout={handleLogout}
            // /admin también es el punto de entrada de login para dueños de
            // tienda — un admin que se loguea acá (sin tienda propia) puede
            // querer ir a /admin/panel en vez de crear una tienda de prueba.
            onIrAlPanelAdmin={esAdminLogueado ? () => { window.history.pushState({}, '', '/admin/panel'); forceUrlRecheck(); } : null}
          />
        </Suspense>
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
        {/* El Suspense va acá dentro y no envolviendo el fragmento entero:
            así el banner de evaluación de arriba sigue en pantalla mientras
            se descarga el chunk, en vez de parpadear junto con él. */}
        <Suspense fallback={<AppLoader />}>
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
        </Suspense>
      </>
    );
  }

  // ── Raíz → landing pública. Antes caía en TIENDA_SLUG_FIJA: cualquiera
  //    que entrara sin slug veía la tienda de UN negocio concreto, que no
  //    es lo que espera alguien que llega a la raíz del producto.
  //    Las tiendas siguen sirviéndose por su slug propio (/:tienda). ──────
  // (rebotarLandingLogueada ya se resolvió arriba, dentro del bloque
  // isAdminRoute unificado — nunca llega hasta acá con sesión activa.)
  // Sesión todavía sin resolver en la raíz: esperar acá (mismo loader que
  // ya usa el resto de la app, primer pintado real de React) en vez de
  // mostrar el landing y recién después rebotar si resulta haber sesión
  // — sin esto, cualquier carga con sesión guardada mostraba el landing
  // "flasheando" un instante antes de saltar al admin.
  if (esperandoAuthEnRaiz) return <AppLoader />;

  if (!pathToTiendaSlug(window.location.pathname)) {
    return (
      <LandingScreen
        isDark={isDark}
        toggleTheme={toggleTheme}
        // pushState + recheck en vez de window.location.href: pasar de la
        // landing al login no debe recargar la página entera (pantalla en
        // blanco + splash de nuevo). Mismo mecanismo que el resto de la app.
        onIrAlPanel={() => { window.history.pushState({}, '', '/admin'); forceUrlRecheck(); }}
        // "Ver la tienda completa": misma navegación interna, a la tienda de
        // ejemplo real. No abre pestaña ni recarga — cambia la URL y Root
        // renderiza TiendaPublica, que es cómo se ve de verdad. El "atrás"
        // del navegador vuelve a la landing.
        onVerEjemplo={() => { window.history.pushState({}, '', `/${TIENDA_SLUG_FIJA}`); forceUrlRecheck(); }}
      />
    );
  }

  // ── Tienda pública por slug — multi-tienda: /:tienda resuelve la tienda
  //    de la URL. ────────────────────────────────────────────────────────
  const tiendaSlug = pathToTiendaSlug(window.location.pathname);
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
