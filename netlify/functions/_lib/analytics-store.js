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
import { safeRead, safeWrite } from './r2-safe-write.js';
import { HttpError } from './http.js';

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

// Read-modify-write protegido por etag (mismo mecanismo que tiendas-store.js)
// con reintentos internos — a diferencia de una edición de usuario, un
// evento de tracking no debe fallar visible: si hay colisión (409, dos
// eventos casi simultáneos) reintentamos el ciclo completo un puñado de
// veces en vez de propagar el error. Sin esto, updateMetrics hacía
// read→sumar→write sin ninguna protección: bajo tráfico concurrente real,
// el segundo write pisaba al primero y se perdían eventos en silencio.
async function safeReadModifyWrite(key, defaultValue, mutate, retries = 5) {
  if (!isR2Configured()) {
    // Local (sin R2): sin concurrencia real entre requests, no hace falta
    // etag — mismo comportamiento que antes, sin el overhead de HeadObject.
    const data = await readJson(key, defaultValue);
    const result = mutate(data);
    await writeJson(key, result ?? data);
    return result ?? data;
  }
  const client = getClient();
  for (let i = 0; i < retries; i++) {
    const { data, etag } = await safeRead(client, BUCKET, key, defaultValue);
    const result = mutate(data);
    try {
      await safeWrite(client, BUCKET, key, result ?? data, etag);
      return result ?? data;
    } catch (err) {
      if (err instanceof HttpError && err.statusCode === 409 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 30 * (i + 1) + Math.random() * 30));
        continue;
      }
      throw err;
    }
  }
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
 * @param {string} event.categoria - categoría: tienda, producto, busqueda, perfil, etc.
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

  // append protegido por etag+retry — el array del día es compartido por
  // TODOS los eventos de TODAS las tiendas; sin protección, dos eventos
  // casi simultáneos (muy probable con tráfico real) pisaban uno al otro.
  await safeReadModifyWrite(eventsKey, [], (events) => { events.push(entry); });

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
  let result;
  await safeReadModifyWrite(sessionsKey, {}, (sessions) => {
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        id: sessionId,
        inicio: new Date().toISOString(),
        eventos: 0,
        paginas: [],
        tiendaIds: [],
        productoIds: [],
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
    if (datos.busqueda && !sessions[sessionId].busquedas.includes(datos.busqueda)) {
      sessions[sessionId].busquedas.push(datos.busqueda);
    }
    if (datos.tiempo) {
      sessions[sessionId].tiempoTotal += datos.tiempo;
    }
    result = sessions[sessionId];
  });
  return result;
}

// ─── MÉTRICAS AGREGADAS ──────────────────────────────────────────────────

function defaultMetrics() {
  return {
    fecha: new Date().toISOString().split('T')[0],
    eventosTotales: 0,
    // Objetos plain (uid/sessionId -> true), NO Set: un Set se serializa
    // como "{}" en JSON.stringify — tras el primer ciclo de escritura el
    // conteo de únicos quedaba roto (siempre 0 al releer). El tamaño real
    // se lee con Object.keys(...).length en las consultas de abajo.
    usuariosUnicos: {},
    sesionesUnicas: {},
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
    porMedioCompartido: {}, // whatsapp/instagram/facebook/copiar-link -> count
    flujo: {}, // de -> to
  };
}

async function updateMetrics(event) {
  const { metricsKey } = getTodayKeys();
  await safeReadModifyWrite(metricsKey, defaultMetrics(), (metrics) => {
    metrics.eventosTotales += 1;
    if (event.usuarioUid) metrics.usuariosUnicos[event.usuarioUid] = true;
    if (event.sessionId) metrics.sesionesUnicas[event.sessionId] = true;

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

    if (event.pagina) {
      metrics.porPagina[event.pagina] = (metrics.porPagina[event.pagina] || 0) + 1;
    }
    if (event.categoria) {
      metrics.porCategoria[event.categoria] = (metrics.porCategoria[event.categoria] || 0) + 1;
    }

    // Por tienda — desglosado por tipo de click (card, whatsapp, compartir,
    // sitio-web, instagram, mapa, horarios) en vez de un solo contador
    // "clicks" genérico: sin esto no se puede saber QUÉ tocó el visitante,
    // solo que tocó algo.
    if (event.tiendaId) {
      if (!metrics.porTienda[event.tiendaId]) {
        metrics.porTienda[event.tiendaId] = { vistas: 0, clicks: 0, chats: 0, tiempo: 0, porClick: {}, porMedioCompartido: {} };
      }
      const t = metrics.porTienda[event.tiendaId];
      t.vistas += event.tipo === 'pageview' ? 1 : 0;
      t.clicks += event.tipo === 'click' ? 1 : 0;
      t.chats += event.tipo === 'chat_iniciado' ? 1 : 0;
      t.tiempo += event.tipo === 'tiempo' ? (event.valor || 0) : 0;
      if (event.tipo === 'click' && event.datos?.accion) {
        t.porClick[event.datos.accion] = (t.porClick[event.datos.accion] || 0) + 1;
        if (event.datos.accion === 'compartir' && event.datos.medio) {
          t.porMedioCompartido[event.datos.medio] = (t.porMedioCompartido[event.datos.medio] || 0) + 1;
        }
      }
    }

    // Por producto/oferta
    if (event.productoId) {
      if (!metrics.porProducto[event.productoId]) {
        metrics.porProducto[event.productoId] = { vistas: 0, clicks: 0, tiempo: 0 };
      }
      const p = metrics.porProducto[event.productoId];
      p.vistas += event.tipo === 'pageview' ? 1 : 0;
      p.clicks += event.tipo === 'click' ? 1 : 0;
      p.tiempo += event.tipo === 'tiempo' ? (event.valor || 0) : 0;
    }

    // Compartidos por medio (whatsapp/instagram/facebook/copiar-link)
    if (event.tipo === 'click' && event.datos?.accion === 'compartir' && event.datos?.medio) {
      metrics.porMedioCompartido[event.datos.medio] = (metrics.porMedioCompartido[event.datos.medio] || 0) + 1;
    }

    if (event.desde && event.hacia) {
      const flujoKey = `${event.desde}→${event.hacia}`;
      metrics.flujo[flujoKey] = (metrics.flujo[flujoKey] || 0) + 1;
    }
  });
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
        // usuariosUnicos/sesionesUnicas son objetos plain {uid: true, ...}
        // (no Set — ver defaultMetrics), el conteo real es Object.keys().length.
        // Fallback a .size/.length por si queda algún metrics-*.json viejo
        // (escrito antes de este fix) con la forma anterior en disco.
        const numUnicos = (v) => (v && typeof v === 'object')
          ? (Array.isArray(v) ? v.length : Object.keys(v).length)
          : (v?.size || 0);
        const usuariosUnicos = numUnicos(metrics.usuariosUnicos);
        const sesionesUnicas = numUnicos(metrics.sesionesUnicas);
        resultados.push({
          fecha: date,
          eventosTotales: metrics.eventosTotales,
          usuariosUnicos,
          sesionesUnicas,
          pageviews: metrics.pageviews,
          clicks: metrics.clicks,
          busquedas: metrics.busquedas,
          chatsIniciados: metrics.chatsIniciados,
          mensajesEnviados: metrics.mensajesEnviados,
          ratingPromedio: metrics.ratings?.count > 0 ? (metrics.ratings.suma / metrics.ratings.count).toFixed(2) : null,
          tiempoPromedio: sesionesUnicas > 0 ? Math.round(metrics.tiempoTotal / sesionesUnicas) : 0,
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

// ─── RESUMEN PARA EL DUEÑO DE TIENDA ─────────────────────────────────────

/**
 * Resumen SIMPLE para el panel del dueño — solo lo útil a su negocio (no el
 * tracking completo que ve el admin de LOKAL: sin clicks en logo KTRL, sin
 * flujo de navegación interno, etc). Una sola pasada de lectura por día
 * (no una función por dato) para no multiplicar los GETs a R2.
 *
 * ofertaIds: lo manda el caller (ya tiene tienda.ofertas cargadas) — evita
 * que este módulo dependa de ofertas.js/readOfertas solo para resolver qué
 * productos son de la tienda.
 */
export async function getResumenDueñoTienda(tiendaId, ofertaIds = [], dias = 7) {
  const ahora = new Date();
  let vistas = 0;
  let clicksWhatsapp = 0;
  let compartidos = 0;
  const porProducto = {}; // productoId -> { vistas, clicks }

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const metricsKey = `${ANALYTICS_PREFIX}/${yearMonth}/metrics-${date}.json`;

    try {
      const metrics = await readJson(metricsKey, null);
      if (!metrics) continue;

      const t = metrics.porTienda?.[tiendaId];
      if (t) {
        vistas += t.vistas || 0;
        clicksWhatsapp += t.porClick?.whatsapp || 0;
        compartidos += Object.values(t.porMedioCompartido || {}).reduce((a, b) => a + b, 0);
      }

      for (const pid of ofertaIds) {
        const p = metrics.porProducto?.[pid];
        if (!p) continue;
        if (!porProducto[pid]) porProducto[pid] = { vistas: 0, clicks: 0 };
        porProducto[pid].vistas += p.vistas || 0;
        porProducto[pid].clicks += p.clicks || 0;
      }
    } catch {
      // Día sin datos
    }
  }

  const topOfertas = Object.entries(porProducto)
    .map(([productoId, v]) => ({ productoId, ...v }))
    .sort((a, b) => (b.vistas + b.clicks) - (a.vistas + a.clicks))
    .slice(0, 5);

  return { dias, vistas, clicksWhatsapp, compartidos, topOfertas };
}
