// importador.js — endpoint del importador universal de listas de precios
// (v1: Excel/CSV/JSON/texto plano). Junta extractor → huella → calibración
// (D1) → clasificador → matcher → diff. Ver diseño acordado en la memoria
// lokal-links-importar-precios-excel-pdf.
//
// Dos acciones vía POST ?action=:
//   - "calibrar": recibe el archivo crudo, devuelve la tabla extraída +
//     sugerencias de columnas (clasificador nivel 1+2) para que el
//     frontend arme la pantalla de confirmación humana (nivel 3). No
//     escribe nada todavía — es de solo lectura sobre D1 (busca
//     calibración existente por huella).
//   - "sincronizar": recibe el archivo + el mapeo YA confirmado por el
//     humano (columna → campo destino), guarda la calibración, corre
//     matcher+diff contra el catálogo real de la tienda, y devuelve el
//     plan de sincronización (altas/actualizaciones/ambiguos/posibles
//     bajas) sin aplicarlo — aplicar cambios reales al catálogo queda
//     para un segundo POST explícito del frontend (confirmar-cambios,
//     fuera de esta v1 de endpoint) para no mutar productos a ciegas.
import { requireAuth } from './_lib/auth.js';
import { handleError, handleOptions, HttpError, jsonResponse, parseJsonBody } from './_lib/http.js';
import { sanitizeText } from './_lib/validation.js';
import { ensureStoreOwner, findTiendaById, readTiendas } from './_lib/tiendas-store.js';
import { readOfertas } from './_lib/ofertas-read.js';
import { safeRead, safeWrite } from './_lib/r2-safe-write.js';
import { extraerTabla, ExtractorError } from './_lib/importador/extractores.js';
import { calcularHuella } from './_lib/importador/huella.js';
import { clasificarColumnas } from './_lib/importador/clasificador.js';
import { buscarCalibracion, guardarCalibracion, crearCorrida, actualizarCorrida, buscarCorrida, confirmarMatch } from './_lib/importador/calibraciones-store.js';
import { matchearFilas } from './_lib/importador/matcher.js';
import { construirDiff } from './_lib/importador/diff.js';
import { aplicarDiff } from './_lib/importador/aplicar-diff.js';

const OFERTAS_KEY = 'data/ofertas.json';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, OPTIONS',
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function decodeBase64(value) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new HttpError(400, 'Archivo vacío');
  let binary;
  try {
    binary = atob(normalized);
  } catch {
    throw new HttpError(400, 'Archivo inválido (base64 corrupto)');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// arrayBufferATexto — para CSV/JSON/texto plano necesitamos el string; el
// frontend siempre manda base64 (mismo contrato que upload.js) así que
// decodificamos bytes → UTF-8 acá, no le pedimos al cliente dos formatos.
function bytesATexto(bytes) {
  return new TextDecoder('utf-8').decode(bytes);
}

async function leerArchivoDelBody(body) {
  const fileName = sanitizeText(body.fileName, { max: 160, multiline: false });
  const contentType = sanitizeText(body.contentType, { max: 120, multiline: false });
  if (!fileName || !body.fileData) throw new HttpError(400, 'fileName y fileData son requeridos');

  const bytes = decodeBase64(body.fileData);
  if (bytes.length > MAX_FILE_BYTES) throw new HttpError(400, 'Archivo demasiado grande (máx 5MB)');

  const ext = fileName.split('.').pop()?.toLowerCase();
  const esBinario = ext === 'xlsx' || ext === 'xls';
  const texto = esBinario ? null : bytesATexto(bytes);
  const arrayBuffer = esBinario ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) : null;

  try {
    return extraerTabla({ nombreArchivo: fileName, contentType, arrayBuffer, texto });
  } catch (error) {
    if (error instanceof ExtractorError) throw new HttpError(400, error.message);
    // Cualquier otra excepción del parser (ej. algo interno de la librería
    // xlsx) se convierte en HttpError con el mensaje real en vez de
    // propagarse cruda — el frontend siempre recibe JSON, nunca una
    // respuesta no-JSON del runtime.
    console.error('Error inesperado leyendo archivo del importador:', error);
    throw new HttpError(500, `Error al leer el archivo: ${error?.message || 'desconocido'}`);
  }
}

// mapearFilas — convierte {headers, rows} + mapeo confirmado {header: campo}
// a un array de objetos por campo destino (lo que espera matcher.js/diff.js).
function mapearFilas({ headers, rows }, mapeo) {
  const indices = {};
  headers.forEach((h, i) => {
    const campo = mapeo[h];
    if (campo && campo !== 'ignorar') indices[campo] = i;
  });
  return rows.map((row) => {
    const fila = {};
    for (const [campo, i] of Object.entries(indices)) fila[campo] = row[i];
    return fila;
  });
}

async function requireTienda(event, env, tiendaId) {
  const user = await requireAuth(event, env);
  const tiendas = await readTiendas(env.LOKAL_BUCKET);
  const tienda = findTiendaById(tiendas, tiendaId);
  if (!tienda) throw new HttpError(404, 'Tienda no encontrada');
  ensureStoreOwner(user, tienda);
  return tienda;
}

async function accionCalibrar({ event, env, body }) {
  // Medido (2026-08-19): el costo real de este endpoint no está en
  // parsear el archivo (leerArchivo ronda 0ms incluso con la librería
  // xlsx) sino en la CANTIDAD de round-trips de red secuenciales:
  // requireTienda (verificación de token Firebase + lectura de R2) y
  // buscarCalibracion (D1) suman ~150-200ms CADA UNO por latencia de red
  // normal, uno atrás del otro. leerArchivoDelBody no depende de
  // requireTienda (no necesita saber la tienda para parsear el archivo),
  // así que corren en paralelo — ahorra uno de los dos saltos de red del
  // total percibido.
  const tiendaId = sanitizeText(String(body.tiendaId || ''), { max: 64, multiline: false });
  if (!tiendaId) throw new HttpError(400, 'tiendaId es requerido');

  const [, tabla] = await Promise.all([
    requireTienda(event, env, tiendaId),
    leerArchivoDelBody(body),
  ]);

  const huella = calcularHuella(tabla.headers);
  const existente = await buscarCalibracion(env.IMPORTADOR_DB, tiendaId, huella);

  if (existente) {
    return jsonResponse(event, 200, {
      huella,
      headers: tabla.headers,
      filasPreview: tabla.rows.slice(0, 5),
      totalFilas: tabla.rows.length,
      mapeo: existente.mapeo,
      necesitaRevision: false,
      calibracionReusada: true,
    }, { ...HTTP_OPTIONS, env });
  }

  const { sugerencias, necesitaRevision } = clasificarColumnas(tabla);
  return jsonResponse(event, 200, {
    huella,
    headers: tabla.headers,
    filasPreview: tabla.rows.slice(0, 5),
    totalFilas: tabla.rows.length,
    sugerencias,
    necesitaRevision,
    calibracionReusada: false,
  }, { ...HTTP_OPTIONS, env });
}

async function accionSincronizar({ event, env, body }) {
  const tiendaId = sanitizeText(String(body.tiendaId || ''), { max: 64, multiline: false });
  if (!tiendaId) throw new HttpError(400, 'tiendaId es requerido');
  if (!body.mapeo || typeof body.mapeo !== 'object') throw new HttpError(400, 'mapeo es requerido');

  await requireTienda(event, env, tiendaId);

  const tabla = await leerArchivoDelBody(body);
  const huella = calcularHuella(tabla.headers);
  const db = env.IMPORTADOR_DB;

  await guardarCalibracion(db, { tiendaId, huella, headersOriginales: tabla.headers, mapeo: body.mapeo });
  const corridaId = await crearCorrida(db, { tiendaId, huella, nombreArchivo: sanitizeText(body.fileName, { max: 160, multiline: false }) });

  try {
    const filasMapeadas = mapearFilas(tabla, body.mapeo);
    const productos = (await readOfertas(env.LOKAL_BUCKET)).filter((o) => String(o.tiendaId) === String(tiendaId));

    const resultados = await matchearFilas(db, { tiendaId, huella, filasMapeadas, productos });
    const diff = construirDiff({ resultados, productos });

    await actualizarCorrida(db, corridaId, {
      estado: 'completada',
      resumen: {
        altas: diff.altas.length,
        actualizaciones: diff.actualizaciones.length,
        ambiguos: diff.ambiguos.length,
        posiblesBajas: diff.posiblesBajas.length,
      },
    });

    return jsonResponse(event, 200, { corridaId, huella, ...diff }, { ...HTTP_OPTIONS, env });
  } catch (error) {
    await actualizarCorrida(db, corridaId, { estado: 'error' });
    throw error;
  }
}

// accionAplicar — segundo paso explícito después de "sincronizar": el
// frontend ya mostró el plan (altas/actualizaciones/ambiguos/posiblesBajas)
// al dueño de la tienda, que eligió qué aplicar. Nada se escribe en el
// catálogo hasta este POST — evita que un archivo mal calibrado mute
// productos reales sin que un humano lo haya revisado primero (ver diseño
// en la memoria lokal-links-importar-precios-excel-pdf).
//
// body esperado:
//   corridaId: string (la que devolvió "sincronizar", para trazabilidad)
//   altas: [{ nombre, precio, precioOriginal, stock, descripcion, ... }]
//     — subconjunto de diff.altas que el usuario confirmó dar de alta
//   actualizaciones: [{ productoId, cambios }]
//     — subconjunto de diff.actualizaciones confirmado
//   ambiguosConfirmados: [{ productoId, señalTipo, señalValor }]
//     — de diff.ambiguos, los que el usuario confirmó como el match
//     correcto; se graban en matches_confirmados para que la próxima
//     corrida con esta huella los reconozca por señal fuerte (nivel 4:
//     "match previamente confirmado", ver matcher.js)
//   bajas: [productoId] — de diff.posiblesBajas, los que el usuario
//     confirmó dar de baja (se ocultan con visible:false, no se borran)
async function accionAplicar({ event, env, body }) {
  const tiendaId = sanitizeText(String(body.tiendaId || ''), { max: 64, multiline: false });
  if (!tiendaId) throw new HttpError(400, 'tiendaId es requerido');
  const tienda = await requireTienda(event, env, tiendaId);

  const bucket = env.LOKAL_BUCKET;
  const db = env.IMPORTADOR_DB;
  const corridaId = sanitizeText(body.corridaId, { max: 80, multiline: false });
  const corrida = corridaId ? await buscarCorrida(db, corridaId) : null;
  if (corridaId && (!corrida || String(corrida.tienda_id) !== String(tiendaId))) {
    throw new HttpError(404, 'Corrida no encontrada');
  }

  const altas = Array.isArray(body.altas) ? body.altas : [];
  const actualizaciones = Array.isArray(body.actualizaciones) ? body.actualizaciones : [];
  const bajas = Array.isArray(body.bajas) ? body.bajas.map((id) => sanitizeText(id, { max: 80, multiline: false })) : [];
  const ambiguosConfirmados = Array.isArray(body.ambiguosConfirmados) ? body.ambiguosConfirmados : [];

  const { data: ofertasActuales, etag } = await safeRead(bucket, OFERTAS_KEY, []);
  const { ofertas, actualizados, bajasAplicadas, errores } = aplicarDiff({
    ofertas: ofertasActuales, tienda, tiendaId, altas, actualizaciones, bajas,
  });
  const altasAplicadas = altas.length - errores.filter((e) => e.tipo === 'alta').length;

  await safeWrite(bucket, OFERTAS_KEY, ofertas, etag);

  if (corrida) {
    for (const amb of ambiguosConfirmados) {
      const productoId = sanitizeText(amb.productoId, { max: 80, multiline: false });
      const señalTipo = sanitizeText(amb.señalTipo, { max: 30, multiline: false });
      const señalValor = sanitizeText(String(amb.señalValor || ''), { max: 200, multiline: false });
      if (!productoId || !señalTipo || !señalValor) continue;
      await confirmarMatch(db, { tiendaId, huellaFuente: corrida.huella, señalTipo, señalValor, productoId });
    }
    await actualizarCorrida(db, corridaId, {
      estado: errores.length ? 'aplicada_con_errores' : 'aplicada',
      resumen: { ...corrida.resumen, altasAplicadas, actualizacionesAplicadas: actualizados, bajasAplicadas, errores: errores.length },
    });
  }

  return jsonResponse(event, 200, {
    altasAplicadas,
    actualizacionesAplicadas: actualizados,
    bajasAplicadas,
    matchesConfirmados: ambiguosConfirmados.length,
    errores,
  }, { ...HTTP_OPTIONS, env });
}

export async function onRequestOptions({ request, env }) {
  return handleOptions(request, { ...HTTP_OPTIONS, env });
}

export async function onRequestPost({ request, env }) {
  const event = request;
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await parseJsonBody(event);

    if (action === 'calibrar') return await accionCalibrar({ event, env, body });
    if (action === 'sincronizar') return await accionSincronizar({ event, env, body });
    if (action === 'aplicar') return await accionAplicar({ event, env, body });
    throw new HttpError(400, 'action inválida (esperado: calibrar | sincronizar | aplicar)');
  } catch (error) {
    // Diagnóstico temporal (2026-08-18): 500 real en producción en
    // action=aplicar con un lote grande, sin acceso a wrangler tail en este
    // entorno — se devuelve el mensaje/stack real en el body (no solo
    // "Error interno") para verlo directo en la consola del navegador.
    // SACAR este bloque una vez encontrada la causa real.
    console.error('POST /importador falló:', error?.constructor?.name, error?.message, error?.stack);
    if (!(error instanceof HttpError)) {
      return jsonResponse(event, 500, {
        error: `DEBUG: ${error?.constructor?.name}: ${error?.message}`,
        stack: String(error?.stack || '').split('\n').slice(0, 6),
      }, { ...HTTP_OPTIONS, env });
    }
    return handleError(request, error, 'Error interno', { ...HTTP_OPTIONS, env });
  }
}
