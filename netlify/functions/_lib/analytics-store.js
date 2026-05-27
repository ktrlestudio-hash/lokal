/**
 * Sistema de analytics de eventos para LOKAL
 * Trackea: clicks, vistas, tiempo, flujo de usuarios, conversaciones, ratings, etc.
 * 
 * Estructura en R2:
 *   analytics/
 *     YYYY-MM/
 *       events-YYYY-MM-DD.json     → eventos del día (append-only)
 *       sessions-YYYY-MM-DD.json   → sesiones del día
 *       metrics-YYYY-MM-DD.json    → métricas agregadas del día
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BUCKET = process.env.R2_BUCKET_NAME;
const ANALYTICS_PREFIX = 'analytics';
const LOCAL_DIR = join('/tmp', 'lokal-analytics');

function isR2Configured() {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
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

function getTodayKeys() {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const date = `${yearMonth}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    yearMonth,
    date,
    eventsKey: `${ANALYTICS_PREFIX}/${yearMonth}/events-${date}.json`,
    sessionsKey: `${ANALYTICS_PREFIX}/${yearMonth}/sessions-${date}.json`,
    metricsKey: `${ANALYTICS_PREFIX}/${yearMonth}/metrics-${date}.json`,
  };
}

async function readJson(key, defaultValue = []) {
  if (isR2Configured()) {
    try {
      const res = await getClient().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return defaultValue;
      throw err;
    }
  }
  const localPath = join(LOCAL_DIR, key.replace(/\//g, '-'));
  if (!existsSync(localPath)) return defaultValue;
  return JSON.parse(readFileSync(localPath, 'utf8'));
}

async function writeJson(key, data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      if (isR2Configured()) {
        await getClient().send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: JSON.stringify(data, null, 2),
          ContentType: 'application/json',
        }));
        return;
      }
      if (!existsSync(LOCAL_DIR)) mkdirSync(LOCAL_DIR, { recursive: true });
      const localPath = join(LOCAL_DIR, key.replace(/\//g, '-'));
      writeFileSync(localPath, JSON.stringify(data, null, 2));
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 100 * (i + 1))); // backoff
    }
  }
}

// ─── EVENTOS ──────────────────────────────────────────────────────────────

/**
 * Registra un evento de analytics
 * @param {Object} event
 * @param {string} event.tipo - tipo de evento: pageview, click, scroll, time, chat, rating, conversion, etc.
 * @param {string} event.categoria - categoría: tienda, producto, demanda, busqueda, perfil, etc.
 * @param {string} event.entidadId - ID de la entidad afectada
 * @param {string} event.usuarioUid - UID del usuario (si está logueado)
 * @param {string} event.sessionId - ID de sesión
 * @param {Object} event.datos - datos adicionales del evento
 * @param {number} event.valor - valor numérico (tiempo, monto, rating, etc.)
 */
export async function trackEvent(event) {
  const { eventsKey } = getTodayKeys();
  const timestamp = new Date().toISOString();

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    ...event,
  };

  const events = await readJson(eventsKey, []);
  events.push(entry);
  await writeJson(eventsKey, events);

  // Actualizar métricas en tiempo real
  await updateMetrics(entry);

  return entry;
}

// ─── SESIONES ─────────────────────────────────────────────────────────────

/**
 * Registra o actualiza una sesión de usuario
 */
export async function trackSession(sessionId, datos) {
  const { sessionsKey } = getTodayKeys();
  const sessions = await readJson(sessionsKey, {});

  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      id: sessionId,
      inicio: new Date().toISOString(),
      eventos: 0,
      paginas: [],
      tiendaIds: [],
      productoIds: [],
      demandaIds: [],
      busquedas: [],
      tiempoTotal: 0,
      ultimoEvento: new Date().toISOString(),
      dispositivo: datos.dispositivo || 'unknown',
      ciudad: datos.ciudad || null,
      ...datos,
    };
  }

  sessions[sessionId].eventos += 1;
  sessions[sessionId].ultimoEvento = new Date().toISOString();

  if (datos.pagina && !sessions[sessionId].paginas.includes(datos.pagina)) {
    sessions[sessionId].paginas.push(datos.pagina);
  }
  if (datos.tiendaId && !sessions[sessionId].tiendaIds.includes(datos.tiendaId)) {
    sessions[sessionId].tiendaIds.push(datos.tiendaId);
  }
  if (datos.productoId && !sessions[sessionId].productoIds.includes(datos.productoId)) {
    sessions[sessionId].productoIds.push(datos.productoId);
  }
  if (datos.demandaId && !sessions[sessionId].demandaIds.includes(datos.demandaId)) {
    sessions[sessionId].demandaIds.push(datos.demandaId);
  }
  if (datos.busqueda && !sessions[sessionId].busquedas.includes(datos.busqueda)) {
    sessions[sessionId].busquedas.push(datos.busqueda);
  }
  if (datos.tiempo) {
    sessions[sessionId].tiempoTotal += datos.tiempo;
  }

  await writeJson(sessionsKey, sessions);
  return sessions[sessionId];
}

// ─── MÉTRICAS AGREGADAS ──────────────────────────────────────────────────

async function updateMetrics(event) {
  const { metricsKey } = getTodayKeys();
  const metrics = await readJson(metricsKey, {
    fecha: new Date().toISOString().split('T')[0],
    eventosTotales: 0,
    usuariosUnicos: new Set(),
    sesionesUnicas: new Set(),
    pageviews: 0,
    clicks: 0,
    busquedas: 0,
    chatsIniciados: 0,
    mensajesEnviados: 0,
    ratings: { suma: 0, count: 0 },
    tiempoTotal: 0,
    conversiones: 0,
    porPagina: {},
    porCategoria: {},
    porTienda: {},
    porProducto: {},
    flujo: {}, // de -> to
  });

  metrics.eventosTotales += 1;
  if (event.usuarioUid) metrics.usuariosUnicos.add(event.usuarioUid);
  if (event.sessionId) metrics.sesionesUnicas.add(event.sessionId);

  switch (event.tipo) {
    case 'pageview':
      metrics.pageviews += 1;
      break;
    case 'click':
      metrics.clicks += 1;
      break;
    case 'busqueda':
      metrics.busquedas += 1;
      break;
    case 'chat_iniciado':
      metrics.chatsIniciados += 1;
      break;
    case 'mensaje_enviado':
      metrics.mensajesEnviados += 1;
      break;
    case 'rating':
      metrics.ratings.suma += event.valor || 0;
      metrics.ratings.count += 1;
      break;
    case 'tiempo':
      metrics.tiempoTotal += event.valor || 0;
      break;
    case 'conversion':
      metrics.conversiones += 1;
      break;
  }

  // Por página
  if (event.pagina) {
    metrics.porPagina[event.pagina] = (metrics.porPagina[event.pagina] || 0) + 1;
  }

  // Por categoría
  if (event.categoria) {
    metrics.porCategoria[event.categoria] = (metrics.porCategoria[event.categoria] || 0) + 1;
  }

  // Por tienda
  if (event.tiendaId) {
    if (!metrics.porTienda[event.tiendaId]) {
      metrics.porTienda[event.tiendaId] = { vistas: 0, clicks: 0, chats: 0, tiempo: 0 };
    }
    metrics.porTienda[event.tiendaId].vistas += event.tipo === 'pageview' ? 1 : 0;
    metrics.porTienda[event.tiendaId].clicks += event.tipo === 'click' ? 1 : 0;
    metrics.porTienda[event.tiendaId].chats += event.tipo === 'chat_iniciado' ? 1 : 0;
    metrics.porTienda[event.tiendaId].tiempo += event.tipo === 'tiempo' ? (event.valor || 0) : 0;
  }

  // Por producto
  if (event.productoId) {
    if (!metrics.porProducto[event.productoId]) {
      metrics.porProducto[event.productoId] = { vistas: 0, clicks: 0, tiempo: 0 };
    }
    metrics.porProducto[event.productoId].vistas += event.tipo === 'pageview' ? 1 : 0;
    metrics.porProducto[event.productoId].clicks += event.tipo === 'click' ? 1 : 0;
    metrics.porProducto[event.productoId].tiempo += event.tipo === 'tiempo' ? (event.valor || 0) : 0;
  }

  // Flujo de navegación
  if (event.desde && event.hacia) {
    const flujoKey = `${event.desde}→${event.hacia}`;
    metrics.flujo[flujoKey] = (metrics.flujo[flujoKey] || 0) + 1;
  }

  await writeJson(metricsKey, metrics);
}

// ─── CONSULTAS PARA ADMIN ─────────────────────────────────────────────────

export async function getAnalyticsResumen(dias = 7) {
  const ahora = new Date();
  const resultados = [];

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const metricsKey = `${ANALYTICS_PREFIX}/${yearMonth}/metrics-${date}.json`;

    try {
      const metrics = await readJson(metricsKey, null);
      if (metrics) {
        resultados.push({
          fecha: date,
          eventosTotales: metrics.eventosTotales,
          usuariosUnicos: metrics.usuariosUnicos?.size || metrics.usuariosUnicos?.length || 0,
          sesionesUnicas: metrics.sesionesUnicas?.size || metrics.sesionesUnicas?.length || 0,
          pageviews: metrics.pageviews,
          clicks: metrics.clicks,
          busquedas: metrics.busquedas,
          chatsIniciados: metrics.chatsIniciados,
          mensajesEnviados: metrics.mensajesEnviados,
          ratingPromedio: metrics.ratings?.count > 0 ? (metrics.ratings.suma / metrics.ratings.count).toFixed(2) : null,
          tiempoPromedio: metrics.sesionesUnicas?.size > 0 ? Math.round(metrics.tiempoTotal / (metrics.sesionesUnicas.size || 1)) : 0,
          conversiones: metrics.conversiones,
        });
      }
    } catch {
      // Día sin datos
    }
  }

  return resultados.reverse();
}

export async function getAnalyticsTienda(tiendaId, dias = 30) {
  const ahora = new Date();
  const resultados = [];

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const metricsKey = `${ANALYTICS_PREFIX}/${yearMonth}/metrics-${date}.json`;

    try {
      const metrics = await readJson(metricsKey, null);
      if (metrics && metrics.porTienda && metrics.porTienda[tiendaId]) {
        resultados.push({ fecha: date, ...metrics.porTienda[tiendaId] });
      }
    } catch {
      // Día sin datos
    }
  }

  return resultados.reverse();
}

export async function getAnalyticsProducto(productoId, dias = 30) {
  const ahora = new Date();
  const resultados = [];

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const metricsKey = `${ANALYTICS_PREFIX}/${yearMonth}/metrics-${date}.json`;

    try {
      const metrics = await readJson(metricsKey, null);
      if (metrics && metrics.porProducto && metrics.porProducto[productoId]) {
        resultados.push({ fecha: date, ...metrics.porProducto[productoId] });
      }
    } catch {
      // Día sin datos
    }
  }

  return resultados.reverse();
}

export async function getTopBusquedas(dias = 7, limit = 20) {
  const ahora = new Date();
  const busquedas = {};

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const eventsKey = `${ANALYTICS_PREFIX}/${yearMonth}/events-${date}.json`;

    try {
      const events = await readJson(eventsKey, []);
      events.filter(e => e.tipo === 'busqueda').forEach(e => {
        const term = e.datos?.query || e.datos?.termino || 'unknown';
        busquedas[term] = (busquedas[term] || 0) + 1;
      });
    } catch {
      // Día sin datos
    }
  }

  return Object.entries(busquedas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([termino, count]) => ({ termino, count }));
}

export async function getFlujoNavegacion(dias = 7) {
  const ahora = new Date();
  const flujo = {};

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const metricsKey = `${ANALYTICS_PREFIX}/${yearMonth}/metrics-${date}.json`;

    try {
      const metrics = await readJson(metricsKey, null);
      if (metrics && metrics.flujo) {
        Object.entries(metrics.flujo).forEach(([key, count]) => {
          flujo[key] = (flujo[key] || 0) + count;
        });
      }
    } catch {
      // Día sin datos
    }
  }

  return Object.entries(flujo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([transicion, count]) => {
      const [desde, hacia] = transicion.split('→');
      return { desde, hacia, count };
    });
}
