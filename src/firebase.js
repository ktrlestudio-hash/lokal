import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
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

export { getRedirectResult, signOut, onAuthStateChanged };
export default app;
