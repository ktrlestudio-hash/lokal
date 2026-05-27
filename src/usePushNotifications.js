import { useState, useEffect } from 'react';

const SW_URL = '/sw.js';

// ── Registra el SW y expone helpers de notificaciones push ───────────────────
export function usePushNotifications() {
  const [swReg, setSwReg]           = useState(null);
  const [permission, setPermission] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  // Registrar SW al montar
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register(SW_URL, { scope: '/' })
      .then((reg) => {
        setSwReg(reg);
        // Detectar actualizaciones silenciosas
        reg.addEventListener('updatefound', () => {
          reg.installing?.addEventListener('statechange', (e) => {
            if (e.target.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión lista — podés mostrar un toast "Hay una actualización"
              window.dispatchEvent(new CustomEvent('lokal:sw-update'));
            }
          });
        });
      })
      .catch((err) => console.warn('[SW] registro fallido:', err));
  }, []);

  // Pedir permiso de notificaciones
  const requestPermission = async () => {
    if (!('Notification' in window)) return 'unsupported';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  // Mostrar una notificación local (sin servidor, para probar)
  const notify = async (title, options = {}) => {
    if (permission !== 'granted') {
      const p = await requestPermission();
      if (p !== 'granted') return;
    }
    if (!swReg) return;
    swReg.showNotification(title, {
      icon:  '/icon-light.jpg',
      badge: '/icon-favicon.png',
      vibrate: [100, 50, 100],
      ...options,
    });
  };

  // Suscribirse a push del servidor (devuelve el objeto PushSubscription para enviar al backend)
  const subscribe = async (vapidPublicKey) => {
    if (!swReg) return null;
    if (permission !== 'granted') {
      const p = await requestPermission();
      if (p !== 'granted') return null;
    }
    try {
      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      return sub;
    } catch (err) {
      console.warn('[Push] suscripción fallida:', err);
      return null;
    }
  };

  return { swReg, permission, requestPermission, notify, subscribe };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
