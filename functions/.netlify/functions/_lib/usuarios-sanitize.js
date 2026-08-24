// _lib/usuarios-sanitize.js — lógica pura de armado del payload de usuario
// común, separada de usuarios.js para poder testearla sin R2/auth/Request
// real (mismo criterio que _lib/ofertas-sanitize.js).
import { sanitizeText } from './validation.js';

export function buildUsuarioPayload(body, user) {
  return {
    uid: user.uid,
    email: user.email,
    nombre: sanitizeText(user.name || body.nombre || '', { max: 120, multiline: false }),
    foto: user.picture || null,
    role: 'usuario',
    zona: sanitizeText(body.zona, { max: 80, multiline: false }),
    creadoEn: new Date().toISOString(),
  };
}
