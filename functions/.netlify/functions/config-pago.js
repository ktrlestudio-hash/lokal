// config-pago.js — Cloudflare Pages Functions version.
//
// Bug de seguridad corregido al portar: el original (netlify/functions/
// config-pago.js) decodificaba el JWT a mano con Buffer.from(...).toString()
// SIN VERIFICAR LA FIRMA — cualquiera podía fabricar un token con
// {"email":"admin@x"} en el payload y pasar isAdmin(payload.email), porque
// nunca se comprobaba que Google realmente firmó ese token. Acá usa
// requireAuth (Web Crypto, verifica firma RS256 real contra los certs de
// Google) igual que el resto de las functions — la config de pago (alias/
// CBU/titular) es exactamente el tipo de dato que un bypass así podría
// haber corrompido en silencio.
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { safeRead, safeWrite } from './_lib/r2-safe-write.js';

const CONFIG_KEY = 'data/config-pago.json';

const DEFAULTS = {
  alias: '',
  cbu: '',
  titular: '',
  banco: '',
  instrucciones: 'Realizá la transferencia y adjuntá el comprobante. Activaremos tu plan en cuanto verifiquemos el pago.',
};

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, OPTIONS',
};

async function readConfig(bucket) {
  const { data } = await safeRead(bucket, CONFIG_KEY, null);
  return { ...DEFAULTS, ...(data || {}) };
}

async function writeConfig(bucket, data) {
  const { etag } = await safeRead(bucket, CONFIG_KEY, null);
  await safeWrite(bucket, CONFIG_KEY, data, etag);
}

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestGet({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    await requireAuth(event, env);
    const config = await readConfig(bucket);
    return jsonResponse(event, 200, config, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    if (!user.isAdmin) {
      throw new HttpError(403, 'Solo admins pueden modificar la config de pago');
    }

    const body = await parseJsonBody(event);
    const config = {
      alias: body.alias || '',
      cbu: body.cbu || '',
      titular: body.titular || '',
      banco: body.banco || '',
      instrucciones: body.instrucciones || DEFAULTS.instrucciones,
      actualizadoEn: new Date().toISOString(),
      actualizadoPor: user.email,
    };

    await writeConfig(bucket, config);
    return jsonResponse(event, 200, { ok: true, config }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
