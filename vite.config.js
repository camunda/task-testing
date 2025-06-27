import { defineConfig } from 'vite';
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    libInjectCss(),
    svgr()
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/index.jsx'),
      formats: [ 'es' ]
    },
    rollupOptions: {
      external: [ 'react', 'react-dom' ],
    },
    sourcemap: true
  },
  test: {
    environment: 'jsdom',
    globals: true
  },
});
