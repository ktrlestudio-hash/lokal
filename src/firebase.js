import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

// Variables de entorno — configurar en .env y en Netlify dashboard
// Ver .env.example para instrucciones de como obtenerlas
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// PWA (standalone): el redirect abandona el contexto de la app y el browser
// no siempre vuelve al PWA — se necesita popup en ese caso, sin excepción.
function isPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS Safari
  );
}

// SIEMPRE popup, también en mobile browser normal — antes mobile usaba
// signInWithRedirect(), que depende de que el navegador preserve el
// sessionStorage que Firebase deja ANTES de navegar a accounts.google.com y
// lo recupere al volver. Con authDomain en un dominio distinto al del sitio
// (lokal-mvp.firebaseapp.com vs. lokallinks.netlify.app — así es como
// Firebase Auth siempre trabaja, el authDomain no es el dominio del site),
// el Storage Partitioning de Chrome Android trata ese sessionStorage como
// "de terceros" relativo al origen del sitio y lo pierde en el viaje de
// ida y vuelta — el login redirige bien a Google, vuelve bien a la app,
// pero getRedirectResult() nunca encuentra la sesión (silencioso, sin
// error) y el usuario cae de nuevo en la pantalla de login. Popup evita el
// problema por completo: todo el intercambio ocurre en la misma pestaña/
// contexto de storage, sin depender de que sobreviva una navegación
// completa. Google ya no bloquea popups por defecto en Chrome Android
// moderno (el bloqueo agresivo era un problema de hace varios años).
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    if (err.code === 'auth/popup-blocked') {
      // Fallback a redirect solo si no es PWA (en PWA redirect no funciona
      // bien) — el bug de storage-partitioning es preferible a "no puede
      // loguearse en absoluto" cuando el navegador bloqueó el popup.
      if (!isPWA()) {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw new Error('El navegador bloqueó el popup. Permitir popups para este sitio e intentar de nuevo.');
    }
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      const e = new Error('popup-closed');
      e.code = 'popup-closed';
      throw e;
    }
    throw err;
  }
}

// ─── Google Identity Services (login nativo) ─────────────────────────────────
// signInWithPopup abre una ventana que carga PRIMERO el authDomain de
// Firebase (lokal-mvp.firebaseapp.com) y recién después salta a
// accounts.google.com: eso es el "fondo blanco vacío" que se ve un instante
// antes de la lista de cuentas, y no hay forma de sacarlo desde nuestro lado
// porque ocurre dentro del popup.
//
// GIS resuelve el login en la MISMA página (diálogo nativo del navegador,
// sin ventana nueva) y devuelve un ID token que se cambia por una sesión de
// Firebase con signInWithCredential. Es el camino que la propia doc de
// Firebase recomienda para web:
// https://firebase.google.com/docs/auth/web/google-signin
//
// Requiere el Client ID de OAuth del proyecto (VITE_GOOGLE_CLIENT_ID) y que
// el dominio esté en "Authorized JavaScript origins" de ese cliente. Si algo
// de eso falta, gisDisponible() da false y el llamador cae al popup de
// siempre — el login nunca queda sin camino.
const GIS_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GIS_SRC = 'https://accounts.google.com/gsi/client';

let gisPromise = null;
// initialize() es GLOBAL, no por botón: la landing monta dos BotonGoogle
// (hero y bloque de precio) y la segunda llamada pisaba la config de la
// primera, incluido su callback. Se inicializa una sola vez y los callbacks
// se leen de esta ref, así el botón que se toque usa los del momento.
let gisInicializado = false;
let oneTapDisparado = false;
const gisCallbacks = { onLogin: null, onError: null };

// Carga el script una sola vez, sin bloquear el render inicial. Se reusa la
// misma promesa en llamadas concurrentes (dos botones en la misma página).
export function cargarGIS() {
  if (!GIS_CLIENT_ID) return Promise.reject(new Error('Falta VITE_GOOGLE_CLIENT_ID'));
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (gisPromise) return gisPromise;

  gisPromise = new Promise((resolve, reject) => {
    let listo = false;
    const terminar = (api) => { if (!listo) { listo = true; resolve(api); } };
    const fallar = (msg) => {
      if (listo) return;
      listo = true;
      gisPromise = null; // permite reintentar si fue un fallo puntual
      reject(new Error(msg));
    };

    // Sondeo en vez de depender sólo del evento 'load': si el script ya
    // estaba en el DOM y YA había terminado de cargar, engancharle un
    // listener no sirve —ese evento no vuelve a dispararse— y la promesa
    // quedaba colgada sin resolver ni rechazar. Con la promesa colgada el
    // botón nunca se marcaba listo y siempre se veía el de respaldo (popup).
    const desde = Date.now();
    const revisar = () => {
      if (listo) return;
      if (window.google?.accounts?.id) return terminar(window.google.accounts.id);
      if (Date.now() - desde > 8000) return fallar('Google Identity Services no respondió a tiempo');
      setTimeout(revisar, 60);
    };

    const existente = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (!existente) {
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener('error', () => fallar('No se pudo cargar Google Identity Services'), { once: true });
      document.head.appendChild(script);
    }
    revisar();
  });
  return gisPromise;
}

export function gisDisponible() {
  return !!GIS_CLIENT_ID;
}

// Cambia el ID token que devuelve GIS por una sesión real de Firebase.
// onAuthStateChanged (Root.jsx) se dispara solo al resolverse.
export async function loginConIdToken(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

// Renderiza el botón oficial de Google en `contenedor`. Devuelve una función
// de limpieza para desmontarlo.
//
// El botón lo dibuja Google dentro de un iframe propio: no se puede estilar
// desde nuestro CSS (por eso los parámetros de apariencia van acá, no en
// clases). `width` en píxeles porque GIS ignora anchos porcentuales.
export async function renderBotonGoogle(contenedor, { onLogin, onError, onOrigenRechazado, mostrarOneTap = true, theme = 'outline', width = 320, colorScheme = 'light' } = {}) {
  const gis = await cargarGIS();

  // Los callbacks se guardan aparte del initialize: como éste corre una sola
  // vez, el closure quedaría atado a los callbacks del primer botón montado.
  gisCallbacks.onLogin = onLogin;
  gisCallbacks.onError = onError;

  if (!gisInicializado) {
    gisInicializado = true;
    gis.initialize({
    client_id: GIS_CLIENT_ID,
    callback: async (response) => {
      try {
        const user = await loginConIdToken(response.credential);
        gisCallbacks.onLogin?.(user);
      } catch (err) {
        gisCallbacks.onError?.(err);
      }
    },
    // FedCM: la API del navegador que reemplaza a las cookies de terceros
    // para federación de identidad, y que en Android Chrome presenta el
    // selector de cuentas como un bottom sheet del sistema en vez de un
    // diálogo con chrome propio de Google.
    //
    // Los DOS flags viven acá, en IdConfiguration — no en las opciones de
    // renderButton, que es donde estaba use_fedcm_for_button antes: ahí
    // Google lo ignora en silencio (GsiButtonConfiguration solo acepta
    // type/theme/size/text/shape/logo_alignment/width/locale/
    // click_listener/state) y el botón seguía abriendo el diálogo clásico.
    use_fedcm_for_button: true,
    use_fedcm_for_prompt: true, // deprecado, se mantiene por compatibilidad
    // color_scheme: que el diálogo nativo acompañe el tema de la página en
    // vez de salir siempre claro sobre el fondo oscuro de la landing.
    color_scheme: colorScheme,
    auto_select: false,
    cancel_on_tap_outside: true,
    });
  }

  // One Tap: el diálogo con la cuenta ya detectada. Es el camino de login
  // más corto (un toque, sin ventana intermedia) y por eso se deja activo.
  // No se puede estilar ni posicionar — con FedCM lo dibuja el navegador,
  // no la página—, así que se acepta como viene.
  //
  // De paso sirve de sonda: renderButton NO avisa si el dominio falta en
  // "Authorized JavaScript origins" (dibuja el botón igual y falla recién al
  // tocarlo), mientras que prompt() sí reporta el motivo.
  // Solo con oneTapDisparado en false: la landing monta dos botones, y sin
  // este guard el prompt salía dos veces por carga.
  const dispararOneTap = () => {
    if (!mostrarOneTap || oneTapDisparado) return;
    oneTapDisparado = true;
    try {
      gis.prompt((notification) => {
        const motivo = notification?.getNotDisplayedReason?.();
        if (motivo === 'unregistered_origin' || motivo === 'invalid_client') {
          onOrigenRechazado?.(motivo);
        }
      });
    } catch { /* el botón sigue siendo el camino principal */ }
  };

  gis.renderButton(contenedor, {
    type: 'standard',
    theme,
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    logo_alignment: 'center',
    width,
  });

  // El One Tap va DESPUÉS del botón y con un respiro: los dos consultan el
  // estado de sesión, y lanzarlos juntos hacía que compitieran — de ahí el
  // elemento que asomaba y desaparecía debajo del botón mientras éste
  // todavía se estaba personalizando.
  setTimeout(dispararOneTap, 900);
  // Sin cleanup: cancel() no es "desmontar el botón", es "el usuario eligió
  // otro método de login, sacá el One Tap de la pantalla". Llamarlo en cada
  // cleanup de React cancelaba el flujo de Google ante cualquier re-render y
  // rompía el comportamiento nativo. El botón se va solo cuando React quita
  // su contenedor del DOM.
  return () => {};
}

export { getRedirectResult, signOut, onAuthStateChanged };
export default app;
