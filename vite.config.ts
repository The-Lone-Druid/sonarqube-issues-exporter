import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The SPA lives in src/web and is built into dist/web, which the Hono server
// serves at runtime. `base: './'` keeps asset URLs relative to the mount point.
export default defineConfig({
  root: 'src/web',
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../../dist/web',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:7010', changeOrigin: true },
    },
  },
});
