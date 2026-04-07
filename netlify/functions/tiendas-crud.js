import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const LOCAL_FILE = join('/tmp', 'lokal-tiendas.json');
const BUCKET = process.env.R2_BUCKET_NAME;
const DATA_KEY = 'data/tiendas.json';

function isR2Configured() {
  return !!(process.env.CF_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
}

function getClient() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function readTiendas() {
  if (isR2Configured()) {
    try {
      const res = await getClient().send(new GetObjectCommand({ Bucket: BUCKET, Key: DATA_KEY }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return [];
      throw err;
    }
  }
  if (!existsSync(LOCAL_FILE)) return [];
  return JSON.parse(readFileSync(LOCAL_FILE, 'utf8'));
}

async function writeTiendas(data) {
  if (isR2Configured()) {
    await getClient().send(new PutObjectCommand({
      Bucket: BUCKET, Key: DATA_KEY,
      Body: JSON.stringify(data, null, 2), ContentType: 'application/json',
    }));
  } else {
    writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
  }
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    // GET ?id=xxx — obtener tienda por id
    // GET ?googleUid=xxx — obtener tienda por dueno (para Root.jsx role check)
    // GET (sin params) — listar todas (publica)
    if (event.httpMethod === 'GET') {
      const tiendas = await readTiendas();
      const { id, googleUid } = event.queryStringParameters || {};

      if (id) {
        const t = tiendas.find(x => String(x.id) === String(id));
        if (!t) return { statusCode: 404, headers, body: JSON.stringify({ error: 'No encontrada' }) };
        return { statusCode: 200, headers, body: JSON.stringify(t) };
      }

      if (googleUid) {
        const t = tiendas.find(x => x.googleUid === googleUid);
        if (!t) return { statusCode: 404, headers, body: JSON.stringify({ error: 'No encontrada' }) };
        return { statusCode: 200, headers, body: JSON.stringify(t) };
      }

      // Lista publica: omitir datos sensibles
      const publica = tiendas.map(({ ownerEmail, googleUid: _uid, token, ...rest }) => rest);
      return { statusCode: 200, headers, body: JSON.stringify(publica) };
    }

    // POST — crear tienda (llamado desde InviteFlow al finalizar registro)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { token, sessionId, nombre, rubros, descripcion, direccion, ciudad,
        horarios, telefono, website, foto, emailContacto,
        googleUid, ownerNombre, ownerEmail } = body;

      if (!nombre?.trim() || !token || !sessionId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'nombre, token y sessionId son requeridos' }) };
      }

      // 1. Verificar el claim ANTES de crear la tienda
      // Llamamos al endpoint de invites para verificar que este sessionId es el dueno del claim
      const baseUrl = process.env.URL || 'http://localhost:8888';
      let inviteCheck;
      try {
        const checkRes = await fetch(
          `${baseUrl}/.netlify/functions/invites?token=${token}&sessionId=${sessionId}`
        );
        inviteCheck = await checkRes.json();
        // Si el token ya fue reclamado por esta misma sesion, el GET lo renueva y devuelve 200.
        // Si fue reclamado por otra sesion (no expirado) devuelve 409.
        // Si ya fue usado devuelve 410.
        if (!checkRes.ok) {
          return { statusCode: checkRes.status, headers, body: JSON.stringify({ error: inviteCheck.error || 'Token invalido' }) };
        }
      } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'No se pudo verificar el token' }) };
      }

      const tiendas = await readTiendas();

      // 2. Doble verificacion: token no debe existir ya en tiendas (por si acaso)
      if (tiendas.some(t => t.token === token)) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Este link ya fue utilizado para registrar una tienda' }) };
      }

      const nueva = {
        id: Date.now(),
        nombre: nombre.trim(),
        rubros: rubros || [],
        descripcion: descripcion?.trim() || '',
        direccion: direccion?.trim() || '',
        ciudad: ciudad?.trim() || '',
        horarios: horarios || {},
        telefono: telefono?.trim() || '',
        website: website?.trim() || '',
        foto: foto || null,
        googleUid: googleUid || '',
        ownerNombre: ownerNombre?.trim() || '',
        ownerEmail: ownerEmail?.trim() || '',
        emailContacto: emailContacto?.trim() || '',
        token,
        activa: true,
        verificada: false,
        creadoEn: new Date().toISOString(),
      };

      tiendas.push(nueva);
      await writeTiendas(tiendas);

      // 3. Marcar invite como usado ATOMICAMENTE con sessionId para verificacion final
      // Si esto falla, la tienda ya fue creada — aceptable, el token queda en 'reclamado'
      // y el check de duplicado en tiendas[] previene un segundo registro.
      try {
        await fetch(`${baseUrl}/.netlify/functions/invites`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, sessionId, tiendaId: nueva.id }),
        });
      } catch { /* tienda creada correctamente; el token expirara solo */ }

      return { statusCode: 201, headers, body: JSON.stringify(nueva) };
    }

    // PATCH — actualizar datos de tienda
    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const { id, ...changes } = body;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id requerido' }) };

      const tiendas = await readTiendas();
      const idx = tiendas.findIndex(t => String(t.id) === String(id));
      if (idx === -1) return { statusCode: 404, headers, body: JSON.stringify({ error: 'No encontrada' }) };

      const allowed = ['nombre', 'rubros', 'descripcion', 'direccion', 'ciudad',
        'horarios', 'telefono', 'website', 'foto', 'activa'];
      const update = {};
      for (const k of allowed) { if (k in changes) update[k] = changes[k]; }

      tiendas[idx] = { ...tiendas[idx], ...update, updatedAt: new Date().toISOString() };
      await writeTiendas(tiendas);

      return { statusCode: 200, headers, body: JSON.stringify(tiendas[idx]) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Metodo no permitido' }) };
  } catch (err) {
    console.error('[tiendas-crud]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
