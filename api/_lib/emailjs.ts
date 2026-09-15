import type { QuoteSnapshot, QuoteState } from '../../types.js';
import { htmlSafeMultiline, htmlSafePlainText, sanitizeMultiline, sanitizePlainText } from '../../lib/sanitize.js';
import { buildJobDetailsBody } from '../../shared/snapshot.js';
import { BRAND_NAME } from '../../shared/rates.js';
import { companyConfig, emailJsConfig, isEmailJsServerConfigured, isMemberEmailConfigured } from './env.js';

export interface EmailSendResult {
  clientSent: boolean;
  businessSent: boolean;
  skipped: boolean;
}

export interface MemberEmailSendResult {
  customerSent: boolean;
  businessSent: boolean;
  skipped: boolean;
}

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
  payment: { sessionId: string; paymentIntentId: string }
): Promise<EmailSendResult> {
  if (!isEmailJsServerConfigured()) {
    return { clientSent: false, businessSent: false, skipped: true };
  }

  const cfg = emailJsConfig();
  const params = templateParams(state, snapshot, {
    stripe_session_id: sanitizePlainText(payment.sessionId, 80),
    stripe_payment_intent: sanitizePlainText(payment.paymentIntentId, 80),
    payment_status: 'deposit_paid',
  });

  let clientSent = false;
  let businessSent = false;

  try {
    await sendTemplate(cfg.businessTemplateId, {
      ...params,
      to_email: sanitizePlainText(companyConfig().email, 120),
      email_kind: 'business',
    });
    businessSent = true;
  } catch (error) {
    console.error('Business job-sheet email failed', { sessionId: payment.sessionId });
    throw error;
  }

  try {
    await sendTemplate(cfg.clientTemplateId, {
      ...params,
      to_email: params.user_email,
      email_kind: 'client',
    });
    clientSent = true;
  } catch {
    console.error('Customer confirmation email failed', { sessionId: payment.sessionId });
  }

  return { clientSent, businessSent, skipped: false };
}

export async function sendMemberSignupEmails(input: {
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
  const offer = `5% off first move. Code ${code}.`;
  const studentDetails = [
    'MEMBER 5% OFF',
    `Name: ${name}`,
    `Email: ${email}`,
    `Code: ${code}`,
    'Enter this code on the book step for 5% off your first move.',
  ].join('\n');
  const officeDetails = [
    'NEW MEMBER 5% SIGNUP',
    `Name: ${name}`,
    `Email: ${email}`,
    `Code: ${code}`,
    'Follow up for their first move.',
  ].join('\n');

  const shared = {
    customer_name: name,
    from_name: name,
    user_email: email,
    discount_code: code,
    offer_label: '5% off your first move',
    company_name: sanitizePlainText(company.name || BRAND_NAME, 80),
    company_email: office,
    company_phone: sanitizePlainText(company.phone, 24),
    total_quote: offer,
    inventory: `Code ${code}`,
    vehicle: 'Member offer',
    move_date: 'First move',
    deposit_amount: '5% off',
    balance_amount: '',
  };

  let customerSent = false;
  let businessSent = false;

  try {
    await sendTemplate(cfg.clientTemplateId, {
      ...shared,
      to_email: email,
      email_kind: 'member',
      reply_to: office,
      service_type: 'Member 5% off',
      special_instructions: `Your 5% off code is ${code}. Enter it when you book your first move.`,
      job_details: studentDetails,
      job_details_html: htmlSafeMultiline(studentDetails, 2500),
    });
    customerSent = true;
  } catch {
    console.error('Member customer email failed');
  }

  if (office.toLowerCase() === email.toLowerCase()) {
    businessSent = customerSent;
    return { customerSent, businessSent, skipped: false };
  }

  try {
    await sendTemplate(cfg.businessTemplateId, {
      ...shared,
      to_email: office,
      email_kind: 'business',
      reply_to: email,
      service_type: 'Member signup',
      special_instructions: `${name} <${email}> code ${code}`,
      job_details: officeDetails,
      job_details_html: htmlSafeMultiline(officeDetails, 2500),
    });
    businessSent = true;
  } catch {
    console.error('Member business email failed');
  }

  return { customerSent, businessSent, skipped: false };
}
