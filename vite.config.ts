import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Базовый путь — важно, если деплой не в корне домена
  base: '/',

  // Proxy только для разработки (localhost)
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // убирает /api из запроса на бэке, если твои роуты без /api
        // rewrite: (path) => path.replace(/^\/api/, ''), // раскомменти, если нужно
        secure: false, // для http localhost
      },
    },
  },

  // Оптимизации для билда (полезно на Render)
  build: {
    outDir: 'dist',          // стандарт, но явно
    sourcemap: true,         // удобно для дебага в проде
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'], // ускоряет билд и кэширование
        },
      },
    },
  },
})