import React from 'react';
import { MapPin, Package, Tag, User, ChevronRight, Plus } from 'lucide-react';

const EmptyTabState = ({ icon: Icon, iconBg, iconColor, title, desc, primary, secondary }) => (
  <div className="flex flex-col items-center py-14 text-center px-4">
    <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mb-4`}>
      <Icon size={28} className={iconColor} />
    </div>
    <p className="font-bold text-slate-700 dark:text-white mb-1">{title}</p>
    <p className="text-sm text-slate-400 mb-7 max-w-xs leading-relaxed">{desc}</p>
    <div className="flex gap-3 w-full max-w-xs">
      <button
        onClick={primary.disabled ? undefined : primary.onClick}
        disabled={primary.disabled}
        className={`flex-1 py-3 rounded-2xl text-sm font-bold flex flex-col items-center gap-1 transition-colors ${
          primary.disabled
            ? 'bg-slate-100 dark:bg-white/6 text-slate-400 cursor-not-allowed'
            : 'bg-brand text-white hover:bg-brand-dark active:scale-95'
        }`}
      >
        {primary.label}
        {primary.badge && <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{primary.badge}</span>}
      </button>
      <button
        onClick={secondary.onClick}
        className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/12 active:scale-95 transition-colors"
      >
        {secondary.label}
      </button>
    </div>
  </div>
);

export default function MisCosasScreen({
  firebaseUser,
  userRole,
  /* hasTienda, // DEPRECADO: usar userRole === 'empresa' */
  allDemandas,
  navigate,
  navRoot,
  setEditingDemanda,
  setSelectedDemanda,
  setNudgeModal,
}) {
  const [activeTab, setActiveTab] = React.useState('pedidos');

  const profile = (() => {
    try {
      const raw = localStorage.getItem(`lokal-user-profile:${firebaseUser?.uid}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const roleLabel = { usuario: 'Usuario', emprendimiento: 'Emprendimiento', empresa: 'Empresa' }[userRole] || 'Usuario';
  const roleColor = {
    usuario:        'bg-brand/10 text-brand',
    emprendimiento: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    empresa:        'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  }[userRole] || 'bg-brand/10 text-brand';

  const tabs = [
    { id: 'pedidos', label: 'Pedidos', icon: Package },
    { id: 'ventas',  label: 'Ventas',  icon: Tag },
    { id: 'cv',      label: 'CV',      icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0a0d16]">
      <div className="bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-white/8 px-5 pt-12 pb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-primary/30 shrink-0">
            {firebaseUser?.photoURL
              ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black text-xl">
                  {(firebaseUser?.displayName || 'U')[0].toUpperCase()}
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-lg text-slate-900 dark:text-white truncate">
              {profile?.displayName || firebaseUser?.displayName || 'Usuario'}
            </p>
            {profile?.zone && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {profile.zone}
              </p>
            )}
          </div>
          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0 ${roleColor}`}>
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-white/8 sticky top-0 z-10">
        <div className="flex px-4 gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold shrink-0 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-28">
        {activeTab === 'pedidos' && (
          <div className="px-4 pt-4">
            {allDemandas.filter(d => d.uid === firebaseUser?.uid).length === 0 ? (
              <EmptyTabState
                icon={Package}
                iconBg="bg-brand/8"
                iconColor="text-brand"
                title="Sin pedidos aún"
                desc="Publicá lo que necesitás y las tiendas locales te responden"
                primary={{ label: 'Crear pedido', onClick: () => { setEditingDemanda(null); navigate('crear'); } }}
                secondary={{ label: 'Ver mis pedidos', onClick: () => navigate('mis-demandas') }}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mis pedidos</p>
                  <button onClick={() => navigate('mis-demandas')}
                    className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
                    Ver todos <ChevronRight size={12} />
                  </button>
                </div>
                {allDemandas.filter(d => d.uid === firebaseUser?.uid).slice(0, 5).map(d => {
                  const foto = d.fotos?.[0] || d.foto;
                  return (
                    <div key={d.id} onClick={() => { setSelectedDemanda(d); navigate('detalle'); }}
                      className="flex items-center gap-3 bg-white dark:bg-[#0f172a] rounded-2xl p-3 border border-slate-100 dark:border-white/8 cursor-pointer hover:shadow-sm transition-all active:scale-[0.98]">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/8 overflow-hidden shrink-0 flex items-center justify-center">
                        {foto ? <img src={foto} className="w-full h-full object-cover" alt="" /> : <Package size={18} className="text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{d.titulo}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{d.respuestas || 0} respuestas</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 shrink-0" />
                    </div>
                  );
                })}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setEditingDemanda(null); navigate('crear'); }}
                    className="flex-1 py-3 rounded-2xl border-2 border-brand text-brand text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand/5 transition-colors">
                    <Plus size={14} /> Nuevo pedido
                  </button>
                  <button onClick={() => navigate('mis-demandas')}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/12 transition-colors">
                    Ver todos <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ventas' && (
          <div className="px-4 pt-4">
            <EmptyTabState
              icon={Tag}
              iconBg="bg-purple-100 dark:bg-purple-500/10"
              iconColor="text-purple-600 dark:text-purple-400"
              title="Tus ventas"
              desc="Publicá productos usados o nuevos y conectá con compradores locales"
              primary={{
                label: 'Vender producto',
                onClick: () => {
                  // ─── Lógica nueva: basada en userRole ──────────────────────────
                  if (userRole === 'empresa' || userRole === 'emprendimiento') {
                    navigate('vender-producto');
                  } else {
                    setNudgeModal?.({ type: 'upgrade-rol' });
                  }
                  // ─── Lógica vieja (hasTienda) DEPRECADA ────────────────────────
                  // if (hasTienda) { navigate('vender-producto'); }
                  // else if (userRole === 'usuario') {
                  //   setNudgeModal?.({ type: 'upgrade-rol' });
                  // } else {
                  //   navigate('vender-producto');
                  // }
                },
              }}
              secondary={{ label: 'Ver mis productos', onClick: () => navigate('mis-productos') }}
            />
          </div>
        )}

        {activeTab === 'cv' && (
          <div className="px-4 pt-4">
            <EmptyTabState
              icon={User}
              iconBg="bg-slate-100 dark:bg-white/8"
              iconColor="text-slate-400"
              title="CV / Perfil laboral"
              desc="Aparecé en el mapa como candidato y recibí oportunidades laborales de negocios locales"
              primary={{ label: 'Crear mi CV', onClick: () => {}, disabled: true, badge: 'Próximamente' }}
              secondary={{ label: 'Ver oportunidades', onClick: () => navigate('oportunidades') }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
