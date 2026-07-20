import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
