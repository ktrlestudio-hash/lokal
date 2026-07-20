import { createVerify } from 'crypto';
import { HttpError, getHeader } from './http.js';

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const ADMIN_FALLBACK = 'ktrlestudio@gmail.com';

let certCache = {
  certs: null,
  expiresAt: 0,
};

function parseMaxAge(cacheControl) {
  const match = String(cacheControl || '').match(/max-age=(\d+)/i);
  return match ? Number(match[1]) : 3600;
}

function getProjectId() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new HttpError(500, 'FIREBASE_PROJECT_ID no esta configurado');
  }
  return projectId;
}

function toBase64(value) {
  const normalized = String(value)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, 'base64');
}

function parseJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw new HttpError(401, 'Sesion invalida');
  }

  try {
    return {
      header: JSON.parse(toBase64(parts[0]).toString('utf8')),
      payload: JSON.parse(toBase64(parts[1]).toString('utf8')),
      signature: toBase64(parts[2]),
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

function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || ADMIN_FALLBACK;
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

export async function verifyFirebaseIdToken(idToken) {
  const projectId = getProjectId();
  const parsed = parseJwt(idToken);

  if (parsed.header.alg !== 'RS256' || !parsed.header.kid) {
    throw new HttpError(401, 'Sesion invalida');
  }

  const certs = await getSecureTokenCerts();
  const cert = certs[parsed.header.kid];
  if (!cert) {
    throw new HttpError(401, 'Sesion expirada o invalida');
  }

  const verifier = createVerify('RSA-SHA256');
  verifier.update(parsed.signedPart);
  verifier.end();

  if (!verifier.verify(cert, parsed.signature)) {
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
    isAdmin: email ? getAdminEmails().has(email.toLowerCase()) : false,
  };
}

export async function requireAuth(event) {
  const token = getBearerToken(event);
  if (!token) {
    throw new HttpError(401, 'Debes iniciar sesion');
  }
  return verifyFirebaseIdToken(token);
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
