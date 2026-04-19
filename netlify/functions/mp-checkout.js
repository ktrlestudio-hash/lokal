import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// ─── Precios — ajustá según tu modelo de negocio ─────────────────────────────
export const PRECIO_MENSUAL = 4990;  // ARS
export const PRECIO_ANUAL   = 47900; // ARS  (~20% de ahorro vs 12 meses)

// ─── Storage helpers ──────────────────────────────────────────────────────────
const BUCKET       = process.env.R2_BUCKET_NAME;
const PENDING_KEY  = 'data/mp-pending.json';
const PENDING_LOCAL = join('/tmp', 'lokal-mp-pending.json');

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
      Bucket: BUCKET, Key: PENDING_KEY,
      Body: JSON.stringify(data, null, 2), ContentType: 'application/json',
    }));
  } else {
    writeFileSync(PENDING_LOCAL, JSON.stringify(data, null, 2));
  }
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// ─── Handler ──────────────────────────────────────────────────────────────────
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };

  if (!process.env.MP_ACCESS_TOKEN) {
    return {
      statusCode: 503, headers,
      body: JSON.stringify({ error: 'Pagos no configurados aún. Contactá al administrador.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      plan,       // 'mensual' | 'anual'
      tiendaInfo, // objeto con datos de la tienda (solo en registro nuevo)
      googleUid,
      ownerNombre,
      ownerEmail,
      tiendaId,   // si está presente → es una renovación
    } = body;

    if (!plan || !googleUid || !ownerEmail) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'plan, googleUid y ownerEmail son requeridos' }) };
    }

    const isRenovacion = !!tiendaId;
    const precio = plan === 'anual' ? PRECIO_ANUAL : PRECIO_MENSUAL;
    const titulo = plan === 'anual'
      ? 'Lokal Tienda — Plan Anual (13 meses de acceso)'
      : 'Lokal Tienda — Plan Mensual (2 meses al activar)';

    const appUrl = (process.env.URL || 'http://localhost:8888').replace(/\/$/, '');

    // Referencia única — también usada como clave en pending-registrations
    const ref = `${isRenovacion ? 'renewal' : 'new'}_${googleUid}_${Date.now()}`;

    // Guardar datos pendientes en R2 para que el webhook pueda crear la tienda
    if (!isRenovacion && tiendaInfo) {
      const pending = await readPending();
      pending[ref] = {
        tiendaInfo,
        googleUid,
        ownerNombre: ownerNombre || '',
        ownerEmail,
        plan,
        creadoEn: new Date().toISOString(),
      };
      // Limpiar entradas de más de 48h para no acumular basura
      const cutoff = Date.now() - 48 * 3600 * 1000;
      for (const k of Object.keys(pending)) {
        if (new Date(pending[k].creadoEn).getTime() < cutoff) delete pending[k];
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
        name: ownerNombre || '',
        email: ownerEmail,
      },
      back_urls: {
        success:  `${appUrl}/?mp_status=approved&ref=${ref}`,
        failure:  `${appUrl}/?mp_status=failure&ref=${ref}`,
        pending:  `${appUrl}/?mp_status=pending&ref=${ref}`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/.netlify/functions/mp-webhook`,
      external_reference: ref,
      // metadata: MP convierte las keys a snake_case en el objeto de pago
      metadata: {
        plan,
        google_uid:    googleUid,
        tienda_id:     tiendaId || null,
        is_renovacion: isRenovacion,
      },
      statement_descriptor: 'LOKAL TIENDA',
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization:      `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type':     'application/json',
        'X-Idempotency-Key': ref,
      },
      body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
      const mpErr = await mpRes.json();
      console.error('[mp-checkout] MP error:', mpErr);
      return {
        statusCode: 502, headers,
        body: JSON.stringify({ error: 'Error al crear preferencia de pago', detail: mpErr }),
      };
    }

    const pref = await mpRes.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        initPoint:        pref.init_point,         // producción
        sandboxInitPoint: pref.sandbox_init_point,  // sandbox / testing
        preferenceId:     pref.id,
        ref,
      }),
    };

  } catch (err) {
    console.error('[mp-checkout]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
