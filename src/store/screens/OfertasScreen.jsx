// OfertasScreen — pantalla "Ofertas" del admin (tiendas con módulo
// 'ofertas', sin catálogo real). Primera de las 5 pantallas grandes
// extraídas en la Fase 3 — mismo criterio que el shell: recibe todo por
// props explícitas, sin rediseñar su estado (sigue viviendo en StoreApp.jsx
// y controlando el formulario a través de setters pasados por prop).
import React, { useState } from 'react';
import {
  Tag, Plus, Loader2, Package, EyeOff, CalendarClock, X, AlertTriangle,
  RotateCcw, Trash2, ToggleRight, ToggleLeft, Edit3,
} from 'lucide-react';
import { SkeletonProductosGrid } from '../../Skeletons';
import LazyImg from '../../LazyImg';
import { StorePageHeader } from '../components/StorePageHeader.jsx';
import { ProductosOfertasToggle } from '../components/ProductosOfertasToggle.jsx';
import { useCapaUI } from '../navegacion/useCapaUI.js';

export function OfertasScreen({
  ambosModulosActivos, subScreenProductos, setSubScreenProductos,
  misProductosSinFiltrar, setMisProductos, loadingProductos, tiendaId,
  ofertaShowForm, setOfertaEditing, setOfertaForm, setOfertaFotoFile, setOfertaFotoPreview,
  setOfertaIntentoGuardar, setOfertaFotoRemoved, setOfertaFotoLoading, setOfertaShowForm,
  ofertaConfirmDelete, setOfertaConfirmDelete,
  handleCancelarOfertaAdmin, handleReintentarOfertaAdmin,
  apiFetch, API_BASE, haptic,
  isDark, toggleTheme, onOpenAccount, renderAccountAvatar,
}) {
  const [vaciarConfirm, setVaciarConfirm] = useState(false);
  const [vaciando, setVaciando] = useState(false);
  // TEMPORAL — diagnóstico del bug "vacío la lista pero al refrescar
  // vuelve": llama a _debug-ofertas.js (endpoint temporal, solo-admin) vía
  // apiFetch, que sí arma el header Authorization — pegar la URL directo
  // en la barra del navegador no manda ese token, por eso hacía falta este
  // botón. BORRAR junto con _debug-ofertas.js una vez resuelto.
  const [debugResult, setDebugResult] = useState(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const correrDiagnostico = async () => {
    setDebugLoading(true);
    setDebugResult(null);
    try {
      const res = await apiFetch(`${API_BASE}/_debug-ofertas?tiendaId=${tiendaId}`, { authRequired: true });
      const data = await res.json();
      setDebugResult(res.ok ? data : { error: data?.error || `HTTP ${res.status}` });
    } catch (e) {
      setDebugResult({ error: e.message });
    } finally {
      setDebugLoading(false);
    }
  };
  // Capa de UI ↔ historial: el atrás nativo cierra este modal en vez de
  // salir de la app (ver src/store/navegacion/uiStack.js). El formulario
  // de oferta (ofertaShowForm) se registra en StoreApp.jsx, donde vive su
  // estado.
  useCapaUI({ abierto: !!ofertaConfirmDelete, onCerrar: () => setOfertaConfirmDelete(null) });
  useCapaUI({ abierto: vaciarConfirm, onCerrar: () => setVaciarConfirm(false) });

  // Shadowing intencional de misProductos (el estado real, sin filtrar,
  // sigue existiendo afuera de este componente — el badge del nav y la
  // búsqueda de ítems en Mensajes lo necesitan completo). Filtra por
  // _origen (marcado en useProductosOfertas.js según de qué endpoint —
  // /productos o /ofertas — vino cada ítem), NO por `typeof precio`: un
  // producto de catálogo real con precio null/vacío (fila del importador
  // sin precio en el Excel) igual tiene _origen:'catalogo', así que ya no
  // aparece acá por error. Con un solo módulo activo, este filtro no
  // cambia nada (ambosModulosActivos da false y misProductos pasa igual).
  const misProductos = ambosModulosActivos
    ? misProductosSinFiltrar.filter(o => o._origen !== 'catalogo')
    : misProductosSinFiltrar;

  const openNew = () => {
    setOfertaEditing(null);
    setOfertaForm({ nombre: '', expireAt: '', visible: true });
    setOfertaFotoFile(null); setOfertaFotoPreview(null);
    setOfertaIntentoGuardar(false);
    setOfertaShowForm(true);
  };

  const openEdit = (o) => {
    setOfertaEditing(o);
    setOfertaForm({
      nombre: o.nombre || '',
      expireAt: o.expireAt ? new Date(o.expireAt).toISOString().slice(0, 10) : '',
      visible: o.visible !== false,
    });
    setOfertaFotoFile(null); setOfertaFotoPreview(null);
    // Sin este reset, ofertaFotoRemoved/ofertaFotoLoading quedaban con el
    // valor de una apertura ANTERIOR del formulario (ej. si la vez pasada
    // se quitó la foto con la X, ofertaFotoRemoved seguía en true acá) —
    // eso hacía que hayFotoValida diera false y la vista previa mostrara
    // el placeholder "Elegir foto" en vez de la foto real ya guardada.
    setOfertaFotoRemoved(false);
    setOfertaFotoLoading(false);
    setOfertaIntentoGuardar(false);
    setOfertaShowForm(true);
  };

  const toggleVisible = async (o) => {
    haptic('medium');
    const updated = { ...o, visible: !o.visible };
    setMisProductos(prev => prev.map(x => x.id === o.id ? updated : x));
    try {
      const res = await apiFetch(`${API_BASE}/ofertas`, { method: 'PATCH', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: o.id, visible: updated.visible }) });
      if (!res.ok) throw new Error();
      haptic('success');
    } catch {
      setMisProductos(prev => prev.map(x => x.id === o.id ? o : x));
      haptic('error');
    }
  };

  const deleteOferta = async (id) => {
    haptic('heavy');
    const original = misProductos.find(o => o.id === id);
    setMisProductos(prev => prev.filter(o => o.id !== id));
    try {
      const res = await apiFetch(`${API_BASE}/ofertas?id=${id}`, { method: 'DELETE', authRequired: true });
      if (!res.ok) throw new Error();
    } catch {
      if (original) setMisProductos(prev => [...prev, original]);
    }
  };

  // Vaciado masivo — pensado para "quiero volver a cargar todo desde
  // cero" (ej. después de haber importado por error a Ofertas en vez de
  // Catálogo). Borra en el servidor de una sola vez (?tiendaId&all=1, ver
  // ofertas.js) en vez de N deletes por id — con cientos de ítems, un
  // delete-por-uno sería demasiado lento y frágil (cualquier fallo a mitad
  // de camino deja el borrado a medias).
  const vaciarTodas = async () => {
    if (!tiendaId) return;
    haptic('heavy');
    setVaciando(true);
    try {
      const res = await apiFetch(`${API_BASE}/ofertas?tiendaId=${tiendaId}&all=1`, { method: 'DELETE', authRequired: true });
      if (!res.ok) throw new Error();
      setMisProductos(prev => prev.filter(o => String(o.tiendaId) !== String(tiendaId)));
      haptic('success');
    } catch {
      haptic('error');
    } finally {
      setVaciando(false);
      setVaciarConfirm(false);
    }
  };

  if (ofertaShowForm) return null;

  const vencida = (o) => o.expireAt && new Date(o.expireAt).getTime() < Date.now();

  const OfertaCard = ({ o }) => {
    const estaVencida = vencida(o);
    const inactiva = o.visible === false || estaVencida;
    // Card en subida optimista: mismo criterio que la carga rápida desde la
    // tienda pública — foto real (blob) + spinner mientras sube, o borde
    // rojo + "Reintentar" si falló. Sin _status, es una oferta normal ya
    // persistida (comportamiento de siempre).
    const pending = o._status === 'uploading';
    const failed = o._status === 'error';
    return (
      <div className={`bg-surface-card rounded-2xl overflow-hidden border transition-all ${failed ? 'border-danger/50' : inactiva ? 'border-dashed border-slate-200 dark:border-white/10 opacity-55' : 'border-slate-100 dark:border-white/8 hover:shadow-md hover:shadow-black/5'}`}>
        {/* aspect-[1/1.414] — MISMA proporción que la card de oferta en la
            vista pública real (commerce-modern.jsx, sección Ofertas:
            aspectRatio '1/1.414'), antes era 1:1 cuadrado acá — la preview
            del admin no reflejaba cómo se ve la foto encuadrada en la
            tienda real. */}
        <div className="aspect-[1/1.414] bg-surface-card-2 dark:bg-white/6 relative overflow-hidden">
          {o.imageUrl ? <LazyImg src={o.thumbUrl || o.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-ink-dim dark:text-white/20" /></div>}
          {/* Estado (Vencida/Oculta) a la izquierda, fecha a la derecha —
              antes ambos vivían en el mismo top-2 right-2, se hubieran
              superpuesto si coexistían. */}
          {estaVencida && (
            <span
              className="absolute top-2 left-2 flex items-center gap-1 text-white text-[11px] font-bold leading-none tracking-wide px-2.5 py-[5px] rounded-full"
              style={{ background: 'rgba(220,38,38,.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.15)' }}
            >
              <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
              Vencida
            </span>
          )}
          {!estaVencida && o.visible === false && (
            <span
              className="absolute top-2 left-2 flex items-center gap-1 text-white text-[11px] font-bold leading-none tracking-wide px-2.5 py-[5px] rounded-full"
              style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.1)' }}
            >
              <EyeOff className="w-3 h-3" strokeWidth={2.5} />
              Oculta
            </span>
          )}
          {/* Badge flotante en vez de línea de texto abajo: antes la fecha
              era una <p> condicional dentro del bloque de texto, así que
              una card con fecha medía más alto que la de al lado sin
              fecha — mismo grid, distinta altura, los botones de acción
              quedaban desalineados entre columnas. Como badge sobre la
              foto, el bloque de texto de abajo (nombre + botones) siempre
              tiene la MISMA estructura fija, sin nada condicional que le
              cambie el alto. */}
          {o.expireAt && (
            <span
              className="absolute top-2 right-2 flex items-center gap-1 text-white text-[11px] font-bold leading-none tracking-wide px-2.5 py-[5px] rounded-full"
              style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.1)' }}
            >
              <CalendarClock className="w-3 h-3" strokeWidth={2.5} />
              {new Date(o.expireAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
          {/* Spinner grande con X cancelable en el centro — mismo patrón
              que subir una foto por WhatsApp: el círculo de progreso ES el
              botón de cancelar, no un ícono puramente decorativo. Antes
              era un Loader2 chico sin acción; ahora aborta el request real
              (AbortController) y descarta la card. */}
          {pending && (
            <button
              onClick={() => handleCancelarOfertaAdmin(o._localId)}
              aria-label="Cancelar subida"
              className="absolute inset-0 bg-black/45 flex items-center justify-center"
            >
              <span className="relative w-12 h-12 flex items-center justify-center">
                <Loader2 className="absolute inset-0 w-12 h-12 text-white/90 animate-spin" strokeWidth={2.5} />
                <X className="w-5 h-5 text-white" strokeWidth={2.5} />
              </span>
            </button>
          )}
          {failed && (
            <div className="absolute inset-0 bg-danger/80 flex flex-col items-center justify-center gap-1 text-white text-center px-2">
              <AlertTriangle className="w-6 h-6" />
              <span className="text-[10px] font-bold">No se pudo subir</span>
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="font-bold text-[12px] leading-snug line-clamp-2 mb-1.5 text-center">{o.nombre}</p>
          {failed ? (
            // Solo Reintentar/Eliminar mientras está en error — Ocultar/
            // Editar no aplican todavía porque no hay id real de servidor.
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => handleReintentarOfertaAdmin(o._localId)}
                className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-brand/10 text-[10px] font-bold text-brand hover:bg-brand/20 transition-colors">
                <RotateCcw className="w-4 h-4" />
                Reintentar
              </button>
              <button onClick={() => setMisProductos(prev => prev.filter(x => x._localId !== o._localId))}
                className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-surface-card-2 dark:bg-white/8 text-[10px] font-bold text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors">
                <Trash2 className="w-4 h-4" />
                Descartar
              </button>
            </div>
          ) : (
            // 3 columnas iguales (no "1 ancho + 2 chicos de solo ícono") —
            // antes Editar/Eliminar eran cuadraditos de w-8 con ícono de
            // 3px, muy chicos para tocar cómodo en mobile. Ahora las 3
            // acciones tienen el mismo peso visual y área de toque.
            // Deshabilitadas mientras pending: todavía no hay id real.
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => toggleVisible(o)} disabled={pending}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-colors disabled:opacity-50 ${o.visible !== false ? 'bg-surface-card-2 dark:bg-white/8 text-ink-dim' : 'bg-brand/10 text-brand'}`}>
                {o.visible !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {o.visible !== false ? 'Ocultar' : 'Mostrar'}
              </button>
              <button onClick={() => openEdit(o)} disabled={pending}
                className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-surface-card-2 dark:bg-white/8 text-[10px] font-bold text-ink-dim hover:bg-brand/10 hover:text-brand transition-colors disabled:opacity-50">
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
              <button onClick={() => setOfertaConfirmDelete(o.id)} disabled={pending}
                className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-surface-card-2 dark:bg-white/8 text-[10px] font-bold text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="h-[100dvh] flex flex-col sa-page-bg">
      <StorePageHeader
        title="Ofertas"
        subtitle={`${misProductos.length} publicación${misProductos.length !== 1 ? 'es' : ''}`}
        icon={Tag}
        leftSlot={ambosModulosActivos ? <ProductosOfertasToggle value={subScreenProductos} onChange={setSubScreenProductos} /> : null}
        isDark={isDark} toggleTheme={toggleTheme}
        onOpenAccount={onOpenAccount} renderAccountAvatar={renderAccountAvatar}
        actionSlot={(
          <>
            {loadingProductos && <Loader2 className="w-4 h-4 animate-spin text-ink-dim shrink-0" />}
            {/* TEMPORAL — ver comentario junto a correrDiagnostico arriba */}
            <button onClick={correrDiagnostico} disabled={debugLoading} className="h-10 px-3 flex items-center gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl transition-colors shrink-0" title="Diagnóstico temporal">
              {debugLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Debug'}
            </button>
            {misProductos.length > 0 && (
              // 40x40 — misma altura/ancho que el avatar de cuenta y el
              // resto de acciones del header (antes w-8 h-8, más chico).
              <button onClick={() => setVaciarConfirm(true)} aria-label="Vaciar todas las ofertas" title="Vaciar todas"
                className="w-10 h-10 flex items-center justify-center rounded-xl text-ink-dim hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {/* Solo desktop: en móvil el FAB del bottom-nav ya crea */}
            <button onClick={openNew} className="hidden lg:flex h-10 items-center gap-1.5 bg-brand hover:bg-brand-light text-white text-sm font-bold px-3 rounded-xl transition-colors shrink-0 shadow-sm shadow-brand/20">
              <Plus className="w-4 h-4" /><span className="hidden sm:inline">Nueva</span>
            </button>
          </>
        )}
      />

      {loadingProductos && misProductos.length === 0 ? (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-[calc(var(--store-bottom-nav-h)_+_1rem)] lg:pb-4">
          <SkeletonProductosGrid cols={2} count={6} />
        </div>
      ) : misProductos.length === 0 && !loadingProductos ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4 pb-[var(--store-bottom-nav-h)] lg:pb-0">
          <div className="w-16 h-16 rounded-3xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
            <Package className="w-8 h-8 text-brand" />
          </div>
          <div>
            <h3 className="font-black text-xl mb-1">Sin ofertas aún</h3>
            <p className="text-sm text-ink-dim max-w-[220px]">Publicá tu primera oferta para que tus clientes la vean</p>
          </div>
          <button onClick={openNew} className="h-10 px-6 flex items-center bg-brand hover:bg-brand-light text-white rounded-2xl font-bold transition-colors shadow-lg shadow-brand/25">
            Crear primera oferta
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-[calc(var(--store-bottom-nav-h)_+_1rem)] lg:pb-4">
          {/* Barra de resumen — contexto de gestión, no repite lo que ya
              muestra la pantalla de Estadísticas. */}
          <div className="flex items-center gap-4 px-1 pb-4 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-ink-dim">
              <span className="w-2 h-2 rounded-full bg-ok shrink-0" />
              {misProductos.filter(o => o.visible !== false && !vencida(o)).length} activas
            </span>
            {misProductos.some(o => vencida(o)) && (
              <span className="flex items-center gap-1.5 font-semibold text-ink-dim">
                <span className="w-2 h-2 rounded-full bg-danger shrink-0" />
                {misProductos.filter(o => vencida(o)).length} vencidas
              </span>
            )}
            {misProductos.some(o => o.visible === false && !vencida(o)) && (
              <span className="flex items-center gap-1.5 font-semibold text-ink-dim">
                <span className="w-2 h-2 rounded-full bg-ink-dim shrink-0" />
                {misProductos.filter(o => o.visible === false && !vencida(o)).length} ocultas
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {misProductos.map(o => <OfertaCard key={o.id} o={o} />)}
          </div>
          {/* Espaciador = SOLO la altura del nav (78px), sin sumar nada
              extra: el propio p-4 de este contenedor ya aporta 16px de
              padding-bottom real después de la última fila — el mismo aire
              que hay a los costados. Ese padding + el espaciador exacto del
              nav dan el mismo margen visible que el lateral, sin duplicar
              ningún aire. Sumarle algo más acá (como antes, +16 o +18px)
              desalineaba de nuevo el resultado. */}
          <div style={{ height: 84 }} className="lg:hidden" aria-hidden="true" />
        </div>
      )}
    </div>

    {ofertaConfirmDelete && (
      <div className="fixed inset-0 z-[6000] bg-black/50 flex items-center justify-center p-4" onClick={() => setOfertaConfirmDelete(null)}>
        <div className="bg-surface-card rounded-3xl p-6 max-w-xs w-full" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="font-black text-lg text-center mb-1">¿Eliminar esta oferta?</h3>
          <p className="text-sm text-ink-dim text-center mb-6">Esta acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <button onClick={() => setOfertaConfirmDelete(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim dark:text-ink-dim">Cancelar</button>
            <button onClick={() => { deleteOferta(ofertaConfirmDelete); setOfertaConfirmDelete(null); }} className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    )}

    {vaciarConfirm && (
      <div className="fixed inset-0 z-[6000] bg-black/50 flex items-center justify-center p-4" onClick={() => !vaciando && setVaciarConfirm(false)}>
        <div className="bg-surface-card rounded-3xl p-6 max-w-xs w-full" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="font-black text-lg text-center mb-1">¿Vaciar todas las ofertas?</h3>
          <p className="text-sm text-ink-dim text-center mb-6">
            Se van a borrar las {misProductos.length} publicaciones de esta pantalla. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setVaciarConfirm(false)} disabled={vaciando} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim dark:text-ink-dim disabled:opacity-50">Cancelar</button>
            <button onClick={vaciarTodas} disabled={vaciando} className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
              {vaciando ? <Loader2 className="w-4 h-4 animate-spin" /> : `Vaciar todas`}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* TEMPORAL — ver comentario junto a correrDiagnostico arriba */}
    {debugResult && (
      <div className="fixed inset-0 z-[6000] bg-black/50 flex items-center justify-center p-4" onClick={() => setDebugResult(null)}>
        <div className="bg-surface-card rounded-3xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
          <h3 className="font-black text-lg mb-3">Diagnóstico (temporal)</h3>
          <pre className="text-xs bg-surface-card-2 dark:bg-white/8 rounded-xl p-3 overflow-auto max-h-80 whitespace-pre-wrap">
            {JSON.stringify(debugResult, null, 2)}
          </pre>
          <button onClick={() => setDebugResult(null)} className="w-full mt-4 py-2.5 rounded-2xl bg-brand text-white text-sm font-bold">Cerrar</button>
        </div>
      </div>
    )}
    </>
  );
}
