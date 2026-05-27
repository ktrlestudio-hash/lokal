import React, { useState, useRef } from 'react';
import { ArrowLeft, CheckCircle, X, Camera, AlertCircle, Loader2 } from 'lucide-react';
import CategoryPicker from '../CategoryPicker';
import AttributesEditor from '../AttributesEditor';
import { apiFetch } from '../api';

const API_BASE = '/.netlify/functions';

export default function CrearDemandaScreen({
  editingDemanda, setEditingDemanda,
  navRoot, navigate,
  setAllDemandas,
  allCategories,
  createCategory,
  addNotif,
}) {
  const editing = !!editingDemanda;
  const [titulo, setTitulo] = useState(editingDemanda?.titulo || '');
  const [descripcion, setDescripcion] = useState(editingDemanda?.descripcion || '');
  const [presupuestoMin, setPresupuestoMin] = useState(editingDemanda?.presupuesto?.min || '');
  const [presupuestoMax, setPresupuestoMax] = useState(editingDemanda?.presupuesto?.max || '');
  const [categoryId, setCategoryId] = useState(editingDemanda?.categoryId || null);
  const [attributes, setAttributes] = useState(editingDemanda?.attributes || {});
  const initFotos = () => {
    const existing = editingDemanda?.fotos || (editingDemanda?.foto?.startsWith('http') ? [editingDemanda.foto] : []);
    return existing.map(url => ({ preview: url }));
  };
  const [fotos, setFotos] = useState(initFotos);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FOTOS = 5;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_FOTOS - fotos.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotos(prev => prev.length < MAX_FOTOS ? [...prev, { file, preview: reader.result }] : prev);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (idx) => setFotos(prev => prev.filter((_, i) => i !== idx));

  const uploadFoto = async (foto) => {
    if (!foto.file) return foto.preview;
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(foto.file);
    });
    const up = await apiFetch(`${API_BASE}/upload`, {
      method: 'POST',
      authRequired: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: foto.file.name, fileData: base64, contentType: foto.file.type }),
    });
    if (up.ok) return (await up.json()).url;
    return null;
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !categoryId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const fotosUrls = (await Promise.all(fotos.map(uploadFoto))).filter(Boolean);
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fotos: fotosUrls,
        foto: fotosUrls[0] || null,
        categoryId: categoryId || null,
        attributes: Object.keys(attributes).length > 0 ? attributes : null,
        presupuesto: (presupuestoMin || presupuestoMax)
          ? { min: presupuestoMin ? Number(presupuestoMin) : null, max: presupuestoMax ? Number(presupuestoMax) : null }
          : null,
      };

      if (editing) {
        setAllDemandas(prev => prev.map(d => d.id === editingDemanda.id ? { ...d, ...payload } : d));
        await apiFetch(`${API_BASE}/demandas`, {
          method: 'PATCH',
          authRequired: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingDemanda.id, ...payload }),
        });
      } else {
        const res = await apiFetch(`${API_BASE}/demandas`, {
          method: 'POST',
          authRequired: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Error al publicar');
        const nueva = await res.json();
        setAllDemandas(prev => [nueva, ...prev]);
        addNotif?.('Tu demanda fue publicada. Las tiendas ya pueden verla.', 'sistema', nueva.id);
      }

      setSuccess(true);
      setTimeout(() => {
        setEditingDemanda(null);
        navRoot('home');
        setSuccess(false);
      }, 1800);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{editing ? 'Demanda actualizada' : 'Demanda publicada!'}</h2>
        <p className="text-slate-500">{editing ? 'Los cambios fueron guardados' : 'Las tiendas ya pueden responderte'}</p>
      </div>
    </div>
  );

  const inputCls = 'w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors dark:text-white placeholder:text-slate-400';
  const labelCls = 'text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider';
  const cardCls  = 'bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 p-4';

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0a0d16] pb-28">
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/8">
        <div className="px-3 h-14 flex items-center gap-2">
          <button onClick={() => { setEditingDemanda(null); navRoot('home'); }} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-black truncate flex-1">{editing ? 'Editar demanda' : 'Nueva demanda'}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        <div className={cardCls}>
          <p className={`${labelCls} mb-3`}>Fotos <span className="font-normal normal-case text-slate-400">({fotos.length}/{MAX_FOTOS})</span></p>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => {
              if (i < fotos.length) return (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-white/10 group">
                  <img src={fotos[i].preview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1 py-0.5 rounded font-medium">Principal</span>}
                </div>
              );
              if (i === fotos.length && fotos.length < MAX_FOTOS) return (
                <button key={i} type="button" onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors text-slate-400 hover:text-primary">
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px]">Agregar</span>
                </button>
              );
              return <div key={i} className="aspect-square rounded-xl bg-slate-100/40 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/5" />;
            })}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
        </div>

        <div className={`${cardCls} space-y-4`}>
          <div>
            <label className={`${labelCls} block mb-2`}>¿Qué estás buscando? <span className="text-rose-500">*</span></label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Cable USB-C a HDMI 2 metros"
              className={inputCls} />
          </div>
          <div>
            <label className={`${labelCls} block mb-2`}>Descripción <span className="font-normal normal-case text-slate-400">(opcional)</span></label>
            <textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)}
              placeholder="Contanos más detalles: marca, modelo, medidas..."
              className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={`${labelCls} block mb-2`}>Presupuesto <span className="font-normal normal-case text-slate-400">(opcional)</span></label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">Desde $</span>
                <input type="number" value={presupuestoMin} onChange={e => setPresupuestoMin(e.target.value)}
                  placeholder="0" className={`${inputCls} pl-16`} />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">Hasta $</span>
                <input type="number" value={presupuestoMax} onChange={e => setPresupuestoMax(e.target.value)}
                  placeholder="0" className={`${inputCls} pl-16`} />
              </div>
            </div>
          </div>
        </div>

        <div className={cardCls}>
          <label className={`${labelCls} block mb-2`}>Categoría <span className="text-rose-500">*</span></label>
          <CategoryPicker
            value={categoryId}
            onChange={id => { setCategoryId(id); setAttributes({}); }}
            onCreateCategory={createCategory}
            categories={allCategories}
            placeholder="¿En qué categoría entra lo que buscás?"
            suggestionContext={{ titulo, descripcion }}
          />
        </div>

        {(categoryId || Object.keys(attributes).length > 0) && (
          <div className={cardCls}>
            <label className={`${labelCls} block mb-3`}>Detalles <span className="font-normal normal-case text-slate-400">(opcional)</span></label>
            <AttributesEditor
              categoryId={categoryId}
              value={attributes}
              onChange={setAttributes}
              categories={allCategories}
            />
          </div>
        )}

        {submitError && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {submitError}
          </div>
        )}

        <button onClick={handleSubmit} disabled={!titulo.trim() || !categoryId || submitting}
          className="w-full bg-brand text-white py-3.5 rounded-2xl font-bold text-sm disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</> : (editing ? 'Guardar cambios' : 'Publicar demanda')}
        </button>
      </div>
    </div>
  );
}
