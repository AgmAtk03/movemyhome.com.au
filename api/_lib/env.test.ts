import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { BOOKINGS_INBOX } from '../../shared/rates.js';
import { companyConfig, emailJsMissingVars, isEmailJsServerConfigured } from './env.js';

const KEYS = [
  'VITE_COMPANY_EMAIL',
  'COMPANY_EMAIL',
  'BOOKINGS_EMAIL',
  'EMAILJS_SERVICE_ID',
  'VITE_EMAILJS_SERVICE_ID',
  'EMAILJS_CLIENT_TEMPLATE_ID',
  'VITE_EMAILJS_CLIENT_TEMPLATE_ID',
  'EMAILJS_BUSINESS_TEMPLATE_ID',
  'VITE_EMAILJS_BUSINESS_TEMPLATE_ID',
  'EMAILJS_PUBLIC_KEY',
  'VITE_EMAILJS_PUBLIC_KEY',
  'EMAILJS_PRIVATE_KEY',
  'VITE_EMAILJS_PRIVATE_KEY',
];

function clearEmailEnv() {
  for (const key of KEYS) delete process.env[key];
}

afterEach(() => {
  clearEmailEnv();
});

test('company email falls back to the bookings inbox, not a placeholder', () => {
  clearEmailEnv();
  process.env.VITE_COMPANY_EMAIL = 'YOUR_BOOKINGS_EMAIL';
  assert.equal(companyConfig().email, BOOKINGS_INBOX);
  process.env.VITE_COMPANY_EMAIL = 'office@example.com';
  assert.equal(companyConfig().email, 'office@example.com');
});

test('strips quoted env values and reports missing EmailJS vars on the API host', () => {
  clearEmailEnv();
  process.env.VITE_COMPANY_EMAIL = '"removalsmyhome@gmail.com"';
  assert.equal(companyConfig().email, 'removalsmyhome@gmail.com');
  assert.equal(isEmailJsServerConfigured(), false);
  assert.ok(emailJsMissingVars().some((row) => row.includes('EMAILJS_SERVICE_ID')));
});
