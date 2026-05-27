import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText } from './_lib/validation.js';

const LOCAL_FILE = join('/tmp', 'lokal-messages.json');
const BUCKET = process.env.R2_BUCKET_NAME;
const R2_KEY = 'data/messages.json';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, OPTIONS',
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

// Conversation key: always sorted so both sides use the same key
function convKey(userA, userB) {
  return [userA, userB].sort().join('__');
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);

    // GET /messages?tiendaId=xxx  — fetch conversation with a store (user side)
    // GET /messages?storeInbox=1  — fetch all conversations for a store (store side)
    if (event.httpMethod === 'GET') {
      const { tiendaId, storeInbox, storeId } = event.queryStringParameters || {};

      // Store inbox: returns summary of all conversations involving this store
      if (storeInbox === '1') {
        const sid = String(storeId || '');
        if (!sid) throw new HttpError(400, 'storeId requerido');
        const all = await readAll();
        const convos = [];
        for (const [key, msgs] of Object.entries(all)) {
          if (!key.includes(sid)) continue;
          const parts = key.split('__');
          const partnerUid = parts[0] === sid ? parts[1] : parts[0];
          const last = msgs[msgs.length - 1] || null;
          // context is stored in the first message's attachment (type: 'context')
          const firstCtx = msgs[0]?.attachment?.type === 'context' ? msgs[0].attachment : null;
          convos.push({
            key,
            partnerUid,
            context: firstCtx,
            messages: msgs.slice(-50),
            lastMessage: last,
            count: msgs.length,
          });
        }
        convos.sort((a, b) => (b.lastMessage?.ts || '').localeCompare(a.lastMessage?.ts || ''));
        return jsonResponse(event, 200, { conversations: convos });
      }

      if (!tiendaId) throw new HttpError(400, 'tiendaId requerido');
      const all = await readAll();
      const key = convKey(user.uid, tiendaId);
      const msgs = (all[key] || []).slice(-200);
      const context = msgs[0]?.attachment?.type === 'context' ? msgs[0].attachment : null;
      return jsonResponse(event, 200, { messages: msgs, context });
    }

    // POST /messages  — send a message
    // body.storeId present = store is replying to a user (from = storeId, partnerUid = body.partnerUid)
    if (event.httpMethod === 'POST') {
      const body = await parseJsonBody(event);
      const text = sanitizeText(body.text, 2000);
      const attachmentRaw = body.attachment && typeof body.attachment === 'object' ? body.attachment : null;

      let key, fromId;
      if (body.storeId) {
        // Store replying — key uses storeId + partnerUid
        const storeId = sanitizeText(body.storeId, 100);
        const partnerUid = sanitizeText(body.partnerUid, 200);
        if (!storeId || !partnerUid) throw new HttpError(400, 'storeId y partnerUid requeridos');
        key = convKey(storeId, partnerUid);
        fromId = storeId;
      } else {
        // User sending — key uses uid + tiendaId
        const tiendaId = sanitizeText(body.tiendaId, 100);
        if (!tiendaId) throw new HttpError(400, 'tiendaId requerido');
        key = convKey(user.uid, tiendaId);
        fromId = user.uid;
      }

      if (!text && !attachmentRaw) throw new HttpError(400, 'text o attachment requerido');

      const all = await readAll();
      if (!all[key]) all[key] = [];

      const msg = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        from: fromId,
        text: text || '',
        ...(attachmentRaw ? { attachment: attachmentRaw } : {}),
        ts: new Date().toISOString(),
      };

      all[key].push(msg);
      if (all[key].length > 500) all[key] = all[key].slice(-500);

      await writeAll(all);
      return jsonResponse(event, 201, { message: msg });
    }

    throw new HttpError(405, 'Método no permitido');
  } catch (err) {
    return handleError(event, err);
  }
};
