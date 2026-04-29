import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// FROM:
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})

// TO:
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../server/public'
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
