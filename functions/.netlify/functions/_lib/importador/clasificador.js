// clasificador.js — nivel 1 (heurística por nombre de encabezado, gratis)
// y nivel 2 (inferencia por tipo de dato del contenido) de detección de
// columnas. El nivel 3 (calibración humana con ejemplos reales) no vive
// acá — es el flujo del endpoint /importador/calibrar, que usa
// clasificarColumnas() para decidir qué mostrarle al usuario a confirmar.
import { normalizarHeader } from './huella.js';

// Campos destino válidos — mismo vocabulario que sanitizeOfertaInput
// (ver ofertas-sanitize.js) más 2 campos exclusivos del importador
// (marca, codigoBarra/skuProveedor) que no son parte del modelo de
// producto hoy pero sirven como señal de matching — no se guardan en el
// producto final, solo se usan para vincular filas a productos.
export const CAMPOS_DESTINO = [
  'nombre', 'precio', 'precioOriginal', 'stock', 'descripcion',
  'marca', 'codigoBarra', 'skuProveedor', 'ignorar',
];

// Diccionario de sinónimos por campo — nivel 1. Cada entrada normalizada
// (sin tildes, minúscula, guiones bajos) contra la que se compara cada
// encabezado normalizado. Orden de prioridad: si un encabezado matchea
// varios campos (raro pero posible), gana el primero de esta lista.
const SINONIMOS = {
  codigoBarra: ['ean', 'upc', 'gtin', 'codigo_barra', 'codigo_de_barra', 'codigo_de_barras', 'cod_barra'],
  skuProveedor: ['sku', 'codigo', 'cod', 'id', 'referencia', 'ref', 'codigo_proveedor', 'codigo_producto'],
  nombre: ['producto', 'articulo', 'descripcion', 'detalle', 'item', 'nombre', 'concepto'],
  marca: ['marca', 'brand', 'fabricante'],
  precio: ['precio', 'pvp', 'importe', 'valor', 'precio_venta', 'precio_lista', 'precio_publico'],
  precioOriginal: ['precio_anterior', 'precio_original', 'precio_sin_descuento', 'precio_regular'],
  stock: ['stock', 'cantidad', 'existencia', 'disponible', 'existencias'],
  descripcion: ['detalle_producto', 'observaciones', 'notas'],
};

// clasificarNivel1 — heurística de nombre de encabezado. Devuelve, para
// cada header original, el campo destino sugerido y si la confianza es
// "alta" (match exacto de sinónimo) para saber si hace falta nivel 2.
function clasificarNivel1(headers) {
  return headers.map((header) => {
    const norm = normalizarHeader(header);
    for (const [campo, sinonimos] of Object.entries(SINONIMOS)) {
      if (sinonimos.includes(norm)) return { header, campo, confianza: 'alta' };
    }
    // Match parcial (el header contiene el sinónimo, ej. "precio unitario
    // arg" contiene "precio") — confianza media, se corrobora en nivel 2.
    for (const [campo, sinonimos] of Object.entries(SINONIMOS)) {
      if (sinonimos.some((s) => norm.includes(s))) return { header, campo, confianza: 'media' };
    }
    return { header, campo: null, confianza: 'ninguna' };
  });
}

// Heurísticas de tipo de dato — nivel 2, corre sobre una muestra de
// valores reales de la columna (no hace falta la tabla completa).
function pareceMoneda(valores) {
  const limpios = valores.map((v) => String(v).replace(/[^0-9.,]/g, ''));
  const numericos = limpios.filter((v) => v && !isNaN(Number(v.replace(',', '.'))));
  return numericos.length >= Math.ceil(valores.length * 0.7);
}
function pareceCodigoBarra(valores) {
  const soloDigitos = valores.map((v) => String(v).replace(/\D/g, ''));
  const conLongitudTipica = soloDigitos.filter((v) => [8, 12, 13, 14].includes(v.length));
  return conLongitudTipica.length >= Math.ceil(valores.length * 0.7);
}
function pareceTextoLibre(valores) {
  const longitudPromedio = valores.reduce((a, v) => a + String(v).length, 0) / (valores.length || 1);
  const unicos = new Set(valores.map((v) => String(v).trim().toLowerCase()));
  return longitudPromedio > 8 && unicos.size / (valores.length || 1) > 0.6;
}

// clasificarNivel2 — para columnas donde nivel 1 no dio confianza "alta",
// mira una muestra de hasta 10 valores reales de esa columna. No decide
// solo por esto: devuelve una sugerencia que se combina con nivel 1 (si
// ambos coinciden, sube la confianza a alta) y que puede mandarse a un
// LLM como contexto adicional para las columnas que sigan ambiguas
// después de esto (fuera de alcance de v1, ver clasificarConLLM abajo).
function clasificarNivel2(rows, colIndex) {
  const muestra = rows.slice(0, 10).map((r) => r[colIndex]).filter((v) => v !== '');
  if (muestra.length === 0) return null;
  if (pareceCodigoBarra(muestra)) return 'codigoBarra';
  if (pareceMoneda(muestra)) return 'precio';
  if (pareceTextoLibre(muestra)) return 'nombre';
  return null;
}

// clasificarColumnas — punto de entrada. Combina nivel 1 + nivel 2 y
// devuelve, por columna, el campo sugerido + si necesita confirmación
// humana (confianza 'ninguna' o 'media' sin refuerzo de nivel 2, o
// colisión: dos columnas distintas sugieren el mismo campo).
export function clasificarColumnas({ headers, rows }) {
  const n1 = clasificarNivel1(headers);
  const sugerencias = n1.map((s, i) => {
    if (s.confianza === 'alta') return { ...s, fuente: 'nombre_encabezado' };
    const n2 = clasificarNivel2(rows, i);
    if (n2 && n2 === s.campo) return { header: s.header, campo: n2, confianza: 'alta', fuente: 'nombre+tipo_dato' };
    // Nivel 2 (tipo de dato real) contradice o refuerza un match parcial
    // de nombre ambiguo (ej. header "Cod" matchea parcial con "codigo" de
    // skuProveedor, pero el contenido son códigos de 13 dígitos — el tipo
    // de dato es señal más confiable que un match parcial de texto). Gana
    // nivel 2 cuando hay señal fuerte de un campo distinto al de nivel 1.
    if (n2) return { header: s.header, campo: n2, confianza: 'media', fuente: 'tipo_dato' };
    if (s.confianza === 'media') return { ...s, fuente: 'nombre_encabezado_parcial' };
    return { header: s.header, campo: null, confianza: 'ninguna', fuente: null };
  });

  // Colisión: dos+ columnas sugieren el mismo campo no-ignorable — bajar
  // confianza de todas menos la de mayor confianza, para forzar revisión.
  const porCampo = new Map();
  sugerencias.forEach((s, i) => {
    if (!s.campo || s.campo === 'ignorar') return;
    if (!porCampo.has(s.campo)) porCampo.set(s.campo, []);
    porCampo.get(s.campo).push(i);
  });
  for (const indices of porCampo.values()) {
    if (indices.length <= 1) continue;
    const ordenados = [...indices].sort((a, b) => {
      const rank = { alta: 2, media: 1, ninguna: 0 };
      return rank[sugerencias[b].confianza] - rank[sugerencias[a].confianza];
    });
    ordenados.slice(1).forEach((i) => { sugerencias[i] = { ...sugerencias[i], confianza: 'media', colision: true }; });
  }

  const necesitaRevision = sugerencias.some((s) => s.confianza !== 'alta');
  return { sugerencias, necesitaRevision };
}
