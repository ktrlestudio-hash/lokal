/**
 * _lib/analytics-store.js — Cloudflare Pages Functions version.
 * Mismo propósito y estructura que la versión Netlify (eventos/sesiones/
 * métricas agregadas por día en R2), sin el fallback de fs/tmp.
 */
import { safeRead, safeWrite } from './r2-safe-write.js';
import { HttpError } from './http.js';

const ANALYTICS_PREFIX = 'analytics';

// Read-modify-write protegido por etag con reintentos internos — un evento
// de tracking no debe fallar visible: si hay colisión (409, dos eventos
// casi simultáneos) reintenta el ciclo completo en vez de propagar el error.
async function safeReadModifyWrite(bucket, key, defaultValue, mutate, retries = 5) {
  for (let i = 0; i < retries; i++) {
    const { data, etag } = await safeRead(bucket, key, defaultValue);
    const result = mutate(data);
    try {
      await safeWrite(bucket, key, result ?? data, etag);
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

async function readJson(bucket, key, defaultValue = []) {
  const { data } = await safeRead(bucket, key, defaultValue);
  return data;
}

// ─── EVENTOS ──────────────────────────────────────────────────────────────

export async function trackEvent(bucket, event) {
  const { eventsKey } = getTodayKeys();
  const timestamp = new Date().toISOString();

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    ...event,
  };

  await safeReadModifyWrite(bucket, eventsKey, [], (events) => { events.push(entry); });
  await updateMetrics(bucket, entry);

  return entry;
}

// ─── SESIONES ─────────────────────────────────────────────────────────────

export async function trackSession(bucket, sessionId, datos) {
  const { sessionsKey } = getTodayKeys();
  let result;
  await safeReadModifyWrite(bucket, sessionsKey, {}, (sessions) => {
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
    porMedioCompartido: {},
    flujo: {},
  };
}

async function updateMetrics(bucket, event) {
  const { metricsKey } = getTodayKeys();
  await safeReadModifyWrite(bucket, metricsKey, defaultMetrics(), (metrics) => {
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

    if (event.productoId) {
      if (!metrics.porProducto[event.productoId]) {
        metrics.porProducto[event.productoId] = { vistas: 0, clicks: 0, tiempo: 0 };
      }
      const p = metrics.porProducto[event.productoId];
      p.vistas += event.tipo === 'pageview' ? 1 : 0;
      p.clicks += event.tipo === 'click' ? 1 : 0;
      p.tiempo += event.tipo === 'tiempo' ? (event.valor || 0) : 0;
    }

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

export async function getAnalyticsResumen(bucket, dias = 7) {
  const ahora = new Date();
  const resultados = [];

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const metricsKey = `${ANALYTICS_PREFIX}/${yearMonth}/metrics-${date}.json`;

    try {
      const metrics = await readJson(bucket, metricsKey, null);
      if (metrics) {
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

export async function getAnalyticsTienda(bucket, tiendaId, dias = 30) {
  const ahora = new Date();
  const resultados = [];

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const metricsKey = `${ANALYTICS_PREFIX}/${yearMonth}/metrics-${date}.json`;

    try {
      const metrics = await readJson(bucket, metricsKey, null);
      if (metrics && metrics.porTienda && metrics.porTienda[tiendaId]) {
        resultados.push({ fecha: date, ...metrics.porTienda[tiendaId] });
      }
    } catch {
      // Día sin datos
    }
  }

  return resultados.reverse();
}

export async function getAnalyticsProducto(bucket, productoId, dias = 30) {
  const ahora = new Date();
  const resultados = [];

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const metricsKey = `${ANALYTICS_PREFIX}/${yearMonth}/metrics-${date}.json`;

    try {
      const metrics = await readJson(bucket, metricsKey, null);
      if (metrics && metrics.porProducto && metrics.porProducto[productoId]) {
        resultados.push({ fecha: date, ...metrics.porProducto[productoId] });
      }
    } catch {
      // Día sin datos
    }
  }

  return resultados.reverse();
}

export async function getTopBusquedas(bucket, dias = 7, limit = 20) {
  const ahora = new Date();
  const busquedas = {};

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const eventsKey = `${ANALYTICS_PREFIX}/${yearMonth}/events-${date}.json`;

    try {
      const events = await readJson(bucket, eventsKey, []);
      events.filter((e) => e.tipo === 'busqueda').forEach((e) => {
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

export async function getFlujoNavegacion(bucket, dias = 7) {
  const ahora = new Date();
  const flujo = {};

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const metricsKey = `${ANALYTICS_PREFIX}/${yearMonth}/metrics-${date}.json`;

    try {
      const metrics = await readJson(bucket, metricsKey, null);
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

export async function getResumenDueñoTienda(bucket, tiendaId, ofertaIds = [], dias = 7) {
  const ahora = new Date();
  let vistas = 0;
  let clicksWhatsapp = 0;
  let compartidos = 0;
  const porProducto = {};

  for (let i = 0; i < dias; i++) {
    const d = new Date(ahora - i * 24 * 60 * 60 * 1000);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const date = `${yearMonth}-${String(d.getDate()).padStart(2, '0')}`;
    const metricsKey = `${ANALYTICS_PREFIX}/${yearMonth}/metrics-${date}.json`;

    try {
      const metrics = await readJson(bucket, metricsKey, null);
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
