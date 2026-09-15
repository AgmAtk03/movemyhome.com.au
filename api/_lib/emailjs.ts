import type { QuoteSnapshot, QuoteState } from '../../types.js';
import { sanitizePlainText } from '../../lib/sanitize.js';
import { buildPaidEmailTemplateParams } from '../../shared/emailParams.js';
import { BOOKINGS_INBOX } from '../../shared/rates.js';
import { companyConfig, emailJsConfig, emailJsMissingVars, isEmailJsServerConfigured } from './env.js';

export interface EmailSendResult {
  clientSent: boolean;
  businessSent: boolean;
  skipped: boolean;
  error?: string;
}

const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const DEFAULT_GAP_MS = 1100;

function wait(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class EmailJsSendError extends Error {
  status: number;
  body: string;
  templateId: string;

  constructor(status: number, body: string, templateId: string) {
    super(`EmailJS ${status}${body ? `: ${body.slice(0, 180)}` : ''}`);
    this.name = 'EmailJsSendError';
    this.status = status;
    this.body = body.slice(0, 500);
    this.templateId = templateId;
  }
}

async function sendTemplate(templateId: string, params: Record<string, string>): Promise<void> {
  const cfg = emailJsConfig();
  const payload: Record<string, unknown> = {
    service_id: cfg.serviceId || 'default_service',
    template_id: templateId,
    user_id: cfg.publicKey,
    template_params: params,
  };
  if (cfg.privateKey) {
    payload.accessToken = cfg.privateKey;
  }

  const response = await fetch(EMAILJS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await response.text().catch(() => '');
  if (!response.ok) {
    console.error('EmailJS send failed', {
      status: response.status,
      templateId,
      body: text.slice(0, 300),
      hasPrivateKey: Boolean(cfg.privateKey),
    });
    throw new EmailJsSendError(response.status, text, templateId);
  }
}

async function sendTemplateWithRetry(templateId: string, params: Record<string, string>, gapMs: number): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await sendTemplate(templateId, params);
      return;
    } catch (error) {
      lastError = error;
      const status = error instanceof EmailJsSendError ? error.status : 0;
      const retryable = status === 429 || status >= 500 || status === 0;
      if (!retryable || attempt === 3) break;
      await wait(Math.max(gapMs, 1100) * attempt);
    }
  }
  throw lastError;
}

export function paidBookingEmailParams(
  state: QuoteState,
  snapshot: QuoteSnapshot,
  payment: { sessionId: string; paymentIntentId: string },
): Record<string, string> {
  return buildPaidEmailTemplateParams(state, snapshot, companyConfig(), {
    stripe_session_id: sanitizePlainText(payment.sessionId, 80),
    stripe_payment_intent: sanitizePlainText(payment.paymentIntentId, 80),
    payment_status: 'deposit_paid',
  });
}

export async function sendPaidBookingEmails(
  state: QuoteState,
  snapshot: QuoteSnapshot,
  payment: { sessionId: string; paymentIntentId: string },
  options: { gapMs?: number; skipClient?: boolean; skipBusiness?: boolean } = {},
): Promise<EmailSendResult> {
  const gapMs = options.gapMs ?? DEFAULT_GAP_MS;

  if (!isEmailJsServerConfigured()) {
    const missing = emailJsMissingVars().join(', ');
    const error = `EmailJS is not configured on the API host (missing ${missing}). Set these on Vercel Production — Netlify VITE_* values are not visible to /api.`;
    console.error(error, { sessionId: payment.sessionId });
    return { clientSent: false, businessSent: false, skipped: true, error };
  }

  const cfg = emailJsConfig();
  if (!cfg.privateKey) {
    console.error('EMAILJS_PRIVATE_KEY is missing on the API host; server sends often fail until it is set on Vercel.', {
      sessionId: payment.sessionId,
    });
  }

  const params = paidBookingEmailParams(state, snapshot, payment);
  const companyEmail = sanitizePlainText(companyConfig().email || BOOKINGS_INBOX, 120);
  const customerEmail = sanitizePlainText(state.details.email, 120);

  let clientSent = Boolean(options.skipClient);
  let businessSent = Boolean(options.skipBusiness);
  const errors: string[] = [];

  if (!businessSent) {
    try {
      await sendTemplateWithRetry(cfg.businessTemplateId, {
        ...params,
        to_email: companyEmail,
        email: companyEmail,
        recipient: companyEmail,
        email_kind: 'business',
        reply_to: customerEmail,
      }, gapMs);
      businessSent = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'business email failed';
      errors.push(message);
      console.error('Business job-sheet email failed', { sessionId: payment.sessionId, error: message });
    }
  }

  if (!clientSent) {
    if (businessSent && !options.skipBusiness) {
      await wait(gapMs);
    }
    try {
      await sendTemplateWithRetry(cfg.clientTemplateId, {
        ...params,
        to_email: customerEmail,
        email: customerEmail,
        recipient: customerEmail,
        email_kind: 'client',
        reply_to: customerEmail,
      }, gapMs);
      clientSent = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'customer email failed';
      errors.push(message);
      console.error('Customer confirmation email failed', { sessionId: payment.sessionId, error: message });
    }
  }

  return {
    clientSent,
    businessSent,
    skipped: false,
    error: errors.length ? errors.join(' | ') : undefined,
  };
}
