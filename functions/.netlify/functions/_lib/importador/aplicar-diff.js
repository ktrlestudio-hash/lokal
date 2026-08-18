// aplicar-diff.js — lógica pura de aplicar un plan de sincronización
// (subconjunto de diff.js ya confirmado por el usuario) sobre el array de
// ofertas de la tienda. Extraído del endpoint para poder testear sin R2/
// D1/auth reales (mismo patrón que ofertas-sanitize.js). No conoce R2 ni
// D1 — devuelve el array de ofertas actualizado + contadores, quien llama
// (importador.js) se encarga de leer/escribir con etag.
import { sanitizeOfertaInput } from '../ofertas-sanitize.js';

export function aplicarDiff({ ofertas, tienda, tiendaId, altas, actualizaciones, bajas, now = new Date().toISOString() }) {
  const resultado = [...ofertas];

  for (const alta of altas) {
    const nueva = {
      id: `oferta_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...sanitizeOfertaInput(alta, tienda),
      views: 0,
      uniques: 0,
      lastVisit: null,
      createdAt: now,
    };
    resultado.unshift(nueva);
  }

  let actualizados = 0;
  for (const act of actualizaciones) {
    const idx = resultado.findIndex((o) => o.id === act.productoId && String(o.tiendaId) === String(tiendaId));
    if (idx === -1) continue;
    const cambios = act.cambios && typeof act.cambios === 'object' ? act.cambios : {};
    resultado[idx] = {
      ...resultado[idx],
      ...sanitizeOfertaInput({ ...resultado[idx], ...cambios }, tienda, resultado[idx].slug),
      updatedAt: now,
    };
    actualizados += 1;
  }

  let bajasAplicadas = 0;
  for (const productoId of bajas) {
    const idx = resultado.findIndex((o) => o.id === productoId && String(o.tiendaId) === String(tiendaId));
    if (idx === -1) continue;
    resultado[idx] = { ...resultado[idx], visible: false, updatedAt: now };
    bajasAplicadas += 1;
  }

  return { ofertas: resultado, actualizados, bajasAplicadas };
}
