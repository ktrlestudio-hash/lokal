// ProductosScreen — pantalla "Mis productos" del admin (tiendas con módulo
// 'catalogo'). Segunda de las 5 pantallas grandes extraídas en la Fase 3 —
// mismo criterio que OfertasScreen: recibe todo por props explícitas, sin
// rediseñar su manejo de estado.
import React, { useState } from 'react';
import {
  Loader2, Zap, Plus, Package, AlertTriangle, Search, ArrowUpDown, CheckCircle,
  ListFilter, LayoutGrid, LayoutList, ToggleRight, ToggleLeft, Edit3, Trash2,
  ChevronLeft, ChevronRight, X, Tag, UploadCloud,
} from 'lucide-react';
import { SkeletonProductosGrid } from '../../Skeletons';
import LazyImg from '../../LazyImg';
import { StorePageHeader } from '../components/StorePageHeader.jsx';
import { ImportadorPrecios } from '../components/importador/ImportadorPrecios.jsx';
import { ProductosOfertasToggle } from '../components/ProductosOfertasToggle.jsx';

export function ProductosScreen({
  tiendaId, fetchMisProductos, sidebarExpanded,
  ambosModulosActivos, subScreenProductos, setSubScreenProductos,
  misProductosSinFiltrar, setMisProductos, loadingProductos,
  productoShowForm, setProductoShowForm, productoEditing, setProductoEditing,
  productoForm, setProductoForm, productoFotoFiles, setProductoFotoFiles,
  productoFotoPreviews, setProductoFotoPreviews, productoSaving, setProductoSaving,
  productoSaveErr, setProductoSaveErr, setProductoAttributes,
  productLimit, isEmprendimiento,
  quickPriceOpen, setQuickPriceOpen, QuickPriceEditor,
  prodFilter, setProdFilter, prodCondicion, setProdCondicion,
  prodSinStock, setProdSinStock, prodDescuento, setProdDescuento,
  prodSearch, setProdSearch, prodSort, setProdSort, prodView, setProdView,
  prodFilterSheet, setProdFilterSheet, confirmDelete, setConfirmDelete,
  prodDetail, setProdDetail, prodDetailPhotoIdx, setProdDetailPhotoIdx,
  prodDetailEditField, setProdDetailEditField, prodDetailDraft, setProdDetailDraft,
  prodDetailSaving, setProdDetailSaving, prodDetailPhotoConfirm, setProdDetailPhotoConfirm,
  primerBadge, apiFetch, API_BASE, haptic,
  isDark, toggleTheme, onOpenAccount, renderAccountAvatar,
}) {
  const [importadorOpen, setImportadorOpen] = useState(false);
  // Shadowing simétrico al de OfertasScreen (ver comentario ahí): con
  // ambos módulos activos, esta pantalla solo muestra ítems CON precio
  // (productos de catálogo reales) — sin este filtro, mostraba también las
  // ofertas simples sin precio, duplicando exactamente lo que ya aparece en
  // OfertasScreen.
  const misProductos = ambosModulosActivos
    ? misProductosSinFiltrar.filter(o => typeof o.precio === 'number')
    : misProductosSinFiltrar;

  const showForm = productoShowForm;
  const setShowForm = setProductoShowForm;
  const editingProducto = productoEditing;
  const setEditingProducto = setProductoEditing;
  const form = productoForm;
  const setForm = setProductoForm;
  const fotoFiles = productoFotoFiles;
  const setFotoFiles = setProductoFotoFiles;
  const fotoPreviews = productoFotoPreviews;
  const setFotoPreviews = setProductoFotoPreviews;
  const saving = productoSaving;
  const setSaving = setProductoSaving;
  const saveErr = productoSaveErr;
  const setSaveErr = setProductoSaveErr;

  const openNew = () => {
    const activeProducts = misProductos.filter(o => o.activa !== false).length;
    if (activeProducts >= productLimit) {
      alert(`Llegaste al límite de ${productLimit} productos. ${isEmprendimiento ? 'Upgrade a Empresa para más.' : 'Upgrade a Premium para ilimitados.'}`);
      return;
    }
    setEditingProducto(null);
    setForm({ titulo: '', descripcion: '', precio: '', precioOriginal: '', badgesForzados: null, financiacion: '', presentacion: '', stock: '1', condicion: 'nuevo', categoryId: null, contactoWhatsapp: '' });
    setFotoFiles([]); setFotoPreviews([]);
    setSaveErr(null); setProductoAttributes({});
    setShowForm(true);
  };

  const openEdit = (o) => {
    setEditingProducto(o);
    setForm({ titulo: o.titulo, descripcion: o.descripcion || '', precio: o.precio || '', precioOriginal: o.precioOriginal || '', badgesForzados: o.badgesForzados || null, financiacion: o.financiacion || '', presentacion: o.presentacion || '', stock: o.stock ?? '1', condicion: o.condicion || 'nuevo', categoryId: o.categoryId || null, contactoWhatsapp: o.contactoWhatsapp || '' });
    setFotoFiles([]); setFotoPreviews(o.fotos || []);
    setSaveErr(null); setProductoAttributes(o.attributes || {});
    setShowForm(true);
  };

  // saving/saveErr y handleFotos/handleSave (subida vía formulario largo)
  // no se usan en este render — el formulario en sí vive en otro componente
  // (ProductoForm), acá solo se dispara su apertura (openNew/openEdit).

  const toggleActiva = async (producto) => {
    haptic('medium');
    const updated = { ...producto, activa: !producto.activa };
    // Optimistic — actualiza UI antes del server
    setMisProductos(prev => prev.map(o => o.id === producto.id ? updated : o));
    try {
      const res = await apiFetch(`${API_BASE}/ofertas`, { method: 'PATCH', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: producto.id, activa: updated.activa }) });
      if (!res.ok) throw new Error();
      haptic('success');
    } catch {
      // Rollback si falla
      setMisProductos(prev => prev.map(o => o.id === producto.id ? producto : o));
      haptic('error');
    }
  };

  const deleteProducto = async (id) => {
    haptic('heavy');
    // Optimistic — saca de la lista inmediatamente
    const original = misProductos.find(o => o.id === id);
    setMisProductos(prev => prev.filter(o => o.id !== id));
    try {
      const res = await apiFetch(`${API_BASE}/ofertas?id=${id}`, { method: 'DELETE', authRequired: true });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback
      if (original) setMisProductos(prev => [...prev, original]);
    }
  };

  if (showForm) return null;

  const activos  = misProductos.filter(o => o.activa !== false);
  const pausados = misProductos.filter(o => o.activa === false);
  const usados   = activos.length;
  const pct      = productLimit === Infinity ? 0 : Math.min(100, Math.round((usados / productLimit) * 100));
  const nearLimit = productLimit !== Infinity && usados >= productLimit * 0.9;

  const activeFilterCount = (prodFilter !== 'todos' ? 1 : 0) + (prodCondicion ? 1 : 0) + (prodSinStock ? 1 : 0) + (prodDescuento ? 1 : 0);

  const clearFilters = () => { setProdFilter('todos'); setProdCondicion(null); setProdSinStock(false); setProdDescuento(false); setProdSearch(''); };

  const filtered = misProductos
    .filter(o => {
      const q = prodSearch.toLowerCase();
      if (q && !o.titulo?.toLowerCase().includes(q) && !o.descripcion?.toLowerCase().includes(q)) return false;
      if (prodFilter === 'activos' && o.activa === false) return false;
      if (prodFilter === 'pausados' && o.activa !== false) return false;
      if (prodCondicion && o.condicion !== prodCondicion) return false;
      if (prodSinStock && Number(o.stock) !== 0) return false;
      if (prodDescuento && !(o.precioOriginal && o.precio && Number(o.precioOriginal) > Number(o.precio))) return false;
      return true;
    })
    .sort((a, b) => {
      if (prodSort === 'precio-asc')  return (a.precio || Infinity) - (b.precio || Infinity);
      if (prodSort === 'precio-desc') return (b.precio || 0) - (a.precio || 0);
      if (prodSort === 'nombre')      return (a.titulo || '').localeCompare(b.titulo || '');
      return 0; // recientes: orden del array original
    });

  const SORT_OPTS = [
    { value: 'recientes', label: 'Más recientes' },
    { value: 'nombre',    label: 'Nombre A-Z' },
    { value: 'precio-asc',  label: 'Menor precio' },
    { value: 'precio-desc', label: 'Mayor precio' },
  ];

  const chipCls = (active) => `w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
    active ? 'bg-brand/10 dark:bg-brand/15 text-brand-dark dark:text-brand' : 'text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'
  }`;

  // Card grilla
  const GridCard = ({ o }) => {
    const vc = primerBadge(o);
    const img = o.fotos?.[0];
    const sinStock = o.stock != null && Number(o.stock) === 0;
    return (
      <div onClick={() => { setProdDetail(o); setProdDetailPhotoIdx(0); setProdDetailEditField(null); }} className={`bg-surface-card rounded-2xl overflow-hidden border transition-all group cursor-pointer ${o.activa !== false ? 'border-slate-100 dark:border-white/8 hover:shadow-md hover:shadow-black/5' : 'border-dashed border-slate-200 dark:border-white/10 opacity-50'}`}>
        {/* Foto */}
        <div className="aspect-square bg-gradient-to-br from-surface-card-2 to-surface-card-2 dark:from-white/6 dark:to-white/10 relative overflow-hidden">
          {img ? <LazyImg src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-ink-dim dark:text-white/20" /></div>}
          {/* Badge ventaja */}
          {vc && <span className={`absolute top-2 left-2 ${vc.badgeClass} text-[9px] font-bold px-1.5 py-0.5 rounded-xl flex items-center gap-1 shadow`}><vc.Icon className={`w-2.5 h-2.5 ${vc.iconClass}`} />{vc.label}</span>}
          {/* Badge sin stock */}
          {sinStock && <span className="absolute top-2 right-2 bg-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xl shadow">Sin stock</span>}
          {/* Acciones hover — desktop only */}
          <div className="absolute inset-x-0 bottom-0 hidden lg:flex gap-1 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
            <button onClick={e => { e.stopPropagation(); toggleActiva(o); }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold text-white transition-colors ${o.activa !== false ? 'bg-white/20 hover:bg-white/30' : 'bg-brand/80 hover:bg-brand'}`}>
              {o.activa !== false ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
              {o.activa !== false ? 'Pausar' : 'Activar'}
            </button>
            <button onClick={e => { e.stopPropagation(); openEdit(o); }} className="flex items-center justify-center w-7 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
              <Edit3 className="w-3 h-3" />
            </button>
            <button onClick={e => { e.stopPropagation(); setConfirmDelete(o.id); }} className="flex items-center justify-center w-7 rounded-xl bg-white/20 hover:bg-rose-500/80 text-white transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {/* Info + acciones */}
        <div className="p-2.5">
          <p className="font-bold text-[12px] leading-snug line-clamp-2 mb-1">{o.titulo}</p>
          <div className="flex items-center justify-between gap-1 mb-2">
            {o.precio != null
              ? <span className="text-sm font-black text-ink">${Number(o.precio).toLocaleString('es')}</span>
              : <span className="text-[10px] text-ink-dim italic">Sin precio</span>}
            {o.condicion && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${o.condicion === 'nuevo' ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>{o.condicion === 'nuevo' ? 'Nuevo' : 'Usado'}</span>}
          </div>
          {/* Acciones móvil — siempre visibles */}
          <div className="lg:hidden flex gap-1">
            <button onClick={e => { e.stopPropagation(); toggleActiva(o); }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${o.activa !== false ? 'bg-surface-card-2 dark:bg-white/8 text-ink-dim' : 'bg-brand/10 text-brand'}`}>
              {o.activa !== false ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
              {o.activa !== false ? 'Pausar' : 'Activar'}
            </button>
            <button onClick={e => { e.stopPropagation(); openEdit(o); }} className="flex items-center justify-center w-8 rounded-xl text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 hover:text-brand transition-colors">
              <Edit3 className="w-3 h-3" />
            </button>
            <button onClick={e => { e.stopPropagation(); setConfirmDelete(o.id); }} className="flex items-center justify-center w-8 rounded-xl text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Card lista
  const ListCard = ({ o }) => {
    const vc = primerBadge(o);
    const img = o.fotos?.[0];
    const sinStock = o.stock != null && Number(o.stock) === 0;
    return (
      <div onClick={() => { setProdDetail(o); setProdDetailPhotoIdx(0); setProdDetailEditField(null); }} className={`bg-surface-card rounded-2xl border overflow-hidden flex gap-0 transition-all cursor-pointer ${o.activa !== false ? 'border-slate-100 dark:border-white/8 hover:shadow-md hover:shadow-black/5' : 'border-dashed border-slate-200 dark:border-white/10 opacity-55'}`}>
        {/* Foto */}
        <div className="relative w-24 shrink-0 bg-gradient-to-br from-surface-card-2 to-surface-card-2 dark:from-white/6 dark:to-white/10 overflow-hidden">
          {img ? <LazyImg src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-7 h-7 text-ink-dim dark:text-white/20" /></div>}
          {vc && <span className={`absolute top-1.5 left-1.5 ${vc.badgeClass} text-[8px] font-bold px-1 py-0.5 rounded-lg flex items-center gap-0.5 shadow`}><vc.Icon className={`w-2 h-2 ${vc.iconClass}`} />{vc.label}</span>}
          {sinStock && <span className="absolute bottom-1.5 left-1.5 bg-danger text-white text-[8px] font-bold px-1 py-0.5 rounded-lg shadow">Sin stock</span>}
        </div>
        {/* Contenido */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between gap-1.5">
          {/* Top: título + dot estado */}
          <div className="flex items-start gap-1.5">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13px] leading-snug line-clamp-2">{o.titulo}</p>
              {o.descripcion && <p className="text-[11px] text-ink-dim line-clamp-1 mt-0.5">{o.descripcion}</p>}
            </div>
            <span className={`shrink-0 w-2 h-2 rounded-full mt-1 ${o.activa !== false ? 'bg-ok' : 'bg-ink-dim dark:bg-ink-dim'}`} />
          </div>
          {/* Bottom: precio + badges + acciones */}
          <div className="flex items-center gap-1.5">
            {o.precio != null
              ? <span className="text-sm font-black text-ink">${Number(o.precio).toLocaleString('es')}</span>
              : <span className="text-[10px] text-ink-dim italic">Sin precio</span>}
            {o.precioOriginal && o.precio && Number(o.precioOriginal) > Number(o.precio) && (
              <span className="text-[10px] text-ink-dim line-through">${Number(o.precioOriginal).toLocaleString('es')}</span>
            )}
            {o.condicion && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${o.condicion === 'nuevo' ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>{o.condicion === 'nuevo' ? 'N' : 'U'}</span>}
            {/* Acciones — empujar a la derecha */}
            <div className="ml-auto flex items-center gap-1">
              <button onClick={e => { e.stopPropagation(); toggleActiva(o); }}
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${o.activa !== false ? 'bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:bg-surface-card-2' : 'bg-brand/10 text-brand hover:bg-brand/20'}`}
                title={o.activa !== false ? 'Pausar' : 'Activar'}>
                {o.activa !== false ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
              </button>
              <button onClick={e => { e.stopPropagation(); openEdit(o); }}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-ink-dim hover:bg-brand/10 hover:text-brand transition-colors"
                title="Editar">
                <Edit3 className="w-3 h-3" />
              </button>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(o.id); }}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors"
                title="Eliminar">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Detalle de producto (overlay) ──────────────────────────────────────
  const ProductoDetail = () => {
    if (!prodDetail) return null;
    const o = prodDetail;
    const fotos = o.fotos?.length ? o.fotos : [];
    const vc = primerBadge(o);

    const saveField = async (field, value) => {
      const parsed = field === 'precio' || field === 'precioOriginal' ? (value ? Number(value) : null) : value.trim() || null;
      setProdDetailSaving(true);
      try {
        const res = await apiFetch(`${API_BASE}/ofertas`, {
          method: 'PATCH', authRequired: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: o.id, [field]: parsed }),
        });
        if (res.ok) {
          const updated = { ...o, [field]: parsed };
          setProdDetail(updated);
          setMisProductos(prev => prev.map(p => p.id === o.id ? updated : p));
        }
      } catch { /* silencioso */ }
      finally { setProdDetailSaving(false); setProdDetailEditField(null); }
    };

    const removePhoto = async (idx) => {
      const nuevasFotos = fotos.filter((_, i) => i !== idx);
      setProdDetailSaving(true);
      try {
        const res = await apiFetch(`${API_BASE}/ofertas`, {
          method: 'PATCH', authRequired: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: o.id, fotos: nuevasFotos }),
        });
        if (res.ok) {
          const updated = { ...o, fotos: nuevasFotos };
          setProdDetail(updated);
          setMisProductos(prev => prev.map(p => p.id === o.id ? updated : p));
          setProdDetailPhotoIdx(Math.min(prodDetailPhotoIdx, nuevasFotos.length - 1));
        }
      } catch { /* silencioso */ }
      finally { setProdDetailSaving(false); setProdDetailPhotoConfirm(null); }
    };

    const InlineField = ({ field, value, display, multiline = false, placeholder = '—' }) => {
      const editing = prodDetailEditField === field;
      if (editing) {
        const El = multiline ? 'textarea' : 'input';
        return (
          <div className="relative">
            <El
              autoFocus
              defaultValue={prodDetailDraft}
              onBlur={e => saveField(field, e.target.value)}
              onKeyDown={e => { if (!multiline && e.key === 'Enter') { e.preventDefault(); saveField(field, e.target.value); } if (e.key === 'Escape') { setProdDetailEditField(null); } }}
              className={`w-full bg-brand/5 dark:bg-brand/10 border border-brand/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none ${multiline ? 'min-h-[80px]' : ''}`}
            />
            {prodDetailSaving && <Loader2 className="absolute right-2 top-2 w-3.5 h-3.5 animate-spin text-brand" />}
          </div>
        );
      }
      return (
        <button
          onClick={() => { setProdDetailEditField(field); setProdDetailDraft(value ?? ''); }}
          className="group/field flex items-start gap-1.5 w-full text-left hover:bg-surface-card-2 dark:hover:bg-white/5 rounded-xl px-3 py-2 -mx-3 transition-colors"
        >
          <span className="flex-1">{display ?? value ?? <span className="text-ink-dim italic">{placeholder}</span>}</span>
          <Edit3 className="w-3 h-3 text-ink-dim group-hover/field:text-brand shrink-0 mt-0.5 transition-colors" />
        </button>
      );
    };

    return (
      <div className="fixed inset-0 z-[6000] bg-surface-card flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="shrink-0 flex items-center gap-2 px-3 h-14 border-b border-slate-100 dark:border-white/8">
          <button onClick={() => setProdDetail(null)} className="ui-icon-btn text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 transition-colors shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="font-black flex-1 truncate text-sm">{o.titulo}</p>
          {prodDetailSaving && <Loader2 className="w-4 h-4 animate-spin text-brand shrink-0" />}
          <button onClick={() => { setProdDetail(null); toggleActiva(o); }}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${o.activa !== false ? 'bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:bg-surface-card-2' : 'bg-brand/10 text-brand hover:bg-brand/20'}`}>
            {o.activa !== false ? 'Pausar' : 'Activar'}
          </button>
          <div className="w-px h-5 bg-surface-card-2 dark:bg-white/10 shrink-0" />
          <button onClick={() => { setProdDetail(null); openEdit(o); }} className="ui-icon-btn text-ink-dim hover:bg-brand/10 hover:text-brand transition-colors shrink-0" title="Editar formulario">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => { setProdDetail(null); setConfirmDelete(o.id); }} className="ui-icon-btn text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors shrink-0" title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Body scrolleable */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Carrusel de fotos */}
          {fotos.length > 0 ? (
            <div className="relative bg-black select-none">
              <div className="aspect-[4/3] max-h-80 overflow-hidden flex items-center justify-center">
                <img src={fotos[prodDetailPhotoIdx]} alt="" className="w-full h-full object-contain" />
              </div>
              {/* X eliminar foto */}
              <button
                onClick={() => setProdDetailPhotoConfirm(prodDetailPhotoIdx)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-danger/80 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Flechas navegación */}
              {fotos.length > 1 && (
                <>
                  <button onClick={() => setProdDetailPhotoIdx(i => (i - 1 + fotos.length) % fotos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setProdDetailPhotoIdx(i => (i + 1) % fotos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {fotos.map((_, i) => (
                      <button key={i} onClick={() => setProdDetailPhotoIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === prodDetailPhotoIdx ? 'bg-white w-4' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] max-h-72 bg-surface-card-2 dark:bg-surface-card-2 flex items-center justify-center">
              <Package className="w-16 h-16 text-ink-dim dark:text-ink-dim" />
            </div>
          )}

          {/* Info editable */}
          <div className="px-5 py-5 space-y-5 max-w-2xl mx-auto">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {o.activa === false && <span className="text-xs font-bold bg-surface-card-2 dark:bg-white/10 text-ink-dim px-3 py-1 rounded-xl">Pausado</span>}
              {o.condicion && <span className={`text-xs font-bold px-3 py-1 rounded-xl ${o.condicion === 'nuevo' ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>{o.condicion === 'nuevo' ? 'Nuevo' : 'Usado'}</span>}
              {vc && <span className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 ${vc.badgeClass}`}><vc.Icon className={`w-3 h-3 ${vc.iconClass}`} />{vc.label}</span>}
            </div>

            {/* Título */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-1">Título</p>
              <p className="font-black text-xl leading-snug">
                <InlineField field="titulo" value={o.titulo} />
              </p>
            </div>

            {/* Precio */}
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-1">Precio</p>
                <div className="font-black text-2xl text-brand-dark dark:text-brand">
                  <InlineField field="precio" value={String(o.precio ?? '')} display={o.precio != null ? `$${Number(o.precio).toLocaleString('es')}` : null} placeholder="Sin precio" />
                </div>
              </div>
              {(o.precioOriginal || prodDetailEditField === 'precioOriginal') && (
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-1">Precio original</p>
                  <div className="text-ink-dim line-through text-lg">
                    <InlineField field="precioOriginal" value={String(o.precioOriginal ?? '')} display={o.precioOriginal ? `$${Number(o.precioOriginal).toLocaleString('es')}` : null} placeholder="—" />
                  </div>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-1">Descripción</p>
              <div className="text-sm text-ink-dim dark:text-ink-dim leading-relaxed">
                <InlineField field="descripcion" value={o.descripcion ?? ''} multiline placeholder="Sin descripción" />
              </div>
            </div>

            {/* Presentación */}
            {(o.presentacion || prodDetailEditField === 'presentacion') && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-1">Presentación</p>
                <div className="text-sm text-ink-dim dark:text-ink-dim">
                  <InlineField field="presentacion" value={o.presentacion ?? ''} placeholder="—" />
                </div>
              </div>
            )}

            {/* Financiación */}
            {(o.financiacion || prodDetailEditField === 'financiacion') && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-1">Financiación</p>
                <div className="text-sm text-ink-dim dark:text-ink-dim">
                  <InlineField field="financiacion" value={o.financiacion ?? ''} placeholder="—" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal confirmar eliminar foto */}
        {prodDetailPhotoConfirm !== null && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4" onClick={() => setProdDetailPhotoConfirm(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative bg-surface-card rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="font-black text-lg text-center mb-1">¿Eliminar esta foto?</h3>
              <p className="text-sm text-ink-dim text-center mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setProdDetailPhotoConfirm(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim dark:text-ink-dim">Cancelar</button>
                <button onClick={() => removePhoto(prodDetailPhotoConfirm)} className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors">
                  {prodDetailSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    {ProductoDetail()}
    <div className="h-[100dvh] flex flex-col sa-page-bg">
      {/* Header */}
      <StorePageHeader
        title="Mis productos"
        subtitle={`${misProductos.length} publicación${misProductos.length !== 1 ? 'es' : ''} · ${activos.length} activa${activos.length !== 1 ? 's' : ''}`}
        leftSlot={ambosModulosActivos ? <ProductosOfertasToggle value={subScreenProductos} onChange={setSubScreenProductos} /> : null}
        isDark={isDark} toggleTheme={toggleTheme}
        onOpenAccount={onOpenAccount} renderAccountAvatar={renderAccountAvatar}
        actionSlot={(
          <>
            {loadingProductos && <Loader2 className="w-4 h-4 animate-spin text-ink-dim shrink-0" />}
            <button onClick={() => setImportadorOpen(true)} className="flex items-center gap-1.5 bg-surface-card-2 dark:bg-white/8 hover:bg-brand/10 text-ink dark:text-ink-dim hover:text-brand text-sm font-bold px-3 py-1.5 rounded-xl transition-colors shrink-0" title="Importar lista de precios desde Excel, CSV o JSON">
              <UploadCloud className="w-4 h-4" /><span>Importar</span>
            </button>
            {activos.length > 0 && (
              <button onClick={() => setQuickPriceOpen(true)} className="flex items-center gap-1.5 bg-surface-card-2 dark:bg-white/8 hover:bg-brand/10 text-ink dark:text-ink-dim hover:text-brand text-sm font-bold px-3 py-1.5 rounded-xl transition-colors shrink-0" title="Editar precios uno por uno">
                <Zap className="w-4 h-4" /><span className="hidden sm:inline">Precio rápido</span>
              </button>
            )}
            {/* Solo desktop: en móvil el FAB del bottom-nav ya crea */}
            <button onClick={openNew} className="hidden lg:flex items-center gap-1.5 bg-brand hover:bg-brand-light text-white text-sm font-bold px-3 py-1.5 rounded-xl transition-colors shrink-0 shadow-sm shadow-brand/20">
              <Plus className="w-4 h-4" /><span className="hidden sm:inline">Nuevo</span>
            </button>
          </>
        )}
      />

      {quickPriceOpen && (
        <QuickPriceEditor
          productos={activos}
          onClose={() => setQuickPriceOpen(false)}
          onSaved={(id, patch) => setMisProductos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))}
        />
      )}

      {importadorOpen && (
        <ImportadorPrecios
          tiendaId={tiendaId}
          sidebarExpanded={sidebarExpanded}
          onClose={() => setImportadorOpen(false)}
          onAplicado={() => fetchMisProductos?.()}
        />
      )}

      {loadingProductos && misProductos.length === 0 ? (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 lg:pb-4">
          <SkeletonProductosGrid cols={2} count={6} />
        </div>
      ) : misProductos.length === 0 && !loadingProductos ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4 pb-24 lg:pb-0">
          <div className="w-16 h-16 rounded-3xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
            <Package className="w-8 h-8 text-brand" />
          </div>
          <div>
            <h3 className="font-black text-xl mb-1">Sin productos aún</h3>
            <p className="text-sm text-ink-dim">Publicá tu primer producto para que los clientes te encuentren</p>
          </div>
          <div className="flex flex-col items-center gap-2.5">
            <button onClick={openNew} className="px-6 py-3 bg-brand hover:bg-brand-light text-white rounded-2xl font-bold transition-colors shadow-lg shadow-brand/25">
              Crear primer producto
            </button>
            <button onClick={() => setImportadorOpen(true)} className="flex items-center gap-1.5 text-sm font-bold text-ink-dim hover:text-brand transition-colors py-1.5">
              <UploadCloud className="w-3.5 h-3.5" /> o importar desde Excel/CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">

          {/* ── Sidebar izquierda (desktop) ── */}
          <div className="hidden lg:flex flex-col w-56 xl:w-64 border-r border-slate-100 dark:border-white/8 bg-surface-card shrink-0 overflow-y-auto no-scrollbar">
            <div className="p-4 space-y-5">

              {/* Capacidad */}
              {productLimit !== Infinity && (
                <div className={`rounded-2xl px-3 py-2.5 ${nearLimit ? 'bg-warn/8' : 'bg-surface-card-2 dark:bg-white/5'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${nearLimit ? 'text-warn-dark dark:text-warn' : 'text-ink-dim'}`}>Capacidad</p>
                    {nearLimit && <AlertTriangle className="w-3 h-3 text-warn" />}
                  </div>
                  <p className={`text-sm font-black mb-1.5 ${nearLimit ? 'text-warn-dark dark:text-warn' : 'text-ink dark:text-ink-dim'}`}>{usados} / {productLimit}</p>
                  <div className="h-1.5 bg-surface-card-2 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${nearLimit ? 'bg-warn' : 'bg-brand'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              {/* Estado */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-dim mb-2">Estado</p>
                <div className="space-y-0.5">
                  {[['todos', `Todos`, misProductos.length], ['activos', 'Activos', activos.length], ['pausados', 'Pausados', pausados.length]].map(([v, label, count]) => (
                    <button key={v} onClick={() => setProdFilter(v)} className={chipCls(prodFilter === v)}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${v === 'activos' ? 'bg-ok' : v === 'pausados' ? 'bg-ink-dim dark:bg-ink-dim' : 'bg-brand'}`} />
                      {label}
                      <span className="ml-auto text-[10px] font-black text-ink-dim">{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Condición */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-dim mb-2">Condición</p>
                <div className="space-y-0.5">
                  {[['nuevo', 'Nuevo'], ['usado', 'Usado']].map(([v, label]) => (
                    <button key={v} onClick={() => setProdCondicion(prodCondicion === v ? null : v)} className={chipCls(prodCondicion === v)}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${v === 'nuevo' ? 'bg-ok' : 'bg-amber-400'}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtros rápidos */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-dim mb-2">Filtros</p>
                <div className="space-y-0.5">
                  <button onClick={() => setProdSinStock(v => !v)} className={chipCls(prodSinStock)}>
                    <Package className="w-3 h-3 shrink-0" /> Sin stock
                  </button>
                  <button onClick={() => setProdDescuento(v => !v)} className={chipCls(prodDescuento)}>
                    <Tag className="w-3 h-3 shrink-0" /> Con descuento
                  </button>
                </div>
              </div>

              {/* Limpiar */}
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="w-full text-xs font-bold text-ink-dim hover:text-brand transition-colors py-1.5">
                  Limpiar filtros ({activeFilterCount})
                </button>
              )}
            </div>
          </div>

          {/* ── Contenido derecho ── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-surface-card border-b border-slate-100 dark:border-white/8 shrink-0">
              {/* Búsqueda */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-dim" />
                <input value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-8 pr-8 py-2 bg-surface-card-2 dark:bg-white/5 rounded-xl text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-brand transition-all border border-transparent focus:border-brand/20" />
                {prodSearch && <button onClick={() => setProdSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-dim"><X className="w-3 h-3" /></button>}
              </div>

              {/* Sort */}
              <div className="relative group shrink-0">
                <button className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${prodSort !== 'recientes' ? 'bg-brand text-white' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
                <div className="absolute right-0 top-full mt-1.5 bg-surface-card rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50 min-w-[160px] hidden group-focus-within:block">
                  {SORT_OPTS.map(o => (
                    <button key={o.value} onClick={() => setProdSort(o.value)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors text-left ${prodSort === o.value ? 'bg-surface-card-2 dark:bg-white/5 font-bold text-brand' : 'text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5'}`}>
                      {prodSort === o.value && <CheckCircle className="w-3 h-3 text-brand shrink-0" />}
                      <span className={prodSort === o.value ? '' : 'pl-4'}>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtros mobile */}
              <button onClick={() => setProdFilterSheet(true)} className={`lg:hidden relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${activeFilterCount > 0 ? 'bg-brand text-white' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
                <ListFilter className="w-3.5 h-3.5" />
                {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-warn text-white text-[8px] font-black rounded-full flex items-center justify-center">{activeFilterCount}</span>}
              </button>

              {/* View toggle */}
              <div className="flex gap-0.5 bg-surface-card-2 dark:bg-white/8 rounded-xl p-0.5 shrink-0">
                <button onClick={() => setProdView('grid')} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${prodView === 'grid' ? 'bg-white dark:bg-surface-card-2 shadow-sm text-ink dark:text-white' : 'text-ink-dim'}`}>
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setProdView('lista')} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${prodView === 'lista' ? 'bg-white dark:bg-surface-card-2 shadow-sm text-ink dark:text-white' : 'text-ink-dim'}`}>
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contador */}
              <p className="text-xs text-ink-dim shrink-0 hidden sm:block">{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Lista / Grilla */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 lg:pb-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center text-center gap-3 pt-12 pb-8">
                  <Search className="w-8 h-8 text-ink-dim dark:text-ink-dim" />
                  <p className="text-sm font-semibold text-ink-dim">Sin resultados</p>
                  {(prodSearch || activeFilterCount > 0) && (
                    <button onClick={clearFilters} className="text-xs font-bold text-brand hover:text-brand-dark transition-colors">Limpiar filtros</button>
                  )}
                </div>
              ) : prodView === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filtered.map(o => <GridCard key={o.id} o={o} />)}
                </div>
              ) : (
                <div className="space-y-2 max-w-2xl">
                  {filtered.map(o => <ListCard key={o.id} o={o} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Sheet filtros móvil */}
    {prodFilterSheet && (
      <div className="lg:hidden fixed inset-0 z-[5000] flex flex-col justify-end" onClick={() => setProdFilterSheet(false)}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-surface-card rounded-t-3xl px-4 pt-3 pb-8 shadow-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)', animation: 'sheet-up .22s ease' }} onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 rounded-full bg-surface-card-2 dark:bg-white/15 mx-auto mb-5" />
          <h3 className="font-black text-base mb-4">Filtros</h3>

          {/* Estado */}
          <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-2">Estado</p>
          <div className="flex gap-2 mb-4">
            {[
              { value: 'todos',   label: 'Todos' },
              { value: 'activos', label: 'Activos' },
              { value: 'pausados',label: 'Pausados' },
            ].map(opt => (
              <button key={opt.value} onClick={() => setProdFilter(opt.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodFilter === opt.value ? 'bg-brand text-white' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Condición */}
          <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-2">Condición</p>
          <div className="flex gap-2 mb-4">
            {[
              { value: null,    label: 'Todas' },
              { value: 'nuevo', label: 'Nuevo' },
              { value: 'usado', label: 'Usado' },
            ].map(opt => (
              <button key={String(opt.value)} onClick={() => setProdCondicion(opt.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodCondicion === opt.value ? 'bg-brand text-white' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Ordenar */}
          <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-2">Ordenar</p>
          <div className="flex flex-col gap-1 mb-5">
            {SORT_OPTS.map(opt => (
              <button key={opt.value} onClick={() => setProdSort(opt.value)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${prodSort === opt.value ? 'bg-brand/10 text-brand' : 'bg-surface-card-2 dark:bg-white/5 text-ink-dim dark:text-ink-dim'}`}>
                {opt.label}
                {prodSort === opt.value && <CheckCircle className="w-4 h-4" />}
              </button>
            ))}
          </div>

          {/* Quick filters */}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setProdSinStock(v => !v)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodSinStock ? 'bg-danger/10 text-danger' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
              Sin stock
            </button>
            <button onClick={() => setProdDescuento(v => !v)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodDescuento ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
              Con descuento
            </button>
          </div>

          <div className="flex gap-3">
            {activeFilterCount > 0 && (
              <button onClick={() => { clearFilters(); }} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim">
                Limpiar
              </button>
            )}
            <button onClick={() => setProdFilterSheet(false)} className="flex-1 py-3 rounded-2xl bg-brand text-white text-sm font-bold">
              Ver {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal confirmar borrado */}
    {confirmDelete && (
      <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-surface-card rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="font-black text-lg text-center mb-1">¿Eliminar producto?</h3>
          <p className="text-sm text-ink-dim text-center mb-6">Esta acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors">Cancelar</button>
            <button onClick={() => { deleteProducto(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors">Eliminar</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
