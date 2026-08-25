/**
 * RegistroTienda — form mínimo para crear la tienda del dueño logueado.
 * Reduce StoreRegisterFlow.jsx (LOKAL global: wizard de 3 pasos + mapa + plan
 * pago) a lo justo y necesario para LOKAL LINKS: nombre, ciudad, WhatsApp.
 * Rubro fijo 'ofertas' (mono-rubro) — sin selector de rubro ni mapa.
 *
 * Dos modos de acceso (REGISTRO_MODO en config/constants.ts, cambiable sin
 * tocar este flujo):
 *   'invitacion' → requiere ?token=... en la URL (link de uso único
 *                  generado por un admin vía invites.js). Se valida/reclama
 *                  con GET al montar, se consume con PATCH tras crear.
 *   'abierto'    → cualquier usuario crea directo, trial gratis 14 días
 *                  (tiendas-crud.js POST con trial:true).
 *
 * Mismo contrato de datos que el backend real (tiendas-crud.js
 * buildStorePayload): nombre, rubros, ciudad, telefono, googleUid,
 * ownerNombre, ownerEmail, termsAccepted.
 *
 * ── Rediseño visual (2026-08) ───────────────────────────────────────────
 * Antes esta pantalla usaba tokens genéricos (`--surface-solid-2`,
 * `--brand-hex` plano) mientras el resto del login (AdminLogin.jsx +
 * LoginCard.jsx, rediseñados en la misma pasada) ya usa el lenguaje real de
 * marca: glow radial de `--brand` de fondo, card con degradado glass +
 * blur en dark, inputs tintados con `rgb(var(--brand)/X)`, `rounded-2xl`/
 * `3xl`, `active:scale-[0.98]`. Este archivo ahora copia ESE lenguaje
 * (mismo bloque de glow, misma card, mismos inputs) — la lógica funcional
 * (invite token, mapa, payload a tiendas-crud) no se tocó en absoluto, solo
 * el envoltorio visual. Ver AdminLogin.jsx para el patrón original.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from './api.js';
import { LogoFull } from './Brand';
import { REGISTRO_MODO } from './config/constants';
// Ciudad + mapa: mismos helpers reales que usa StoreApp.jsx para editar la
// dirección de la tienda (storeFormUtils.jsx) — antes había una copia
// duplicada acá con fixes propios (foco con sugerencias, filtro
// addresstype); esos fixes ya se aplicaron directo en storeFormUtils.jsx,
// así benefician también a StoreApp, un solo lugar de verdad.
import { PlaceAutocomplete, MapPicker } from './storeFormUtils';

const API_BASE = '/.netlify/functions';

// Fondo de página + glow de marca — MISMO bloque que AdminLogin.jsx (glow
// radial superior que pulsa + reflejo inferior tenue), reusado tal cual acá
// para que las dos pantallas del flujo de login/registro compartan la
// misma ambientación. No se extrajo a un componente compartido porque cada
// pantalla lo combina con un layout de contenedor levemente distinto
// (AdminLogin tiene footer con nav legal; acá no) — duplicar este bloque
// chico es más simple que forzar una prop API común para ambos layouts.
function FondoConGlow({ isDark, children }) {
  return (
    <div className="lok-app-surface relative min-h-[100dvh] flex flex-col items-center justify-center px-6 overflow-hidden" style={{ background: isDark ? '#040a14' : 'var(--surface-solid, #fff)' }}>
      <style>{`
        @keyframes lk-login-glow { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.06); } }
      `}</style>
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
        height: '60%',
        background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.16), transparent)',
        animation: 'lk-login-glow 3.4s ease-in-out infinite',
      }} />
      <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{
        height: '40%',
        background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgb(var(--brand, 0 184 217) / 0.06), transparent)',
      }} />
      <div className="relative w-full" style={{ maxWidth: 'clamp(384px, 28vw, 460px)' }}>
        {children}
      </div>
    </div>
  );
}

// Card con glass tintado de marca — MISMO tratamiento que la card de
// AdminLogin.jsx (degradado glass + blur en dark, degradado sutil + borde
// en light), acá sin la fila de retroceso/tema (esos toggles viven en
// AdminLogin, esta pantalla siempre se llega DESDE ahí con sesión activa).
function CardGlass({ isDark, children }) {
  return (
    <div
      className="relative rounded-3xl shadow-2xl text-center"
      style={{
        padding: 'clamp(24px, 3vw, 36px) clamp(24px, 2.6vw, 32px)',
        background: isDark
          ? 'linear-gradient(160deg, rgba(255,255,255,.07), rgb(var(--brand, 0 184 217) / 0.06))'
          : 'linear-gradient(160deg, rgb(var(--brand, 0 184 217) / 0.06), rgb(var(--brand, 0 184 217) / 0.015)), var(--surface-solid, #fff)',
        border: '1px solid rgb(var(--brand, 0 184 217) / 0.18)',
        backdropFilter: isDark ? 'blur(24px)' : undefined,
        WebkitBackdropFilter: isDark ? 'blur(24px)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

function getInviteToken() {
  return new URLSearchParams(window.location.search).get('token') || '';
}

// Un sessionId estable por pestaña — identifica "quién" reclamó el link,
// para que dos pestañas con el mismo link no se pisen (mismo mecanismo real
// de invites.js: GET marca 'reclamado' con este id, PATCH lo verifica).
function getSessionId() {
  const KEY = 'lokal-invite-session';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export default function RegistroTienda({ firebaseUser, onCreada, onLogout, onIrAlPanelAdmin, isDark = true }) {
  const modoInvitacion = REGISTRO_MODO === 'invitacion';
  const token = useRef(modoInvitacion ? getInviteToken() : null).current;
  const sessionId = useRef(modoInvitacion ? getSessionId() : null).current;

  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [ciudadCoords, setCiudadCoords] = useState(null);
  const [telefono, setTelefono] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mapa: mounted se demora en desmontar hasta que termina la transición de
  // salida (300ms), y lastCoords conserva la última posición mientras se
  // desvanece — sin esto, al borrar la ciudad el mapa se iba de golpe junto
  // con sus datos, en vez de desvanecerse con contenido visible.
  const [mapMounted, setMapMounted] = useState(false);
  const [lastCoords, setLastCoords] = useState(null);
  useEffect(() => {
    if (ciudadCoords) {
      setLastCoords(ciudadCoords);
      setMapMounted(true);
      return undefined;
    }
    if (mapMounted) {
      const t = setTimeout(() => setMapMounted(false), 320);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [ciudadCoords, mapMounted]);

  // Estado de la invitación: 'checking' | 'valid' | 'invalid'. En modo
  // abierto se considera siempre válida (no hay nada que chequear).
  const [inviteState, setInviteState] = useState(modoInvitacion ? 'checking' : 'valid');

  useEffect(() => {
    if (!modoInvitacion) return;
    if (!token) { setInviteState('invalid'); setError('Falta el link de invitación. Pedile uno al administrador.'); return; }
    let mounted = true;
    fetch(`${API_BASE}/invites?token=${encodeURIComponent(token)}&sessionId=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok) { setInviteState('invalid'); setError(data.error || 'Link de invitación inválido.'); return; }
        setInviteState('valid');
      })
      .catch(() => { if (mounted) { setInviteState('invalid'); setError('No se pudo verificar el link. Probá de nuevo.'); } });
    return () => { mounted = false; };
  }, [modoInvitacion, token, sessionId]);

  const puedeEnviar = inviteState === 'valid' && nombre.trim().length >= 2 && acceptedTerms && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        nombre: nombre.trim(),
        rubros: ['ofertas'],
        ciudad: ciudad.trim(),
        direccion: '',
        telefono: telefono.trim(),
        lat: ciudadCoords?.lat ?? null,
        lng: ciudadCoords?.lng ?? null,
        googleUid: firebaseUser.uid,
        ownerNombre: firebaseUser.displayName || '',
        ownerEmail: firebaseUser.email || '',
        termsAccepted: true,
        ...(modoInvitacion ? { token, sessionId } : { trial: true }),
      };
      const res = await apiFetch(`${API_BASE}/tiendas-crud`, {
        method: 'POST',
        authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.error || `Error ${res.status} al crear la tienda`);

      // tiendas-crud.js ya marca el invite como usado (PATCH interno) cuando
      // el registro viene con token+sessionId — no hace falta duplicarlo acá.
      onCreada(data);
    } catch (err) {
      setError(err.message || 'No se pudo crear la tienda');
      setLoading(false);
    }
  };

  // rgb(var(--brand)/X) tintado en vez de tokens genéricos de superficie —
  // mismo criterio que ya explica LoginCard.jsx para sus propios inputs: un
  // fondo sólido gris/negro se sentía desconectado de la card glass que lo
  // rodea, mientras que el tinte de marca a baja opacidad se lee como parte
  // del mismo sistema visual en las dos pantallas.
  const inputBase = {
    color: 'var(--text-primary)',
    background: 'rgb(var(--brand, 0 184 217) / 0.06)',
    borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
  };

  if (inviteState === 'checking') {
    return (
      <FondoConGlow isDark={isDark}>
        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      </FondoConGlow>
    );
  }

  if (inviteState === 'invalid') {
    return (
      <FondoConGlow isDark={isDark}>
        <CardGlass isDark={isDark}>
          <div className="mb-6 flex justify-center"><LogoFull size={28} /></div>
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className="font-black mb-2" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.1rem, 1.5vw, 1.25rem)' }}>No se puede registrar</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary, #999)' }}>{error}</p>
          {onIrAlPanelAdmin && (
            <button onClick={onIrAlPanelAdmin}
              className="w-full mb-3 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: 'var(--brand-hex, #00B8D9)' }}>
              Ir al panel admin
            </button>
          )}
          <button onClick={onLogout} className="text-xs font-medium" style={{ color: 'var(--text-secondary, #999)' }}>
            Cerrar sesión
          </button>
        </CardGlass>
      </FondoConGlow>
    );
  }

  return (
    <FondoConGlow isDark={isDark}>
      <form onSubmit={handleSubmit}>
        <CardGlass isDark={isDark}>
          <div className="mb-6 flex justify-center">
            <LogoFull size={28} />
          </div>
          <h1 className="font-black mb-1" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)' }}>
            Creá tu tienda
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary, #999)', fontSize: 'clamp(.875rem, 1vw, .9375rem)' }}>
            Hola {firebaseUser.displayName?.split(' ')[0] || ''} — completá estos datos para empezar.
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3 mb-4 text-left">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary, #999)' }}>
                Nombre del negocio *
              </label>
              <input
                type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Almacén Don José" required maxLength={120}
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium border outline-none transition-colors focus:border-brand"
                style={inputBase}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary, #999)' }}>
                Ciudad
              </label>
              <PlaceAutocomplete value={ciudad} onChange={setCiudad} onSelect={setCiudadCoords} placeholder="Ej: Bovril, Entre Ríos" labelParts={2} />
            </div>
            {/* Transición de entrada/salida (max-height + opacity) en vez de
                aparecer/desaparecer de golpe al elegir o borrar la ciudad —
                mapMounted se demora en desmontar hasta que termina la salida,
                igual que el patrón de los bottom sheets (useSheetOpen.js). */}
            {mapMounted && (
              <div style={{
                overflow: 'hidden',
                maxHeight: ciudadCoords ? 260 : 0,
                opacity: ciudadCoords ? 1 : 0,
                transition: 'max-height .3s ease, opacity .25s ease',
              }}>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary, #999)' }}>
                  Ubicación exacta — arrastrá o tocá el mapa para ajustar
                </label>
                {lastCoords && <MapPicker lat={lastCoords.lat} lng={lastCoords.lng} flyTo={lastCoords} onChange={setCiudadCoords} isDark />}
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary, #999)' }}>
                WhatsApp
              </label>
              <input
                type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                placeholder="+54 9 11 1234-5678"
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium border outline-none transition-colors focus:border-brand"
                style={inputBase}
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 mb-5 cursor-pointer text-left">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0" />
            <span className="text-xs" style={{ color: 'var(--text-secondary, #999)' }}>
              Acepto los <a href="/terminos-y-condiciones" target="_blank" rel="noopener" className="underline">términos y condiciones</a> y la{' '}
              <a href="/politica-de-privacidad" target="_blank" rel="noopener" className="underline">política de privacidad</a>.
            </span>
          </label>

          <button type="submit" disabled={!puedeEnviar}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'var(--brand-hex, #00B8D9)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear mi tienda'}
          </button>

          <button type="button" onClick={onLogout}
            className="w-full mt-3 py-2 text-xs font-medium" style={{ color: 'var(--text-secondary, #999)' }}>
            Cerrar sesión
          </button>
        </CardGlass>
      </form>
    </FondoConGlow>
  );
}
