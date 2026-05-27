import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { handleError, handleOptions, HttpError, jsonResponse } from './_lib/http.js';

const BUCKET = process.env.R2_BUCKET_NAME;
const UPLOAD_DIR = join('/tmp', 'lokal-uploads');

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, OPTIONS',
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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);
  if (event.httpMethod !== 'POST') {
    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  }

  try {
    // Auth básica
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) throw new HttpError(401, 'No autorizado');

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    // Parsear multipart form data (simplificado - esperamos base64)
    const body = JSON.parse(event.body);
    const { imageBase64, fileName } = body;

    if (!imageBase64) throw new HttpError(400, 'Falta imagen');

    // Convertir base64 a buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Detectar extensión
    const ext = fileName?.split('.').pop() || 'jpg';
    const key = `comprobantes/${payload.uid}_${Date.now()}.${ext}`;

    let publicUrl;

    if (isR2()) {
      await r2().send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      }));
      publicUrl = `https://${process.env.R2_PUBLIC_URL || BUCKET + '.r2.dev'}/${key}`;
    } else {
      // Guardar localmente para dev
      mkdirSync(UPLOAD_DIR, { recursive: true });
      const localPath = join(UPLOAD_DIR, key.replace('/', '_'));
      writeFileSync(localPath, buffer);
      publicUrl = `/uploads/${key.replace('/', '_')}`;
    }

    return jsonResponse(event, 200, { ok: true, url: publicUrl }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
