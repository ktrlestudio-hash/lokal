import React from 'react';
import { ArrowLeft, Plus, Loader2, Package, Pause, Play, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';

const API_BASE = '/.netlify/functions';

export default function MisProductosScreen({
  firebaseUser,
  userRole,
  goBack,
  setNudgeModal,
  setCreateSheetOpen,
}) {
  const [productos, setProductos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(null);

  const limits = { usuario: { usado: 3, nuevo: 0 }, emprendimiento: { usado: 10, nuevo: 5 }, empresa: { usado: 999, nuevo: 3 } };
  const roleLimits = limits[userRole] || limits.usuario;

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`${API_BASE}/ofertas?vendedorId=${firebaseUser.uid}`, { authRequired: true });
        if (res.ok) setProductos(await res.json());
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const usados = productos.filter(p => p.condicion === 'usado');
  const nuevos = productos.filter(p => p.condicion === 'nuevo');
  const activos = productos.filter(p => p.activa !== false);

  const toggleActiva = async (p) => {
    setActionLoading(p.id);
    try {
      const res = await apiFetch(`${API_BASE}/ofertas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, activa: !p.activa }),
        authRequired: true,
      });
      if (res.ok) {
        const updated = await res.json();
        setProductos(prev => prev.map(x => x.id === p.id ? updated : x));
      }
    } finally { setActionLoading(null); }
  };

  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.titulo}"?`)) return;
    setActionLoading(p.id);
    try {
      const res = await apiFetch(`${API_BASE}/ofertas?id=${p.id}`, { method: 'DELETE', authRequired: true });
      if (res.ok) setProductos(prev => prev.filter(x => x.id !== p.id));
    } finally { setActionLoading(null); }
  };

  const LimitBar = ({ label, count, max, color }) => (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`text-xs font-bold ${count >= max ? 'text-red-500' : 'text-slate-700 dark:text-white'}`}>
          {count}/{max === 999 ? '∞' : max}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full">
        <div className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${max === 999 ? 10 : Math.min(100, (count / max) * 100)}%` }} />
      </div>
    </div>
  );

  const ProductRow = ({ p }) => {
    const isLoading = actionLoading === p.id;
    const foto = p.fotos?.[0];
    return (
      <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${p.activa !== false ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10' : 'bg-slate-50 dark:bg-white/3 border-slate-100 dark:border-white/5 opacity-70'}`}>
        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-white/10 overflow-hidden shrink-0">
          {foto ? <img src={foto} className="w-full h-full object-cover" alt="" /> : <Package size={24} className="text-slate-300 m-auto mt-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.titulo}</p>
          <div className="flex items-center gap-2 mt-1">
            {p.precio && <span className="text-xs font-semibold text-brand">${Number(p.precio).toLocaleString()}</span>}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.condicion === 'nuevo' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
              {p.condicion === 'nuevo' ? 'Nuevo' : 'Usado'}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.activa !== false ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
              {p.activa !== false ? 'Activo' : 'Pausado'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => toggleActiva(p)}
            disabled={isLoading}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
            title={p.activa !== false ? 'Pausar' : 'Activar'}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin text-slate-400" /> : p.activa !== false ? <Pause size={14} className="text-slate-600 dark:text-slate-300" /> : <Play size={14} className="text-green-500" />}
          </button>
          <button
            onClick={() => eliminar(p)}
            disabled={isLoading}
            className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0a0d16] pb-28">
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/8">
        <div className="px-3 h-14 flex items-center gap-2">
          <button onClick={goBack} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-black text-slate-900 dark:text-white text-base flex-1">Mis productos</h1>
          <button onClick={() => setCreateSheetOpen(true)} className="bg-brand text-white text-sm font-bold px-4 h-9 rounded-xl flex items-center gap-1.5">
            <Plus size={15} /> Nuevo
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tu capacidad</p>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${
              userRole === 'empresa' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
              userRole === 'emprendimiento' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
              'bg-brand-muted text-brand-dark'
            }`}>{userRole}</span>
          </div>
          <div className="flex gap-4">
            <LimitBar label="Usados activos" count={usados.filter(p => p.activa !== false).length} max={roleLimits.usado} color="bg-brand" />
            {roleLimits.nuevo > 0 && (
              <LimitBar label="Nuevos activos" count={nuevos.filter(p => p.activa !== false).length} max={roleLimits.nuevo} color="bg-amber-400" />
            )}
          </div>
          {(userRole === 'usuario' || userRole === 'emprendimiento') && (
            <button
              onClick={() => setNudgeModal({ type: userRole === 'usuario' ? 'producto-usado-limite' : 'producto-nuevo' })}
              className="mt-3 w-full text-center text-xs text-brand font-semibold hover:underline"
            >
              ¿Querés más capacidad? Ver opciones →
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-brand" /></div>
        ) : productos.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="text-slate-300 dark:text-white/20 mx-auto mb-3" />
            <p className="font-bold text-slate-600 dark:text-slate-400">Todavía no publicaste nada</p>
            <p className="text-sm text-slate-400 dark:text-slate-600 mt-1 mb-5">Publicá tu primer producto en segundos</p>
            <button onClick={() => setCreateSheetOpen(true)} className="bg-brand text-white font-bold px-6 py-3 rounded-2xl text-sm">
              Publicar producto
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {activos.length > 0 && (
              <>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Activos ({activos.length})</p>
                {activos.map(p => <ProductRow key={p.id} p={p} />)}
              </>
            )}
            {productos.filter(p => p.activa === false).length > 0 && (
              <>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mt-4">Pausados</p>
                {productos.filter(p => p.activa === false).map(p => <ProductRow key={p.id} p={p} />)}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
