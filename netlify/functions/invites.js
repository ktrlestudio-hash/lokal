import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ensureAdmin, requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText } from './_lib/validation.js';

const LOCAL_DIR = '/tmp/lokal-invites';
const BUCKET = process.env.R2_BUCKET_NAME;
const CLAIM_TTL_MS = 30 * 60 * 1000;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, OPTIONS',
};

function isR2Configured() {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function getClient() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
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

async function readInvite(token) {
  const key = `invites/${token}.json`;
  if (isR2Configured()) {
    try {
      const res = await getClient().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return null;
      throw err;
    }
  }

  const path = join(LOCAL_DIR, `${token}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function writeInvite(token, data) {
  const key = `invites/${token}.json`;
  if (isR2Configured()) {
    await getClient().send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }));
    return;
  }

  if (!existsSync(LOCAL_DIR)) mkdirSync(LOCAL_DIR, { recursive: true });
  writeFileSync(join(LOCAL_DIR, `${token}.json`), JSON.stringify(data, null, 2));
}

function isClaimExpired(invite) {
  if (!invite.reclamadoEn) return true;
  return Date.now() - new Date(invite.reclamadoEn).getTime() > CLAIM_TTL_MS;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    if (event.httpMethod === 'GET') {
      const query = event.queryStringParameters || {};
      const token = sanitizeInviteToken(query.token);
      const sessionId = sanitizeSessionId(query.sessionId);
      const invite = await readInvite(token);

      if (!invite) {
        return jsonResponse(event, 404, { error: 'Link invalido o inexistente' }, HTTP_OPTIONS);
      }

      if (invite.estado === 'usado') {
        return jsonResponse(event, 410, { error: 'Este link ya fue utilizado para registrar una tienda' }, HTTP_OPTIONS);
      }

      const tokenAge = Date.now() - new Date(invite.creadoEn).getTime();
      if (tokenAge > TOKEN_TTL_MS) {
        return jsonResponse(event, 410, { error: 'Este link expiro. Solicita uno nuevo al administrador.' }, HTTP_OPTIONS);
      }

      if (invite.estado === 'reclamado' && invite.sessionId !== sessionId && !isClaimExpired(invite)) {
        const minutosRestantes = Math.ceil((CLAIM_TTL_MS - (Date.now() - new Date(invite.reclamadoEn).getTime())) / 60000);
        return jsonResponse(event, 409, {
          error: `Este link esta siendo usado en este momento. Si abandonaron el proceso, expira en ${minutosRestantes} min.`,
        }, HTTP_OPTIONS);
      }

      await writeInvite(token, {
        ...invite,
        estado: 'reclamado',
        sessionId,
        reclamadoEn: new Date().toISOString(),
      });

      return jsonResponse(event, 200, { valid: true, creadoEn: invite.creadoEn }, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'POST') {
      const user = await requireAuth(event);
      ensureAdmin(user);

      const token = randomBytes(24).toString('hex');
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

      await writeInvite(token, invite);

      const baseUrl = process.env.URL || 'http://localhost:8888';
      return jsonResponse(event, 201, {
        token,
        url: `${baseUrl}?token=${token}`,
        creadoEn: invite.creadoEn,
        expiraEn: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
      }, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'PATCH') {
      const body = parseJsonBody(event);
      const token = sanitizeInviteToken(body.token);
      const sessionId = sanitizeSessionId(body.sessionId);
      const tiendaId = body.tiendaId ? sanitizeText(String(body.tiendaId), { max: 64, multiline: false }) : null;

      const invite = await readInvite(token);
      if (!invite) {
        return jsonResponse(event, 404, { error: 'Token no encontrado' }, HTTP_OPTIONS);
      }
      if (invite.estado === 'usado') {
        return jsonResponse(event, 410, { error: 'Ya utilizado' }, HTTP_OPTIONS);
      }
      if (invite.sessionId !== sessionId) {
        return jsonResponse(event, 403, { error: 'No autorizado: sessionId no coincide' }, HTTP_OPTIONS);
      }

      await writeInvite(token, {
        ...invite,
        estado: 'usado',
        tiendaId,
        usadoEn: new Date().toISOString(),
      });

      return jsonResponse(event, 200, { ok: true }, HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
