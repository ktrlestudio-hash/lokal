// usuarios.js — perfil de "usuario común" (rol no-tienda) + detección de rol
// post-login. Mismo patrón que tiendas-crud.js: auth por Firebase idToken,
// store propio en R2 protegido con ETag.
//
// La pieza central es GET ?whoami=1: dado el token de la sesión recién
// logueada, resuelve en una sola llamada "¿esta cuenta ya es una tienda, ya
// es un usuario común, o es la primera vez que este correo entra?" — el
// frontend (AdminLogin/futuro flujo de Home) usa esa respuesta para decidir
// a dónde navegar sin tener que adivinar ni mantener su propia lógica de
// detección. Busca primero en tiendas.json (reusa findTiendaByOwnerUid, ya
// existente) y recién si no hay tienda busca en usuarios.json — refleja la
// misma prioridad "tienda gana" que ya tenía LOKAL Global (ver memoria
// lokal-links-rol-usuario-comun-login).
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText, sanitizeMediaUrls } from './_lib/validation.js';
import { findTiendaByOwnerUid, readTiendas } from './_lib/tiendas-store.js';
import {
  ROLES_CONOCIDOS,
  ensureSelfUsuario,
  findUsuarioByUid,
  readUsuarios,
  readUsuariosWithEtag,
  writeUsuariosSafe,
} from './_lib/usuarios-store.js';
import { buildUsuarioPayload } from './_lib/usuarios-sanitize.js';
import { auditLog } from './_lib/audit-store.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, POST, PATCH, OPTIONS',
};

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestGet({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const { searchParams } = new URL(request.url);

    if (searchParams.get('whoami') === '1') {
      const user = await requireAuth(event, env);

      const tiendas = await readTiendas(bucket);
      const tienda = findTiendaByOwnerUid(tiendas, user.uid);
      if (tienda) {
        return jsonResponse(event, 200, { rol: 'tienda', tiendaId: tienda.id, tiendaSlug: tienda.slug }, { ...HTTP_OPTIONS, env });
      }

      const usuarios = await readUsuarios(bucket);
      const usuario = findUsuarioByUid(usuarios, user.uid);
      if (usuario) {
        return jsonResponse(event, 200, { rol: 'usuario', usuario }, { ...HTTP_OPTIONS, env });
      }

      // Ni tienda ni perfil de usuario — primera vez que este correo entra.
      // El frontend debe ofrecer "¿crear tienda o cuenta de usuario?".
      return jsonResponse(event, 200, { rol: null, nuevo: true }, { ...HTTP_OPTIONS, env });
    }

    // GET del propio perfil por uid — para refrescar datos ya sabiendo que
    // es un usuario común (evita repetir la consulta a tiendas.json que
    // whoami ya hizo una vez al loguear).
    const uid = searchParams.get('uid');
    if (uid) {
      const user = await requireAuth(event, env);
      ensureSelfUsuario(user, { uid }, 'No autorizado para consultar este perfil');
      const usuarios = await readUsuarios(bucket);
      const usuario = findUsuarioByUid(usuarios, uid);
      if (!usuario) return jsonResponse(event, 404, { error: 'No encontrado' }, { ...HTTP_OPTIONS, env });
      return jsonResponse(event, 200, usuario, { ...HTTP_OPTIONS, env });
    }

    throw new HttpError(400, 'whoami=1 o uid son requeridos');
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

// Crea el perfil de usuario común — segundo paso del login cuando whoami
// devolvió { nuevo: true } y la persona eligió "cuenta de usuario" (no
// tienda; crear tienda sigue siendo POST /tiendas-crud, sin cambios).
export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    const body = await parseJsonBody(event);

    const tiendas = await readTiendas(bucket);
    if (findTiendaByOwnerUid(tiendas, user.uid)) {
      throw new HttpError(409, 'Esta cuenta ya tiene una tienda registrada');
    }

    const { data: usuarios, etag } = await readUsuariosWithEtag(bucket);
    if (findUsuarioByUid(usuarios, user.uid)) {
      throw new HttpError(409, 'Esta cuenta ya tiene un perfil de usuario');
    }

    const nuevo = buildUsuarioPayload(body, user);
    usuarios.push(nuevo);
    await writeUsuariosSafe(bucket, usuarios, etag);

    await auditLog(bucket, {
      accion: 'usuario.creado',
      entidadTipo: 'usuario',
      entidadId: nuevo.uid,
      actorUid: user.uid,
      actorEmail: user.email,
      actorRol: 'usuario',
      datosDespues: { nombre: nuevo.nombre },
    });

    return jsonResponse(event, 201, nuevo, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}

export async function onRequestPatch({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const user = await requireAuth(event, env);
    const body = await parseJsonBody(event);
    const { uid } = body;
    if (!uid) throw new HttpError(400, 'uid requerido');

    const { data: usuarios, etag } = await readUsuariosWithEtag(bucket);
    const idx = usuarios.findIndex((item) => item.uid === uid);
    if (idx === -1) return jsonResponse(event, 404, { error: 'No encontrado' }, { ...HTTP_OPTIONS, env });

    ensureSelfUsuario(user, usuarios[idx]);

    const update = {};
    if ('nombre' in body) update.nombre = sanitizeText(body.nombre, { max: 120, multiline: false });
    if ('zona' in body) update.zona = sanitizeText(body.zona, { max: 80, multiline: false });
    if ('foto' in body) update.foto = sanitizeMediaUrls(body.foto ? [body.foto] : [], { maxItems: 1 })[0] || null;
    // role NO se edita por PATCH — cambiar de "usuario" a "tienda" pasa por
    // POST /tiendas-crud (que ya valida "una tienda por uid"), no por acá.
    // Mantenerlo fuera de este endpoint evita que un PATCH arbitrario mute
    // el rol de la cuenta.
    if (user.isAdmin && 'role' in body && ROLES_CONOCIDOS.includes(body.role)) update.role = body.role;

    usuarios[idx] = { ...usuarios[idx], ...update, updatedAt: new Date().toISOString() };
    await writeUsuariosSafe(bucket, usuarios, etag);

    return jsonResponse(event, 200, usuarios[idx], { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
