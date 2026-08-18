import { HttpError } from './http.js';

const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stripControls(value, { multiline = true } = {}) {
  const input = String(value || '');
  /* eslint-disable no-control-regex -- intencional (sanitiza control chars) */
  return multiline
    ? input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    : input.replace(/[\u0000-\u001F\u007F]/g, ' ');
}
/* eslint-enable no-control-regex */

export function sanitizeText(value, { max = 500, multiline = true } = {}) {
  if (typeof value !== 'string') return '';

  let clean = stripControls(value, { multiline }).trim();
  clean = multiline
    ? clean.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n')
    : clean.replace(/\s+/g, ' ');

  if (clean.length > max) clean = clean.slice(0, max).trim();
  return clean;
}

export function requireText(value, {
  field,
  max = 500,
  min = 1,
  multiline = true,
} = {}) {
  const clean = sanitizeText(value, { max, multiline });
  if (clean.length < min) {
    throw new HttpError(400, `${field} es requerido`);
  }
  return clean;
}

export function sanitizeStringArray(value, {
  maxItems = 10,
  maxItemLength = 64,
} = {}) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const result = [];

  for (const item of value) {
    const clean = sanitizeText(item, { max: maxItemLength, multiline: false });
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
    if (result.length >= maxItems) break;
  }

  return result;
}

export function sanitizeEmail(value, {
  required = false,
  field = 'email',
} = {}) {
  const clean = sanitizeText(value, { max: 160, multiline: false }).toLowerCase();
  if (!clean) {
    if (required) throw new HttpError(400, `${field} es requerido`);
    return '';
  }
  if (!SIMPLE_EMAIL_RE.test(clean)) {
    throw new HttpError(400, `${field} no es valido`);
  }
  return clean;
}

export function sanitizePhone(value) {
  const clean = sanitizeText(value, { max: 32, multiline: false });
  if (!clean) return '';
  const normalized = clean.replace(/[^\d+()\-\s]/g, '').trim();
  if (normalized.length < 6) return '';
  return normalized.slice(0, 24);
}

export function sanitizeUrl(value) {
  const clean = sanitizeText(value, { max: 300, multiline: false });
  if (!clean) return '';

  try {
    const parsed = new URL(clean);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('bad-protocol');
    }
    return parsed.toString();
  } catch {
    throw new HttpError(400, 'URL no valida');
  }
}

export function sanitizeNumber(value, {
  field = 'valor',
  min = 0,
  max = 999999999,
  integer = false,
  nullable = true,
} = {}) {
  if (value === null || value === undefined || value === '') {
    if (nullable) return null;
    throw new HttpError(400, `${field} es requerido`);
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new HttpError(400, `${field} no es valido`);
  }
  if (num < min || num > max) {
    throw new HttpError(400, `${field} fuera de rango`);
  }
  if (integer && !Number.isInteger(num)) {
    throw new HttpError(400, `${field} debe ser entero`);
  }
  return num;
}

// allowDataUrls: en Netlify esto leía process.env.CONTEXT !== 'production'
// (variable propia de esa plataforma) — Cloudflare Workers no tiene
// process.env global, así que el caller decide explícitamente en vez de
// que esta función adivine el ambiente. Cada function que la usa pasa
// `env.CF_PAGES_BRANCH !== 'main'` o el equivalente que corresponda.
export function sanitizeMediaUrls(value, { maxItems = 6, allowDataUrls = false } = {}) {
  if (!Array.isArray(value)) return [];

  const out = [];
  const seen = new Set();
  const allowData = allowDataUrls;

  for (const item of value) {
    if (typeof item !== 'string') continue;
    const clean = item.trim();
    if (!clean || seen.has(clean)) continue;

    if (allowData && clean.startsWith('data:')) {
      seen.add(clean);
      out.push(clean);
    } else {
      try {
        const parsed = new URL(clean);
        const isLocalHttp =
          parsed.protocol === 'http:' &&
          ['localhost', '127.0.0.1'].includes(parsed.hostname);

        if (parsed.protocol !== 'https:' && !isLocalHttp) continue;

        seen.add(clean);
        out.push(parsed.toString());
      } catch {
        continue;
      }
    }

    if (out.length >= maxItems) break;
  }

  return out;
}

export function sanitizePlainObject(value, {
  maxKeys = 20,
  maxStringLength = 80,
} = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const out = {};
  for (const rawKey of Object.keys(value).slice(0, maxKeys)) {
    const key = sanitizeText(rawKey, { max: 40, multiline: false });
    if (!key) continue;

    const current = value[rawKey];
    if (typeof current === 'string') {
      out[key] = sanitizeText(current, { max: maxStringLength, multiline: false });
      continue;
    }

    if (typeof current === 'boolean' || typeof current === 'number' || current === null) {
      out[key] = current;
      continue;
    }

    if (current && typeof current === 'object' && !Array.isArray(current)) {
      const nested = {};
      for (const nestedKey of Object.keys(current).slice(0, 12)) {
        const nestedValue = current[nestedKey];
        if (typeof nestedValue === 'string') {
          nested[nestedKey] = sanitizeText(nestedValue, { max: maxStringLength, multiline: false });
        } else if (typeof nestedValue === 'boolean' || typeof nestedValue === 'number' || nestedValue === null) {
          nested[nestedKey] = nestedValue;
        }
      }
      out[key] = nested;
    }
  }

  return out;
}
