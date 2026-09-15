import { defineConfig, type PreviewServer, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

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

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
        resolve(parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

/**
 * Local member signup + code check so `npm run dev` does not HTML-404
 * and then POST the production Vercel API.
 */
function memberApiDevPlugin() {
  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = String(req.url || '').split('?')[0];
    const isSignup = url === '/api/member-signup' || url === '/api/member-signup.ts';
    const isValidate = url === '/api/validate-member-code' || url === '/api/validate-member-code.ts';
    if (!isSignup && !isValidate) {
      next();
      return;
    }
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    try {
      const body = await readJsonBody(req);
      if (isSignup) {
        const { default: memberSignup } = await import('./api/member-signup.js');
        const fakeReq = { method: 'POST', body, headers: { origin: 'http://localhost:3000' } };
        const fakeRes = {
          status(code: number) {
            res.statusCode = code;
            return fakeRes;
          },
          json(payload: unknown) {
            sendJson(res, res.statusCode || 200, payload);
            return fakeRes;
          },
          setHeader(name: string, value: string) {
            res.setHeader(name, value);
            return fakeRes;
          },
          end() {
            res.end();
            return fakeRes;
          },
        };
        await memberSignup(fakeReq as never, fakeRes as never);
        return;
      }

      const { default: validateMember } = await import('./api/validate-member-code.js');
      const fakeReq = { method: 'POST', body, headers: { origin: 'http://localhost:3000' } };
      const fakeRes = {
        status(code: number) {
          res.statusCode = code;
          return fakeRes;
        },
        json(payload: unknown) {
          sendJson(res, res.statusCode || 200, payload);
          return fakeRes;
        },
        setHeader(name: string, value: string) {
          res.setHeader(name, value);
          return fakeRes;
        },
        end() {
          res.end();
          return fakeRes;
        },
      };
      await validateMember(fakeReq as never, fakeRes as never);
    } catch {
      sendJson(res, 200, { ok: false, error: 'We couldn’t check that code just now. Please try again.' });
    }
  };

  return {
    name: 'member-api-dev',
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
    plugins: [react(), dieselPriceDevPlugin(), memberApiDevPlugin()],
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
