/**
 * Endpoint para acciones de administración:
 * - Suspender / activar tienda, producto, demanda
 * - Eliminar tienda, producto, demanda (soft delete)
 * - Ver historial de acciones admin
 */

import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBodyAsync } from './_lib/http.js';
import { readTiendas, writeTiendas, findTiendaById } from './_lib/tiendas-store.js';
import { auditLog } from './_lib/audit-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, PATCH, DELETE, OPTIONS',
};

export const handler = async (event) =>  {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);
    ensureAdmin(user);

    const body = await parseJsonBodyAsync(req);
    const { accion, tipo, id, motivo } = body;

    if (!accion || !tipo || !id) {
      throw new HttpError(400, 'Faltan accion, tipo o id');
    }

    const ahora = new Date().toISOString();

    // ─── TIENDA ──────────────────────────────────────────────────────────────
    if (tipo === 'tienda' || tipo === 'store') {
      const tiendas = await readTiendas();
      const idx = tiendas.findIndex(t => String(t.id) === String(id));
      if (idx === -1) throw new HttpError(404, 'Tienda no encontrada');

      const tienda = tiendas[idx];
      const datosAntes = { suspendida: tienda.suspendida, eliminada: tienda.eliminada, activa: tienda.activa };

      if (accion === 'suspender') {
        tiendas[idx] = { ...tienda, suspendida: true, suspendidaEn: ahora, suspendidaPor: user.email, suspendidaMotivo: motivo || '' };
      } else if (accion === 'activar' || accion === 'restaurar') {
        tiendas[idx] = { ...tienda, suspendida: false, suspendidaEn: null, suspendidaPor: null, suspendidaMotivo: null };
      } else if (accion === 'eliminar') {
        tiendas[idx] = { ...tienda, eliminada: true, eliminadaEn: ahora, eliminadaPor: user.email };
      } else {
        throw new HttpError(400, 'Accion no valida para tienda');
      }

      await writeTiendas(tiendas);
      await auditLog({
        accion: `tienda.${accion}`,
        entidadTipo: 'tienda',
        entidadId: id,
        actorUid: user.uid,
        actorEmail: user.email,
        actorRol: 'admin',
        datosAntes,
        datosDespues: { suspendida: tiendas[idx].suspendida, eliminada: tiendas[idx].eliminada, activa: tiendas[idx].activa },
        meta: { motivo },
      });

      return jsonResponse(event, 200, { ok: true, tienda: tiendas[idx] });
    }

    // ─── PRODUCTO (oferta) ─────────────────────────────────────────────────
    if (tipo === 'producto' || tipo === 'product') {
      const { readOfertas, writeOfertas } = await import('./_lib/ofertas-store.js').catch(() => ({
        readOfertas: async () => [],
        writeOfertas: async () => {},
      }));

      const ofertas = await readOfertas();
      const idx = ofertas.findIndex(o => String(o.id) === String(id));
      if (idx === -1) throw new HttpError(404, 'Producto no encontrado');

      const oferta = ofertas[idx];
      const datosAntes = { activa: oferta.activa, eliminada: oferta.eliminada };

      if (accion === 'suspender') {
        ofertas[idx] = { ...oferta, activa: false, suspendida: true, suspendidaEn: ahora, suspendidaPor: user.email };
      } else if (accion === 'activar' || accion === 'restaurar') {
        ofertas[idx] = { ...oferta, activa: true, suspendida: false, suspendidaEn: null, suspendidaPor: null };
      } else if (accion === 'eliminar') {
        ofertas[idx] = { ...oferta, eliminada: true, eliminadaEn: ahora, eliminadaPor: user.email };
      } else {
        throw new HttpError(400, 'Accion no valida para producto');
      }

      await writeOfertas(ofertas);
      await auditLog({
        accion: `producto.${accion}`,
        entidadTipo: 'producto',
        entidadId: id,
        actorUid: user.uid,
        actorEmail: user.email,
        actorRol: 'admin',
        datosAntes,
        datosDespues: { activa: ofertas[idx].activa, eliminada: ofertas[idx].eliminada },
        meta: { motivo, tiendaId: oferta.tiendaId },
      });

      return jsonResponse(event, 200, { ok: true, producto: ofertas[idx] });
    }

    // ─── DEMANDA ────────────────────────────────────────────────────────────
    if (tipo === 'demanda' || tipo === 'demand') {
      const { readDemandas, writeDemandas } = await import('./_lib/demandas-store.js').catch(() => ({
        readDemandas: async () => [],
        writeDemandas: async () => {},
      }));

      const demandas = await readDemandas();
      const idx = demandas.findIndex(d => String(d.id) === String(id));
      if (idx === -1) throw new HttpError(404, 'Demanda no encontrada');

      const demanda = demandas[idx];
      const datosAntes = { estado: demanda.estado, eliminada: demanda.eliminada };

      if (accion === 'suspender') {
        demandas[idx] = { ...demanda, estado: 'suspendida', suspendidaEn: ahora, suspendidaPor: user.email };
      } else if (accion === 'activar' || accion === 'restaurar') {
        demandas[idx] = { ...demanda, estado: 'activa', suspendidaEn: null, suspendidaPor: null };
      } else if (accion === 'eliminar') {
        demandas[idx] = { ...demanda, estado: 'eliminada', eliminadaEn: ahora, eliminadaPor: user.email };
      } else {
        throw new HttpError(400, 'Accion no valida para demanda');
      }

      await writeDemandas(demandas);
      await auditLog({
        accion: `demanda.${accion}`,
        entidadTipo: 'demanda',
        entidadId: id,
        actorUid: user.uid,
        actorEmail: user.email,
        actorRol: 'admin',
        datosAntes,
        datosDespues: { estado: demandas[idx].estado, eliminada: demandas[idx].eliminada },
        meta: { motivo },
      });

      return jsonResponse(event, 200, { ok: true, demanda: demandas[idx] });
    }

    throw new HttpError(400, 'Tipo no valido');
  } catch (err) {
    return handleError(event, err);
  }
}
