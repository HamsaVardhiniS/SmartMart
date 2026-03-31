import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/pos': {
        target: 'http://localhost:4005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pos/, '/pos')
      },
      '/api/inventory': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/inventory/, '/inventory')
      },
      '/api/hr': {
        target: 'http://localhost:4003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hr/, '/hr')
      },
      '/api/procurement': {
        target: 'http://localhost:4006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/procurement/, '/procurement')
      },
      '/api/admin': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/admin/, '/admin')
      },
      '/api/analytics': {
        target: 'http://localhost:4002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/analytics/, '/analytics')
      }
    }
  }
})
