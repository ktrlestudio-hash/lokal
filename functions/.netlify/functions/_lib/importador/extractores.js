// extractores.js — convierte cada formato de entrada a una tabla
// normalizada { headers: string[], rows: string[][] }. A partir de acá el
// resto del pipeline (clasificador de columnas, calibración, matching,
// diff) es formato-agnóstico — ver arquitectura acordada en la memoria
// lokal-links-importar-precios-excel-pdf. v1 cubre Excel/CSV/JSON/texto
// plano; Sheets-como-CSV, Airtable y PDF quedan para v2+.
import * as XLSX from 'xlsx';

export class ExtractorError extends Error {}

// Excel (.xlsx/.xls) — toma la primera hoja con datos. Si el archivo tiene
// varias hojas, se podría pedir elegir en una v2; por ahora la primera
// hoja no vacía es la heurística más simple y cubre el caso real de una
// lista de precios de proveedor (normalmente una sola hoja).
export function extraerExcel(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((name) => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, blankrows: false });
    return rows.length > 0;
  });
  if (!sheetName) throw new ExtractorError('El archivo Excel no tiene datos en ninguna hoja');
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, blankrows: false, defval: '' });
  return filasATabla(rows);
}

// CSV — separador auto-detectado entre coma/punto y coma/tab (listas de
// proveedor en español suelen venir con ; porque Excel regional usa coma
// como separador decimal). xlsx.read con type:'string' + raw:true ya trae
// un parser de CSV robusto (comillas, escapes), reusarlo evita mantener
// uno propio.
export function extraerCSV(texto) {
  const primerLinea = texto.split(/\r?\n/, 1)[0] || '';
  const candidatos = [',', ';', '\t'];
  const separador = candidatos.reduce((mejor, c) =>
    (primerLinea.split(c).length > primerLinea.split(mejor).length ? c : mejor), ',');
  const wb = XLSX.read(texto, { type: 'string', FS: separador });
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, blankrows: false, defval: '' });
  return filasATabla(rows);
}

// JSON — tolera un array de objetos (lo más común, un export típico de
// API/sistema) o un objeto único envolviendo un array bajo alguna clave
// común (items/data/productos/rows). Si es un array de arrays ya viene
// como tabla directa (primer elemento = headers).
export function extraerJSON(texto) {
  let data;
  try {
    data = JSON.parse(texto);
  } catch {
    throw new ExtractorError('El archivo no es JSON válido');
  }
  if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
    return filasATabla(data);
  }
  if (!Array.isArray(data)) {
    const clavePosible = ['items', 'data', 'productos', 'rows', 'results'].find((k) => Array.isArray(data[k]));
    if (!clavePosible) throw new ExtractorError('No se encontró un array de productos en el JSON');
    data = data[clavePosible];
  }
  if (!Array.isArray(data) || data.length === 0) throw new ExtractorError('El JSON no tiene productos');
  if (typeof data[0] !== 'object' || data[0] === null) {
    throw new ExtractorError('Los elementos del JSON no son objetos con campos reconocibles');
  }
  // Array de objetos → headers = unión de claves de todos los objetos
  // (no solo el primero: listas reales suelen tener campos opcionales que
  // faltan en algunas filas).
  const headers = [...new Set(data.flatMap((obj) => Object.keys(obj)))];
  const rows = data.map((obj) => headers.map((h) => (obj[h] == null ? '' : String(obj[h]))));
  return { headers, rows };
}

// Texto plano casi sin formato — una fila por línea, campos separados por
// el delimitador más consistente que aparezca (tab, " - ", "|", ";").
// Sin encabezado real: se generan nombres de columna genéricos
// (columna_1, columna_2...) y el clasificador de columnas (por tipo de
// dato del contenido, no por nombre) hace el trabajo real acá — este es
// el caso donde el nivel 1 heurístico por nombre de encabezado no aplica.
export function extraerTextoPlano(texto) {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lineas.length === 0) throw new ExtractorError('El texto está vacío');
  const delimitadores = ['\t', ' - ', '|', ';', ','];
  const delimitador = delimitadores.find((d) => lineas[0].includes(d)) || null;
  const rows = lineas.map((l) => (delimitador ? l.split(delimitador).map((c) => c.trim()) : [l]));
  const maxCols = Math.max(...rows.map((r) => r.length));
  const headers = Array.from({ length: maxCols }, (_, i) => `columna_${i + 1}`);
  const rowsParejas = rows.map((r) => Array.from({ length: maxCols }, (_, i) => r[i] ?? ''));
  return { headers, rows: rowsParejas };
}

// filasATabla — toma filas crudas tipo array-de-arrays (primera fila =
// encabezados) y las limpia: descarta filas completamente vacías, y
// completa filas más cortas que el header con '' (celdas vacías al final
// de una fila real en Excel a veces ni siquiera llegan al array).
function filasATabla(rows) {
  const limpias = rows.filter((r) => r.some((c) => String(c ?? '').trim() !== ''));
  if (limpias.length < 2) throw new ExtractorError('El archivo no tiene filas de datos, solo encabezado (o está vacío)');
  const headers = limpias[0].map((h) => String(h ?? '').trim());
  const dataRows = limpias.slice(1).map((r) =>
    headers.map((_, i) => String(r[i] ?? '').trim())
  );
  return { headers, rows: dataRows };
}

// Despacho por tipo de archivo detectado (extensión + contentType) —
// llamado desde el endpoint HTTP, ver import.js.
export function extraerTabla({ nombreArchivo, contentType, arrayBuffer, texto }) {
  const ext = (nombreArchivo || '').split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls' || contentType?.includes('spreadsheet')) {
    return extraerExcel(arrayBuffer);
  }
  if (ext === 'json' || contentType?.includes('json')) {
    return extraerJSON(texto);
  }
  if (ext === 'csv' || contentType?.includes('csv')) {
    return extraerCSV(texto);
  }
  // Sin extensión reconocible pero con contenido de texto: probar JSON
  // primero (falla rápido y limpio si no lo es), después tratarlo como
  // texto plano — cubre el caso de "pegué una lista sin guardar el archivo".
  if (texto) {
    try {
      return extraerJSON(texto);
    } catch {
      return extraerTextoPlano(texto);
    }
  }
  throw new ExtractorError(`No se reconoce el formato del archivo "${nombreArchivo || ''}"`);
}
