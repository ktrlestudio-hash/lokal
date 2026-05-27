import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getBearerToken, requireAuth, verifyFirebaseIdToken } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import {
  requireText,
  sanitizeMediaUrls,
  sanitizeNumber,
  sanitizeText,
} from './_lib/validation.js';
import { ensureStoreOwner, findTiendaById, findTiendaBySlug, readTiendas } from './_lib/tiendas-store.js';

const LOCAL_FILE = join('/tmp', 'lokal-ofertas.json');
const DATA_KEY = 'data/ofertas.json';
const BUCKET = process.env.R2_BUCKET_NAME;

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, DELETE, OPTIONS',
};

function isR2Configured() {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function readOfertas() {
  if (isR2Configured()) {
    try {
      const res = await getR2Client().send(new GetObjectCommand({ Bucket: BUCKET, Key: DATA_KEY }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return [];
      throw err;
    }
  }

  if (!existsSync(LOCAL_FILE)) return [];
  return JSON.parse(readFileSync(LOCAL_FILE, 'utf8'));
}

async function writeOfertas(data) {
  if (isR2Configured()) {
    await getR2Client().send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: DATA_KEY,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }));
    return;
  }

  writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
}

async function getOptionalUser(event) {
  const token = getBearerToken(event);
  if (!token) return null;
  try {
    return await verifyFirebaseIdToken(token);
  } catch {
    return null;
  }
}

// Límites por rol
const ROLE_LIMITS = {
  usuario:        { usado: 3,  nuevo: 0  },
  emprendimiento: { usado: 10, nuevo: 5  },
  empresa:        { usado: 999, nuevo: 3 }, // 3 en free, backend no distingue plan aún
};

function getLimits(role) {
  return ROLE_LIMITS[role] || ROLE_LIMITS.usuario;
}

function sanitizeOfertaInput(body, tienda) {
  const precio = sanitizeNumber(body.precio, { field: 'precio', min: 0, max: 999999999, nullable: true });
  const precioOriginal = sanitizeNumber(body.precioOriginal, { field: 'precioOriginal', min: 0, max: 999999999, nullable: true });

  if (precio !== null && precioOriginal !== null && precioOriginal < precio) {
    throw new HttpError(400, 'precioOriginal debe ser mayor o igual al precio');
  }

  const ventaja = sanitizeText(body.ventaja, { max: 32, multiline: false }) || null;
  if (ventaja && !['precio', 'disponibilidad', 'financiacion', 'combo'].includes(ventaja)) {
    throw new HttpError(400, 'ventaja invalida');
  }

  return {
    tiendaId: tienda.id,
    tiendaNombre: tienda.nombre || '',
    tiendaFoto: tienda.foto || null,
    tiendaCiudad: tienda.ciudad || '',
    tiendaTelefono: tienda.telefono || '',
    titulo: requireText(body.titulo, { field: 'titulo', min: 2, max: 160, multiline: false }),
    descripcion: sanitizeText(body.descripcion, { max: 2000 }),
    fotos: sanitizeMediaUrls(body.fotos, { maxItems: 6 }),
    precio,
    precioOriginal,
    ventaja,
    financiacion: sanitizeText(body.financiacion, { max: 120, multiline: false }) || null,
    categoryId: sanitizeText(body.categoryId, { max: 80, multiline: false }) || null,
    stock: sanitizeNumber(body.stock, { field: 'stock', min: 0, max: 999999, integer: true, nullable: true }),
  };
}

function sanitizeUserProductInput(body) {
  const precio = sanitizeNumber(body.precio, { field: 'precio', min: 0, max: 999999999, nullable: true });
  const condicion = ['usado', 'nuevo'].includes(body.condicion) ? body.condicion : 'usado';
  return {
    titulo: requireText(body.titulo, { field: 'titulo', min: 2, max: 160, multiline: false }),
    descripcion: sanitizeText(body.descripcion, { max: 2000 }),
    fotos: sanitizeMediaUrls(body.fotos, { maxItems: 6 }),
    precio,
    categoryId: sanitizeText(body.categoryId, { max: 80, multiline: false }) || null,
    condicion,
    contactoWhatsapp: sanitizeText(body.contactoWhatsapp, { max: 20, multiline: false }) || null,
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    if (event.httpMethod === 'GET') {
      const ofertas = await readOfertas();
      const { tiendaId, slug, activa } = event.queryStringParameters || {};

      let result = ofertas;

      if (slug) {
        const tiendas = await readTiendas();
        const tienda = findTiendaBySlug(tiendas, slug);
        if (!tienda || !tienda.activa) {
          return jsonResponse(event, 404, { error: 'Tienda no encontrada' }, HTTP_OPTIONS);
        }
        result = ofertas.filter((item) => String(item.tiendaId) === String(tienda.id) && item.activa !== false);
        return jsonResponse(event, 200, result, HTTP_OPTIONS);
      }

      const { vendedorId } = event.queryStringParameters || {};

      if (tiendaId) {
        const user = await getOptionalUser(event);
        if (user) {
          const tiendas = await readTiendas();
          const tienda = findTiendaById(tiendas, tiendaId);
          const canSeePrivate = tienda && (user.isAdmin || tienda.googleUid === user.uid);
          result = ofertas.filter((item) => String(item.tiendaId) === String(tiendaId) && (canSeePrivate || item.activa !== false));
        } else {
          result = ofertas.filter((item) => String(item.tiendaId) === String(tiendaId) && item.activa !== false);
        }
      } else if (vendedorId) {
        // Productos de usuario/emprendimiento — solo el dueño ve los pausados
        const user = await getOptionalUser(event);
        const isOwner = user && user.uid === vendedorId;
        result = ofertas.filter((item) =>
          item.vendedorId === vendedorId && (isOwner || item.activa !== false)
        );
      } else {
        result = ofertas.filter((item) => item.activa !== false);
      }

      if (activa === 'true') {
        result = result.filter((item) => item.activa !== false);
      }

      return jsonResponse(event, 200, result, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'POST') {
      const user = await requireAuth(event);
      const body = parseJsonBody(event);
      const tiendaId = sanitizeText(String(body.tiendaId || ''), { max: 64, multiline: false });
      const isUserProduct = !tiendaId && !!body.vendedorId;

      if (isUserProduct) {
        // Publicación de usuario/emprendimiento/empresa
        if (body.vendedorId !== user.uid) {
          throw new HttpError(403, 'No autorizado');
        }
        const role = sanitizeText(body.vendedorRol || 'usuario', { max: 32, multiline: false });
        const condicion = body.condicion === 'nuevo' ? 'nuevo' : 'usado';
        const limits = getLimits(role);

        if (condicion === 'nuevo' && limits.nuevo === 0) {
          throw new HttpError(403, 'Tu rol no permite publicar productos nuevos');
        }

        const ofertas = await readOfertas();
        const activos = ofertas.filter(
          (o) => o.vendedorId === user.uid && o.condicion === condicion && o.activa !== false
        );
        const limit = condicion === 'nuevo' ? limits.nuevo : limits.usado;
        if (activos.length >= limit) {
          throw new HttpError(403, `Límite de ${limit} productos ${condicion}s alcanzado para tu rol`);
        }

        const nueva = {
          id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          ...sanitizeUserProductInput(body),
          vendedorId: user.uid,
          vendedorNombre: sanitizeText(body.vendedorNombre || '', { max: 100, multiline: false }),
          vendedorRol: role,
          activa: true,
          createdAt: new Date().toISOString(),
        };
        ofertas.unshift(nueva);
        await writeOfertas(ofertas);
        return jsonResponse(event, 201, nueva, HTTP_OPTIONS);
      }

      // Publicación de tienda (flujo original)
      if (!tiendaId) {
        throw new HttpError(400, 'tiendaId o vendedorId es requerido');
      }

      const tiendas = await readTiendas();
      const tienda = findTiendaById(tiendas, tiendaId);
      ensureStoreOwner(user, tienda);

      const ofertas = await readOfertas();
      const nueva = {
        id: `oferta_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...sanitizeOfertaInput(body, tienda),
        activa: true,
        createdAt: new Date().toISOString(),
      };

      ofertas.unshift(nueva);
      await writeOfertas(ofertas);
      return jsonResponse(event, 201, nueva, HTTP_OPTIONS);
    }

    if (event.httpMethod === 'PATCH') {
      const user = await requireAuth(event);
      const body = parseJsonBody(event);
      const id = sanitizeText(body.id, { max: 80, multiline: false });
      if (!id) {
        throw new HttpError(400, 'id requerido');
      }

      const ofertas = await readOfertas();
      const idx = ofertas.findIndex((item) => item.id === id);
      if (idx === -1) {
        return jsonResponse(event, 404, { error: 'No encontrada' }, HTTP_OPTIONS);
      }

      const isUserProduct = !!ofertas[idx].vendedorId;
      if (isUserProduct) {
        if (ofertas[idx].vendedorId !== user.uid && !user.isAdmin) {
          throw new HttpError(403, 'No autorizado');
        }
      } else {
        const tiendas = await readTiendas();
        const tienda = findTiendaById(tiendas, ofertas[idx].tiendaId);
        ensureStoreOwner(user, tienda);
      }

      const update = {};
      if (isUserProduct) {
        const editFields = ['titulo', 'descripcion', 'fotos', 'precio', 'categoryId', 'condicion', 'contactoWhatsapp'];
        if (editFields.some((f) => f in body)) {
          Object.assign(update, sanitizeUserProductInput({ ...ofertas[idx], ...body }));
        }
      } else {
        const tiendas = await readTiendas();
        const tienda = findTiendaById(tiendas, ofertas[idx].tiendaId);
        if ('titulo' in body || 'descripcion' in body || 'fotos' in body || 'precio' in body || 'precioOriginal' in body || 'ventaja' in body || 'financiacion' in body || 'categoryId' in body || 'stock' in body) {
          Object.assign(update, sanitizeOfertaInput({ ...ofertas[idx], ...body }, tienda));
        }
      }
      if ('activa' in body) {
        update.activa = !!body.activa;
      }

      ofertas[idx] = {
        ...ofertas[idx],
        ...update,
        updatedAt: new Date().toISOString(),
      };

      await writeOfertas(ofertas);
      return jsonResponse(event, 200, ofertas[idx], HTTP_OPTIONS);
    }

    if (event.httpMethod === 'DELETE') {
      const user = await requireAuth(event);
      const { id } = event.queryStringParameters || {};
      if (!id) {
        throw new HttpError(400, 'id requerido');
      }

      const ofertas = await readOfertas();
      const idx = ofertas.findIndex((item) => item.id === id);
      if (idx === -1) {
        return jsonResponse(event, 404, { error: 'No encontrada' }, HTTP_OPTIONS);
      }

      if (ofertas[idx].vendedorId) {
        if (ofertas[idx].vendedorId !== user.uid && !user.isAdmin) {
          throw new HttpError(403, 'No autorizado');
        }
      } else {
        const tiendas = await readTiendas();
        const tienda = findTiendaById(tiendas, ofertas[idx].tiendaId);
        ensureStoreOwner(user, tienda);
      }

      ofertas.splice(idx, 1);
      await writeOfertas(ofertas);
      return jsonResponse(event, 200, { ok: true }, HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
