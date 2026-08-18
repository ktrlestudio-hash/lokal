// invites.js — Cloudflare Pages Functions version de netlify/functions/invites.js.
// randomBytes de Node reemplazado por crypto.getRandomValues (Web Crypto
// nativa) — mismo largo de token (24 bytes → 48 hex chars), mismo formato
// que sanitizeInviteToken ya validaba.
import { ensureAdmin, requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText } from './_lib/validation.js';

const CLAIM_TTL_MS = 30 * 60 * 1000;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, OPTIONS',
};

function randomHexToken(bytesLen) {
  const bytes = new Uint8Array(bytesLen);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function sanitizeInviteToken(value) {
  const token = sanitizeText(value, { max: 64, multiline: false }).toLowerCase();
  if (!/^[a-f0-9]{48}$/.test(token)) {
    throw new HttpError(400, 'token invalido');
  }
  return token;
}

function sanitizeSessionId(value) {
  const sessionId = sanitizeText(value, { max: 160, multiline: false });
  if (!sessionId) {
    throw new HttpError(400, 'sessionId requerido');
  }
  return sessionId;
}

async function readInvite(bucket, token) {
  const obj = await bucket.get(`invites/${token}.json`);
  if (!obj) return null;
  return JSON.parse(await obj.text());
}

async function writeInvite(bucket, token, data) {
  await bucket.put(`invites/${token}.json`, JSON.stringify(data, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });
}

function isClaimExpired(invite) {
  if (!invite.reclamadoEn) return true;
  return Date.now() - new Date(invite.reclamadoEn).getTime() > CLAIM_TTL_MS;
}

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestGet({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const { searchParams } = new URL(request.url);
    const token = sanitizeInviteToken(searchParams.get('token'));
    const sessionId = sanitizeSessionId(searchParams.get('sessionId'));
    const invite = await readInvite(bucket, token);

    if (!invite) {
      return jsonResponse(event, 404, { error: 'Link invalido o inexistente' }, { ...HTTP_OPTIONS, env });
    }

    if (invite.estado === 'usado') {
      return jsonResponse(event, 410, { error: 'Este link ya fue utilizado para registrar una tienda' }, { ...HTTP_OPTIONS, env });
    }

    const tokenAge = Date.now() - new Date(invite.creadoEn).getTime();
    if (tokenAge > TOKEN_TTL_MS) {
      return jsonResponse(event, 410, { error: 'Este link expiro. Solicita uno nuevo al administrador.' }, { ...HTTP_OPTIONS, env });
    }

    if (invite.estado === 'reclamado' && invite.sessionId !== sessionId && !isClaimExpired(invite)) {
      const minutosRestantes = Math.ceil((CLAIM_TTL_MS - (Date.now() - new Date(invite.reclamadoEn).getTime())) / 60000);
      return jsonResponse(event, 409, {
        error: `Este link esta siendo usado en este momento. Si abandonaron el proceso, expira en ${minutosRestantes} min.`,
      }, { ...HTTP_OPTIONS, env });
    }

    await writeInvite(bucket, token, {
      ...invite,
      estado: 'reclamado',
      sessionId,
      reclamadoEn: new Date().toISOString(),
    });

    return jsonResponse(event, 200, { valid: true, creadoEn: invite.creadoEn }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    ensureAdmin(user);

    const token = randomHexToken(24);
    const invite = {
      token,
      estado: 'libre',
      sessionId: null,
      reclamadoEn: null,
      tiendaId: null,
      usadoEn: null,
      creadoEn: new Date().toISOString(),
      creadoPor: user.email || user.uid,
    };

    await writeInvite(bucket, token, invite);

    const baseUrl = new URL(request.url).origin;
    return jsonResponse(event, 201, {
      token,
      url: `${baseUrl}/admin?token=${token}`,
      creadoEn: invite.creadoEn,
      expiraEn: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestPatch({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const body = await parseJsonBody(event);
    const token = sanitizeInviteToken(body.token);
    const sessionId = sanitizeSessionId(body.sessionId);
    const tiendaId = body.tiendaId ? sanitizeText(String(body.tiendaId), { max: 64, multiline: false }) : null;

    const invite = await readInvite(bucket, token);
    if (!invite) {
      return jsonResponse(event, 404, { error: 'Token no encontrado' }, { ...HTTP_OPTIONS, env });
    }
    if (invite.estado === 'usado') {
      return jsonResponse(event, 410, { error: 'Ya utilizado' }, { ...HTTP_OPTIONS, env });
    }
    if (invite.sessionId !== sessionId) {
      return jsonResponse(event, 403, { error: 'No autorizado: sessionId no coincide' }, { ...HTTP_OPTIONS, env });
    }

    await writeInvite(bucket, token, {
      ...invite,
      estado: 'usado',
      tiendaId,
      usadoEn: new Date().toISOString(),
    });

    return jsonResponse(event, 200, { ok: true }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
