import { getBearerToken, requireAuth, verifyFirebaseIdToken, ensureSameUserOrAdmin, ensureAdmin } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import {
  sanitizeEmail,
  sanitizeMediaUrls,
  sanitizePhone,
  sanitizePlainObject,
  sanitizeStringArray,
  sanitizeText,
  sanitizeUrl,
  requireText,
} from './_lib/validation.js';
import {
  ensureStoreOwner,
  findTiendaById,
  findTiendaByOwnerUid,
  findTiendaBySlug,
  generateSlug,
  readTiendas,
  readTiendasWithEtag,
  sanitizeOwnerTienda,
  sanitizePublicTienda,
  writeTiendas,
  writeTiendasSafe,
} from './_lib/tiendas-store.js';
import { auditLog } from './_lib/audit-store.js';
import { defaultSecciones } from './_lib/modules.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, OPTIONS',
};

async function getOptionalUser(event) {
  const token = getBearerToken(event);
  if (!token) return null;

  try {
    return await verifyFirebaseIdToken(token);
  } catch {
    return null;
  }
}

// Slug único derivado del nombre — "almacen-don-jose", con sufijo numérico
// si ya existe ("almacen-don-jose-2"). El dueño lo puede personalizar
// después desde el panel (PATCH), esto solo evita que la tienda nazca sin
// URL pública hasta que alguien complete el checklist a mano.
function uniqueSlugFromNombre(nombre, tiendasExistentes) {
  const base = generateSlug(nombre);
  let candidate = base;
  let n = 2;
  while (tiendasExistentes.some((t) => t.slug === candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

function buildStorePayload(body, user, token, tiendasExistentes = []) {
  const foto = sanitizeMediaUrls(body.foto ? [body.foto] : [], { maxItems: 1 })[0] || null;
  const rubros = sanitizeStringArray(body.rubros, { maxItems: 10, maxItemLength: 48 });
  const nombre = requireText(body.nombre, { field: 'nombre', min: 2, max: 120, multiline: false });

  return {
    id: Date.now(),
    nombre,
    slug: uniqueSlugFromNombre(nombre, tiendasExistentes),
    rubros,
    descripcion: sanitizeText(body.descripcion, { max: 1500 }),
    direccion: sanitizeText(body.direccion, { max: 240 }),
    ciudad: sanitizeText(body.ciudad, { max: 80, multiline: false }),
    horarios: sanitizePlainObject(body.horarios, { maxKeys: 14, maxStringLength: 32 }),
    telefono: sanitizePhone(body.telefono),
    website: body.website ? sanitizeUrl(body.website) : '',
    foto,
    galeria: sanitizeMediaUrls(body.galeria, { maxItems: 6 }),
    googleUid: user.uid,
    ownerNombre: sanitizeText(user.name || body.ownerNombre || '', { max: 120, multiline: false }),
    ownerEmail: user.email || sanitizeEmail(body.ownerEmail, { required: true, field: 'ownerEmail' }),
    ownerFoto: user.picture || null,
    emailContacto: body.emailContacto ? sanitizeEmail(body.emailContacto, { field: 'emailContacto' }) : '',
    token,
    activa: true,
    verificada: false,
    creadoEn: new Date().toISOString(),
    // Módulos de negocio activos según el rubro elegido — ver _lib/modules.js.
    // El dueño los puede cambiar después desde el panel (PATCH pagina.secciones).
    pagina: { secciones: defaultSecciones(rubros) },
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);

  try {
    if (event.httpMethod === 'GET') {
      const tiendas = await readTiendas();
      const { id, googleUid, slug, pendientes } = event.queryStringParameters || {};

      // Panel de aprobación (super-admin): tiendas activas esperando
      // verificada:true — el único listado con datos de dueño (owner*), el
      // resto de vistas GET usa sanitizePublicTienda.
      if (pendientes === 'true') {
        const user = await requireAuth(event);
        ensureAdmin(user);
        return jsonResponse(
          event,
          200,
          tiendas.filter((t) => t.activa && !t.verificada).map(sanitizeOwnerTienda),
          HTTP_OPTIONS
        );
      }

      if (id) {
        const tienda = findTiendaById(tiendas, id);
        if (!tienda) {
          return jsonResponse(event, 404, { error: 'No encontrada' }, HTTP_OPTIONS);
        }

        const user = await getOptionalUser(event);
        const canSeePrivate = !!user && (user.isAdmin || tienda.googleUid === user.uid);
        return jsonResponse(
          event,
          200,
          canSeePrivate ? sanitizeOwnerTienda(tienda) : sanitizePublicTienda(tienda),
          HTTP_OPTIONS
        );
      }

      if (slug) {
        const tienda = findTiendaBySlug(tiendas, slug);
        if (!tienda || !tienda.activa) {
          return jsonResponse(event, 404, { error: 'Tienda no encontrada' }, HTTP_OPTIONS);
        }
        // getOptionalUser siempre (no solo si !verificada): sin esto, la
        // vista pública NUNCA sabía si quien pedía la tienda era su propio
        // dueño — sanitizePublicTienda le borra googleUid a TODOS por igual,
        // así que "esDueño" (TiendaPublica.jsx, comparación de uid) daba
        // false siempre, para cualquiera, incluso el dueño real logueado
        // viendo su propia tienda. El FAB "+"/atajo al panel nunca podían
        // aparecer. Ahora: si es el dueño o un admin, se devuelve la versión
        // CON googleUid (sanitizeOwnerTienda) para que esDueño se calcule bien.
        const user = await getOptionalUser(event);
        const esDueñoOAdmin = !!user && (user.isAdmin || tienda.googleUid === user.uid);
        // No verificada: invisible en público hasta que un admin la apruebe
        // (PATCH verificada:true) — salvo para el propio dueño o un admin,
        // que necesitan verla para cargar/probar antes de publicar.
        if (!tienda.verificada && !esDueñoOAdmin) {
          return jsonResponse(event, 404, { error: 'Tienda no encontrada' }, HTTP_OPTIONS);
        }
        return jsonResponse(event, 200, esDueñoOAdmin ? sanitizeOwnerTienda(tienda) : sanitizePublicTienda(tienda), HTTP_OPTIONS);
      }

      if (googleUid) {
        const user = await requireAuth(event);
        ensureSameUserOrAdmin(user, googleUid, 'No autorizado para consultar esta tienda');

        const tienda = findTiendaByOwnerUid(tiendas, googleUid);
        if (!tienda) {
          return jsonResponse(event, 404, { error: 'No encontrada' }, HTTP_OPTIONS);
        }

        return jsonResponse(event, 200, sanitizeOwnerTienda(tienda), HTTP_OPTIONS);
      }

      // Listado público (sin auth): solo activas y verificadas.
      return jsonResponse(
        event,
        200,
        tiendas.filter((t) => t.activa && t.verificada).map(sanitizePublicTienda),
        HTTP_OPTIONS
      );
    }

    if (event.httpMethod === 'POST') {
      const user = await requireAuth(event);
      const body = parseJsonBody(event);

      if (body.termsAccepted !== true) {
        throw new HttpError(400, 'Debes aceptar los terminos y la politica de privacidad');
      }

      if (body.googleUid && body.googleUid !== user.uid) {
        throw new HttpError(403, 'No autorizado para registrar la tienda con otro usuario');
      }

      if (body.ownerEmail && user.email && body.ownerEmail.toLowerCase() !== user.email.toLowerCase()) {
        throw new HttpError(403, 'ownerEmail no coincide con la sesion');
      }

      const tiendas = await readTiendas();

      if (findTiendaByOwnerUid(tiendas, user.uid)) {
        throw new HttpError(409, 'Esta cuenta ya tiene una tienda registrada');
      }

      // Admin: crea la tienda directo sin pasar por MP ni validar token de invitación
      if (user.isAdmin && body.adminBypass === true) {
        const payload = buildStorePayload(body, user, `admin-${Date.now()}`, tiendas);
        payload.suscripcion = { plan: 'admin', vence: null }; // sin vencimiento
        tiendas.push(payload);
        await writeTiendas(tiendas);
        await auditLog({
          accion: 'tienda.creada',
          entidadTipo: 'tienda',
          entidadId: payload.id,
          actorUid: user.uid,
          actorEmail: user.email,
          actorRol: 'admin',
          datosDespues: { nombre: payload.nombre, plan: 'admin' },
          meta: { metodo: 'adminBypass' },
        });
        return jsonResponse(event, 201, sanitizeOwnerTienda(payload), HTTP_OPTIONS);
      }

      // Registro abierto con trial gratis (LOKAL LINKS): cualquier usuario
      // autenticado sin tienda propia puede crear la suya directo, sin
      // invitación ni Mercado Pago. Vence a los TRIAL_DAYS días — el dueño
      // ve el vencimiento en su panel (StoreApp ya lee suscripcion.vence).
      if (body.trial === true) {
        const TRIAL_DAYS = 14;
        const payload = buildStorePayload(body, user, `trial-${Date.now()}`, tiendas);
        payload.suscripcion = {
          plan: 'trial',
          vence: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(),
        };
        tiendas.push(payload);
        await writeTiendas(tiendas);
        await auditLog({
          accion: 'tienda.creada',
          entidadTipo: 'tienda',
          entidadId: payload.id,
          actorUid: user.uid,
          actorEmail: user.email,
          actorRol: 'emprendimiento',
          datosDespues: { nombre: payload.nombre, plan: 'trial' },
          meta: { metodo: 'trial-abierto', trialDays: TRIAL_DAYS },
        });
        return jsonResponse(event, 201, sanitizeOwnerTienda(payload), HTTP_OPTIONS);
      }

      const token = sanitizeText(body.token, { max: 160, multiline: false });
      const sessionId = sanitizeText(body.sessionId, { max: 160, multiline: false });

      if (!token || !sessionId) {
        throw new HttpError(400, 'token y sessionId son requeridos');
      }

      const baseUrl = process.env.URL || 'http://localhost:8888';
      let inviteCheck;

      try {
        const checkRes = await fetch(
          `${baseUrl}/.netlify/functions/invites?token=${encodeURIComponent(token)}&sessionId=${encodeURIComponent(sessionId)}`
        );
        inviteCheck = await checkRes.json();
        if (!checkRes.ok) {
          return jsonResponse(
            event,
            checkRes.status,
            { error: inviteCheck.error || 'Token invalido' },
            HTTP_OPTIONS
          );
        }
      } catch {
        throw new HttpError(500, 'No se pudo verificar el token');
      }

      if (tiendas.some((item) => item.token === token)) {
        throw new HttpError(409, 'Este link ya fue utilizado para registrar una tienda');
      }

      const nueva = buildStorePayload(body, user, token, tiendas);
      // Link de invitación = "visto bueno" previo del admin: la tienda queda
      // aprobada (verificada) de entrada, sin esperar revisión manual.
      nueva.verificada = true;
      nueva.suscripcion = { plan: 'invitado', vence: null };
      tiendas.push(nueva);
      await writeTiendas(tiendas);

      await auditLog({
        accion: 'tienda.creada',
        entidadTipo: 'tienda',
        entidadId: nueva.id,
        actorUid: user.uid,
        actorEmail: user.email,
        actorRol: user.isAdmin ? 'admin' : 'emprendimiento',
        datosDespues: { nombre: nueva.nombre, plan: nueva.suscripcion?.plan || 'sin_plan' },
        meta: { metodo: 'invite', token },
      });

      try {
        await fetch(`${baseUrl}/.netlify/functions/invites`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, sessionId, tiendaId: nueva.id }),
        });
      } catch {
        // La tienda ya quedó creada y el token seguirá expirando por TTL.
      }

      return jsonResponse(event, 201, sanitizeOwnerTienda(nueva), HTTP_OPTIONS);
    }

    if (event.httpMethod === 'PATCH') {
      const user = await requireAuth(event);
      const body = parseJsonBody(event);
      const { id } = body;

      if (!id) {
        throw new HttpError(400, 'id requerido');
      }

      const { data: tiendas, etag } = await readTiendasWithEtag();
      const idx = tiendas.findIndex((item) => String(item.id) === String(id));
      if (idx === -1) {
        return jsonResponse(event, 404, { error: 'No encontrada' }, HTTP_OPTIONS);
      }

      ensureStoreOwner(user, tiendas[idx]);

      const update = {};

      if ('nombre' in body) update.nombre = requireText(body.nombre, { field: 'nombre', min: 2, max: 120, multiline: false });
      if ('rubros' in body) update.rubros = sanitizeStringArray(body.rubros, { maxItems: 10, maxItemLength: 48 });
      if ('descripcion' in body) update.descripcion = sanitizeText(body.descripcion, { max: 1500 });
      if ('direccion' in body) update.direccion = sanitizeText(body.direccion, { max: 240 });
      if ('ciudad' in body) update.ciudad = sanitizeText(body.ciudad, { max: 80, multiline: false });
      if ('horarios' in body) update.horarios = sanitizePlainObject(body.horarios, { maxKeys: 14, maxStringLength: 32 });
      if ('telefono' in body) update.telefono = sanitizePhone(body.telefono);
      if ('website' in body) update.website = body.website ? sanitizeUrl(body.website) : '';
      if ('foto' in body) update.foto = sanitizeMediaUrls(body.foto ? [body.foto] : [], { maxItems: 1 })[0] || null;
      if ('galeria' in body) update.galeria = sanitizeMediaUrls(body.galeria, { maxItems: 6 });
      if ('emailContacto' in body) {
        update.emailContacto = body.emailContacto ? sanitizeEmail(body.emailContacto, { field: 'emailContacto' }) : '';
      }
      if ('tagline' in body) update.tagline = sanitizeText(body.tagline, { max: 160, multiline: false });
      if ('whatsapp' in body) update.whatsapp = sanitizePhone(body.whatsapp);
      if ('instagram' in body) update.instagram = sanitizeText(body.instagram, { max: 60, multiline: false });
      if ('lat' in body) update.lat = typeof body.lat === 'number' ? body.lat : parseFloat(body.lat) || null;
      if ('lng' in body) update.lng = typeof body.lng === 'number' ? body.lng : parseFloat(body.lng) || null;
      if ('slug' in body) {
        const rawSlug = sanitizeText(body.slug, { max: 60, multiline: false });
        const candidate = rawSlug ? generateSlug(rawSlug) : generateSlug(tiendas[idx].nombre);
        const taken = tiendas.some((t, i) => i !== idx && t.slug === candidate);
        if (taken) throw new HttpError(409, 'Ese slug ya está en uso, elegí otro');
        update.slug = candidate;
      }

      if ('pagina' in body && body.pagina && typeof body.pagina === 'object') {
        const p = body.pagina;
        update.pagina = {
          ...(tiendas[idx].pagina || {}),
          ...(p.template ? { template: sanitizeText(String(p.template), { max: 32, multiline: false }) } : {}),
          ...(p.color ? { color: /^#[0-9a-fA-F]{6}$/.test(p.color) ? p.color : undefined } : {}),
          ...('modoOscuro' in p ? { modoOscuro: !!p.modoOscuro } : {}),
          ...(p.secciones && typeof p.secciones === 'object' ? { secciones: sanitizePlainObject(p.secciones, { maxKeys: 20, maxStringLength: 64 }) } : {}),
        };
      }
      if (user.isAdmin && 'activa' in body) update.activa = !!body.activa;
      if (user.isAdmin && 'verificada' in body) update.verificada = !!body.verificada;

      const datosAntes = { ...tiendas[idx] };
      tiendas[idx] = {
        ...tiendas[idx],
        ...update,
        updatedAt: new Date().toISOString(),
      };

      await writeTiendasSafe(tiendas, etag);
      await auditLog({
        accion: 'tienda.actualizada',
        entidadTipo: 'tienda',
        entidadId: id,
        actorUid: user.uid,
        actorEmail: user.email,
        actorRol: user.isAdmin ? 'admin' : 'empresa',
        datosAntes: { nombre: datosAntes.nombre, activa: datosAntes.activa, verificada: datosAntes.verificada },
        datosDespues: { nombre: tiendas[idx].nombre, activa: tiendas[idx].activa, verificada: tiendas[idx].verificada },
        meta: { campos: Object.keys(update) },
      });
      return jsonResponse(event, 200, sanitizeOwnerTienda(tiendas[idx]), HTTP_OPTIONS);
    }

    return jsonResponse(event, 405, { error: 'Metodo no permitido' }, HTTP_OPTIONS);
  } catch (error) {
    return handleError(event, error);
  }
};
