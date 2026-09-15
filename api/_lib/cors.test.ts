import assert from 'node:assert/strict';
import test from 'node:test';
import { isAllowedBrowserOrigin } from './cors';

test('CORS allows apex, www, Netlify, Vercel previews, and localhost', () => {
  assert.equal(isAllowedBrowserOrigin('https://movemyhome.com.au'), true);
  assert.equal(isAllowedBrowserOrigin('https://www.movemyhome.com.au'), true);
  assert.equal(isAllowedBrowserOrigin('https://deploy-preview-8--movemyhome.netlify.app'), true);
  assert.equal(isAllowedBrowserOrigin('https://movemyhome.netlify.app'), true);
  assert.equal(isAllowedBrowserOrigin('https://movemyhome-git-cursor-checkout-pay-details-e831-dristi-astra.vercel.app'), true);
  assert.equal(isAllowedBrowserOrigin('http://localhost:3000'), true);
});

test('CORS rejects other origins', () => {
  assert.equal(isAllowedBrowserOrigin('https://evil.example'), false);
  assert.equal(isAllowedBrowserOrigin('http://movemyhome.com.au'), false);
  assert.equal(isAllowedBrowserOrigin('https://netlify.app'), false);
  assert.equal(isAllowedBrowserOrigin(''), false);
});
