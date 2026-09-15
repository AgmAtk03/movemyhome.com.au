import type { QuoteSnapshot, QuoteState } from '../types.js';
import {
  htmlSafeMultilineWithBreaks,
  htmlSafePlainText,
  sanitizeMultiline,
  sanitizePlainText,
} from '../lib/sanitize.js';
import { formatDateAu, formatTimeAu } from './format.js';
import { buildJobDetailsBody } from './snapshot.js';

export interface PaidEmailCompany {
  name: string;
  email: string;
  phone: string;
}

export function buildPaidEmailTemplateParams(
  state: QuoteState,
  snapshot: QuoteSnapshot,
  company: PaidEmailCompany,
  extra: Record<string, string> = {},
): Record<string, string> {
  const jobDetails = [
    buildJobDetailsBody(state, snapshot),
    extra.stripe_session_id ? `Stripe session: ${extra.stripe_session_id}` : '',
    extra.stripe_payment_intent ? `Payment intent: ${extra.stripe_payment_intent}` : '',
  ].filter(Boolean).join('\n');

  const pickup = snapshot.pickupAddresses.filter(Boolean).join(' | ')
    || state.pickups.map((row) => row.address).filter(Boolean).join(' | ');
  const dropoff = snapshot.dropoffAddresses.filter(Boolean).join(' | ')
    || state.dropoffs.map((row) => row.address).filter(Boolean).join(' | ');
  const customerEmail = sanitizePlainText(state.details.email, 120);
  const customerName = sanitizePlainText(state.details.name, 80);
  const companyEmail = sanitizePlainText(company.email, 120);
  const dateLabel = formatDateAu(state.details.date) || sanitizePlainText(state.details.date, 16);
  const timeLabel = formatTimeAu(state.details.time) || sanitizePlainText(state.details.time, 8);

  return {
    company_name: sanitizePlainText(company.name, 80),
    company_email: companyEmail,
    company_phone: sanitizePlainText(company.phone, 24),
    office_email: companyEmail,
    bookings_email: companyEmail,
    from_name: customerName,
    from_email: customerEmail,
    customer_name: customerName,
    name: customerName,
    user_email: customerEmail,
    email: customerEmail,
    to_email: customerEmail,
    user_phone: sanitizePlainText(state.details.phone, 24),
    phone: sanitizePlainText(state.details.phone, 24),
    move_date: sanitizePlainText(dateLabel || snapshot.scheduleLabel, 80),
    move_time: sanitizePlainText(timeLabel || snapshot.scheduleLabel, 80),
    schedule: sanitizePlainText(snapshot.scheduleLabel, 80),
    service_type: sanitizePlainText(snapshot.serviceLabel, 80),
    vehicle: sanitizePlainText(snapshot.vehicleLabel, 40),
    crew_size: sanitizePlainText(snapshot.crewLabel, 40),
    total_quote: sanitizePlainText(snapshot.totalLabel, 24),
    deposit_amount: sanitizePlainText(snapshot.depositLabel, 24),
    balance_amount: sanitizePlainText(snapshot.balanceLabel, 24),
    inventory: sanitizePlainText(snapshot.inventorySummary, 400),
    items: sanitizePlainText(snapshot.inventorySummary, 400),
    route: sanitizeMultiline(snapshot.routeSummary, 800),
    pickup: sanitizePlainText(pickup, 500),
    dropoff: sanitizePlainText(dropoff, 500),
    pickup_address: sanitizePlainText(pickup, 500),
    dropoff_address: sanitizePlainText(dropoff, 500),
    special_instructions: sanitizePlainText(state.details.instructions || 'None', 500),
    notes: sanitizePlainText(state.details.instructions || 'None', 500),
    distance: sanitizePlainText(snapshot.distanceLabel, 24),
    travel_time: sanitizePlainText(snapshot.travelTimeLabel, 24),
    move_type: sanitizePlainText(snapshot.moveType, 80),
    quote_lines: sanitizeMultiline(snapshot.lines.map((line) => `${line.label}: ${line.note || line.amount}`).join('\n'), 800),
    included: sanitizePlainText(snapshot.included.join(', '), 240),
    job_details: sanitizeMultiline(jobDetails, 2500),
    message: sanitizeMultiline(jobDetails, 2500),
    reply_to: customerEmail,
    job_details_html: htmlSafeMultilineWithBreaks(jobDetails, 2500),
    customer_name_html: htmlSafePlainText(state.details.name, 80),
    ...extra,
  };
}
