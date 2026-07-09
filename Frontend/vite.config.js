import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Person C's useSSE.js uses API_BASE = 'http://localhost:8000' directly,
      // so no proxy path rewriting needed — just ensure CORS is open on backend.
      // These proxy rules allow running frontend on 5173 calling backend on 8000.
      '/build-startup': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/export': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
