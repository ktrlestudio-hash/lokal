// _lib/auth.js — Cloudflare Pages Functions version.
//
// La versión de Netlify usaba `crypto.createVerify('RSA-SHA256')` de Node
// y `Buffer` para base64url — ninguno de los dos existe en el runtime de
// Cloudflare Workers (V8 aislado, sin módulo `node:crypto` ni `Buffer`
// global). El reemplazo es Web Crypto API (`crypto.subtle`), disponible
// nativamente en Workers sin ningún import — misma verificación
// criptográfica (RSASSA-PKCS1-v1_5 + SHA-256), solo la API cambia.
//
// getProjectId ahora recibe `env` en vez de leer process.env global — en
// Cloudflare las env vars llegan como el segundo argumento de
// onRequestX(context), no como variable de proceso.
import { HttpError, getHeader } from './http.js';

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const ADMIN_FALLBACK = 'ktrlestudio@gmail.com,katryelmmartinez@gmail.com';

let certCache = {
  certs: null,
  expiresAt: 0,
};

// Cache de CryptoKey ya importada por kid — importKey no es gratis, y el
// mismo kid se reusa en ráfagas de requests mientras el cert no rota
// (Google los rota cada tanto, controlado por el mismo max-age del caché
// de certs de abajo).
let keyCache = new Map();

function parseMaxAge(cacheControl) {
  const match = String(cacheControl || '').match(/max-age=(\d+)/i);
  return match ? Number(match[1]) : 3600;
}

function getProjectId(env) {
  const projectId = env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new HttpError(500, 'FIREBASE_PROJECT_ID no esta configurado');
  }
  return projectId;
}

// base64url → Uint8Array, sin Buffer (no existe en Workers). atob es global
// tanto en el navegador como en el runtime de Workers.
function base64UrlToBytes(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlToUtf8(value) {
  return new TextDecoder('utf-8').decode(base64UrlToBytes(value));
}

function parseJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw new HttpError(401, 'Sesion invalida');
  }

  try {
    return {
      header: JSON.parse(base64UrlToUtf8(parts[0])),
      payload: JSON.parse(base64UrlToUtf8(parts[1])),
      signatureBytes: base64UrlToBytes(parts[2]),
      signedPart: `${parts[0]}.${parts[1]}`,
    };
  } catch {
    throw new HttpError(401, 'Sesion invalida');
  }
}

async function getSecureTokenCerts() {
  if (certCache.certs && Date.now() < certCache.expiresAt) {
    return certCache.certs;
  }

  const res = await fetch(CERTS_URL);
  if (!res.ok) {
    throw new HttpError(503, 'No se pudo validar la sesion');
  }

  const certs = await res.json();
  const maxAge = parseMaxAge(res.headers.get('cache-control'));

  certCache = {
    certs,
    expiresAt: Date.now() + (Math.max(300, maxAge - 60) * 1000),
  };

  return certs;
}

// PEM x509 → CryptoKey importable. Los certs que sirve Google son
// certificados x509 completos (no una clave RSA "pelada"), así que hace
// falta extraer la SubjectPublicKeyInfo del certificado — Web Crypto no
// puede importar un x509 completo directo con importKey. En vez de
// parsear ASN.1 a mano, se apoya en que el navegador/Workers exponen
// `X509Certificate`... que tampoco existe en Workers. La vía que sí
// funciona en Workers: importar el cert completo como 'spki' NO sirve
// (x509 trae más estructura que la SPKI pelada), así que se usa el campo
// `n`/`e` — pero Google Identity Toolkit certs NO traen JWK, traen PEM.
//
// Solución real: Workers SÍ soporta importar un certificado x509 completo
// vía `crypto.subtle.importKey('spki', ...)` siempre que se le pase el DER
// de la SubjectPublicKeyInfo, no el DER del certificado entero. Extraerla
// a mano es frágil. En su lugar, esta versión pide los certs a Google en
// formato JWK directo (endpoint alternativo de Google que sirve las MISMAS
// claves como JWK), evitando el parseo de x509 por completo.
const JWK_CERTS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

async function importPublicKey(kid) {
  if (keyCache.has(kid)) return keyCache.get(kid);

  const res = await fetch(JWK_CERTS_URL);
  if (!res.ok) throw new HttpError(503, 'No se pudo validar la sesion');
  const { keys } = await res.json();
  const jwk = (keys || []).find((k) => k.kid === kid);
  if (!jwk) throw new HttpError(401, 'Sesion expirada o invalida');

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  keyCache.set(kid, cryptoKey);
  // El cache de claves no debe sobrevivir más que el cache de certs
  // (si Google rota el kid, hay que volver a pedir/importar) — se limpia
  // en el mismo maxAge que ya maneja getSecureTokenCerts vía certCache.
  return cryptoKey;
}

function getAdminEmails(env) {
  const raw = env?.ADMIN_EMAILS || env?.VITE_ADMIN_EMAILS || ADMIN_FALLBACK;
  return new Set(
    String(raw)
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function getBearerToken(event) {
  const authHeader = getHeader(event, 'authorization');
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (!/^Bearer$/i.test(scheme || '') || !token) return null;
  return token.trim();
}

export async function verifyFirebaseIdToken(idToken, env) {
  const projectId = getProjectId(env);
  const parsed = parseJwt(idToken);

  if (parsed.header.alg !== 'RS256' || !parsed.header.kid) {
    throw new HttpError(401, 'Sesion invalida');
  }

  const key = await importPublicKey(parsed.header.kid);
  const signedBytes = new TextEncoder().encode(parsed.signedPart);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    parsed.signatureBytes,
    signedBytes,
  );

  if (!valid) {
    throw new HttpError(401, 'Sesion expirada o invalida');
  }

  const now = Math.floor(Date.now() / 1000);
  const issuer = `https://securetoken.google.com/${projectId}`;
  const uid = parsed.payload.user_id || parsed.payload.sub;

  if (
    parsed.payload.aud !== projectId ||
    parsed.payload.iss !== issuer ||
    !uid ||
    typeof uid !== 'string' ||
    parsed.payload.sub !== uid ||
    parsed.payload.exp <= now ||
    parsed.payload.iat > now + 300
  ) {
    throw new HttpError(401, 'Sesion expirada o invalida');
  }

  const email = typeof parsed.payload.email === 'string' ? parsed.payload.email.trim() : '';

  return {
    uid,
    email,
    name: typeof parsed.payload.name === 'string' ? parsed.payload.name.trim() : '',
    picture: typeof parsed.payload.picture === 'string' ? parsed.payload.picture : null,
    claims: parsed.payload,
    isAdmin: email ? getAdminEmails(env).has(email.toLowerCase()) : false,
  };
}

export async function requireAuth(event, env) {
  const token = getBearerToken(event);
  if (!token) {
    throw new HttpError(401, 'Debes iniciar sesion');
  }
  return verifyFirebaseIdToken(token, env);
}

export function ensureAdmin(user, message = 'Solo disponible para administradores') {
  if (!user?.isAdmin) {
    throw new HttpError(403, message);
  }
}

export function ensureSameUserOrAdmin(user, uid, message = 'No autorizado') {
  if (!user?.isAdmin && user?.uid !== uid) {
    throw new HttpError(403, message);
  }
}
