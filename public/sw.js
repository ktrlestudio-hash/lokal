// v6: se sube la versión para invalidar el caché de los clientes ya
// instalados — el activate de abajo borra todo lo que no sea CACHE_NAME.
const CACHE_NAME = 'lokal-v6';

// ── Install: precache assets mínimos ─────────────────────────────────────────
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/', '/icon-light.jpg', '/icon-favicon.png'])
    )
  );
});

// ── Activate: limpia caches viejas ───────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Dominios externos que el SW no debe interceptar (los maneja el browser directo)
const PASSTHROUGH = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'apis.google.com',
  'accounts.google.com',
  'googleusercontent.com',
  'firebaseapp.com',
  'googleapis.com',
  'mercadopago.com',
  'nominatim.openstreetmap.org',
  'basemaps.cartocdn.com',
  'api.maptiler.com',
  'images.unsplash.com',
  'unsplash.com',
];

// ── Fetch: network-first, fallback a cache ───────────────────────────────────
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  // Dejar pasar requests a dominios externos sin interceptar
  try {
    const { hostname } = new URL(e.request.url);
    if (PASSTHROUGH.some((d) => hostname === d || hostname.endsWith('.' + d))) return;
  } catch { return; }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && (e.request.destination === 'image' || e.request.destination === 'style' || e.request.destination === 'script')) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── Push: recibe notificación del servidor ───────────────────────────────────
self.addEventListener('push', (e) => {
  let data = { title: 'Lokal', body: 'Tenés una nueva notificación.' };
  try { data = e.data.json(); } catch { /* payload como texto plano */ }

  e.waitUntil(
    self.registration.showNotification(data.title || 'Lokal', {
      body:    data.body    || '',
      icon:    data.icon    || '/icon-light.jpg',
      badge:   data.badge   || '/icon-favicon.png',
      tag:     data.tag     || 'lokal-notif',
      data:    data.url     ? { url: data.url } : {},
      vibrate: [100, 50, 100],
    })
  );
});

// ── Notification click: abre la URL asociada ─────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
