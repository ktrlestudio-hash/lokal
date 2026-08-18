// EstadoCarga — pantalla de "trabajando" mientras el archivo se envía al
// backend (calibrar) o se aplican los cambios (aplicar). El backend
// procesa todo en un único request sin eventos de progreso reales — no
// hay un número honesto de "fila 340 de 500" para mostrar. En vez de un
// spinner técnico, se arma como un empty-state amigable: el ícono del
// archivo real "respirando" (pulso suave, sin girar como un loader
// genérico) + nombre/tamaño reales + una secuencia de mensajes que rota
// sola con el tiempo — transmite actividad sin inventar una cifra falsa.
import React, { useEffect, useState } from 'react';
import { iconoPorExtension } from './PasoSubir.jsx';

function formatoTamaño(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MENSAJES_LEYENDO = [
  'Leyendo tu archivo...',
  'Detectando columnas...',
  'Comparando con tu catálogo...',
];

const MENSAJES_APLICANDO = [
  'Aplicando cambios a tu catálogo...',
  'Guardando en tu tienda...',
  'Ya casi...',
];

export function EstadoCarga({ tipo, archivoInfo, cantidadCambios }) {
  const mensajes = tipo === 'aplicando' ? MENSAJES_APLICANDO : MENSAJES_LEYENDO;
  const [idxMensaje, setIdxMensaje] = useState(0);

  const totalMensajes = mensajes.length;
  useEffect(() => {
    setIdxMensaje(0);
    const id = setInterval(() => {
      setIdxMensaje((i) => Math.min(i + 1, totalMensajes - 1));
    }, 1800);
    return () => clearInterval(id);
  }, [tipo, totalMensajes]);

  const Icono = archivoInfo ? iconoPorExtension(archivoInfo.name) : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="relative w-20 h-20">
        {/* Anillo pulsando — más "documento procesándose tranquilo" que un
            spinner girando a toda velocidad. animate-ping es nativo de
            Tailwind (2s por default), no hace falta registrar nada nuevo. */}
        <div className="absolute inset-0 rounded-3xl bg-brand/20 dark:bg-brand/25 animate-ping" style={{ animationDuration: '2.2s' }} />
        <div className="absolute inset-2 rounded-3xl bg-brand/15 dark:bg-brand/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          {Icono ? <Icono className="w-8 h-8 text-brand" strokeWidth={1.75} /> : <div className="w-8 h-8 rounded-xl bg-brand/30 animate-pulse" />}
        </div>
      </div>

      {archivoInfo && (
        <div className="bg-surface-card-2 dark:bg-white/5 rounded-xl px-4 py-2">
          <p className="text-sm font-bold truncate max-w-[240px]">{archivoInfo.name}</p>
          {archivoInfo.size != null && <p className="text-xs text-ink-dim">{formatoTamaño(archivoInfo.size)}</p>}
        </div>
      )}

      <div>
        <p key={idxMensaje} className="text-sm font-bold animate-fade-in">{mensajes[idxMensaje]}</p>
        {cantidadCambios != null && (
          <p className="text-xs text-ink-dim mt-1">{cantidadCambios} cambios en camino, no cierres esta pantalla</p>
        )}
      </div>
    </div>
  );
}
