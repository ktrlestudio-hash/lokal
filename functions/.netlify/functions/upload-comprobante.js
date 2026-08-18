// upload-comprobante.js — Cloudflare Pages Functions version.
//
// Bug de seguridad corregido al portar: el original (netlify/functions/
// upload-comprobante.js) decodificaba el JWT a mano con
// Buffer.from(...).toString() SIN VERIFICAR LA FIRMA — igual que
// config-pago.js, cualquiera podía fabricar un token con {"uid":"x"} en el
// payload. Acá usa requireAuth (verifica firma real) y el `key` del
// archivo usa user.uid ya verificado, no un valor confiado del cliente.
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, OPTIONS',
};

function decodeBase64(value) {
  const binary = atob(value);
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
    const user = await requireAuth(event, env);

    const body = await parseJsonBody(event);
    const { imageBase64, fileName } = body;

    if (!imageBase64) throw new HttpError(400, 'Falta imagen');

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const bytes = decodeBase64(base64Data);

    const ext = fileName?.split('.').pop() || 'jpg';
    const key = `comprobantes/${user.uid}_${Date.now()}.${ext}`;

    await bucket.put(key, bytes, {
      httpMetadata: { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` },
    });

    const publicBase = env.R2_PUBLIC_URL || `${env.R2_BUCKET_NAME}.r2.dev`;
    const publicUrl = `https://${publicBase}/${key}`;

    return jsonResponse(event, 200, { ok: true, url: publicUrl }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
