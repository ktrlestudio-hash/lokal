// diff.js — a partir de resultados de matcher.js, arma el plan de
// sincronización: qué se actualiza, qué se da de alta, y qué producto de
// la tienda no apareció en el archivo (posible baja, requiere
// confirmación humana explícita — nunca se borra solo, ver diseño en la
// memoria lokal-links-importar-precios-excel-pdf).
function numeroValido(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// construirDiff — resultados: array de { fila, productoId, señal, confianza, score }
// (salida de matchearFilas). productos: catálogo actual completo de la
// tienda (no solo los con precio) para detectar bajas.
export function construirDiff({ resultados, productos }) {
  const actualizaciones = [];
  const altas = [];
  const ambiguos = [];
  const idsEncontrados = new Set();

  for (const r of resultados) {
    if (r.confianza === 'ninguna') {
      altas.push({
        nombre: r.fila.nombre || null,
        precio: numeroValido(r.fila.precio),
        precioOriginal: numeroValido(r.fila.precioOriginal),
        stock: numeroValido(r.fila.stock),
        descripcion: r.fila.descripcion || null,
        presentacion: r.fila.presentacion || null,
        codigoBarra: r.fila.codigoBarra || null,
        skuProveedor: r.fila.skuProveedor || null,
      });
      continue;
    }

    if (r.confianza === 'media') {
      ambiguos.push({ fila: r.fila, candidatoId: r.productoId, señal: r.señal, score: r.score });
      continue;
    }

    idsEncontrados.add(r.productoId);
    const producto = productos.find((p) => p.id === r.productoId);
    if (!producto) continue;

    const cambios = {};
    const precioNuevo = numeroValido(r.fila.precio);
    if (precioNuevo !== null && precioNuevo !== producto.precio) cambios.precio = precioNuevo;
    const stockNuevo = numeroValido(r.fila.stock);
    if (stockNuevo !== null && stockNuevo !== producto.stock) cambios.stock = stockNuevo;
    const precioOriginalNuevo = numeroValido(r.fila.precioOriginal);
    if (precioOriginalNuevo !== null && precioOriginalNuevo !== producto.precioOriginal) {
      cambios.precioOriginal = precioOriginalNuevo;
    }

    if (Object.keys(cambios).length > 0) {
      actualizaciones.push({ productoId: producto.id, nombre: producto.nombre, cambios, señal: r.señal });
    }
  }

  // Posibles bajas: productos de la tienda que tenían señal de matching
  // disponible (código/sku) pero no aparecieron en ninguna fila del
  // archivo. Si el producto no tiene código/sku, no se puede confirmar
  // ausencia real (podría ser que el archivo del proveedor no lo liste
  // esta vez por otro motivo) — se excluye de la lista para no asustar
  // con falsos positivos.
  const posiblesBajas = productos.filter((p) =>
    !idsEncontrados.has(p.id) && (p.codigoBarra || p.skuProveedor)
  );

  return { actualizaciones, altas, ambiguos, posiblesBajas };
}
