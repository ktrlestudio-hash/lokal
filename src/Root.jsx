import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, getRedirectResult, signOut } from './firebase';
import { Loader2, Store, AlertCircle, Clock } from 'lucide-react';
import UserApp from './App';
import StoreApp from './StoreApp';
import InviteFlow from './InviteFlow';
import AuthScreen from './AuthScreen';
import StoreRegisterFlow from './StoreRegisterFlow';
import LegalPageView from './LegalPages';

const LEGAL_PATHS = {
  '/terminos-y-condiciones': 'terminos',
  '/politica-de-privacidad': 'privacidad',
  '/condiciones-para-comercios': 'comercios',
};

function pathToLegal(pathname) {
  return LEGAL_PATHS[pathname] || null;
}

const API_BASE = '/.netlify/functions';
const POLL_INTERVAL_MS = 2500;
const POLL_MAX_ATTEMPTS = 10;

export default function Root() {
  const [firebaseUser, setFirebaseUser]       = useState(undefined);
  const [tiendaData, setTiendaData]           = useState(null);
  const [checkingTienda, setCheckingTienda]   = useState(false);
  const [inviteToken, setInviteToken]         = useState(null);
  const [registeringStore, setRegisteringStore] = useState(false);
  const [initialPlan, setInitialPlan]         = useState(null);
  const [legalPage, setLegalPage]             = useState(() => pathToLegal(window.location.pathname));

  // Estado del redirect de MercadoPago
  const [mpStatus, setMpStatus]         = useState(null);  // 'approved'|'failure'|'pending'
  const [pollingTienda, setPollingTienda] = useState(false);
  const [pollMessage, setPollMessage]    = useState('');

  // ── Dark mode ─────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('lokal-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('lokal-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(d => !d);

  // ── Detectar params en URL ────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token    = params.get('token');
    const status   = params.get('mp_status');

    if (token)  setInviteToken(token);
    if (status) setMpStatus(status);
  }, []);

  // ── Firebase auth ─────────────────────────────────────────────────────────
  useEffect(() => {
    getRedirectResult(auth).catch(err => {
      if (err.code !== 'auth/no-auth-event') console.warn('getRedirectResult:', err.code);
    });

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user || null);
      if (user) {
        // Verificar intent de registro guardado por la landing (AuthScreen)
        const intentRaw = sessionStorage.getItem('lokal-register-intent');
        if (intentRaw) {
          try {
            const intent = JSON.parse(intentRaw);
            if (intent.intent === 'register-store') {
              sessionStorage.removeItem('lokal-register-intent');
              setInitialPlan(intent.plan || 'mensual');
              // Verificar si ya tiene tienda primero
              const existingTienda = await checkTiendaSilent(user.uid);
              if (!existingTienda) {
                setRegisteringStore(true);
              }
              return;
            }
          } catch { /* ignorar */ }
        }
        await checkTienda(user.uid);
      } else {
        setTiendaData(null);
        setCheckingTienda(false);
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cuando hay mp_status=approved, hacer polling para encontrar la tienda ──
  useEffect(() => {
    if (mpStatus !== 'approved' || !firebaseUser) return;
    // Limpiar URL
    window.history.replaceState({}, '', '/');

    // Si ya tenemos tienda (webhook fue rápido), simplemente seguimos
    if (tiendaData) { setMpStatus(null); return; }

    // Polling: el webhook de MP puede tardar unos segundos en crear la tienda
    let attempts = 0;
    setPollingTienda(true);
    setPollMessage('Procesando tu pago...');

    const poll = async () => {
      attempts++;
      const found = await checkTiendaSilent(firebaseUser.uid);
      if (found) {
        setTiendaData(found);
        setPollingTienda(false);
        setMpStatus(null);
        return;
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        setPollingTienda(false);
        setMpStatus('poll-timeout');
        return;
      }
      setPollMessage(`Verificando pago (${attempts}/${POLL_MAX_ATTEMPTS})...`);
      setTimeout(poll, POLL_INTERVAL_MS);
    };

    setTimeout(poll, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mpStatus, firebaseUser]);

  useEffect(() => {
    if (mpStatus === 'failure') window.history.replaceState({}, '', '/');
  }, [mpStatus]);

  // Sincronizar páginas legales con la URL del navegador
  useEffect(() => {
    const onPop = () => setLegalPage(pathToLegal(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openLegal = (page) => {
    const path = Object.keys(LEGAL_PATHS).find(k => LEGAL_PATHS[k] === page) || '/';
    window.history.pushState({}, '', path);
    setLegalPage(page);
  };

  const closeLegal = () => {
    window.history.pushState({}, '', '/');
    setLegalPage(null);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  const checkTiendaSilent = async (googleUid) => {
    try {
      const res = await fetch(`${API_BASE}/tiendas-crud?googleUid=${encodeURIComponent(googleUid)}`);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  };

  const handleLogout = () => { signOut(auth); setTiendaData(null); };

  const handleTiendaCreated = (tienda) => {
    setTiendaData(tienda);
    window.history.replaceState({}, '', '/');
    setInviteToken(null);
  };

  const handleRegisterStore = (plan) => {
    setInitialPlan(plan || null);
    setRegisteringStore(true);
  };

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

  // ── Pantalla de carga ─────────────────────────────────────────────────────
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

  // ── Polling post-pago ─────────────────────────────────────────────────────
  if (pollingTienda) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/30">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-white font-black text-2xl mb-2">¡Pago recibido!</h2>
          <p className="text-slate-400 mb-6">Estamos activando tu cuenta de tienda...</p>
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {pollMessage}
          </div>
        </div>
      </div>
    );
  }

  // ── Timeout de polling: MP tardó demasiado ────────────────────────────────
  if (mpStatus === 'poll-timeout') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-white font-black text-2xl mb-2">Procesando tu pago</h2>
          <p className="text-slate-400 mb-6">
            El pago fue recibido pero la activación puede tardar unos minutos. Recargá la página en unos instantes.
          </p>
          <button
            onClick={() => { setMpStatus(null); window.location.reload(); }}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3 rounded-2xl transition-colors"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  // ── Pago fallido ──────────────────────────────────────────────────────────
  if (mpStatus === 'failure' && firebaseUser && !tiendaData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-white font-black text-2xl mb-2">Pago cancelado</h2>
          <p className="text-slate-400 mb-6">No se realizó ningún cobro. Podés intentarlo de nuevo cuando quieras.</p>
          <button
            onClick={() => { setMpStatus(null); setRegisteringStore(true); }}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3 rounded-2xl transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // ── Flujo invite (link de invitación) ─────────────────────────────────────
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

  // ── Registro de tienda (self-service) ─────────────────────────────────────
  if (registeringStore && firebaseUser && !tiendaData) {
    return (
      <StoreRegisterFlow
        firebaseUser={firebaseUser}
        initialPlan={initialPlan}
        onCancel={() => { setRegisteringStore(false); setInitialPlan(null); }}
      />
    );
  }

  // ── App de tienda ─────────────────────────────────────────────────────────
  if (firebaseUser && tiendaData) {
    return (
      <StoreApp
        firebaseUser={firebaseUser}
        tiendaData={tiendaData}
        onLogout={handleLogout}
        onTiendaUpdate={setTiendaData}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
    );
  }

  // ── Sin sesión ────────────────────────────────────────────────────────────
  if (!firebaseUser) return <AuthScreen />;

  // ── Usuario logueado sin tienda ───────────────────────────────────────────
  return (
    <UserApp
      firebaseUser={firebaseUser}
      onLogout={handleLogout}
      isDark={isDark}
      toggleTheme={toggleTheme}
      onRegisterStore={handleRegisterStore}
    />
  );
}
