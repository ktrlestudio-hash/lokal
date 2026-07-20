/**
 * Sistema de auditoría y trazabilidad para LOKAL
 * Guarda un log inmutable de todas las acciones críticas del sistema
 * 
 * Estructura en R2:
 *   audit/
 *     YYYY-MM/
 *       YYYY-MM-DD.json        → logs del día
 *       YYYY-MM-DD-index.json  → índice por entidad (tienda, usuario, etc.)
 *     summary.json              → resumen mensual
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BUCKET = process.env.R2_BUCKET_NAME;
const AUDIT_PREFIX = 'audit';
const LOCAL_DIR = join('/tmp', 'lokal-audit');

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

function getTodayKey() {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const date = `${yearMonth}-${String(now.getDate()).padStart(2, '0')}`;
  return { yearMonth, date, logKey: `${AUDIT_PREFIX}/${yearMonth}/${date}.json`, indexKey: `${AUDIT_PREFIX}/${yearMonth}/${date}-index.json` };
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

/**
 * Registra una acción en el log de auditoría
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
export async function auditLog(entry) {
  const { logKey, indexKey, date } = getTodayKey();
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    id: `${date}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    ...entry,
  };

  // 1. Guardar en el log del día
  const logs = await readJson(logKey, []);
  logs.push(logEntry);
  await writeJson(logKey, logs);

  // 2. Actualizar índice por entidad
  const index = await readJson(indexKey, {});
  const entidadKey = `${entry.entidadTipo}:${entry.entidadId}`;
  if (!index[entidadKey]) index[entidadKey] = [];
  index[entidadKey].push({ id: logEntry.id, timestamp, accion: entry.accion });
  await writeJson(indexKey, index);

  return logEntry;
}

/**
 * Obtiene logs por entidad
 */
export async function getAuditByEntidad(tipo, id, limit = 50) {
  const { indexKey } = getTodayKey();
  const index = await readJson(indexKey, {});
  const entidadKey = `${tipo}:${id}`;
  const refs = (index[entidadKey] || []).slice(-limit);
  
  if (refs.length === 0) return [];
  
  const logs = await readJson(getTodayKey().logKey, []);
  return refs.map(ref => logs.find(l => l.id === ref.id)).filter(Boolean);
}

/**
 * Obtiene todos los logs del día
 */
export async function getAuditHoy(limit = 100, offset = 0) {
  const { logKey } = getTodayKey();
  const logs = await readJson(logKey, []);
  return logs.reverse().slice(offset, offset + limit);
}

/**
 * Obtiene logs por actor (quién hizo la acción)
 */
export async function getAuditByActor(actorUid, limit = 50) {
  const { logKey } = getTodayKey();
  const logs = await readJson(logKey, []);
  return logs.filter(l => l.actorUid === actorUid).slice(-limit).reverse();
}

/**
 * Obtiene logs por tipo de acción
 */
export async function getAuditByAccion(accionPrefix, limit = 50) {
  const { logKey } = getTodayKey();
  const logs = await readJson(logKey, []);
  return logs.filter(l => l.accion.startsWith(accionPrefix)).slice(-limit).reverse();
}

/**
 * Estadísticas de auditoría para el admin
 */
export async function getAuditStats() {
  const { logKey, yearMonth } = getTodayKey();
  const logs = await readJson(logKey, []);
  
  const stats = {
    totalHoy: logs.length,
    porAccion: {},
    porActor: {},
    porEntidad: {},
    ultimas24h: logs.filter(l => {
      const hace24h = Date.now() - 24 * 60 * 60 * 1000;
      return new Date(l.timestamp).getTime() > hace24h;
    }).length,
  };
  
  logs.forEach(l => {
    stats.porAccion[l.accion] = (stats.porAccion[l.accion] || 0) + 1;
    stats.porActor[l.actorEmail || l.actorUid] = (stats.porActor[l.actorEmail || l.actorUid] || 0) + 1;
    const entidadKey = `${l.entidadTipo}:${l.entidadId}`;
    stats.porEntidad[entidadKey] = (stats.porEntidad[entidadKey] || 0) + 1;
  });
  
  return stats;
}
