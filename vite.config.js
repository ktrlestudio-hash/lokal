import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Firebase Auth se importa estático desde Root.jsx (login), así
        // que sin esto vivía mezclado en el chunk raíz — cualquier
        // visitante de una tienda pública lo descargaba aunque nunca fuera
        // a loguearse. Separado en su propio chunk: se cachea aparte y no
        // bloquea la carga inicial de las rutas públicas. Mismo criterio
        // para leaflet/react-leaflet (mapa) y framer-motion (solo en
        // PricingUI.jsx) — pesadas y usadas en una porción acotada de la app.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth'],
          leaflet: ['leaflet', 'react-leaflet'],
          'framer-motion': ['framer-motion'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // host:true — bindea a 0.0.0.0 (IPv4 y IPv6) en vez de solo [::1]. Sin
    // esto, en algunas configuraciones de red de Windows Vite solo escucha
    // en IPv6 loopback y "localhost" desde el navegador (que puede resolver
    // a 127.0.0.1 primero) nunca llega al server, aunque netstat lo muestre
    // LISTENING.
    host: true,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})
