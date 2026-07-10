const PREFIX = 'lokal-cache:';

export function cacheSet(key, data, ttlMs = 5 * 60 * 1000) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, exp: Date.now() + ttlMs }));
  } catch { /* storage full — ignorar */ }
}

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { data, exp } = JSON.parse(raw);
    if (Date.now() > exp) { localStorage.removeItem(PREFIX + key); return null; }
    return data;
  } catch { return null; }
}

export function cacheClear(key) {
  localStorage.removeItem(PREFIX + key);
}
