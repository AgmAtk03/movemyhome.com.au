import assert from 'node:assert/strict';
import test from 'node:test';
import { parseElevenNswDiesel } from './dieselPrice';

test('parses NSW Diesel cents/L from the 11-Seven JSON shape', () => {
  const parsed = parseElevenNswDiesel({
    updated: 1789458904,
    regions: [
      { region: 'All', prices: [{ type: 'Diesel', price: 249.5, name: '11-Seven Bellbird Park', suburb: 'Bellbird Park', state: 'QLD' }] },
      { region: 'NSW', prices: [{ type: 'Diesel', price: 252.9, name: '11-Seven Lansvale South', suburb: 'Lansvale South', state: 'NSW' }] },
    ],
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.centsPerLitre, 252.9);
  assert.equal(parsed.audPerLitre, 2.53);
  assert.equal(parsed.station, '11-Seven Lansvale South');
  assert.equal(parsed.state, 'NSW');
  assert.match(parsed.source, /11-Seven/);
});

test('rejects a payload with no diesel row instead of inventing a price', () => {
  assert.throws(() => parseElevenNswDiesel({ regions: [{ region: 'NSW', prices: [{ type: 'U91', price: 199.9 }] }] }));
});
