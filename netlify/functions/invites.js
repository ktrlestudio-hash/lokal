import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOCAL_DIR = '/tmp/lokal-invites';
const BUCKET = process.env.R2_BUCKET_NAME;
const CLAIM_TTL_MS = 30 * 60 * 1000;  // 30 min para completar el form desde que se abre
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas para abrir el link desde que se crea

function isR2Configured() {
  return !!(process.env.CF_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
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
      Bucket: BUCKET, Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }));
  } else {
    if (!existsSync(LOCAL_DIR)) mkdirSync(LOCAL_DIR, { recursive: true });
    writeFileSync(join(LOCAL_DIR, `${token}.json`), JSON.stringify(data, null, 2));
  }
}

function isClaimExpired(invite) {
  if (!invite.reclamadoEn) return true;
  return Date.now() - new Date(invite.reclamadoEn).getTime() > CLAIM_TTL_MS;
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {

    // ── GET ?token=xxx&sessionId=yyy — validar Y reclamar en un solo paso ───
    // Esta operacion es el corazon de la seguridad del token.
    // Lee, evalua y escribe atomicamente dentro de una sola funcion.
    // R2 no tiene transacciones, pero al ejecutarse en una sola Lambda
    // el riesgo de race condition es minimo en un MVP de bajo trafico.
    if (event.httpMethod === 'GET') {
      const { token, sessionId } = event.queryStringParameters || {};
      if (!token) return { statusCode: 400, headers, body: JSON.stringify({ error: 'token requerido' }) };
      if (!sessionId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'sessionId requerido' }) };

      const invite = await readInvite(token);

      // Token no existe
      if (!invite) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Link invalido o inexistente' }) };
      }

      // Ya fue completado definitivamente
      if (invite.estado === 'usado') {
        return { statusCode: 410, headers, body: JSON.stringify({ error: 'Este link ya fue utilizado para registrar una tienda' }) };
      }

      // Token expirado (solo aplica a tokens libres o reclamados, no a usados)
      const tokenAge = Date.now() - new Date(invite.creadoEn).getTime();
      if (tokenAge > TOKEN_TTL_MS) {
        return {
          statusCode: 410,
          headers,
          body: JSON.stringify({ error: 'Este link expiro. Solicita uno nuevo al administrador.' }),
        };
      }

      // Esta reclamado por otra sesion y el claim no vencio
      if (invite.estado === 'reclamado' && invite.sessionId !== sessionId && !isClaimExpired(invite)) {
        const minutosRestantes = Math.ceil((CLAIM_TTL_MS - (Date.now() - new Date(invite.reclamadoEn).getTime())) / 60000);
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: `Este link esta siendo usado en este momento. Si abandonaron el proceso, expira en ${minutosRestantes} min.`,
          }),
        };
      }

      // Casos validos:
      // - estado === 'libre'
      // - estado === 'reclamado' por esta misma sesion (recarga de pagina)
      // - estado === 'reclamado' por otra sesion pero el claim ya vencio

      // Reclamar (o renovar el claim de esta sesion)
      await writeInvite(token, {
        ...invite,
        estado: 'reclamado',
        sessionId,
        reclamadoEn: new Date().toISOString(),
      });

      return { statusCode: 200, headers, body: JSON.stringify({ valid: true, creadoEn: invite.creadoEn }) };
    }

    // ── POST — crear invite (admin) ──────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const token = randomBytes(24).toString('hex');
      const invite = {
        token,
        estado: 'libre',
        sessionId: null,
        reclamadoEn: null,
        tiendaId: null,
        usadoEn: null,
        creadoEn: new Date().toISOString(),
      };
      await writeInvite(token, invite);

      const baseUrl = process.env.URL || 'http://localhost:8888';
      const expiraEn = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          token,
          url: `${baseUrl}?token=${token}`,
          creadoEn: invite.creadoEn,
          expiraEn,
        }),
      };
    }

    // ── PATCH — marcar como usado (llamado desde tiendas-crud al crear tienda) ─
    // Verifica que el sessionId coincida antes de marcar definitivamente.
    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const { token, sessionId, tiendaId } = body;

      if (!token || !sessionId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'token y sessionId son requeridos' }) };
      }

      const invite = await readInvite(token);
      if (!invite) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Token no encontrado' }) };
      if (invite.estado === 'usado') return { statusCode: 410, headers, body: JSON.stringify({ error: 'Ya utilizado' }) };

      // Solo puede marcar como usado quien lo reclamo
      if (invite.sessionId !== sessionId) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'No autorizado: sessionId no coincide' }) };
      }

      await writeInvite(token, {
        ...invite,
        estado: 'usado',
        tiendaId: tiendaId || null,
        usadoEn: new Date().toISOString(),
      });

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };

  } catch (err) {
    console.error('[invites]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
