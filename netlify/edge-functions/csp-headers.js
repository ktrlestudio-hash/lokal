// csp-headers.js — agrega Content-Security-Policy estricto SOLO en
// producción real (o cualquier contexto que no sea 'dev' local).
//
// Por qué una Edge Function y no un [[headers]] estático en netlify.toml:
// script-src con hashes fijos de los <script> inline de index.html se
// rompe bajo `netlify dev` — Vite inyecta ahí su script de HMR con
// contenido (y por lo tanto hash) distinto en cada arranque, que ningún
// hash hardcodeado puede cubrir de antemano. Esta función chequea el
// contexto de deploy real en runtime, así nunca depende de que alguien
// recuerde comentar/descomentar el CSP a mano antes de un deploy.
//
// Pendiente real (deuda técnica, no resuelta hoy): los hashes de script-src
// para producción están hardcodeados abajo — hay que recalcularlos si se
// edita cualquier <script> inline de index.html (ver ese archivo). La
// solución de fondo sería un nonce dinámico o externalizar esos scripts.
const CSP_PROD = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'sha256-8D/Yj9xkdCf7ek10BdGWbgO28Lf9wkLqNER/Batlsk0=' 'sha256-Fzfeqzuxec/8RoIqnby/qzWnO3etbTjheOrJQRuKKmo=' https://apis.google.com https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' https: data: blob:",
  "media-src 'self' https: data: blob:",
  "connect-src 'self' https://*.googleapis.com https://www.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseapp.com https://*.web.app https://accounts.google.com https://apis.google.com https://api.mercadopago.com https://nominatim.openstreetmap.org https://router.project-osrm.org https://*.basemaps.cartocdn.com https://api.maptiler.com https://fonts.googleapis.com https://fonts.gstatic.com https://lh3.googleusercontent.com https://images.unsplash.com",
  "frame-src 'self' https://*.firebaseapp.com https://*.web.app https://*.google.com https://accounts.google.com https://*.mercadopago.com https://*.mercadopago.com.ar https://*.mercadopago.com.mx https://*.mercadolibre.com",
  "form-action 'self' https://*.mercadopago.com https://*.mercadopago.com.ar https://*.mercadopago.com.mx",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join('; ');

export default async function handler(request, context) {
  const response = await context.next();

  // context.deploy?.context: 'production' | 'deploy-preview' | 'branch-deploy'
  // en Netlify real; undefined/'dev' bajo `netlify dev` local.
  const deployContext = context.deploy?.context;
  const isLocalDev = !deployContext || deployContext === 'dev';

  if (isLocalDev) return response;

  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', CSP_PROD);
  return new Response(response.body, { status: response.status, headers });
}

export const config = { path: '/*' };
