/**
 * Safe read-modify-write para R2 — Cloudflare Pages Functions version.
 *
 * A diferencia de la versión Netlify (que hablaba con R2 vía el SDK S3,
 * porque Netlify Functions no tiene acceso nativo a R2), acá `bucket` es
 * directamente el R2Bucket binding que Cloudflare inyecta en env — la API
 * real de Workers, no una emulación S3. Eso además habilita un IfMatch
 * REAL: `put(key, body, { onlyIf: { etagMatches } })` rechaza la escritura
 * atómicamente si el etag no coincide, sin la ventana de carrera de
 * HeadObject-luego-PutObject que tenía que asumir el SDK S3 (el comentario
 * viejo "R2/S3 no soporta IfMatch" era cierto para el SDK S3, no para el
 * binding nativo).
 *
 * Uso:
 *   const { data, etag } = await safeRead(env.R2_BUCKET, key, []);
 *   data.push(newItem);
 *   await safeWrite(env.R2_BUCKET, key, data, etag);  // lanza 409 si alguien escribió entre medio
 */
import { HttpError } from './http.js';

export async function safeRead(bucket, key, defaultValue = []) {
  const obj = await bucket.get(key);
  if (!obj) return { data: defaultValue, etag: null };
  const data = JSON.parse(await obj.text());
  return { data, etag: obj.httpEtag };
}

export async function safeWrite(bucket, key, data, expectedEtag) {
  const body = JSON.stringify(data, null, 2);
  const options = { httpMetadata: { contentType: 'application/json' } };

  // onlyIf.etagMatches: condición atómica real del binding R2 — si el etag
  // actual no coincide, put() rechaza la escritura entera sin haberla
  // aplicado (no hay ventana de carrera entre leer el etag actual y
  // escribir, a diferencia del HeadObject-then-Put del SDK S3).
  if (expectedEtag !== null) {
    options.onlyIf = { etagMatches: expectedEtag };
  }

  const result = await bucket.put(key, body, options);
  if (result === null) {
    // put() devuelve null cuando onlyIf no se cumplió — el objeto NO se
    // escribió, alguien más lo modificó entre la lectura y este write.
    throw new HttpError(409, 'El archivo fue modificado por otro proceso. Intentá de nuevo.');
  }
}
