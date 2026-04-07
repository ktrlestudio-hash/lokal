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

// En mobile usa redirect, en desktop popup (mejor UX en ambos casos)
export async function signInWithGoogle() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    await signInWithRedirect(auth, googleProvider);
    return null; // el resultado llega en getRedirectResult al recargar
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export { getRedirectResult, signOut, onAuthStateChanged };
export default app;
