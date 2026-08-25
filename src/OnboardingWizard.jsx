/**
 * OnboardingWizard — reemplaza el árbol condicional plano que Root.jsx tenía
 * para cuentas nuevas sin rol (ElegirRolScreen → RegistroUsuario/RegistroTienda
 * directo, sin indicador de progreso ni posibilidad de volver atrás, y sin
 * ninguna pantalla de cierre — el submit navegaba derecho al panel/Home).
 *
 * Pedido explícito: un wizard real con barra de progreso por segmentos (mismo
 * patrón que StoreRegisterFlow.jsx del proyecto LOKAL padre: cada segmento
 * ocupa flex-1/2/3 según sea futuro/pasado/actual), botón de retroceso entre
 * pasos, y una pantalla final de "¡Listo!" con feedback visual — todo con
 * state interno (`step`), sin rutas nuevas.
 *
 * ── Arquitectura de step ────────────────────────────────────────────────────
 * `step` es un STRING sobre un array de pasos (no un índice numérico): más
 * legible en el JSX condicional de abajo (`step === 'ubicacion'` en vez de
 * `step === 2`) y evita que insertar/quitar un paso corra los números de
 * todos los demás. Hay dos arrays de STEPS distintos porque usuario y tienda
 * son flujos de largo muy distinto (pedido explícito: usuario debe quedar
 * LIVIANO, sin ubicación de negocio ni foto):
 *
 *   STEPS_USUARIO = ['tipo', 'basicos', 'confirmacion']
 *   STEPS_TIENDA  = ['tipo', 'basicos', 'ubicacion', 'foto', 'confirmacion']
 *
 * 'tipo' es común a ambos (es la propia ElegirRolScreen, reusada tal cual) y
 * es el único paso donde el wizard todavía no sabe qué array de STEPS usar —
 * por eso currentSteps recién se resuelve DESPUÉS de que se elige tipo
 * ('tipo' siempre cuenta como el primer segmento de cualquiera de los dos).
 *
 * ── Dónde se crea la cuenta real ────────────────────────────────────────────
 * Usuario: el submit de 'basicos' YA hace el POST a /usuarios (igual que
 * RegistroUsuario.jsx hacía) y solo si sale bien avanza a 'confirmacion' —
 * llegar a esa pantalla YA significa que la cuenta existe, así que puede
 * mostrar datos reales (nombre) sin estados de carga/error propios.
 * Tienda: iguales características, el submit de 'basicos' ya NO crea nada
 * (antes lo hacía RegistroTienda.jsx completo) — ahora solo guarda
 * nombre/ciudad/whatsapp en el state del wizard y avanza a 'ubicacion'. El
 * POST real a tiendas-crud ocurre en el submit del paso 'foto' (el último
 * paso con datos, sea que el usuario suba una foto o la omita) porque recién
 * ahí están juntos TODOS los campos que el payload puede incluir (nombre,
 * ciudad, coords, whatsapp, foto opcional) — crear antes y hacer un PATCH
 * después funcionaría igual, pero un solo POST con el payload completo es
 * más simple y evita dos escrituras al backend por cada alta de tienda.
 */
import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { Loader2, AlertCircle, Check, ArrowLeft, Camera, X } from 'lucide-react';
import { apiFetch } from './api.js';
import { LogoFull } from './Brand';
import { REGISTRO_MODO } from './config/constants';
import { PlaceAutocomplete, MapPicker, uploadImagenTienda, reverseGeocode } from './storeFormUtils';
import { useGeolocation } from './hooks';

const ElegirRolScreen = lazy(() => import('./ElegirRolScreen'));

const API_BASE = '/.netlify/functions';

const STEPS_USUARIO = ['tipo', 'basicos', 'confirmacion'];
const STEPS_TIENDA  = ['tipo', 'basicos', 'ubicacion', 'foto', 'confirmacion'];

// ─── Fondo + card glass — MISMO bloque que RegistroTienda.jsx/RegistroUsuario.jsx/
// ElegirRolScreen.jsx (glow radial de marca + card con blur). Cuarta copia del
// mismo bloque chico; se mantiene la misma decisión ya tomada en esos archivos
// de no extraerlo a un componente compartido (cada pantalla podría divergir en
// layout de contenedor) — acá además centraliza TODOS los pasos del wizard, así
// que extraerlo tiene incluso menos beneficio: ya está en un único archivo.
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

// ─── Barra de progreso ──────────────────────────────────────────────────────
// Mismo patrón que ProgressBar de StoreRegisterFlow.jsx (LOKAL padre): cada
// segmento es un div flex, y el flex-grow decide su ancho relativo — pasado
// (flex-[2]) y actual (flex-[3]) más anchos que futuro (flex-1), así el
// segmento activo siempre se lee como "acá estás" sin necesitar texto ni
// número. `index` es el índice del paso ACTUAL dentro de `steps` (incluye
// 'tipo', que ya quedó atrás apenas se entra a cualquiera de los dos flujos).
function ProgressBar({ steps, index }) {
  return (
    <div className="flex gap-1.5 mb-6" aria-hidden="true">
      {steps.map((s, i) => (
        <div
          key={s}
          className="h-1 rounded-full transition-all duration-300"
          style={{
            background: i <= index ? 'var(--brand-hex, #00B8D9)' : 'rgb(var(--brand, 0 184 217) / 0.15)',
            flexGrow: i < index ? 2 : i === index ? 3 : 1,
            flexBasis: 0,
          }}
        />
      ))}
    </div>
  );
}

// Fila superior compartida por todos los pasos post-'tipo': flecha atrás +
// barra de progreso + logo chico — mismo lugar en todas las pantallas para
// que el wizard se sienta como una sola superficie continua, no pantallas
// sueltas concatenadas.
function WizardHeader({ steps, index, onBack, showBack = true }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      {showBack ? (
        <button type="button" onClick={onBack} className="shrink-0 p-1 -ml-1 rounded-full transition-colors" style={{ color: 'var(--text-secondary, #999)' }} aria-label="Volver">
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
      ) : <div className="w-6 shrink-0" />}
      <div className="flex-1"><ProgressBar steps={steps} index={index} /></div>
      <LogoFull size={18} />
    </div>
  );
}

const inputBase = {
  color: 'var(--text-primary)',
  background: 'rgb(var(--brand, 0 184 217) / 0.06)',
  borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
};

function TermsCheckbox({ checked, onChange }) {
  return (
    <label className="flex items-start gap-2.5 mb-5 cursor-pointer text-left">
      <span className="relative mt-0.5 w-[18px] h-[18px] shrink-0 rounded-md border flex items-center justify-center transition-colors" style={{
        borderColor: checked ? 'rgb(var(--brand, 0 184 217))' : 'rgb(var(--brand, 0 184 217) / 0.35)',
        background: checked ? 'rgb(var(--brand, 0 184 217))' : 'rgb(var(--brand, 0 184 217) / 0.06)',
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        {checked && <Check className="w-3 h-3 text-white pointer-events-none" strokeWidth={3} />}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-secondary, #999)' }}>
        Acepto los <a href="/terminos-y-condiciones" target="_blank" rel="noopener" className="underline">términos y condiciones</a> y la{' '}
        <a href="/politica-de-privacidad" target="_blank" rel="noopener" className="underline">política de privacidad</a>.
      </span>
    </label>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center gap-2 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-left">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── Paso 'basicos' — usuario ───────────────────────────────────────────────
// Mismo contenido que RegistroUsuario.jsx tenía (nombre + zona + términos),
// pero el submit ya crea la cuenta ACÁ (POST /usuarios) en vez de que lo haga
// un componente padre — así 'confirmacion' solo necesita mostrar el resultado,
// nunca dispara la creación por su cuenta.
function PasoBasicosUsuario({ firebaseUser, steps, index, onBack, onCreado, error, setError }) {
  const [nombre, setNombre] = useState(firebaseUser?.displayName || '');
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

  return (
    <form onSubmit={handleSubmit}>
      <WizardHeader steps={steps} index={index} onBack={onBack} />
      <h1 className="font-black mb-1" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)' }}>
        Creá tu cuenta
      </h1>
      <p className="mb-6" style={{ color: 'var(--text-secondary, #999)', fontSize: 'clamp(.875rem, 1vw, .9375rem)' }}>
        Completá estos datos para empezar a seguir tiendas y guardar favoritos.
      </p>

      <ErrorBanner message={error} />

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

      <TermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms} />

      <button type="submit" disabled={!puedeEnviar}
        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ background: 'var(--brand-hex, #00B8D9)' }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear mi cuenta'}
      </button>
    </form>
  );
}

// ─── Paso 'basicos' — tienda ────────────────────────────────────────────────
// Mismo contenido que RegistroTienda.jsx tenía, MENOS el bloque de MapPicker
// (movido a su propio paso 'ubicacion') — nombre del negocio, ciudad PERSONAL
// (con GPS) y WhatsApp. Ya no crea nada: junta datos en tiendaDraft y avanza.
function PasoBasicosTienda({ firebaseUser, steps, index, onBack, draft, onNext }) {
  const [nombre, setNombre] = useState(draft.nombre);
  const ciudadRef = useRef(null);
  const handleNombreEnter = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    e.currentTarget.blur();
    ciudadRef.current?.abrir();
  };
  const [ciudad, setCiudad] = useState(draft.ciudad);
  const [ciudadCoords, setCiudadCoords] = useState(draft.ciudadCoords);
  const [telefono, setTelefono] = useState(draft.telefono);

  const geo = useGeolocation();
  useEffect(() => {
    if (!geo.location) return;
    const { lat, lng } = geo.location;
    setCiudadCoords({ lat, lng });
    reverseGeocode(lat, lng)
      .then(({ ciudad: c }) => { if (c) setCiudad(c); })
      .catch(() => {});
  }, [geo.location]);

  const puedeAvanzar = nombre.trim().length >= 2;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!puedeAvanzar) return;
    onNext({ nombre: nombre.trim(), ciudad: ciudad.trim(), ciudadCoords, telefono: telefono.trim() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <WizardHeader steps={steps} index={index} onBack={onBack} />
      <h1 className="font-black mb-1" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)' }}>
        Creá tu tienda
      </h1>
      <p className="mb-6" style={{ color: 'var(--text-secondary, #999)', fontSize: 'clamp(.875rem, 1vw, .9375rem)' }}>
        Hola {firebaseUser.displayName?.split(' ')[0] || ''} — empecemos con lo básico.
      </p>

      <div className="space-y-3 mb-4 text-left">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary, #999)' }}>
            Nombre del negocio *
          </label>
          <input
            type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
            onKeyDown={handleNombreEnter}
            placeholder="Ej: Almacén Don José" required maxLength={120}
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium border outline-none transition-colors focus:border-brand"
            style={inputBase}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary, #999)' }}>
            Tu ciudad
          </label>
          <PlaceAutocomplete
            ref={ciudadRef}
            value={ciudad} onChange={setCiudad} onSelect={setCiudadCoords}
            placeholder="Ej: Bovril, Entre Ríos" labelParts={2}
            onUbicacion={() => geo.requestLocation()}
            ubicacionLoading={geo.loading}
            ubicacionError={geo.error}
          />
        </div>
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

      <button type="submit" disabled={!puedeAvanzar}
        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ background: 'var(--brand-hex, #00B8D9)' }}>
        Continuar
      </button>
    </form>
  );
}

// ─── Paso 'ubicacion' — tienda ──────────────────────────────────────────────
// El bloque de MapPicker que antes vivía mezclado en el mismo formulario que
// nombre/ciudad/WhatsApp — separado en su propio paso porque es un dato
// DISTINTO (ubicación pública del negocio, no de la persona) y competía
// visualmente con el resto del form. Mismas transiciones de entrada/salida
// que ya tenía (mapMounted/lastCoords), ahora ancladas a los coords que ya
// vinieron de 'basicos' (si el usuario ya usó GPS ahí) en vez de arrancar
// vacías — si ciudadCoords ya existe, el mapa aparece de entrada.
function PasoUbicacionTienda({ steps, index, onBack, draft, onNext, isDark }) {
  const [coords, setCoords] = useState(draft.ciudadCoords);
  const [mapMounted, setMapMounted] = useState(!!draft.ciudadCoords);
  const [lastCoords, setLastCoords] = useState(draft.ciudadCoords);

  useEffect(() => {
    if (coords) {
      setLastCoords(coords);
      setMapMounted(true);
      return undefined;
    }
    if (mapMounted) {
      const t = setTimeout(() => setMapMounted(false), 320);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [coords, mapMounted]);

  const geo = useGeolocation();
  useEffect(() => {
    if (!geo.location) return;
    setCoords({ lat: geo.location.lat, lng: geo.location.lng });
  }, [geo.location]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ ubicacionCoords: coords });
  };

  return (
    <form onSubmit={handleSubmit}>
      <WizardHeader steps={steps} index={index} onBack={onBack} />
      <h1 className="font-black mb-1" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)' }}>
        ¿Dónde está tu negocio?
      </h1>
      <p className="mb-6" style={{ color: 'var(--text-secondary, #999)', fontSize: 'clamp(.875rem, 1vw, .9375rem)' }}>
        Este pin es público — tus clientes lo van a ver en tu tienda.
      </p>

      <div className="mb-5 text-left">
        <button
          type="button"
          onClick={() => geo.requestLocation()}
          className="w-full mb-3 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] border"
          style={{ ...inputBase, color: 'var(--brand-hex, #00B8D9)' }}
        >
          {geo.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Usar mi ubicación actual
        </button>
        {geo.error && <p className="text-xs text-rose-500 mb-2">{geo.error}</p>}

        <div style={{
          overflow: 'hidden',
          maxHeight: coords ? 320 : 0,
          opacity: coords ? 1 : 0,
          transition: 'max-height .3s ease, opacity .25s ease',
        }}>
          {mapMounted && lastCoords && (
            <>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-secondary, #999)' }}>
                Arrastrá o tocá el mapa para ajustar
              </label>
              <MapPicker lat={lastCoords.lat} lng={lastCoords.lng} flyTo={lastCoords} onChange={setCoords} isDark={isDark} />
            </>
          )}
        </div>
        {!coords && (
          <p className="text-xs text-center py-8" style={{ color: 'var(--text-secondary, #999)' }}>
            Usá el botón de arriba, o segui al siguiente paso y lo completás después desde tu panel.
          </p>
        )}
      </div>

      <button type="submit"
        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        style={{ background: 'var(--brand-hex, #00B8D9)' }}>
        Continuar
      </button>
    </form>
  );
}

// ─── Paso 'foto' — tienda ───────────────────────────────────────────────────
// Nuevo, no existía en RegistroTienda.jsx. Sube con uploadImagenTienda (mismo
// helper que StoreApp.jsx usa para la foto de perfil, maxDim:640 — "la de
// perfil se recorta cuadrada y se ve chica, no necesita más de 640px", ver
// storeFormUtils.jsx). Salteable por pedido explícito: no bloquea la creación
// de la tienda, se puede completar después desde el panel (StoreApp.jsx ya
// tiene su propio editor de foto ahí).
function PasoFotoTienda({ steps, index, onBack, draft, onFinish, error, setError }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handlePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const finish = async (fotoUrl) => {
    setCreating(true);
    setError(null);
    try {
      const payload = {
        nombre: draft.nombre,
        rubros: ['ofertas'],
        ciudad: draft.ciudad,
        direccion: '',
        telefono: draft.telefono,
        lat: draft.ubicacionCoords?.lat ?? draft.ciudadCoords?.lat ?? null,
        lng: draft.ubicacionCoords?.lng ?? draft.ciudadCoords?.lng ?? null,
        foto: fotoUrl || null,
        googleUid: draft.firebaseUser.uid,
        ownerNombre: draft.firebaseUser.displayName || '',
        ownerEmail: draft.firebaseUser.email || '',
        termsAccepted: true,
        ...(draft.modoInvitacion ? { token: draft.token, sessionId: draft.sessionId } : { trial: true }),
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
      onFinish(data);
    } catch (err) {
      setError(err.message || 'No se pudo crear la tienda');
      setCreating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { finish(null); return; }
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImagenTienda(file, { maxDim: 640 });
      setUploading(false);
      await finish(url);
    } catch (err) {
      setError(err.message || 'No se pudo subir la foto');
      setUploading(false);
    }
  };

  const busy = uploading || creating;

  return (
    <form onSubmit={handleSubmit}>
      <WizardHeader steps={steps} index={index} onBack={onBack} />
      <h1 className="font-black mb-1" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)' }}>
        Ponele una foto a tu tienda
      </h1>
      <p className="mb-6" style={{ color: 'var(--text-secondary, #999)', fontSize: 'clamp(.875rem, 1vw, .9375rem)' }}>
        Tu logo o una foto del local — podés hacerlo después si preferís.
      </p>

      <ErrorBanner message={error} />

      <input ref={inputRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />

      <div className="mb-6 flex justify-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative rounded-full overflow-hidden transition-all active:scale-[0.98] flex items-center justify-center border"
          style={{ width: 128, height: 128, ...inputBase }}
        >
          {preview ? (
            <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-8 h-8" style={{ color: 'var(--brand-hex, #00B8D9)' }} />
          )}
          {preview && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); URL.revokeObjectURL(preview); setPreview(null); setFile(null); }}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </span>
          )}
        </button>
      </div>

      <button type="submit" disabled={busy}
        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ background: 'var(--brand-hex, #00B8D9)' }}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (file ? 'Continuar' : 'Crear mi tienda')}
      </button>

      {file && !busy && (
        <button type="button" onClick={() => finish(null)}
          className="w-full mt-3 py-2 text-xs font-medium" style={{ color: 'var(--text-secondary, #999)' }}>
          Omitir por ahora
        </button>
      )}
    </form>
  );
}

// ─── Paso 'confirmacion' ────────────────────────────────────────────────────
// "¡Listo!" — inspirado en SuccessStep de OnboardingFlow.jsx (LOKAL padre):
// círculo con gradiente de marca + check grande, mensaje de bienvenida con el
// nombre real. A esta altura la cuenta YA existe (usuario: POST ya corrió en
// 'basicos'; tienda: POST ya corrió en 'foto') — nunca dispara nada por su
// cuenta, solo celebra y ofrece los CTAs finales.
// CTAs por pedido explícito: usuario ve un único botón ("Ir al inicio");
// tienda ve dos (primario "Ir al panel de administración", secundario "Ir al
// inicio") — no el trofeo/XP de Mi Bovril, que es de un sistema gamificado
// que LOKAL LINKS no tiene.
function PasoConfirmacion({ tipo, nombre, onIrAMiTienda, onIrAlHome }) {
  return (
    <div>
      <div className="mb-6 flex justify-center">
        <LogoFull size={28} />
      </div>
      <div
        className="mx-auto mb-5 rounded-full flex items-center justify-center shadow-lg"
        style={{
          width: 84, height: 84,
          background: 'linear-gradient(135deg, var(--brand-hex, #00B8D9), rgb(var(--brand, 0 184 217) / 0.6))',
          boxShadow: '0 12px 32px -8px rgb(var(--brand, 0 184 217) / 0.5)',
        }}
      >
        <Check size={40} className="text-white" strokeWidth={3} />
      </div>
      <h1 className="font-black mb-1.5" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)' }}>
        ¡Listo{nombre ? `, ${nombre.split(' ')[0]}` : ''}!
      </h1>
      <p className="mb-8" style={{ color: 'var(--text-secondary, #999)', fontSize: 'clamp(.875rem, 1vw, .9375rem)' }}>
        {tipo === 'tienda'
          ? 'Tu tienda ya está creada. Entrá a tu panel para cargar tus primeras ofertas.'
          : 'Tu cuenta ya está lista para seguir tiendas y guardar favoritos.'}
      </p>

      {tipo === 'tienda' ? (
        <>
          <button onClick={onIrAMiTienda}
            className="w-full mb-3 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: 'var(--brand-hex, #00B8D9)' }}>
            Ir al panel de administración
          </button>
          <button onClick={onIrAlHome}
            className="w-full py-3 text-xs font-bold" style={{ color: 'var(--text-secondary, #999)' }}>
            Ir al inicio
          </button>
        </>
      ) : (
        <button onClick={onIrAlHome}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: 'var(--brand-hex, #00B8D9)' }}>
          Ir al inicio
        </button>
      )}
    </div>
  );
}

function getInviteToken() {
  return new URLSearchParams(window.location.search).get('token') || '';
}

function getSessionId() {
  const KEY = 'lokal-invite-session';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export default function OnboardingWizard({ firebaseUser, isDark = true, onCreada, onCreado, onLogout, onIrAlPanelAdmin, onIrAlHome, onIrAMiTienda }) {
  // 'tipo' | 'basicos' | 'ubicacion' | 'foto' | 'confirmacion'. Arranca en
  // 'tipo' siempre — el paso de elegir método de login (Google/Apple/Email/ID
  // Lokal) ya pasó ANTES de montar este wizard (Root.jsx solo lo monta cuando
  // whoami ya dijo {rol:null, nuevo:true}).
  const [step, setStep] = useState('tipo');
  // 'usuario' | 'tienda' | null — se fija apenas se elige en el paso 'tipo' y
  // decide qué array de STEPS se usa de ahí en adelante.
  const [tipo, setTipo] = useState(null);
  const [error, setError] = useState(null);
  // Acumula los datos que van completando los pasos de tienda a medida que
  // se avanza — cada paso solo lee/escribe sus propios campos, el submit
  // final (PasoFotoTienda) es el único que arma el payload completo.
  const [tiendaDraft, setTiendaDraft] = useState({ nombre: '', ciudad: '', ciudadCoords: null, telefono: '', ubicacionCoords: null });
  const [resultado, setResultado] = useState(null); // lo que devolvió el POST (usuario o tienda), para la pantalla de confirmación

  // Invite token — MISMO gate que RegistroTienda.jsx tenía: validación ANTES
  // de siquiera empezar el wizard de tienda, no un paso del wizard en sí.
  // Portado tal cual (checking/valid/invalid), solo se dispara al entrar a
  // 'basicos' de tienda por primera vez (no tiene sentido chequear el link
  // mientras todavía se está eligiendo 'tipo').
  const modoInvitacion = REGISTRO_MODO === 'invitacion';
  const token = useRef(modoInvitacion ? getInviteToken() : null).current;
  const sessionId = useRef(modoInvitacion ? getSessionId() : null).current;
  const [inviteState, setInviteState] = useState(modoInvitacion ? 'checking' : 'valid');

  useEffect(() => {
    if (tipo !== 'tienda' || !modoInvitacion || inviteState !== 'checking') return;
    let mounted = true;
    if (!token) { setInviteState('invalid'); setError('Falta el link de invitación. Pedile uno al administrador.'); return undefined; }
    fetch(`${API_BASE}/invites?token=${encodeURIComponent(token)}&sessionId=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok) { setInviteState('invalid'); setError(data.error || 'Link de invitación inválido.'); return; }
        setInviteState('valid');
      })
      .catch(() => { if (mounted) { setInviteState('invalid'); setError('No se pudo verificar el link. Probá de nuevo.'); } });
    return () => { mounted = false; };
  }, [tipo, modoInvitacion, inviteState, token, sessionId]);

  const steps = tipo === 'tienda' ? STEPS_TIENDA : STEPS_USUARIO;
  const stepIndex = steps.indexOf(step);

  // ── Botón "atrás" nativo (Android/gesto o el del navegador) ──────────────
  // El wizard vive en un único pathname fijo (/admin), sin rutas propias por
  // paso — su `step` es un useState puramente local. Sin ayuda, el botón
  // atrás nativo no tiene ninguna entrada de history que "deshacer" DENTRO
  // del wizard, así que el navegador salta derecho a la entrada anterior
  // REAL (probablemente afuera de /admin) en vez de retroceder un paso.
  //
  // Solución: cada avance de paso empuja una entrada de history con el
  // MISMO pathname (sin agregar nada a la URL visible) — el history stack
  // del navegador pasa a duplicar la pila de "niveles" del wizard. Cada
  // popstate (atrás nativo) entonces dispara goBack(), la MISMA función que
  // ya usa el botón de retroceso en pantalla — un solo lugar de verdad.
  const pushWizardLevel = () => {
    window.history.pushState({}, '', window.location.pathname);
  };

  // useCallback (no una función inline) porque el useEffect del popstate de
  // abajo depende de esta identidad: sin memoizar, goBack cambiaría en CADA
  // render (steps es un array nuevo cada vez) y el listener se re-registraría
  // sin necesidad en cada render en vez de solo cuando step realmente cambia.
  const goBack = useCallback(() => {
    setError(null);
    const i = steps.indexOf(step);
    if (i <= 0) { setStep('tipo'); setTipo(null); return; }
    setStep(steps[i - 1]);
  }, [step, steps]);

  // avanzar(): único punto que mueve `step` hacia ADELANTE — además de
  // setStep, empuja el nivel de history del punto anterior. Todo avance de
  // paso pasa por acá (ver los onNext/onCreado/onFinish de cada paso más
  // abajo) para que la pila de history nunca se desincronice del step real.
  const avanzar = (nuevoStep) => {
    pushWizardLevel();
    setStep(nuevoStep);
  };

  // El paso 'tipo' es el piso del wizard: si el popstate ocurre ahí, NO se
  // hace nada especial — se deja que el listener global de Root.jsx (el que
  // ya maneja navegación real entre /, /admin, etc.) resuelva la salida,
  // exactamente como ya hace hoy sin este wizard de por medio. Los dos
  // listeners de 'popstate' en window coexisten sin conflicto: este nunca
  // toca el pathname real, solo re-empuja el mismo, así que Root.jsx sigue
  // viendo la URL que espera.
  useEffect(() => {
    const handlePopState = () => {
      if (step === 'tipo') return;
      goBack();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [step, goBack]);

  const irAlHome = onIrAlHome || (() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); });
  const irAMiTienda = onIrAMiTienda || (() => { window.history.pushState({}, '', '/admin'); window.dispatchEvent(new PopStateEvent('popstate')); });

  // ── Paso 'tipo' ────────────────────────────────────────────────────────
  if (step === 'tipo') {
    return (
      <FondoConGlow isDark={isDark}>
        <CardGlass isDark={isDark}>
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>}>
            <ElegirRolScreen
              firebaseUser={firebaseUser}
              isDark={isDark}
              onElegirUsuario={() => { setTipo('usuario'); avanzar('basicos'); }}
              onElegirTienda={() => { setTipo('tienda'); avanzar('basicos'); }}
              onLogout={onLogout}
            />
          </Suspense>
        </CardGlass>
      </FondoConGlow>
    );
  }

  // ── Gate de invitación (solo tienda, antes de 'basicos') ─────────────────
  if (tipo === 'tienda' && inviteState !== 'valid') {
    if (inviteState === 'checking') {
      return (
        <FondoConGlow isDark={isDark}>
          <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
        </FondoConGlow>
      );
    }
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

  // ── Paso 'confirmacion' ───────────────────────────────────────────────────
  if (step === 'confirmacion') {
    return (
      <FondoConGlow isDark={isDark}>
        <CardGlass isDark={isDark}>
          <PasoConfirmacion
            tipo={tipo}
            nombre={resultado?.nombre}
            onIrAMiTienda={irAMiTienda}
            onIrAlHome={irAlHome}
          />
        </CardGlass>
      </FondoConGlow>
    );
  }

  // ── Resto de los pasos (usuario: 'basicos'; tienda: 'basicos'/'ubicacion'/'foto') ─
  return (
    <FondoConGlow isDark={isDark}>
      <CardGlass isDark={isDark}>
        {tipo === 'usuario' && step === 'basicos' && (
          <PasoBasicosUsuario
            firebaseUser={firebaseUser}
            steps={steps}
            index={stepIndex}
            onBack={goBack}
            error={error}
            setError={setError}
            onCreado={(usuario) => {
              setResultado(usuario);
              avanzar('confirmacion');
              // Notificar a Root.jsx YA (no recién al tocar "Ir al inicio"):
              // así usuarioData queda seteado apenas la cuenta existe, mismo
              // contrato que RegistroUsuario.jsx tenía con su onCreado.
              onCreado(usuario);
            }}
          />
        )}

        {tipo === 'tienda' && step === 'basicos' && (
          <PasoBasicosTienda
            firebaseUser={firebaseUser}
            steps={steps}
            index={stepIndex}
            onBack={goBack}
            draft={tiendaDraft}
            onNext={(datos) => { setTiendaDraft((d) => ({ ...d, ...datos })); avanzar('ubicacion'); }}
          />
        )}

        {tipo === 'tienda' && step === 'ubicacion' && (
          <PasoUbicacionTienda
            steps={steps}
            index={stepIndex}
            onBack={goBack}
            draft={tiendaDraft}
            isDark={isDark}
            onNext={(datos) => { setTiendaDraft((d) => ({ ...d, ...datos })); avanzar('foto'); }}
          />
        )}

        {tipo === 'tienda' && step === 'foto' && (
          <PasoFotoTienda
            steps={steps}
            index={stepIndex}
            onBack={goBack}
            error={error}
            setError={setError}
            draft={{ ...tiendaDraft, firebaseUser, modoInvitacion, token, sessionId }}
            onFinish={(tienda) => {
              setResultado(tienda);
              avanzar('confirmacion');
              // Mismo contrato que RegistroTienda.jsx tenía con onCreada —
              // Root.jsx hace setTiendaData(tienda) con esto.
              onCreada(tienda);
            }}
          />
        )}
      </CardGlass>
    </FondoConGlow>
  );
}
