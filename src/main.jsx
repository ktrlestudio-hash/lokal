import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.jsx'

// Registrar Service Worker (habilita PWA install + push notifications)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
}

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

// Fade out splash after React mounts
requestAnimationFrame(() => {
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.style.opacity = '0';
  splash.addEventListener('transitionend', () => splash.remove(), { once: true });
});
