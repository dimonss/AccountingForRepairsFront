import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/repairs_accounting/',
  server: {
    host: true,
    port: 5173,
    open: false,
    proxy: {
      '/photos': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
