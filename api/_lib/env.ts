import { BRAND_NAME } from '../../shared/rates.js';

/** Production bookings inbox. Server mail uses this if VITE_COMPANY_EMAIL is unset. */
export const BOOKINGS_INBOX = 'removalsmyhome@gmail.com';

function read(name: string): string {
  return String(process.env[name] ?? '').trim();
}

function isSecretLike(value: string): boolean {
  return /^(sk_|rk_|whsec_)/.test(value);
}

function isPlaceholderEmail(value: string): boolean {
  return !value || !value.includes('@') || value.includes('YOUR_');
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

export function bookingsInbox(): string {
  const fromEnv = read('VITE_COMPANY_EMAIL') || read('BOOKINGS_INBOX');
  if (!isPlaceholderEmail(fromEnv)) return fromEnv;
  return BOOKINGS_INBOX;
}

export function companyConfig() {
  return {
    name: read('VITE_COMPANY_NAME') || BRAND_NAME,
    legalName: read('VITE_LEGAL_TRADING_NAME') || 'YOUR_LEGAL_TRADING_NAME',
    email: bookingsInbox(),
    phone: read('VITE_COMPANY_PHONE') || '0410 721 370',
    website: read('VITE_COMPANY_WEBSITE') || 'https://YOUR_WEBSITE',
  };
}

export function emailJsConfig() {
  return {
    serviceId: read('EMAILJS_SERVICE_ID') || read('VITE_EMAILJS_SERVICE_ID'),
    clientTemplateId: read('EMAILJS_CLIENT_TEMPLATE_ID') || read('VITE_EMAILJS_CLIENT_TEMPLATE_ID'),
    businessTemplateId: read('EMAILJS_BUSINESS_TEMPLATE_ID') || read('VITE_EMAILJS_BUSINESS_TEMPLATE_ID'),
    publicKey: read('EMAILJS_PUBLIC_KEY') || read('VITE_EMAILJS_PUBLIC_KEY'),
    privateKey: read('EMAILJS_PRIVATE_KEY'),
  };
}

export function memberCodeSecret(): string {
  return read('MEMBER_CODE_SECRET') || read('EMAILJS_PRIVATE_KEY');
}

export function emailJsMissingVars(): string[] {
  const cfg = emailJsConfig();
  const missing: string[] = [];
  if (!cfg.serviceId || cfg.serviceId.includes('YOUR_ID')) missing.push('EMAILJS_SERVICE_ID');
  if (!cfg.publicKey || cfg.publicKey.includes('YOUR_PUBLIC_KEY')) missing.push('EMAILJS_PUBLIC_KEY');
  if (!cfg.clientTemplateId || cfg.clientTemplateId.includes('CLIENT_ID') || cfg.clientTemplateId.includes('YOUR_ID')) {
    missing.push('EMAILJS_CLIENT_TEMPLATE_ID');
  }
  if (!cfg.businessTemplateId || cfg.businessTemplateId.includes('BUSINESS_ID') || cfg.businessTemplateId.includes('YOUR_ID')) {
    missing.push('EMAILJS_BUSINESS_TEMPLATE_ID');
  }
  if (cfg.publicKey && isSecretLike(cfg.publicKey)) missing.push('EMAILJS_PUBLIC_KEY (must not be sk_/rk_/whsec_)');
  return missing;
}

export function isEmailJsServerConfigured(): boolean {
  return emailJsMissingVars().length === 0;
}

/** Member 5% mail reuses the two paid templates (EmailJS Hobby allows only two). */
export function isMemberEmailConfigured(): boolean {
  return isEmailJsServerConfigured();
}
