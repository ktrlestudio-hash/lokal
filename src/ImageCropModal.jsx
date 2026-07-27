/**
 * ImageCropModal — encuadre/zoom de una imagen antes de subirla (react-easy-crop).
 * Mismo patrón que EVENT LIVE (CropModal.tsx): drag para mover, pinch/scroll/
 * botones para zoom, recorte final a canvas. Acá con dos formas: 'rect'
 * (portada/galería, aspect configurable) y 'rounded' (foto de perfil —
 * cuadrado con esquinas redondeadas, igual que el logo real en el hero
 * público, NO un círculo perfecto).
 */
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = src;
  });
}

async function getCroppedFile(src, cropPixels, { shape, maxSize, fileName }) {
  const image = await loadImage(src);
  const outSize = Math.min(Math.min(cropPixels.width, cropPixels.height), maxSize);
  const outW = shape === 'rect' ? Math.round(outSize * (cropPixels.width / cropPixels.height)) : outSize;
  const outH = outSize;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';

  if (shape === 'rounded') {
    const r = outW * 0.22; // mismo criterio visual que el logo real (borderRadius 18 sobre 72px ~ 25%)
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(outW, 0, outW, outH, r);
    ctx.arcTo(outW, outH, 0, outH, r);
    ctx.arcTo(0, outH, 0, 0, r);
    ctx.arcTo(0, 0, outW, 0, r);
    ctx.closePath();
    ctx.clip();
  }

  ctx.drawImage(image, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, outW, outH);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('No se pudo procesar la imagen'));
      resolve(new File([blob], fileName, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.88);
  });
}

/**
 * props:
 *  - file: File original (obligatorio)
 *  - shape: 'rect' | 'rounded' (default 'rect')
 *  - aspect: relación ancho/alto del área de recorte (default 16/9)
 *  - maxSize: lado máximo de salida en px (default 1200)
 *  - onConfirm(file): recibe el File ya recortado
 *  - onClose()
 */
export default function ImageCropModal({ file, shape = 'rect', aspect = 16 / 9, maxSize = 1200, onConfirm, onClose }) {
  const [src] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_area, pixels) => setCropPixels(pixels), []);

  const handleConfirm = async () => {
    if (!cropPixels) return;
    setSaving(true);
    try {
      const cropped = await getCroppedFile(src, cropPixels, { shape, maxSize, fileName: file.name || 'foto.jpg' });
      URL.revokeObjectURL(src);
      onConfirm(cropped);
    } catch {
      setSaving(false);
    }
  };

  const handleClose = () => {
    URL.revokeObjectURL(src);
    onClose();
  };

  // Área de crop proporcional al aspect real (antes 280px fijos para
  // cualquier forma — en la foto de perfil, aspect=1, un rectángulo tan
  // alto forzaba una caja mucho más grande que la imagen final circular,
  // se sentía desbalanceado). maxW acota el ancho disponible del modal
  // (max-w-sm ≈ 384px con padding); la altura sale de dividir por el aspect,
  // con un piso/techo razonable para que zoom/pan sigan siendo cómodos.
  const maxW = 320;
  const cropH = Math.round(Math.min(320, Math.max(200, maxW / aspect)));

  return (
    <div className="fixed inset-0 bg-black/80 z-[6500] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-surface-card rounded-3xl w-full max-w-sm p-5 flex flex-col items-center gap-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-base self-start">Encuadrar foto</h3>

        <div
          className="relative overflow-hidden bg-black rounded-2xl"
          style={{ width: maxW, height: cropH }}
        >
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="rect"
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
          />
        </div>

        <p className="text-xs text-ink-dim text-center">Arrastrá para mover · Pinch o scroll para zoom</p>

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setZoom(z => Math.max(MIN_ZOOM, z / 1.25))} className="p-2 rounded-xl bg-surface-card-2 dark:bg-white/5 hover:bg-brand/10 transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-24 h-1.5 rounded-full bg-surface-card-2 dark:bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%` }} />
          </div>
          <button type="button" onClick={() => setZoom(z => Math.min(MAX_ZOOM, z * 1.25))} className="p-2 rounded-xl bg-surface-card-2 dark:bg-white/5 hover:bg-brand/10 transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-3 w-full">
          <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-2xl bg-surface-card-2 dark:bg-white/5 text-sm font-bold flex items-center justify-center gap-2">
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button type="button" onClick={handleConfirm} disabled={saving} className="flex-1 py-2.5 rounded-2xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
