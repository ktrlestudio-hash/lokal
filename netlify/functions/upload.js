import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText } from './_lib/validation.js';

const ALLOWED_TYPES = {
  'image/jpeg': { folder: 'images', ext: 'jpg', maxBytes: 5 * 1024 * 1024, kind: 'image' },
  'image/png': { folder: 'images', ext: 'png', maxBytes: 5 * 1024 * 1024, kind: 'image' },
  'image/webp': { folder: 'images', ext: 'webp', maxBytes: 5 * 1024 * 1024, kind: 'image' },
  'image/gif': { folder: 'images', ext: 'gif', maxBytes: 5 * 1024 * 1024, kind: 'image' },
  'image/avif': { folder: 'images', ext: 'avif', maxBytes: 5 * 1024 * 1024, kind: 'image' },
  'video/mp4': { folder: 'videos', ext: 'mp4', maxBytes: 20 * 1024 * 1024, kind: 'video' },
  'video/webm': { folder: 'videos', ext: 'webm', maxBytes: 20 * 1024 * 1024, kind: 'video' },
  'video/quicktime': { folder: 'videos', ext: 'mov', maxBytes: 20 * 1024 * 1024, kind: 'video' },
};

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, OPTIONS',
};

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

function isR2Configured() {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
}

function decodeBase64(value) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length % 4 === 1) {
    throw new HttpError(400, 'Archivo invalido');
  }

  const buffer = Buffer.from(normalized, 'base64');
  if (!buffer.length) {
    throw new HttpError(400, 'Archivo vacio');
  }

  return buffer;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);
  if (event.httpMethod !== 'POST') {
    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  }

  try {
    await requireAuth(event);

    const body = parseJsonBody(event);
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

    const buffer = decodeBase64(fileData);
    if (buffer.length > typeConfig.maxBytes) {
      throw new HttpError(
        400,
        typeConfig.kind === 'video'
          ? 'Video demasiado grande (max 20MB)'
          : 'Imagen demasiado grande (max 5MB)'
      );
    }

    if (!isR2Configured()) {
      if (process.env.CONTEXT === 'production') {
        throw new HttpError(503, 'Uploads no configurados');
      }

      return jsonResponse(event, 200, {
        url: `data:${contentType};base64,${fileData}`,
        type: typeConfig.kind,
        warning: 'R2 no configurado: archivo en memoria (solo desarrollo)',
      }, HTTP_OPTIONS);
    }

    const key = `${typeConfig.folder}/${Date.now()}-${randomUUID()}.${typeConfig.ext}`;
    const client = getR2Client();

    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    return jsonResponse(event, 200, {
      url: `${PUBLIC_URL.replace(/\/$/, '')}/${key}`,
      key,
      type: typeConfig.kind,
    }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
