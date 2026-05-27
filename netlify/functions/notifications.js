import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText } from './_lib/validation.js';

const LOCAL_FILE = join('/tmp', 'lokal-notifications.json');
const BUCKET = process.env.R2_BUCKET_NAME;
const R2_KEY = 'data/notifications.json';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, OPTIONS',
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

async function readAll() {
  if (isR2()) {
    try {
      const res = await r2().send(new GetObjectCommand({ Bucket: BUCKET, Key: R2_KEY }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return {};
      throw err;
    }
  }
  if (!existsSync(LOCAL_FILE)) return {};
  return JSON.parse(readFileSync(LOCAL_FILE, 'utf8'));
}

async function writeAll(data) {
  if (isR2()) {
    await r2().send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: R2_KEY,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    }));
    return;
  }
  writeFileSync(LOCAL_FILE, JSON.stringify(data));
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);

    // GET /notifications — fetch my notifications (last 50)
    if (event.httpMethod === 'GET') {
      const all = await readAll();
      const mine = (all[user.uid] || []).slice(-50).reverse();
      return jsonResponse(event, 200, { notifications: mine });
    }

    // POST /notifications — internal: create a notification for a user
    // Body: { targetUid, type, title, body, link? }
    if (event.httpMethod === 'POST') {
      const body = await parseJsonBody(event);
      const targetUid = sanitizeText(body.targetUid, 128);
      const type = sanitizeText(body.type, 64);
      const title = sanitizeText(body.title, 200);
      const text = sanitizeText(body.body, 500);
      const link = sanitizeText(body.link, 300);

      if (!targetUid || !title) throw new HttpError(400, 'targetUid y title requeridos');

      const all = await readAll();
      if (!all[targetUid]) all[targetUid] = [];

      const notif = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: type || 'info',
        title,
        body: text || '',
        link: link || null,
        read: false,
        ts: new Date().toISOString(),
      };

      all[targetUid].push(notif);
      // Keep last 200 per user
      if (all[targetUid].length > 200) all[targetUid] = all[targetUid].slice(-200);

      await writeAll(all);
      return jsonResponse(event, 201, { notification: notif });
    }

    // PATCH /notifications — mark as read
    // Body: { ids: ['id1','id2'] } or { all: true }
    if (event.httpMethod === 'PATCH') {
      const body = await parseJsonBody(event);
      const all = await readAll();
      const mine = all[user.uid] || [];

      if (body.all) {
        all[user.uid] = mine.map(n => ({ ...n, read: true }));
      } else if (Array.isArray(body.ids)) {
        const set = new Set(body.ids);
        all[user.uid] = mine.map(n => set.has(n.id) ? { ...n, read: true } : n);
      }

      await writeAll(all);
      return jsonResponse(event, 200, { ok: true });
    }

    throw new HttpError(405, 'Método no permitido');
  } catch (err) {
    return handleError(event, err);
  }
};
