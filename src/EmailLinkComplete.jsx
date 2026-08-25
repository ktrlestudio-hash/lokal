// EmailLinkComplete — pantalla que resuelve la vuelta del Magic Link
// (enviarLinkDeAcceso en firebase.js manda al usuario acá, a /entrar, con
// los query params propios de Firebase colgando de la URL). No decide
// destino por sí misma: signInWithEmailLink deja la sesión de Firebase
// resuelta y el listener global onAuthStateChanged de Root.jsx (el mismo
// que ya atiende el resto de la app) la recoge solo — acá solo hace falta
// completar el intercambio y empujar la navegación a /admin, exactamente
// el mismo punto de entrada que usa el botón de Google en AdminLogin
// (whoami=false ahí: Root.jsx ya resuelve tienda/registro con lo que
// tenga esa sesión). Reusa el mismo layout/glow que AdminLogin.jsx.
//
// Este archivo NO se agrega a la lista de imports lazy de Root.jsx a
// propósito: es minúsculo (sin ilustración, sin lógica de Google) y quien
// llega acá viene de abrir un mail — no tiene sentido optimizar un chunk
// aparte para una ruta que ni siquiera existe como link en la propia app.
import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Mail } from 'lucide-react';
import { esLinkDeAcceso, completarLoginConLink } from './firebase';

export default function EmailLinkComplete({ isDark, onListo }) {
  // 'resolviendo' | 'pedir-email' | 'error'. onListo (provisto por Root)
  // navega a /admin una vez que Firebase ya tiene la sesión resuelta.
  const [estado, setEstado] = useState('resolviendo');
  const [error, setError] = useState(null);
  const [emailInput, setEmailInput] = useState('');

  const intentar = async (emailManual) => {
    setEstado('resolviendo');
    setError(null);
    try {
      await completarLoginConLink(emailManual);
      onListo();
    } catch (err) {
      if (err.code === 'email-requerido') {
        setEstado('pedir-email');
        return;
      }
      setError('Este enlace ya no es válido. Pedí uno nuevo desde la pantalla de acceso.');
      setEstado('error');
    }
  };

  useEffect(() => {
    if (!esLinkDeAcceso()) {
      setError('Este enlace no es válido.');
      setEstado('error');
      return;
    }
    intentar(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="lok-app-surface relative min-h-[100dvh] flex flex-col items-center justify-center px-6 overflow-hidden" style={{ background: isDark ? '#040a14' : 'var(--surface-solid, #fff)' }}>
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
        height: '60%',
        background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.16), transparent)',
      }} />

      <div className="relative w-full text-center" style={{ maxWidth: 380 }}>
        {estado === 'resolviendo' && (
          <>
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-brand" />
            <p className="font-bold" style={{ color: 'var(--text-primary, #fff)' }}>Entrando a LOKAL...</p>
          </>
        )}

        {estado === 'pedir-email' && (
          <>
            <div className="mx-auto mb-4 flex items-center justify-center rounded-2xl bg-brand/10" style={{ width: 56, height: 56 }}>
              <Mail className="w-6 h-6 text-brand" strokeWidth={2} />
            </div>
            <h1 className="font-black mb-1.5" style={{ color: 'var(--text-primary, #fff)', fontSize: '1.25rem' }}>Confirmá tu email</h1>
            <p className="mb-5" style={{ color: 'var(--text-secondary, #999)', fontSize: '.9rem' }}>
              Abriste este enlace desde otro dispositivo o navegador — escribí el email al que te lo enviamos para terminar de entrar.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); if (emailInput.trim()) intentar(emailInput.trim()); }}>
              <input
                type="email"
                required
                autoFocus
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-2xl px-4 py-3.5 mb-3 text-sm font-medium outline-none border transition-colors focus:border-brand"
                style={{ color: 'var(--text-primary)', background: 'rgb(var(--brand, 0 184 217) / 0.06)', borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)' }}
              />
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] bg-ink dark:bg-white text-white dark:text-[#18181b] transition-transform"
              >
                Continuar
              </button>
            </form>
          </>
        )}

        {estado === 'error' && (
          <>
            <div className="mb-4 flex items-center gap-2 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <a href="/admin" className="text-sm font-bold text-brand underline">Volver a la pantalla de acceso</a>
          </>
        )}
      </div>
    </div>
  );
}
