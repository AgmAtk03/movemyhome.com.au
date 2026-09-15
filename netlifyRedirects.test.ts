import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PROXY_HOST = 'https://aama-removals.vercel.app/api/:splat';

function firstIndex(haystack: string, needle: string): number {
  const i = haystack.indexOf(needle);
  assert.notEqual(i, -1, `missing ${needle}`);
  return i;
}

test('netlify.toml rewrites /api/* to Vercel before the SPA catch-all', () => {
  const toml = readFileSync(join(ROOT, 'netlify.toml'), 'utf8');
  const apiFrom = firstIndex(toml, 'from = "/api/*"');
  const apiTo = firstIndex(toml, `to = "${PROXY_HOST}"`);
  const spaFrom = firstIndex(toml, 'from = "/*"');
  assert.ok(apiFrom < spaFrom, '/api/* must be declared before /*');
  assert.ok(apiTo < spaFrom, 'Vercel proxy target must sit in the /api rule, not the SPA rule');
  const apiBlock = toml.slice(apiFrom, spaFrom);
  assert.match(apiBlock, /status = 200/);
  assert.match(apiBlock, /force = true/);
});

test('public/_redirects rewrites /api/* to Vercel before the SPA catch-all', () => {
  const redirects = readFileSync(join(ROOT, 'public/_redirects'), 'utf8');
  const api = firstIndex(redirects, '/api/*');
  const proxy = firstIndex(redirects, PROXY_HOST);
  // The SPA line is "/*" after stripping the more specific /api/* occurrence.
  const spaLine = redirects
    .split('\n')
    .find((line) => /^\s*\/\*\s+/.test(line) && !line.includes('/api/*'));
  assert.ok(spaLine, 'SPA /* → /index.html rule is present');
  assert.ok(api < redirects.indexOf(spaLine!), '/api/* must appear before the SPA /* rule');
  assert.ok(proxy < redirects.indexOf(spaLine!), 'Vercel proxy target must sit on the /api rule');
  assert.match(redirects.slice(api, proxy + PROXY_HOST.length + 10), /200!/);
});

test('index.html CSP allows the Vercel API host for checkout fallback', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /connect-src[^"]*https:\/\/aama-removals\.vercel\.app/);
});
