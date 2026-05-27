import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse } from './_lib/http.js';
import { readTiendas } from './_lib/tiendas-store.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, OPTIONS',
};

function isR2() {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function readJson(r2Key, localFile) {
  if (isR2()) {
    try {
      const res = await r2Client().send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: r2Key }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return [];
      throw err;
    }
  }
  if (!existsSync(localFile)) return [];
  return JSON.parse(readFileSync(localFile, 'utf8'));
}

function calcProfileScore(tienda) {
  const items = [
    { key: 'foto',        done: !!tienda.foto,                           label: 'Foto de perfil' },
    { key: 'descripcion', done: (tienda.descripcion || '').length >= 20, label: 'Descripción (mín. 20 caracteres)' },
    { key: 'telefono',    done: !!tienda.telefono,                        label: 'Teléfono / WhatsApp' },
    { key: 'ciudad',      done: !!tienda.ciudad,                          label: 'Ciudad' },
    { key: 'direccion',   done: !!tienda.direccion,                       label: 'Dirección' },
    { key: 'rubros',      done: (tienda.rubros || []).length > 0,         label: 'Al menos 1 rubro' },
    { key: 'galeria',     done: (tienda.galeria || []).length >= 2,       label: 'Galería (mín. 2 fotos)' },
    { key: 'horarios',    done: !!(tienda.horarios && tienda.horarios.trim()), label: 'Horarios de atención' },
    { key: 'slug',        done: !!tienda.slug,                            label: 'URL personalizada' },
    { key: 'tagline',     done: (tienda.tagline || '').length >= 5,       label: 'Tagline / eslogan' },
    { key: 'instagram',   done: !!tienda.instagram,                       label: 'Instagram' },
  ];
  const done = items.filter(i => i.done).length;
  return { items, done, total: items.length, pct: Math.round((done / items.length) * 100) };
}

async function callClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new HttpError(503, 'Servicio de IA no configurado');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new HttpError(502, `Error de IA: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);
    if (event.httpMethod !== 'GET') {
      return jsonResponse(event, 405, { error: 'Método no permitido' }, HTTP_OPTIONS);
    }

    const tiendas = await readTiendas();
    const tienda = tiendas.find(t => t.ownerUid === user.uid);
    if (!tienda) throw new HttpError(404, 'Tienda no encontrada');

    const [respuestas, ofertas] = await Promise.all([
      readJson('data/respuestas.json', join('/tmp', 'lokal-respuestas.json')),
      readJson('data/ofertas.json', join('/tmp', 'lokal-ofertas.json')),
    ]);

    const misRespuestas = respuestas.filter(r => String(r.tiendaId) === String(tienda.id));
    const misOfertas = ofertas.filter(o => String(o.tiendaId) === String(tienda.id));
    const profile = calcProfileScore(tienda);

    // Build context for Claude
    const context = {
      nombre: tienda.nombre,
      ciudad: tienda.ciudad || null,
      rubros: tienda.rubros || [],
      descripcion: tienda.descripcion || null,
      totalRespuestas: misRespuestas.length,
      totalOfertas: misOfertas.filter(o => o.activa !== false).length,
      totalOfertasInactivas: misOfertas.filter(o => o.activa === false).length,
      perfilCompleto: profile.pct,
      camposFaltantes: profile.items.filter(i => !i.done).map(i => i.label),
      suscripcion: tienda.suscripcion?.plan || 'sin plan',
    };

    const prompt = `Sos un asistente experto en marketplaces locales llamado "Lokal".
Analizás el perfil de una tienda dentro de la plataforma Lokal (donde vecinos publican demandas y comercios locales responden con sus productos).

Datos de la tienda:
${JSON.stringify(context, null, 2)}

Generá un análisis breve y accionable en español argentino (tutear). Respondé con JSON puro, sin markdown, con este formato exacto:
{
  "resumen": "Una frase de evaluación general (máx 100 caracteres)",
  "score": <número del 1 al 10 basado en los datos>,
  "consejos": [
    { "titulo": "Título corto", "detalle": "Explicación concreta de qué hacer y por qué (máx 120 caracteres)", "prioridad": "alta|media|baja" }
  ],
  "fortalezas": ["frase corta 1", "frase corta 2"]
}

Máximo 4 consejos. Sé específico con los datos reales. Si el perfil está incompleto, priorizá eso.`;

    const raw = await callClaude(prompt);

    let parsed;
    try {
      // Extract JSON even if Claude wraps it in text
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : raw);
    } catch {
      throw new HttpError(502, 'Respuesta de IA no válida');
    }

    return jsonResponse(event, 200, {
      insights: parsed,
      profile,
    }, HTTP_OPTIONS);

  } catch (error) {
    return handleError(event, error);
  }
};
