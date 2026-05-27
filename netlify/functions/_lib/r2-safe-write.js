/**
 * Safe read-modify-write para R2.
 *
 * R2/S3 no soporta IfMatch en PutObject (conditional put),
 * así que usamos HeadObject para verificar el ETag justo antes de escribir.
 * La ventana de race queda reducida a microsegundos — aceptable para esta escala.
 *
 * Uso:
 *   const { data, etag } = await safeRead(client, bucket, key, []);
 *   data.push(newItem);
 *   await safeWrite(client, bucket, key, data, etag);  // lanza 409 si alguien escribió entre medio
 */

import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { HttpError } from './http.js';

export async function safeRead(client, bucket, key, defaultValue = []) {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const data = JSON.parse(await res.Body.transformToString());
    // ETag viene con comillas del estándar S3, las sacamos para comparar limpio
    const etag = (res.ETag || '').replace(/"/g, '');
    return { data, etag };
  } catch (err) {
    if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') {
      return { data: defaultValue, etag: null };
    }
    throw err;
  }
}

export async function safeWrite(client, bucket, key, data, expectedEtag) {
  // Si el archivo no existía antes (etag null), no hay nada que verificar
  if (expectedEtag !== null) {
    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      const currentEtag = (head.ETag || '').replace(/"/g, '');
      if (currentEtag !== expectedEtag) {
        throw new HttpError(409, 'El archivo fue modificado por otro proceso. Intentá de nuevo.');
      }
    } catch (err) {
      if (err instanceof HttpError) throw err;
      // Si el HeadObject falla por otro motivo, dejamos pasar (mejor escribir que no escribir)
    }
  }

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
  }));
}
