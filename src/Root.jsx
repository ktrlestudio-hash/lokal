import React, { useState, useEffect, useRef } from 'react';
import { auth, onAuthStateChanged, getRedirectResult, signOut } from './firebase';
import { Loader2, AlertCircle, Clock, X, Download } from 'lucide-react';
import { LogoBadge, LogoSymbol, KtrlMark } from './Brand';
import { AuthProvider } from './core/auth.context';

// Solo el SVG animado — usado también en polling
function LogoLoader() {
  const cx = 40.72, cy = 40.65, r = 11.23;
  return (
    <svg viewBox="0 0 81.18 81.44" width={72} height={72} xmlns="http://www.w3.org/2000/svg" aria-label="Cargando">
      <style>{`
        @keyframes lk-draw {
          from { stroke-dashoffset: 275; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes lk-dot-in {
          0%   { transform: scale(0);    opacity: 0; }
          55%  { transform: scale(1.3);  opacity: 1; }
          75%  { transform: scale(0.88); }
          90%  { transform: scale(1.05); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes lk-pulse {
          0%,100% { transform: scale(1);    opacity: 1;   }
          50%     { transform: scale(1.10); opacity: 0.7; }
        }
        .lk-ring {
          fill: none;
          stroke: var(--brand-hex, #00B8D9);
          stroke-width: 7.66;
          stroke-linecap: round;
          stroke-dasharray: 275;
          stroke-dashoffset: 275;
          animation: lk-draw 0.85s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
        }
        .lk-dot {
          fill: var(--brand-hex, #00B8D9);
          transform-origin: ${cx}px ${cy}px;
          animation:
            lk-dot-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.7s both,
            lk-pulse  2.2s ease-in-out 1.35s infinite;
        }
      `}</style>
      <rect className="lk-ring" x="3.83" y="3.83" width="73.52" height="73.78" rx="14.83" />
      <circle className="lk-dot" cx={cx} cy={cy} r={r} />
    </svg>
  );
}

// Decidido UNA vez al cargar el módulo — no durante el render
// IS_FIRST_LOAD = true solo si no cargó en los últimos 20 minutos
const SPLASH_TS_KEY = 'lokal-splash-ts';
const _lastSplash = Number(localStorage.getItem(SPLASH_TS_KEY) || 0);
const IS_FIRST_LOAD = Date.now() - _lastSplash > 20 * 60 * 1000;
if (IS_FIRST_LOAD) localStorage.setItem(SPLASH_TS_KEY, String(Date.now()));
const USER_TYPE_KEY = 'lokal-user-type'; // 'store' | 'client' | null
// lokal-shell.type es más confiable — se setea al montar cada app
const CACHED_USER_TYPE = (() => {
  try {
    const shell = JSON.parse(localStorage.getItem('lokal-shell') || '{}');
    return shell.type || localStorage.getItem(USER_TYPE_KEY);
  } catch { return localStorage.getItem(USER_TYPE_KEY); }
})();

function SplashScreen() {
  if (IS_FIRST_LOAD) return <SplashScreenFull />;
  // Recarga: shell real con skeleton en el área de contenido
  const type = CACHED_USER_TYPE;
  if (type === 'store')  return <StoreShell />;
  if (type === 'client') return <ClientShell />;
  return <SplashScreenFast />; // fallback: primera vez sin tipo cacheado
}

// Skeleton de recarga — imita la estructura real según tipo de usuario
const FAST_SPLASH_DARK = localStorage.getItem('lokal-theme') !== 'light';

function SplashScreenFast() {
  return CACHED_USER_TYPE === 'store' ? <SkeletonStore /> : <SkeletonClient />;
}

function useSkeletonTokens() {
  const dark = FAST_SPLASH_DARK;
  return {
    dark,
    bg:      dark ? '#060d1a' : '#f7f8fa',
    card:    dark ? '#0d1526' : '#ffffff',
    sh:      dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    sh2:     dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
    border:  dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  };
}

function ShimmerBlock({ w = '100%', h = 14, r = 10, style = {} }) {
  const { sh } = useSkeletonTokens();
  return <div style={{ width: w, height: h, borderRadius: r, background: sh, flexShrink: 0, ...style }} />;
}

// Skeleton para StoreApp (tienda)
function SkeletonStore() {
  const { bg, card, sh, sh2, border } = useSkeletonTokens();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: bg, display: 'flex', overflow: 'hidden' }}>
      <style>{`.sk{animation:sk-sh 1.4s ease-in-out infinite}@keyframes sk-sh{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Sidebar desktop */}
      <div className="sk" style={{ width: 220, background: card, borderRight: `1px solid ${border}`, padding: 16, display: 'none', flexDirection: 'column', gap: 8 }}>
        <ShimmerBlock h={40} r={12} style={{ marginBottom: 16 }} />
        {[1,2,3,4,5].map(i => <ShimmerBlock key={i} h={36} r={10} />)}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div className="sk" style={{ background: card, borderBottom: `1px solid ${border}`, height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0 }}>
          <ShimmerBlock w={28} h={28} r={8} />
          <div style={{ flex: 1 }} />
          <ShimmerBlock w={100} h={12} r={8} />
          <div style={{ flex: 1 }} />
          <ShimmerBlock w={28} h={28} r={14} />
          <ShimmerBlock w={28} h={28} r={14} />
        </div>

        {/* Content — grid de productos */}
        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'hidden' }}>
          {/* Search + filter row */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="sk" style={{ flex: 1, height: 40, borderRadius: 12, background: sh2 }} />
            <div className="sk" style={{ width: 40, height: 40, borderRadius: 12, background: sh2 }} />
          </div>
          {/* Grid 2 cols */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="sk" style={{ background: card, borderRadius: 16, overflow: 'hidden', border: `1px solid ${border}` }}>
                <div style={{ aspectRatio: '1', background: sh }} />
                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <ShimmerBlock w="75%" h={12} r={6} />
                  <ShimmerBlock w="45%" h={14} r={6} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom nav mobile */}
        <div className="sk" style={{ background: card, borderTop: `1px solid ${border}`, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px', flexShrink: 0 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <ShimmerBlock w={22} h={22} r={6} />
              <ShimmerBlock w={28} h={8} r={4} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton para UserApp (cliente)
function SkeletonClient() {
  const { bg, card, sh, sh2, border } = useSkeletonTokens();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`.sk{animation:sk-sh 1.4s ease-in-out infinite}@keyframes sk-sh{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Top bar */}
      <div className="sk" style={{ background: card, borderBottom: `1px solid ${border}`, height: 60, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0 }}>
        <ShimmerBlock w={80} h={12} r={8} />
        <div style={{ flex: 1 }} />
        <ShimmerBlock w={32} h={32} r={10} />
        <ShimmerBlock w={32} h={32} r={16} />
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px' }}>
        <div className="sk" style={{ height: 44, borderRadius: 14, background: sh2 }} />
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'hidden' }}>
        {[80,60,90,70].map((w,i) => (
          <div key={i} className="sk" style={{ width: w, height: 30, borderRadius: 20, background: sh, flexShrink: 0 }} />
        ))}
      </div>

      {/* Cards lista */}
      <div style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'hidden' }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="sk" style={{ background: card, borderRadius: 16, padding: 12, display: 'flex', gap: 12, border: `1px solid ${border}` }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: sh, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 2 }}>
              <ShimmerBlock w="65%" h={12} r={6} />
              <ShimmerBlock w="40%" h={10} r={6} />
              <ShimmerBlock w="50%" h={12} r={6} style={{ marginTop: 4 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="sk" style={{ background: card, borderTop: `1px solid ${border}`, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px', flexShrink: 0 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <ShimmerBlock w={22} h={22} r={6} />
            <ShimmerBlock w={28} h={8} r={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SplashScreenFull() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#060d1a' }}>

      <style>{`
        @keyframes lk-brand-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lk-mark-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lk-glow-pulse {
          0%,100% { opacity: 0.55; transform: scale(1); }
          50%     { opacity: 0.85; transform: scale(1.08); }
        }
      `}</style>

      {/* Glow radial superior — pulsa suave */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: '65%',
          background: 'radial-gradient(ellipse 75% 55% at 50% 0%, rgba(0,184,217,0.22), transparent)',
          animation: 'lk-glow-pulse 3s ease-in-out 1.2s infinite',
        }}
      />
      {/* Reflejo inferior tenue */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,184,217,0.07), transparent)',
        }}
      />

      {/* Logo centrado */}
      <LogoLoader />

      {/* Wordmark "lokal" */}
      <div style={{ animation: 'lk-brand-in 0.45s ease 1.0s both', marginTop: 18 }}>
        <span style={{
          color: 'white',
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: '0.01em',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          lokal
        </span>
      </div>

      {/* KtrlMark — parte inferior */}
      <div
        className="absolute bottom-10 flex items-center gap-1.5"
        style={{ animation: 'lk-mark-in 0.5s ease 1.2s both', opacity: 0 }}
      >
        <span style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: 10,
          fontFamily: "'Inter', system-ui, sans-serif",
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          creado por
        </span>
        <KtrlMark className="text-white" style={{ height: 12, width: 'auto', opacity: 0.35 }} />
      </div>
    </div>
  );
}
import UserApp from './App';
import { StoreShell, ClientShell } from './AppShell';
import StoreApp from './StoreApp';
import InviteFlow from './InviteFlow';
import AuthScreen from './AuthScreen';
import StoreRegisterFlow from './StoreRegisterFlow';
import LegalPageView from './LegalPages';
import TiendaPublica from './TiendaPublica';
import PremiumStorefront2026 from './tienda-publica/templates/PremiumStorefront2026';
import { TiendaPublicaRenderer } from './tienda-publica/TiendaPublicaRenderer';
import OnboardingFlow, { loadUserProfile, saveUserProfile } from './OnboardingFlow';
import TiendaExistenteModal from './components/TiendaExistenteModal';
import { apiFetch } from './api';

const LEGAL_PATHS = {
  '/terminos-y-condiciones': 'terminos',
  '/politica-de-privacidad': 'privacidad',
  '/condiciones-para-comercios': 'comercios',
};

function pathToLegal(pathname) {
  return LEGAL_PATHS[pathname] || null;
}

const API_BASE = '/.netlify/functions';
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'katryelmmartinez@gmail.com,ktrlestudio@gmail.com')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const POLL_INTERVAL_MS = 2500;
const POLL_MAX_ATTEMPTS = 10;
const PWA_DISMISS_KEY = 'lokal-pwa-dismissed';

function PWAInstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Ya instalada como PWA — no mostrar
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Descartada recientemente (7 días)
    const dismissed = localStorage.getItem(PWA_DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(PWA_DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <div
        className="pointer-events-auto mb-3 mx-auto max-w-sm bg-[#0B132B] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 flex items-center gap-3 p-3 pr-2"
        style={{ backdropFilter: 'blur(16px)' }}
      >
        <LogoSymbol size={36} color="#00B8D9" className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold leading-tight">Instalá Lokal</p>
          <p className="text-slate-400 text-xs leading-tight mt-0.5">Acceso rápido desde tu pantalla de inicio</p>
        </div>
        <button
          onClick={install}
          className="no-press shrink-0 bg-brand text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors hover:bg-brand-dark"
        >
          <Download className="w-3.5 h-3.5" />
          Instalar
        </button>
        <button onClick={dismiss} className="no-press p-1.5 text-slate-500 hover:text-slate-300 transition-colors rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const OFFLINE_AUTH_KEY = 'lokal-last-auth';

function ConnectionBanner() {
  const [online, setOnline]   = React.useState(navigator.onLine);
  const [wasOffline, setWasOffline] = React.useState(false);
  const [showGreen, setShowGreen]   = React.useState(false);

  React.useEffect(() => {
    const up   = () => { setOnline(true);  if (wasOffline) { setShowGreen(true); setTimeout(() => setShowGreen(false), 2500); } };
    const down = () => { setOnline(false); setWasOffline(true); };
    window.addEventListener('online',  up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, [wasOffline]);

  if (online && !showGreen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      background: online ? '#22c55e' : '#ef4444',
      color: '#fff', textAlign: 'center', fontSize: 12, fontWeight: 700,
      padding: '6px 16px', letterSpacing: '0.03em',
      transition: 'background 0.4s ease',
    }}>
      {online ? '✓ Conexión restaurada' : 'Sin conexión — mostrando datos guardados'}
    </div>
  );
}

export default function Root() {
  const [firebaseUser, setFirebaseUser]       = useState(undefined);
  const [redirectChecked, setRedirectChecked] = useState(false); // true cuando getRedirectResult resolvió
  const [tiendaData, setTiendaData]           = useState(null);
  const [checkingTienda, setCheckingTienda]   = useState(false);
  const [userProfile, setUserProfile]         = useState(undefined); // undefined = no cargado aún
  const [inviteToken, setInviteToken]         = useState(null);
  const [registeringStore, setRegisteringStore] = useState(false);
  const [initialPlan, setInitialPlan]         = useState(null);
  const [legalPage, setLegalPage]             = useState(() => pathToLegal(window.location.pathname));
  const [showLanding, setShowLanding]         = useState(() => window.location.pathname === '/landing');
  const [existingTienda, setExistingTienda]   = useState(null); // tienda existente detectada post-login con intent de registro
  const [showOnboardingUpgrade, setShowOnboardingUpgrade] = useState(false); // re-abrir onboarding para upgrade de rol

  // ── Simulación de roles (admin testing) ────────────────────────────────────
  const [roleSim, setRoleSim] = useState(() => {
    try {
      const raw = localStorage.getItem('lokal-role-sim');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // Permite que un dueño de tienda navegue temporalmente como usuario
  const [browseAsUser, setBrowseAsUser] = useState(false);
  const [minLoadDone, setMinLoadDone]   = useState(false);
  const [demoMode, setDemoMode]         = useState(false);
  const [featureModules, setFeatureModules] = useState(null); // null = usar defaults del frontend
  useEffect(() => {
    if (!IS_FIRST_LOAD) { setMinLoadDone(true); return; }
    const t = setTimeout(() => setMinLoadDone(true), 3200);
    return () => clearTimeout(t);
  }, []);

  // Offline fallback: si Firebase no resuelve en 4s y no hay internet, usar cache
  useEffect(() => {
    if (firebaseUser !== undefined) return; // ya resolvió
    const t = setTimeout(() => {
      if (!navigator.onLine && firebaseUser === undefined) {
        const cached = localStorage.getItem(OFFLINE_AUTH_KEY);
        // Forzar resolución con null (mostrará login) o con shell cacheado
        setFirebaseUser(cached ? '__offline__' : null);
        setRedirectChecked(true);
        setMinLoadDone(true);
      }
    }, 4000);
    return () => clearTimeout(t);
  }, [firebaseUser]);

  // Leer config global al arrancar — sin auth, es pública
  useEffect(() => {
    fetch(`${API_BASE}/site-config`)
      .then(r => r.ok ? r.json() : null)
      .then(cfg => {
        if (!cfg) return;
        if (cfg.demoMode !== undefined) setDemoMode(cfg.demoMode);
        if (Array.isArray(cfg.modules)) setFeatureModules(cfg.modules);
      })
      .catch(() => {});
  }, []);

  // Estado del redirect de MercadoPago
  const [mpStatus, setMpStatus]         = useState(null);  // 'approved'|'failure'|'pending'
  const [pollingTienda, setPollingTienda] = useState(false);
  const [pollMessage, setPollMessage]    = useState('');

  // ── Dark mode ─────────────────────────────────────────────────────────────
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
    setIsDark(d => !d);
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);
  };

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
    let mounted = true;

    // Procesar redirect de Google (mobile / popup bloqueado).
    // TODOS los disparos de onAuthStateChanged esperan a que esto resuelva,
    // evitando la race condition donde null sobreescribe al user ya logueado.
    const redirectPromise = getRedirectResult(auth).catch(err => {
      if (err.code !== 'auth/no-auth-event') console.warn('getRedirectResult:', err.code, err.message);
      return null;
    });

    // redirectChecked se activa cuando redirectPromise termina, sin importar el auth state
    redirectPromise.finally(() => { if (mounted) setRedirectChecked(true); });

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      // Esperar siempre a que el redirect esté procesado antes de actuar
      await redirectPromise;
      if (!mounted) return;

      setFirebaseUser(user || null);
      // Guardar estado mínimo para uso offline
      if (user) localStorage.setItem(OFFLINE_AUTH_KEY, JSON.stringify({ uid: user.uid, email: user.email }));
      else localStorage.removeItem(OFFLINE_AUTH_KEY);
      window._getFirebaseToken = user ? () => user.getIdToken() : null;
      if (user) {
        // Verificar intent de registro guardado por la landing (AuthScreen) o bottom sheet
        const intentRaw = sessionStorage.getItem('lokal-register-intent');
        if (intentRaw) {
          try {
            const intent = JSON.parse(intentRaw);
            sessionStorage.removeItem('lokal-register-intent');

            if (intent.intent === 'register-store') {
              // Empresa: va a StoreRegisterFlow con pago
              setInitialPlan(intent.plan || 'mensual');
              const foundTienda = await checkTiendaSilent(user.uid);
              if (foundTienda) {
                // Ya tiene tienda → mostrar modal de tienda existente
                setExistingTienda(foundTienda);
              } else {
                // No tiene tienda → flujo normal de registro
                setRegisteringStore(true);
              }
              setUserProfile(loadUserProfile(user.uid) || null);
              return;
            }

            if (intent.intent === 'register-emprendimiento') {
              // Emprendimiento: preseleccionar rol en onboarding
              const existing = loadUserProfile(user.uid);
              if (existing) {
                // Ya tiene perfil → upgrade directo
                const updated = { ...existing, role: 'emprendimiento', upgradedAt: Date.now() };
                saveUserProfile(user.uid, updated);
                setUserProfile(updated);
              } else {
                // No tiene perfil → onboarding con preselección
                sessionStorage.setItem('lokal-onboarding-preselect', 'emprendimiento');
                setUserProfile(null);
              }
              return;
            }

            if (intent.intent === 'register-user') {
              // Usuario: onboarding normal (o directo si ya tiene perfil)
              const existing = loadUserProfile(user.uid);
              if (existing) {
                setUserProfile(existing);
              } else {
                sessionStorage.setItem('lokal-onboarding-preselect', 'usuario');
                setUserProfile(null);
              }
              return;
            }
          } catch { /* ignorar */ }
        }
        // Flujo normal post-login (sin intent de registro de tienda)
        // Verificar perfil: primero localStorage, luego backend
        const localProfile = loadUserProfile(user.uid);
        if (localProfile) {
          // Tiene perfil en localStorage → flujo normal
          setUserProfile(localProfile);
          await checkTienda(user.uid);
        } else {
          // No tiene perfil en localStorage → verificar en backend
          const backendProfile = await checkUserProfile(user.uid);
          if (backendProfile) {
            // Tiene perfil en backend → sincronizar y flujo normal
            saveUserProfile(user.uid, backendProfile);
            setUserProfile(backendProfile);
            await checkTienda(user.uid);
          } else {
            // No tiene perfil en ningún lado → onboarding (elegir rol)
            setUserProfile(null);
            setCheckingTienda(false);
          }
        }
      } else {
        setTiendaData(null);
        setCheckingTienda(false);
        setUserProfile(null);
      }
    });

    return () => { mounted = false; unsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sincronizar tienda existente con userRole ──────────────────────────────
  // Si el usuario tiene tiendaData pero su perfil no dice 'empresa', actualizamos
  useEffect(() => {
    if (tiendaData && userProfile && userProfile.role !== 'empresa') {
      const updated = { ...userProfile, role: 'empresa', plan: 'basico' };
      saveUserProfile(firebaseUser?.uid, updated);
      setUserProfile(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiendaData, userProfile]);

  // ── Perfil efectivo (con simulación de rol aplicada) ───────────────────────
  const effectiveUserProfile = React.useMemo(() => {
    if (!userProfile) return userProfile;
    if (!roleSim || !roleSim.active) return userProfile;
    return {
      ...userProfile,
      role: roleSim.role || userProfile.role,
      plan: roleSim.plan || userProfile.plan || null,
      businessProfile: roleSim.businessProfile !== undefined
        ? roleSim.businessProfile
        : userProfile.businessProfile,
      suscripcion: roleSim.suscripcion !== undefined
        ? roleSim.suscripcion
        : userProfile.suscripcion,
      _simulated: true,
      _originalRole: userProfile.role,
    };
  }, [userProfile, roleSim]);

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
        // Sincronizar userProfile con datos de la tienda
        const updatedProfile = {
          ...userProfile,
          role: 'empresa',
          plan: effectiveUserProfile?.plan || 'basico',
          businessProfile: {
            nombre: found.nombre || '',
            rubros: found.rubros || [],
            descripcion: found.descripcion || '',
            direccion: found.direccion || '',
            ciudad: found.ciudad || '',
            telefono: found.telefono || '',
            lat: found.lat || null,
            lng: found.lng || null,
            tieneLocal: found.tieneLocal || false,
            slug: found.slug || '',
            tagline: found.tagline || '',
            instagram: found.instagram || '',
            whatsapp: found.whatsapp || '',
            horarios: found.horarios || {},
            galeria: found.galeria || [],
            foto: found.foto || null,
            portada: found.portada || null,
          },
          suscripcion: found.suscripcion || null,
        };
        saveUserProfile(firebaseUser.uid, updatedProfile);
        setUserProfile(updatedProfile);
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

  // Sincronizar páginas legales y landing con la URL del navegador
  useEffect(() => {
    const onPop = () => {
      setLegalPage(pathToLegal(window.location.pathname));
      setShowLanding(window.location.pathname === '/landing');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openLegal = (page) => {
    const path = Object.keys(LEGAL_PATHS).find(k => LEGAL_PATHS[k] === page) || '/';
    window.history.pushState({}, '', path);
    setLegalPage(page);
    setShowLanding(false);
  };

  const closeLegal = () => {
    window.history.pushState({}, '', '/');
    setLegalPage(null);
    setShowLanding(false);
  };

  const openLanding = () => {
    window.history.pushState({}, '', '/landing');
    setShowLanding(true);
    setLegalPage(null);
  };

  const closeLanding = () => {
    window.history.pushState({}, '', '/');
    setShowLanding(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  // Verificar si el usuario ya tiene perfil en el backend (no solo localStorage)
  const checkUserProfile = async (googleUid) => {
    try {
      const res = await apiFetch(`${API_BASE}/user-profile?googleUid=${encodeURIComponent(googleUid)}`, {
        authRequired: true,
      });
      if (!res.ok) return null;
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  };

  const checkTienda = async (googleUid) => {
    setCheckingTienda(true);
    try {
      const res = await apiFetch(`${API_BASE}/tiendas-crud?googleUid=${encodeURIComponent(googleUid)}`, {
        authRequired: true,
      });
      if (!res.ok) { setTiendaData(null); return; }
      const text = await res.text();
      setTiendaData(text ? JSON.parse(text) : null);
    } catch {
      setTiendaData(null);
    } finally {
      setCheckingTienda(false);
    }
  };

  const checkTiendaSilent = async (googleUid) => {
    try {
      const res = await apiFetch(`${API_BASE}/tiendas-crud?googleUid=${encodeURIComponent(googleUid)}`, {
        authRequired: true,
      });
      if (!res.ok) return null;
      const text = await res.text();
      return text ? JSON.parse(text) : null;
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

  // ── Preview standalone del template premium (original ChatGPT) ───────────
  if (window.location.pathname === '/preview-premium') {
    return <PremiumStorefront2026 />;
  }

  // ── Preview vista de tienda de COMIDA (template commerce-modern) — carrito + toggle lista/grilla ─
  if (window.location.pathname === '/preview-comida') {
    const MOCK_COMIDA = {
      nombre: 'Burger Station', slug: 'burger-station',
      descripcion: 'Hamburguesas artesanales, papas y bebidas. Retiro en el local o delivery.',
      logo: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=200&auto=format&fit=crop',
      foto: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1600&auto=format&fit=crop',
      whatsapp: '5491112345678', instagram: 'burger.station', telefono: '', ciudad: 'Bovril',
      direccion: 'San Martín 450', rating: 4.7, totalReseñas: 342,
      horarios: {
        lunes: '11:00-23:00', martes: '11:00-23:00', miercoles: '11:00-23:00',
        jueves: '11:00-23:00', viernes: '11:00-01:00', sabado: '12:00-02:00', domingo: '12:00-23:00',
      },
      pagina: { template: 'commerce-modern', color: '#e11d2e', modoOscuro: false, secciones: { hero:{activa:true}, productos:{activa:true}, contacto:{activa:true} } },
      productos: [
        { id:'h1', nombre:'Hamburguesa Clásica', categoria:'Hamburguesas', precio:6500, descripcion:'Carne 200g, lechuga, tomate, cheddar y salsa de la casa en pan brioche.', foto:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop', serves:1, prepTimeMin:15, rating:4.8, activo:true },
        { id:'h2', nombre:'Doble Bacon Cheddar', categoria:'Hamburguesas', precio:8900, precioOriginal:10500, descripcion:'Doble carne, doble cheddar, panceta crocante y cebolla caramelizada.', foto:'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=800&auto=format&fit=crop', serves:1, prepTimeMin:18, tags:['kids'], rating:4.9, activo:true },
        { id:'h3', nombre:'Veggie Deluxe', categoria:'Hamburguesas', precio:7200, descripcion:'Medallón de garbanzos y espinaca, palta, rúcula y mayo de ajo.', foto:'https://images.unsplash.com/photo-1520072959219-c595dc870360?q=80&w=800&auto=format&fit=crop', serves:1, prepTimeMin:16, tags:['vegetarian','vegan'], rating:4.6, activo:true },
        { id:'p1', nombre:'Papas Clásicas', categoria:'Acompañamientos', precio:3200, descripcion:'Corte bastón, crocantes por fuera.', foto:'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop', serves:2, prepTimeMin:10, rating:4.5, activo:true },
        { id:'p2', nombre:'Papas Cheddar & Bacon', categoria:'Acompañamientos', precio:4800, precioOriginal:5600, descripcion:'Con cheddar fundido y trozos de panceta.', foto:'https://images.unsplash.com/photo-1639024471283-03518883512d?q=80&w=800&auto=format&fit=crop', serves:2, prepTimeMin:12, activo:true },
        { id:'b1', nombre:'Coca-Cola 500ml', categoria:'Bebidas', precio:1800, descripcion:'Bien fría.', foto:'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=800&auto=format&fit=crop', serves:1, prepTimeMin:1, activo:true },
        { id:'b2', nombre:'Agua Mineral 500ml', categoria:'Bebidas', precio:1400, descripcion:'Sin gas.', foto:'https://images.unsplash.com/photo-1553456558-aff63285bdd1?q=80&w=800&auto=format&fit=crop', serves:1, prepTimeMin:1, activo:true },
        { id:'b3', nombre:'Cerveza Artesanal IPA', categoria:'Bebidas', precio:2600, descripcion:'Rubia, amarga y aromática. 500ml.', foto:'https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=800&auto=format&fit=crop', serves:1, prepTimeMin:1, tags:['glutenFree'], rating:4.7, activo:true },
        { id:'b4', nombre:'Sprite 500ml', categoria:'Bebidas', precio:1800, descripcion:'Bien fría, sabor lima limón.', foto:'https://images.unsplash.com/photo-1690993022002-27ba5d02c497?q=80&w=800&auto=format&fit=crop', serves:1, prepTimeMin:1, rating:4.4, activo:true },
        { id:'b5', nombre:'Agua Saborizada Pomelo', categoria:'Bebidas', precio:1600, descripcion:'Sin gas, sabor pomelo natural.', foto:'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop', serves:1, prepTimeMin:1, activo:true },
        { id:'b6', nombre:'Cerveza Rubia 500ml', categoria:'Bebidas', precio:2200, precioOriginal:2600, descripcion:'Lager suave, ideal para acompañar.', foto:'https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?q=80&w=800&auto=format&fit=crop', serves:1, prepTimeMin:1, rating:4.6, activo:true },
        { id:'b7', nombre:'Limonada Casera', categoria:'Bebidas', precio:2100, descripcion:'Limón, menta y jengibre. 500ml.', foto:'https://images.unsplash.com/photo-1621263764928-df1444c5e859?q=80&w=800&auto=format&fit=crop', serves:2, prepTimeMin:2, tags:['vegan'], rating:4.9, activo:true },
        { id:'d1', nombre:'Brownie con helado', categoria:'Postres', precio:3900, descripcion:'Brownie tibio, helado de crema y salsa de chocolate.', foto:'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800&auto=format&fit=crop', serves:1, prepTimeMin:5, tags:['vegetarian'], rating:5, activo:true },
      ],
    };
    return <TiendaPublicaRenderer tienda={MOCK_COMIDA} />;
  }

  // ── Preview del template premium real con datos mock (usa TiendaPublicaRenderer) ─
  if (window.location.pathname === '/preview-premium-real') {
    const MOCK_TIENDA = {
      nombre: 'LOKAL Studio', slug: 'lokal-studio',
      descripcion: 'Ropa y accesorios de diseño independiente. Ediciones limitadas.',
      logo: 'https://images.unsplash.com/photo-1614680376739-414d95ff43df?q=80&w=200&auto=format&fit=crop',
      fotoPortada: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1600&auto=format&fit=crop',
      whatsapp: '5491112345678', instagram: 'lokal.studio', telefono: '', sitioWeb: '',
      horarios: { lunes:{abre:'10:00',cierra:'20:00'}, martes:{abre:'10:00',cierra:'20:00'}, miercoles:{abre:'10:00',cierra:'20:00'}, jueves:{abre:'10:00',cierra:'20:00'}, viernes:{abre:'10:00',cierra:'21:00'}, sabado:{abre:'11:00',cierra:'19:00'}, domingo:{cerrado:true} },
      pagina: { template: 'premium', color: '#ff6b35', modoOscuro: true, secciones: { hero:{activa:true}, productos:{activa:true}, horarios:{activa:true}, contacto:{activa:true}, sobre:{activa:true} } },
      productos: [
        { id:'1', nombre:'Campera Oversize', categoria:'Ropa', precio:18500, precioAnterior:24000, foto:'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop', descripcion:'Campera oversize premium.', stock:12, activo:true },
        { id:'2', nombre:'Zapatillas Retro', categoria:'Calzado', precio:32000, precioAnterior:42000, foto:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop', descripcion:'Estilo retro, suela chunky.', stock:5, activo:true },
        { id:'3', nombre:'Gorra Snapback', categoria:'Accesorios', precio:7500, foto:'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop', descripcion:'Logo bordado.', stock:30, activo:true },
        { id:'4', nombre:'Pantalón Cargo', categoria:'Ropa', precio:15000, precioAnterior:19000, foto:'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=800&auto=format&fit=crop', descripcion:'Bolsillos laterales.', stock:8, activo:true },
        { id:'5', nombre:'Remera Gráfica', categoria:'Ropa', precio:8900, foto:'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop', descripcion:'100% algodón.', stock:20, activo:true },
        { id:'6', nombre:'Bag Tote', categoria:'Accesorios', precio:4500, foto:'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=800&auto=format&fit=crop', descripcion:'Lona gruesa.', stock:50, activo:true },
        { id:'7', nombre:'Hoodie Boxy', categoria:'Ropa', precio:22000, precioAnterior:27000, foto:'https://images.unsplash.com/photo-1556821840-3a63f15732ce?q=80&w=800&auto=format&fit=crop', descripcion:'Fit boxy.', stock:15, activo:true },
        { id:'8', nombre:'Cinturón Tejido', categoria:'Accesorios', precio:5200, foto:'https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=800&auto=format&fit=crop', descripcion:'Artesanal.', stock:25, activo:true },
      ],
    };
    return <TiendaPublicaRenderer tienda={MOCK_TIENDA} />;
  }

  // ── Página pública de tienda /t/:slug — sin auth ──────────────────────────
  const tiendaSlug = window.location.pathname.match(/^\/t\/([^/]+)/)?.[1] || null;
  if (tiendaSlug) {
    return <TiendaPublica slug={tiendaSlug} />;
  }

  // ── Landing page /landing — accesible sin login ───────────────────────────
  // Si el usuario está logueado, no mostrar la landing (va al flujo normal)
  if (showLanding && !firebaseUser) {
    return (
      <>
        <AuthScreen isDark={isDark} toggleTheme={toggleTheme} onBack={closeLanding} />
        <PWAInstallBanner />
      </>
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

  // ── Pantalla de carga ─────────────────────────────────────────────────────
  const isOfflineMode = firebaseUser === '__offline__';
  if (!minLoadDone || firebaseUser === undefined || !redirectChecked || checkingTienda || (!isOfflineMode && firebaseUser && userProfile === undefined)) {
    return <SplashScreen />;
  }

  // ── Modo offline — mostrar shell con datos cacheados ─────────────────────
  if (isOfflineMode) {
    const type = CACHED_USER_TYPE;
    return (
      <>
        <ConnectionBanner />
        {type === 'store' ? <StoreShell /> : <ClientShell />}
      </>
    );
  }

  // ── Polling post-pago ─────────────────────────────────────────────────────
  if (pollingTienda) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-5 w-fit"><LogoLoader /></div>
          <h2 className="text-white font-black text-2xl mb-2">¡Pago recibido!</h2>
          <p className="text-slate-400 mb-3">Estamos activando tu cuenta de tienda...</p>
          <p className="text-brand text-sm font-semibold">{pollMessage}</p>
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
            className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3 rounded-2xl transition-colors"
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
            className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3 rounded-2xl transition-colors"
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

  // ── Tienda existente detectada (usuario intentó registrar pero ya tiene tienda)
  if (existingTienda && firebaseUser) {
    return (
      <TiendaExistenteModal
        tienda={existingTienda}
        firebaseUser={firebaseUser}
        onEnterStore={() => {
          // Es su tienda → setear tiendaData y va a StoreApp
          setTiendaData(existingTienda);
          setExistingTienda(null);
        }}
        onClaim={() => {
          // No es su tienda → reclamar (por ahora, abrir mailto a soporte)
          window.location.href = `mailto:ktrlestudio@gmail.com?subject=Reclamo de tienda: ${encodeURIComponent(existingTienda.nombre)}&body=Hola,%0A%0AQuiero reclamar la tienda "${encodeURIComponent(existingTienda.nombre)}" que aparece vinculada a mi cuenta ${encodeURIComponent(firebaseUser.email)}.%0A%0AMis datos de contacto:%0A- Nombre: ${encodeURIComponent(firebaseUser.displayName || '')}%0A- Email: ${encodeURIComponent(firebaseUser.email)}%0A%0AGracias.`;
        }}
        onCancel={() => {
          // Volver al inicio como usuario normal
          setExistingTienda(null);
          setTiendaData(null);
          window.history.replaceState({}, '', '/');
        }}
      />
    );
  }

  // ── Registro de tienda (self-service) ─────────────────────────────────────
  if (registeringStore && firebaseUser && !tiendaData) {
    const isAdminUser = ADMIN_EMAILS.includes((firebaseUser?.email || '').toLowerCase());
    return (
      <StoreRegisterFlow
        firebaseUser={firebaseUser}
        initialPlan={initialPlan}
        isAdmin={isAdminUser}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onTiendaCreated={(tienda) => {
          // Actualizar tiendaData (legacy)
          setTiendaData(tienda);
          // Actualizar userProfile con role empresa + businessProfile
          const updatedProfile = {
            ...userProfile,
            role: 'empresa',
            plan: 'basico',
            businessProfile: {
              nombre: tienda.nombre || '',
              rubros: tienda.rubros || [],
              descripcion: tienda.descripcion || '',
              direccion: tienda.direccion || '',
              ciudad: tienda.ciudad || '',
              telefono: tienda.telefono || '',
              lat: tienda.lat || null,
              lng: tienda.lng || null,
              tieneLocal: tienda.tieneLocal || false,
              slug: tienda.slug || '',
              tagline: tienda.tagline || '',
              instagram: tienda.instagram || '',
              whatsapp: tienda.whatsapp || '',
              horarios: tienda.horarios || {},
              galeria: tienda.galeria || [],
              foto: tienda.foto || null,
              portada: tienda.portada || null,
            },
            suscripcion: tienda.suscripcion || null,
          };
          saveUserProfile(firebaseUser.uid, updatedProfile);
          setUserProfile(updatedProfile);
          setRegisteringStore(false);
        }}
        onCancel={() => { setRegisteringStore(false); setInitialPlan(null); }}
      />
    );
  }

  // ── App de empresa/emprendimiento (StoreApp) ──────────────────────────────
  // Empresa y Emprendimiento ven StoreApp. Usuarios van a UserApp.
  const isStoreRole = effectiveUserProfile?.role === 'empresa' || effectiveUserProfile?.role === 'emprendimiento';
  if (firebaseUser && isStoreRole) localStorage.setItem(USER_TYPE_KEY, 'store');
  else if (firebaseUser && !isStoreRole) localStorage.setItem(USER_TYPE_KEY, 'client');

  if (firebaseUser && isStoreRole && !browseAsUser) {
    const isAdminUser = ADMIN_EMAILS.includes((firebaseUser?.email || '').toLowerCase());
    return (
      <>
        <ConnectionBanner />
        <StoreApp
          firebaseUser={firebaseUser}
          userProfile={effectiveUserProfile}
          onLogout={handleLogout}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onBrowseAsUser={() => { window.history.replaceState({}, '', '/'); setBrowseAsUser(true); }}
          isAdmin={isAdminUser}
          onOpenAdmin={() => { setBrowseAsUser(true); }}
        />
        <PWAInstallBanner />
      </>
    );
  }

  // ── Empresa/emprendimiento navegando como usuario ─────────────────────────
  if (firebaseUser && (effectiveUserProfile?.role === 'empresa' || effectiveUserProfile?.role === 'emprendimiento') && browseAsUser) {
    const isAdmin = ADMIN_EMAILS.includes((firebaseUser?.email || '').toLowerCase());
    return (
      <>
        <ConnectionBanner />
        <AuthProvider firebaseUser={firebaseUser}>
          <UserApp
            firebaseUser={firebaseUser}
            onLogout={handleLogout}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onRegisterStore={handleRegisterStore}
            isAdmin={isAdmin}
            onOpenDashboard={() => setBrowseAsUser(false)}
            /* hasTienda={true} // DEPRECADO: ahora se detecta por userRole */
            setDemoMode={setDemoMode}
            demoMode={demoMode}
            featureModules={featureModules}
            onUpgradeRole={() => setShowOnboardingUpgrade(true)}
            userProfile={effectiveUserProfile}
            setRoleSim={setRoleSim}
            initialScreen="admin"
          />
        </AuthProvider>
        <PWAInstallBanner />
      </>
    );
  }

  // ── Sin sesión → Guest Mode (explorar sin login) ─────────────────────────
  // El usuario puede navegar el home, ver productos, tiendas y mapa sin cuenta.
  // Solo se pide login cuando intenta hacer una acción que requiere auth.
  if (!firebaseUser) {
    return (
      <>
        <ConnectionBanner />
        <UserApp
          firebaseUser={null}
          onLogout={handleLogout}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onRegisterStore={handleRegisterStore}
          isAdmin={false}
          setDemoMode={setDemoMode}
          demoMode={demoMode}
          featureModules={featureModules}
          setRoleSim={setRoleSim}
        />
        <PWAInstallBanner />
      </>
    );
  }

  // ── Onboarding upgrade de rol (usuario → emprendimiento/empresa) ─────────
  if (firebaseUser && showOnboardingUpgrade) {
    return (
      <OnboardingFlow
        firebaseUser={firebaseUser}
        mode="upgrade"
        onComplete={(profile) => {
          setUserProfile(profile);
          setShowOnboardingUpgrade(false);
        }}
        onRegisterStore={(plan) => {
          setInitialPlan(plan || 'mensual');
          setRegisteringStore(true);
          setShowOnboardingUpgrade(false);
        }}
      />
    );
  }

  // ── Onboarding — usuario nuevo sin perfil ────────────────────────────────
  if (firebaseUser && !tiendaData && userProfile === null) {
    return (
      <OnboardingFlow
        firebaseUser={firebaseUser}
        onComplete={(profile) => setUserProfile(profile)}
        onRegisterStore={(plan) => {
          setInitialPlan(plan || 'mensual');
          setRegisteringStore(true);
        }}
      />
    );
  }

  // ── Usuario logueado sin tienda ───────────────────────────────────────────
  const isAdmin = ADMIN_EMAILS.includes((firebaseUser?.email || '').toLowerCase());
  return (
    <>
      <AuthProvider firebaseUser={firebaseUser}>
        <UserApp
          firebaseUser={firebaseUser}
          onLogout={handleLogout}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onRegisterStore={handleRegisterStore}
          isAdmin={isAdmin}
          setDemoMode={setDemoMode}
          demoMode={demoMode}
          featureModules={featureModules}
          onUpgradeRole={() => setShowOnboardingUpgrade(true)}
          userProfile={effectiveUserProfile}
          setRoleSim={setRoleSim}
        />
      </AuthProvider>
      <PWAInstallBanner />
    </>
  );
}
