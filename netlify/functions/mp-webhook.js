import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHmac, timingSafeEqual } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getHeader, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { findTiendaById, findTiendaByOwnerUid, readTiendas, writeTiendas } from './_lib/tiendas-store.js';
import { readUserProfiles, writeUserProfiles, findUserProfileByUid } from './_lib/user-profiles-store.js';

const BUCKET = process.env.R2_BUCKET_NAME;
const TIENDAS_KEY = 'data/tiendas.json';
const PENDING_KEY = 'data/mp-pending.json';
const TIENDAS_LOCAL = join('/tmp', 'lokal-tiendas.json');
const PENDING_LOCAL = join('/tmp', 'lokal-mp-pending.json');

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type',
  allowMethods: 'POST, OPTIONS',
};

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

async function readJson(key, local, fallback) {
  if (isR2()) {
    try {
      const res = await r2().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return fallback;
      throw err;
    }
  }

  if (!existsSync(local)) return fallback;
  return JSON.parse(readFileSync(local, 'utf8'));
}

async function writeJson(key, local, data) {
  if (isR2()) {
    await r2().send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }));
    return;
  }

  writeFileSync(local, JSON.stringify(data, null, 2));
}

function addMonths(date, n) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + n);
  return next;
}

function calcNuevaVence(plan, esNuevo, venceActual) {
  const base = !esNuevo && venceActual && new Date(venceActual) > new Date()
    ? new Date(venceActual)
    : new Date();

  if (plan === 'anual') return addMonths(base, esNuevo ? 13 : 12);
  return addMonths(base, esNuevo ? 2 : 1);
}

function buildSuscripcion(plan, paymentId, monto, esNuevo, venceActual) {
  const now = new Date();
  const vence = calcNuevaVence(plan, esNuevo, venceActual);
  return {
    estado: 'activa',
    plan,
    inicio: now.toISOString(),
    vence: vence.toISOString(),
    esPromo: esNuevo,
    mpPaymentId: String(paymentId),
    historial: [
      { fecha: now.toISOString(), plan, monto: monto || null, paymentId: String(paymentId) },
    ],
  };
}

function hasProcessedPayment(existing, paymentId) {
  return !!existing?.historial?.some((entry) => String(entry.paymentId) === String(paymentId));
}

function mergeSuscripcion(existing, plan, paymentId, monto, esNuevo) {
  if (hasProcessedPayment(existing, paymentId)) {
    return existing;
  }

  const nueva = buildSuscripcion(plan, paymentId, monto, esNuevo, existing?.vence);
  return {
    ...nueva,
    historial: [
      ...(existing?.historial || []),
      { fecha: nueva.inicio, plan, monto: monto || null, paymentId: String(paymentId) },
    ],
  };
}

async function syncUserProfileSuscripcion(googleUid, suscripcion, tiendaData) {
  try {
    const profiles = await readUserProfiles();
    const idx = profiles.findIndex((p) => p.uid === googleUid);
    if (idx === -1) return; // no hay perfil, nada que hacer

    profiles[idx] = {
      ...profiles[idx],
      role: 'empresa',
      plan: profiles[idx].plan || 'basico',
      suscripcion,
      // Si no tiene businessProfile, crearlo desde tiendaData
      businessProfile: profiles[idx].businessProfile || {
        nombre: tiendaData.nombre || '',
        rubros: tiendaData.rubros || [],
        descripcion: tiendaData.descripcion || '',
        direccion: tiendaData.direccion || '',
        ciudad: tiendaData.ciudad || '',
        telefono: tiendaData.telefono || '',
        lat: tiendaData.lat || null,
        lng: tiendaData.lng || null,
        tieneLocal: tiendaData.tieneLocal || false,
        slug: tiendaData.slug || '',
        tagline: tiendaData.tagline || '',
        instagram: tiendaData.instagram || '',
        whatsapp: tiendaData.whatsapp || '',
        horarios: tiendaData.horarios || {},
        galeria: tiendaData.galeria || [],
        foto: tiendaData.foto || null,
        portada: tiendaData.portada || null,
      },
      updatedAt: new Date().toISOString(),
    };

    await writeUserProfiles(profiles);
  } catch (err) {
    console.error('[mp-webhook] Error syncUserProfileSuscripcion:', err);
    // No fallar el webhook por esto
  }
}

function safeEqualHex(a, b) {
  const left = Buffer.from(String(a || ''), 'hex');
  const right = Buffer.from(String(b || ''), 'hex');
  if (!left.length || !right.length || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function parseSignatureHeader(value) {
  const parts = {};
  for (const item of String(value || '').split(',')) {
    const [key, raw] = item.split('=');
    if (!key || !raw) continue;
    parts[key.trim()] = raw.trim();
  }
  return parts;
}

function validateMercadoPagoSignature(event, body) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return;

  const xSignature = getHeader(event, 'x-signature');
  const xRequestId = getHeader(event, 'x-request-id');
  const parsed = parseSignatureHeader(xSignature);
  const ts = parsed.ts;
  const v1 = parsed.v1;
  const dataId = event.queryStringParameters?.['data.id'] || body?.data?.id || '';

  if (!ts || !v1 || !xRequestId || !dataId) {
    throw new HttpError(401, 'Webhook de Mercado Pago sin firma valida');
  }

  const manifest = [
    dataId ? `id:${String(dataId).toLowerCase()};` : '',
    xRequestId ? `request-id:${xRequestId};` : '',
    ts ? `ts:${ts};` : '',
  ].join('');

  const expected = createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  if (!safeEqualHex(expected, v1)) {
    throw new HttpError(401, 'Firma de webhook invalida');
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    if (event.httpMethod !== 'POST') {
      return jsonResponse(event, 200, { skipped: 'unsupported_method' }, HTTP_OPTIONS);
    }

    const body = parseJsonBody(event);

    if (process.env.MP_WEBHOOK_SECRET) {
      validateMercadoPagoSignature(event, body);
    }

    if (body.type !== 'payment' || !body.data?.id) {
      return jsonResponse(event, 200, { skipped: 'unsupported_event' }, HTTP_OPTIONS);
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      return jsonResponse(event, 200, { skipped: 'mp_not_configured' }, HTTP_OPTIONS);
    }

    const paymentId = body.data.id;
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });

    if (!mpRes.ok) {
      return jsonResponse(event, 200, { skipped: 'payment_lookup_failed' }, HTTP_OPTIONS);
    }

    const payment = await mpRes.json();
    if (payment.status !== 'approved') {
      return jsonResponse(event, 200, { skipped: payment.status }, HTTP_OPTIONS);
    }

    const ref = payment.external_reference || '';
    const meta = payment.metadata || {};
    const plan = meta.plan === 'anual' ? 'anual' : 'mensual';
    const googleUid = meta.google_uid;
    const isRenovacion = meta.is_renovacion || ref.startsWith('renewal_');
    const tiendaId = meta.tienda_id;
    const monto = payment.transaction_amount;
    const tiendas = await readJson(TIENDAS_KEY, TIENDAS_LOCAL, []);

    if (isRenovacion && tiendaId) {
      const idx = tiendas.findIndex((item) => String(item.id) === String(tiendaId));
      if (idx !== -1) {
        const nuevaSuscripcion = mergeSuscripcion(
          tiendas[idx].suscripcion,
          plan,
          paymentId,
          monto,
          false
        );
        tiendas[idx].suscripcion = nuevaSuscripcion;
        tiendas[idx].activa = true;
        tiendas[idx].updatedAt = new Date().toISOString();
        await writeTiendas(tiendas);
        // Sincronizar con userProfile
        await syncUserProfileSuscripcion(googleUid, nuevaSuscripcion, tiendas[idx]);
      }
      return jsonResponse(event, 200, { ok: true, tipo: 'renovacion' }, HTTP_OPTIONS);
    }

    const existente = findTiendaByOwnerUid(tiendas, googleUid);
    if (existente) {
      const nuevaSuscripcion = mergeSuscripcion(
        existente.suscripcion,
        plan,
        paymentId,
        monto,
        false
      );
      existente.suscripcion = nuevaSuscripcion;
      existente.activa = true;
      existente.updatedAt = new Date().toISOString();
      await writeTiendas(tiendas);
      // Sincronizar con userProfile
      await syncUserProfileSuscripcion(googleUid, nuevaSuscripcion, existente);
      return jsonResponse(event, 200, { ok: true, tipo: 'activacion-existente' }, HTTP_OPTIONS);
    }

    const pending = await readJson(PENDING_KEY, PENDING_LOCAL, {});
    const pendingData = pending[ref];
    const tiendaInfo = pendingData?.tiendaInfo;

    if (!pendingData || !tiendaInfo) {
      return jsonResponse(event, 200, { skipped: 'missing_pending_registration' }, HTTP_OPTIONS);
    }

    const nueva = {
      id: Date.now(),
      nombre: tiendaInfo.nombre,
      rubros: tiendaInfo.rubros || [],
      descripcion: tiendaInfo.descripcion || '',
      direccion: tiendaInfo.direccion || '',
      ciudad: tiendaInfo.ciudad || '',
      horarios: tiendaInfo.horarios || {},
      telefono: tiendaInfo.telefono || '',
      website: tiendaInfo.website || '',
      foto: tiendaInfo.foto || null,
      galeria: tiendaInfo.galeria || [],
      googleUid: googleUid || pendingData.googleUid || '',
      ownerNombre: pendingData.ownerNombre || payment.payer?.name || '',
      ownerEmail: pendingData.ownerEmail || payment.payer?.email || '',
      emailContacto: tiendaInfo.emailContacto || pendingData.ownerEmail || '',
      token: null,
      activa: true,
      verificada: false,
      creadoEn: new Date().toISOString(),
      suscripcion: buildSuscripcion(plan, paymentId, monto, true, null),
    };

    tiendas.push(nueva);
    await writeTiendas(tiendas);

    // Sincronizar con userProfile
    await syncUserProfileSuscripcion(
      googleUid || pendingData.googleUid,
      nueva.suscripcion,
      nueva
    );

    delete pending[ref];
    await writeJson(PENDING_KEY, PENDING_LOCAL, pending);

    return jsonResponse(event, 200, { ok: true, tipo: 'nuevo-registro' }, HTTP_OPTIONS);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(event, error.statusCode, { error: error.message }, HTTP_OPTIONS);
    }

    console.error('[mp-webhook]', error);
    return jsonResponse(event, 200, { error: 'internal_error' }, HTTP_OPTIONS);
  }
};
