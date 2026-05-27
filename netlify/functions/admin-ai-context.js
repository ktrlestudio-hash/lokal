/**
 * Endpoint diseñado para alimentar IA con contexto completo del sistema LOKAL.
 * Devuelve datos estructurados, resumidos y con metadatos para análisis automático.
 * 
 * Uso: IA consulta este endpoint periódicamente o bajo demanda para:
 * - Detectar patrones de uso
 * - Sugerir mejoras
 * - Identificar problemas
 * - Predecir churn
 * - Recomendar acciones de admin
 */

import { requireAuth, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, jsonResponse } from './_lib/http.js';
import { readTiendas } from './_lib/tiendas-store.js';
import { readUserProfiles } from './_lib/user-profiles-store.js';
import { readOfertas } from './_lib/ofertas-store.js';
import { readDemandas } from './_lib/demandas-store.js';
import { getAuditStats, getAuditHoy } from './_lib/audit-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, OPTIONS',
};

export const handler = async (event) =>  {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    const user = await requireAuth(event);
    ensureAdmin(user);

    const modo = (event.queryStringParameters?.modo) || 'resumen'; // resumen | completo | alertas | sugerencias

    const [tiendas, perfiles, ofertas, demandas] = await Promise.all([
      readTiendas(),
      readUserProfiles(),
      readOfertas(),
      readDemandas(),
    ]);

    const ahora = new Date();
    const hace7dias = new Date(ahora - 7 * 24 * 60 * 60 * 1000);
    const hace30dias = new Date(ahora - 30 * 24 * 60 * 60 * 1000);

    // ─── DATOS CRUDOS PARA IA ──────────────────────────────────────────────

    const contexto = {
      fechaAnalisis: ahora.toISOString(),
      modo,
      resumen: {
        tiendas: {
          total: tiendas.length,
          activas: tiendas.filter(t => !t.suspendida && !t.eliminada).length,
          suspendidas: tiendas.filter(t => t.suspendida).length,
          eliminadas: tiendas.filter(t => t.eliminada).length,
          sinPlan: tiendas.filter(t => !t.suscripcion?.plan).length,
          conPlanBasico: tiendas.filter(t => t.suscripcion?.plan === 'basico' || t.suscripcion?.plan === 'mensual').length,
          conPlanPremium: tiendas.filter(t => t.suscripcion?.plan === 'premium').length,
          conPlanAnual: tiendas.filter(t => t.suscripcion?.plan === 'anual').length,
          vencidas: tiendas.filter(t => {
            if (!t.suscripcion?.vence) return false;
            return new Date(t.suscripcion.vence) < ahora;
          }).length,
          porVencer7d: tiendas.filter(t => {
            if (!t.suscripcion?.vence) return false;
            const dias = Math.ceil((new Date(t.suscripcion.vence) - ahora) / (1000 * 60 * 60 * 24));
            return dias >= 0 && dias <= 7;
          }).length,
          nuevas7d: tiendas.filter(t => {
            const fecha = t.creadaEn || t.creadoEn || t.createdAt;
            return fecha && new Date(fecha) > hace7dias;
          }).length,
          nuevas30d: tiendas.filter(t => {
            const fecha = t.creadaEn || t.creadoEn || t.createdAt;
            return fecha && new Date(fecha) > hace30dias;
          }).length,
          conRating: tiendas.filter(t => t.rating).length,
          ratingPromedio: tiendas.filter(t => t.rating).length
            ? (tiendas.filter(t => t.rating).reduce((s, t) => s + t.rating, 0) / tiendas.filter(t => t.rating).length).toFixed(2)
            : null,
          conHorarios: tiendas.filter(t => t.horarios && Object.keys(t.horarios).length > 0).length,
          conFoto: tiendas.filter(t => t.foto || (t.galeria?.length > 0)).length,
          conUbicacion: tiendas.filter(t => t.lat && t.lng).length,
          porRubro: tiendas.reduce((acc, t) => {
            const rubro = t.rubro || 'Sin rubro';
            acc[rubro] = (acc[rubro] || 0) + 1;
            return acc;
          }, {}),
          porCiudad: tiendas.reduce((acc, t) => {
            const ciudad = t.ciudad || 'Sin ciudad';
            acc[ciudad] = (acc[ciudad] || 0) + 1;
            return acc;
          }, {}),
        },
        productos: {
          total: ofertas.length,
          activos: ofertas.filter(o => o.activa !== false && !o.eliminada).length,
          suspendidos: ofertas.filter(o => o.suspendida).length,
          eliminados: ofertas.filter(o => o.eliminada).length,
          conFoto: ofertas.filter(o => o.galeria?.[0] || o.fotos?.[0]).length,
          sinFoto: ofertas.filter(o => !o.galeria?.[0] && !o.fotos?.[0]).length,
          conPrecio: ofertas.filter(o => o.precio).length,
          precioPromedio: ofertas.filter(o => o.precio).length
            ? Math.round(ofertas.filter(o => o.precio).reduce((s, o) => s + Number(o.precio), 0) / ofertas.filter(o => o.precio).length)
            : 0,
          porTienda: ofertas.reduce((acc, o) => {
            const tid = o.tiendaId || o.tiendaNombre || 'sin_tienda';
            acc[tid] = (acc[tid] || 0) + 1;
            return acc;
          }, {}),
        },
        demandas: {
          total: demandas.length,
          activas: demandas.filter(d => d.estado === 'activa').length,
          conRespuestas: demandas.filter(d => (d.respuestas || 0) > 0).length,
          sinRespuestas: demandas.filter(d => (d.respuestas || 0) === 0).length,
          tasaRespuesta: demandas.length
            ? Math.round((demandas.filter(d => (d.respuestas || 0) > 0).length / demandas.length) * 100)
            : 0,
          nuevas7d: demandas.filter(d => {
            const fecha = d.creadaEn || d.creadoEn || d.createdAt;
            return fecha && new Date(fecha) > hace7dias;
          }).length,
          porCategoria: demandas.reduce((acc, d) => {
            const cat = d.categoria || d.categoryId || 'Sin categoria';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {}),
        },
        usuarios: {
          total: perfiles.length,
          conTienda: perfiles.filter(p => p.tieneTienda || p.role === 'empresa').length,
          sinTienda: perfiles.filter(p => !p.tieneTienda && p.role !== 'empresa').length,
          porRol: perfiles.reduce((acc, p) => {
            const rol = p.role || 'usuario';
            acc[rol] = (acc[rol] || 0) + 1;
            return acc;
          }, {}),
        },
        finanzas: {
          ingresosTotal: tiendas.reduce((s, t) => {
            return s + (t.suscripcion?.historial || []).reduce((h, p) => h + (Number(p.monto) || 0), 0);
          }, 0),
          ingresosMes: tiendas.reduce((s, t) => {
            return s + (t.suscripcion?.historial || []).reduce((h, p) => {
              const fecha = p.fecha || p.creadoEn;
              if (fecha && new Date(fecha).getMonth() === ahora.getMonth() && new Date(fecha).getFullYear() === ahora.getFullYear()) {
                return h + (Number(p.monto) || 0);
              }
              return h;
            }, 0);
          }, 0),
          pagosManuales: tiendas.reduce((s, t) => {
            return s + (t.suscripcion?.historial || []).filter(p => p.paymentId === 'manual').length;
          }, 0),
          pagosMP: tiendas.reduce((s, t) => {
            return s + (t.suscripcion?.historial || []).filter(p => p.paymentId && p.paymentId !== 'manual').length;
          }, 0),
        },
      },
    };

    // ─── MODO COMPLETO: datos crudos para análisis profundo ────────────────
    if (modo === 'completo') {
      contexto.tiendasDetalle = tiendas.map(t => ({
        id: t.id,
        nombre: t.nombre,
        rubro: t.rubro,
        ciudad: t.ciudad,
        plan: t.suscripcion?.plan,
        vence: t.suscripcion?.vence,
        diasParaVencer: t.suscripcion?.vence
          ? Math.ceil((new Date(t.suscripcion.vence) - ahora) / (1000 * 60 * 60 * 24))
          : null,
        rating: t.rating,
        tieneFoto: !!(t.foto || t.galeria?.length),
        tieneHorarios: !!(t.horarios && Object.keys(t.horarios).length > 0),
        tieneUbicacion: !!(t.lat && t.lng),
        suspendida: t.suspendida,
        eliminada: t.eliminada,
        creadaEn: t.creadaEn || t.creadoEn,
        productosCount: ofertas.filter(o => o.tiendaId === t.id || o.tiendaNombre === t.nombre).length,
      }));

      contexto.productosDetalle = ofertas.map(o => ({
        id: o.id,
        nombre: o.nombre,
        tiendaId: o.tiendaId,
        tiendaNombre: o.tiendaNombre,
        precio: o.precio,
        categoria: o.categoria || o.categoryId,
        tieneFoto: !!(o.galeria?.[0] || o.fotos?.[0]),
        activa: o.activa,
        suspendida: o.suspendida,
        eliminada: o.eliminada,
        creadoEn: o.creadoEn || o.createdAt,
      }));

      contexto.demandasDetalle = demandas.map(d => ({
        id: d.id,
        titulo: d.titulo,
        categoria: d.categoria || d.categoryId,
        estado: d.estado,
        respuestas: d.respuestas || 0,
        creadoEn: d.creadoEn || d.createdAt,
      }));
    }

    // ─── MODO ALERTAS: solo problemas ──────────────────────────────────────
    if (modo === 'alertas') {
      const alertas = [];

      if (contexto.resumen.tiendas.vencidas > 0) {
        alertas.push({
          nivel: 'critico',
          tipo: 'suscripciones',
          titulo: `${contexto.resumen.tiendas.vencidas} tiendas con suscripción vencida`,
          descripcion: 'Estas tiendas perdieron acceso a funciones premium. Considerar campaña de recuperación.',
          entidades: tiendas.filter(t => {
            if (!t.suscripcion?.vence) return false;
            return new Date(t.suscripcion.vence) < ahora;
          }).map(t => ({ id: t.id, nombre: t.nombre })),
        });
      }

      if (contexto.resumen.tiendas.porVencer7d > 0) {
        alertas.push({
          nivel: 'advertencia',
          tipo: 'suscripciones',
          titulo: `${contexto.resumen.tiendas.porVencer7d} tiendas por vencer en 7 días`,
          descripcion: 'Enviar recordatorio de renovación para evitar churn.',
          entidades: tiendas.filter(t => {
            if (!t.suscripcion?.vence) return false;
            const dias = Math.ceil((new Date(t.suscripcion.vence) - ahora) / (1000 * 60 * 60 * 24));
            return dias >= 0 && dias <= 7;
          }).map(t => ({ id: t.id, nombre: t.nombre, dias })),
        });
      }

      if (contexto.resumen.demandas.tasaRespuesta < 30) {
        alertas.push({
          nivel: 'critico',
          tipo: 'engagement',
          titulo: `Tasa de respuesta baja: ${contexto.resumen.demandas.tasaRespuesta}%`,
          descripcion: 'Las tiendas no están respondiendo demandas. Revisar notificaciones o incentivar respuestas.',
        });
      }

      if (contexto.resumen.productos.sinFoto > contexto.resumen.productos.total * 0.5) {
        alertas.push({
          nivel: 'advertencia',
          tipo: 'calidad',
          titulo: `${contexto.resumen.productos.sinFoto} productos sin foto`,
          descripcion: 'Más del 50% de productos no tienen imagen. Impacta en conversión.',
        });
      }

      if (contexto.resumen.tiendas.conHorarios < contexto.resumen.tiendas.total * 0.3) {
        alertas.push({
          nivel: 'info',
          tipo: 'completitud',
          titulo: `${contexto.resumen.tiendas.total - contexto.resumen.tiendas.conHorarios} tiendas sin horarios`,
          descripcion: 'Los usuarios no saben cuándo están abiertas las tiendas.',
        });
      }

      // Tiendas sin productos
      const tiendasSinProductos = tiendas.filter(t => {
        const count = ofertas.filter(o => o.tiendaId === t.id || o.tiendaNombre === t.nombre).length;
        return count === 0 && !t.suspendida && !t.eliminada;
      });
      if (tiendasSinProductos.length > 0) {
        alertas.push({
          nivel: 'advertencia',
          tipo: 'onboarding',
          titulo: `${tiendasSinProductos.length} tiendas sin productos`,
          descripcion: 'Tiendas que no publicaron ningún producto. Necesitan onboarding.',
          entidades: tiendasSinProductos.map(t => ({ id: t.id, nombre: t.nombre })),
        });
      }

      contexto.alertas = alertas;
      delete contexto.resumen;
    }

    // ─── MODO SUGERENCIAS: acciones recomendadas ───────────────────────────
    if (modo === 'sugerencias') {
      const sugerencias = [];

      // Sugerencia 1: Campaña de recuperación
      if (contexto.resumen.tiendas.vencidas > 0) {
        sugerencias.push({
          prioridad: 'alta',
          accion: 'Campaña de recuperación de suscripciones vencidas',
          impacto: `$${contexto.resumen.tiendas.vencidas * 4990} ARS mensuales potenciales`,
          pasos: [
            'Enviar email personalizado a tiendas vencidas',
            'Ofrecer descuento del 20% por 3 meses',
            'Mostrar testimonios de tiendas activas',
          ],
        });
      }

      // Sugerencia 2: Mejorar fotos de productos
      if (contexto.resumen.productos.sinFoto > 0) {
        sugerencias.push({
          prioridad: 'media',
          accion: 'Campaña "Producto con foto"',
          impacto: 'Hasta 3x más clics en productos con foto',
          pasos: [
            'Notificar a tiendas con productos sin foto',
            'Ofrecer sesión de fotos gratuita o tutorial',
            'Destacar productos con foto en el feed',
          ],
        });
      }

      // Sugerencia 3: Activar respuestas
      if (contexto.resumen.demandas.sinRespuestas > 0) {
        sugerencias.push({
          prioridad: 'alta',
          accion: 'Mejorar tasa de respuesta a demandas',
          impacto: `${contexto.resumen.demandas.sinRespuestas} ventas potenciales perdidas`,
          pasos: [
            'Revisar si las notificaciones están funcionando',
            'Enviar push a tiendas con demandas pendientes',
            'Incentivar respuestas con badge "Responde rápido"',
          ],
        });
      }

      // Sugerencia 4: Onboarding tiendas nuevas
      if (contexto.resumen.tiendas.nuevas7d > 0) {
        sugerencias.push({
          prioridad: 'media',
          accion: 'Onboarding para tiendas nuevas',
          impacto: 'Reducir churn en primeros 30 días',
          pasos: [
            'Enviar checklist de configuración',
            'Ofrecer llamada de bienvenida',
            'Destacar tienda nueva en el feed',
          ],
        });
      }

      // Sugerencia 5: Rubros desatendidos
      const rubrosConPocaCobertura = Object.entries(contexto.resumen.tiendas.porRubro)
        .filter(([_, count]) => count === 1)
        .map(([rubro]) => rubro);
      if (rubrosConPocaCobertura.length > 3) {
        sugerencias.push({
          prioridad: 'baja',
          accion: 'Expandir cobertura de rubros',
          impacto: `${rubrosConPocaCobertura.length} rubros con solo 1 tienda`,
          pasos: [
            'Identificar rubros populares en la ciudad',
            'Crear campaña de invitación dirigida',
            'Destacar rubros con poca competencia',
          ],
        });
      }

      contexto.sugerencias = sugerencias;
      delete contexto.resumen;
    }

    // ─── AUDITORÍA ─────────────────────────────────────────────────────────
    try {
      const auditStats = await getAuditStats();
      contexto.auditoria = auditStats;
    } catch {
      contexto.auditoria = null;
    }

    return jsonResponse(event, 200, contexto);
  } catch (err) {
    return handleError(event, err);
  }
}
