/** Strip control characters and angle brackets from user-supplied text. */
export function sanitizePlainText(value: string, max = 200): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Keep line breaks for email/WhatsApp bodies, still strip control chars and markup. */
export function sanitizeMultiline(value: string, max = 1500): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
    .slice(0, max);
}

export function sanitizeForUrlParam(value: string, max = 400): string {
  return encodeURIComponent(sanitizeMultiline(value, max));
}

/** Escape for HTML email templates that might use triple-stash / unescaped vars. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function htmlSafePlainText(value: string, max = 200): string {
  return escapeHtml(sanitizePlainText(value, max));
}

export function htmlSafeMultiline(value: string, max = 1500): string {
  return escapeHtml(sanitizeMultiline(value, max));
}

export function safeTelHref(phone: string): string | null {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.length < 6) return null;
  return `tel:${cleaned}`;
}

export function safeMailtoHref(email: string): string | null {
  const clean = sanitizePlainText(email, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) return null;
  return `mailto:${encodeURIComponent(clean)}`;
}

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSafeStripePaymentLink(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    return url.hostname === 'buy.stripe.com' || url.hostname.endsWith('.stripe.com');
  } catch {
    return false;
  }
}

export function isSafeWhatsAppUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    return url.hostname === 'wa.me' || url.hostname === 'api.whatsapp.com' || url.hostname === 'whatsapp.com' || url.hostname.endsWith('.whatsapp.com');
  } catch {
    return false;
  }
}
