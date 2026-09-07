import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'GEMINI_']);
  const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';

  return {
    // Relative asset paths so static exports (githack / live-demo) resolve without a domain root.
    base: './',
    plugins: [react()],
    define: {
      // Do not require GEMINI_API_KEY for the marketing/quote wizard to load.
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      'global': 'window'
    },
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
