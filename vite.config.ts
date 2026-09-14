import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    base: './',
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
      'global': 'window',
    },
    server: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    envPrefix: 'VITE_',
  };
});
