// upload.js — Cloudflare Pages Functions version de netlify/functions/upload.js.
// El binding R2 nativo (env.LOKAL_BUCKET) reemplaza tanto al PutObjectCommand
// S3 como a R2_PUBLIC_URL para armar la URL pública — Cloudflare Pages
// sirve objetos R2 vinculados directo bajo el dominio configurado del
// bucket (env.R2_PUBLIC_URL sigue siendo necesario como env var, no cambia
// esa parte del contrato). Buffer.from(base64) reemplazado por atob +
// Uint8Array (Web Crypto no tiene Buffer); randomUUID() SÍ es nativo en
// Workers (crypto.randomUUID()), no hace falta importarlo de 'crypto'.
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText } from './_lib/validation.js';

// Imágenes: 5MB → 20MB. El cliente ya redimensiona antes de subir
// (storeFormUtils.jsx: uploadImagenTienda/uploadOfertaImages, ambas a
// ~1600px con canvas), así que en el caso normal una foto termina bien
// por debajo de esto — este límite es la red de seguridad para cuando
// canvas no puede procesar el archivo y cae al original sin comprimir
// (formatos raros, navegadores viejos), no el límite que se espera pegar
// en el uso normal. 5MB era demasiado ajustado incluso para eso: una sola
// foto de cámara de celular moderna ya lo supera sin comprimir.
const ALLOWED_TYPES = {
  'image/jpeg': { folder: 'images', ext: 'jpg', maxBytes: 20 * 1024 * 1024, kind: 'image' },
  'image/png': { folder: 'images', ext: 'png', maxBytes: 20 * 1024 * 1024, kind: 'image' },
  'image/webp': { folder: 'images', ext: 'webp', maxBytes: 20 * 1024 * 1024, kind: 'image' },
  'image/gif': { folder: 'images', ext: 'gif', maxBytes: 20 * 1024 * 1024, kind: 'image' },
  'image/avif': { folder: 'images', ext: 'avif', maxBytes: 20 * 1024 * 1024, kind: 'image' },
  'video/mp4': { folder: 'videos', ext: 'mp4', maxBytes: 20 * 1024 * 1024, kind: 'video' },
  'video/webm': { folder: 'videos', ext: 'webm', maxBytes: 20 * 1024 * 1024, kind: 'video' },
  'video/quicktime': { folder: 'videos', ext: 'mov', maxBytes: 20 * 1024 * 1024, kind: 'video' },
};

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, OPTIONS',
};

function decodeBase64(value) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length % 4 === 1) {
    throw new HttpError(400, 'Archivo invalido');
  }

  let binary;
  try {
    binary = atob(normalized);
  } catch {
    throw new HttpError(400, 'Archivo invalido');
  }
  if (!binary.length) {
    throw new HttpError(400, 'Archivo vacio');
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    await requireAuth(event, env);

    const body = await parseJsonBody(event);
    const contentType = sanitizeText(body.contentType, { max: 80, multiline: false }).toLowerCase();
    const fileName = sanitizeText(body.fileName, { max: 160, multiline: false });
    const fileData = body.fileData;

    if (!fileName || !fileData || !contentType) {
      throw new HttpError(400, 'fileName, fileData y contentType son requeridos');
    }

    const typeConfig = ALLOWED_TYPES[contentType];
    if (!typeConfig) {
      throw new HttpError(400, 'Tipo de archivo no permitido');
    }

    const bytes = decodeBase64(fileData);
    if (bytes.length > typeConfig.maxBytes) {
      const maxMb = Math.round(typeConfig.maxBytes / (1024 * 1024));
      const pesoMb = (bytes.length / (1024 * 1024)).toFixed(1);
      // Mensaje derivado del límite real, no un número escrito a mano:
      // antes decía "max 5MB" fijo y quedó desactualizado al subir el
      // límite a 20MB, mostrando una cifra que ya no era cierta.
      throw new HttpError(
        400,
        typeConfig.kind === 'video'
          ? `El video pesa ${pesoMb}MB y el máximo es ${maxMb}MB`
          : `La imagen pesa ${pesoMb}MB y el máximo es ${maxMb}MB`
      );
    }

    const key = `${typeConfig.folder}/${Date.now()}-${crypto.randomUUID()}.${typeConfig.ext}`;

    await bucket.put(key, bytes, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    const publicUrl = env.R2_PUBLIC_URL;
    if (!publicUrl) throw new HttpError(503, 'Uploads no configurados (falta R2_PUBLIC_URL)');

    return jsonResponse(event, 200, {
      url: `${publicUrl.replace(/\/$/, '')}/${key}`,
      key,
      type: typeConfig.kind,
    }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
