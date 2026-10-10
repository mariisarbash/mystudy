import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The app calls the API with same-origin relative paths (`/api/...`).
 * In development there is no backend on the Vite port, so proxy /api to the
 * Express server. In production both are served from one origin, so no proxy
 * and no CORS are involved.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
