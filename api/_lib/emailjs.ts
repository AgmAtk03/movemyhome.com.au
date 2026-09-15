import type { QuoteSnapshot, QuoteState } from '../../types.js';
import { htmlSafeMultiline, htmlSafePlainText, sanitizeMultiline, sanitizePlainText } from '../../lib/sanitize.js';
import { buildJobDetailsBody } from '../../shared/snapshot.js';
import { BRAND_NAME } from '../../shared/rates.js';
import { companyConfig, emailJsConfig, emailJsMissingVars, isEmailJsServerConfigured, isMemberEmailConfigured } from './env.js';

export interface EmailSendResult {
  clientSent: boolean;
  businessSent: boolean;
  skipped: boolean;
  error?: string;
}

export class EmailJsSendError extends Error {
  status: number;
  body: string;
  templateId: string;
  hint: string;

  constructor(status: number, body: string, templateId: string) {
    const hint = sanitizeEmailJsHint(status, body);
    super(hint);
    this.name = 'EmailJsSendError';
    this.status = status;
    this.body = String(body || '').slice(0, 500);
    this.templateId = templateId;
    this.hint = hint;
  }
}

/** Safe diagnostic line for logs / temporary member-signup JSON. Never includes keys. */
export function sanitizeEmailJsHint(status: number, body: string): string {
  let text = String(body || '')
    .replace(/(?:accessToken|privateKey|publicKey|user_id|EMAILJS_[A-Z_]+)\s*[:=]\s*["']?[^"'}\s,]+/gi, '[redacted]')
    .replace(/\b(?:sk_|rk_|whsec_)[A-Za-z0-9_-]+/gi, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
  if (/non-browser/i.test(text)) {
    text = `${text} Enable Account → Security → Allow EmailJS API for non-browser applications.`;
  } else if (/private key|access.?token/i.test(text)) {
    text = `${text} Set EMAILJS_PRIVATE_KEY on Vercel (REST field accessToken).`;
  }
  return text ? `EmailJS ${status}: ${text}` : `EmailJS ${status}`;
}

const DEFAULT_GAP_MS = 1100;

function wait(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface MemberEmailSendResult {
  customerSent: boolean;
  businessSent: boolean;
  skipped: boolean;
  error?: string;
}

const PAID_BUSINESS_SUBJECT = 'New booking — 10% deposit paid';
const MEMBER_CUSTOMER_SUBJECT = 'Your 5% student discount code';
const MEMBER_BUSINESS_SUBJECT = 'New member 5% signup';

function joinedAddresses(addresses: string[] | undefined): string {
  return sanitizePlainText((addresses || []).filter(Boolean).join(' | '), 200);
}

function paidClientEmailSubject(snapshot: QuoteSnapshot): string {
  const company = sanitizePlainText(companyConfig().name || BRAND_NAME, 80);
  const datePart = snapshot.scheduleLabel.split(',')[0]?.trim() || '';
  if (datePart && datePart !== 'Time still to confirm') {
    return sanitizePlainText(`Booking confirmed — ${company} — ${datePart}`, 120);
  }
  return sanitizePlainText(`Booking confirmed — ${company}`, 120);
}

/** Paid booking confirmation + job sheet. Do not drop any of these fields. */
function templateParams(state: QuoteState, snapshot: QuoteSnapshot, extra: Record<string, string> = {}): Record<string, string> {
  const company = companyConfig();
  const phone = sanitizePlainText(state.details.phone, 24);
  const pickup = joinedAddresses(snapshot.pickupAddresses);
  const dropoff = joinedAddresses(snapshot.dropoffAddresses);
  return {
    company_name: sanitizePlainText(company.name, 80),
    company_email: sanitizePlainText(company.email, 120),
    company_phone: sanitizePlainText(company.phone, 24),
    from_name: sanitizePlainText(state.details.name, 80),
    customer_name: sanitizePlainText(state.details.name, 80),
    user_email: sanitizePlainText(state.details.email, 120),
    to_email: sanitizePlainText(state.details.email, 120),
    user_phone: phone,
    phone,
    customer_phone: phone,
    pickup_address: pickup,
    dropoff_address: dropoff,
    move_date: sanitizePlainText(snapshot.scheduleLabel, 80),
    move_time: sanitizePlainText(snapshot.scheduleLabel, 80),
    service_type: sanitizePlainText(snapshot.serviceLabel, 80),
    vehicle: sanitizePlainText(snapshot.vehicleLabel, 40),
    crew_size: sanitizePlainText(snapshot.crewLabel, 40),
    total_quote: sanitizePlainText(snapshot.totalLabel, 24),
    deposit_amount: sanitizePlainText(snapshot.depositLabel, 24),
    balance_amount: sanitizePlainText(snapshot.balanceLabel, 24),
    inventory: sanitizePlainText(snapshot.inventorySummary, 300),
    route: sanitizeMultiline(snapshot.routeSummary, 500),
    special_instructions: sanitizePlainText(state.details.instructions || 'None', 500),
    distance: sanitizePlainText(snapshot.distanceLabel, 24),
    travel_time: sanitizePlainText(snapshot.travelTimeLabel, 24),
    move_type: sanitizePlainText(snapshot.moveType, 80),
    quote_lines: sanitizeMultiline(snapshot.lines.map((line) => `${line.label}: ${line.note || line.amount}`).join('\n'), 800),
    included: sanitizePlainText(snapshot.included.join(', '), 240),
    job_details: sanitizeMultiline(buildJobDetailsBody(state, snapshot), 2500),
    reply_to: sanitizePlainText(state.details.email, 120),
    job_details_html: htmlSafeMultiline(buildJobDetailsBody(state, snapshot), 2500),
    customer_name_html: htmlSafePlainText(state.details.name, 80),
    discount_code: sanitizePlainText(snapshot.memberDiscountCode || state.discountCode || '', 32),
    member_discount: sanitizePlainText(snapshot.memberDiscountLabel || '', 24),
    quote_subtotal: sanitizePlainText(snapshot.subtotalLabel || '', 24),
    ...extra,
  };
}

async function sendTemplate(templateId: string, params: Record<string, string>): Promise<void> {
  const cfg = emailJsConfig();
  const payload: Record<string, unknown> = {
    service_id: cfg.serviceId,
    template_id: templateId,
    user_id: cfg.publicKey,
    template_params: params,
  };
  // EmailJS REST: private key MUST be `accessToken` (not privateKey / Authorization).
  if (cfg.privateKey) {
    payload.accessToken = cfg.privateKey;
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await response.text().catch(() => '');
  if (!response.ok) {
    const err = new EmailJsSendError(response.status, text, templateId);
    console.error('EmailJS send failed', {
      status: response.status,
      body: text.slice(0, 300),
      hint: err.hint,
      service_id: cfg.serviceId || '(empty)',
      template_id: templateId,
      has_user_id: Boolean(cfg.publicKey),
      has_accessToken: Boolean(cfg.privateKey),
    });
    throw err;
  }
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
    const error = `EmailJS is not configured on the API host (missing ${missing || 'keys'}).`;
    console.error(error, { sessionId: payment.sessionId });
    return {
      clientSent: Boolean(options.skipClient),
      businessSent: Boolean(options.skipBusiness),
      skipped: true,
      error,
    };
  }

  const cfg = emailJsConfig();
  if (!cfg.privateKey) {
    console.error('EMAILJS_PRIVATE_KEY is missing on the API host; REST sends need accessToken if Account → Security uses a Private Key', {
      sessionId: payment.sessionId,
    });
  }
  const params = templateParams(state, snapshot, {
    stripe_session_id: sanitizePlainText(payment.sessionId, 80),
    stripe_payment_intent: sanitizePlainText(payment.paymentIntentId, 80),
    payment_status: 'deposit_paid',
  });

  let clientSent = Boolean(options.skipClient);
  let businessSent = Boolean(options.skipBusiness);
  const errors: string[] = [];

  if (!businessSent) {
    try {
      await sendTemplate(cfg.businessTemplateId, {
        ...params,
        to_email: sanitizePlainText(companyConfig().email, 120),
        email_kind: 'business',
        email_subject: sanitizePlainText(PAID_BUSINESS_SUBJECT, 120),
      });
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
      await sendTemplate(cfg.clientTemplateId, {
        ...params,
        to_email: params.user_email,
        email_kind: 'client',
        email_subject: paidClientEmailSubject(snapshot),
      });
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

/**
 * Empty values for booking {{}} fields on the shared EmailJS templates.
 * Do not invent fake move dates, vehicles, addresses, or quote totals —
 * that would look like a broken booking confirmation.
 */
function emptyBookingTemplateFields(): Record<string, string> {
  return {
    user_phone: '',
    phone: '',
    customer_phone: '',
    pickup_address: '',
    dropoff_address: '',
    move_date: '',
    move_time: '',
    service_type: '',
    vehicle: '',
    crew_size: '',
    total_quote: '',
    deposit_amount: '',
    balance_amount: '',
    inventory: '',
    route: '',
    distance: '',
    travel_time: '',
    move_type: '',
    quote_lines: '',
    included: '',
    stripe_session_id: '',
    stripe_payment_intent: '',
    payment_status: '',
    member_discount: '',
    quote_subtotal: '',
  };
}

function memberDiscountTemplateParams(input: {
  name: string;
  email: string;
  discountCode: string;
  toEmail: string;
  replyTo: string;
  jobDetails: string;
  specialInstructions: string;
  emailSubject: string;
}): Record<string, string> {
  const company = companyConfig();
  const name = sanitizePlainText(input.name, 80);
  const email = sanitizePlainText(input.email, 120);
  const code = sanitizePlainText(input.discountCode, 32);
  const office = sanitizePlainText(company.email, 120);
  return {
    ...emptyBookingTemplateFields(),
    company_name: sanitizePlainText(company.name || BRAND_NAME, 80),
    company_email: office,
    company_phone: sanitizePlainText(company.phone, 24),
    from_name: name,
    customer_name: name,
    customer_name_html: htmlSafePlainText(name, 80),
    user_email: email,
    to_email: sanitizePlainText(input.toEmail, 120),
    discount_code: code,
    offer_label: '5% off your first move',
    email_kind: 'member',
    email_subject: sanitizePlainText(input.emailSubject, 120),
    reply_to: sanitizePlainText(input.replyTo, 120),
    special_instructions: sanitizePlainText(input.specialInstructions, 500),
    job_details: sanitizeMultiline(input.jobDetails, 2500),
    job_details_html: htmlSafeMultiline(input.jobDetails, 2500),
  };
}

/**
 * Member 5% signup mail. Reuses the two paid EmailJS template IDs as transport
 * only. Never shares or mutates paid-booking templateParams().
 */
export async function sendMemberDiscountEmails(input: {
  name: string;
  email: string;
  discountCode: string;
  gapMs?: number;
}): Promise<MemberEmailSendResult> {
  if (!isMemberEmailConfigured()) {
    const missing = emailJsMissingVars().join(', ');
    const error = `EmailJS is not configured on the API host (missing ${missing || 'keys'}).`;
    console.error(error);
    return { customerSent: false, businessSent: false, skipped: true, error };
  }

  const cfg = emailJsConfig();
  if (!cfg.privateKey) {
    console.error('EMAILJS_PRIVATE_KEY is missing on the API host; REST sends need accessToken if Account → Security uses a Private Key');
  }
  const gapMs = input.gapMs ?? DEFAULT_GAP_MS;
  const company = companyConfig();
  const name = sanitizePlainText(input.name, 80);
  const email = sanitizePlainText(input.email, 120);
  const code = sanitizePlainText(input.discountCode, 32);
  const office = sanitizePlainText(company.email, 120);
  const studentDetails = [
    'MEMBER 5% OFF — not a booking',
    `Name: ${name}`,
    `Email: ${email}`,
    `Code: ${code}`,
    'Enter this code on the book step for 5% off your first move.',
  ].join('\n');
  const officeDetails = [
    'NEW MEMBER 5% SIGNUP — not a booking',
    `Name: ${name}`,
    `Email: ${email}`,
    `Code: ${code}`,
    'Follow up for their first move.',
  ].join('\n');

  let customerSent = false;
  let businessSent = false;
  const errors: string[] = [];

  try {
    await sendTemplate(cfg.clientTemplateId, memberDiscountTemplateParams({
      name,
      email,
      discountCode: code,
      toEmail: email,
      replyTo: office,
      jobDetails: studentDetails,
      specialInstructions: `Not a booking. Your 5% off code is ${code}. Enter it on the book step.`,
      emailSubject: MEMBER_CUSTOMER_SUBJECT,
    }));
    customerSent = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'member customer email failed';
    errors.push(message);
    console.error('Member customer email failed', { error: message });
  }

  if (office.toLowerCase() === email.toLowerCase()) {
    businessSent = customerSent;
    return {
      customerSent,
      businessSent,
      skipped: false,
      error: errors.length ? errors.join(' | ') : undefined,
    };
  }

  if (customerSent) {
    await wait(gapMs);
  }

  try {
    await sendTemplate(cfg.businessTemplateId, memberDiscountTemplateParams({
      name,
      email,
      discountCode: code,
      toEmail: office,
      replyTo: email,
      jobDetails: officeDetails,
      specialInstructions: `Not a booking. ${name} <${email}> code ${code}`,
      emailSubject: MEMBER_BUSINESS_SUBJECT,
    }));
    businessSent = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'member business email failed';
    errors.push(message);
    console.error('Member business email failed', { error: message });
  }

  return {
    customerSent,
    businessSent,
    skipped: false,
    error: errors.length ? errors.join(' | ') : undefined,
  };
}
