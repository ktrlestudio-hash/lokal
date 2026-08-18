// huella.js — identifica la "estructura" de un archivo por sus encabezados,
// no por su nombre de proveedor (no confiable) ni solo por tienda. Dos
// archivos con los mismos encabezados (en cualquier orden) comparten
// huella → misma calibración reusable. Ver diseño en la memoria
// lokal-links-importar-precios-excel-pdf, sección "Calibración persistida".
function normalizarHeader(h) {
  return String(h || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // saca tildes
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Hash simple (FNV-1a, 32 bits) — no necesita ser criptográfico, solo
// estable y sin colisiones frecuentes para un volumen chico de estructuras
// de archivo por tienda. Evita depender de crypto.subtle (async) para algo
// que se calcula sincrónico en el flujo de calibración.
function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function calcularHuella(headers) {
  const normalizados = headers.map(normalizarHeader).filter(Boolean).sort();
  return fnv1a(normalizados.join('|'));
}

// similitudEncabezados — para el caso "no hay match exacto de huella pero
// se parece mucho a una calibración guardada" (el proveedor agregó/sacó
// una columna). Jaccard simple sobre los sets de encabezados normalizados.
export function similitudEncabezados(headersA, headersB) {
  const setA = new Set(headersA.map(normalizarHeader).filter(Boolean));
  const setB = new Set(headersB.map(normalizarHeader).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1;
  const interseccion = [...setA].filter((h) => setB.has(h)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : interseccion / union;
}

export { normalizarHeader };
