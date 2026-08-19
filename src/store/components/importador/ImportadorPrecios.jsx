// ImportadorPrecios — wizard fullscreen, PURAMENTE visual: todo el estado
// y las llamadas de red viven en useImportador.js (montado en StoreApp.jsx,
// nivel que sobrevive mientras el usuario navega). Este componente solo
// se muestra u oculta — nunca se desmonta el trabajo en curso.
//
// Minimizar vs. cerrar: son acciones DISTINTAS a propósito.
//   - Minimizar (botón ⌄ o tocar fuera): oculta la UI, el proceso sigue
//     corriendo en segundo plano. Un chip flotante (ImportadorFlotante.jsx)
//     muestra el progreso y deja volver con un toque.
//   - Cerrar/cancelar (X): descarta todo, vuelve al estado inicial. Pide
//     confirmación si hay trabajo en curso (paso calibrar/revisar, o un
//     fetch en vuelo) — reciclando ModalConfirmar.
//
// Nada se escribe en el catálogo hasta el último paso, y ahí el usuario ya
// eligió exactamente qué aplicar — ni una sola escritura automática sin
// revisión humana en el medio (ver diseño en la memoria
// lokal-links-importar-precios-excel-pdf).
import React, { useState, useRef } from 'react';
import { X, Minus, Loader2, ChevronLeft, UploadCloud } from 'lucide-react';
import { PasoSubir } from './PasoSubir.jsx';
import { PasoCalibrar, calibracionLista } from './PasoCalibrar.jsx';
import { PasoRevisar } from './PasoRevisar.jsx';
import { PasoResultado } from './PasoResultado.jsx';
import { EstadoCarga } from './EstadoCarga.jsx';
import { ModalConfirmar } from '../ModalConfirmar.jsx';
import { useCapaUI } from '../../navegacion/useCapaUI.js';

const PASOS = ['subir', 'calibrar', 'revisar', 'resultado'];
const TITULOS_PASO = {
  subir: 'Importar precios',
  calibrar: 'Confirmar columnas',
  revisar: 'Revisar cambios',
  resultado: 'Listo',
};

export function ImportadorPrecios({
  sidebarExpanded, onMinimizar, onCerrarDeVerdad,
  paso, cargando, error, calibracion, mapeo, diff, seleccion, resultado,
  archivoInfo, hayTrabajoEnCurso,
  manejarArchivoElegido, confirmarCalibracion, cambiarMapeo, cambiarSeleccion,
  aplicar, reiniciar, volver,
}) {
  const [pidiendoConfirmacion, setPidiendoConfirmacion] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const dragCounterRef = useRef(0);

  // El wizard es una capa del uiStack: el atrás nativo lo MINIMIZA (no lo
  // cierra ni cancela el trabajo) — ver src/store/navegacion/uiStack.js.
  // Minimizar nunca necesita confirmación (nada se pierde, sigue corriendo
  // atrás); solo cancelar/cerrar de verdad la pide.
  const { cerrar: pedirMinimizar } = useCapaUI({ abierto: true, onCerrar: onMinimizar });

  const pedirCancelar = () => {
    if (hayTrabajoEnCurso) { setPidiendoConfirmacion(true); return; }
    onCerrarDeVerdad();
  };
  const confirmarCancelar = () => { setPidiendoConfirmacion(false); reiniciar(); onCerrarDeVerdad(); };
  const cancelarCancelar = () => setPidiendoConfirmacion(false);

  const arrastreActivo = paso === 'subir' && !cargando;
  const onDragEnter = (e) => {
    if (!arrastreActivo) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setArrastrando(true);
  };
  const onDragOver = (e) => { if (arrastreActivo) e.preventDefault(); };
  const onDragLeave = (e) => {
    if (!arrastreActivo) return;
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setArrastrando(false); }
  };
  const onDrop = (e) => {
    if (!arrastreActivo) return;
    e.preventDefault();
    dragCounterRef.current = 0;
    setArrastrando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) manejarArchivoElegido(file);
  };

  const indicePaso = PASOS.indexOf(paso);
  const puedeVolver = paso === 'calibrar' || (paso === 'revisar' && !calibracion?.calibracionReusada);

  // En desktop el wizard respeta el sidebar fijo (z-[200] en StoreSidebar,
  // no compite con este z-[6000] pero SÍ debe dejarle su ancho visible en
  // vez de taparlo con inset-0 a toda la ventana — mismo ancho dinámico que
  // el spacer de StoreApp.jsx, expandido (224px) o colapsado (64px).
  const offsetSidebarDesktop = sidebarExpanded ? 224 : 64;

  return (
    <div
      className="fixed inset-0 h-[100dvh] z-[6000] bg-surface-card flex flex-col overflow-hidden animate-fade-in lg:left-[var(--sidebar-offset)]"
      style={{ '--sidebar-offset': `${offsetSidebarDesktop}px`, transition: 'left 380ms cubic-bezier(0.16,1,0.3,1)' }}
      onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
    >
      {/* Overlay de arrastre — pantalla completa, color de marca translúcido,
          ícono+texto grandes centrados. Solo tapa el contenido, no bloquea
          los eventos de drag (pointer-events-none) para que dragleave siga
          disparando correctamente sobre el contenedor de abajo. */}
      {arrastrando && (
        <div className="absolute inset-0 z-10 bg-brand/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 pointer-events-none animate-fade-in">
          <UploadCloud className="w-16 h-16 text-white" strokeWidth={1.5} />
          <p className="text-2xl font-black text-white">Soltá el archivo acá</p>
        </div>
      )}

      {/* Header — título + volver (paso previo) + spinner/cerrar.
          Minimizar/Cancelar (footer, texto completo) solo aparecen cuando
          hay trabajo real en curso — ver comentario en el footer. Antes de
          eso (paso "subir" sin elegir archivo, nada que perder todavía),
          alcanza con una X simple acá: cerrar directo, sin confirmación,
          como cualquier modal común. */}
      <div className="shrink-0 flex items-center gap-2 px-3 h-14 border-b border-slate-100 dark:border-white/8">
        {puedeVolver ? (
          <button onClick={volver} className="ui-icon-btn bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 transition-colors shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : <div className="w-9" />}
        <p className="font-black flex-1 truncate text-sm text-center">{TITULOS_PASO[paso]}</p>
        {cargando ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand shrink-0" />
        ) : !hayTrabajoEnCurso ? (
          <button onClick={pedirCancelar} className="ui-icon-btn bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        ) : <div className="w-9" />}
      </div>

      {/* Progreso — 3 segmentos discretos (uno por paso real), no una barra
          continua: así se ve de un vistazo cuántos pasos hay en total y
          cuál está completado/actual/pendiente, en vez de una fracción
          ambigua de "algún" porcentaje. El resultado no es "un paso más". */}
      {paso !== 'resultado' && (
        <div className="shrink-0 px-5 pt-3">
          <div className="flex items-center gap-1.5">
            {PASOS.slice(0, 3).map((p, i) => (
              <div key={p} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= indicePaso ? 'bg-brand' : 'bg-surface-card-2 dark:bg-white/10'
              }`} />
            ))}
          </div>
          <p className="text-[11px] font-bold text-ink-dim mt-1.5">Paso {indicePaso + 1} de 3</p>
        </div>
      )}

      {cargando && paso === 'subir' && !error ? (
        <EstadoCarga tipo="leyendo" archivoInfo={archivoInfo} />
      ) : paso === 'subir' ? (
        <PasoSubir onArchivoElegido={manejarArchivoElegido} error={error} />
      ) : paso === 'calibrar' ? (
        <PasoCalibrar
          headers={calibracion.headers}
          filasPreview={calibracion.filasPreview}
          sugerencias={calibracion.sugerencias}
          mapeo={mapeo}
          onCambiarMapeo={cambiarMapeo}
          totalFilas={calibracion.totalFilas}
        />
      ) : paso === 'revisar' && cargando ? (
        // Feedback real de progreso, no solo un spinner en el botón: con
        // archivos grandes (cientos de filas) el POST /aplicar tarda varios
        // segundos reales (lee+escribe todo el catálogo en R2) — sin esto
        // se sentía "colgado" en vez de "trabajando". Y ahora, si no
        // quiere esperar mirando, puede minimizar y seguir en otra pantalla.
        <EstadoCarga
          tipo="aplicando"
          archivoInfo={archivoInfo}
          cantidadCambios={seleccion.altas.size + seleccion.actualizaciones.size + seleccion.bajas.size}
        />
      ) : paso === 'revisar' ? (
        <PasoRevisar diff={diff} seleccion={seleccion} onCambiarSeleccion={cambiarSeleccion} />
      ) : (
        <PasoResultado resultado={resultado} onCerrar={onCerrarDeVerdad} onImportarOtro={reiniciar} />
      )}

      {/* Footer de acción — la acción principal del paso (si hay una) arriba,
          Minimizar/Cancelar debajo como botones de texto completo, pero
          SOLO cuando hay algo real que minimizar/cancelar: en "subir" sin
          elegir archivo todavía no hay ningún trabajo en curso (nada que
          "seguir en segundo plano"), así que ahí no se muestran — cerrar
          con la X de siempre ya es equivalente a cancelar, sin necesitar
          confirmación porque no hay nada que perder. Aparecen recién con
          hayTrabajoEnCurso (calibrar/revisar, o un fetch en vuelo incluido
          "subir" mientras cargando) y nunca en "resultado" (ya terminó,
          solo Listo/Importar otro, ver PasoResultado).
          Padding-bottom: SOLO safe-area (notch/gestos del sistema), sin
          --store-bottom-nav-h — el wizard es un overlay fixed inset-0 que
          TAPA la bottom-nav por completo (mismo patrón que el formulario
          de producto/detalle), no convive con ella como las screens
          normales. Sumar la altura de una barra que no se ve dejaba un
          hueco de aire vacío innecesario debajo del botón. */}
      {paso !== 'resultado' && (paso !== 'subir' || hayTrabajoEnCurso) && (
        <div className="shrink-0 px-5 pt-4 border-t border-slate-100 dark:border-white/8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
          {/* El error de "subir" ya se muestra dentro de PasoSubir.jsx —
              acá solo para calibrar/revisar/aplicar. */}
          {error && paso !== 'subir' && <p className="text-xs text-danger font-medium mb-2 text-center">{error}</p>}

          {paso === 'calibrar' && (
            <button
              onClick={confirmarCalibracion}
              disabled={cargando || !calibracionLista(mapeo)}
              className="w-full sm:max-w-sm sm:mx-auto flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand hover:bg-brand-light text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-2"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar'}
            </button>
          )}
          {paso === 'revisar' && !cargando && diff && (diff.altas.length > 0 || diff.actualizaciones.length > 0 || diff.posiblesBajas.length > 0) && (() => {
            // Mismo criterio que PasoRevisar.jsx (esPrimeraImportacion): con
            // el catálogo vacío TODO cae en altas — "Aplicar cambios" no
            // tiene sentido cuando no hay ningún "antes" del que se esté
            // cambiando algo, se siente como importar por primera vez.
            const esPrimeraImportacion = diff.actualizaciones.length === 0 && diff.posiblesBajas.length === 0 && diff.altas.length > 0;
            const total = seleccion.altas.size + seleccion.actualizaciones.size + seleccion.bajas.size;
            return (
              <button
                onClick={aplicar}
                className="w-full sm:max-w-sm sm:mx-auto flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand hover:bg-brand-light text-white font-bold text-sm transition-colors mb-2"
              >
                {esPrimeraImportacion ? `Importar catálogo (${total})` : `Aplicar cambios (${total})`}
              </button>
            );
          })()}

          {hayTrabajoEnCurso && (
            <div className="flex gap-2 w-full sm:max-w-sm sm:mx-auto">
              {/* Minimizar: siempre disponible mientras hay trabajo en
                  curso, incluso cargando — el trabajo sigue corriendo en
                  segundo plano, no hay nada que "interrumpir" al ocultar
                  la UI. */}
              <button
                onClick={pedirMinimizar}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:bg-brand/10 hover:text-brand text-xs font-bold transition-colors"
              >
                <Minus className="w-3.5 h-3.5" /> Minimizar
              </button>
              {/* Cancelar de verdad: descarta el progreso, pide
                  confirmación (hay algo real que perder acá). */}
              <button
                onClick={pedirCancelar}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:bg-danger/10 hover:text-danger text-xs font-bold transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      <ModalConfirmar
        abierto={pidiendoConfirmacion}
        titulo="¿Cancelar la importación?"
        mensaje="Vas a perder el progreso de esta importación. Si preferís, podés minimizarla y seguir después."
        textoCancelar="Seguir acá"
        textoConfirmar="Cancelar"
        tono="warn"
        onCancelar={cancelarCancelar}
        onConfirmar={confirmarCancelar}
      />
    </div>
  );
}
