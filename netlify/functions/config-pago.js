import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';

const CONFIG_KEY = 'data/config-pago.json';
const CONFIG_LOCAL = join('/tmp', 'lokal-config-pago.json');
const BUCKET = process.env.R2_BUCKET_NAME;

const DEFAULTS = {
  alias: '',
  cbu: '',
  titular: '',
  banco: '',
  instrucciones: 'Realizá la transferencia y adjuntá el comprobante. Activaremos tu plan en cuanto verifiquemos el pago.',
};

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || 'katryelmmartinez@gmail.com,ktrlestudio@gmail.com')
  .split(',')
  .map(v => v.trim().toLowerCase())
  .filter(Boolean);

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, OPTIONS',
};

function isR2() {
  return !!(process.env.CF_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
}

function r2() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function readConfig() {
  if (isR2()) {
    try {
      const res = await r2().send(new GetObjectCommand({ Bucket: BUCKET, Key: CONFIG_KEY }));
      return { ...DEFAULTS, ...JSON.parse(await res.Body.transformToString()) };
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return { ...DEFAULTS };
      throw err;
    }
  }
  if (!existsSync(CONFIG_LOCAL)) return { ...DEFAULTS };
  return { ...DEFAULTS, ...JSON.parse(readFileSync(CONFIG_LOCAL, 'utf8')) };
}

async function writeConfig(data) {
  if (isR2()) {
    await r2().send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: CONFIG_KEY,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }));
    return;
  }
  writeFileSync(CONFIG_LOCAL, JSON.stringify(data, null, 2));
}

function isAdmin(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase());
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) throw new HttpError(401, 'No autorizado');

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    if (event.httpMethod === 'GET') {
      const config = await readConfig();
      return jsonResponse(event, 200, config, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'POST') {
      if (!isAdmin(payload.email)) {
        throw new HttpError(403, 'Solo admins pueden modificar la config de pago');
      }

      const body = parseJsonBody(event);
      const config = {
        alias: body.alias || '',
        cbu: body.cbu || '',
        titular: body.titular || '',
        banco: body.banco || '',
        instrucciones: body.instrucciones || DEFAULTS.instrucciones,
        actualizadoEn: new Date().toISOString(),
        actualizadoPor: payload.email,
      };

      await writeConfig(config);
      return jsonResponse(event, 200, { ok: true, config }, HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
