import { CONFIG, isEmailJsConfigured } from '../constants';
import { BOOKINGS_INBOX } from '../shared/rates';
import { sanitizePlainText } from './sanitize';

const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const GAP_MS = 1100;

export interface BrowserEmailResult {
  clientSent: boolean;
  businessSent: boolean;
  skipped: boolean;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendTemplate(templateId: string, params: Record<string, string>): Promise<boolean> {
  const payload = {
    service_id: CONFIG.EMAILJS_SERVICE_ID,
    template_id: templateId,
    user_id: CONFIG.EMAILJS_PUBLIC_KEY,
    template_params: params,
  };
  const response = await fetch(EMAILJS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('Browser EmailJS send failed', { status: response.status, templateId, body: body.slice(0, 200) });
    return false;
  }
  return true;
}

/**
 * Last-resort send from the Netlify-built SPA when the Vercel webhook/notify path
 * could not send. Uses public EmailJS keys baked into the client — never a private key.
 */
export async function sendPaidEmailsFromBrowser(opts: {
  params: Record<string, string>;
  needClient: boolean;
  needBusiness: boolean;
}): Promise<BrowserEmailResult> {
  if (!isEmailJsConfigured()) {
    return { clientSent: !opts.needClient, businessSent: !opts.needBusiness, skipped: true };
  }
  if (!opts.needClient && !opts.needBusiness) {
    return { clientSent: true, businessSent: true, skipped: false };
  }

  const companyEmail = sanitizePlainText(CONFIG.COMPANY_EMAIL || BOOKINGS_INBOX, 120);
  const customerEmail = sanitizePlainText(opts.params.to_email || opts.params.user_email || '', 120);
  let businessSent = !opts.needBusiness;
  let clientSent = !opts.needClient;

  if (opts.needBusiness) {
    businessSent = await sendTemplate(CONFIG.EMAILJS_BUSINESS_TEMPLATE_ID, {
      ...opts.params,
      to_email: companyEmail,
      email: companyEmail,
      recipient: companyEmail,
      email_kind: 'business',
      reply_to: customerEmail,
    });
  }

  if (opts.needClient) {
    if (opts.needBusiness) await wait(GAP_MS);
    clientSent = await sendTemplate(CONFIG.EMAILJS_CLIENT_TEMPLATE_ID, {
      ...opts.params,
      to_email: customerEmail,
      email: customerEmail,
      recipient: customerEmail,
      email_kind: 'client',
      reply_to: customerEmail,
    });
  }

  return { clientSent, businessSent, skipped: false };
}
