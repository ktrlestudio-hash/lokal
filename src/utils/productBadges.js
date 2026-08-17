// productBadges.js — badges dinámicos de un producto/oferta, calculados a
// partir de datos que YA existen (publishAt/createdAt, precio/precioOriginal,
// expireAt) en vez de una elección manual del dueño al cargar el producto
// (el sistema viejo: VENTAJA_OPTS/"Mejor precio"/"Financiación" — conceptos
// de venta comparativa que no aplican bien a un comercio simple, y que
// además quedaban pegados para siempre una vez tildados, sin relación con
// el tiempo real).
//
// Reemplazo: 3 badges que se recalculan solos en cada render a partir del
// estado real del producto, más un override manual opcional
// (producto.badgesForzados: string[]) para el caso en que el dueño quiera
// forzar/ocultar uno puntual — ver calcularBadges().
import { Sparkles, Tag, Clock } from 'lucide-react';

const DIAS_NUEVO = 7;       // recién publicado si fue creado hace <= esto
const DIAS_POR_VENCER = 3;  // "últimos días" si vence dentro de esta ventana

export const BADGE_CONFIG = {
  nuevo: { label: 'Nuevo', Icon: Sparkles, color: 'bg-emerald-500', pastel: 'bg-emerald-50 dark:bg-emerald-500/15', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  oferta: { label: 'Oferta', Icon: Tag, color: 'bg-primary', pastel: 'bg-primary/10', iconColor: 'text-primary' },
  por_vencer: { label: 'Últimos días', Icon: Clock, color: 'bg-amber-500', pastel: 'bg-amber-50 dark:bg-amber-500/15', iconColor: 'text-amber-600 dark:text-amber-400' },
};

function esNuevo(o, now) {
  const fecha = o.publishAt || o.createdAt;
  if (!fecha) return false;
  const dias = (now - new Date(fecha).getTime()) / 86400000;
  return dias >= 0 && dias <= DIAS_NUEVO;
}

function esOferta(o) {
  return typeof o.precio === 'number' && typeof o.precioOriginal === 'number' && o.precioOriginal > o.precio;
}

function estaPorVencer(o, now) {
  if (!o.expireAt) return false;
  const dias = (new Date(o.expireAt).getTime() - now) / 86400000;
  return dias >= 0 && dias <= DIAS_POR_VENCER;
}

// badgesForzados: { agregar: string[], ocultar: string[] } — opcional, solo
// presente si el dueño tocó el override manual alguna vez. Sin este campo
// (el caso normal), el resultado es 100% derivado del estado real.
export function calcularBadges(o, now = Date.now()) {
  const activos = new Set();
  if (esNuevo(o, now)) activos.add('nuevo');
  if (esOferta(o)) activos.add('oferta');
  if (estaPorVencer(o, now)) activos.add('por_vencer');

  const forzados = o.badgesForzados;
  if (forzados) {
    (forzados.agregar || []).forEach((id) => BADGE_CONFIG[id] && activos.add(id));
    (forzados.ocultar || []).forEach((id) => activos.delete(id));
  }

  return [...activos];
}
