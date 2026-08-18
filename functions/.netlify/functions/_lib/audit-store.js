/**
 * _lib/audit-store.js — Cloudflare Pages Functions version.
 * Mismo propósito y estructura que la versión Netlify (log inmutable de
 * auditoría en R2, agrupado por día/mes), sin el fallback de fs/tmp — acá
 * `bucket` es el R2Bucket binding real, siempre presente.
 */
const AUDIT_PREFIX = 'audit';

function getTodayKey() {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const date = `${yearMonth}-${String(now.getDate()).padStart(2, '0')}`;
  return { yearMonth, date, logKey: `${AUDIT_PREFIX}/${yearMonth}/${date}.json`, indexKey: `${AUDIT_PREFIX}/${yearMonth}/${date}-index.json` };
}

async function readJson(bucket, key, defaultValue = []) {
  const obj = await bucket.get(key);
  if (!obj) return defaultValue;
  return JSON.parse(await obj.text());
}

async function writeJson(bucket, key, data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await bucket.put(key, JSON.stringify(data, null, 2), { httpMetadata: { contentType: 'application/json' } });
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 100 * (i + 1))); // backoff
    }
  }
}

/**
 * Registra una acción en el log de auditoría
 * @param {R2Bucket} bucket
 * @param {Object} entry
 * @param {string} entry.accion - nombre de la acción (ej: 'tienda.creada', 'pago.aprobado', 'usuario.suspendido')
 * @param {string} entry.entidadTipo - tipo de entidad afectada (tienda, usuario, producto, pago, etc.)
 * @param {string} entry.entidadId - ID de la entidad
 * @param {string} entry.actorUid - UID del usuario que hizo la acción
 * @param {string} entry.actorEmail - email del actor
 * @param {string} entry.actorRol - rol del actor (admin, empresa, emprendimiento, usuario)
 * @param {Object} entry.datosAntes - estado anterior (para cambios)
 * @param {Object} entry.datosDespues - estado posterior (para cambios)
 * @param {Object} entry.meta - datos adicionales (monto, plan, motivo, etc.)
 */
export async function auditLog(bucket, entry) {
  const { logKey, indexKey, date } = getTodayKey();
  const timestamp = new Date().toISOString();

  const logEntry = {
    id: `${date}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    ...entry,
  };

  const logs = await readJson(bucket, logKey, []);
  logs.push(logEntry);
  await writeJson(bucket, logKey, logs);

  const index = await readJson(bucket, indexKey, {});
  const entidadKey = `${entry.entidadTipo}:${entry.entidadId}`;
  if (!index[entidadKey]) index[entidadKey] = [];
  index[entidadKey].push({ id: logEntry.id, timestamp, accion: entry.accion });
  await writeJson(bucket, indexKey, index);

  return logEntry;
}

export async function getAuditByEntidad(bucket, tipo, id, limit = 50) {
  const { indexKey, logKey } = getTodayKey();
  const index = await readJson(bucket, indexKey, {});
  const entidadKey = `${tipo}:${id}`;
  const refs = (index[entidadKey] || []).slice(-limit);

  if (refs.length === 0) return [];

  const logs = await readJson(bucket, logKey, []);
  return refs.map((ref) => logs.find((l) => l.id === ref.id)).filter(Boolean);
}

export async function getAuditHoy(bucket, limit = 100, offset = 0) {
  const { logKey } = getTodayKey();
  const logs = await readJson(bucket, logKey, []);
  return logs.reverse().slice(offset, offset + limit);
}

export async function getAuditByActor(bucket, actorUid, limit = 50) {
  const { logKey } = getTodayKey();
  const logs = await readJson(bucket, logKey, []);
  return logs.filter((l) => l.actorUid === actorUid).slice(-limit).reverse();
}

export async function getAuditByAccion(bucket, accionPrefix, limit = 50) {
  const { logKey } = getTodayKey();
  const logs = await readJson(bucket, logKey, []);
  return logs.filter((l) => l.accion.startsWith(accionPrefix)).slice(-limit).reverse();
}

export async function getAuditStats(bucket) {
  const { logKey } = getTodayKey();
  const logs = await readJson(bucket, logKey, []);

  const stats = {
    totalHoy: logs.length,
    porAccion: {},
    porActor: {},
    porEntidad: {},
    ultimas24h: logs.filter((l) => {
      const hace24h = Date.now() - 24 * 60 * 60 * 1000;
      return new Date(l.timestamp).getTime() > hace24h;
    }).length,
  };

  logs.forEach((l) => {
    stats.porAccion[l.accion] = (stats.porAccion[l.accion] || 0) + 1;
    stats.porActor[l.actorEmail || l.actorUid] = (stats.porActor[l.actorEmail || l.actorUid] || 0) + 1;
    const entidadKey = `${l.entidadTipo}:${l.entidadId}`;
    stats.porEntidad[entidadKey] = (stats.porEntidad[entidadKey] || 0) + 1;
  });

  return stats;
}
