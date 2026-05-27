import React, { useState, useEffect } from 'react';
import { UserCog, Play, Square, AlertTriangle, Store, Package, User, Crown, ChevronRight } from 'lucide-react';

const ROLES = [
  { id: 'usuario',        label: 'Usuario',        icon: User,       desc: 'Solo puede ver. No publica ni responde.' },
  { id: 'emprendimiento', label: 'Emprendimiento', icon: Package,    desc: 'Gratis. Max 5 productos, ve demandas pero no responde.' },
  { id: 'empresa',        label: 'Empresa Básico', icon: Store,      desc: 'Pago. Max 20 productos, responde demandas, stats básicas.' },
];

const PLANS = [
  { id: 'basico',  label: 'Básico',  icon: Store },
  { id: 'premium', label: 'Premium', icon: Crown },
];

export default function RoleSimulator({ firebaseUser, setRoleSim, onBack }) {
  const [simConfig, setSimConfig] = useState(() => {
    try {
      const raw = localStorage.getItem('lokal-role-sim');
      return raw ? JSON.parse(raw) : { active: false, role: 'emprendimiento', plan: null };
    } catch {
      return { active: false, role: 'emprendimiento', plan: null };
    }
  });

  const isActive = simConfig.active;
  const selectedRole = simConfig.role;
  const selectedPlan = simConfig.plan;

  const isEmpresa = selectedRole === 'empresa';

  const toggleSim = () => {
    const next = { ...simConfig, active: !isActive };
    setSimConfig(next);
    localStorage.setItem('lokal-role-sim', JSON.stringify(next));
    setRoleSim(next.active ? next : null);
    if (next.active) {
      // Forzar recarga para que Root.jsx aplique el effectiveUserProfile
      window.location.reload();
    } else {
      window.location.reload();
    }
  };

  const setRole = (role) => {
    const next = {
      ...simConfig,
      role,
      plan: role === 'empresa' ? (simConfig.plan || 'basico') : null,
    };
    setSimConfig(next);
    if (isActive) {
      localStorage.setItem('lokal-role-sim', JSON.stringify(next));
      setRoleSim(next);
      window.location.reload();
    }
  };

  const setPlan = (plan) => {
    const next = { ...simConfig, plan };
    setSimConfig(next);
    if (isActive) {
      localStorage.setItem('lokal-role-sim', JSON.stringify(next));
      setRoleSim(next);
      window.location.reload();
    }
  };

  // Construir businessProfile fake según el rol
  // Emprendimiento también necesita businessProfile para que StoreApp funcione
  const fakeBusinessProfile = (isEmpresa || selectedRole === 'emprendimiento') ? {
    nombre: selectedRole === 'emprendimiento' ? 'Mi Emprendimiento (Simulado)' : 'Mi Tienda (Simulada)',
    descripcion: 'Esta tienda es una simulación para testing.',
    foto: firebaseUser?.photoURL || null,
    rubros: ['Tecnología'],
    ciudad: 'Rosario',
    telefono: '',
    whatsapp: '',
    instagram: '',
    slug: selectedRole === 'emprendimiento' ? 'mi-emprendimiento-sim' : 'mi-tienda-sim',
    tagline: 'Simulación de tienda',
    galeria: [],
  } : null;

  const fakeSuscripcion = isEmpresa ? {
    plan: selectedPlan || 'basico',
    estado: 'activa',
    trial: true,
    trialHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  } : null;

  const handleApply = () => {
    const next = {
      active: true,
      role: selectedRole,
      plan: isEmpresa ? selectedPlan : null,
      businessProfile: fakeBusinessProfile,
      suscripcion: fakeSuscripcion,
    };
    setSimConfig(next);
    localStorage.setItem('lokal-role-sim', JSON.stringify(next));
    setRoleSim(next);
    window.location.reload();
  };

  const handleStop = () => {
    const next = { ...simConfig, active: false };
    setSimConfig(next);
    localStorage.removeItem('lokal-role-sim');
    setRoleSim(null);
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
          <UserCog className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Simular rol</h2>
          <p className="text-xs text-slate-500">Probá la app como si fueras otro tipo de usuario</p>
        </div>
      </div>

      {/* Estado actual */}
      {isActive && (
        <div className="rounded-2xl border-2 border-amber-400/50 bg-amber-50 dark:bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Simulación activa</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Estás viendo la app como <strong>{ROLES.find(r => r.id === selectedRole)?.label}</strong>
              {isEmpresa && ` — Plan ${PLANS.find(p => p.id === selectedPlan)?.label}`}
            </p>
            <button
              onClick={handleStop}
              className="mt-2 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-300 dark:hover:bg-amber-500/30 transition-colors"
            >
              <Square className="w-3.5 h-3.5" /> Detener simulación
            </button>
          </div>
        </div>
      )}

      {/* Selector de rol */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Elegí un rol</p>
        <div className="space-y-2">
          {ROLES.map(({ id, label, icon: Icon, desc }) => {
            const selected = selectedRole === id;
            return (
              <button
                key={id}
                onClick={() => setRole(id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                  selected
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-500/10'
                    : 'border-slate-100 dark:border-white/8 hover:border-slate-200 dark:hover:border-white/15'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  selected ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600' : 'bg-slate-100 dark:bg-white/8 text-slate-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${selected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-900 dark:text-white'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
                {selected && <ChevronRight className="w-4 h-4 text-violet-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de plan (solo para empresa) */}
      {isEmpresa && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Plan de empresa</p>
          <div className="grid grid-cols-2 gap-2">
            {PLANS.map(({ id, label, icon: Icon }) => {
              const selected = selectedPlan === id;
              return (
                <button
                  key={id}
                  onClick={() => setPlan(id)}
                  className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all ${
                    selected
                      ? 'border-violet-400 bg-violet-50 dark:bg-violet-500/10'
                      : 'border-slate-100 dark:border-white/8 hover:border-slate-200 dark:hover:border-white/15'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    selected ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600' : 'bg-slate-100 dark:bg-white/8 text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-bold ${selected ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview de cómo queda */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Configuración resultante</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Rol:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{ROLES.find(r => r.id === selectedRole)?.label}</span>
          </div>
          {isEmpresa && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-400">Plan:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{PLANS.find(p => p.id === selectedPlan)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Límite productos:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedPlan === 'premium' ? 'Ilimitado' : selectedPlan === 'basico' ? '20' : '5'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estadísticas:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedPlan === 'premium' ? 'Premium + IA' : 'Básicas'}</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Responde demandas:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{isEmpresa ? 'Sí' : 'No'}</span>
          </div>
        </div>
      </div>

      {/* Botón aplicar */}
      {!isActive ? (
        <button
          onClick={handleApply}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-2xl transition-colors"
        >
          <Play className="w-4 h-4" /> Iniciar simulación
        </button>
      ) : (
        <button
          onClick={handleApply}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 text-white font-bold py-3 rounded-2xl transition-colors"
        >
          <Play className="w-4 h-4" /> Aplicar cambios y recargar
        </button>
      )}

      <p className="text-[10px] text-slate-400 text-center">
        La simulación se guarda en este navegador. Otros admins no la ven.
      </p>
    </div>
  );
}
