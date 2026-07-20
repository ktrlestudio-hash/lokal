// tienda-og.js — Edge Function para /:slug (home de la tienda).
//
// Mismo patrón que oferta-og.js: crawler recibe HTML mínimo con meta tags
// OG de la tienda; humano pasa a la SPA (context.next()), que monta
// TiendaPublica en la MISMA url. Sin redirect, sin loop.
//
// RESERVED refleja el mismo set que Root.jsx (RESERVED) — rutas de un solo
// segmento que NO son slug de tienda (admin, legales, etc) — más los
// archivos estáticos de nivel raíz servidos desde public/ (sw.js,
// manifest, favicons): un crawler jamás los pide, pero por robustez no
// dependemos solo de eso.
const RESERVED = new Set([
  'admin', 'terminos-y-condiciones', 'politica-de-privacidad', 'condiciones-para-comercios', '',
  'sw.js', 'theme-init.js', 'site.webmanifest', 'favicon.svg',
]);

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
<a href="${esc(url)}" style="color:#fff">Ver tienda →</a>
</body></html>`;
}

export default async function handler(request, context) {
  const ua = request.headers.get('user-agent') || '';
  // Humano → dejar pasar a la SPA (React monta TiendaPublica en la misma URL).
  if (!CRAWLER_RE.test(ua)) return context.next();

  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/+|\/+$/g, '');
  // Path reservado (/admin, legales, etc) — no es una tienda, dejar pasar.
  if (RESERVED.has(slug)) return context.next();

  const origin = url.origin;
  const pageUrl = `${origin}/${encodeURIComponent(slug)}`;
  const htmlResp = (html, code = 200) => new Response(html, { status: code, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });

  try {
    const tRes = await fetch(`${origin}/.netlify/functions/tiendas-crud?slug=${encodeURIComponent(slug)}`);
    const tienda = tRes.ok ? await tRes.json() : null;

    if (!tienda || !tienda.id) {
      // Tienda inexistente/no encontrada — OG genérico de LOKAL, nunca un
      // link roto sin meta tags (mismo criterio que oferta-og.js).
      return htmlResp(paginaOG({
        title: 'LOKAL',
        desc: 'Descubrí negocios locales en LOKAL.',
        image: null, url: origin,
      }));
    }

    const brand = tienda.pagina?.color || '#00B8D9';
    // Imagen: portada/foto de galería primero (más representativa como
    // banner), logo como fallback — igual criterio visual que el hero de
    // commerce-modern.jsx (heroImg = foto || galeria[0] || fotoPortada).
    const image = tienda.foto || tienda.fotoPortada || tienda.galeria?.[0] || tienda.logo || null;

    return htmlResp(paginaOG({
      title: tienda.nombre || 'LOKAL',
      desc: tienda.descripcion?.trim() || `Mirá ${tienda.nombre || 'esta tienda'} en LOKAL.`,
      image,
      url: pageUrl, brand,
    }));
  } catch (_) {
    return htmlResp(paginaOG({ title: 'LOKAL', desc: 'Descubrí negocios locales en LOKAL.', image: null, url: origin }));
  }
}

export const config = { path: '/:slug' };
