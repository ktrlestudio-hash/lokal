// matcher.js — vincula cada fila del archivo importado con un producto
// real de la tienda (o determina que es alta nueva). Prioridad de señal
// (ver diseño en memoria lokal-links-importar-precios-excel-pdf):
//   1. código de barra exacto
//   2. match previamente confirmado por humano (D1 matches_confirmados),
//      indexado por señal de fila (código/sku/nombre) para esa huella
//   3. nombre exacto (normalizado)
//   4. fuzzy matching sobre nombre, con umbral de confianza
// Nada de esto escribe en D1 — matchearFilas es puro, quien llama decide
// qué confirmar (ver diff.js y el endpoint que junta todo).
import { buscarMatch } from './calibraciones-store.js';

function normalizarNombre(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function soloDigitos(s) {
  return String(s || '').replace(/\D/g, '');
}

// Distancia de Levenshtein acotada — solo hace falta saber si dos nombres
// están "cerca", no la distancia exacta para nombres muy distintos.
function distanciaLevenshtein(a, b, limite) {
  if (Math.abs(a.length - b.length) > limite) return limite + 1;
  const filaAnterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const filaActual = [i];
    let minFila = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      const valor = Math.min(
        filaAnterior[j] + 1,
        filaActual[j - 1] + 1,
        filaAnterior[j - 1] + costo
      );
      filaActual.push(valor);
      if (valor < minFila) minFila = valor;
    }
    if (minFila > limite) return limite + 1;
    filaAnterior.length = 0;
    filaAnterior.push(...filaActual);
  }
  return filaAnterior[b.length];
}

// similitudNombre — 1 = idéntico, 0 = sin relación. Basado en Levenshtein
// normalizado por la longitud del más largo.
function similitudNombre(a, b) {
  const na = normalizarNombre(a);
  const nb = normalizarNombre(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const limite = Math.ceil(Math.max(na.length, nb.length) * 0.4);
  const dist = distanciaLevenshtein(na, nb, limite);
  const maxLen = Math.max(na.length, nb.length);
  return Math.max(0, 1 - dist / maxLen);
}

const UMBRAL_FUZZY = 0.82;

// matchearFila — intenta las 4 señales en orden para UNA fila ya mapeada
// a campos destino (nombre/precio/codigoBarra/skuProveedor...). Devuelve
// { productoId, señal, confianza } o { productoId: null, confianza: 'ninguna' }
// cuando no hay candidato (probable alta nueva).
export async function matchearFila(db, { tiendaId, huella, fila, productos }) {
  const codigoBarra = soloDigitos(fila.codigoBarra);
  if (codigoBarra) {
    const producto = productos.find((p) => soloDigitos(p.codigoBarra) === codigoBarra);
    if (producto) return { productoId: producto.id, señal: 'codigoBarra', confianza: 'alta' };
  }

  for (const [señalTipo, valorCrudo] of [
    ['codigoBarra', codigoBarra],
    ['skuProveedor', fila.skuProveedor],
    ['nombre', fila.nombre ? normalizarNombre(fila.nombre) : null],
  ]) {
    if (!valorCrudo) continue;
    const productoId = await buscarMatch(db, { tiendaId, huellaFuente: huella, señalTipo, señalValor: String(valorCrudo) });
    if (productoId && productos.some((p) => p.id === productoId)) {
      return { productoId, señal: `confirmado_previo:${señalTipo}`, confianza: 'alta' };
    }
  }

  if (fila.skuProveedor) {
    const producto = productos.find((p) => p.skuProveedor && String(p.skuProveedor).trim() === String(fila.skuProveedor).trim());
    if (producto) return { productoId: producto.id, señal: 'skuProveedor', confianza: 'alta' };
  }

  if (fila.nombre) {
    const nombreNorm = normalizarNombre(fila.nombre);
    const exacto = productos.find((p) => normalizarNombre(p.nombre) === nombreNorm);
    if (exacto) return { productoId: exacto.id, señal: 'nombre_exacto', confianza: 'alta' };

    let mejor = null;
    let mejorScore = 0;
    for (const p of productos) {
      const score = similitudNombre(fila.nombre, p.nombre);
      if (score > mejorScore) { mejorScore = score; mejor = p; }
    }
    if (mejor && mejorScore >= UMBRAL_FUZZY) {
      return { productoId: mejor.id, señal: 'nombre_fuzzy', confianza: 'media', score: mejorScore };
    }
  }

  return { productoId: null, señal: null, confianza: 'ninguna' };
}

// matchearFilas — aplica matchearFila a todas las filas ya mapeadas a
// campos destino. `filasMapeadas` es un array de objetos con las claves de
// CAMPOS_DESTINO (armado por el caller a partir de sugerencias del
// clasificador + headers/rows crudos).
export async function matchearFilas(db, { tiendaId, huella, filasMapeadas, productos }) {
  const resultados = [];
  for (const fila of filasMapeadas) {
    const match = await matchearFila(db, { tiendaId, huella, fila, productos });
    resultados.push({ fila, ...match });
  }
  return resultados;
}
