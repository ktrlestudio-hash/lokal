// carrito-og.js — Edge Function para /:tienda/c/:carrito.
//
// Mismo patrón que oferta-og.js:
//   • CRAWLER (WhatsApp/FB/…): HTML mínimo con meta tags OG del PEDIDO —
//     el vendedor ve "Pedido de Juan — 3 productos — $4.500" en la preview
//     del link, antes de siquiera abrirlo. Es la pieza que reemplaza al
//     mensaje de texto plano: el link YA dice de qué se trata.
//   • HUMANO: context.next() → SPA React monta la vista del pedido en la
//     misma URL (ver src/tienda-publica/CarritoIndividual.jsx).
//
// Corre en Deno (edge runtime), sin fs/@aws-sdk — pide los datos a
// carrito.js vía fetch interno, igual que oferta-og.js pide a ofertas.js.

const CRAWLER_RE = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|Slackbot|TelegramBot|Discordbot|LinkedInBot|Pinterest|redditbot|Googlebot|bingbot|Applebot|SkypeUriPreview|vkShare|Embedly|Iframely/i;

const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtPeso = (n) => typeof n === 'number' ? `$${n.toLocaleString('es-AR')}` : '';

function paginaOG({ title, desc, url, brand = '#00B8D9' }) {
  return `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="${esc(brand)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LOKAL">
<meta name="twitter:card" content="summary">
</head>
<body style="margin:0;background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center">
<a href="${esc(url)}" style="color:#fff">Ver pedido →</a>
</body></html>`;
}

export default async function handler(request, context) {
  const ua = request.headers.get('user-agent') || '';
  if (!CRAWLER_RE.test(ua)) return context.next();

  const url = new URL(request.url);
  const segs = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
  // /:tienda/c/:carrito
  const tiendaSlug = segs[0];
  const carritoSlug = segs[2];
  const origin = url.origin;
  const htmlResp = (html, code = 200) => new Response(html, { status: code, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });

  try {
    const res = await fetch(`${origin}/.netlify/functions/carrito?tiendaSlug=${encodeURIComponent(tiendaSlug)}&carritoSlug=${encodeURIComponent(carritoSlug)}`);
    const data = res.ok ? await res.json() : null;
    const carrito = data?.carrito || null;
    const tienda = data?.tienda || null;
    const nombreTienda = tienda?.nombre || 'LOKAL';
    const brand = tienda?.pagina?.color || '#00B8D9';
    const pageUrl = `${origin}/${encodeURIComponent(tiendaSlug)}/c/${encodeURIComponent(carritoSlug)}`;

    if (!carrito) {
      return htmlResp(paginaOG({
        title: `Pedido no encontrado — ${nombreTienda}`,
        desc: `Este link de pedido no es válido. Mirá el catálogo de ${nombreTienda}.`,
        url: `${origin}/${encodeURIComponent(tiendaSlug)}`, brand,
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

export const config = { path: '/:tienda/c/:carrito' };
