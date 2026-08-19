// useImportador — todo el estado y las llamadas de red del wizard de
// importación, separado del componente visual (ImportadorPrecios.jsx)
// para que pueda vivir en StoreApp.jsx (nivel que sobrevive mientras el
// usuario navega entre pantallas) en vez de en ProductosScreen (se
// desmonta al cambiar de pantalla, y con él se perdía todo el progreso).
//
// Por qué esto importa: antes, minimizar/cerrar el wizard significaba
// perder el archivo ya subido y la corrida en curso — la única opción
// era "esperá acá mirando la pantalla" o "abandoná y arrancá de cero".
// Con el estado acá arriba, minimizar solo oculta la UI: el fetch de
// calibrar/sincronizar/aplicar sigue corriendo igual, y el resultado
// llega aunque el usuario esté en otra pantalla — un chip flotante
// (ver ImportadorFlotante.jsx) avisa cuando termina.
import { useCallback, useRef, useState } from 'react';
import { apiFetch } from '../../../api';

const API_BASE = '/.netlify/functions';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const ESTADO_INICIAL = {
  paso: 'subir',
  cargando: false,
  error: null,
  archivo: null,
  archivoInfo: null,
  calibracion: null,
  mapeo: {},
  diff: null,
  corridaId: null,
  seleccion: { altas: new Set(), actualizaciones: new Set(), bajas: new Set(), ambiguos: new Map() },
  resultado: null,
};

export function useImportador(tiendaId, { onAplicado } = {}) {
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  // Ref espejo del estado para leer el valor MÁS RECIENTE dentro de
  // callbacks async que pueden resolver después de que el componente
  // visual ya se desmontó (minimizado) — evita capturar un `paso`/
  // `archivo` viejo por closure.
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  const patch = useCallback((cambios) => {
    setEstado((prev) => {
      const next = typeof cambios === 'function' ? cambios(prev) : { ...prev, ...cambios };
      estadoRef.current = next;
      return next;
    });
  }, []);

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

  const sincronizar = useCallback(async (payload, mapeoAUsar) => {
    patch({ cargando: true, error: null });
    try {
      const resp = await llamarImportador('sincronizar', { ...payload, mapeo: mapeoAUsar });
      patch({
        diff: resp,
        corridaId: resp.corridaId,
        // Preselección optimista: todo lo de confianza alta viene marcado
        // (altas y actualizaciones), los ambiguos y las bajas quedan sin
        // marcar — requieren una decisión explícita, no un default.
        seleccion: {
          altas: new Set(resp.altas.map((_, i) => i)),
          actualizaciones: new Set(resp.actualizaciones.map((a) => a.productoId)),
          bajas: new Set(),
          ambiguos: new Map(),
        },
        paso: 'revisar',
        cargando: false,
      });
    } catch (e) {
      patch({ error: e.message, paso: 'subir', cargando: false });
    }
  }, [patch]);

  const manejarArchivoElegido = useCallback(async (file) => {
    patch({ error: null, cargando: true, archivoInfo: { name: file.name, size: file.size } });
    try {
      const fileData = await fileToBase64(file);
      const payload = { tiendaId, fileName: file.name, contentType: file.type, fileData };
      patch({ archivo: payload });

      const resp = await llamarImportador('calibrar', payload);
      patch({ calibracion: resp });

      if (resp.calibracionReusada) {
        // Ya conocemos esta estructura — saltamos calibración manual y
        // vamos directo a sincronizar con el mapeo guardado.
        patch({ mapeo: resp.mapeo });
        await sincronizar(payload, resp.mapeo);
      } else {
        const mapeoInicial = {};
        resp.sugerencias.forEach((s) => { mapeoInicial[s.header] = s.campo || 'ignorar'; });
        patch({ mapeo: mapeoInicial, paso: 'calibrar', cargando: false });
      }
    } catch (e) {
      patch({ error: e.message, cargando: false });
    }
  }, [tiendaId, patch, sincronizar]);

  const confirmarCalibracion = useCallback(() => {
    const { archivo, mapeo } = estadoRef.current;
    return sincronizar(archivo, mapeo);
  }, [sincronizar]);

  const cambiarMapeo = useCallback((header, campo) => {
    patch((prev) => ({ mapeo: { ...prev.mapeo, [header]: campo } }));
  }, [patch]);

  const cambiarSeleccion = useCallback((grupo, key, valor) => {
    patch((prev) => {
      const next = { ...prev.seleccion };
      if (grupo === 'ambiguos') {
        next.ambiguos = new Map(prev.seleccion.ambiguos);
        next.ambiguos.set(key, valor);
      } else {
        next[grupo] = new Set(prev.seleccion[grupo]);
        if (next[grupo].has(key)) next[grupo].delete(key); else next[grupo].add(key);
      }
      return { seleccion: next };
    });
  }, [patch]);

  const aplicar = useCallback(async () => {
    patch({ cargando: true, error: null });
    try {
      const { diff, seleccion, corridaId } = estadoRef.current;
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
      patch({ resultado: resp, paso: 'resultado', cargando: false });
      onAplicado?.();
    } catch (e) {
      patch({ error: e.message, cargando: false });
    }
  }, [tiendaId, patch, onAplicado]);

  const reiniciar = useCallback(() => patch({ ...ESTADO_INICIAL }), [patch]);

  const volver = useCallback(() => {
    const { paso, calibracion } = estadoRef.current;
    if (paso === 'calibrar') { patch({ paso: 'subir', error: null }); return; }
    if (paso === 'revisar' && !calibracion?.calibracionReusada) { patch({ paso: 'calibrar', error: null }); return; }
  }, [patch]);

  // hayTrabajoEnCurso — usado tanto por la confirmación de cierre como por
  // el chip flotante: hay algo real que se perdería si se descarta del
  // todo (no solo "minimizar", sino cerrar en serio con reiniciar()).
  const hayTrabajoEnCurso = estado.paso === 'calibrar' || estado.paso === 'revisar' || estado.cargando;

  return {
    ...estado,
    hayTrabajoEnCurso,
    manejarArchivoElegido, confirmarCalibracion, cambiarMapeo, cambiarSeleccion,
    aplicar, reiniciar, volver,
  };
}
