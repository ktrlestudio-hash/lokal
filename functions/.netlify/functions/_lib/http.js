// _lib/http.js — Cloudflare Pages Functions version.
//
// Las funciones de negocio (tiendas-crud.js, ofertas.js, etc.) llaman a
// jsonResponse/handleError y esperan de vuelta un objeto Response real de
// la Web API (Cloudflare no entiende {statusCode, headers, body} como
// Netlify) — a diferencia de la versión de netlify/functions/_lib/http.js,
// acá jsonResponse/handleOptions ya construyen y devuelven `new Response(...)`
// directamente, así el resto del código de cada function no necesita saber
// que cambió de plataforma.
//
// getHeader/buildCorsHeaders siguen recibiendo `event`, pero acá `event` ES
// el propio `Request` de Cloudflare (headers Web API real, .entries()
// siempre disponible) — no hace falta la doble rama Headers-object-vs-plano
// que sí hacía falta para Netlify Functions v1.
const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:8788', // wrangler pages dev, puerto default
  'http://127.0.0.1:8788',
];

export class HttpError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function normalizeOrigin(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getHeader(event, name) {
  return event?.headers?.get?.(name) ?? undefined;
}

// Cloudflare no tiene process.env.URL/DEPLOY_PRIME_URL como Netlify — la
// única forma real de saber el origin propio en un Worker es leerlo del
// propio Request entrante (siempre confiable, es el mismo request que
// disparó esta función). env.SITE_URL queda como override opcional para un
// dominio custom que no coincida con el host del request.
export function getAllowedOrigins(event, env = {}) {
  const origins = new Set(LOCAL_ORIGINS);
  const selfOrigin = normalizeOrigin(event?.url);
  if (selfOrigin) origins.add(selfOrigin);
  const override = normalizeOrigin(env.SITE_URL);
  if (override) origins.add(override);
  return origins;
}

export function buildCorsHeaders(event, {
  allowHeaders = 'Content-Type',
  allowMethods = 'GET, POST, OPTIONS',
  extraHeaders = {},
  env = {},
} = {}) {
  const headers = {
    'Access-Control-Allow-Headers': allowHeaders,
    'Access-Control-Allow-Methods': allowMethods,
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  };

  const origin = normalizeOrigin(getHeader(event, 'origin'));
  if (origin && getAllowedOrigins(event, env).has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }

  return headers;
}

export function handleOptions(event, options = {}) {
  const headers = buildCorsHeaders(event, options);
  const origin = normalizeOrigin(getHeader(event, 'origin'));

  if (origin && !getAllowedOrigins(event, options.env).has(origin)) {
    return new Response('', { status: 403, headers });
  }

  return new Response('', { status: 204, headers });
}

export function jsonResponse(event, statusCode, body, options = {}) {
  const headers = buildCorsHeaders(event, options);
  return new Response(body === '' ? '' : JSON.stringify(body), { status: statusCode, headers });
}

// event acá es el Request real de Cloudflare — .json() es nativo, no hace
// falta la rama "Netlify v1 con event.body string" que tenía la versión
// original. Se mantiene el nombre parseJsonBody (no Async) para que el
// código de cada function migrada no tenga que cambiar la llamada.
export async function parseJsonBody(event) {
  try {
    return await event.json();
  } catch {
    throw new HttpError(400, 'JSON invalido');
  }
}

export function isHttpError(error) {
  return error instanceof HttpError;
}

export function handleError(event, error, fallbackMessage = 'Error interno', options = {}) {
  if (isHttpError(error)) {
    return jsonResponse(event, error.statusCode, {
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    }, options);
  }

  console.error(error);
  return jsonResponse(event, 500, { error: fallbackMessage }, options);
}
