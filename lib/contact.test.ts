import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatAuMobileDisplay,
  telHrefFrom,
  toAuE164,
  whatsAppHrefFrom,
} from './contact';

test('AU mobiles normalise to +61 E.164, local display, tel and wa.me', () => {
  assert.equal(toAuE164('0410 721 370'), '+61410721370');
  assert.equal(toAuE164('61410721370'), '+61410721370');
  assert.equal(toAuE164('+61 410 721 370'), '+61410721370');
  assert.equal(formatAuMobileDisplay('61410721370'), '0410 721 370');
  assert.equal(telHrefFrom('0410 721 370'), 'tel:+61410721370');
  assert.equal(whatsAppHrefFrom('61410721370'), 'https://wa.me/61410721370');
});

test('rejects junk instead of inventing a number', () => {
  assert.equal(toAuE164(''), null);
  assert.equal(telHrefFrom('123'), null);
  assert.equal(whatsAppHrefFrom('not-a-number'), null);
});
