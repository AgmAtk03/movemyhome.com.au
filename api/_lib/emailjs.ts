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

const DEFAULT_GAP_MS = 1100;

function wait(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface MemberEmailSendResult {
  customerSent: boolean;
  businessSent: boolean;
  skipped: boolean;
}

/** Paid booking confirmation + job sheet. Do not drop any of these fields. */
function templateParams(state: QuoteState, snapshot: QuoteSnapshot, extra: Record<string, string> = {}): Record<string, string> {
  const company = companyConfig();
  return {
    company_name: sanitizePlainText(company.name, 80),
    company_email: sanitizePlainText(company.email, 120),
    company_phone: sanitizePlainText(company.phone, 24),
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
  if (cfg.privateKey) {
    payload.accessToken = cfg.privateKey;
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`EmailJS ${response.status}`);
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
}): Promise<MemberEmailSendResult> {
  if (!isMemberEmailConfigured()) {
    return { customerSent: false, businessSent: false, skipped: true };
  }

  const cfg = emailJsConfig();
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

  try {
    await sendTemplate(cfg.clientTemplateId, memberDiscountTemplateParams({
      name,
      email,
      discountCode: code,
      toEmail: email,
      replyTo: office,
      jobDetails: studentDetails,
      specialInstructions: `Not a booking. Your 5% off code is ${code}. Enter it on the book step.`,
    }));
    customerSent = true;
  } catch {
    console.error('Member customer email failed');
  }

  if (office.toLowerCase() === email.toLowerCase()) {
    businessSent = customerSent;
    return { customerSent, businessSent, skipped: false };
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
    }));
    businessSent = true;
  } catch {
    console.error('Member business email failed');
  }

  return { customerSent, businessSent, skipped: false };
}
