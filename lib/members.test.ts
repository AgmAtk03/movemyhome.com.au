import assert from 'node:assert/strict';
import test from 'node:test';
import { MEMBER_EMAILS_OFF } from './customerCopy';

test('member signup uses fetchApi and surfaces the issued code', async () => {
  const origFetch = globalThis.fetch;
  const origStorage = globalThis.localStorage;
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: () => null,
    length: 0,
  } as Storage;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith('/')) {
      return new Response('<!doctype html>', { status: 200, headers: { 'content-type': 'text/html' } });
    }
    return new Response(JSON.stringify({
      ok: true,
      emailed: true,
      customerEmailed: true,
      businessEmailed: true,
      discountCode: 'STUDENT5-ABCDEFGH',
      message: 'Your 5% off code is STUDENT5-ABCDEFGH. We’ve emailed it to you — enter it when you book your first move.',
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  try {
    const { submitMemberSignup } = await import('./members');
    const result = await submitMemberSignup({ name: 'Sam Nguyen', email: 'sam@student.edu.au' });
    assert.equal(result.ok, true);
    assert.equal(result.discountCode, 'STUDENT5-ABCDEFGH');
    assert.equal(result.customerEmailed, true);
    assert.equal(result.businessEmailed, true);
    assert.match(result.message, /STUDENT5-ABCDEFGH/);
  } finally {
    globalThis.fetch = origFetch;
    globalThis.localStorage = origStorage;
  }
});

test('member signup stays honest when the API is missing', async () => {
  const origFetch = globalThis.fetch;
  const origStorage = globalThis.localStorage;
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: () => null,
    length: 0,
  } as Storage;
  globalThis.fetch = (async () => {
    throw new Error('network');
  }) as typeof fetch;
  try {
    const { submitMemberSignup } = await import('./members');
    const result = await submitMemberSignup({ name: 'Sam Nguyen', email: 'sam@student.edu.au' });
    assert.equal(result.emailed, false);
    assert.equal(result.discountCode, '');
    assert.equal(result.message, MEMBER_EMAILS_OFF);
  } finally {
    globalThis.fetch = origFetch;
    globalThis.localStorage = origStorage;
  }
});
