import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, getRedirectResult, signOut } from './firebase';
import { Loader2, Store } from 'lucide-react';
import UserApp from './App';
import StoreApp from './StoreApp';
import InviteFlow from './InviteFlow';
import AuthScreen from './AuthScreen';

const API_BASE = '/.netlify/functions';

export default function Root() {
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [tiendaData, setTiendaData]     = useState(null);
  const [checkingTienda, setCheckingTienda] = useState(false);
  const [inviteToken, setInviteToken]   = useState(null);

  // ── Dark mode — default dark, persiste en localStorage ────────────────────
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('lokal-theme');
    return saved ? saved === 'dark' : true; // dark por defecto
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('lokal-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(d => !d);

  // ── Detectar token en URL ──────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) setInviteToken(token);
  }, []);

  // ── Firebase auth ──────────────────────────────────────────────────────────
  useEffect(() => {
    getRedirectResult(auth).catch(() => {});
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user || null);
      if (user) await checkTienda(user.uid);
      else { setTiendaData(null); setCheckingTienda(false); }
    });
    return unsub;
  }, []);

  const checkTienda = async (googleUid) => {
    setCheckingTienda(true);
    try {
      const res = await fetch(`${API_BASE}/tiendas-crud?googleUid=${encodeURIComponent(googleUid)}`);
      setTiendaData(res.ok ? await res.json() : null);
    } catch {
      setTiendaData(null);
    } finally {
      setCheckingTienda(false);
    }
  };

  const handleLogout = () => { signOut(auth); setTiendaData(null); };

  const handleTiendaCreated = (tienda) => {
    setTiendaData(tienda);
    window.history.replaceState({}, '', '/');
    setInviteToken(null);
  };

  // ── Cargando ───────────────────────────────────────────────────────────────
  if (firebaseUser === undefined || checkingTienda) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
        </div>
      </div>
    );
  }

  if (inviteToken) {
    return (
      <InviteFlow
        token={inviteToken}
        firebaseUser={firebaseUser}
        onComplete={handleTiendaCreated}
        onCancel={() => { window.history.replaceState({}, '', '/'); setInviteToken(null); }}
      />
    );
  }

  if (firebaseUser && tiendaData) {
    return <StoreApp firebaseUser={firebaseUser} tiendaData={tiendaData} onLogout={handleLogout} onTiendaUpdate={setTiendaData} isDark={isDark} toggleTheme={toggleTheme} />;
  }

  if (!firebaseUser) return <AuthScreen />;

  return <UserApp firebaseUser={firebaseUser} onLogout={handleLogout} isDark={isDark} toggleTheme={toggleTheme} />;
}
