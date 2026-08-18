// store-insights.js — Cloudflare Pages Functions version.
//
// Bug corregido al portar: el original (netlify/functions/store-insights.js)
// buscaba la tienda con `t.ownerUid === user.uid`, pero el campo real en el
// modelo de tienda (tiendas-store.js, buildStorePayload) es `googleUid` —
// `ownerUid` no existe en ningún objeto tienda real, así que este endpoint
// tiraba 404 "Tienda no encontrada" siempre, para cualquier usuario.
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse } from './_lib/http.js';
import { readTiendas } from './_lib/tiendas-store.js';
import { readOfertas } from './_lib/ofertas-read.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, OPTIONS',
};

function calcProfileScore(tienda) {
  const items = [
    { key: 'foto', done: !!tienda.foto, label: 'Foto de perfil' },
    { key: 'descripcion', done: (tienda.descripcion || '').length >= 20, label: 'Descripción (mín. 20 caracteres)' },
    { key: 'telefono', done: !!tienda.telefono, label: 'Teléfono / WhatsApp' },
    { key: 'ciudad', done: !!tienda.ciudad, label: 'Ciudad' },
    { key: 'direccion', done: !!tienda.direccion, label: 'Dirección' },
    { key: 'rubros', done: (tienda.rubros || []).length > 0, label: 'Al menos 1 rubro' },
    { key: 'galeria', done: (tienda.galeria || []).length >= 2, label: 'Galería (mín. 2 fotos)' },
    { key: 'horarios', done: !!(tienda.horarios && tienda.horarios.trim()), label: 'Horarios de atención' },
    { key: 'slug', done: !!tienda.slug, label: 'URL personalizada' },
    { key: 'tagline', done: (tienda.tagline || '').length >= 5, label: 'Tagline / eslogan' },
    { key: 'instagram', done: !!tienda.instagram, label: 'Instagram' },
  ];
  const done = items.filter((i) => i.done).length;
  return { items, done, total: items.length, pct: Math.round((done / items.length) * 100) };
}

async function callClaude(prompt, env) {
  const apiKey = env.ANTHROPIC_API_KEY;
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

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestGet({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);

    const tiendas = await readTiendas(bucket);
    const tienda = tiendas.find((t) => t.googleUid === user.uid);
    if (!tienda) throw new HttpError(404, 'Tienda no encontrada');

    const ofertas = await readOfertas(bucket);

    const misOfertas = ofertas.filter((o) => String(o.tiendaId) === String(tienda.id));
    const profile = calcProfileScore(tienda);

    const context = {
      nombre: tienda.nombre,
      ciudad: tienda.ciudad || null,
      rubros: tienda.rubros || [],
      descripcion: tienda.descripcion || null,
      totalOfertas: misOfertas.filter((o) => o.activa !== false).length,
      totalOfertasInactivas: misOfertas.filter((o) => o.activa === false).length,
      perfilCompleto: profile.pct,
      camposFaltantes: profile.items.filter((i) => !i.done).map((i) => i.label),
      suscripcion: tienda.suscripcion?.plan || 'sin plan',
    };

    const prompt = `Sos un asistente experto en marketplaces locales llamado "Lokal".
Analizás el perfil de una tienda dentro de la plataforma Lokal (donde vecinos piden comida y comercios locales gestionan su catálogo y pedidos).

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

    const raw = await callClaude(prompt, env);

    let parsed;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : raw);
    } catch {
      throw new HttpError(502, 'Respuesta de IA no válida');
    }

    return jsonResponse(event, 200, {
      insights: parsed,
      profile,
    }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
