import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ─── Subida de imágenes a Cloudflare R2 ──────────────────────────────────────
// Recibe base64 desde el frontend, sube a R2, devuelve URL pública.
//
// Variables de entorno necesarias:
//   CF_ACCOUNT_ID        → ID de tu cuenta Cloudflare
//   R2_ACCESS_KEY_ID     → API Token con permisos R2
//   R2_SECRET_ACCESS_KEY → Secret del token
//   R2_BUCKET_NAME       → Nombre del bucket
//   R2_PUBLIC_URL        → URL pública del bucket (si tenés dominio personalizado
//                          o el bucket tiene acceso público habilitado)
//                          Ej: https://pub-xxxxx.r2.dev

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

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { fileName, fileData, contentType } = body;

    if (!fileName || !fileData || !contentType) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'fileName, fileData y contentType son requeridos' }) };
    }

    // Validar que sea imagen
    if (!contentType.startsWith('image/')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Solo se permiten imágenes' }) };
    }

    // Validar tamaño (máx 5MB en base64 ≈ ~6.6MB de string)
    if (fileData.length > 7 * 1024 * 1024) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Imagen demasiado grande (máx 5MB)' }) };
    }

    if (!isR2Configured()) {
      // Sin R2: devolver la imagen como data URL (solo para desarrollo local)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          url: `data:${contentType};base64,${fileData}`,
          warning: 'R2 no configurado: imagen en memoria (solo desarrollo)',
        }),
      };
    }

    // Generar key única para la imagen
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buffer = Buffer.from(fileData, 'base64');

    const client = getR2Client();
    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Si querés que sea público por defecto:
      // ACL: 'public-read',
    });

    await client.send(cmd);

    const url = `${PUBLIC_URL.replace(/\/$/, '')}/${key}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url, key }),
    };
  } catch (err) {
    console.error('Error en /upload:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
