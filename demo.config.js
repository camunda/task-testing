import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  root: 'demo',
  plugins: [ react(), svgr() ],
  build: {
    outDir: 'public',
    emptyOutDir: true,
  },
  server: {
    open: true
  },
  test: {
    globals: true,
  },
});