// csp-headers.js — agrega Content-Security-Policy estricto SOLO en
// producción real (o cualquier contexto que no sea 'dev' local).
//
// Por qué una Edge Function y no un [[headers]] estático en netlify.toml:
// esta función chequea el contexto de deploy real en runtime, así nunca
// depende de que alguien recuerde comentar/descomentar el CSP a mano antes
// de un deploy.
//
// script-src usa 'unsafe-inline' (no hashes fijos): index.html ya NO tiene
// ningún <script> inline propio (ver theme-init.js, externalizado a
// propósito) — así 'unsafe-inline' cubre el script inline DINÁMICO que
// Google Identity Services (FedCM/One Tap) inyecta durante
// signInWithPopup(), cuyo contenido varía y ningún hash fijo podría cubrir
// de antemano. Si algún día se agrega un <script> inline propio de nuevo,
// usar hashes ahí anularía 'unsafe-inline' por completo (la spec de CSP lo
// ignora si hay al menos un hash/nonce en la directiva) — mejor
// externalizarlo como .js aparte, como ya se hizo acá.
const CSP_PROD = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com",
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
