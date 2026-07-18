import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All backend API calls — proxied to avoid CORS in dev
      '/build-startup': {
        target:      'http://127.0.0.1:8000',
        changeOrigin: true,
        // SSE requires no timeout and no response buffering
        timeout:     0,
        proxyTimeout: 0,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Tell FastAPI not to buffer the event-stream
            proxyReq.setHeader('Accept', 'text/event-stream')
            proxyReq.setHeader('Cache-Control', 'no-cache')
          })
        },
      },
      '/export': {
        target:      'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target:      'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
