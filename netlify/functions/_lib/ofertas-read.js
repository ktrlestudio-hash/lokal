// _lib/ofertas-read.js — lectura compartida de data/ofertas.json.
//
// Extraído de ofertas.js para que otros módulos (carrito.js necesita
// validar/repricear ítems contra el catálogo real) puedan leer el mismo
// archivo sin duplicar la lógica R2-vs-local ni importar el handler entero.
// Solo lectura: la escritura sigue siendo responsabilidad exclusiva de
// ofertas.js (es el único que conoce las reglas de sanitización/auth para
// crear o modificar una oferta/producto).
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const LOCAL_FILE = join('/tmp', 'lokal-ofertas.json');
const DATA_KEY = 'data/ofertas.json';
const BUCKET = process.env.R2_BUCKET_NAME;

function isR2Configured() {
  return !!(
    process.env.CF_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function readOfertas() {
  if (isR2Configured()) {
    try {
      const res = await getR2Client().send(new GetObjectCommand({ Bucket: BUCKET, Key: DATA_KEY }));
      return JSON.parse(await res.Body.transformToString());
    } catch (err) {
      if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return [];
      throw err;
    }
  }
  if (!existsSync(LOCAL_FILE)) return [];
  return JSON.parse(readFileSync(LOCAL_FILE, 'utf8'));
}

// Solo las de ESA tienda que además tienen precio (o sea, son "producto de
// catálogo", no una oferta simple sin precio) — un carrito no debería poder
// agregar una oferta-galería sin precio como si fuera un producto comprable.
export async function readOfertasParaCarrito(tiendaId) {
  const ofertas = await readOfertas();
  return ofertas.filter((o) => String(o.tiendaId) === String(tiendaId) && typeof o.precio === 'number');
}
