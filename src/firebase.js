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

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// En PWA (standalone) el redirect abandona el contexto de la app y el browser
// no siempre vuelve al PWA — hay que usar popup aunque sea mobile.
function isPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS Safari
  );
}

export async function signInWithGoogle() {
  // Redirect solo en mobile browser normal (no PWA).
  // PWA y desktop siempre usan popup.
  if (isMobile() && !isPWA()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    if (err.code === 'auth/popup-blocked') {
      // Fallback a redirect solo si no es PWA (en PWA redirect no funciona bien)
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
