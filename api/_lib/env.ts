import { BOOKINGS_INBOX, BRAND_NAME } from '../../shared/rates.js';

function read(name: string): string {
  let value = String(process.env[name] ?? '').trim();
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2)
    || (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function firstEnv(...names: string[]): string {
  for (const name of names) {
    const value = read(name);
    if (value) return value;
  }
  return '';
}

function isUsableEmail(value: string): boolean {
  if (!value || value.includes('YOUR_')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isSecretLike(value: string): boolean {
  return /^(sk_|rk_|whsec_)/.test(value);
}

export function stripeSecretKey(): string {
  const key = read('STRIPE_SECRET_KEY');
  if (key.startsWith('pk_')) {
    throw new Error('STRIPE_SECRET_KEY must be a secret key (sk_…), not a publishable key.');
  }
  return key;
}

export function stripeWebhookSecret(): string {
  return read('STRIPE_WEBHOOK_SECRET');
}

export function isStripeConfigured(): boolean {
  const key = read('STRIPE_SECRET_KEY');
  return Boolean(key) && key.startsWith('sk_') && !key.includes('YOUR_');
}

export function isStripeWebhookConfigured(): boolean {
  const secret = stripeWebhookSecret();
  return Boolean(secret) && secret.startsWith('whsec_');
}

export function publicSiteUrl(reqHost?: string | null, proto?: string | null): string {
  const explicit = read('PUBLIC_SITE_URL') || read('VITE_PUBLIC_SITE_URL');
  if (explicit) return explicit.replace(/\/$/, '');
  const vercelProd = read('VERCEL_PROJECT_PRODUCTION_URL');
  if (vercelProd) return `https://${vercelProd.replace(/^https?:\/\//, '')}`;
  const vercel = read('VERCEL_URL');
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`;
  if (reqHost) {
    const scheme = proto === 'http' ? 'http' : 'https';
    return `${scheme}://${reqHost}`.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

export function companyConfig() {
  const email = firstEnv('VITE_COMPANY_EMAIL', 'COMPANY_EMAIL', 'BOOKINGS_EMAIL');
  return {
    name: firstEnv('VITE_COMPANY_NAME', 'COMPANY_NAME') || BRAND_NAME,
    legalName: read('VITE_LEGAL_TRADING_NAME') || 'YOUR_LEGAL_TRADING_NAME',
    email: isUsableEmail(email) ? email : BOOKINGS_INBOX,
    phone: read('VITE_COMPANY_PHONE') || '0410 721 370',
    website: read('VITE_COMPANY_WEBSITE') || 'https://YOUR_WEBSITE',
  };
}

export function emailJsConfig() {
  const privateKey = firstEnv('EMAILJS_PRIVATE_KEY', 'VITE_EMAILJS_PRIVATE_KEY');
  if (read('VITE_EMAILJS_PRIVATE_KEY') && !read('EMAILJS_PRIVATE_KEY')) {
    console.error('EmailJS private key is set as VITE_EMAILJS_PRIVATE_KEY; use EMAILJS_PRIVATE_KEY on Vercel (server-only, no VITE_ prefix).');
  }
  return {
    serviceId: firstEnv('EMAILJS_SERVICE_ID', 'VITE_EMAILJS_SERVICE_ID'),
    clientTemplateId: firstEnv('EMAILJS_CLIENT_TEMPLATE_ID', 'VITE_EMAILJS_CLIENT_TEMPLATE_ID'),
    businessTemplateId: firstEnv('EMAILJS_BUSINESS_TEMPLATE_ID', 'VITE_EMAILJS_BUSINESS_TEMPLATE_ID'),
    publicKey: firstEnv('EMAILJS_PUBLIC_KEY', 'VITE_EMAILJS_PUBLIC_KEY'),
    privateKey,
  };
}

function looksUnset(value: string, tokens: string[]): boolean {
  if (!value) return true;
  return tokens.some((token) => value.includes(token));
}

export function emailJsMissingVars(): string[] {
  const cfg = emailJsConfig();
  const missing: string[] = [];
  if (looksUnset(cfg.serviceId, ['YOUR_ID'])) missing.push('EMAILJS_SERVICE_ID (or VITE_EMAILJS_SERVICE_ID)');
  if (looksUnset(cfg.publicKey, ['YOUR_PUBLIC_KEY']) || isSecretLike(cfg.publicKey)) {
    missing.push('EMAILJS_PUBLIC_KEY (or VITE_EMAILJS_PUBLIC_KEY)');
  }
  if (looksUnset(cfg.clientTemplateId, ['CLIENT_ID', 'YOUR_ID'])) {
    missing.push('EMAILJS_CLIENT_TEMPLATE_ID (or VITE_EMAILJS_CLIENT_TEMPLATE_ID)');
  }
  if (looksUnset(cfg.businessTemplateId, ['BUSINESS_ID', 'YOUR_ID'])) {
    missing.push('EMAILJS_BUSINESS_TEMPLATE_ID (or VITE_EMAILJS_BUSINESS_TEMPLATE_ID)');
  }
  if (!cfg.privateKey) missing.push('EMAILJS_PRIVATE_KEY');
  return missing;
}

export function isEmailJsServerConfigured(): boolean {
  const cfg = emailJsConfig();
  if (looksUnset(cfg.serviceId, ['YOUR_ID'])) return false;
  if (looksUnset(cfg.publicKey, ['YOUR_PUBLIC_KEY']) || isSecretLike(cfg.publicKey)) return false;
  if (looksUnset(cfg.clientTemplateId, ['CLIENT_ID', 'YOUR_ID'])) return false;
  if (looksUnset(cfg.businessTemplateId, ['BUSINESS_ID', 'YOUR_ID'])) return false;
  return true;
}

/** Server-side EmailJS needs the private key when “Use Private Key” is on (recommended). */
export function isEmailJsReadyToSend(): boolean {
  return isEmailJsServerConfigured() && Boolean(emailJsConfig().privateKey);
}
