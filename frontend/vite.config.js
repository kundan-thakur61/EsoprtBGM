import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
   resolve: {
    alias: {                 // ← this block
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // Your Express backend
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // INCLUDE if your backend routes do NOT start with /api
      },
    },
  },
});
