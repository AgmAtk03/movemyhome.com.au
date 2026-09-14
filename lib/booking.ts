import { CONFIG, isEmailJsConfigured, isWhatsAppConfigured } from '../constants';
import { QuoteSnapshot, QuoteState } from '../types';
import { buildCustomerMessage, buildJobDetailsBody } from './quote';
import { htmlSafeMultiline, htmlSafePlainText, isSafeWhatsAppUrl, sanitizeMultiline, sanitizePlainText } from './sanitize';

declare global {
  interface Window {
    emailjs?: {
      send: (
        serviceId: string,
        templateId: string,
        params: Record<string, string>,
        options?: { publicKey: string }
      ) => Promise<unknown>;
    };
  }
}

export interface BookingEmailResult {
  emailsSent: boolean;
  clientSent: boolean;
  businessSent: boolean;
  demoMode: boolean;
  error?: string;
}

function emailParams(state: QuoteState, snapshot: QuoteSnapshot): Record<string, string> {
  // Strip tags/control chars. EmailJS {{ }} already HTML-escapes in HTML templates.
  return {
    company_name: sanitizePlainText(CONFIG.COMPANY_NAME, 80),
    company_email: sanitizePlainText(CONFIG.COMPANY_EMAIL, 120),
    company_phone: sanitizePlainText(CONFIG.COMPANY_PHONE, 24),
    from_name: sanitizePlainText(state.details.name, 80),
    customer_name: sanitizePlainText(state.details.name, 80),
    user_email: sanitizePlainText(state.details.email, 120),
    to_email: sanitizePlainText(state.details.email, 120),
    user_phone: sanitizePlainText(state.details.phone, 24),
    move_date: sanitizePlainText(snapshot.scheduleLabel, 80),
    move_time: sanitizePlainText(snapshot.scheduleLabel, 80),
    service_type: sanitizePlainText(snapshot.serviceLabel, 80),
    vehicle: sanitizePlainText(snapshot.vehicleLabel, 40),
    crew_size: sanitizePlainText(snapshot.crewLabel, 40),
    total_quote: sanitizePlainText(snapshot.totalLabel, 24),
    inventory: sanitizePlainText(snapshot.inventorySummary, 300),
    route: sanitizeMultiline(snapshot.routeSummary, 600),
    special_instructions: sanitizePlainText(state.details.instructions || 'None', 800),
    distance: sanitizePlainText(snapshot.distanceLabel, 24),
    travel_time: sanitizePlainText(snapshot.travelTimeLabel, 24),
    move_type: sanitizePlainText(snapshot.moveType, 80),
    quote_lines: sanitizeMultiline(snapshot.lines.map((line) => `${line.label}: ${line.note || line.amount}`).join('\n'), 800),
    included: sanitizePlainText(snapshot.included.join(', '), 240),
    job_details: sanitizeMultiline(buildJobDetailsBody(state, snapshot), 2500),
    reply_to: sanitizePlainText(state.details.email, 120),
    job_details_html: htmlSafeMultiline(buildJobDetailsBody(state, snapshot), 2500),
    customer_name_html: htmlSafePlainText(state.details.name, 80),
  };
}

async function sendTemplate(templateId: string, params: Record<string, string>): Promise<void> {
  const emailjs = window.emailjs;
  if (!emailjs) {
    throw new Error('Email service is still loading. Please try again in a moment.');
  }
  await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, templateId, params, {
    publicKey: CONFIG.EMAILJS_PUBLIC_KEY,
  });
}

export async function submitBookingEmails(
  state: QuoteState,
  snapshot: QuoteSnapshot
): Promise<BookingEmailResult> {
  if (!isEmailJsConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { emailsSent: false, clientSent: false, businessSent: false, demoMode: true };
  }

  const params = emailParams(state, snapshot);
  const clientParams = {
    ...params,
    to_email: params.user_email,
    email_kind: 'client',
  };
  const businessParams = {
    ...params,
    to_email: sanitizePlainText(CONFIG.COMPANY_EMAIL, 120),
    email_kind: 'business',
    reply_to: params.user_email,
  };

  let clientSent = false;
  let businessSent = false;
  let lastError = '';

  try {
    await sendTemplate(CONFIG.EMAILJS_BUSINESS_TEMPLATE_ID, businessParams);
    businessSent = true;
  } catch (error) {
    lastError = error instanceof Error ? error.message : 'Could not email our team.';
  }

  try {
    await sendTemplate(CONFIG.EMAILJS_CLIENT_TEMPLATE_ID, clientParams);
    clientSent = true;
  } catch (error) {
    if (!lastError) {
      lastError = error instanceof Error ? error.message : 'Could not email your confirmation.';
    }
  }

  if (!businessSent) {
    return {
      emailsSent: false,
      clientSent,
      businessSent,
      demoMode: false,
      error: lastError || 'We couldn’t send your booking just now. Please try WhatsApp or call us.',
    };
  }

  return {
    emailsSent: clientSent && businessSent,
    clientSent,
    businessSent,
    demoMode: false,
    error: clientSent ? undefined : 'We’ve got your booking, but the confirmation email may be delayed.',
  };
}

export function buildWhatsAppUrl(state: QuoteState, snapshot: QuoteSnapshot): string | null {
  if (!isWhatsAppConfigured()) return null;
  const digits = CONFIG.WHATSAPP_NUMBER.replace(/\D/g, '');
  if (digits.length < 8) return null;
  const text = buildCustomerMessage(state, snapshot);
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  return isSafeWhatsAppUrl(url) ? url : null;
}

export function clientReferenceId(state: QuoteState): string {
  const name = sanitizePlainText(state.details.name, 40).replace(/\s+/g, '-');
  const date = sanitizePlainText(state.details.date || 'tbc', 12);
  return `mhr-${date}-${name}`.slice(0, 180);
}
