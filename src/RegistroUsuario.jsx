/**
 * RegistroUsuario — form mínimo para crear el perfil de "usuario común" (no
 * dueño de tienda): favoritos, seguir tiendas, en el futuro. Hermano de
 * RegistroTienda.jsx, mismo lenguaje visual (glow de marca + card glass),
 * mismo patrón de fetch (apiFetch con authRequired, POST optimista contra
 * el backend que YA existe — ver functions/.netlify/functions/usuarios.js).
 *
 * Antes de este archivo, "elegir cuenta de usuario" (paso 'elegir-rol' de
 * LoginCard.jsx) creaba el perfil con un POST casi vacío ({}), sin pedir
 * nada — el backend igual lo aceptaba (buildUsuarioPayload cae a
 * `user.name`/'' si no llega nombre/zona). Este formulario junta esos dos
 * datos reales ANTES de crear el perfil, en vez de crearlo vacío y esperar
 * a que la persona lo complete después en un lugar que hoy no existe.
 *
 * Campos, deliberadamente pocos (pedido explícito: nada inventado sin uso
 * real hoy):
 *   - nombre: precargado con firebaseUser.displayName, editable.
 *   - zona/ciudad: PlaceAutocomplete (mismo componente que ya usa
 *     RegistroTienda.jsx) en modo texto libre — un usuario común no
 *     necesita un pin exacto en el mapa, solo su ciudad/barrio para poder
 *     mostrarle más adelante tiendas cercanas.
 *   - términos: mismo checkbox/copy que RegistroTienda.jsx.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import { apiFetch } from './api.js';
import { LogoFull } from './Brand';
import { PlaceAutocomplete, reverseGeocode } from './storeFormUtils';
import { useGeolocation } from './hooks';

const API_BASE = '/.netlify/functions';

// Mismo bloque de glow + card glass que RegistroTienda.jsx — no se extrajo
// a un archivo compartido porque hoy solo estos dos lugares lo usan y cada
// uno podría necesitar divergir (headers/footers propios) más adelante;
// duplicar dos funciones chicas es más simple que forzar una dependencia
// cruzada entre estos dos formularios de registro.
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

export default function RegistroUsuario({ firebaseUser, onCreado, onLogout, isDark = true }) {
  const [nombre, setNombre] = useState(firebaseUser?.displayName || '');
  // Enter en "Tu nombre" → sale del teclado (blur) y abre el panel de
  // Ciudad/zona directo — mismo flujo que RegistroTienda.jsx, ver ese
  // archivo para el porqué.
  const zonaRef = useRef(null);
  const handleNombreEnter = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.currentTarget.blur();
    zonaRef.current?.abrir();
  };
  const [zona, setZona] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // "Usar mi ubicación" — mismo patrón que RegistroTienda.jsx/StoreApp.jsx:
  // pide el GPS del navegador y completa el campo de zona con reverse
  // geocoding (Nominatim), sin pin de mapa (un usuario común no necesita
  // ubicación exacta, solo ciudad/barrio de texto).
  const geo = useGeolocation();
  useEffect(() => {
    if (!geo.location) return;
    const { lat, lng } = geo.location;
    reverseGeocode(lat, lng)
      .then(({ ciudad: c }) => { if (c) setZona(c); })
      .catch(() => {});
  }, [geo.location]);

  const puedeEnviar = nombre.trim().length >= 2 && acceptedTerms && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/usuarios`, {
        method: 'POST',
        authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), zona: zona.trim() }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.error || `Error ${res.status} al crear tu cuenta`);
      onCreado(data);
    } catch (err) {
      setError(err.message || 'No se pudo crear tu cuenta');
      setLoading(false);
    }
  };

  const inputBase = {
    color: 'var(--text-primary)',
    background: 'rgb(var(--brand, 0 184 217) / 0.06)',
    borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
  };

  return (
    <FondoConGlow isDark={isDark}>
      <form onSubmit={handleSubmit}>
        <CardGlass isDark={isDark}>
          <div className="mb-6 flex justify-center">
            <LogoFull size={28} />
          </div>
          <h1 className="font-black mb-1" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)' }}>
            Creá tu cuenta
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary, #999)', fontSize: 'clamp(.875rem, 1vw, .9375rem)' }}>
            Completá estos datos para empezar a seguir tiendas y guardar favoritos.
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
                Tu nombre *
              </label>
              <input
                type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                onKeyDown={handleNombreEnter}
                placeholder="Ej: María González" required maxLength={120}
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium border outline-none transition-colors focus:border-brand"
                style={inputBase}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary, #999)' }}>
                Ciudad o zona
              </label>
              <PlaceAutocomplete
                ref={zonaRef}
                value={zona} onChange={setZona}
                placeholder="Ej: Bovril, Entre Ríos" labelParts={2}
                onUbicacion={() => geo.requestLocation()}
                ubicacionLoading={geo.loading}
                ubicacionError={geo.error}
              />
            </div>
          </div>

          {/* Checkbox custom — mismo patrón que RegistroTienda.jsx, ver ese
              archivo para el porqué (el <input type="checkbox"> nativo
              renderizaba con el estilo gris neutro del navegador/SO). */}
          <label className="flex items-start gap-2.5 mb-5 cursor-pointer text-left">
            <span className="relative mt-0.5 w-[18px] h-[18px] shrink-0 rounded-md border flex items-center justify-center transition-colors" style={{
              borderColor: acceptedTerms ? 'rgb(var(--brand, 0 184 217))' : 'rgb(var(--brand, 0 184 217) / 0.35)',
              background: acceptedTerms ? 'rgb(var(--brand, 0 184 217))' : 'rgb(var(--brand, 0 184 217) / 0.06)',
            }}>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {acceptedTerms && <Check className="w-3 h-3 text-white pointer-events-none" strokeWidth={3} />}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary, #999)' }}>
              Acepto los <a href="/terminos-y-condiciones" target="_blank" rel="noopener" className="underline">términos y condiciones</a> y la{' '}
              <a href="/politica-de-privacidad" target="_blank" rel="noopener" className="underline">política de privacidad</a>.
            </span>
          </label>

          <button type="submit" disabled={!puedeEnviar}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'var(--brand-hex, #00B8D9)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear mi cuenta'}
          </button>

          {onLogout && (
            <button type="button" onClick={onLogout}
              className="w-full mt-3 py-2 text-xs font-medium" style={{ color: 'var(--text-secondary, #999)' }}>
              Cerrar sesión
            </button>
          )}
        </CardGlass>
      </form>
    </FondoConGlow>
  );
}
