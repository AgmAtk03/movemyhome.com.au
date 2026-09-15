import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_API_BASE, apiUrl, resolveApiBase } from './api';

test('API base defaults to the Vercel host', () => {
  assert.equal(resolveApiBase(undefined), DEFAULT_API_BASE);
  assert.equal(resolveApiBase(''), DEFAULT_API_BASE);
  assert.equal(resolveApiBase('  '), DEFAULT_API_BASE);
  assert.equal(resolveApiBase('https://example.com/'), 'https://example.com');
  assert.equal(apiUrl('/api/create-checkout-session'), `${DEFAULT_API_BASE}/api/create-checkout-session`);
  assert.equal(apiUrl('api/verify-checkout-session'), `${DEFAULT_API_BASE}/api/verify-checkout-session`);
});
