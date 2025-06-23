import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  root: 'demo',
  plugins: [ react() ],
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