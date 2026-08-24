import { describe, expect, it } from 'vitest';
import { buildUsuarioPayload } from '../_lib/usuarios-sanitize.js';

const USER = { uid: 'uid_1', email: 'ana@ejemplo.com', name: 'Ana Pérez', picture: 'https://foto.com/ana.jpg' };

describe('buildUsuarioPayload', () => {
  it('usa el nombre/foto de la sesión de Google, no el body', () => {
    const payload = buildUsuarioPayload({ nombre: 'Otro nombre' }, USER);
    expect(payload.nombre).toBe('Ana Pérez');
    expect(payload.foto).toBe('https://foto.com/ana.jpg');
    expect(payload.uid).toBe('uid_1');
    expect(payload.email).toBe('ana@ejemplo.com');
  });

  it('siempre crea con role "usuario", sin importar qué venga en el body', () => {
    const payload = buildUsuarioPayload({ role: 'admin' }, USER);
    expect(payload.role).toBe('usuario');
  });

  it('cae al nombre del body solo si la sesión de Google no trae name', () => {
    const userSinNombre = { ...USER, name: '' };
    const payload = buildUsuarioPayload({ nombre: 'Nombre elegido' }, userSinNombre);
    expect(payload.nombre).toBe('Nombre elegido');
  });

  it('sanitiza zona (recorta, sin multilinea)', () => {
    const payload = buildUsuarioPayload({ zona: '  Centro\nSur  ' }, USER);
    expect(payload.zona).toBe('Centro Sur');
  });

  it('foto queda null si la sesión de Google no trae picture', () => {
    const userSinFoto = { ...USER, picture: null };
    const payload = buildUsuarioPayload({}, userSinFoto);
    expect(payload.foto).toBeNull();
  });

  it('creadoEn es un ISO string válido', () => {
    const payload = buildUsuarioPayload({}, USER);
    expect(() => new Date(payload.creadoEn).toISOString()).not.toThrow();
  });
});
