import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './dist',
    emptyOutDir: true,
  },
  plugins: [vue()],
  server: {
    proxy: {
      '/upload': 'http://localhost:3000/',
      '/files': 'http://localhost:3000/',
      '/edit': 'http://localhost:3000/',
      '/delete': 'http://localhost:3000/',
      '/download': 'http://localhost:3000/',
      '/images': 'http://localhost:3000/',
    }
  }
})
