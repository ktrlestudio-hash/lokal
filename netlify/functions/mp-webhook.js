import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// ─── Storage ──────────────────────────────────────────────────────────────────
const BUCKET        = process.env.R2_BUCKET_NAME;
const TIENDAS_KEY   = 'data/tiendas.json';
const PENDING_KEY   = 'data/mp-pending.json';
const TIENDAS_LOCAL  = join('/tmp', 'lokal-tiendas.json');
const PENDING_LOCAL  = join('/tmp', 'lokal-mp-pending.json');

function isR2() {
  return !!(process.env.CF_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
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
      Bucket: BUCKET, Key: key,
      Body: JSON.stringify(data, null, 2), ContentType: 'application/json',
    }));
  } else {
    writeFileSync(local, JSON.stringify(data, null, 2));
  }
}

// ─── Helpers de fecha ────────────────────────────────────────────────────────
function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

/**
 * Calcula el nuevo vencimiento.
 * - Primer registro mensual:  +2 meses (1 pagado + 1 de regalo)
 * - Primer registro anual:    +13 meses (12 pagados + 1 de regalo)
 * - Renovación mensual:       +1 mes desde el vencimiento actual (o ahora si ya venció)
 * - Renovación anual:         +12 meses desde el vencimiento actual (o ahora si ya venció)
 */
function calcNuevaVence(plan, esNuevo, venceActual) {
  const base = !esNuevo && venceActual && new Date(venceActual) > new Date()
    ? new Date(venceActual)
    : new Date();
  if (plan === 'anual') return addMonths(base, esNuevo ? 13 : 12);
  return addMonths(base, esNuevo ? 2 : 1);
}

function buildSuscripcion(plan, paymentId, monto, esNuevo, venceActual) {
  const now   = new Date();
  const vence = calcNuevaVence(plan, esNuevo, venceActual);
  return {
    estado: 'activa',
    plan,
    inicio:  now.toISOString(),
    vence:   vence.toISOString(),
    esPromo: esNuevo,
    mpPaymentId: String(paymentId),
    historial: [
      { fecha: now.toISOString(), plan, monto: monto || null, paymentId: String(paymentId) },
    ],
  };
}

function mergeSuscripcion(existing, plan, paymentId, monto, esNuevo) {
  const nueva = buildSuscripcion(plan, paymentId, monto, esNuevo, existing?.vence);
  return {
    ...nueva,
    historial: [
      ...(existing?.historial || []),
      { fecha: nueva.inicio, plan, monto: monto || null, paymentId: String(paymentId) },
    ],
  };
}

const headers = { 'Content-Type': 'application/json' };

// ─── Handler ──────────────────────────────────────────────────────────────────
// MercadoPago envía notificaciones de 2 formas:
//   IPN (legacy): GET  ?topic=payment&id=xxx
//   Webhooks v2:  POST body { type: "payment", data: { id: "xxx" } }
// Siempre respondemos 200 rápido para que MP no reintente indefinidamente.
export const handler = async (event) => {
  try {
    let paymentId;

    if (event.httpMethod === 'GET') {
      const { topic, id } = event.queryStringParameters || {};
      if (topic !== 'payment' || !id) return { statusCode: 200, headers, body: '' };
      paymentId = id;

    } else if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (body.type !== 'payment' || !body.data?.id)
        return { statusCode: 200, headers, body: '' };
      paymentId = body.data.id;

    } else {
      return { statusCode: 200, headers, body: '' };
    }

    if (!process.env.MP_ACCESS_TOKEN)
      return { statusCode: 200, headers, body: '' };

    // Obtener detalles del pago desde MP API
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    if (!mpRes.ok) return { statusCode: 200, headers, body: '' };
    const payment = await mpRes.json();

    // Solo procesar pagos aprobados
    if (payment.status !== 'approved')
      return { statusCode: 200, headers, body: JSON.stringify({ skipped: payment.status }) };

    const ref          = payment.external_reference || '';
    const meta         = payment.metadata || {};
    const plan         = meta.plan || 'mensual';
    const googleUid    = meta.google_uid;
    const isRenovacion = meta.is_renovacion || ref.startsWith('renewal_');
    const tiendaId     = meta.tienda_id;
    const monto        = payment.transaction_amount;

    const tiendas = await readJson(TIENDAS_KEY, TIENDAS_LOCAL, []);

    // ── Renovación ────────────────────────────────────────────────────────────
    if (isRenovacion && tiendaId) {
      const idx = tiendas.findIndex(t => String(t.id) === String(tiendaId));
      if (idx !== -1) {
        tiendas[idx].suscripcion = mergeSuscripcion(
          tiendas[idx].suscripcion, plan, paymentId, monto, false
        );
        tiendas[idx].activa    = true;
        tiendas[idx].updatedAt = new Date().toISOString();
        await writeJson(TIENDAS_KEY, TIENDAS_LOCAL, tiendas);
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, tipo: 'renovacion' }) };
    }

    // ── Nuevo registro ────────────────────────────────────────────────────────
    // Evitar duplicados: si ya existe tienda para este googleUid, solo actualizar suscripcion
    const existenteIdx = tiendas.findIndex(t => t.googleUid === googleUid);
    if (existenteIdx !== -1) {
      tiendas[existenteIdx].suscripcion = mergeSuscripcion(
        tiendas[existenteIdx].suscripcion, plan, paymentId, monto, false
      );
      tiendas[existenteIdx].activa    = true;
      tiendas[existenteIdx].updatedAt = new Date().toISOString();
      await writeJson(TIENDAS_KEY, TIENDAS_LOCAL, tiendas);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, tipo: 'activacion-existente' }) };
    }

    // Recuperar datos del formulario de registro que se guardaron en pending
    const pending     = await readJson(PENDING_KEY, PENDING_LOCAL, {});
    const pendingData = pending[ref] || {};
    const tiendaInfo  = pendingData.tiendaInfo || {};

    const nueva = {
      id:            Date.now(),
      nombre:        tiendaInfo.nombre?.trim()       || pendingData.ownerNombre || 'Mi Tienda',
      rubros:        tiendaInfo.rubros                || [],
      descripcion:   tiendaInfo.descripcion?.trim()   || '',
      direccion:     tiendaInfo.direccion?.trim()      || '',
      ciudad:        tiendaInfo.ciudad?.trim()         || '',
      horarios:      tiendaInfo.horarios               || {},
      telefono:      tiendaInfo.telefono?.trim()       || '',
      website:       tiendaInfo.website?.trim()        || '',
      foto:          tiendaInfo.foto                   || null,
      googleUid:     googleUid || pendingData.googleUid || '',
      ownerNombre:   pendingData.ownerNombre           || payment.payer?.name || '',
      ownerEmail:    pendingData.ownerEmail            || payment.payer?.email || '',
      emailContacto: tiendaInfo.emailContacto?.trim() || pendingData.ownerEmail || '',
      token:         null,
      activa:        true,
      verificada:    false,
      creadoEn:      new Date().toISOString(),
      suscripcion:   buildSuscripcion(plan, paymentId, monto, true, null),
    };

    tiendas.push(nueva);
    await writeJson(TIENDAS_KEY, TIENDAS_LOCAL, tiendas);

    // Limpiar pending para no acumular datos
    if (ref && pending[ref]) {
      delete pending[ref];
      await writeJson(PENDING_KEY, PENDING_LOCAL, pending);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, tipo: 'nuevo-registro' }) };

  } catch (err) {
    console.error('[mp-webhook]', err);
    // Siempre 200 — MP reintentaría si devolvemos error
    return { statusCode: 200, headers, body: JSON.stringify({ error: err.message }) };
  }
};
