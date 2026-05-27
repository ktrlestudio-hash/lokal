import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { readTiendas, writeTiendas, findTiendaById } from './_lib/tiendas-store.js';
import { readUserProfiles, writeUserProfiles } from './_lib/user-profiles-store.js';
import { auditLog } from './_lib/audit-store.js';

const ADMIN_EMAILS = (process.env.VITE_ADMIN_EMAILS || 'katryelmmartinez@gmail.com,ktrlestudio@gmail.com')
  .split(',')
  .map(v => v.trim().toLowerCase())
  .filter(Boolean);

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, OPTIONS',
};

function isAdmin(email) {
  return ADMIN_EMAILS.includes((email || '').toLowerCase());
}

function buildSuscripcion(plan, venceDesde, esPromo) {
  const now = venceDesde ? new Date(venceDesde) : new Date();
  const vence = new Date(now);
  if (plan === 'anual') {
    vence.setFullYear(vence.getFullYear() + 1);
    vence.setMonth(vence.getMonth() + 1); // 13 meses
  } else {
    vence.setMonth(vence.getMonth() + 2); // 2 meses (promo)
  }

  return {
    estado: 'activa',
    plan,
    inicio: now.toISOString(),
    vence: vence.toISOString(),
    esPromo: !!esPromo,
    mpPaymentId: 'manual',
    historial: [
      { fecha: now.toISOString(), plan, monto: null, paymentId: 'manual', notas: 'Registro manual por admin' },
    ],
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);
  if (event.httpMethod !== 'POST') {
    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  }

  try {
    // Auth básica - verificar que sea admin
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) throw new HttpError(401, 'No autorizado');

    // Decodificar JWT básico (solo verificar que tenga email de admin)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (!isAdmin(payload.email)) {
      throw new HttpError(403, 'Solo admins pueden registrar pagos manuales');
    }

    const body = parseJsonBody(event);
    const tiendaId = body.tiendaId;
    const plan = body.plan || 'mensual';
    const meses = body.meses || (plan === 'anual' ? 13 : 2);
    const notas = body.notas || '';
    const venceDesde = body.venceDesde ? new Date(body.venceDesde) : new Date();

    if (!tiendaId) throw new HttpError(400, 'Falta tiendaId');

    const tiendas = await readTiendas();
    const tienda = findTiendaById(tiendas, tiendaId);
    if (!tienda) throw new HttpError(404, 'Tienda no encontrada');

    // Calcular nueva fecha de vencimiento
    const vence = new Date(venceDesde);
    vence.setMonth(vence.getMonth() + meses);

    // Construir nueva suscripción o mergear con existente
    const existing = tienda.suscripcion;
    const nuevaSuscripcion = {
      estado: 'activa',
      plan,
      inicio: existing?.inicio || venceDesde.toISOString(),
      vence: vence.toISOString(),
      esPromo: meses > (plan === 'anual' ? 12 : 1),
      mpPaymentId: 'manual',
      historial: [
        ...(existing?.historial || []),
        {
          fecha: new Date().toISOString(),
          plan,
          monto: body.monto || null,
          paymentId: 'manual',
          notas: notas || `Registro manual por ${payload.email || 'admin'}`,
        },
      ],
    };

    // Actualizar tienda
    const idx = tiendas.findIndex(t => t.id === tiendaId);
    tiendas[idx].suscripcion = nuevaSuscripcion;
    await writeTiendas(tiendas);

    await auditLog({
      accion: plan === 'sin_plan' ? 'suscripcion.anulada' : 'pago.registrado',
      entidadTipo: 'tienda',
      entidadId: tiendaId,
      actorUid: payload.sub || payload.user_id || 'admin',
      actorEmail: payload.email,
      actorRol: 'admin',
      datosAntes: { plan: existing?.plan, vence: existing?.vence },
      datosDespues: { plan, vence: vence.toISOString() },
      meta: { monto: body.monto, metodo: 'manual', notas, meses },
    });

    // Sincronizar userProfile
    const profiles = await readUserProfiles();
    const pIdx = profiles.findIndex(p => p.uid === tienda.googleUid);
    if (pIdx !== -1) {
      profiles[pIdx] = {
        ...profiles[pIdx],
        role: 'empresa',
        plan: plan === 'premium' ? 'premium' : 'basico',
        suscripcion: nuevaSuscripcion,
      };
      await writeUserProfiles(profiles);
    }

    return jsonResponse(event, 200, {
      ok: true,
      suscripcion: nuevaSuscripcion,
      mensaje: 'Pago registrado correctamente',
    }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
