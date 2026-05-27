import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, jsonResponse } from './_lib/http.js';
import { readTiendas } from './_lib/tiendas-store.js';
import { readUserProfiles } from './_lib/user-profiles-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);
    ensureAdmin(user);

    const [tiendas, perfiles] = await Promise.all([
      readTiendas(),
      readUserProfiles(),
    ]);

    const ahora = new Date();

    // Tiendas
    const tiendasActivas = tiendas.filter(t => !t.suspendida && !t.eliminada).length;
    const tiendasSuspendidas = tiendas.filter(t => t.suspendida).length;
    const tiendasNuevasMes = tiendas.filter(t => {
      const fecha = t.creadaEn || t.creadoEn || t.createdAt;
      if (!fecha) return false;
      const d = new Date(fecha);
      return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
    }).length;

    // Suscripciones
    const conSuscripcion = tiendas.filter(t => t.suscripcion?.plan && t.suscripcion?.vence).length;
    const vencidas = tiendas.filter(t => {
      if (!t.suscripcion?.vence) return false;
      return new Date(t.suscripcion.vence) < ahora;
    }).length;
    const porVencer = tiendas.filter(t => {
      if (!t.suscripcion?.vence) return false;
      const dias = Math.ceil((new Date(t.suscripcion.vence) - ahora) / (1000 * 60 * 60 * 24));
      return dias >= 0 && dias <= 7;
    }).length;

    // Usuarios
    const totalUsuarios = perfiles.length;
    const usuariosConTienda = perfiles.filter(p => p.tieneTienda || p.role === 'empresa').length;

    // Ingresos estimados (del historial de pagos)
    let ingresosMes = 0;
    let ingresosTotal = 0;
    tiendas.forEach(t => {
      const historial = t.suscripcion?.historial || [];
      historial.forEach(p => {
        const monto = Number(p.monto) || 0;
        ingresosTotal += monto;
        const fecha = p.fecha || p.creadoEn;
        if (fecha) {
          const d = new Date(fecha);
          if (d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear()) {
            ingresosMes += monto;
          }
        }
      });
    });

    return jsonResponse(event, 200, {
      tiendas: {
        total: tiendas.length,
        activas: tiendasActivas,
        suspendidas: tiendasSuspendidas,
        nuevasEsteMes: tiendasNuevasMes,
      },
      suscripciones: {
        total: conSuscripcion,
        activas: conSuscripcion - vencidas,
        vencidas,
        porVencer,
      },
      usuarios: {
        total: totalUsuarios,
        conTienda: usuariosConTienda,
        sinTienda: totalUsuarios - usuariosConTienda,
      },
      ingresos: {
        mesActual: ingresosMes,
        total: ingresosTotal,
      },
    });
  } catch (err) {
    return handleError(event, err);
  }
};
