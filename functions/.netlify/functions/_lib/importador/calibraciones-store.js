// calibraciones-store.js — acceso a D1 (binding IMPORTADOR_DB) para
// calibraciones, matches confirmados y corridas. Prepared statements con
// bind() en todo — nunca interpolar valores directo en el SQL.
function ahora() { return new Date().toISOString(); }
function id(prefijo) { return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

export async function buscarCalibracion(db, tiendaId, huella) {
  const row = await db.prepare(
    'SELECT * FROM calibraciones WHERE tienda_id = ? AND huella = ?'
  ).bind(tiendaId, huella).first();
  if (!row) return null;
  return { ...row, headers_originales: JSON.parse(row.headers_originales), mapeo: JSON.parse(row.mapeo) };
}

// Trae las calibraciones existentes de una tienda para comparar similitud
// de encabezados cuando no hay match exacto de huella (ver
// similitudEncabezados en huella.js) — precargar el mapeo más parecido en
// vez de arrancar de cero.
export async function listarCalibraciones(db, tiendaId) {
  const { results } = await db.prepare(
    'SELECT * FROM calibraciones WHERE tienda_id = ?'
  ).bind(tiendaId).all();
  return results.map((row) => ({ ...row, headers_originales: JSON.parse(row.headers_originales), mapeo: JSON.parse(row.mapeo) }));
}

export async function guardarCalibracion(db, { tiendaId, huella, headersOriginales, mapeo }) {
  const existente = await buscarCalibracion(db, tiendaId, huella);
  if (existente) {
    await db.prepare(
      'UPDATE calibraciones SET mapeo = ?, headers_originales = ?, actualizado_en = ? WHERE id = ?'
    ).bind(JSON.stringify(mapeo), JSON.stringify(headersOriginales), ahora(), existente.id).run();
    return existente.id;
  }
  const nuevoId = id('calib');
  await db.prepare(
    'INSERT INTO calibraciones (id, tienda_id, huella, headers_originales, mapeo) VALUES (?, ?, ?, ?, ?)'
  ).bind(nuevoId, tiendaId, huella, JSON.stringify(headersOriginales), JSON.stringify(mapeo)).run();
  return nuevoId;
}

// buscarMatch — orden de prioridad de señal ya resuelto por el caller
// (matching.js pasa primero codigoBarra, si no hay resultado prueba
// skuProveedor, si no nombreNormalizado). Acá solo es un lookup exacto.
export async function buscarMatch(db, { tiendaId, huellaFuente, señalTipo, señalValor }) {
  if (!señalValor) return null;
  const row = await db.prepare(
    'SELECT producto_id FROM matches_confirmados WHERE tienda_id = ? AND huella_fuente = ? AND señal_tipo = ? AND señal_valor = ?'
  ).bind(tiendaId, huellaFuente, señalTipo, señalValor).first();
  return row?.producto_id || null;
}

export async function confirmarMatch(db, { tiendaId, huellaFuente, señalTipo, señalValor, productoId }) {
  await db.prepare(
    `INSERT INTO matches_confirmados (id, tienda_id, huella_fuente, señal_tipo, señal_valor, producto_id)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(tienda_id, huella_fuente, señal_tipo, señal_valor) DO UPDATE SET producto_id = excluded.producto_id`
  ).bind(id('match'), tiendaId, huellaFuente, señalTipo, señalValor, productoId).run();
}

export async function crearCorrida(db, { tiendaId, huella, nombreArchivo }) {
  const corridaId = id('corrida');
  await db.prepare(
    'INSERT INTO corridas (id, tienda_id, huella, nombre_archivo, estado) VALUES (?, ?, ?, ?, ?)'
  ).bind(corridaId, tiendaId, huella, nombreArchivo || null, 'calibrando').run();
  return corridaId;
}

export async function actualizarCorrida(db, corridaId, { estado, resumen }) {
  const completadoEn = estado === 'completada' ? ahora() : null;
  await db.prepare(
    'UPDATE corridas SET estado = ?, resumen = ?, completado_en = COALESCE(?, completado_en) WHERE id = ?'
  ).bind(estado, resumen ? JSON.stringify(resumen) : null, completadoEn, corridaId).run();
}

export async function buscarCorrida(db, corridaId) {
  const row = await db.prepare('SELECT * FROM corridas WHERE id = ?').bind(corridaId).first();
  if (!row) return null;
  return { ...row, resumen: row.resumen ? JSON.parse(row.resumen) : null };
}
