import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command }) => {

  if (command === 'serve') {
    return {
      root: 'demo',
      plugins: [ react() ],
      server: {
        open: true
      }
    };
  }

  // Build configuration
  return {
    plugins: [ react() ],
    build: {
      lib: {
        entry: resolve(__dirname, 'lib/index.jsx'),
        formats: [ 'es' ]
      },
      rollupOptions: {
        external: [ 'react', 'react-dom' ],
      },
      sourcemap: true,
    } };
});
