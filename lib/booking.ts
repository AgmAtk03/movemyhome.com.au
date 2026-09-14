import { CONFIG, isEmailJsConfigured, isWhatsAppConfigured } from '../constants';
import { QuoteSnapshot, QuoteState } from '../types';
import { buildCustomerMessage, buildJobDetailsBody } from './quote';
import { sanitizePlainText } from './sanitize';

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
  return {
    company_name: CONFIG.COMPANY_NAME,
    company_email: CONFIG.COMPANY_EMAIL,
    company_phone: CONFIG.COMPANY_PHONE,
    from_name: sanitizePlainText(state.details.name, 80),
    customer_name: sanitizePlainText(state.details.name, 80),
    user_email: sanitizePlainText(state.details.email, 120),
    to_email: sanitizePlainText(state.details.email, 120),
    user_phone: sanitizePlainText(state.details.phone, 24),
    move_date: snapshot.scheduleLabel,
    move_time: snapshot.scheduleLabel,
    service_type: snapshot.serviceLabel,
    vehicle: snapshot.vehicleLabel,
    crew_size: snapshot.crewLabel,
    total_quote: snapshot.totalLabel,
    inventory: snapshot.inventorySummary,
    route: snapshot.routeSummary,
    special_instructions: sanitizePlainText(state.details.instructions || 'None', 800),
    distance: snapshot.distanceLabel,
    travel_time: snapshot.travelTimeLabel,
    move_type: snapshot.moveType,
    quote_lines: snapshot.lines.map((line) => `${line.label}: ${line.note || line.amount}`).join('\n'),
    included: snapshot.included.join(', '),
    job_details: buildJobDetailsBody(state, snapshot),
    reply_to: sanitizePlainText(state.details.email, 120),
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
    to_email: CONFIG.COMPANY_EMAIL,
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
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
