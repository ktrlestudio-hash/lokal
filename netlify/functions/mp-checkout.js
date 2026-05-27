import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
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

export const PRECIO_MENSUAL = 4990;
export const PRECIO_ANUAL = 47900;
export const PRECIO_PREMIUM = 9990;

const PLANES = new Set(['mensual', 'anual', 'premium']);
const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, OPTIONS',
};

const BUCKET = process.env.R2_BUCKET_NAME;
const PENDING_KEY = 'data/mp-pending.json';
const PENDING_LOCAL = join('/tmp', 'lokal-mp-pending.json');

function isR2() {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function r2() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function readPending() {
  if (isR2()) {
    try {
      const res = await r2().send(new GetObjectCommand({ Bucket: BUCKET, Key: PENDING_KEY }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return {};
      throw err;
    }
  }

  if (!existsSync(PENDING_LOCAL)) return {};
  return JSON.parse(readFileSync(PENDING_LOCAL, 'utf8'));
}

async function writePending(data) {
  if (isR2()) {
    await r2().send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: PENDING_KEY,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }));
    return;
  }

  writeFileSync(PENDING_LOCAL, JSON.stringify(data, null, 2));
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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);
  if (event.httpMethod !== 'POST') {
    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return jsonResponse(event, 503, { error: 'Pagos no configurados aun. Contacta al administrador.' }, HTTP_OPTIONS);
  }

  try {
    const user = await requireAuth(event);
    const body = parseJsonBody(event);
    const plan = sanitizePlan(body.plan);
    const tiendaId = body.tiendaId ? sanitizeText(String(body.tiendaId), { max: 64, multiline: false }) : '';
    const isRenovacion = !!tiendaId;
    const precio = plan === 'anual' ? PRECIO_ANUAL : PRECIO_MENSUAL;
    const titulo = plan === 'anual'
      ? 'Lokal Tienda - Plan Anual (13 meses de acceso)'
      : 'Lokal Tienda - Plan Mensual (2 meses al activar)';
    const appUrl = (process.env.URL || 'http://localhost:8888').replace(/\/$/, '');
    const tiendas = await readTiendas();

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
      const pending = await readPending();
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

      await writePending(pending);
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
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
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
    }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
