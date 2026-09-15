import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGoogleMapsScriptUrl } from './mapsLoader';

test('Maps script URL requests Places for AU and is not loading=async', () => {
  const url = new URL(buildGoogleMapsScriptUrl('test-key'));
  assert.equal(url.origin, 'https://maps.googleapis.com');
  assert.equal(url.pathname, '/maps/api/js');
  assert.equal(url.searchParams.get('key'), 'test-key');
  assert.equal(url.searchParams.get('libraries'), 'places');
  assert.equal(url.searchParams.get('region'), 'AU');
  assert.equal(url.searchParams.get('language'), 'en-AU');
  assert.equal(url.searchParams.get('loading'), null);
  assert.equal(url.searchParams.get('callback'), null);
});
