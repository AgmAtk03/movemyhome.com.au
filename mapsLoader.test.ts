import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGoogleMapsScriptUrl,
  isGoogleMapsErrorCopy,
  isPlacesApiDeniedStatus,
  isPlacesApiEnabledStatus,
} from './mapsLoader';

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

test('Places probe treats OK / ZERO_RESULTS as enabled and REQUEST_DENIED as ApiNotActivated', () => {
  assert.equal(isPlacesApiEnabledStatus('OK'), true);
  assert.equal(isPlacesApiEnabledStatus('ZERO_RESULTS'), true);
  assert.equal(isPlacesApiEnabledStatus('OVER_QUERY_LIMIT'), true);
  assert.equal(isPlacesApiEnabledStatus('REQUEST_DENIED'), false);
  assert.equal(isPlacesApiDeniedStatus('REQUEST_DENIED'), true);
  assert.equal(isPlacesApiDeniedStatus('OK'), false);
});

test('Google Maps error copy includes the Places “Sorry! Something went wrong.” widget', () => {
  assert.equal(isGoogleMapsErrorCopy('Sorry! Something went wrong.'), true);
  assert.equal(isGoogleMapsErrorCopy('This page can\'t load Google Maps correctly.'), true);
  assert.equal(isGoogleMapsErrorCopy('12 Marrickville Road, Marrickville NSW'), false);
});
