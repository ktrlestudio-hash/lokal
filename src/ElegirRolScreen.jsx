/**
 * ElegirRolScreen — pantalla completa "¿qué querés hacer?" para una cuenta
 * de Google/email nueva (whoami devolvió {rol:null, nuevo:true}). Antes
 * esto vivía como un paso chico DENTRO del panel de LoginCard.jsx
 * (paso === 'elegir-rol', dos botones angostos en el mismo espacio que el
 * resto de los métodos de login) — pedido explícito: una pantalla propia,
 * a pantalla completa, con el mismo pulido visual que AdminLogin.jsx/
 * RegistroTienda.jsx, en vez de un paso más apretado en un panel.
 *
 * Mismo copy conceptual que el paso viejo de LoginCard.jsx (no se inventó
 * texto nuevo): "Cuenta de usuario" → favoritos/seguir tiendas; "Crear mi
 * tienda" → catálogo online con link propio.
 *
 * Reusa el mismo lenguaje de fondo+card que RegistroTienda.jsx/
 * RegistroUsuario.jsx (glow radial de marca + card glass) — tercera copia
 * de ese mismo bloque chico; ver la nota en RegistroUsuario.jsx sobre por
 * qué no se extrajo a un archivo compartido todavía.
 */
import React from 'react';
import { UserRound, Store, ArrowRight } from 'lucide-react';
import { LogoFull } from './Brand';

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

export default function ElegirRolScreen({ firebaseUser, onElegirUsuario, onElegirTienda, onLogout, isDark = true }) {
  return (
    <FondoConGlow isDark={isDark}>
      <CardGlass isDark={isDark}>
        <div className="mb-6 flex justify-center">
          <LogoFull size={28} />
        </div>
        <div className="mx-auto mb-4 flex items-center justify-center rounded-2xl bg-brand/10" style={{ width: 56, height: 56 }}>
          <UserRound className="w-6 h-6 text-brand" strokeWidth={2} />
        </div>
        <h1 className="font-black mb-1.5" style={{ color: 'var(--text-primary, #fff)', fontSize: 'clamp(1.25rem, 1.6vw, 1.5rem)' }}>
          ¡Bienvenido a LOKAL!
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary, #999)', fontSize: 'clamp(.875rem, 1vw, .9375rem)' }}>
          {firebaseUser?.displayName ? `Hola ${firebaseUser.displayName.split(' ')[0]} — ` : ''}Es la primera vez que entrás. ¿Qué querés hacer?
        </p>

        <div className="space-y-2.5 text-left">
          <button
            onClick={onElegirUsuario}
            className="w-full flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98] bg-brand/[0.08] hover:bg-brand/[0.14] border border-transparent"
          >
            <div className="w-11 h-11 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
              <UserRound className="w-5 h-5 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Cuenta de usuario</p>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary, #999)' }}>Favoritos, seguir tiendas y más</p>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary, #999)' }} />
          </button>

          <button
            onClick={onElegirTienda}
            className="w-full flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98] bg-brand/[0.08] hover:bg-brand/[0.14] border border-transparent"
          >
            <div className="w-11 h-11 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Crear mi tienda</p>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary, #999)' }}>Catálogo online con link propio</p>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary, #999)' }} />
          </button>
        </div>

        {onLogout && (
          <button type="button" onClick={onLogout}
            className="w-full mt-6 py-2 text-xs font-medium" style={{ color: 'var(--text-secondary, #999)' }}>
            Cerrar sesión
          </button>
        )}
      </CardGlass>
    </FondoConGlow>
  );
}
