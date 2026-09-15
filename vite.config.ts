import { defineConfig, type PreviewServer, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

async function dieselJson(): Promise<unknown> {
  const { getDieselPrice } = await import('./api/_lib/dieselPrice.js');
  return getDieselPrice();
}

function dieselPriceHandler() {
  return async (req: { url?: string; method?: string }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b?: string) => void }, next: () => void) => {
    const url = String(req.url || '').split('?')[0];
    if (url !== '/api/diesel-price' && url !== '/api/diesel-price.ts') {
      next();
      return;
    }
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    try {
      const price = await dieselJson();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(price));
    } catch {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        ok: false,
        status: 'tbc',
        reason: 'Could not load the 7-Eleven diesel feed just now.',
      }));
    }
  };
}

/** Serve GET /api/diesel-price in `vite` so fuel is not stuck on TBC locally. Production uses Vercel via the Netlify proxy. */
function dieselPriceDevPlugin() {
  const handler = dieselPriceHandler();
  return {
    name: 'diesel-price-dev',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(({ mode }) => {
  return {
    base: '/',
    plugins: [react(), dieselPriceDevPlugin()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },
    server: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    envPrefix: ['VITE_'],
  };
});
