// productos-globales.js — listado LIVIANO de productos cross-tienda para la
// Home global (marketplace multi-tienda en "/", ver src/HomeGlobal.jsx).
//
// Por qué existe un endpoint nuevo: productos.js y ofertas.js solo resuelven
// "los productos/ofertas de UNA tienda" (?slug= o ?tiendaId=) — no hay hoy
// una vista cross-tienda. Este endpoint es de SOLO LECTURA pública (mismo
// nivel de exposición que tiendas-crud.js sin parámetros: activa+verificada),
// sin CRUD propio — el alta/edición de cada producto sigue viviendo en
// productos.js/ofertas.js, esto solo lee ambas colecciones y arma un feed.
//
// Fuentes: data/productos.json (módulo "catalogo") + data/ofertas.json
// (módulo "ofertas") — un negocio puede tener cualquiera de los dos activo,
// así que el feed global mezcla ambas colecciones para no dejar afuera a las
// tiendas que solo usan la galería de ofertas. Cada item vigente
// (esVigente, mismo criterio que los endpoints por-tienda) de una tienda
// activa+verificada con el módulo correspondiente activo (isModuleActive)
// entra al feed, ordenado por fecha de publicación descendente (más nuevo
// primero) y recortado a un máximo — pensado para un carrusel "Destacados",
// no para un catálogo completo paginado (eso sería una fase aparte).
import { handleError, handleOptions, jsonResponse } from './_lib/http.js';
import { readTiendas } from './_lib/tiendas-store.js';
import { isModuleActive } from './_lib/modules.js';
import { readProductos } from './_lib/productos-read.js';
import { readOfertas } from './_lib/ofertas-read.js';
import { esVigente } from './_lib/ofertas-sanitize.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'GET, OPTIONS',
};

const MAX_ITEMS_DEFAULT = 24;
const MAX_ITEMS_CAP = 60;

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestGet({ request, env }) {
  const event = request;
  try {
    const bucket = env.LOKAL_BUCKET;
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit'), 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_ITEMS_CAP)
      : MAX_ITEMS_DEFAULT;

    const [tiendas, productos, ofertas] = await Promise.all([
      readTiendas(bucket),
      readProductos(bucket),
      readOfertas(bucket),
    ]);

    // Solo tiendas públicas reales (mismo filtro que el listado sin
    // parámetros de tiendas-crud.js) — un trial sin aprobar no debe
    // aparecer en el feed global aunque tenga productos cargados.
    const tiendasPublicas = new Map(
      tiendas.filter((t) => t.activa && t.verificada).map((t) => [String(t.id), t])
    );

    const now = Date.now();

    // items con precio numérico son los únicos que tiene sentido mostrar en
    // un carrusel de "Destacados" con precio a la vista — sin precio (una
    // oferta tipo "consultar") queda fuera de este feed puntual, sigue
    // visible igual dentro de su propia tienda.
    function itemsDe(lista, moduleId) {
      const out = [];
      for (const item of lista) {
        if (typeof item.precio !== 'number') continue;
        if (!esVigente(item, now)) continue;
        if (item.visible === false) continue;
        const tienda = tiendasPublicas.get(String(item.tiendaId));
        if (!tienda) continue;
        if (!isModuleActive(tienda, moduleId)) continue;
        const { views, uniques, lastVisit, ...pub } = item;
        out.push({
          ...pub,
          tiendaNombre: tienda.nombre,
          tiendaSlug: tienda.slug,
          tiendaFoto: tienda.foto || null,
          _publishedAt: item.publishAt || item.createdAt || 0,
        });
      }
      return out;
    }

    const feed = [...itemsDe(productos, 'catalogo'), ...itemsDe(ofertas, 'ofertas')]
      .sort((a, b) => new Date(b._publishedAt).getTime() - new Date(a._publishedAt).getTime())
      .slice(0, limit)
      .map(({ _publishedAt, ...rest }) => rest);

    return jsonResponse(event, 200, feed, { ...HTTP_OPTIONS, env });
  } catch (error) {
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
