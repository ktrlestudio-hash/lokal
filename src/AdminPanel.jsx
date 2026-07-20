/**
 * AdminPanel — panel mínimo de super-admin para LOKAL LINKS.
 * Dos funciones (lo justo y necesario, sin dashboard de estadísticas todavía
 * — eso es Fase 4):
 *   1. Generar links de invitación de uso único (invites.js POST) — el
 *      "visto bueno" previo que deja una tienda verificada:true al crear.
 *   2. Ver tiendas pendientes de aprobación (trial sin verificar) y
 *      aprobarlas/rechazarlas (tiendas-crud.js PATCH verificada / activa).
 * Acceso: solo user.isAdmin (mismo ADMIN_EMAILS que el resto del backend).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Copy, Check, Store, Link2, ShieldCheck, X, ArrowLeft } from 'lucide-react';
import { apiFetch } from './api.js';
import { LogoFull } from './Brand';

const API_BASE = '/.netlify/functions';

function GenerarInvitacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null);
  const [copied, setCopied] = useState(false);

  const generar = async () => {
    setLoading(true);
    setError(null);
    setInvite(null);
    try {
      const res = await apiFetch(`${API_BASE}/invites`, { method: 'POST', authRequired: true });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
      setInvite(data);
    } catch (err) {
      setError(err.message || 'No se pudo generar el link');
    } finally {
      setLoading(false);
    }
  };

  const copiar = () => {
    if (!invite?.url) return;
    navigator.clipboard?.writeText(invite.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-solid, rgba(255,255,255,.1))', background: 'var(--surface-solid-2, #151515)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="w-4 h-4" style={{ color: 'var(--brand-hex, #00B8D9)' }} />
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary, #fff)' }}>Link de invitación (uso único)</h2>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary, #999)' }}>
        Quien se registre con este link queda aprobado automáticamente — sale público sin esperar tu revisión. Vence en 24hs si nadie lo usa.
      </p>
      {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
      {invite ? (
        <div className="flex items-center gap-2">
          <input readOnly value={invite.url}
            className="flex-1 px-3 py-2 rounded-xl text-xs border outline-none"
            style={{ background: 'var(--surface-solid, #0a0a0a)', color: 'var(--text-primary, #fff)', borderColor: 'var(--border-solid, rgba(255,255,255,.1))' }} />
          <button onClick={copiar} className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--brand-hex, #00B8D9)', color: '#fff' }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <button onClick={generar} disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50"
          style={{ background: 'var(--brand-hex, #00B8D9)', color: '#fff' }}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
          Generar link
        </button>
      )}
    </div>
  );
}

function TiendasPendientes() {
  const [tiendas, setTiendas] = useState(null);
  const [error, setError] = useState(null);
  const [actuando, setActuando] = useState(null); // id de la tienda en acción

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/tiendas-crud?pendientes=true`, { authRequired: true });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
      setTiendas(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la lista');
      setTiendas([]);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const actuar = async (id, patch) => {
    setActuando(id);
    try {
      const res = await apiFetch(`${API_BASE}/tiendas-crud`, {
        method: 'PATCH', authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || `Error ${res.status}`);
      setTiendas((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message || 'No se pudo actualizar');
    } finally {
      setActuando(null);
    }
  };

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-solid, rgba(255,255,255,.1))', background: 'var(--surface-solid-2, #151515)' }}>
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4" style={{ color: 'var(--brand-hex, #00B8D9)' }} />
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary, #fff)' }}>Tiendas esperando aprobación</h2>
      </div>
      {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
      {tiendas === null && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-secondary, #999)' }} />}
      {tiendas?.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-secondary, #999)' }}>No hay tiendas pendientes ahora mismo.</p>
      )}
      <div className="space-y-2">
        {tiendas?.map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'var(--surface-solid, #0a0a0a)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--brand-hex, #00B8D9)', opacity: 0.15 }}>
              <Store className="w-4 h-4" style={{ color: 'var(--brand-hex, #00B8D9)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary, #fff)' }}>{t.nombre}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-secondary, #999)' }}>{t.ownerEmail} · {t.ciudad || 'sin ciudad'}</p>
            </div>
            <button onClick={() => actuar(t.id, { verificada: true })} disabled={actuando === t.id}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-50"
              style={{ background: 'rgba(34,197,94,.15)', color: '#22C55E' }} title="Aprobar">
              {actuando === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={() => actuar(t.id, { activa: false })} disabled={actuando === t.id}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-50"
              style={{ background: 'rgba(239,68,68,.15)', color: '#EF4444' }} title="Rechazar">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPanel({ onLogout, onVolver }) {
  return (
    <div className="min-h-screen px-5 py-8" style={{ background: 'var(--surface-solid, #0a0a0a)' }}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <LogoFull size={24} />
          <div className="flex items-center gap-4">
            {onVolver && (
              <button onClick={onVolver} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text-secondary, #999)' }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Mi tienda
              </button>
            )}
            <button onClick={onLogout} className="text-xs font-medium" style={{ color: 'var(--text-secondary, #999)' }}>
              Cerrar sesión
            </button>
          </div>
        </div>
        <h1 className="text-lg font-black mb-4" style={{ color: 'var(--text-primary, #fff)' }}>Panel admin</h1>
        <div className="space-y-4">
          <GenerarInvitacion />
          <TiendasPendientes />
        </div>
      </div>
    </div>
  );
}
