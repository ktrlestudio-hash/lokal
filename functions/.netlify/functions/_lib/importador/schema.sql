-- Schema del importador universal de listas de precios (D1, base
-- lokal-links-importador). Guarda lo que R2-con-JSON no puede: datos
-- chicos y estructurados que se consultan/actualizan seguido. NO guarda
-- productos en sí — esos siguen en data/ofertas.json vía R2, sin cambios.
--
-- Diseño acordado (ver memoria lokal-links-importar-precios-excel-pdf):
-- calibración indexada por huella de estructura de archivo (no por
-- proveedor ni solo por tienda), matches confirmados que se reusan como
-- señal fuerte en la próxima sincronización, historial de cada corrida.

-- Una calibración = el mapeo "columna del archivo → campo del producto"
-- que el dueño confirmó una vez para una estructura de archivo dada.
-- huella = hash de los encabezados normalizados y ordenados (ver
-- huella.js). Clave real de reuso: (tienda_id, huella).
CREATE TABLE IF NOT EXISTS calibraciones (
  id            TEXT PRIMARY KEY,
  tienda_id     TEXT NOT NULL,
  huella        TEXT NOT NULL,
  -- headers_originales: array JSON de los encabezados tal cual venían en
  -- el archivo (para mostrarle al dueño de dónde salió cada mapeo si
  -- vuelve a revisar la calibración).
  headers_originales TEXT NOT NULL,
  -- mapeo: JSON { "nombre_columna_original": "campo_destino" }, campo_destino
  -- es uno de: nombre | precio | precioOriginal | stock | marca | codigoBarra |
  -- skuProveedor | descripcion | ignorar
  mapeo         TEXT NOT NULL,
  creado_en     TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tienda_id, huella)
);
CREATE INDEX IF NOT EXISTS idx_calibraciones_tienda ON calibraciones(tienda_id);

-- Un match confirmado = vínculo entre una fila de un archivo de proveedor
-- (identificada por su señal más fuerte disponible: código de barra, SKU
-- de proveedor, o nombre normalizado si no había nada mejor) y un producto
-- real de la tienda. Una vez que el dueño confirma un match por fuzzy
-- matching, se guarda acá — la próxima sincronización de esa misma fuente
-- ya tiene señal confiable aunque el archivo nunca haya traído un
-- identificador fuerte (ver punto 5 del análisis externo).
CREATE TABLE IF NOT EXISTS matches_confirmados (
  id              TEXT PRIMARY KEY,
  tienda_id       TEXT NOT NULL,
  -- huella_fuente: identifica de qué calibración/fuente viene este match,
  -- para no cruzar matches de un proveedor con los de otro por error.
  huella_fuente   TEXT NOT NULL,
  -- señal_tipo: codigoBarra | skuProveedor | nombreNormalizado
  señal_tipo      TEXT NOT NULL,
  señal_valor     TEXT NOT NULL,
  producto_id     TEXT NOT NULL,
  confirmado_en   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tienda_id, huella_fuente, señal_tipo, señal_valor)
);
CREATE INDEX IF NOT EXISTS idx_matches_lookup ON matches_confirmados(tienda_id, huella_fuente, señal_tipo, señal_valor);

-- Una corrida = una importación ejecutada (primera carga o sincronización
-- posterior). Guarda el resumen para que el dueño pueda ver qué pasó y
-- para que "posibles bajas" pendientes de confirmar no se pierdan si
-- cierra la pantalla.
CREATE TABLE IF NOT EXISTS corridas (
  id              TEXT PRIMARY KEY,
  tienda_id       TEXT NOT NULL,
  huella          TEXT NOT NULL,
  nombre_archivo  TEXT,
  -- estado: calibrando | revisando_matches | revisando_bajas | completada | cancelada
  estado          TEXT NOT NULL DEFAULT 'calibrando',
  -- resumen: JSON { altas: n, actualizados: n, bajasPendientes: [productoId...], sinMatch: [...] }
  resumen         TEXT,
  creado_en       TEXT NOT NULL DEFAULT (datetime('now')),
  completado_en   TEXT,
  FOREIGN KEY (tienda_id, huella) REFERENCES calibraciones(tienda_id, huella)
);
CREATE INDEX IF NOT EXISTS idx_corridas_tienda ON corridas(tienda_id);
