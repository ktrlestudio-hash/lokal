// PasoRevisar — muestra el plan de sincronización que devolvió
// "sincronizar" (altas/actualizaciones/ambiguos/posiblesBajas) y deja al
// usuario decidir qué aplicar antes de tocar el catálogo real. Nada se
// escribe hasta que confirma — ver accionAplicar en importador.js.
//
// Diseño clave: el mismo componente sirve tanto para "primera carga" (todo
// cae en altas, sin actualizaciones/bajas) como para "actualizar precios"
// (la mayoría cae en actualizaciones, con altas para productos nuevos del
// proveedor y posiblesBajas para los que dejaron de aparecer) — el usuario
// nunca elige un "modo", el plan se arma solo según lo que matcheó.
import React, { useMemo, useState } from 'react';
import {
  PackagePlus, RefreshCw, HelpCircle, PackageX, ChevronDown, ChevronUp,
  CheckCircle2, Search, X,
} from 'lucide-react';

function formatoPrecio(n) {
  return n == null ? '—' : `$${Number(n).toLocaleString('es')}`;
}

function ChipPrecio({ children, tono = 'brand' }) {
  const tonos = {
    brand: 'bg-brand/10 text-brand-dark dark:text-brand',
    ok: 'bg-ok/10 text-ok-dark dark:text-ok',
    dim: 'bg-surface-card-2 dark:bg-white/8 text-ink-dim',
  };
  return <span className={`shrink-0 text-xs font-black px-2 py-1 rounded-lg ${tonos[tono]}`}>{children}</span>;
}

function SeccionColapsable({ icono: Icono, color, titulo, subtitulo, count, children, defaultAbierto = false }) {
  const [abierto, setAbierto] = useState(defaultAbierto);
  if (count === 0) return null;
  return (
    <div className="bg-surface-card-2 dark:bg-white/5 rounded-2xl overflow-hidden">
      <button onClick={() => setAbierto((v) => !v)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color.bg}`}>
          <Icono className={`w-4 h-4 ${color.text}`} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{titulo}</p>
          <p className="text-xs text-ink-dim">{subtitulo}</p>
        </div>
        <span className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${color.bg} ${color.text}`}>{count}</span>
        {abierto ? <ChevronUp className="w-4 h-4 text-ink-dim shrink-0" /> : <ChevronDown className="w-4 h-4 text-ink-dim shrink-0" />}
      </button>
      {abierto && <div className="px-4 pb-4 space-y-2">{children}</div>}
    </div>
  );
}

export function PasoRevisar({ diff, seleccion, onCambiarSeleccion }) {
  const { altas, actualizaciones, ambiguos, posiblesBajas } = diff;
  const [busqueda, setBusqueda] = useState('');

  const q = busqueda.trim().toLowerCase();

  const actualizacionesFiltradas = useMemo(() => actualizaciones.filter((a) => !q || (a.nombre || '').toLowerCase().includes(q)), [actualizaciones, q]);
  const altasFiltradas = useMemo(() => altas.filter((a) => !q || (a.nombre || '').toLowerCase().includes(q)), [altas, q]);
  const ambiguosFiltrados = useMemo(() => ambiguos.filter((a) => !q || (a.fila.nombre || '').toLowerCase().includes(q)), [ambiguos, q]);
  const bajasFiltradas = useMemo(() => posiblesBajas.filter((p) => !q || (p.nombre || '').toLowerCase().includes(q)), [posiblesBajas, q]);

  const resumen = useMemo(() => ({
    altas: altas.length,
    actualizaciones: actualizaciones.length,
    ambiguos: ambiguos.length,
    bajas: posiblesBajas.length,
  }), [altas, actualizaciones, ambiguos, posiblesBajas]);

  const sinCambios = resumen.altas === 0 && resumen.actualizaciones === 0 && resumen.ambiguos === 0 && resumen.bajas === 0;

  if (sinCambios) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
        <div className="w-14 h-14 rounded-3xl bg-ok/10 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-ok-dark dark:text-ok" />
        </div>
        <div>
          <h3 className="font-black text-lg mb-1">Ya está todo al día</h3>
          <p className="text-sm text-ink-dim max-w-xs">No encontramos diferencias entre este archivo y tu catálogo actual.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div className="px-5 py-5 max-w-lg mx-auto space-y-3">
        <div>
          <h2 className="font-black text-lg mb-1">Revisá los cambios</h2>
          <p className="text-sm text-ink-dim">Elegí qué aplicar. Nada se guarda hasta que confirmes al final.</p>
        </div>

        {/* Buscador — filtra por nombre en las 4 secciones a la vez, útil
            cuando el archivo trae cientos de filas y el usuario busca un
            producto puntual para revisar antes de aplicar todo. */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-dim" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-8 pr-8 py-2 bg-surface-card-2 dark:bg-white/5 rounded-xl text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-brand transition-all border border-transparent focus:border-brand/20"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-dim">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Actualizaciones de precio/stock — el caso más común al re-importar */}
        <SeccionColapsable
          icono={RefreshCw} color={{ bg: 'bg-brand/10', text: 'text-brand' }}
          titulo="Productos a actualizar" subtitulo="Precio, stock u otro dato cambió"
          count={actualizacionesFiltradas.length} defaultAbierto
        >
          {actualizacionesFiltradas.map((act) => (
            <label key={act.productoId} className="flex items-center gap-3 bg-surface-card rounded-xl px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={seleccion.actualizaciones.has(act.productoId)}
                onChange={() => onCambiarSeleccion('actualizaciones', act.productoId)}
                className="w-4 h-4 rounded accent-brand shrink-0"
              />
              <p className="flex-1 min-w-0 text-sm font-semibold truncate">{act.nombre}</p>
              {'precio' in act.cambios && <ChipPrecio>{formatoPrecio(act.cambios.precio)}</ChipPrecio>}
              {'stock' in act.cambios && !('precio' in act.cambios) && <ChipPrecio tono="dim">Stock: {act.cambios.stock}</ChipPrecio>}
            </label>
          ))}
        </SeccionColapsable>

        {/* Altas — productos nuevos que no existían */}
        <SeccionColapsable
          icono={PackagePlus} color={{ bg: 'bg-ok/10', text: 'text-ok-dark dark:text-ok' }}
          titulo="Productos nuevos" subtitulo="No estaban en tu catálogo"
          count={altasFiltradas.length} defaultAbierto
        >
          {altasFiltradas.map((alta, i) => (
            <label key={i} className="flex items-center gap-3 bg-surface-card rounded-xl px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={seleccion.altas.has(i)}
                onChange={() => onCambiarSeleccion('altas', i)}
                className="w-4 h-4 rounded accent-brand shrink-0"
              />
              <p className="flex-1 min-w-0 text-sm font-semibold truncate">{alta.nombre || 'Sin nombre'}</p>
              <ChipPrecio tono="ok">{formatoPrecio(alta.precio)}</ChipPrecio>
            </label>
          ))}
        </SeccionColapsable>

        {/* Ambiguos — el matching no está seguro, pide confirmación puntual */}
        <SeccionColapsable
          icono={HelpCircle} color={{ bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' }}
          titulo="No estamos seguros" subtitulo="Confirmá si es el mismo producto"
          count={ambiguosFiltrados.length}
        >
          {ambiguosFiltrados.map((amb, i) => (
            <div key={i} className="bg-surface-card rounded-xl px-3 py-2.5">
              <p className="text-xs text-ink-dim mb-1">En el archivo: <strong className="text-ink">{amb.fila.nombre}</strong></p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`ambiguo-${i}`}
                  checked={seleccion.ambiguos.get(i) === true}
                  onChange={() => onCambiarSeleccion('ambiguos', i, true)}
                  className="accent-brand"
                />
                <span className="text-sm">Es el mismo producto que ya tenés (coincidencia {Math.round((amb.score || 0) * 100)}%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="radio"
                  name={`ambiguo-${i}`}
                  checked={seleccion.ambiguos.get(i) === false}
                  onChange={() => onCambiarSeleccion('ambiguos', i, false)}
                  className="accent-brand"
                />
                <span className="text-sm">Es un producto distinto</span>
              </label>
            </div>
          ))}
        </SeccionColapsable>

        {/* Posibles bajas — nunca se borran solos, siempre confirmación explícita */}
        <SeccionColapsable
          icono={PackageX} color={{ bg: 'bg-danger/8', text: 'text-danger' }}
          titulo="Ya no aparecen en el archivo" subtitulo="¿Los ocultamos de tu tienda?"
          count={bajasFiltradas.length}
        >
          {bajasFiltradas.map((p) => (
            <label key={p.id} className="flex items-center gap-3 bg-surface-card rounded-xl px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={seleccion.bajas.has(p.id)}
                onChange={() => onCambiarSeleccion('bajas', p.id)}
                className="w-4 h-4 rounded accent-danger shrink-0"
              />
              <p className="flex-1 min-w-0 text-sm font-semibold truncate">{p.nombre}</p>
              <ChipPrecio tono="dim">{formatoPrecio(p.precio)}</ChipPrecio>
            </label>
          ))}
        </SeccionColapsable>
      </div>
    </div>
  );
}
