// LoginCard — el contenido REAL de la card de login (logo, ilustración de
// ciudad, título/subtítulo, botón "Continuar con Google", error, legal),
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
import React, { useState } from 'react';
import { Loader2, AlertCircle, Store, UserRound, HelpCircle, ArrowRight } from 'lucide-react';
import CiudadIlustrada from './CiudadIlustrada';
import { signInWithGoogle, auth } from '../firebase';
import { apiFetch } from '../api';
import { API_BASE } from '../config/flags';
import { KtrlMark } from '../Brand';
import { useBotonGoogleGIS } from '../hooks/useBotonGoogleGIS.js';

const GOOGLE_BTN_W = 320;

const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/**
 * @param {boolean} isDark
 * @param {boolean} whoami - si true, tras el login llama a GET /usuarios?whoami=1
 *   y decide el destino (tienda/usuario/nuevo). Si false (AdminLogin), el
 *   login simplemente resuelve — Root.jsx toma el control después, como
 *   siempre.
 * @param {() => void} onEsTienda
 * @param {(usuario) => void} onEsUsuario
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
 */
export default function LoginCard({
  isDark,
  whoami = false,
  onEsTienda,
  onEsUsuario,
  titulo = 'Panel de tienda',
  subtitulo = 'Iniciá sesión con tu cuenta de Google para administrar tu tienda.',
  ilustracionAltura = 200,
  mostrarQueEsLokal = false,
  mostrarIlustracion = true,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // 'google' = botón de Google; 'elegir-rol' = correo nuevo, elegir tienda
  // o usuario (solo relevante cuando whoami=true).
  const [paso, setPaso] = useState('google');

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

  // Lógica compartida por los DOS caminos de login: el fallback de popup
  // (handleGoogle) y el sheet nativo de GIS (onLogin del hook, más abajo).
  // Ambos terminan con un usuario real de Firebase ya autenticado — desde
  // ahí en más el flujo es idéntico sin importar cómo se logueó.
  const resolverWhoami = async () => {
    if (!whoami) return; // AdminLogin: Root.jsx toma el control con onAuthStateChanged

    const res = await apiFetch(`${API_BASE}/usuarios?whoami=1`, { authRequired: true });
    if (!res.ok) throw new Error('No se pudo verificar tu cuenta');
    const data = await res.json();

    if (data.rol === 'tienda') { onEsTienda(); return; }
    if (data.rol === 'usuario') { onEsUsuario(data.usuario); return; }
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

  // GIS/FedCM: abre el selector de cuenta como sheet NATIVO del sistema en
  // vez de una ventana emergente aparte — mismo patrón que ya resolvió
  // LandingScreen.jsx. onLogin llega con la sesión de Firebase ya resuelta
  // (loginConIdToken corrió adentro de firebase.js), así que acá solo hace
  // falta continuar con resolverWhoami, igual que el camino de popup.
  const { slotRef, gisActivo } = useBotonGoogleGIS({
    isDark,
    width: GOOGLE_BTN_W,
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

  return (
    <>
      {mostrarIlustracion && (
        <div className="mb-5 mx-auto rounded-2xl overflow-hidden" style={{ width: '100%', height: ilustracionAltura }}>
          <CiudadIlustrada className="w-full h-full" isDark={isDark} />
        </div>
      )}
      <h1 className="font-black mb-1" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)' }}>
        {titulo}
      </h1>
      <p className="mb-8" style={{ color: 'var(--text-secondary, #999)', fontSize: 'clamp(.875rem, 1vw, .9375rem)' }}>
        {subtitulo}
      </p>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-left">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* La cara visual es SIEMPRE este botón (nunca el pill nativo que
          Google dibuja) — abajo, superpuesto e invisible, va el iframe
          real de Google Identity Services: es lo que recibe el click y
          dispara el sheet nativo del sistema en vez de una ventana
          emergente. handleGoogle (el <button> visible) queda como
          fallback si GIS no cargó o el dominio no está autorizado — mismo
          técnica que ya usa LandingScreen.jsx, portada acá vía
          useBotonGoogleGIS sin cambiar el look de este botón. */}
      <div className="relative">
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-ink dark:bg-white hover:bg-ink/90 dark:hover:bg-white/90 text-white dark:text-[#18181b] font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:opacity-60 active:scale-[0.98]"
          style={{ padding: 'clamp(14px, 1.4vw, 17px) clamp(24px, 2vw, 28px)', fontSize: 'clamp(.9375rem, 1vw, 1.0625rem)' }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon size={20} />}
          {loading ? 'Entrando...' : 'Continuar con Google'}
        </button>
        {/* pointerEvents:none cuando gisActivo pasa a false (timeout de
            seguridad en useBotonGoogleGIS): si FedCM quedó bloqueado por
            el navegador ("FedCM was disabled... based on previous user
            action"), el iframe de Google sigue montado pero no completa el
            flujo — sin esto seguiría capturando el click para siempre y el
            botón se sentiría "muerto". Con pointerEvents:none el click cae
            al <button> de abajo (popup real, funciona siempre). */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl" style={{ opacity: 0, pointerEvents: gisActivo ? 'auto' : 'none' }}>
          {/* +20 = el margen invisible que Google agrega al iframe (~10px
              por lado, constante sin importar el width pedido). */}
          <div ref={slotRef} className="flex items-center justify-center shrink-0"
            style={{ colorScheme: isDark ? 'dark' : 'light', width: GOOGLE_BTN_W + 20, height: 44 }} />
        </div>
      </div>

      <p className="text-[11px] mt-4" style={{ color: 'var(--text-secondary, #999)' }}>
        Al continuar, aceptás los <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand transition-colors">términos y condiciones</a> de LOKAL.
      </p>

      {mostrarQueEsLokal && (
        <>
          {/* Divider "o" — mismo patrón que LoginBottomSheet.jsx de LOKAL
              Global, separa la acción principal (Google) del contenido
              educativo de abajo. */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgb(var(--brand, 0 184 217) / 0.14)' }} />
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary, #999)' }}>o</span>
            <div className="flex-1 h-px" style={{ background: 'rgb(var(--brand, 0 184 217) / 0.14)' }} />
          </div>

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
              destino real la vuelta anterior). Antes era <a
              href="/vender#quienes-somos">, un hash que no existe en
              ningún lado — recargaba la página entera sin scrollear a
              nada. pushState + el evento popstate (que Root.jsx ya escucha
              para el resto de la navegación interna) evita la recarga. */}
          <button
            onClick={() => { window.history.pushState({}, '', '/vender'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="w-full flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all active:scale-[0.98] bg-brand/[0.08] hover:bg-brand/[0.16]"
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
