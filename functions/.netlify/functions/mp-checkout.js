// mp-checkout.js — Cloudflare Pages Functions version de netlify/functions/mp-checkout.js.
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import {
  requireText,
  sanitizeEmail,
  sanitizeMediaUrls,
  sanitizePhone,
  sanitizeStringArray,
  sanitizeText,
} from './_lib/validation.js';
import { ensureStoreOwner, findTiendaById, findTiendaByOwnerUid, readTiendas } from './_lib/tiendas-store.js';
import { safeRead, safeWrite } from './_lib/r2-safe-write.js';

export const PRECIO_MENSUAL = 4990;
export const PRECIO_ANUAL = 47900;
export const PRECIO_PREMIUM = 9990;

const PLANES = new Set(['mensual', 'anual', 'premium']);
const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, OPTIONS',
};

const PENDING_KEY = 'data/mp-pending.json';

async function readPending(bucket) {
  const { data } = await safeRead(bucket, PENDING_KEY, {});
  return data;
}

async function writePending(bucket, data) {
  const { etag } = await safeRead(bucket, PENDING_KEY, {});
  await safeWrite(bucket, PENDING_KEY, data, etag);
}

function sanitizePlan(value) {
  const plan = sanitizeText(value, { max: 16, multiline: false }).toLowerCase();
  if (!PLANES.has(plan)) {
    throw new HttpError(400, 'plan invalido');
  }
  return plan;
}

function sanitizeTiendaInfo(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new HttpError(400, 'tiendaInfo es requerido');
  }

  return {
    nombre: requireText(raw.nombre, { field: 'nombre', min: 2, max: 120, multiline: false }),
    descripcion: sanitizeText(raw.descripcion, { max: 1500 }),
    ciudad: requireText(raw.ciudad, { field: 'ciudad', min: 2, max: 80, multiline: false }),
    telefono: sanitizePhone(raw.telefono),
    rubros: sanitizeStringArray(raw.rubros, { maxItems: 10, maxItemLength: 48 }),
    emailContacto: raw.emailContacto ? sanitizeEmail(raw.emailContacto, { field: 'emailContacto' }) : '',
    foto: sanitizeMediaUrls(raw.foto ? [raw.foto] : [], { maxItems: 1 })[0] || null,
    galeria: sanitizeMediaUrls(raw.galeria, { maxItems: 6 }),
  };
}

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestPost({ request, env }) {
  const event = request;

  if (!env.MP_ACCESS_TOKEN) {
    return jsonResponse(event, 503, { error: 'Pagos no configurados aun. Contacta al administrador.' }, { ...HTTP_OPTIONS, env });
  }

  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    const body = await parseJsonBody(event);
    const plan = sanitizePlan(body.plan);
    const tiendaId = body.tiendaId ? sanitizeText(String(body.tiendaId), { max: 64, multiline: false }) : '';
    const isRenovacion = !!tiendaId;
    const precio = plan === 'anual' ? PRECIO_ANUAL : PRECIO_MENSUAL;
    const titulo = plan === 'anual'
      ? 'Lokal Tienda - Plan Anual (13 meses de acceso)'
      : 'Lokal Tienda - Plan Mensual (2 meses al activar)';
    const appUrl = new URL(request.url).origin;
    const tiendas = await readTiendas(bucket);

    if (isRenovacion) {
      const tienda = findTiendaById(tiendas, tiendaId);
      ensureStoreOwner(user, tienda, 'No autorizado para renovar esta tienda');
    } else {
      if (findTiendaByOwnerUid(tiendas, user.uid)) {
        throw new HttpError(409, 'Esta cuenta ya tiene una tienda registrada');
      }
      if (body.termsAccepted !== true) {
        throw new HttpError(400, 'Debes aceptar los terminos y la politica de privacidad');
      }
    }

    const ref = `${isRenovacion ? 'renewal' : 'new'}_${user.uid}_${Date.now()}`;

    if (!isRenovacion) {
      const tiendaInfo = sanitizeTiendaInfo(body.tiendaInfo);
      const pending = await readPending(bucket);
      pending[ref] = {
        tiendaInfo,
        googleUid: user.uid,
        ownerNombre: sanitizeText(user.name || '', { max: 120, multiline: false }),
        ownerEmail: sanitizeEmail(user.email, { required: true, field: 'ownerEmail' }),
        plan,
        creadoEn: new Date().toISOString(),
      };

      const cutoff = Date.now() - 48 * 3600 * 1000;
      for (const key of Object.keys(pending)) {
        if (new Date(pending[key].creadoEn).getTime() < cutoff) delete pending[key];
      }

      await writePending(bucket, pending);
    }

    const preference = {
      items: [{
        id: `lokal-${plan}`,
        title: titulo,
        quantity: 1,
        unit_price: precio,
        currency_id: 'ARS',
      }],
      payer: {
        name: sanitizeText(user.name || '', { max: 120, multiline: false }),
        email: sanitizeEmail(user.email, { required: true, field: 'ownerEmail' }),
      },
      back_urls: {
        success: `${appUrl}/?mp_status=approved&ref=${ref}`,
        failure: `${appUrl}/?mp_status=failure&ref=${ref}`,
        pending: `${appUrl}/?mp_status=pending&ref=${ref}`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/.netlify/functions/mp-webhook`,
      external_reference: ref,
      metadata: {
        plan,
        google_uid: user.uid,
        tienda_id: tiendaId || null,
        is_renovacion: isRenovacion,
      },
      statement_descriptor: 'LOKAL TIENDA',
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': ref,
      },
      body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
      let detail = null;
      try {
        detail = await mpRes.json();
      } catch {
        detail = null;
      }
      console.error('[mp-checkout] MP error:', detail || mpRes.status);
      throw new HttpError(502, 'Error al crear preferencia de pago');
    }

    const pref = await mpRes.json();
    return jsonResponse(event, 200, {
      initPoint: pref.init_point,
      sandboxInitPoint: pref.sandbox_init_point,
      preferenceId: pref.id,
      ref,
    }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
