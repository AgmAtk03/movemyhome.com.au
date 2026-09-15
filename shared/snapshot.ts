import type { PriceBreakdown, QuoteSnapshot, QuoteState } from '../types.js';
import { SERVICE_LABELS, BRAND_NAME } from './rates.js';
import { formatMoney } from './money.js';
import {
  crewLabel,
  formatDateAu,
  formatInventoryList,
  formatRouteSummary,
  formatTimeAu,
  moveTypeLabel,
  vehicleLabel,
} from './format.js';
import { sanitizeMultiline, sanitizePlainText } from '../lib/sanitize.js';

function fuelLineFrom(state: QuoteState, breakdown: PriceBreakdown): QuoteSnapshot['fuelLine'] {
  const kmLabel = `${state.distanceKm.toFixed(1)} km`;
  if (
    breakdown.fuelStatus === 'none'
    && state.step >= 6
    && state.distanceKm <= 0
    && addressesReady(state.pickups, state.dropoffs)
  ) {
    return {
      label: 'Fuel',
      amount: 'TBC',
      note: 'Driving distance still to confirm — we won’t guess fuel',
      status: 'tbc',
    };
  }
  if (breakdown.fuelStatus === 'waived') {
    return {
      label: 'Fuel',
      amount: formatMoney(0),
      note: 'No fuel charge under 12 km',
      status: 'waived',
    };
  }
  if (breakdown.fuelStatus === 'tbc') {
    return {
      label: 'Fuel',
      amount: 'TBC',
      note: '7-Eleven diesel price unavailable — we’ll confirm fuel with you',
      status: 'tbc',
    };
  }
  if (breakdown.fuelStatus === 'priced') {
    const litres = breakdown.fuelLitres.toFixed(1);
    const perLitre = breakdown.dieselAudPerLitre != null ? formatMoney(breakdown.dieselAudPerLitre) : '';
    return {
      label: 'Fuel',
      amount: formatMoney(breakdown.fuel),
      note: `${kmLabel} ÷ 10 km per litre = ${litres} L × ${perLitre}/L 7-Eleven diesel`,
      status: 'priced',
    };
  }
  return { label: 'Fuel', amount: formatMoney(0), status: 'none' };
}

export function buildQuoteSnapshot(state: QuoteState, breakdown: PriceBreakdown): QuoteSnapshot {
  const included = [
    'We’ll confirm the plan before moving day',
    '10% today holds the slot — fully refundable if you cancel at least 12 hours before the move',
    'The remaining 90% is due on the day',
  ];
  if (state.vehicle === 'truck' && breakdown.potentialAccess > 0) {
    included.push('Stairs and access (included with the truck)');
  }

  const lines: QuoteSnapshot['lines'] = [
    {
      label: state.vehicle === 'truck' && !breakdown.isFixedTrip
        ? `Time (${breakdown.hours || 2} hrs × ${formatMoney(breakdown.hourlyRate)}/hr)`
        : 'Vehicle and travel',
      amount: formatMoney(breakdown.base),
    },
  ];

  if (breakdown.distance > 0) {
    lines.push({ label: 'Distance', amount: formatMoney(breakdown.distance) });
  }
  if (breakdown.inventory > 0) {
    lines.push({ label: 'Items', amount: formatMoney(breakdown.inventory) });
  }
  if (breakdown.potentialAccess > 0) {
    lines.push({
      label: 'Stairs and access',
      amount: state.vehicle === 'truck' ? formatMoney(0) : formatMoney(breakdown.access),
      note: state.vehicle === 'truck' ? 'Included' : undefined,
    });
  }
  if (breakdown.cbd > 0) {
    lines.push({ label: 'Sydney CBD parking', amount: formatMoney(breakdown.cbd) });
  }
  if (breakdown.bedService > 0) {
    lines.push({ label: 'Bed take-down', amount: formatMoney(breakdown.bedService) });
  }

  const fuelLine = fuelLineFrom(state, breakdown);
  if (fuelLine.status !== 'none') {
    lines.push({
      label: fuelLine.label,
      amount: fuelLine.amount,
      note: fuelLine.status === 'priced' ? undefined : fuelLine.note,
    });
  }

  if (breakdown.memberDiscount > 0) {
    lines.push({
      label: `Member 5% off${breakdown.memberDiscountCode ? ` (${breakdown.memberDiscountCode})` : ''}`,
      amount: `−${formatMoney(breakdown.memberDiscount)}`,
    });
  }

  const schedule = [formatDateAu(state.details.date), formatTimeAu(state.details.time)]
    .filter(Boolean)
    .join(', ') || 'Time still to confirm';

  return {
    serviceLabel: SERVICE_LABELS[state.serviceType || ''] || 'Moving help',
    vehicleLabel: vehicleLabel(state.vehicle),
    crewLabel: crewLabel(state.vehicle, state.crewSize),
    routeSummary: formatRouteSummary(state.pickups, state.dropoffs),
    pickupAddresses: state.pickups.map((p) => sanitizePlainText(p.address, 160)),
    dropoffAddresses: state.dropoffs.map((d) => sanitizePlainText(d.address, 160)),
    inventorySummary: formatInventoryList(state.inventory),
    scheduleLabel: schedule,
    distanceLabel: `${state.distanceKm.toFixed(1)} km`,
    travelTimeLabel: `${state.travelTimeHrs.toFixed(1)} hrs`,
    moveType: moveTypeLabel(state, breakdown.isFixedTrip),
    totalLabel: formatMoney(breakdown.total),
    subtotalLabel: formatMoney(breakdown.subtotal > 0 ? breakdown.subtotal : breakdown.total),
    memberDiscountLabel: breakdown.memberDiscount > 0 ? `−${formatMoney(breakdown.memberDiscount)}` : '',
    memberDiscountCode: breakdown.memberDiscountCode || '',
    depositLabel: formatMoney(breakdown.deposit),
    balanceLabel: formatMoney(breakdown.balance),
    included,
    lines,
    fuelLine,
  };
}

export function buildCustomerMessage(state: QuoteState, snapshot: QuoteSnapshot): string {
  const instructions = sanitizeMultiline(state.details.instructions, 600);
  return sanitizeMultiline(
    [
      `Hi ${BRAND_NAME}, I’d like to book a move.`,
      '',
      `Name: ${sanitizePlainText(state.details.name, 80)}`,
      `Phone: ${sanitizePlainText(state.details.phone, 24)}`,
      `Email: ${sanitizePlainText(state.details.email, 120)}`,
      `When: ${snapshot.scheduleLabel}`,
      `Service: ${snapshot.serviceLabel}`,
      `Vehicle: ${snapshot.vehicleLabel} (${snapshot.crewLabel})`,
      snapshot.routeSummary,
      `Items: ${snapshot.inventorySummary}`,
      `Quote: ${snapshot.totalLabel} (${snapshot.moveType})`,
      snapshot.memberDiscountCode ? `Member 5% off (${snapshot.memberDiscountCode}): ${snapshot.memberDiscountLabel}` : '',
      `Deposit (10%): ${snapshot.depositLabel}`,
      `Balance due on the day: ${snapshot.balanceLabel}`,
      instructions ? `Notes: ${instructions}` : '',
    ].filter(Boolean).join('\n'),
    1400
  );
}

function fuelDetailsLine(snapshot: QuoteSnapshot): string {
  if (snapshot.fuelLine.status === 'none') return 'Fuel: TBC';
  const note = snapshot.fuelLine.note ? ` — ${snapshot.fuelLine.note}` : '';
  return `Fuel: ${snapshot.fuelLine.amount}${note}`;
}

export function buildJobDetailsBody(state: QuoteState, snapshot: QuoteSnapshot): string {
  const instructions = sanitizeMultiline(state.details.instructions, 800) || 'None';
  const pickup = snapshot.pickupAddresses.filter(Boolean).join(' | ') || 'To confirm';
  const dropoff = snapshot.dropoffAddresses.filter(Boolean).join(' | ') || 'To confirm';
  return sanitizeMultiline(
    [
      'NEW BOOKING — 10% DEPOSIT',
      'Payment status: 10% deposit paid',
      `Customer: ${sanitizePlainText(state.details.name, 80)}`,
      `Email: ${sanitizePlainText(state.details.email, 120)}`,
      `Phone: ${sanitizePlainText(state.details.phone, 24)}`,
      `When: ${snapshot.scheduleLabel}`,
      `Service: ${snapshot.serviceLabel}`,
      `Vehicle: ${snapshot.vehicleLabel}`,
      `Crew: ${snapshot.crewLabel}`,
      `Move type: ${snapshot.moveType}`,
      `Distance: ${snapshot.distanceLabel} · Drive time: ${snapshot.travelTimeLabel}`,
      `Pickup: ${pickup}`,
      `Dropoff: ${dropoff}`,
      snapshot.routeSummary,
      `Items: ${snapshot.inventorySummary}`,
      `Quote total: ${snapshot.totalLabel}`,
      snapshot.memberDiscountCode
        ? `Member 5% off (${snapshot.memberDiscountCode}): ${snapshot.memberDiscountLabel} (was ${snapshot.subtotalLabel})`
        : '',
      `Deposit paid / due: ${snapshot.depositLabel}`,
      `Balance on the day: ${snapshot.balanceLabel}`,
      fuelDetailsLine(snapshot),
      snapshot.lines.map((line) => `- ${line.label}: ${line.note || line.amount}`).join('\n'),
      `Notes: ${instructions}`,
    ].filter(Boolean).join('\n'),
    2500
  );
}

export function hasAnyInventory(inventory: QuoteState['inventory']): boolean {
  return (Object.values(inventory) as number[]).some((count) => count > 0);
}

export function addressesReady(pickups: QuoteState['pickups'], dropoffs: QuoteState['dropoffs']): boolean {
  return Boolean(pickups[0]?.address.trim().length > 5 && dropoffs[0]?.address.trim().length > 5);
}

export function scheduleReady(details: QuoteState['details']): boolean {
  return Boolean(details.date && details.time);
}

export function buildCrewJobSheet(job: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  scheduleLabel: string;
  moveDate: string;
  moveTime: string;
  serviceLabel: string;
  vehicleLabel: string;
  crewLabel: string;
  routeSummary: string;
  inventorySummary: string;
  totalLabel: string;
  depositLabel?: string;
  balanceLabel?: string;
  instructions: string;
  moveType: string;
  workflowStatus?: string;
  paymentStatus?: string;
}): string {
  const when = job.scheduleLabel || [formatDateAu(job.moveDate), formatTimeAu(job.moveTime)].filter(Boolean).join(', ');
  return sanitizeMultiline(
    [
      `JOB SHEET — ${BRAND_NAME}`,
      `Status: ${job.workflowStatus || 'new'}`,
      job.paymentStatus ? `Payment: ${job.paymentStatus}` : '',
      `When: ${when || 'To confirm'} (about a one-hour arrival window)`,
      `Customer: ${sanitizePlainText(job.customerName, 80)}`,
      `Phone: ${sanitizePlainText(job.customerPhone, 24)}`,
      `Email: ${sanitizePlainText(job.customerEmail, 120)}`,
      `Service: ${job.serviceLabel}`,
      `Vehicle: ${job.vehicleLabel}${job.crewLabel ? ` · ${job.crewLabel}` : ''}`,
      job.moveType ? `Type: ${job.moveType}` : '',
      job.routeSummary,
      `Items: ${job.inventorySummary}`,
      `Quote: ${job.totalLabel}`,
      job.depositLabel ? `Deposit 10%: ${job.depositLabel}` : '',
      job.balanceLabel ? `Balance on the day: ${job.balanceLabel}` : '',
      job.instructions ? `Notes: ${sanitizeMultiline(job.instructions, 800)}` : 'Notes: none',
    ].filter(Boolean).join('\n'),
    2200
  );
}

export function buildWhatsAppShareUrl(message: string): string | null {
  const text = sanitizeMultiline(message, 1400);
  if (!text) return null;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
