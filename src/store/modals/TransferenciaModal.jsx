import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Camera, CreditCard, Loader2, AlertCircle } from 'lucide-react';

export default function TransferenciaModal({ open, onClose, plan, monto, tiendaId, onSuccess }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE = '/.netlify/functions';

  useEffect(() => {
    if (!open) return;
    fetch(`${API_BASE}/config-pago`, { headers: { Authorization: `Bearer ${localStorage.getItem('lokal-token') || ''}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => setConfig(data))
      .catch(() => setConfig(null));
  }, [open]);

  const copiarAlias = () => {
    if (!config?.alias) return;
    navigator.clipboard.writeText(config.alias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5MB');
      return;
    }
    setError(null);
    setImagen(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagenPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const subirImagen = async () => {
    if (!imagenPreview) return null;
    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/upload-comprobante`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('lokal-token') || ''}`,
        },
        body: JSON.stringify({ imageBase64: imagenPreview, fileName: imagen.name }),
      });
      const data = await res.json();
      if (!data.url) throw new Error('Error al subir imagen');
      return data.url;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleEnviar = async () => {
    setError(null);
    if (!imagenPreview) {
      setError('Adjuntá el comprobante de transferencia');
      return;
    }
    setEnviando(true);
    try {
      const imagenUrl = await subirImagen();
      if (!imagenUrl) return;

      const res = await fetch(`${API_BASE}/comprobantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('lokal-token') || ''}`,
        },
        body: JSON.stringify({
          tiendaId,
          plan,
          monto,
          imagenUrl,
          notas,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Error al enviar comprobante');
      setExito(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
      <div className="bg-surface-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2e2e2e] p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-3">
            <CreditCard className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="font-black text-xl mb-1">Pagar por transferencia</h2>
          <p className="text-ink-dim text-sm">Plan {plan === 'anual' ? 'Anual' : 'Mensual'}</p>
        </div>

        {exito ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg text-ink mb-2">¡Comprobante enviado!</h3>
            <p className="text-sm text-ink-dim mb-4">
              Verificaremos tu pago y activaremos tu plan en breve.
            </p>
            <button onClick={onClose} className="w-full py-3 rounded-2xl font-bold text-sm bg-ink dark:bg-white/10 text-white hover:bg-ink/90 transition-colors">
              Entendido
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Monto */}
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 p-4 text-center">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide">Monto a transferir</p>
              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">${Number(monto).toLocaleString()}</p>
            </div>

            {/* Datos bancarios */}
            {config ? (
              <div className="space-y-3">
                {config.alias && (
                  <button onClick={copiarAlias} className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-card-2 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-400 transition-colors">
                    <div className="text-left">
                      <p className="text-[10px] text-ink-dim uppercase tracking-wide font-bold">Alias</p>
                      <p className="text-lg font-bold text-ink font-mono">{config.alias}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-surface-card-2 dark:bg-white/10 text-ink-dim'}`}>
                      {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                    </div>
                  </button>
                )}
                {config.cbu && (
                  <div className="p-3 rounded-xl bg-surface-card-2 dark:bg-white/5">
                    <p className="text-[10px] text-ink-dim uppercase tracking-wide font-bold">CBU/CVU</p>
                    <p className="text-sm font-mono text-ink dark:text-ink-dim break-all">{config.cbu}</p>
                  </div>
                )}
                {config.titular && (
                  <div className="p-3 rounded-xl bg-surface-card-2 dark:bg-white/5">
                    <p className="text-[10px] text-ink-dim uppercase tracking-wide font-bold">Titular</p>
                    <p className="text-sm font-semibold text-ink dark:text-ink-dim">{config.titular}</p>
                  </div>
                )}
                {config.banco && (
                  <div className="p-3 rounded-xl bg-surface-card-2 dark:bg-white/5">
                    <p className="text-[10px] text-ink-dim uppercase tracking-wide font-bold">Banco</p>
                    <p className="text-sm text-ink dark:text-ink-dim">{config.banco}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-ink-dim text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando datos...
              </div>
            )}

            {/* Instrucciones */}
            {config?.instrucciones && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">{config.instrucciones}</p>
              </div>
            )}

            {/* Upload comprobante */}
            <div>
              <p className="text-xs font-bold text-ink-dim uppercase tracking-wide mb-2">Comprobante de pago</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              {imagenPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400">
                  <img src={imagenPreview} alt="Comprobante" className="w-full object-cover max-h-48" />
                  <button onClick={() => { setImagen(null); setImagenPreview(null); }} className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all flex flex-col items-center gap-2">
                  <Camera className="w-6 h-6 text-ink-dim" />
                  <span className="text-sm text-ink-dim">Adjuntar captura de transferencia</span>
                </button>
              )}
            </div>

            {/* Notas opcionales */}
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Notas opcionales (ej: número de transferencia, hora, etc.)"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface-card text-sm resize-none h-20"
            />

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-rose-500 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {/* Botón enviar */}
            <button
              onClick={handleEnviar}
              disabled={enviando || uploading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
            >
              {enviando || uploading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</span>
              ) : (
                'Enviar comprobante'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
