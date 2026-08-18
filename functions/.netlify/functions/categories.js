// categories.js — Cloudflare Pages Functions version.
import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, jsonResponse, parseJsonBody } from './_lib/http.js';
import { requireText, sanitizeText } from './_lib/validation.js';
import { safeRead, safeWrite } from './_lib/r2-safe-write.js';

const DATA_KEY = 'data/categories-custom.json';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, OPTIONS',
};

async function readCustom(bucket) {
  const { data } = await safeRead(bucket, DATA_KEY, []);
  return data;
}

async function writeCustom(bucket, data) {
  const { etag } = await safeRead(bucket, DATA_KEY, []);
  await safeWrite(bucket, DATA_KEY, data, etag);
}

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestGet({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env).catch(() => null);
    const custom = await readCustom(bucket);

    if (user?.isAdmin) {
      return jsonResponse(event, 200, custom, { ...HTTP_OPTIONS, env });
    }

    const aprobadas = custom.filter((c) => c.aprobada !== false);
    return jsonResponse(event, 200, aprobadas, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);

    const body = await parseJsonBody(event);
    const name = requireText(body.name, { field: 'name', min: 2, max: 60, multiline: false });
    const parentId = sanitizeText(body.parentId, { max: 80, multiline: false }) || null;
    const icon = sanitizeText(body.icon, { max: 40, multiline: false }) || null;
    const custom = await readCustom(bucket);

    const exists = custom.find(
      (item) => item.name.toLowerCase() === name.toLowerCase() && item.parentId === parentId
    );
    if (exists) {
      return jsonResponse(event, 200, exists, { ...HTTP_OPTIONS, env });
    }

    const nueva = {
      id: `custom_${Date.now()}`,
      name,
      parentId,
      icon,
      custom: true,
      aprobada: false,
      creadaPor: user.uid,
      creadaPorEmail: user.email,
      createdAt: new Date().toISOString(),
    };

    custom.push(nueva);
    await writeCustom(bucket, custom);
    return jsonResponse(event, 201, nueva, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestPatch({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    ensureAdmin(user);

    const body = await parseJsonBody(event);
    const { id, aprobada, name: nuevoNombre } = body;

    if (!id) {
      return jsonResponse(event, 400, { error: 'Falta id' }, { ...HTTP_OPTIONS, env });
    }

    const custom = await readCustom(bucket);
    const idx = custom.findIndex((c) => c.id === id);
    if (idx === -1) {
      return jsonResponse(event, 404, { error: 'Categoria no encontrada' }, { ...HTTP_OPTIONS, env });
    }

    if (aprobada !== undefined) {
      custom[idx].aprobada = !!aprobada;
      custom[idx].aprobadaPor = user.email;
      custom[idx].aprobadaEn = new Date().toISOString();
    }

    if (nuevoNombre) {
      custom[idx].name = requireText(nuevoNombre, { field: 'name', min: 2, max: 60, multiline: false });
    }

    await writeCustom(bucket, custom);
    return jsonResponse(event, 200, custom[idx], { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestDelete({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    ensureAdmin(user);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return jsonResponse(event, 400, { error: 'Falta id' }, { ...HTTP_OPTIONS, env });
    }

    const custom = await readCustom(bucket);
    const filtradas = custom.filter((c) => c.id !== id);
    await writeCustom(bucket, filtradas);
    return jsonResponse(event, 200, { ok: true }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
