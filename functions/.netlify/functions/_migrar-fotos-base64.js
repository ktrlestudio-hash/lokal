// _migrar-fotos-base64.js — endpoint TEMPORAL de mantenimiento, no forma
// parte del producto. Encontrado el 2026-08-19: data/ofertas.json (10.6MB
// compartido por TODAS las tiendas, para apenas 15 productos reales) tenía
// imágenes embebidas como data:image/...;base64 directo en imageUrl/
// thumbUrl/ogImageUrl/fotos — basura histórica de antes de que
// sanitizeMediaUrls() empezara a rechazar data: URLs (allowDataUrls:false
// por default, ver _lib/validation.js). El código actual ya no puede
// volver a generar este problema; esto solo migra lo que ya existe.
//
// Sube cada imagen base64 real a R2 (mismo bucket/carpeta que usa
// upload.js) y reemplaza el campo por la URL pública. Solo accesible para
// ADMIN_EMAILS. BORRAR este archivo una vez corrida la migración.
import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, jsonResponse } from './_lib/http.js';
import { safeRead, safeWrite } from './_lib/r2-safe-write.js';

const DATA_KEY = 'data/ofertas.json';
const CAMPOS_IMAGEN = ['imageUrl', 'thumbUrl', 'ogImageUrl'];

function decodeDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const [, contentType, base64] = match;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  return { bytes, contentType, ext };
}

async function subirYReemplazar(bucket, publicUrl, dataUrl) {
  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) return dataUrl; // no era una data URL, dejar como está
  const key = `images/migradas/${Date.now()}-${crypto.randomUUID()}.${decoded.ext}`;
  await bucket.put(key, decoded.bytes, {
    httpMetadata: { contentType: decoded.contentType, cacheControl: 'public, max-age=31536000, immutable' },
  });
  return `${publicUrl.replace(/\/$/, '')}/${key}`;
}

export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const user = await requireAuth(event, env);
    const ADMIN_EMAILS = (env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return jsonResponse(event, 403, { error: 'Solo admin' }, {});
    }

    const bucket = env.LOKAL_BUCKET;
    const publicUrl = env.R2_PUBLIC_URL;
    if (!publicUrl) return jsonResponse(event, 503, { error: 'Falta R2_PUBLIC_URL' }, {});

    const { data: ofertas, etag } = await safeRead(bucket, DATA_KEY, []);
    let productosTocados = 0;
    let imagenesSubidas = 0;
    let bytesLiberadosAprox = 0;

    for (const oferta of ofertas) {
      let tocado = false;
      for (const campo of CAMPOS_IMAGEN) {
        const valor = oferta[campo];
        if (typeof valor === 'string' && valor.startsWith('data:')) {
          bytesLiberadosAprox += valor.length;
          oferta[campo] = await subirYReemplazar(bucket, publicUrl, valor);
          imagenesSubidas++;
          tocado = true;
        }
      }
      if (Array.isArray(oferta.fotos)) {
        const nuevasFotos = [];
        for (const foto of oferta.fotos) {
          if (typeof foto === 'string' && foto.startsWith('data:')) {
            bytesLiberadosAprox += foto.length;
            nuevasFotos.push(await subirYReemplazar(bucket, publicUrl, foto));
            imagenesSubidas++;
            tocado = true;
          } else {
            nuevasFotos.push(foto);
          }
        }
        oferta.fotos = nuevasFotos;
      }
      if (tocado) productosTocados++;
    }

    if (productosTocados > 0) {
      await safeWrite(bucket, DATA_KEY, ofertas, etag);
    }

    return jsonResponse(event, 200, {
      productosTocados,
      imagenesSubidas,
      bytesLiberadosAprox,
      mbLiberadosAprox: (bytesLiberadosAprox / (1024 * 1024)).toFixed(2),
    }, {});
  } catch (error) {
    return handleError(request, error, 'Error interno', {});
  }
}
