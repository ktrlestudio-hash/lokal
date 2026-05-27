import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { apiFetch } from '../api';
import ProductoForm from '../components/ProductoForm';
import ProductoSuccessModal from '../components/ProductoSuccessModal';

const API_BASE = '/.netlify/functions';

const EMPTY_FORM = {
  titulo: '', descripcion: '', precio: '', precioOriginal: '',
  ventaja: [], financiacion: '', stock: '1',
  condicion: 'usado', categoryId: null, contactoWhatsapp: '',
};

// ── Header del formulario (igual que StorePageHeader) ────────────────────────
function FormHeader({ title, onBack, onSave, saving, canSave }) {
  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/8">
      <div className="h-14 flex items-center gap-2 px-4 max-w-lg mx-auto">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        <h1 className="font-black text-slate-900 dark:text-white text-base flex-1 truncate">
          {title}
        </h1>
        <button
          onClick={onSave}
          disabled={saving || !canSave}
          className="bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:hover:bg-brand text-white text-sm font-bold px-5 h-10 rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-brand/20"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </div>
  );
}

export default function VenderProductoScreen({
  firebaseUser,
  userRole,
  canPostNewProduct,
  /* hasTienda, // DEPRECADO: usar userRole === 'empresa' */
  navRoot,
  navigate,
  goBack,
  setNudgeModal,
  setSelectedProduct,
  allCategories,
  createCategory,
}) {
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [attributes, setAttributes] = React.useState({});
  const [fotoFiles, setFotoFiles] = React.useState([]);
  const [fotoPreviews, setFotoPreviews] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [savedProduct, setSavedProduct] = React.useState(null);
  const [editingProduct, setEditingProduct] = React.useState(null);

  const uploadFoto = async (file) => {
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    const up = await apiFetch(`${API_BASE}/upload`, {
      method: 'POST',
      authRequired: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileData: base64, contentType: file.type }),
    });
    return up.ok ? (await up.json()).url : null;
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { setError('El título es obligatorio'); return; }
    // ─── Lógica nueva: basada en userRole ──────────────────────────────────
    // Empresa siempre puede publicar productos nuevos
    if (form.condicion === 'nuevo' && userRole !== 'empresa' && userRole !== 'emprendimiento' && !editingProduct) {
      setNudgeModal({ type: 'producto-nuevo' }); return;
    }
    // ─── Lógica vieja (hasTienda) DEPRECADA ──────────────────────────────────
    // if (form.condicion === 'nuevo' && !hasTienda && !canPostNewProduct && !editingProduct) {
    //   setNudgeModal({ type: 'producto-nuevo' }); return;
    // }
    setSaving(true); setError(null);
    try {
      const fotosNuevas = (await Promise.all(fotoFiles.map(uploadFoto))).filter(Boolean);
      const fotosExistentes = editingProduct ? fotoPreviews.filter(p => !p.startsWith('blob:')) : [];
      const fotos = [...fotosExistentes, ...fotosNuevas];

      const payload = {
        vendedorId: firebaseUser.uid,
        vendedorNombre: firebaseUser.displayName || '',
        vendedorRol: userRole,
        condicion: form.condicion,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        precio: form.precio ? Number(form.precio) : null,
        precioOriginal: form.precioOriginal ? Number(form.precioOriginal) : null,
        ventaja: form.ventaja,
        financiacion: form.financiacion.trim() || null,
        stock: form.stock ? Number(form.stock) : null,
        categoryId: form.categoryId,
        attributes: Object.keys(attributes).length > 0 ? attributes : null,
        fotos,
        contactoWhatsapp: form.contactoWhatsapp?.trim() || null,
      };

      let saved;
      if (editingProduct) {
        const res = await apiFetch(`${API_BASE}/ofertas`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProduct.id, ...payload }),
          authRequired: true,
        });
        if (!res.ok) throw new Error('Error al actualizar');
        saved = await res.json();
      } else {
        const res = await apiFetch(`${API_BASE}/ofertas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          authRequired: true,
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          if (res.status === 403 && d.error?.includes('Límite')) {
            setNudgeModal({ type: form.condicion === 'nuevo' ? 'producto-nuevo' : 'producto-usado-limite' });
            return;
          }
          throw new Error(d.error || 'Error al publicar');
        }
        saved = await res.json();
      }

      setSavedProduct({
        ...saved,
        fotos,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        precio: form.precio ? Number(form.precio) : null,
        precioOriginal: form.precioOriginal ? Number(form.precioOriginal) : null,
        condicion: form.condicion,
        ventaja: form.ventaja,
        financiacion: form.financiacion.trim() || null,
        stock: form.stock ? Number(form.stock) : null,
        contactoWhatsapp: form.contactoWhatsapp?.trim() || null,
        categoryId: form.categoryId,
        attributes: Object.keys(attributes).length > 0 ? attributes : null,
      });
      setEditingProduct(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSaved = () => {
    const p = savedProduct;
    setSavedProduct(null);
    setEditingProduct(p);
    setForm({
      titulo: p.titulo || '',
      descripcion: p.descripcion || '',
      precio: p.precio || '',
      precioOriginal: p.precioOriginal || '',
      ventaja: Array.isArray(p.ventaja) ? p.ventaja : p.ventaja ? [p.ventaja] : [],
      financiacion: p.financiacion || '',
      stock: p.stock ?? '1',
      condicion: p.condicion || 'usado',
      categoryId: p.categoryId || null,
      contactoWhatsapp: p.contactoWhatsapp || '',
    });
    setFotoFiles([]);
    setFotoPreviews(p.fotos || []);
    setError(null);
    setAttributes(p.attributes || {});
  };

  const handleViewSaved = () => {
    if (savedProduct && setSelectedProduct) {
      setSelectedProduct(savedProduct);
      navigate('product-detail');
    }
  };

  const handleClose = () => {
    setSavedProduct(null);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFotoFiles([]);
    setFotoPreviews([]);
    setAttributes({});
    setError(null);
    goBack();
  };

  return (
    <>
      {/* Overlay a pantalla completa (igual que StoreApp) */}
      <div className="fixed inset-0 z-[5000] bg-[#f7f8fa] dark:bg-[#0a0d16] overflow-y-auto pb-24">
        <FormHeader
          title={editingProduct ? 'Editar producto' : 'Publicar producto'}
          onBack={handleClose}
          onSave={handleSave}
          saving={saving}
          canSave={!!form.titulo.trim()}
        />
        <ProductoForm
          form={form}
          setForm={setForm}
          fotoPreviews={fotoPreviews}
          setFotoPreviews={setFotoPreviews}
          fotoFiles={fotoFiles}
          setFotoFiles={setFotoFiles}
          attributes={attributes}
          setAttributes={setAttributes}
          onSave={handleSave}
          saving={saving}
          error={error}
          isEditing={!!editingProduct}
          canPostNew={canPostNewProduct}
          setNudgeModal={setNudgeModal}
          categories={allCategories}
          onCreateCategory={createCategory}
        />
      </div>

      {/* Modal de éxito (igual que StoreApp) */}
      {savedProduct && (
        <ProductoSuccessModal
          product={savedProduct}
          onEdit={handleEditSaved}
          onView={setSelectedProduct ? handleViewSaved : null}
          onMisProductos={() => { setSavedProduct(null); navRoot('mis-productos'); }}
          onClose={handleClose}
        />
      )}
    </>
  );
}
