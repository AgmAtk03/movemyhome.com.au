import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_API_BASE, apiCandidates, apiUrl, isApiJson, resolveApiBase } from './api';

test('API base defaults to the Vercel host', () => {
  assert.equal(resolveApiBase(undefined), DEFAULT_API_BASE);
  assert.equal(resolveApiBase(''), DEFAULT_API_BASE);
  assert.equal(resolveApiBase('  '), DEFAULT_API_BASE);
  assert.equal(resolveApiBase('https://example.com/'), 'https://example.com');
  assert.equal(apiUrl('/api/create-checkout-session'), `${DEFAULT_API_BASE}/api/create-checkout-session`);
  assert.equal(apiUrl('api/verify-checkout-session'), `${DEFAULT_API_BASE}/api/verify-checkout-session`);
});

test('API candidates prefer Vercel, then same-origin last', () => {
  const urls = apiCandidates('/api/create-checkout-session');
  assert.equal(urls[0], `${DEFAULT_API_BASE}/api/create-checkout-session`);
  assert.equal(urls[urls.length - 1], '/api/create-checkout-session');
  assert.ok(urls.includes(`${DEFAULT_API_BASE}/api/create-checkout-session`));
  assert.equal(new Set(urls).size, urls.length);
});

test('fetchApi uses Vercel JSON even when same-origin is HTML 404', async () => {
  const orig = globalThis.fetch;
  const hits: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    hits.push(url);
    if (url.startsWith('/')) {
      return new Response('<!doctype html>', { status: 404, headers: { 'content-type': 'text/html' } });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }) as typeof fetch;
  try {
    const { fetchApi } = await import('./api');
    const res = await fetchApi('/api/create-checkout-session', { method: 'POST' });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(hits[0], `${DEFAULT_API_BASE}/api/create-checkout-session`);
  } finally {
    globalThis.fetch = orig;
  }
});

test('fetchApi skips HTML from Vercel and uses JSON from the next candidate', async () => {
  const orig = globalThis.fetch;
  const hits: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    hits.push(url);
    if (url.startsWith('https://')) {
      return new Response('<!doctype html>', { status: 404, headers: { 'content-type': 'text/html' } });
    }
    return new Response(JSON.stringify({ demoMode: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  try {
    const { fetchApi } = await import('./api');
    const res = await fetchApi('/api/create-checkout-session', { method: 'POST' });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { demoMode: true });
    assert.ok(hits.some((url) => url.startsWith('/')));
  } finally {
    globalThis.fetch = orig;
  }
});

test('fetchApi returns JSON 404 bodies instead of treating them as missing hosts', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ paid: false, error: 'missing' }), {
    status: 404,
    headers: { 'content-type': 'application/json' },
  })) as typeof fetch;
  try {
    const { fetchApi } = await import('./api');
    const res = await fetchApi('/api/verify-checkout-session?session_id=cs_test');
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { paid: false, error: 'missing' });
  } finally {
    globalThis.fetch = orig;
  }
});

test('API JSON content-type detection', () => {
  assert.equal(isApiJson('application/json'), true);
  assert.equal(isApiJson('application/json; charset=utf-8'), true);
  assert.equal(isApiJson('text/html; charset=utf-8'), false);
  assert.equal(isApiJson(null), false);
});
