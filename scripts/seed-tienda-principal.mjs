// scripts/seed-tienda-principal.mjs — Crea (o actualiza) la tienda "principal"
// directo en R2, con el módulo Ofertas ya activo, para poder probar
// /t/principal sin pasar por el flujo de registro.
//
// Uso:  node scripts/seed-tienda-principal.mjs
// Lee las credenciales R2 de .env (mismo formato que usan las functions).
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carga simple de .env (sin dependencia de dotenv)
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
const DATA_KEY = 'data/tiendas.json';

if (!process.env.CF_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !BUCKET) {
  console.error('Faltan variables R2 en .env (CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME).');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function readTiendas() {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: DATA_KEY }));
    return JSON.parse(await res.Body.transformToString());
  } catch (err) {
    if (err.Code === 'NoSuchKey' || err.name === 'NoSuchKey') return [];
    throw err;
  }
}

async function writeTiendas(data) {
  await client.send(new PutObjectCommand({
    Bucket: BUCKET, Key: DATA_KEY,
    Body: JSON.stringify(data, null, 2), ContentType: 'application/json',
  }));
}

const SLUG = 'principal';

const NUEVA_TIENDA = {
  id: Date.now(),
  nombre: 'LOKAL',
  slug: SLUG,
  rubros: ['ofertas'],
  descripcion: 'Ofertas y promociones vigentes. Mirá, elegí y compartí.',
  direccion: '',
  ciudad: 'Bovril, Entre Ríos',
  horarios: {},
  telefono: '',
  website: '',
  whatsapp: '543438441188',
  instagram: 'lokal.oficial',
  foto: null, // sin logo propio: usa el símbolo LOKAL por defecto (ver commerce-modern.jsx)
  // Fotos de stock (Unsplash) para probar el carrusel del hero con datos
  // reales — reemplazar por fotos propias cuando existan.
  galeria: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop&q=80',
  ],
  // Coordenadas reales de Bovril, Entre Ríos — el botón "Mapa" del
  // TiendaNavBar y la sección de Ubicación quedan deshabilitados
  // (onAbrirMapa === undefined) si lat/lng son null, por diseño.
  lat: -31.3417,
  lng: -59.4394,
  // Sin owner real: se usa como "seed de prueba local", no como tienda de
  // producción con dueño logueado — no bloquea la lectura pública (GET por
  // slug no exige owner), solo bloquearía escrituras (PATCH/POST) que
  // requieren ensureStoreOwner. Reemplazar googleUid con el uid real del
  // dueño cuando se registre de verdad.
  googleUid: 'seed-local',
  ownerNombre: 'Seed local',
  ownerEmail: 'seed@local.test',
  ownerFoto: null,
  emailContacto: '',
  token: null,
  activa: true,
  // Tienda demo/de prueba: verificada de entrada para que sea visible en
  // público sin pasar por el flujo de aprobación (ese flujo es para tiendas
  // reales registradas por usuarios, ver Root.jsx RegistroTienda).
  verificada: true,
  creadoEn: new Date().toISOString(),
  pagina: {
    template: 'commerce-modern',
    color: '#00B8D9',
    modoOscuro: false,
    secciones: {
      hero:      { activa: true,  orden: 1, label: 'Portada' },
      productos: { activa: false, orden: 2, label: 'Catálogo' },
      horarios:  { activa: true,  orden: 3, label: 'Horarios' },
      contacto:  { activa: true,  orden: 4, label: 'Contacto' },
      galeria:   { activa: false, orden: 5, label: 'Galería' },
      sobre:     { activa: true,  orden: 6, label: 'Sobre nosotros' },
      mapa:      { activa: false, orden: 7, label: 'Ubicación' },
      ofertas:   { activa: true,  orden: 8, label: 'Ofertas' }, // módulo activo
    },
  },
};

(async () => {
  const tiendas = await readTiendas();
  const idx = tiendas.findIndex((t) => t.slug === SLUG);

  if (idx >= 0) {
    tiendas[idx] = { ...tiendas[idx], ...NUEVA_TIENDA, id: tiendas[idx].id, creadoEn: tiendas[idx].creadoEn };
    console.log(`Tienda "${SLUG}" ya existía — actualizada.`);
  } else {
    tiendas.push(NUEVA_TIENDA);
    console.log(`Tienda "${SLUG}" creada.`);
  }

  await writeTiendas(tiendas);
  console.log(`Listo. Probá: http://localhost:8889/t/${SLUG}`);
})().catch((err) => {
  console.error('Error escribiendo en R2:', err.message);
  process.exit(1);
});
