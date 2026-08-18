// ImportadorPrecios — wizard fullscreen (mismo patrón de overlay que
// ProductoDetail en ProductosScreen.jsx) que junta los 3 pasos del backend
// (calibrar → sincronizar → aplicar, ver functions/.netlify/functions/
// importador.js) en un único flujo guiado: subir archivo → confirmar
// columnas (se salta solo si ya hay calibración guardada para esa
// estructura) → revisar el plan de cambios → aplicar → confirmación.
//
// Nada se escribe en el catálogo hasta el último paso, y ahí el usuario ya
// eligió exactamente qué aplicar — ni una sola escritura automática sin
// revisión humana en el medio (ver diseño en la memoria
// lokal-links-importar-precios-excel-pdf).
import React, { useState } from 'react';
import { X, Loader2, ChevronLeft } from 'lucide-react';
import { apiFetch } from '../../../api';
import { PasoSubir } from './PasoSubir.jsx';
import { PasoCalibrar, calibracionLista } from './PasoCalibrar.jsx';
import { PasoRevisar } from './PasoRevisar.jsx';
import { PasoResultado } from './PasoResultado.jsx';

const API_BASE = '/.netlify/functions';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const PASOS = ['subir', 'calibrar', 'revisar', 'resultado'];
const TITULOS_PASO = {
  subir: 'Importar precios',
  calibrar: 'Confirmar columnas',
  revisar: 'Revisar cambios',
  resultado: 'Listo',
};

export function ImportadorPrecios({ tiendaId, onClose, onAplicado }) {
  const [paso, setPaso] = useState('subir');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const [archivo, setArchivo] = useState(null); // { fileName, contentType, fileData }
  const [calibracion, setCalibracion] = useState(null); // respuesta de "calibrar"
  const [mapeo, setMapeo] = useState({});
  const [diff, setDiff] = useState(null); // respuesta de "sincronizar"
  const [corridaId, setCorridaId] = useState(null);
  const [seleccion, setSeleccion] = useState({ altas: new Set(), actualizaciones: new Set(), bajas: new Set(), ambiguos: new Map() });
  const [resultado, setResultado] = useState(null);

  const llamarImportador = async (action, body) => {
    const res = await apiFetch(`${API_BASE}/importador?action=${action}`, {
      method: 'POST', authRequired: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Algo salió mal, probá de nuevo');
    return data;
  };

  const manejarArchivoElegido = async (file) => {
    setError(null);
    setCargando(true);
    try {
      const fileData = await fileToBase64(file);
      const payload = { tiendaId, fileName: file.name, contentType: file.type, fileData };
      setArchivo(payload);

      const resp = await llamarImportador('calibrar', payload);
      setCalibracion(resp);

      if (resp.calibracionReusada) {
        // Ya conocemos esta estructura — saltamos calibración manual y
        // vamos directo a sincronizar con el mapeo guardado.
        setMapeo(resp.mapeo);
        await sincronizar(payload, resp.mapeo);
      } else {
        const mapeoInicial = {};
        resp.sugerencias.forEach((s) => { mapeoInicial[s.header] = s.campo || 'ignorar'; });
        setMapeo(mapeoInicial);
        setPaso('calibrar');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const sincronizar = async (payload, mapeoAUsar) => {
    setCargando(true);
    setError(null);
    try {
      const resp = await llamarImportador('sincronizar', { ...payload, mapeo: mapeoAUsar });
      setDiff(resp);
      setCorridaId(resp.corridaId);
      // Preselección optimista: todo lo de confianza alta viene marcado
      // (altas y actualizaciones), los ambiguos y las bajas quedan sin
      // marcar — requieren una decisión explícita, no un default.
      setSeleccion({
        altas: new Set(resp.altas.map((_, i) => i)),
        actualizaciones: new Set(resp.actualizaciones.map((a) => a.productoId)),
        bajas: new Set(),
        ambiguos: new Map(),
      });
      setPaso('revisar');
    } catch (e) {
      setError(e.message);
      setPaso('subir');
    } finally {
      setCargando(false);
    }
  };

  const confirmarCalibracion = () => sincronizar(archivo, mapeo);

  const cambiarMapeo = (header, campo) => setMapeo((prev) => ({ ...prev, [header]: campo }));

  const cambiarSeleccion = (grupo, key, valor) => {
    setSeleccion((prev) => {
      const next = { ...prev };
      if (grupo === 'ambiguos') {
        next.ambiguos = new Map(prev.ambiguos);
        next.ambiguos.set(key, valor);
      } else {
        next[grupo] = new Set(prev[grupo]);
        if (next[grupo].has(key)) next[grupo].delete(key); else next[grupo].add(key);
      }
      return next;
    });
  };

  const aplicar = async () => {
    setCargando(true);
    setError(null);
    try {
      const altasAAplicar = diff.altas.filter((_, i) => seleccion.altas.has(i));
      const actualizacionesAAplicar = diff.actualizaciones.filter((a) => seleccion.actualizaciones.has(a.productoId));
      const bajasAAplicar = [...seleccion.bajas];
      const ambiguosConfirmados = diff.ambiguos
        .map((amb, i) => ({ amb, confirmado: seleccion.ambiguos.get(i) }))
        .filter((x) => x.confirmado === true)
        .map((x) => ({ productoId: x.amb.candidatoId, señalTipo: 'nombre', señalValor: x.amb.fila.nombre }));

      const resp = await llamarImportador('aplicar', {
        tiendaId, corridaId,
        altas: altasAAplicar, actualizaciones: actualizacionesAAplicar,
        bajas: bajasAAplicar, ambiguosConfirmados,
      });
      setResultado(resp);
      setPaso('resultado');
      onAplicado?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const reiniciar = () => {
    setPaso('subir'); setArchivo(null); setCalibracion(null); setMapeo({});
    setDiff(null); setCorridaId(null);
    setSeleccion({ altas: new Set(), actualizaciones: new Set(), bajas: new Set(), ambiguos: new Map() });
    setResultado(null); setError(null);
  };

  const volver = () => {
    if (paso === 'calibrar') { setPaso('subir'); setError(null); return; }
    if (paso === 'revisar' && !calibracion?.calibracionReusada) { setPaso('calibrar'); setError(null); return; }
  };

  const indicePaso = PASOS.indexOf(paso);
  const puedeVolver = paso === 'calibrar' || (paso === 'revisar' && !calibracion?.calibracionReusada);

  return (
    <div className="fixed inset-0 z-[6000] bg-surface-card flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 px-3 h-14 border-b border-slate-100 dark:border-white/8">
        {puedeVolver ? (
          <button onClick={volver} className="ui-icon-btn text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 transition-colors shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : <div className="w-9" />}
        <p className="font-black flex-1 truncate text-sm text-center">{TITULOS_PASO[paso]}</p>
        {cargando && <Loader2 className="w-4 h-4 animate-spin text-brand shrink-0" />}
        <button onClick={onClose} className="ui-icon-btn text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progreso — solo en los 3 primeros pasos, el resultado no es "un paso más" */}
      {paso !== 'resultado' && (
        <div className="shrink-0 px-5 pt-3">
          <div className="h-1 bg-surface-card-2 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${((indicePaso + 1) / 3) * 100}%` }} />
          </div>
        </div>
      )}

      {cargando && paso === 'subir' && !error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
          <p className="text-sm text-ink-dim font-medium">Leyendo tu archivo...</p>
        </div>
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
      ) : paso === 'revisar' ? (
        <PasoRevisar diff={diff} seleccion={seleccion} onCambiarSeleccion={cambiarSeleccion} />
      ) : (
        <PasoResultado resultado={resultado} onCerrar={onClose} onImportarOtro={reiniciar} />
      )}

      {/* Footer de acción — solo en calibrar y revisar (subir tiene su propio CTA visual, resultado también) */}
      {paso === 'calibrar' && (
        <div className="shrink-0 px-5 py-4 border-t border-slate-100 dark:border-white/8">
          {error && <p className="text-xs text-danger font-medium mb-2 text-center">{error}</p>}
          <button
            onClick={confirmarCalibracion}
            disabled={cargando || !calibracionLista(mapeo)}
            className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-light text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar'}
          </button>
        </div>
      )}
      {paso === 'revisar' && diff && (diff.altas.length > 0 || diff.actualizaciones.length > 0 || diff.posiblesBajas.length > 0) && (
        <div className="shrink-0 px-5 py-4 border-t border-slate-100 dark:border-white/8">
          {error && <p className="text-xs text-danger font-medium mb-2 text-center">{error}</p>}
          <button
            onClick={aplicar}
            disabled={cargando}
            className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-light text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : `Aplicar cambios (${seleccion.altas.size + seleccion.actualizaciones.size + seleccion.bajas.size})`}
          </button>
        </div>
      )}
    </div>
  );
}
