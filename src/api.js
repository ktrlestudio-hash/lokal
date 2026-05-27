import { auth } from './firebase';

export async function apiFetch(input, init = {}) {
  const { authRequired = false, headers, ...rest } = init;
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  if (authRequired && !token) {
    throw new Error('Debes iniciar sesion');
  }

  const finalHeaders = new Headers(headers || {});
  if (token) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, {
    ...rest,
    headers: finalHeaders,
  });
}
