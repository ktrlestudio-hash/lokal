// LoginCard — el contenido REAL de la card de login/registro (logo,
// ilustración de ciudad, jerarquía ID-Lokal → Google/Apple → email, legal),
// extraído de AdminLogin.jsx para que un mismo diseño ya pulido sirva en
// los DOS lugares donde hace falta iniciar sesión: la pantalla completa de
// /admin (AdminLogin.jsx, sigue existiendo tal cual para quien llega ahí
// directo, ej. bookmark) y el sheet/modal que se abre desde el avatar de
// HomeGlobal (LoginSheet.jsx) — antes ese sheet tenía un diseño propio
// genérico, sin la ilustración ni el resto de la identidad visual ya
// resuelta acá. Un solo diseño, dos contenedores.
//
// Suma el paso 2 (elegir "cuenta de usuario" o "crear tienda") que
// AdminLogin nunca necesitó — ahí SIEMPRE se sabe que la intención es
// "tienda" (es la URL /admin). LoginCard sí lo necesita porque el mismo
// botón de Google en HomeGlobal puede terminar en cualquiera de los tres
// destinos (ver LoginSheet.jsx).
//
// ── Rediseño de jerarquía (2026-08) ─────────────────────────────────────
// Antes esto era "un botón de Google solo". El pedido fue replantear TODA
// la jerarquía: un usuario nuevo vs. uno existente tienen que entender en
// 1-2 segundos qué botón les corresponde, y Google no puede ser el único
// CTA (no todos tienen cuenta de Google, y hay que dejar lugar a un futuro
// ID de Lokal + contraseña como método PRINCIPAL).
//
// Lo que este archivo resuelve hoy, y lo que deja preparado sin construir:
//   - ID de Lokal + contraseña: la UI completa (inputs, validación de
//     formato en el cliente, chequeo de disponibilidad) YA está acá, pero
//     el submit no pega contra ningún backend real — no existe todavía
//     tabla de usuarios con contraseña ni hashing. Toca ese botón y ves un
//     mensaje claro de "todavía no", nunca un error confuso ni un login
//     simulado. Ver simularDisponibilidadId() más abajo: el único lugar
//     donde se podría enchufar un endpoint real de disponibilidad el día
//     que exista, sin tocar el resto del componente.
//   - Google: sigue siendo el mismo mecanismo GIS/FedCM maduro de
//     useBotonGoogleGIS (con su fallback a popup) — NO se tocó su lógica
//     interna, solo el lugar que ocupa en la jerarquía visual.
//   - Apple: botón con tratamiento de marca real, pero deshabilitado con
//     mensaje "Próximamente" — no hay cuenta de Apple Developer todavía
//     (ver ProximamenteModal, mismo patrón que ya usa el resto de la app
//     para funciones visibles-pero-no-listas).
//   - Email Magic Link: es el único método nuevo 100% funcional — pega
//     contra Firebase de verdad (enviarLinkDeAcceso en firebase.js).
//   - Teléfono/WhatsApp: ni siquiera aparece en esta versión (pedido
//     explícito: no debe ser protagonista, y esta pasada no lo construye).
import React, { useState } from 'react';
import { Loader2, AlertCircle, Store, UserRound, HelpCircle, ArrowRight, Check, X as XIcon, Mail, Lock, AtSign, Sparkles } from 'lucide-react';
import CiudadIlustrada from './CiudadIlustrada';
import ProximamenteModal from './ProximamenteModal';
import { signInWithGoogle, auth, enviarLinkDeAcceso } from '../firebase';
import { apiFetch } from '../api';
import { API_BASE } from '../config/flags';
import { KtrlMark } from '../Brand';
import { useBotonGoogleGIS } from '../hooks/useBotonGoogleGIS.js';

// 400 = el máximo que Google Identity Services acepta en `width` (doc
// oficial de renderButton) — no hay forma de pedirle un iframe más ancho,
// así que este es el techo real de la zona clickeable horizontal.
const GOOGLE_BTN_W = 400;

const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Glifo oficial de Apple — un solo trazo, hereda `currentColor` (así se
// invierte solo entre el botón claro/oscuro, igual que el resto de íconos
// lucide de este archivo, sin necesitar una variante de color aparte).
const AppleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.365 1.43c0 1.14-.415 2.06-1.245 2.78-.83.72-1.83 1.14-2.995 1.05-.05-1.1.415-2.13 1.245-2.9.83-.79 1.865-1.24 3.005-1.31-.005.06-.01.25-.01.38zm4.02 16.5c-.585 1.34-1.29 2.63-2.115 3.87-1.135 1.71-2.315 3.42-4.155 3.45-1.815.03-2.4-1.07-4.475-1.07-2.075 0-2.72 1.04-4.44 1.1-1.775.06-3.13-1.83-4.27-3.53C-.985 18.02-1.98 12.53.755 8.86c1.36-1.82 3.78-2.98 6.185-3.02 1.79-.03 3.48 1.2 4.575 1.2 1.09 0 3.135-1.49 5.29-1.27.9.04 3.43.36 5.055 2.74-.13.08-3.02 1.76-2.99 5.26.035 4.18 3.68 5.58 3.72 5.6-.03.09-.585 2-1.935 3.96l.28-.4z"/>
  </svg>
);

// Contraseña visible/oculta — mismo par lucide que el resto de la app usa
// para toggles de este tipo.
import { Eye, EyeOff } from 'lucide-react';

// ─── Validación de formato del ID de Lokal (solo del lado del cliente) ───
// Reglas: minúsculas, números y guión bajo; entre 3 y 20 caracteres;
// arranca con una letra (no un número o "_", para que siempre se lea como
// un nombre). Esto es SOLO formato — no confirma disponibilidad real, eso
// necesitaría un backend que hoy no existe (ver simularDisponibilidadId).
const ID_LOKAL_REGEX = /^[a-z][a-z0-9_]{2,19}$/;

function validarFormatoId(valor) {
  if (!valor) return null; // sin tocar todavía, no mostrar error
  if (valor.length < 3) return 'Muy corto — mínimo 3 caracteres.';
  if (valor.length > 20) return 'Muy largo — máximo 20 caracteres.';
  if (!/^[a-z]/.test(valor)) return 'Tiene que empezar con una letra.';
  if (!ID_LOKAL_REGEX.test(valor)) return 'Solo minúsculas, números y guión bajo.';
  return null;
}

// Disponibilidad SIMULADA — no hay endpoint real de "¿está libre este ID?"
// todavía (necesitaría una tabla de usuarios con ID único, que tampoco
// existe). Esta función es la ÚNICA pieza a reemplazar el día que ese
// backend exista: cambiar el cuerpo por un GET real a
// `${API_BASE}/usuarios?checkId=...` y todo lo demás (debounce, estados
// visuales ✓/✕, alternativas sugeridas) sigue funcionando igual.
//
// Determinístico por texto (no random): así un mismo ID muestra siempre el
// mismo resultado durante toda la sesión de prueba, en vez de parpadear
// entre disponible/ocupado en cada tecla — más creíble como demo de la UI.
function simularDisponibilidadId(id) {
  const ocupados = new Set(['admin', 'lokal', 'katriel', 'test', 'usuario', 'tienda', 'root']);
  return !ocupados.has(id);
}

function sugerirAlternativas(id) {
  return [`${id}${Math.floor(Math.random() * 90 + 10)}`, `${id}_ok`, `el_${id}`];
}

/**
 * @param {boolean} isDark
 * @param {boolean} whoami - si true, tras el login llama a GET /usuarios?whoami=1
 *   y decide el destino (tienda/usuario/nuevo). Si false (AdminLogin), el
 *   login simplemente resuelve — Root.jsx toma el control después, como
 *   siempre.
 * @param {() => void} onEsTienda
 * @param {(usuario) => void} onEsUsuario
 * @param {() => void} [onNuevo] - cuenta sin tienda ni perfil todavía
 *   (whoami devolvió {rol:null, nuevo:true}). Si se pasa, reemplaza el paso
 *   interno 'elegir-rol' (dos botones chicos en este mismo panel) por una
 *   navegación hacia afuera — hoy lo usa LoginSheet.jsx para llevar a la
 *   pantalla completa ElegirRolScreen.jsx (ver Root.jsx), que es donde vive
 *   ahora el pulido "a pantalla completa" que pidió el dueño del producto.
 *   Si NO se pasa (AdminLogin no lo necesita: whoami=false ahí, nunca
 *   llega a este branch), se mantiene el paso interno de siempre como
 *   fallback — ningún caller queda roto por no migrar.
 * @param {string} titulo
 * @param {string} subtitulo
 * @param {number} ilustracionAltura
 * @param {boolean} mostrarQueEsLokal - card "¿Qué es LOKAL?" que navega a
 *   /vender#quienes-somos, portada del LoginBottomSheet.jsx de LOKAL Global.
 *   Solo tiene sentido en un sheet que interrumpe la navegación de alguien
 *   que puede no conocer el producto (HomeGlobal) — AdminLogin es una
 *   pantalla propia de /admin, no hace falta "explicar qué es LOKAL" ahí.
 * @param {boolean} mostrarIlustracion - la ciudad de CiudadIlustrada.jsx.
 *   Default true (AdminLogin la sigue mostrando tal cual) — se puede
 *   ocultar en contextos más compactos (ej. el sheet de HomeGlobal) sin
 *   sacar el componente, para reusarla en otro lado más adelante.
 * @param {number} mountDelayMs - retraso antes de pedirle el botón real a
 *   Google — 0 en AdminLogin (pantalla completa, sin animación de entrada),
 *   > 0 en LoginSheet (sheet con transform entrando, ver ese componente).
 */
export default function LoginCard({
  isDark,
  whoami = false,
  onEsTienda,
  onEsUsuario,
  onNuevo,
  titulo,
  subtitulo,
  ilustracionAltura = 200,
  mostrarQueEsLokal = false,
  mostrarIlustracion = true,
  mountDelayMs = 0,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // errores de Google/Apple — se muestran arriba de todo
  // Error del envío de Email Magic Link, SEPARADO de `error`: antes
  // compartían el mismo estado y el mensaje aparecía en el bloque genérico
  // de arriba de la card, lejos del formulario de email (que el usuario ya
  // había desplegado más abajo tocando "Continuar con email") — el salto
  // de layout que eso producía (todo el contenido de abajo empujado hacia
  // abajo de golpe) se reportó como un "glitch". Ahora el error de email se
  // muestra DENTRO de su propio formulario, sin mover nada más.
  const [errorEmail, setErrorEmail] = useState(null);
  // 'login' | 'registro' | 'elegir-rol'. 'elegir-rol' solo es alcanzable
  // con whoami=true, tras un login exitoso sin tienda/usuario asociado
  // todavía — igual que antes, no cambia con este rediseño.
  const [modo, setModo] = useState('login');
  const [paso, setPaso] = useState('metodos'); // 'metodos' | 'elegir-rol'

  // Bloque ID de Lokal + contraseña: SIEMPRE colapsado de entrada, en
  // AdminLogin y en el sheet por igual. El brief original lo pedía como
  // método principal expandido, pero en la práctica (con Google + Apple +
  // Email también en pantalla) dos inputs abiertos de una empujaban todo
  // el resto fuera de vista y el ID de Lokal — que hoy ni siquiera tiene
  // backend real — terminaba "robándose" el protagonismo que debería tener
  // Google (el único método que de verdad funciona sin fricción hoy).
  // Ajuste explícito del usuario: bajarlo a un botón más, al final de la
  // lista, con el mismo peso visual que Google/Apple/Email.
  //
  // metodoAbierto: 'id' | 'email' | null — un único estado en vez de dos
  // booleanos independientes (idExpandido + emailModo) para que abrir uno
  // cierre el otro automáticamente. Con dos flags separados, tocar
  // "Continuar con email" y después "Continuar con ID de Lokal" dejaba los
  // DOS formularios abiertos a la vez, sumando de nuevo toda la altura que
  // este mismo rediseño buscaba evitar.
  const [metodoAbierto, setMetodoAbierto] = useState(null);
  const idExpandido = metodoAbierto === 'id';
  const emailModo = metodoAbierto === 'email';
  const [idValor, setIdValor] = useState('');
  const [passValor, setPassValor] = useState('');
  const [passVisible, setPassVisible] = useState(false);
  const [idMsg, setIdMsg] = useState(null); // { ok, texto, alternativas? } tras tocar el campo
  const [emailValor, setEmailValor] = useState('');
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [appleProximamente, setAppleProximamente] = useState(false);
  // Mensaje inline (no toast) para el submit de ID+contraseña — "todavía
  // no disponible", ver handleSubmitIdPassword.
  const [idPasswordAviso, setIdPasswordAviso] = useState(null);

  const elegirUsuario = () => {
    // Optimista: se avisa al padre YA con un perfil armado en el cliente,
    // sin esperar el POST — el guardado real viaja en paralelo.
    const fbUser = auth.currentUser;
    onEsUsuario({
      uid: fbUser?.uid,
      email: fbUser?.email,
      nombre: fbUser?.displayName || '',
      foto: fbUser?.photoURL || null,
      role: 'usuario',
    });
    apiFetch(`${API_BASE}/usuarios`, {
      method: 'POST',
      authRequired: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(() => { /* el perfil optimista ya se está usando; un fallo acá es un caso raro que no bloquea la navegación */ });
  };

  // Lógica compartida por TODOS los caminos de login que terminan con una
  // sesión real de Firebase (Google popup, Google GIS, Email Magic Link
  // vía Root.jsx→/admin): resuelve tienda/usuario/nuevo. A partir de acá el
  // flujo es idéntico sin importar cómo se logueó — es justamente la idea
  // de "un solo user_id interno" del brief: Firebase Auth ya lo resuelve
  // solo, no hace falta reconciliar identidades del lado de LOKAL.
  const resolverWhoami = async () => {
    if (!whoami) return; // AdminLogin: Root.jsx toma el control con onAuthStateChanged

    const res = await apiFetch(`${API_BASE}/usuarios?whoami=1`, { authRequired: true });
    if (!res.ok) throw new Error('No se pudo verificar tu cuenta');
    const data = await res.json();

    if (data.rol === 'tienda') { onEsTienda(); return; }
    if (data.rol === 'usuario') { onEsUsuario(data.usuario); return; }
    // Cuenta nueva (sin tienda ni perfil): si el caller migró a la pantalla
    // completa (onNuevo, ver LoginSheet.jsx), navegar ahí en vez de abrir el
    // paso interno chico — ver el comentario de onNuevo en la firma de
    // arriba para el porqué.
    if (onNuevo) { onNuevo(); return; }
    setPaso('elegir-rol');
  };

  const handleErrorLogin = (err) => {
    const ignored = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'popup-closed'];
    if (!ignored.includes(err.code)) {
      setError(
        err.code === 'auth/unauthorized-domain'
          ? 'Dominio no autorizado. Agregá este dominio en Firebase Console.'
          : (err.message || 'No se pudo iniciar sesión')
      );
    }
  };

  // Fallback: signInWithPopup clásico (ventana emergente) — solo se
  // dispara si GIS no cargó, o el dominio no está en "Authorized
  // JavaScript origins" (ver useBotonGoogleGIS). El click real, cuando GIS
  // SÍ está disponible, lo recibe el iframe invisible superpuesto (abajo).
  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (!user) return; // fallback a redirect (mobile sin popup) — este componente se desmonta
      await resolverWhoami();
    } catch (err) {
      handleErrorLogin(err);
    } finally {
      setLoading(false);
    }
  };

  // resetGisKey: cambia la `key` del hook de GIS para forzar un remontaje
  // completo del iframe — mismo efecto que cerrar y volver a abrir el
  // sheet (que el usuario confirmó que SÍ hace volver a funcionar el sheet
  // nativo). Caso real: el usuario cierra el sheet NATIVO de Google (sin
  // loguearse) pero deja este sheet de LOKAL abierto — Chrome puede negarse
  // a reabrir FedCM para ese mismo iframe ya "gastado".
  //
  // SIN temporizador perceptible: el pedido explícito fue una salida
  // INSTANTÁNEA. El caso "el sheet nativo SÍ abrió y se cerró" lo detecta
  // el propio hook (evento 'focus' de window) y llama a
  // onFocoSinResultado más abajo, sin que este componente tenga que
  // esperar nada. tocoIframeRef solo marca si el iframe llegó a tomar el
  // foco alguna vez (mismo evento 'blur'), para que el timeout corto de
  // antesDeTocar sepa distinguir "no pasó nada" de "sí pasó algo".
  const [resetGisKey, setResetGisKey] = useState(0);
  const tocoIframeRef = React.useRef(false);

  // Mide el botón visible en runtime (usa clamp()/w-full, no un tamaño
  // fijo) para escalar el iframe invisible de Google (fijo en
  // GOOGLE_BTN_W+20 × 44 puertas adentro) hasta cubrir el 100% del área
  // clickeable real — así cualquier punto del botón que el usuario ve
  // dispara el sheet nativo, no solo una franja central angosta.
  const botonRef = React.useRef(null);
  const [escala, setEscala] = useState({ x: 1, y: 1 });
  React.useEffect(() => {
    const el = botonRef.current;
    if (!el) return;
    const medir = () => {
      const w = el.offsetWidth, h = el.offsetHeight;
      if (w > 0 && h > 0) {
        setEscala({ x: w / (GOOGLE_BTN_W + 20), y: h / 44 });
      }
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // GIS/FedCM: abre el selector de cuenta como sheet NATIVO del sistema en
  // vez de una ventana emergente aparte — mismo patrón que ya resolvió
  // LandingScreen.jsx. onLogin llega con la sesión de Firebase ya resuelta
  // (loginConIdToken corrió adentro de firebase.js), así que acá solo hace
  // falta continuar con resolverWhoami, igual que el camino de popup.
  const { slotRef, gisActivo, gisEnCurso } = useBotonGoogleGIS({
    key: resetGisKey,
    isDark,
    width: GOOGLE_BTN_W,
    mountDelayMs,
    onIframeTouch: () => { tocoIframeRef.current = true; },
    // El sheet nativo se cerró (con o sin login) y no hubo resultado: el
    // hook ya lo detecta solo (focus de window vuelve sin onLogin/onError)
    // y avisa acá — remonta el iframe AL INSTANTE, sin esperar a que el
    // usuario vuelva a tocar. Esto es lo que resuelve "el sheet se cierra
    // o falla, el botón automáticamente detecta el login salvavidas".
    onFocoSinResultado: () => { tocoIframeRef.current = false; setResetGisKey((k) => k + 1); },
    onLogin: async () => {
      setLoading(true);
      setError(null);
      try {
        await resolverWhoami();
      } catch (err) {
        handleErrorLogin(err);
      } finally {
        setLoading(false);
      }
    },
    onError: (err) => handleErrorLogin(err),
  });

  // Segunda capa del salvavidas: cubre el caso en que el toque ni siquiera
  // logró abrir el sheet nativo (FedCM bloqueado "puertas adentro" — nunca
  // hay blur porque el iframe nunca tomó foco real, así que el mecanismo
  // de foco de useBotonGoogleGIS, que resuelve el caso "el sheet SÍ abrió
  // y se cerró", no se dispara). Un timeout corto arranca EN EL TOQUE
  // MISMO del botón señuelo: si a los ~900ms no hubo blur (el iframe ni
  // reaccionó) ni loading, se asume que ese toque se perdió y se remonta
  // el iframe, listo para el PRÓXIMO toque del mismo usuario.
  //
  // BUG real encontrado: cuando useBotonGoogleGIS ya se rindió (detector de
  // frustración: gisActivo pasó a false tras varios toques/mucho tiempo sin
  // resultado) el iframe queda apagado a propósito — el click del usuario
  // debe caer al <button onClick={handleGoogle}> de abajo (popup, fiable).
  // Sin este guard, este mismo timeout veía "no hubo blur" (obvio, el
  // iframe está apagado) y remontaba igual con setResetGisKey, lo que
  // reactivaba gisActivo de nuevo a los 900ms — revirtiendo la decisión de
  // rendirse ANTES de que el usuario llegara a ver el popup, dejando la
  // sensación de "el botón cambia mas nunca abre la ventana".
  const tocoTimeoutRef = React.useRef(null);
  const antesDeTocar = () => {
    if (!gisActivo) return; // ya nos rendimos al popup fiable, no reactivar GIS
    if (tocoTimeoutRef.current) clearTimeout(tocoTimeoutRef.current);
    tocoTimeoutRef.current = setTimeout(() => {
      if (!tocoIframeRef.current && !loading) {
        setResetGisKey((k) => k + 1);
      }
    }, 900);
  };

  // ─── ID de Lokal + contraseña (UI preparada, sin backend real) ─────────
  const idErrorFormato = validarFormatoId(idValor);
  const idDebounceRef = React.useRef(null);
  const handleIdChange = (valor) => {
    const limpio = valor.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setIdValor(limpio);
    setIdMsg(null);
    if (idDebounceRef.current) clearTimeout(idDebounceRef.current);
    // Solo tiene sentido chequear disponibilidad en modo registro (en
    // login el ID YA existe o no, no se está "reservando" nada) y solo si
    // el formato ya es válido.
    if (modo !== 'registro' || validarFormatoId(limpio)) return;
    idDebounceRef.current = setTimeout(() => {
      const libre = simularDisponibilidadId(limpio);
      setIdMsg(libre
        ? { ok: true, texto: 'Disponible' }
        : { ok: false, texto: 'Ya está en uso', alternativas: sugerirAlternativas(limpio) });
    }, 350);
  };

  const handleSubmitIdPassword = (e) => {
    e.preventDefault();
    // Sin backend real de contraseñas: no se intenta ni se simula un login
    // — mensaje honesto, sin romper el formulario ni perder lo escrito.
    setIdPasswordAviso(
      modo === 'registro'
        ? 'Muy pronto vas a poder crear tu ID de Lokal. Mientras tanto, entrá con Google o por email.'
        : 'El acceso con ID de Lokal y contraseña todavía no está disponible. Entrá con Google o por email.'
    );
  };

  // ─── Email Magic Link ───────────────────────────────────────────────────
  const handleEnviarLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorEmail(null);
    try {
      await enviarLinkDeAcceso(emailValor.trim());
      setEmailEnviado(true);
    } catch (err) {
      // auth/operation-not-allowed: el método "Email link (passwordless
      // sign-in)" no está habilitado en Firebase Console (Authentication →
      // Sign-in method) — no es un bug de este código, es config del
      // proyecto de Firebase que falta activar del lado del backend.
      setErrorEmail(
        err.code === 'auth/invalid-email' ? 'Ese email no es válido.'
        : err.code === 'auth/operation-not-allowed' ? 'El acceso por email todavía no está habilitado. Probá con Google mientras tanto.'
        : (err.message || 'No se pudo enviar el enlace')
      );
    } finally {
      setLoading(false);
    }
  };

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setError(null);
    setErrorEmail(null);
    setIdPasswordAviso(null);
    setMetodoAbierto(null);
    setEmailEnviado(false);
    setIdMsg(null);
  };

  if (paso === 'elegir-rol') {
    return (
      <>
        <div className="mx-auto mb-4 flex items-center justify-center rounded-2xl bg-brand/10" style={{ width: 56, height: 56 }}>
          <UserRound className="w-6 h-6 text-brand" strokeWidth={2} />
        </div>
        <h1 className="font-black mb-1.5" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)' }}>
          ¡Bienvenido a LOKAL!
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary, #999)', fontSize: 'clamp(.875rem, 1vw, .9375rem)' }}>
          Es la primera vez que entrás. ¿Qué querés hacer?
        </p>

        <div className="space-y-2.5 text-left">
          <button
            onClick={elegirUsuario}
            className="w-full flex items-center gap-3 rounded-2xl p-4 transition-colors bg-brand/[0.08] hover:bg-brand/[0.14] border border-transparent"
          >
            <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
              <UserRound className="w-5 h-5 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Cuenta de usuario</p>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary, #999)' }}>Favoritos, seguir tiendas y más</p>
            </div>
          </button>

          <button
            onClick={onEsTienda}
            className="w-full flex items-center gap-3 rounded-2xl p-4 transition-colors bg-brand/[0.08] hover:bg-brand/[0.14] border border-transparent"
          >
            <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Crear mi tienda</p>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary, #999)' }}>Catálogo online con link propio</p>
            </div>
          </button>
        </div>
      </>
    );
  }

  // Copy por defecto según el modo — el brief pide títulos distintos para
  // "Entrá a Lokal" (login) vs. "Creá tu cuenta" (registro), sección 8/9.
  // Si el caller pasó titulo/subtitulo explícitos (LoginSheet, AdminLogin
  // hoy no lo hace) se respetan tal cual en modo login; en registro el
  // título siempre cambia porque es una intención distinta del usuario,
  // no algo que el caller deba prever de antemano.
  const tituloFinal = modo === 'registro' ? 'Creá tu cuenta' : (titulo || 'Entrá a Lokal');
  const subtituloFinal = modo === 'registro'
    ? 'Elegí tu ID de Lokal — es gratis y toma un minuto.'
    : (subtitulo || 'Iniciá sesión para continuar.');

  const inputBase = {
    color: 'var(--text-primary)',
    background: 'rgb(var(--brand, 0 184 217) / 0.06)',
    borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
  };

  return (
    <>
      {mostrarIlustracion && (
        <div className="mb-5 mx-auto rounded-2xl overflow-hidden" style={{ width: '100%', height: ilustracionAltura }}>
          <CiudadIlustrada className="w-full h-full" isDark={isDark} />
        </div>
      )}
      <h1 className="font-black mb-1" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)' }}>
        {tituloFinal}
      </h1>
      <p className="mb-6" style={{ color: 'var(--text-secondary, #999)', fontSize: 'clamp(.875rem, 1vw, .9375rem)' }}>
        {subtituloFinal}
      </p>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-left">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Métodos de acceso, todos con el mismo peso visual ──────────────
          Ajuste explícito del usuario tras ver el primer preview: con dos
          formularios (ID+contraseña Y luego Google/Apple/Email) apilados,
          la pantalla quedaba demasiado alta y el ID de Lokal — que hoy ni
          siquiera tiene backend real — se robaba el protagonismo que debía
          tener Google (el único método sin fricción real hoy). Google va
          primero, después Apple y Email, y el ID de Lokal cierra la lista
          como un botón más — mismo tratamiento visual que los demás, sin
          divisor "o" entre ellos porque ya no hay un principal/alternativo,
          es una sola lista pareja. */}

      {/* La cara visual de Google es SIEMPRE este botón (nunca el pill nativo
          que Google dibuja) — abajo, superpuesto e invisible, va el iframe
          real de Google Identity Services: es lo que recibe el click y
          dispara el sheet nativo del sistema en vez de una ventana
          emergente. handleGoogle (el <button> visible) queda como
          fallback si GIS no cargó o el dominio no está autorizado — mismo
          técnica que ya usa LandingScreen.jsx, portada acá vía
          useBotonGoogleGIS sin cambiar el look de este botón.
          onPointerDown en el contenedor (no onClick, que el iframe se
          queda con el evento real): arma el salvavidas de dos capas (ver
          antesDeTocar) ANTES de saber a quién le llega el click, así
          funciona sin importar si el toque terminó en el iframe o en el
          botón de abajo. */}
      <div className="relative mb-2.5" onPointerDown={antesDeTocar}>
        <button
          ref={botonRef}
          onClick={handleGoogle}
          disabled={loading || gisEnCurso}
          className="w-full flex items-center justify-center gap-3 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 border"
          style={{
            padding: '13px 20px',
            fontSize: '.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            // rgb(var(--brand)/X) tintado, NO blanco/transparente sólido: en
            // el Sheet (LoginSheet.jsx) el panel entero YA es blanco puro
            // en light, así que un botón #fff encima se fundía con el
            // fondo y se veía "sin relleno" (reportado en producción) —
            // mismo bug que ya se había resuelto para el panel del
            // ProximamenteModal con el mismo criterio de base tintada.
            background: 'rgb(var(--brand, 0 184 217) / 0.05)',
            borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
          }}
        >
          {(loading || gisEnCurso) ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <GoogleIcon size={18} />}
          {(loading || gisEnCurso) ? 'Entrando...' : 'Continuar con Google'}
        </button>
        {/* pointerEvents:none cuando gisActivo pasa a false (timeout de
            seguridad en useBotonGoogleGIS): si FedCM quedó bloqueado por
            el navegador ("FedCM was disabled... based on previous user
            action"), el iframe de Google sigue montado pero no completa el
            flujo — sin esto seguiría capturando el click para siempre y el
            botón se sentiría "muerto". Con pointerEvents:none el click cae
            al <button> de abajo (popup real, funciona siempre).

            BUG REAL #1 (ya corregido): el overlay cubría TODO el botón
            visible con pointerEvents:auto, pero el iframe de Google
            adentro es un rectángulo angosto y bajo (máx. 400×44, Google no
            deja pedirle otro tamaño) centrado por flex — fuera de esa
            franja el overlay interceptaba el click sin tener nada debajo
            para recibirlo, y el toque se perdía en silencio.
            BUG REAL #2 (este fix): angostar el área clickeable al tamaño
            real de Google (400×44) es correcto para que NO se pierdan
            toques, pero deja una franja demasiado chica en botones altos
            — el usuario pidió explícitamente que TODA el área visible del
            botón sea zona de toque amplia, no una franja. Con
            `transform: scale()` se estira el iframe (que sigue siendo
            400×44 puertas adentro, Google no lo sabe) para que ocupe el
            100% del ancho y alto reales del botón — el toque en cualquier
            punto del botón visible ahora cae dentro del iframe escalado.
            scaleX/scaleY se calculan en runtime (ver medirBoton) porque el
            botón usa clamp()/w-full, no un tamaño fijo. */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl" style={{ opacity: 0, pointerEvents: 'none' }}>
          {/* +20 = el margen invisible que Google agrega al iframe (~10px
              por lado, constante sin importar el width pedido). */}
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: GOOGLE_BTN_W + 20,
              height: 44,
              transform: `scale(${escala.x}, ${escala.y})`,
              pointerEvents: gisActivo ? 'auto' : 'none',
            }}
          >
            <div ref={slotRef} style={{ colorScheme: isDark ? 'dark' : 'light', width: GOOGLE_BTN_W + 20, height: 44 }} />
          </div>
        </div>
      </div>

      {/* Apple — mismo tratamiento visual de marca (ícono + texto), pero
          deshabilitado: no hay cuenta de Apple Developer todavía para dar
          de alta Sign in with Apple. Un botón ausente se hubiera leído
          como "LOKAL no piensa en iPhone"; uno presente-pero-honesto deja
          la promesa visible sin fingir que funciona. */}
      <button
        type="button"
        onClick={() => setAppleProximamente(true)}
        className="w-full flex items-center justify-center gap-3 rounded-2xl transition-all active:scale-[0.98] border mb-2.5"
        style={{
          padding: '13px 20px',
          fontSize: '.9rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          background: 'rgb(var(--brand, 0 184 217) / 0.05)',
          borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
        }}
      >
        <AppleIcon size={18} />
        Continuar con Apple
      </button>

      {/* Email Magic Link — único método alternativo 100% nuevo y
          funcional (enviarLinkDeAcceso, firebase.js). Progressive
          disclosure: el botón despliega el input, no lo muestra de una. */}
      {!emailModo ? (
        <button
          type="button"
          onClick={() => setMetodoAbierto('email')}
          className="w-full flex items-center justify-center gap-3 rounded-2xl transition-all active:scale-[0.98] border"
          style={{
            padding: '13px 20px',
            fontSize: '.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            // rgb(var(--brand)/X) tintado, NO blanco/transparente sólido: en
            // el Sheet (LoginSheet.jsx) el panel entero YA es blanco puro
            // en light, así que un botón #fff encima se fundía con el
            // fondo y se veía "sin relleno" (reportado en producción) —
            // mismo bug que ya se había resuelto para el panel del
            // ProximamenteModal con el mismo criterio de base tintada.
            background: 'rgb(var(--brand, 0 184 217) / 0.05)',
            borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
          }}
        >
          <Mail className="w-[18px] h-[18px]" />
          Continuar con email
        </button>
      ) : emailEnviado ? (
        <div className="rounded-2xl p-4 text-left bg-brand/[0.08]">
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Revisá tu correo</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary, #999)' }}>
            Te enviamos un enlace a <strong>{emailValor}</strong> para entrar sin contraseña. Abrilo desde este mismo dispositivo si podés.
          </p>
        </div>
      ) : (
        <form onSubmit={handleEnviarLink} className="text-left">
          <div className="relative mb-2">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary, #999)' }} />
            <input
              type="email"
              required
              autoFocus
              value={emailValor}
              onChange={(e) => setEmailValor(e.target.value)}
              placeholder="Escribí tu email"
              className="w-full rounded-2xl pl-10 pr-4 py-3.5 text-sm font-medium outline-none border transition-colors focus:border-brand"
              style={inputBase}
            />
          </div>
          {/* Error CONTEXTUAL a este formulario — ver el comentario de
              errorEmail más arriba (por qué está separado del error
              genérico de Google/Apple). */}
          {errorEmail && (
            <div className="mb-2 flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5 text-left">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorEmail}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-ink dark:bg-white hover:bg-ink/90 dark:hover:bg-white/90 text-white dark:text-[#18181b] font-bold rounded-2xl py-3.5 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-secondary, #999)' }}>
            Te enviaremos un enlace para entrar sin contraseña.
          </p>
        </form>
      )}

      {/* ID de Lokal + contraseña — último de la lista, mismo peso visual
          que Google/Apple/Email. Colapsado siempre (idExpandido arranca en
          false): dos inputs abiertos de entrada, siendo el método que hoy
          menos funciona (sin backend real), era exactamente lo que sobraba
          en altura. */}
      {!idExpandido ? (
        <button
          type="button"
          onClick={() => setMetodoAbierto('id')}
          className="w-full flex items-center justify-center gap-3 rounded-2xl transition-all active:scale-[0.98] border mt-2.5"
          style={{
            padding: '13px 20px',
            fontSize: '.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            // rgb(var(--brand)/X) tintado, NO blanco/transparente sólido: en
            // el Sheet (LoginSheet.jsx) el panel entero YA es blanco puro
            // en light, así que un botón #fff encima se fundía con el
            // fondo y se veía "sin relleno" (reportado en producción) —
            // mismo bug que ya se había resuelto para el panel del
            // ProximamenteModal con el mismo criterio de base tintada.
            background: 'rgb(var(--brand, 0 184 217) / 0.05)',
            borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
          }}
        >
          <AtSign className="w-[18px] h-[18px]" />
          {modo === 'registro' ? 'Elegí tu ID de Lokal' : 'Continuar con ID de Lokal'}
        </button>
      ) : (
        <form onSubmit={handleSubmitIdPassword} className="text-left mt-2.5">
          <label className="block text-[11px] font-bold mb-1.5" style={{ color: 'var(--text-secondary, #999)' }}>
            {modo === 'registro' ? 'Elegí tu ID de Lokal' : 'ID de Lokal'}
          </label>
          <div className="relative mb-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: 'var(--text-secondary, #999)' }}>@</span>
            <input
              type="text"
              value={idValor}
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder="tuusuario"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-2xl pl-8 pr-10 py-3.5 text-sm font-medium outline-none border transition-colors focus:border-brand"
              style={inputBase}
            />
            {modo === 'registro' && idValor && !idErrorFormato && idMsg && (
              idMsg.ok
                ? <Check className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                : <XIcon className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-rose-500" />
            )}
          </div>

          {modo === 'registro' && (
            <p className="text-[11px] mb-3" style={{ color: idErrorFormato ? '#f43f5e' : 'var(--text-secondary, #999)' }}>
              {idErrorFormato
                || (idMsg && !idMsg.ok && `@${idValor} ya está en uso. Probá: ${idMsg.alternativas.map((a) => `@${a}`).join(', ')}`)
                || (idMsg && idMsg.ok && `@${idValor} disponible`)
                || 'Será tu identidad única en Lokal. Solo minúsculas, números y guión bajo.'}
            </p>
          )}

          <label className="block text-[11px] font-bold mb-1.5 mt-2" style={{ color: 'var(--text-secondary, #999)' }}>
            {modo === 'registro' ? 'Creá una contraseña' : 'Contraseña'}
          </label>
          <div className="relative mb-1">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary, #999)' }} />
            <input
              type={passVisible ? 'text' : 'password'}
              value={passValor}
              onChange={(e) => setPassValor(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl pl-10 pr-11 py-3.5 text-sm font-medium outline-none border transition-colors focus:border-brand"
              style={inputBase}
            />
            <button
              type="button"
              onClick={() => setPassVisible((v) => !v)}
              aria-label={passVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-dim hover:text-brand transition-colors"
            >
              {passVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {idPasswordAviso && (
            <div className="flex items-start gap-2 text-xs mt-2 mb-1 rounded-xl px-3.5 py-3 bg-brand/[0.08]" style={{ color: 'var(--text-primary)' }}>
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand" />
              <span>{idPasswordAviso}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-3 flex items-center justify-center gap-2 bg-ink dark:bg-white hover:bg-ink/90 dark:hover:bg-white/90 text-white dark:text-[#18181b] font-bold rounded-2xl py-3.5 transition-all active:scale-[0.98]"
          >
            {modo === 'registro' ? 'Crear mi cuenta' : 'Iniciar sesión'}
          </button>

          {modo === 'login' && (
            <button
              type="button"
              onClick={() => setIdPasswordAviso('Te vamos a enviar un enlace para recuperar tu cuenta apenas esté disponible el acceso por email. Por ahora, usá "Continuar con email" más abajo.')}
              className="w-full text-center text-xs font-semibold mt-3 text-brand hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </form>
      )}

      {/* Divider + toggle registro/login — sección 8/9: "¿Todavía no tenés
          cuenta? Crear cuenta" / "¿Ya tenés cuenta? Iniciar sesión". */}
      <div className="h-px my-4" style={{ background: 'rgb(var(--brand, 0 184 217) / 0.14)' }} />
      <p className="text-sm" style={{ color: 'var(--text-secondary, #999)' }}>
        {modo === 'registro' ? '¿Ya tenés cuenta? ' : '¿Todavía no tenés cuenta? '}
        <button
          type="button"
          onClick={() => cambiarModo(modo === 'registro' ? 'login' : 'registro')}
          className="font-bold text-brand hover:underline"
        >
          {modo === 'registro' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
      </p>

      <p className="text-[11px] mt-4" style={{ color: 'var(--text-secondary, #999)' }}>
        Al continuar, aceptás los <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand transition-colors">términos y condiciones</a> de LOKAL.
      </p>

      <ProximamenteModal
        abierto={appleProximamente}
        isDark={isDark}
        onCerrar={() => setAppleProximamente(false)}
        icono={Sparkles}
        titulo="Próximamente"
        texto="Iniciar sesión con Apple todavía no está disponible. Mientras tanto, entrá con Google o por email."
      />

      {mostrarQueEsLokal && (
        <>
          {/* Mismo lenguaje "enriquecido" que el resto de botones/chips de
              esta misma card (el X de cerrar del sheet, el toggle de tema):
              bg-brand/[0.08] translúcido de marca, no un gris neutro sólido
              (bg-surface-card se leía plano/apagado al lado de esas otras
              piezas ya tintadas). active:scale suma el feedback táctil.

              <button> con pushState a /vender (LandingScreen.jsx — el pitch
              comercial real: logo animado, título con palabra rotativa,
              CTA "Continuar con Google", FAQ), NO /quienes-somos (esa es
              LegalPages.jsx, contenido institucional/legal, otra pantalla
              completamente distinta — corregido tras confundirla con el
              destino real la vuelta anterior). pushState + el evento
              popstate (que Root.jsx ya escucha para el resto de la
              navegación interna) evita la recarga. */}
          <button
            onClick={() => { window.history.pushState({}, '', '/vender'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="w-full flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all active:scale-[0.98] bg-brand/[0.08] hover:bg-brand/[0.16] mt-1"
          >
            <div className="w-9 h-9 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>¿Qué es LOKAL?</p>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary, #999)' }}>Descubrí cómo funciona</p>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary, #999)' }} />
          </button>

          {/* Mismo bloque "Creado por KTRL" que el footer de HomeGlobal
              (.hg-footer-ktrl) TAL CUAL — color text-ink (negro/color
              primario real, no gris translúcido) con hover:text-brand, más
              el mismo micro-scale con rebote (1.04 hover / 0.93 active).
              Antes acá era text-ink-dim/50 (gris apagado) sin el scale. */}
          <style>{`
            .lk-ktrl-link { transition: transform .12s cubic-bezier(0.34, 1.56, 0.64, 1); }
            @media (hover: hover) { .lk-ktrl-link:hover { transform: scale(1.04); } }
            .lk-ktrl-link:active { transform: scale(0.93); transition: transform .06s ease; }
          `}</style>
          <div className="mt-5 flex items-center justify-center">
            <a href="https://instagram.com/katriel.martinez" target="_blank" rel="noopener noreferrer"
              className="lk-ktrl-link lok-tap inline-flex items-center gap-1.5 no-underline hover:no-underline text-ink hover:text-brand transition-colors">
              <span className="text-[10px] font-semibold">Creado por</span>
              <KtrlMark style={{ height: 11, color: 'currentColor' }} />
            </a>
          </div>
        </>
      )}
    </>
  );
}
