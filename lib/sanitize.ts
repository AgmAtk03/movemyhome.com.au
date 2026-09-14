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
