// oferta-og.js — Edge Function para /:tienda/o/:oferta.
//
// Patrón canónico "OG solo para crawlers" en Netlify:
//   • CRAWLER (WhatsApp/FB/Twitter/…): responde HTML mínimo con los meta tags
//     og:image/og:title de ESA oferta. Es lo único que el bot lee.
//   • HUMANO (navegador): context.next() → deja pasar a la SPA React, que
//     monta OfertaIndividual en la MISMA URL. Sin redirect, sin loop.
//
// Corre en Deno (edge runtime): sin @aws-sdk ni fs. Los datos los pide a las
// Netlify Functions existentes (tiendas-crud, ofertas) vía fetch interno.

const CRAWLER_RE = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|Slackbot|TelegramBot|Discordbot|LinkedInBot|Pinterest|redditbot|Googlebot|bingbot|Applebot|SkypeUriPreview|vkShare|Embedly|Iframely/i;

const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
<a href="${esc(url)}" style="color:#fff">Ver oferta →</a>
</body></html>`;
}

function esVigente(o, now = Date.now()) {
  if (!o || o.visible === false) return false;
  const pub = o.publishAt ? new Date(o.publishAt).getTime() : 0;
  const exp = o.expireAt ? new Date(o.expireAt).getTime() : Infinity;
  return now >= pub && now <= exp;
}

export default async function handler(request, context) {
  const ua = request.headers.get('user-agent') || '';
  // Humano → dejar pasar a la SPA (React monta la vista en la misma URL).
  if (!CRAWLER_RE.test(ua)) return context.next();

  // Crawler → generar OG de la oferta.
  const url = new URL(request.url);
  const segs = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
  // /:tienda/o/:oferta
  const tiendaSlug = segs[0];
  const ofertaSlug = segs[2];
  const origin = url.origin;
  const htmlResp = (html, code = 200) => new Response(html, { status: code, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });

  try {
    // ofertas?slug=X&ofertaSlug=Y devuelve { oferta, tienda } juntos — un
    // solo fetch, sin duplicar la consulta a tiendas-crud.
    const oRes = await fetch(`${origin}/.netlify/functions/ofertas?slug=${encodeURIComponent(tiendaSlug)}&ofertaSlug=${encodeURIComponent(ofertaSlug)}`);
    const data = oRes.ok ? await oRes.json() : null;
    const oferta = data?.oferta || null;
    const tienda = data?.tienda || null;
    const nombreTienda = tienda?.nombre || 'LOKAL';
    const brand = tienda?.pagina?.color || '#00B8D9';
    const pageUrl = `${origin}/${encodeURIComponent(tiendaSlug)}/o/${encodeURIComponent(ofertaSlug)}`;

    if (!oferta || !oferta.id || !esVigente(oferta)) {
      return htmlResp(paginaOG({
        title: `Oferta finalizada — ${nombreTienda}`,
        desc: `Esta oferta ya finalizó. Mirá las promociones vigentes de ${nombreTienda}.`,
        image: null, url: `${origin}/${encodeURIComponent(tiendaSlug)}`, brand,
      }));
    }

    return htmlResp(paginaOG({
      title: `${oferta.nombre} — ${nombreTienda}`,
      desc: oferta.descripcion?.trim() || `Oferta de ${nombreTienda}. Miralo y compartilo.`,
      image: oferta.imageUrl || oferta.thumbUrl,
      url: pageUrl, brand,
    }));
  } catch (_) {
    return htmlResp(paginaOG({ title: 'Oferta — LOKAL', desc: 'Ofertas y promociones.', image: null, url: origin }));
  }
}

export const config = { path: '/:tienda/o/:oferta' };
