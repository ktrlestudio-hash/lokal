// functions/_middleware.js — Cloudflare Pages equivalente a las 4 Netlify
// Edge Functions (oferta-og.js, tienda-og.js, carrito-og.js, csp-headers.js).
//
// Por qué UN SOLO archivo y no 4: Netlify permite declarar varias Edge
// Functions con distintos `path` en netlify.toml, cada una corriendo
// independiente. Cloudflare Pages Functions resuelve el equivalente con
// `functions/_middleware.js` — un único archivo que intercepta TODA
// request (incluidas las que no matchean ninguna function y caen al
// fallback de _redirects hacia index.html, que es justo donde viven
// /:tienda/o/:oferta, /:tienda/c/:carrito y /:slug — ninguna tiene su
// propia Pages Function, la SPA las resuelve del lado del cliente). No hay
// convención de Pages para múltiples middlewares con distintos `path`
// estilo Netlify, así que la lógica de las 4 Edge Functions se combina acá
// en secuencia: primero decide el body/status (OG para crawler o pasar a
// next() para humano), y al final SIEMPRE aplica el CSP sobre la
// respuesta que haya resultado — igual que csp-headers.js hacía sobre
// CUALQUIER response, sin importar de dónde viniera.
const CRAWLER_RE = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|Slackbot|TelegramBot|Discordbot|LinkedInBot|Pinterest|redditbot|Googlebot|bingbot|Applebot|SkypeUriPreview|vkShare|Embedly|Iframely/i;

const RESERVED_TIENDA = new Set([
  'admin', 'terminos-y-condiciones', 'politica-de-privacidad', 'condiciones-para-comercios', '',
  'sw.js', 'theme-init.js', 'site.webmanifest', 'favicon.svg',
]);

const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtPeso = (n) => (typeof n === 'number' ? `$${n.toLocaleString('es-AR')}` : '');

function paginaOG({ title, desc, image, url, brand = '#00B8D9' }) {
  return `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="${esc(brand)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta property="og:url" content="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LOKAL">
<meta name="twitter:card" content="summary_large_image">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ''}
</head>
<body style="margin:0;background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center">
<a href="${esc(url)}" style="color:#fff">Ver más →</a>
</body></html>`;
}

function htmlResp(html, code = 200) {
  return new Response(html, { status: code, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}

function esVigenteOferta(o, now = Date.now()) {
  if (!o || o.visible === false) return false;
  const pub = o.publishAt ? new Date(o.publishAt).getTime() : 0;
  const exp = o.expireAt ? new Date(o.expireAt).getTime() : Infinity;
  return now >= pub && now <= exp;
}

async function ogOferta(origin, segs) {
  const tiendaSlug = segs[0];
  const ofertaSlug = segs[2];
  const pageUrl = `${origin}/${encodeURIComponent(tiendaSlug)}/o/${encodeURIComponent(ofertaSlug)}`;
  try {
    const oRes = await fetch(`${origin}/.netlify/functions/ofertas?slug=${encodeURIComponent(tiendaSlug)}&ofertaSlug=${encodeURIComponent(ofertaSlug)}`);
    const data = oRes.ok ? await oRes.json() : null;
    const oferta = data?.oferta || null;
    const tienda = data?.tienda || null;
    const nombreTienda = tienda?.nombre || 'LOKAL';
    const brand = tienda?.pagina?.color || '#00B8D9';

    if (!oferta || !oferta.id || !esVigenteOferta(oferta)) {
      return htmlResp(paginaOG({
        title: `Oferta finalizada — ${nombreTienda}`,
        desc: `Esta oferta ya finalizó. Mirá las promociones vigentes de ${nombreTienda}.`,
        image: null, url: `${origin}/${encodeURIComponent(tiendaSlug)}`, brand,
      }));
    }

    return htmlResp(paginaOG({
      title: `${oferta.nombre} — ${nombreTienda}`,
      desc: oferta.descripcion?.trim() || `Oferta de ${nombreTienda}. Miralo y compartilo.`,
      image: oferta.ogImageUrl || oferta.thumbUrl || oferta.imageUrl,
      url: pageUrl, brand,
    }));
  } catch (_) {
    return htmlResp(paginaOG({ title: 'Oferta — LOKAL', desc: 'Ofertas y promociones.', image: null, url: origin }));
  }
}

// Mismo shape/campos (publishAt/expireAt/visible) que una oferta — reusa
// esVigenteOferta tal cual, sin duplicar la lógica de vigencia.
const esVigenteProducto = esVigenteOferta;

async function ogProducto(origin, segs) {
  const tiendaSlug = segs[0];
  const productoSlug = segs[2];
  const pageUrl = `${origin}/${encodeURIComponent(tiendaSlug)}/p/${encodeURIComponent(productoSlug)}`;
  try {
    const pRes = await fetch(`${origin}/.netlify/functions/productos?slug=${encodeURIComponent(tiendaSlug)}&productoSlug=${encodeURIComponent(productoSlug)}`);
    const data = pRes.ok ? await pRes.json() : null;
    const producto = data?.producto || null;
    const tienda = data?.tienda || null;
    const nombreTienda = tienda?.nombre || 'LOKAL';
    const brand = tienda?.pagina?.color || '#00B8D9';

    if (!producto || !producto.id || !esVigenteProducto(producto)) {
      return htmlResp(paginaOG({
        title: `Producto no disponible — ${nombreTienda}`,
        desc: `Este producto ya no está disponible. Mirá el catálogo de ${nombreTienda}.`,
        image: null, url: `${origin}/${encodeURIComponent(tiendaSlug)}`, brand,
      }));
    }

    const nombreProducto = producto.nombre || producto.titulo || 'Producto';
    const precio = typeof producto.precio === 'number' ? ` — ${fmtPeso(producto.precio)}` : '';

    return htmlResp(paginaOG({
      title: `${nombreProducto} — ${nombreTienda}`,
      desc: (producto.descripcion?.trim() || `Producto de ${nombreTienda}.`) + precio,
      image: producto.ogImageUrl || producto.thumbUrl || producto.imageUrl || producto.foto,
      url: pageUrl, brand,
    }));
  } catch (_) {
    return htmlResp(paginaOG({ title: 'Producto — LOKAL', desc: 'Catálogo de productos.', image: null, url: origin }));
  }
}

async function ogCarrito(origin, segs) {
  const tiendaSlug = segs[0];
  const carritoSlug = segs[2];
  const pageUrl = `${origin}/${encodeURIComponent(tiendaSlug)}/c/${encodeURIComponent(carritoSlug)}`;
  try {
    const res = await fetch(`${origin}/.netlify/functions/carrito?tiendaSlug=${encodeURIComponent(tiendaSlug)}&carritoSlug=${encodeURIComponent(carritoSlug)}`);
    const data = res.ok ? await res.json() : null;
    const carrito = data?.carrito || null;
    const tienda = data?.tienda || null;
    const nombreTienda = tienda?.nombre || 'LOKAL';
    const brand = tienda?.pagina?.color || '#00B8D9';

    if (!carrito) {
      return htmlResp(paginaOG({
        title: `Pedido no encontrado — ${nombreTienda}`,
        desc: `Este link de pedido no es válido. Mirá el catálogo de ${nombreTienda}.`,
        image: null, url: `${origin}/${encodeURIComponent(tiendaSlug)}`, brand,
      }), 404);
    }

    const cantidadItems = carrito.items.reduce((acc, i) => acc + i.qty, 0);
    const clienteNombre = carrito.cliente?.nombre;
    const title = clienteNombre
      ? `Pedido de ${clienteNombre} — ${nombreTienda}`
      : `Nuevo pedido — ${nombreTienda}`;
    const desc = `${cantidadItems} producto${cantidadItems === 1 ? '' : 's'} · Total ${fmtPeso(carrito.total)}`;

    return htmlResp(paginaOG({ title, desc, url: pageUrl, brand }));
  } catch (_) {
    return htmlResp(paginaOG({ title: 'Pedido — LOKAL', desc: 'Detalle de un pedido.', url: origin }));
  }
}

async function ogTienda(origin, slug) {
  const pageUrl = `${origin}/${encodeURIComponent(slug)}`;
  try {
    const tRes = await fetch(`${origin}/.netlify/functions/tiendas-crud?slug=${encodeURIComponent(slug)}`);
    const tienda = tRes.ok ? await tRes.json() : null;

    if (!tienda || !tienda.id) {
      return htmlResp(paginaOG({
        title: 'LOKAL',
        desc: 'Descubrí negocios locales en LOKAL.',
        image: null, url: origin,
      }));
    }

    const brand = tienda.pagina?.color || '#00B8D9';
    const image = tienda.foto || tienda.fotoPortada || tienda.galeria?.[0] || tienda.logo || null;

    return htmlResp(paginaOG({
      title: tienda.nombre || 'LOKAL',
      desc: tienda.descripcion?.trim() || `Mirá ${tienda.nombre || 'esta tienda'} en LOKAL.`,
      image, url: pageUrl, brand,
    }));
  } catch (_) {
    return htmlResp(paginaOG({ title: 'LOKAL', desc: 'Descubrí negocios locales en LOKAL.', image: null, url: origin }));
  }
}

const CSP_PROD = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' https: data: blob:",
  "media-src 'self' https: data: blob:",
  // pub-e003c6645fb242638e406dffe98c7bc5.r2.dev: bucket público de R2
  // (LOKAL_BUCKET / R2_PUBLIC_URL, ver upload.js) donde se suben todas
  // las fotos de producto/oferta/tienda. img-src ya tenía "https:"
  // genérico, así que un <img src> directo cargaba bien — pero Leaflet
  // (el mapa) precarga los íconos de marcador vía fetch()/Image()
  // interceptado por el Service Worker, y ESE tipo de request cae bajo
  // connect-src, no img-src. Sin el dominio acá, el navegador bloqueaba
  // el fetch antes de que llegara a la red — el bug quedó tapado mientras
  // las fotos vivían embebidas como base64 en el JSON (nunca hacían un
  // fetch de red real) y recién se hizo visible al limpiar esos datos.
  "connect-src 'self' https://*.googleapis.com https://www.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.firebaseapp.com https://*.web.app https://accounts.google.com https://apis.google.com https://api.mercadopago.com https://nominatim.openstreetmap.org https://router.project-osrm.org https://*.basemaps.cartocdn.com https://api.maptiler.com https://fonts.googleapis.com https://fonts.gstatic.com https://lh3.googleusercontent.com https://images.unsplash.com https://pub-e003c6645fb242638e406dffe98c7bc5.r2.dev",
  "frame-src 'self' https://*.firebaseapp.com https://*.web.app https://*.google.com https://accounts.google.com https://*.mercadopago.com https://*.mercadopago.com.ar https://*.mercadopago.com.mx https://*.mercadolibre.com",
  "form-action 'self' https://*.mercadopago.com https://*.mercadopago.com.ar https://*.mercadopago.com.mx",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join('; ');

function withCsp(response, env) {
  // env.CF_PAGES_BRANCH: 'main' en producción, el nombre de la branch en
  // preview deploys; ausente en `wrangler pages dev` local. Mismo criterio
  // que csp-headers.js (context.deploy?.context !== 'dev'), adaptado a las
  // env vars que Cloudflare Pages sí expone.
  const isLocalDev = !env?.CF_PAGES_BRANCH;
  if (isLocalDev) return response;

  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', CSP_PROD);
  return new Response(response.body, { status: response.status, headers });
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const ua = request.headers.get('user-agent') || '';
  const segs = url.pathname.replace(/^\/+|\/+$/g, '').split('/');

  let response;

  if (CRAWLER_RE.test(ua)) {
    // /:tienda/o/:oferta — 3 segmentos, medio "o".
    if (segs.length === 3 && segs[1] === 'o' && segs[0] && segs[2]) {
      response = await ogOferta(url.origin, segs);
    // /:tienda/p/:producto — 3 segmentos, medio "p". Detalle de UN producto
    // de catálogo (distinto de /o/, que es una oferta puntual). Nunca
    // colisiona con /o/ o /c/ (medios distintos).
    } else if (segs.length === 3 && segs[1] === 'p' && segs[0] && segs[2]) {
      response = await ogProducto(url.origin, segs);
    // /:tienda/c/:carrito — 3 segmentos, medio "c". Nunca colisiona con
    // /:tienda/o/:oferta (medios distintos).
    } else if (segs.length === 3 && segs[1] === 'c' && segs[0] && segs[2]) {
      response = await ogCarrito(url.origin, segs);
    // /:slug — un solo segmento, no reservado. Debe evaluarse DESPUÉS de
    // los casos de 3 segmentos (mismo orden que netlify.toml: oferta-og y
    // carrito-og antes que tienda-og), aunque acá el chequeo de longitud
    // ya los separa sin ambigüedad.
    } else if (segs.length === 1 && !RESERVED_TIENDA.has(segs[0])) {
      response = await ogTienda(url.origin, segs[0]);
    }
  }

  // Humano, o crawler en una ruta que no matchea ningún patrón de OG
  // (admin, legales, assets) — pasa a next(): sirve la function/asset
  // normal, o cae al fallback de _redirects (index.html) para que la SPA
  // resuelva la ruta del lado del cliente.
  if (!response) response = await next();

  return withCsp(response, env);
}
