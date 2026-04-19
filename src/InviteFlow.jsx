import React, { useState, useEffect, useRef } from 'react';
import {
  Store, MapPin, Clock, Phone, Camera, CheckCircle,
  ArrowLeft, ArrowRight, Loader2, AlertCircle, X, Mail
} from 'lucide-react';
import { signInWithGoogle } from './firebase';

const API_BASE = '/.netlify/functions';

const RUBROS = [
  'Electronica', 'Computacion', 'Ferreteria', 'Construccion',
  'Hogar', 'Ropa', 'Calzado', 'Deportes', 'Alimentacion',
  'Farmacia', 'Libreria', 'Jugueteria', 'Automotor', 'Otro',
];

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

// Pasos sin 'register' — Google lo reemplaza
const STEPS = ['google', 'basic', 'location', 'hours', 'contact'];

function ProgressBar({ step }) {
  const idx = STEPS.indexOf(step);
  const pct = idx <= 0 ? 0 : Math.round((idx / (STEPS.length - 1)) * 100);
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6">
      <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function InviteFlow({ token, firebaseUser, onComplete, onCancel }) {
  const [step, setStep]           = useState('validating');
  const [error, setError]         = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // sessionId unico por pestaña — clave para la seguridad del claim
  const sessionId = useRef(null);
  useEffect(() => {
    const stored = sessionStorage.getItem('lokal_invite_session');
    if (stored) { sessionId.current = stored; return; }
    const id = crypto.randomUUID?.() ?? (Math.random().toString(36).slice(2) + Date.now());
    sessionStorage.setItem('lokal_invite_session', id);
    sessionId.current = id;
  }, []);

  // Form state — datos de la tienda
  const [nombreTienda, setNombreTienda] = useState('');
  const [rubros,       setRubros]       = useState([]);
  const [descripcion,  setDescripcion]  = useState('');
  const [direccion,    setDireccion]    = useState('');
  const [ciudad,       setCiudad]       = useState('');
  const [telefono,     setTelefono]     = useState('');
  const [emailContacto, setEmailContacto] = useState('');
  const [website,      setWebsite]      = useState('');
  const [horarios, setHorarios] = useState({
    Lunes:     { abierto: true,  desde: '09:00', hasta: '19:00' },
    Martes:    { abierto: true,  desde: '09:00', hasta: '19:00' },
    Miercoles: { abierto: true,  desde: '09:00', hasta: '19:00' },
    Jueves:    { abierto: true,  desde: '09:00', hasta: '19:00' },
    Viernes:   { abierto: true,  desde: '09:00', hasta: '19:00' },
    Sabado:    { abierto: true,  desde: '09:00', hasta: '13:00' },
    Domingo:   { abierto: false, desde: '09:00', hasta: '13:00' },
  });
  const [fotoFile,    setFotoFile]    = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const fileRef = useRef(null);

  // Validar token al montar (y cuando sessionId esté listo)
  useEffect(() => {
    if (sessionId.current) validateToken();
  }, [token]);

  const validateToken = async () => {
    setStep('validating');
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/invites?token=${encodeURIComponent(token)}&sessionId=${encodeURIComponent(sessionId.current)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Link invalido');
      // Si ya esta logueado con Google, saltar el paso de sign-in
      setStep(firebaseUser ? 'basic' : 'google');
    } catch (err) {
      setError(err.message);
      setStep('invalid');
    }
  };

  // Cuando el usuario completa Google sign-in en otro paso, avanzar
  useEffect(() => {
    if (firebaseUser && step === 'google') setStep('basic');
  }, [firebaseUser]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      // signInWithGoogle devuelve null en mobile (usa redirect)
      // El onAuthStateChanged en Root.jsx setea firebaseUser → useEffect arriba avanza el step
      await signInWithGoogle();
    } catch (err) {
      setError(err.code === 'auth/popup-closed-by-user'
        ? 'Cerraste la ventana de Google. Intenta de nuevo.'
        : err.message
      );
    } finally {
      setSigningIn(false);
    }
  };

  const toggleRubro = (r) =>
    setRubros(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFinish = async () => {
    if (!firebaseUser) { setError('Debes iniciar sesion con Google primero'); return; }
    setSubmitting(true);
    setError(null);
    try {
      let fotoUrl = null;
      if (fotoFile) {
        const base64 = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result.split(',')[1]);
          r.onerror = rej;
          r.readAsDataURL(fotoFile);
        });
        const up = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: fotoFile.name, fileData: base64, contentType: fotoFile.type }),
        });
        if (up.ok) fotoUrl = (await up.json()).url;
      }

      const res = await fetch(`${API_BASE}/tiendas-crud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          sessionId: sessionId.current,
          googleUid:    firebaseUser.uid,
          ownerNombre:  firebaseUser.displayName || '',
          ownerEmail:   firebaseUser.email || '',
          ownerFoto:    firebaseUser.photoURL || null,
          nombre:       nombreTienda,
          rubros,
          descripcion,
          direccion,
          ciudad,
          horarios,
          telefono,
          emailContacto,  // email publico de la tienda (puede diferir del de Google)
          website,
          foto: fotoUrl,
        }),
      });

      const tienda = await res.json();
      if (!res.ok) throw new Error(tienda.error || 'Error al crear la tienda');
      sessionStorage.removeItem('lokal_invite_session');
      onComplete(tienda);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Header compartido ───────────────────────────────────────────────────────
  const Header = ({ title }) => (
    <div className="bg-white border-b-2 border-slate-100 p-5">
      <div className="max-w-lg mx-auto flex items-center gap-4">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Registro de tienda</p>
          <h1 className="font-bold text-slate-900">{title}</h1>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </div>
  );

  // ── Layout wrapper ──────────────────────────────────────────────────────────
  const Layout = ({ title, subtitle, children, onNext, onBack, nextLabel = 'Continuar', nextDisabled = false }) => (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title={title} />
      <div className="flex-1 flex items-start justify-center p-5 pt-8">
        <div className="w-full max-w-lg">
          <ProgressBar step={step} />
          {subtitle && <p className="text-slate-500 text-sm mb-6">{subtitle}</p>}
          <div className="space-y-4">{children}</div>

          {error && (
            <div className="mt-4 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className={`flex gap-3 mt-8 ${onBack ? 'justify-between' : 'justify-end'}`}>
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-2 px-5 py-3 bg-slate-100 rounded-2xl font-semibold hover:bg-slate-200 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Atras
              </button>
            )}
            {onNext && (
              <button onClick={onNext} disabled={nextDisabled || submitting}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold disabled:opacity-40 hover:bg-slate-800 transition-colors ml-auto">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {nextLabel}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Pantallas ───────────────────────────────────────────────────────────────

  if (step === 'validating') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-3" />
        <p className="font-semibold text-slate-600">Verificando invitacion...</p>
      </div>
    </div>
  );

  if (step === 'invalid') return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Link invalido" />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Link invalido o expirado</h2>
          <p className="text-slate-500 text-sm mb-6">{error || 'Este link no existe, ya fue utilizado, o expiro.'}</p>
          <button onClick={onCancel} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors">
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );

  // Paso: Google sign-in
  if (step === 'google') return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="Conecta tu cuenta" />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <ProgressBar step={step} />
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Registra tu tienda</h2>
            <p className="text-slate-500 text-sm">
              Usa tu cuenta de Google para identificarte. Es rapido, seguro, y no necesitas recordar ninguna contraseña.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <button onClick={handleGoogleSignIn} disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold hover:border-slate-300 hover:shadow-md transition-all disabled:opacity-50">
            {signingIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {signingIn ? 'Conectando...' : 'Continuar con Google'}
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            Al continuar aceptás los{' '}
            <a href="/terminos-y-condiciones" className="underline hover:text-white transition-colors">Términos y Condiciones</a>
            {' '}y las{' '}
            <a href="/condiciones-para-comercios" className="underline hover:text-white transition-colors">Condiciones para Comercios</a>
            {' '}de Lokal.
          </p>
        </div>
      </div>
    </div>
  );

  // Paso: Info basica
  if (step === 'basic') return (
    <Layout title="Tu tienda" subtitle="Nombre y rubros que maneja tu local."
      onBack={() => setStep('google')}
      onNext={() => setStep('location')}
      nextDisabled={!nombreTienda.trim() || rubros.length === 0}>
      {/* Cuenta Google conectada */}
      {firebaseUser && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
          {firebaseUser.photoURL
            ? <img src={firebaseUser.photoURL} alt="" className="w-9 h-9 rounded-full" />
            : <div className="w-9 h-9 bg-emerald-200 rounded-full flex items-center justify-center text-lg">👤</div>
          }
          <div>
            <p className="font-semibold text-sm">{firebaseUser.displayName}</p>
            <p className="text-xs text-slate-500">{firebaseUser.email}</p>
          </div>
          <CheckCircle className="w-4 h-4 text-emerald-600 ml-auto" />
        </div>
      )}
      <div>
        <label className="block font-bold text-sm mb-2">Nombre de la tienda *</label>
        <input type="text" value={nombreTienda} onChange={e => setNombreTienda(e.target.value)}
          placeholder="Ej: TecnoStore"
          className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-400 transition-colors" />
      </div>
      <div>
        <label className="block font-bold text-sm mb-2">Rubros * <span className="font-normal text-slate-400">(todos los que apliquen)</span></label>
        <div className="flex flex-wrap gap-2">
          {RUBROS.map(r => (
            <button key={r} type="button" onClick={() => toggleRubro(r)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm border-2 transition-all ${rubros.includes(r) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block font-bold text-sm mb-2">Descripcion <span className="font-normal text-slate-400">(opcional)</span></label>
        <textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)}
          placeholder="Que ofrece tu tienda, productos destacados, etc."
          className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-400 resize-none transition-colors" />
      </div>
    </Layout>
  );

  // Paso: Ubicacion
  if (step === 'location') return (
    <Layout title="Ubicacion" subtitle="Donde esta tu local."
      onBack={() => setStep('basic')}
      onNext={() => setStep('hours')}
      nextDisabled={!direccion.trim() || !ciudad.trim()}>
      <div>
        <label className="block font-bold text-sm mb-2">Direccion *</label>
        <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)}
          placeholder="Ej: Av. San Martin 1234"
          className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-400 transition-colors" />
      </div>
      <div>
        <label className="block font-bold text-sm mb-2">Ciudad / Localidad *</label>
        <input type="text" value={ciudad} onChange={e => setCiudad(e.target.value)}
          placeholder="Ej: Bovril"
          className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-400 transition-colors" />
      </div>
      <div className="flex gap-3 p-4 bg-slate-50 rounded-2xl">
        <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-500">La ubicacion exacta en el mapa se configura desde tu perfil una vez registrado.</p>
      </div>
    </Layout>
  );

  // Paso: Horarios
  if (step === 'hours') return (
    <Layout title="Horarios" subtitle="Cuando atiende tu tienda."
      onBack={() => setStep('location')}
      onNext={() => setStep('contact')}>
      <div className="space-y-2">
        {DIAS.map(dia => (
          <div key={dia} className={`rounded-2xl border-2 p-4 transition-colors ${horarios[dia].abierto ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{dia}</span>
              <button type="button" onClick={() =>
                setHorarios(p => ({ ...p, [dia]: { ...p[dia], abierto: !p[dia].abierto } }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${horarios[dia].abierto ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${horarios[dia].abierto ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            {horarios[dia].abierto ? (
              <div className="flex gap-3">
                {['desde', 'hasta'].map(campo => (
                  <div key={campo} className="flex-1">
                    <p className="text-xs text-slate-400 mb-1 capitalize">{campo}</p>
                    <input type="time" value={horarios[dia][campo]}
                      onChange={e => setHorarios(p => ({ ...p, [dia]: { ...p[dia], [campo]: e.target.value } }))}
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Cerrado</p>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );

  // Paso: Contacto + foto
  if (step === 'contact') return (
    <Layout title="Contacto y foto"
      subtitle="Como te contactan los clientes. La foto podes agregarla despues."
      onBack={() => setStep('hours')}
      onNext={handleFinish}
      nextLabel="Finalizar registro"
      nextDisabled={!telefono.trim()}>
      <div>
        <label className="block font-bold text-sm mb-2">Telefono / WhatsApp *</label>
        <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
          placeholder="Ej: 3456001234"
          className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-400 transition-colors" />
      </div>
      <div>
        <label className="block font-bold text-sm mb-2">
          Email de contacto de la tienda
          <span className="font-normal text-slate-400 ml-1">(opcional — puede ser distinto al de tu cuenta Google)</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="email" value={emailContacto} onChange={e => setEmailContacto(e.target.value)}
            placeholder={firebaseUser?.email || 'tienda@ejemplo.com'}
            className="w-full pl-11 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-400 transition-colors" />
        </div>
      </div>
      <div>
        <label className="block font-bold text-sm mb-2">Sitio web <span className="font-normal text-slate-400">(opcional)</span></label>
        <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
          placeholder="https://mitienda.com"
          className="w-full px-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-400 transition-colors" />
      </div>
      <div>
        <label className="block font-bold text-sm mb-2">Foto del local <span className="font-normal text-slate-400">(opcional)</span></label>
        <div onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center bg-white hover:bg-slate-50 cursor-pointer transition-colors hover:border-emerald-400">
          {fotoPreview
            ? <img src={fotoPreview} alt="" className="w-24 h-24 object-cover rounded-2xl mx-auto mb-2" />
            : <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          }
          <p className="text-sm font-semibold text-slate-400">{fotoPreview ? 'Cambiar foto' : 'Subir foto del local'}</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
      </div>
    </Layout>
  );

  return null;
}
