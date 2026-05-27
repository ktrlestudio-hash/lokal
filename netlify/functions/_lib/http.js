const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:8888',
  'http://127.0.0.1:8888',
  'http://localhost:8889',
  'http://127.0.0.1:8889',
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
  const headers = event?.headers || {};
  const target = String(name || '').toLowerCase();

  // Soportar Headers object (web standard) o objeto plano
  const entries = typeof headers.entries === 'function'
    ? [...headers.entries()]
    : Object.entries(headers);

  for (const [key, value] of entries) {
    if (String(key).toLowerCase() === target) return value;
  }
  return undefined;
}

export function getAllowedOrigins() {
  const origins = new Set(LOCAL_ORIGINS);
  [
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.DEPLOY_URL,
    process.env.SITE_URL,
  ].forEach((value) => {
    const origin = normalizeOrigin(value);
    if (origin) origins.add(origin);
  });
  return origins;
}

export function buildCorsHeaders(event, {
  allowHeaders = 'Content-Type',
  allowMethods = 'GET, POST, OPTIONS',
  extraHeaders = {},
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
  if (origin && getAllowedOrigins().has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }

  return headers;
}

export function handleOptions(event, options = {}) {
  const headers = buildCorsHeaders(event, options);
  const origin = normalizeOrigin(getHeader(event, 'origin'));

  if (origin && !getAllowedOrigins().has(origin)) {
    return { statusCode: 403, headers, body: '' };
  }

  return { statusCode: 204, headers, body: '' };
}

export function jsonResponse(event, statusCode, body, options = {}) {
  const headers = buildCorsHeaders(event, options);
  return {
    statusCode,
    headers,
    body: body === '' ? '' : JSON.stringify(body),
  };
}

export function parseJsonBody(event) {
  try {
    // Netlify Functions v1: event.body string
    if (event?.body && typeof event.body === 'string') {
      return JSON.parse(event.body);
    }
    return {};
  } catch {
    throw new HttpError(400, 'JSON invalido');
  }
}

export async function parseJsonBodyAsync(event) {
  try {
    // Netlify Functions v2: Request object con .json()
    if (typeof event.json === 'function') {
      return await event.json();
    }
    // Fallback a parseJsonBody síncrono
    return parseJsonBody(event);
  } catch {
    throw new HttpError(400, 'JSON invalido');
  }
}

export function isHttpError(error) {
  return error instanceof HttpError;
}

export function handleError(event, error, fallbackMessage = 'Error interno') {
  if (isHttpError(error)) {
    return jsonResponse(event, error.statusCode, {
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  console.error(error);
  return jsonResponse(event, 500, { error: fallbackMessage });
}
