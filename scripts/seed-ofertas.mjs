// scripts/seed-ofertas.mjs — Crea ofertas de prueba (con fotos reales de
// stock) para la tienda "principal", para ver las cards del módulo Ofertas
// y probar la pantalla individual /o/principal/:slug con datos reales.
//
// Uso: node scripts/seed-ofertas.mjs  (correr DESPUÉS de seed-tienda-principal.mjs)
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, '..', '.env');
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnv();

const BUCKET = process.env.R2_BUCKET_NAME;
const TIENDAS_KEY = 'data/tiendas.json';
const OFERTAS_KEY = 'data/ofertas.json';

if (!process.env.CF_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !BUCKET) {
  console.error('Faltan variables R2 en .env.');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

async function readJson(key) {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return JSON.parse(await res.Body.transformToString());
  } catch (err) {
    if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return [];
    throw err;
  }
}
async function writeJson(key, data) {
  await client.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: JSON.stringify(data, null, 2), ContentType: 'application/json' }));
}

function generateSlug(nombre) {
  return String(nombre)
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'oferta';
}

const OFERTAS_MOCK = [
  { nombre: 'Promo Aceite', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&h=1131&fit=crop&q=80' },
  { nombre: 'Combo Bebidas', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=1131&fit=crop&q=80' },
  { nombre: 'Ofertón Limpieza', img: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&h=1131&fit=crop&q=80' },
  { nombre: 'Descuento Fin de Semana', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=1131&fit=crop&q=80' },
];

(async () => {
  const tiendas = await readJson(TIENDAS_KEY);
  const tienda = tiendas.find((t) => t.slug === 'principal');
  if (!tienda) {
    console.error('No existe la tienda "principal" — corré primero: node scripts/seed-tienda-principal.mjs');
    process.exit(1);
  }

  const ofertas = await readJson(OFERTAS_KEY);
  const now = new Date();

  OFERTAS_MOCK.forEach((mock, i) => {
    const slug = generateSlug(mock.nombre);
    const existe = ofertas.some((o) => String(o.tiendaId) === String(tienda.id) && o.slug === slug);
    if (existe) return;

    ofertas.unshift({
      id: `oferta_seed_${Date.now()}_${i}`,
      tiendaId: tienda.id,
      nombre: mock.nombre,
      slug,
      imageUrl: mock.img,
      thumbUrl: mock.img.replace('w=800&h=1131', 'w=400&h=566'),
      publishAt: now.toISOString(),
      expireAt: null,
      visible: true,
      views: Math.floor(Math.random() * 40),
      uniques: Math.floor(Math.random() * 20),
      lastVisit: null,
      createdAt: now.toISOString(),
    });
  });

  await writeJson(OFERTAS_KEY, ofertas);
  console.log(`${OFERTAS_MOCK.length} ofertas mock aseguradas para la tienda "principal".`);
  console.log(`Probá: http://localhost:8889/t/principal`);
  console.log(`Y la vista individual: http://localhost:8889/o/principal/${generateSlug(OFERTAS_MOCK[0].nombre)}`);
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
