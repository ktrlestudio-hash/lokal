import { useState, useEffect } from 'react';
import {
  User, Briefcase, Building2, MapPin, Check, ChevronRight,
  Star, Camera, Zap, ArrowRight, Store,
} from 'lucide-react';
import { LogoFull } from './Brand';
import CategoryPicker from './CategoryPicker';
import { apiFetch } from './api';

const API_BASE = '/.netlify/functions';

// ─── Helpers de perfil (localStorage + backend) ──────────────────────────────
export const PROFILE_KEY = 'lokal-user-profile';

export function saveUserProfile(uid, profile) {
  const existing = loadUserProfile(uid) || {};
  const updated = { ...existing, ...profile, uid, updatedAt: Date.now() };
  localStorage.setItem(`${PROFILE_KEY}:${uid}`, JSON.stringify(updated));
  return updated;
}

export async function saveUserProfileAsync(uid, profile) {
  // 1. Guardar en localStorage primero (siempre disponible)
  const local = saveUserProfile(uid, profile);

  // 2. Intentar guardar en backend (puede fallar silenciosamente)
  try {
    await apiFetch(`${API_BASE}/user-profile`, {
      method: 'POST',
      authRequired: true,
      body: JSON.stringify(local),
    });
  } catch {
    // Silencioso: el perfil queda en localStorage como fallback
  }

  return local;
}

export function loadUserProfile(uid) {
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY}:${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function computeCompletion(profile) {
  if (!profile) return 0;
  const isUser = profile.role === 'usuario';
  const checks = [
    !!profile.role,
    !!profile.displayName,
    !!profile.zone,
    !!profile.bio,
    !!(profile.skills?.length),
    // CV: solo aplica a usuario
    isUser ? !!profile.cvExperience : true,
    // Negocio: solo aplica a emprendimiento/empresa
    !isUser ? !!profile.businessName : true,
    !isUser ? !!profile.businessCategory : true,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

// ─── Datos de roles ───────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'usuario',
    icon: User,
    label: 'Usuario',
    tagline: 'Explorá, publicá y conectá',
    desc: 'Publicá demandas, buscá oportunidades laborales, ofrecé servicios y explorá tu ciudad.',
    color: 'text-brand',
    bg: 'bg-brand-muted',
    border: 'border-brand',
    free: true,
  },
  {
    id: 'emprendimiento',
    icon: Briefcase,
    label: 'Emprendimiento',
    tagline: 'Crecé de manera local',
    desc: 'Todo lo de usuario más: publicá búsquedas laborales, ofrecé servicios y tenés un mini perfil comercial.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-400',
    free: true,
  },
  {
    id: 'empresa',
    icon: Building2,
    label: 'Empresa',
    tagline: 'Herramientas para tu negocio',
    desc: 'Acceso completo: feed de demandas, estadísticas, página propia y gestión avanzada. Plan pago.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    free: false,
  },
];

const DEFAULT_ZONE = 'Bovril, Entre Ríos';

async function detectZone() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(DEFAULT_ZONE); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=es`
          );
          const d = await r.json();
          const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
          const state = d.address?.state || '';
          resolve(city ? `${city}, ${state}` : DEFAULT_ZONE);
        } catch {
          resolve(DEFAULT_ZONE);
        }
      },
      () => resolve(DEFAULT_ZONE),
      { timeout: 5000 }
    );
  });
}

const COMPLETION_ITEMS = {
  usuario: [
    { icon: Briefcase, title: 'Creá tu CV',           desc: 'Aparecé en oportunidades laborales' },
    { icon: Star,      title: 'Agregá habilidades',   desc: 'Mejorá tu visibilidad en búsquedas' },
    { icon: Camera,    title: 'Subí una foto',         desc: 'Genera más confianza' },
  ],
  emprendimiento: [
    { icon: Star,     title: 'Describí tu emprendimiento', desc: 'Aparecé mejor posicionado' },
    { icon: Zap,      title: 'Publicá un servicio',         desc: 'Empezá a recibir consultas' },
    { icon: Camera,   title: 'Subí foto o logo',            desc: 'Genera confianza' },
  ],
  empresa: [
    { icon: Star,     title: 'Completá el perfil de empresa', desc: 'Llegá a más clientes' },
    { icon: Store,    title: 'Activá tu plan',                desc: 'Desbloqueá todas las funciones' },
    { icon: Camera,   title: 'Subí logo y fotos',             desc: 'Aumenta tu presencia' },
  ],
};

// ─── Step 1: Elegir rol ───────────────────────────────────────────────────────
function RoleStep({ onSelect, onSkip }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col min-h-full p-6 lg:p-8 max-w-lg mx-auto w-full">
      <div className="mb-6">
        <LogoFull size={22} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">¿Cómo vas a usar Lokal?</h2>
      <p className="text-slate-500 text-sm mt-1 mb-6">Podés cambiar esto después. Elegí lo que mejor te describe hoy.</p>

      <div className="space-y-3 flex-1">
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = selected === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                isSelected
                  ? `${role.border} ${role.bg}`
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${isSelected ? role.bg : 'bg-slate-100'} flex items-center justify-center shrink-0`}>
                  <Icon size={20} className={isSelected ? role.color : 'text-slate-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{role.label}</span>
                    {role.free
                      ? <span className="text-[10px] font-bold bg-brand-muted text-brand-dark px-2 py-0.5 rounded-full">Gratis</span>
                      : <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Plan pago</span>
                    }
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{role.tagline}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{role.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-all ${
                  isSelected ? `${role.border} ${role.bg}` : 'border-slate-300'
                }`}>
                  {isSelected && <Check size={12} className={role.color} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => selected && onSelect(selected)}
        disabled={!selected}
        className={`mt-6 w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
          selected
            ? 'bg-slate-900 text-white hover:bg-slate-800'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        Continuar <ArrowRight size={16} />
      </button>

      {/* Escape hatch: saltear onboarding */}
      <button
        onClick={onSkip}
        className="mt-3 w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        Saltar y entrar como usuario →
      </button>
    </div>
  );
}

// ─── Step 2: Perfil básico (solo emprendimiento / empresa) ───────────────────
function ProfileStep({ role, firebaseUser, onDone }) {
  const isEmpresa = role === 'empresa';
  const [form, setForm] = useState({
    businessName: '',
    businessCategory: null,
    hasLocalFisico: true,
  });
  const [zoneDetecting, setZoneDetecting] = useState(false);
  const [zone, setZone] = useState(DEFAULT_ZONE);

  // Detectar ubicación al montar
  useState(() => {
    setZoneDetecting(true);
    detectZone().then((z) => { setZone(z); setZoneDetecting(false); });
  });

  const canSubmit = form.businessName.trim();

  return (
    <div className="flex flex-col min-h-full p-6 lg:p-8 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-2 mb-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 ${i <= 1 ? 'bg-brand' : 'bg-slate-100'}`} />
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-1 mb-5">Paso 2 de 3</p>

      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
        {isEmpresa ? 'Tu negocio en Lokal' : 'Tu emprendimiento'}
      </h2>
      <p className="text-slate-500 text-sm mt-1 mb-6">
        Solo lo esencial. Podés completar todo después.
      </p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {isEmpresa ? 'Nombre del negocio' : 'Nombre del emprendimiento'}
          </label>
          <input
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            placeholder={isEmpresa ? 'Ej: Ferretería Sur, Café Central...' : 'Ej: Diseño por Lucía, MadeByMati...'}
            className="w-full mt-1.5 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-muted transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">Rubro</label>
          <CategoryPicker
            value={form.businessCategory}
            onChange={(id) => setForm({ ...form, businessCategory: id })}
            placeholder="Seleccioná o escribí tu rubro"
            className="mt-1.5"
          />
        </div>

        {/* Ubicación detectada automáticamente — solo mostrar, editable */}
        <div>
          <label className="text-sm font-semibold text-slate-700">Zona</label>
          <div className="flex items-center border border-slate-200 rounded-xl px-4 py-3 mt-1.5 gap-2 bg-slate-50">
            <MapPin size={16} className="text-brand shrink-0" />
            {zoneDetecting
              ? <span className="text-sm text-slate-400 flex-1">Detectando ubicación...</span>
              : <input
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="flex-1 text-sm outline-none bg-transparent text-slate-700"
                />
            }
          </div>
        </div>

        {isEmpresa && (
          <button
            type="button"
            onClick={() => setForm({ ...form, hasLocalFisico: !form.hasLocalFisico })}
            className="flex items-center gap-3 w-full text-left py-1"
          >
            <div className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${form.hasLocalFisico ? 'bg-brand' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.hasLocalFisico ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Tengo local físico</p>
              <p className="text-xs text-slate-400">Aparecerá en el mapa de Lokal</p>
            </div>
          </button>
        )}
      </div>

      <button
        onClick={() => canSubmit && onDone({ ...form, zone })}
        disabled={!canSubmit}
        className={`mt-6 w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
          canSubmit
            ? 'bg-slate-900 text-white hover:bg-slate-800'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        Continuar <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ─── Step 3: Success ──────────────────────────────────────────────────────────
function SuccessStep({ profile, onDone }) {
  const pct = computeCompletion(profile);
  const items = COMPLETION_ITEMS[profile.role] || COMPLETION_ITEMS.usuario;
  const roleData = ROLES.find((r) => r.id === profile.role);

  return (
    <div className="flex flex-col min-h-full p-6 lg:p-8 max-w-lg mx-auto w-full items-center text-center">
      <div className="flex items-center gap-2 w-full mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 rounded-full flex-1 bg-brand" />
        ))}
      </div>

      <div className="w-20 h-20 bg-gradient-to-br from-brand to-brand-dark rounded-full flex items-center justify-center mb-5 shadow-lg shadow-brand/30">
        <Check size={40} className="text-white" strokeWidth={3} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">¡Perfil creado!</h2>
      <p className="text-brand font-bold mt-1">Ya estás activo en Lokal</p>
      {roleData && (
        <span className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${roleData.bg} ${roleData.color}`}>
          {roleData.label}
        </span>
      )}

      <div className="w-full mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600 font-medium">Tu perfil está</span>
          <span className="text-2xl font-black text-amber-500">{pct}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-brand to-brand-dark transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Más completo → mejor visibilidad en búsquedas locales
        </p>
      </div>

      <div className="w-full mt-4 space-y-2">
        {items.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
              <Icon size={18} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{title}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </div>
        ))}
      </div>

      <div className="w-full space-y-2.5 mt-6">
        <button
          onClick={onDone}
          className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-colors"
        >
          Explorar Lokal
        </button>
        <button
          onClick={onDone}
          className="w-full border border-slate-200 text-slate-600 py-3.5 rounded-2xl font-semibold text-sm hover:bg-slate-50 transition-colors"
        >
          Completar perfil después
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingFlow({ firebaseUser, onComplete, onRegisterStore, mode = 'new' }) {
  const isUpgrade = mode === 'upgrade';
  const [step, setStep] = useState(isUpgrade ? 0 : 0);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);

  // Leer preselección de rol desde sessionStorage (seteada por AuthScreen)
  useEffect(() => {
    const preselect = sessionStorage.getItem('lokal-onboarding-preselect');
    if (preselect && !role) {
      sessionStorage.removeItem('lokal-onboarding-preselect');
      // Auto-seleccionar el rol y avanzar
      if (preselect === 'emprendimiento') {
        handleRoleSelect('emprendimiento');
      } else if (preselect === 'usuario') {
        handleRoleSelect('usuario');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoleSelect = async (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'usuario') {
      // Usuario: sin formulario, detectar zona y guardar directo
      const zone = await detectZone();
      const existing = loadUserProfile(firebaseUser.uid) || {};
      const saved = await saveUserProfileAsync(firebaseUser.uid, {
        ...existing,
        role: selectedRole,
        displayName: firebaseUser.displayName || existing.displayName || '',
        email: firebaseUser.email || existing.email,
        photoURL: firebaseUser.photoURL || existing.photoURL,
        zone: existing.zone || zone,
        onboarded: true,
        upgradedAt: isUpgrade ? Date.now() : undefined,
      });
      setProfile(saved);
      setStep(2); // directo a success
    } else {
      setStep(1); // emprendimiento/empresa: mostrar formulario
    }
  };

  const handleProfileDone = async (formData) => {
    const existing = loadUserProfile(firebaseUser.uid) || {};
    const saved = await saveUserProfileAsync(firebaseUser.uid, {
      ...existing,
      role,
      // Empresa siempre empieza con plan básico (puede upgrade a premium después)
      plan: role === 'empresa' ? 'basico' : (existing.plan || null),
      displayName: firebaseUser.displayName || existing.displayName || '',
      email: firebaseUser.email || existing.email,
      photoURL: firebaseUser.photoURL || existing.photoURL,
      onboarded: true,
      upgradedAt: isUpgrade ? Date.now() : undefined,
      ...formData,
    });
    setProfile(saved);
    setStep(2);
  };

  const handleSuccess = () => {
    if (role === 'empresa') {
      onRegisterStore?.('mensual');
    } else {
      onComplete(profile);
    }
  };

  // Escape hatch: saltear onboarding y entrar como usuario básico
  const handleSkip = async () => {
    const zone = await detectZone();
    const saved = await saveUserProfileAsync(firebaseUser.uid, {
      role: 'usuario',
      displayName: firebaseUser.displayName || '',
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      zone,
      onboarded: true,
      skippedOnboarding: true,
    });
    setProfile(saved);
    onComplete(saved);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Panel lateral decorativo — solo desktop */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-dark relative overflow-hidden flex-col justify-between p-10">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-brand rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-500 rounded-full blur-[120px] opacity-40" />
        </div>
        <div className="relative z-10">
          <LogoFull size={26} light />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            Un ecosistema para<br />
            <span className="text-brand-light">tu ciudad.</span>
          </h2>
          <p className="text-slate-300 text-base leading-relaxed max-w-sm">
            Conectamos personas, emprendimientos y negocios de tu barrio en una sola plataforma.
          </p>
          <div className="flex gap-3 mt-8">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.id} className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <Icon size={20} className="text-white/60 mx-auto mb-1" />
                  <p className="text-white/70 text-xs font-semibold">{r.label}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative z-10 text-slate-500 text-xs">
          © 2026 Lokal · Gratis para usuarios y emprendimientos
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {step === 0 && <RoleStep onSelect={handleRoleSelect} onSkip={isUpgrade ? () => onComplete?.(loadUserProfile(firebaseUser.uid)) : handleSkip} />}
        {step === 1 && <ProfileStep role={role} firebaseUser={firebaseUser} onDone={handleProfileDone} />}
        {step === 2 && <SuccessStep profile={profile} onDone={handleSuccess} />}
      </div>
    </div>
  );
}
