// mp-webhook.js — Cloudflare Pages Functions version de netlify/functions/mp-webhook.js.
//
// createHmac('sha256')/timingSafeEqual de Node reemplazados por Web Crypto
// (crypto.subtle.sign('HMAC', ...) + comparación manual de tiempo constante
// — Web Crypto no expone un timingSafeEqual directo, pero el patrón XOR
// acumulado sin early-exit logra la misma propiedad: el tiempo de
// comparación no depende de EN QUÉ byte difieren los dos buffers).
import { getHeader, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { findTiendaByOwnerUid, writeTiendas, readTiendas } from './_lib/tiendas-store.js';
import { safeRead, safeWrite } from './_lib/r2-safe-write.js';

const PENDING_KEY = 'data/mp-pending.json';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type',
  allowMethods: 'POST, OPTIONS',
};

async function readPending(bucket) {
  const { data } = await safeRead(bucket, PENDING_KEY, {});
  return data;
}

async function writePending(bucket, data) {
  const { etag } = await safeRead(bucket, PENDING_KEY, {});
  await safeWrite(bucket, PENDING_KEY, data, etag);
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

function hexToBytes(hex) {
  const clean = String(hex || '');
  if (clean.length % 2 !== 0) return null;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(clean.substr(i * 2, 2), 16);
    if (Number.isNaN(byte)) return null;
    bytes[i] = byte;
  }
  return bytes;
}

// Comparación de tiempo constante: recorre TODOS los bytes sin cortar apenas
// encuentra una diferencia (a diferencia de `a === b`, cuyo tiempo de
// ejecución varía según en qué byte difieren — eso es justo el canal lateral
// que timingSafeEqual de Node existe para cerrar).
function timingSafeEqualBytes(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function safeEqualHex(a, b) {
  const left = hexToBytes(a);
  const right = hexToBytes(b);
  if (!left || !right || !left.length || !right.length) return false;
  return timingSafeEqualBytes(left, right);
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

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function validateMercadoPagoSignature(event, body, env) {
  const secret = env.MP_WEBHOOK_SECRET;
  if (!secret) return;

  const { searchParams } = new URL(event.url);
  const xSignature = getHeader(event, 'x-signature');
  const xRequestId = getHeader(event, 'x-request-id');
  const parsed = parseSignatureHeader(xSignature);
  const ts = parsed.ts;
  const v1 = parsed.v1;
  const dataId = searchParams.get('data.id') || body?.data?.id || '';

  if (!ts || !v1 || !xRequestId || !dataId) {
    throw new HttpError(401, 'Webhook de Mercado Pago sin firma valida');
  }

  const manifest = [
    dataId ? `id:${String(dataId).toLowerCase()};` : '',
    xRequestId ? `request-id:${xRequestId};` : '',
    ts ? `ts:${ts};` : '',
  ].join('');

  const expected = await hmacSha256Hex(secret, manifest);

  if (!safeEqualHex(expected, v1)) {
    throw new HttpError(401, 'Firma de webhook invalida');
  }
}

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const body = await parseJsonBody(event);

    if (env.MP_WEBHOOK_SECRET) {
      await validateMercadoPagoSignature(event, body, env);
    }

    if (body.type !== 'payment' || !body.data?.id) {
      return jsonResponse(event, 200, { skipped: 'unsupported_event' }, { ...HTTP_OPTIONS, env });
    }

    if (!env.MP_ACCESS_TOKEN) {
      return jsonResponse(event, 200, { skipped: 'mp_not_configured' }, { ...HTTP_OPTIONS, env });
    }

    const paymentId = body.data.id;
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
    });

    if (!mpRes.ok) {
      return jsonResponse(event, 200, { skipped: 'payment_lookup_failed' }, { ...HTTP_OPTIONS, env });
    }

    const payment = await mpRes.json();
    if (payment.status !== 'approved') {
      return jsonResponse(event, 200, { skipped: payment.status }, { ...HTTP_OPTIONS, env });
    }

    const ref = payment.external_reference || '';
    const meta = payment.metadata || {};
    const plan = meta.plan === 'anual' ? 'anual' : 'mensual';
    const googleUid = meta.google_uid;
    const isRenovacion = meta.is_renovacion || ref.startsWith('renewal_');
    const tiendaId = meta.tienda_id;
    const monto = payment.transaction_amount;
    const tiendas = await readTiendas(bucket);

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
        await writeTiendas(bucket, tiendas);
      }
      return jsonResponse(event, 200, { ok: true, tipo: 'renovacion' }, { ...HTTP_OPTIONS, env });
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
      await writeTiendas(bucket, tiendas);
      return jsonResponse(event, 200, { ok: true, tipo: 'activacion-existente' }, { ...HTTP_OPTIONS, env });
    }

    const pending = await readPending(bucket);
    const pendingData = pending[ref];
    const tiendaInfo = pendingData?.tiendaInfo;

    if (!pendingData || !tiendaInfo) {
      return jsonResponse(event, 200, { skipped: 'missing_pending_registration' }, { ...HTTP_OPTIONS, env });
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
    await writeTiendas(bucket, tiendas);

    delete pending[ref];
    await writePending(bucket, pending);

    return jsonResponse(event, 200, { ok: true, tipo: 'nuevo-registro' }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(event, error.statusCode, { error: error.message }, { ...HTTP_OPTIONS, env });
    }

    console.error('[mp-webhook]', error);
    return jsonResponse(event, 200, { error: 'internal_error' }, { ...HTTP_OPTIONS, env });
  }
}
