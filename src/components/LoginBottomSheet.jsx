import React, { useState } from 'react';
import { X, Loader2, User, Sparkles, Store, ArrowRight, HelpCircle } from 'lucide-react';
import { signInWithGoogle } from '../firebase';

// ── Google Icon ───────────────────────────────────────────────────────────────
const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ── Login Bottom Sheet ────────────────────────────────────────────────────────
// Se muestra cuando un usuario guest intenta hacer algo que requiere auth.
// Un solo click en "Entrar con Google" → popup/redirect → listo.
export default function LoginBottomSheet({ open, onClose, context = 'default', onOpenLanding }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  if (!open) return null;

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user === null) return; // redirect en curso, la página se recarga sola
      setLoading(false);
      onClose?.();
    } catch (err) {
      const ignored = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      if (!ignored.includes(err.code)) {
        setError(
          err.code === 'auth/unauthorized-domain'
            ? 'Dominio no autorizado. Agregá este dominio en Firebase Console.'
            : 'No se pudo iniciar sesión. Intentá de nuevo.'
        );
      }
      setLoading(false);
    }
  };

  const handleRegisterStore = () => {
    // Guardar intent de registro de tienda y abrir login
    sessionStorage.setItem('lokal-register-intent', JSON.stringify({ intent: 'register-store', plan: 'mensual' }));
    handleGoogle();
  };

  const CONTEXTS = {
    default: {
      title: '¡Hola! 👋',
      desc: 'Iniciá sesión para guardar, pedir y chatear con comercios de tu ciudad.',
      cta: 'Entrar con Google',
    },
    crear: {
      title: 'Publicá tu pedido',
      desc: 'Iniciá sesión para publicar lo que buscás y que las tiendas te respondan.',
      cta: 'Entrar y publicar',
    },
    favorito: {
      title: 'Guardá tus favoritos',
      desc: 'Iniciá sesión para guardar tiendas y productos que te interesen.',
      cta: 'Entrar y guardar',
    },
    chat: {
      title: 'Chateá con la tienda',
      desc: 'Iniciá sesión para enviar mensajes y recibir respuestas.',
      cta: 'Entrar y chatear',
    },
    perfil: {
      title: 'Tu perfil',
      desc: 'Iniciá sesión para ver tus pedidos y mensajes.',
      cta: 'Entrar a mi perfil',
    },
  };

  const ctx = CONTEXTS[context] || CONTEXTS.default;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[7000] bg-black/50 animate-backdrop-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[7001] animate-sheet-up">
        <div
          className="bg-white dark:bg-[#2A0509] rounded-t-3xl shadow-2xl mx-auto max-w-lg"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-surface-card-2 dark:bg-white/20 rounded-full" />
          </div>

          <div className="px-6 pt-2 pb-6 relative">
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-card-2 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-ink-dim" />
            </button>

            {/* Avatar genérico */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 flex items-center justify-center">
                <User className="w-8 h-8 text-brand" />
              </div>
            </div>

            {/* Texto */}
            <div className="text-center mb-5">
              <h3 className="text-lg font-black text-ink mb-1.5">
                {ctx.title}
              </h3>
              <p className="text-sm text-ink-dim leading-relaxed">
                {ctx.desc}
              </p>
            </div>

            {/* CTA Google — text-[#18181b] fijo en dark (no dark:text-ink):
                text-ink resuelve a --text-primary-rgb, casi blanco en dark
                mode, así que sobre bg-white quedaba texto blanco sobre
                fondo blanco, invisible. */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-ink dark:bg-white hover:bg-ink/90 dark:hover:bg-white/90 text-white dark:text-[#18181b] font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <GoogleIcon size={20} />
              )}
              {loading ? 'Entrando...' : ctx.cta}
            </button>

            {error && (
              <p className="text-center text-rose-500 text-xs mt-3">{error}</p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-surface-card-2 dark:bg-white/10" />
              <span className="text-[10px] font-bold text-ink-dim uppercase tracking-wider">o</span>
              <div className="flex-1 h-px bg-surface-card-2 dark:bg-white/10" />
            </div>

            {/* Links secundarios */}
            <div className="space-y-2">
              {/* ¿Qué es Lokal? */}
              <button
                onClick={() => { onClose(); onOpenLanding?.(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-card-2 dark:bg-white/5 hover:bg-surface-card-2 dark:hover:bg-white/8 border border-slate-100 dark:border-white/8 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">¿Qué es Lokal?</p>
                  <p className="text-[11px] text-ink-dim">Descubrí cómo funciona</p>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-dim" />
              </button>

              {/* Soy tienda */}
              <button
                onClick={handleRegisterStore}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-card-2 dark:bg-white/5 hover:bg-surface-card-2 dark:hover:bg-white/8 border border-slate-100 dark:border-white/8 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">Soy tienda</p>
                  <p className="text-[11px] text-ink-dim">Registrá tu comercio gratis</p>
                </div>
                <ArrowRight className="w-4 h-4 text-ink-dim" />
              </button>
            </div>

            {/* Beneficios */}
            <div className="mt-5 space-y-2">
              {[
                'Publicá lo que buscás gratis',
                'Chateá con comercios locales',
                'Recibí notificaciones de respuestas',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-ink-dim">
                  <Sparkles className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="w-full mt-4 py-2.5 text-xs font-semibold text-ink-dim hover:text-ink dark:hover:text-ink-dim transition-colors"
            >
              Seguir explorando sin cuenta
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
