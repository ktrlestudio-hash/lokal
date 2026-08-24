// _lib/usuarios-store.js — perfil de "usuario común" (rol no-tienda), mismo
// patrón que tiendas-store.js: JSON en R2 con lectura/escritura protegida
// por ETag (safeRead/safeWrite, ver r2-safe-write.js).
//
// Colección PROPIA, separada de tiendas.json — no es "el mismo documento
// con más campos". Cada feature futura de usuario común (favoritos, tiendas
// seguidas, carrito propio, demandas) es a su vez OTRA colección chica que
// referencia este uid, no un array embebido acá adentro — así tocar un
// favorito no reescribe todo el perfil, y cada colección puede paginarse/
// cachearse por separado a medida que crece. Ver memoria del proyecto
// "lokal-links-criterio-arquitectura-expandible".
import { HttpError } from './http.js';
import { safeRead, safeWrite } from './r2-safe-write.js';

const DATA_KEY = 'data/usuarios.json';

// Roles conocidos hoy — lista abierta, no un enum de tipo cerrado: agregar
// un rol nuevo (ej. "repartidor", "moderador") es sumar un string acá, no
// tocar el shape del documento ni migrar datos existentes.
export const ROLES_CONOCIDOS = ['usuario', 'tienda'];

export async function readUsuarios(bucket) {
  const { data } = await safeRead(bucket, DATA_KEY, []);
  return data;
}

export async function readUsuariosWithEtag(bucket) {
  return safeRead(bucket, DATA_KEY, []);
}

export async function writeUsuariosSafe(bucket, data, etag) {
  await safeWrite(bucket, DATA_KEY, data, etag);
}

export function findUsuarioByUid(usuarios, uid) {
  return usuarios.find((item) => item.uid === uid) || null;
}

export function sanitizeOwnerUsuario(usuario) {
  return usuario;
}

export function ensureSelfUsuario(user, usuario, message = 'No autorizado para operar sobre este perfil') {
  if (!usuario) throw new HttpError(404, 'Perfil no encontrado');
  if (!user?.isAdmin && usuario.uid !== user?.uid) throw new HttpError(403, message);
}
