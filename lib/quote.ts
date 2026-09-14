import { Inventory, LocationEntry, MoveDetails, PriceBreakdown, QuoteSnapshot, QuoteState, VehicleType } from '../types';
import { ACCESS_LABELS, INVENTORY_LABELS, RATES, SERVICE_LABELS } from '../constants';
import { sanitizeMultiline, sanitizePlainText } from './sanitize';

export function formatMoney(amount: number): string {
  return amount.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

export function formatDateAu(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimeAu(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const displayH = h % 12 || 12;
  const period = h >= 12 ? 'pm' : 'am';
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

export function crewLabel(vehicle: VehicleType | null, crewSize: number): string {
  if (vehicle !== 'truck') return 'Van crew';
  return crewSize === 1 ? 'One person' : 'Two people';
}

export function vehicleLabel(vehicle: VehicleType | null): string {
  if (vehicle === 'truck') return 'Truck';
  if (vehicle === 'van') return 'Van';
  return 'Not chosen yet';
}

export function formatInventoryList(inventory: Inventory): string {
  const parts = (Object.keys(inventory) as (keyof Inventory)[])
    .filter((key) => inventory[key] > 0)
    .map((key) => `${inventory[key]}× ${INVENTORY_LABELS[key] || key}`);
  return parts.join(', ') || 'No specific items listed yet';
}

function formatStop(loc: LocationEntry): string {
  const address = sanitizePlainText(loc.address, 160) || 'Address to confirm';
  const access = ACCESS_LABELS[loc.access] || loc.access;
  const dock = loc.hasLoadingDock ? 'loading dock' : '';
  return [address, access, dock].filter(Boolean).join(' · ');
}

export function formatRouteSummary(pickups: LocationEntry[], dropoffs: LocationEntry[]): string {
  const from = pickups.map(formatStop).join(' | ');
  const to = dropoffs.map(formatStop).join(' | ');
  return `From: ${from}\nTo: ${to}`;
}

export function moveTypeLabel(state: Pick<QuoteState, 'isInterstate' | 'distanceKm'>, isFixedTrip: boolean): string {
  if (isFixedTrip) return 'Long distance (fixed trip)';
  if (state.isInterstate) return 'Interstate';
  return 'Local Sydney';
}

export function buildQuoteSnapshot(
  state: QuoteState,
  breakdown: PriceBreakdown
): QuoteSnapshot {
  const included = [
    'Transit insurance',
    'Public liability cover',
  ];
  if (state.vehicle === 'truck' && breakdown.potentialAccess > 0) {
    included.push('Stairs and access (included with the truck)');
  }

  const lines: QuoteSnapshot['lines'] = [
    {
      label: state.vehicle === 'truck' && !breakdown.isFixedTrip
        ? `Time (${breakdown.hours || RATES.TRUCK_MIN_HOURS} hrs × ${formatMoney(breakdown.hourlyRate)}/hr)`
        : 'Vehicle and travel',
      amount: formatMoney(breakdown.base),
    },
  ];

  if (breakdown.distance > 0) {
    lines.push({ label: 'Distance', amount: formatMoney(breakdown.distance) });
  }
  if (breakdown.fuel > 0) {
    lines.push({ label: 'Fuel estimate', amount: formatMoney(breakdown.fuel) });
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
    included,
    lines,
  };
}

export function buildCustomerMessage(state: QuoteState, snapshot: QuoteSnapshot): string {
  const instructions = sanitizeMultiline(state.details.instructions, 600);
  return sanitizeMultiline(
    [
      `Hi ${CONFIG_NAME()}, I’d like to book a move.`,
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
      instructions ? `Notes: ${instructions}` : '',
    ].filter(Boolean).join('\n'),
    1400
  );
}

function CONFIG_NAME(): string {
  return 'My Home Removals';
}

export function buildJobDetailsBody(state: QuoteState, snapshot: QuoteSnapshot): string {
  const instructions = sanitizeMultiline(state.details.instructions, 800) || 'None';
  return sanitizeMultiline(
    [
      'NEW BOOKING REQUEST',
      `Customer: ${sanitizePlainText(state.details.name, 80)}`,
      `Email: ${sanitizePlainText(state.details.email, 120)}`,
      `Phone: ${sanitizePlainText(state.details.phone, 24)}`,
      `When: ${snapshot.scheduleLabel}`,
      `Service: ${snapshot.serviceLabel}`,
      `Vehicle: ${snapshot.vehicleLabel}`,
      `Crew: ${snapshot.crewLabel}`,
      `Move type: ${snapshot.moveType}`,
      `Distance: ${snapshot.distanceLabel} · Drive time: ${snapshot.travelTimeLabel}`,
      snapshot.routeSummary,
      `Items: ${snapshot.inventorySummary}`,
      `Quote total: ${snapshot.totalLabel}`,
      snapshot.lines.map((line) => `- ${line.label}: ${line.note || line.amount}`).join('\n'),
      `Notes: ${instructions}`,
    ].join('\n'),
    2500
  );
}

export function hasAnyInventory(inventory: Inventory): boolean {
  return (Object.values(inventory) as number[]).some((count) => count > 0);
}

export function addressesReady(pickups: LocationEntry[], dropoffs: LocationEntry[]): boolean {
  return Boolean(pickups[0]?.address.trim().length > 5 && dropoffs[0]?.address.trim().length > 5);
}

export function scheduleReady(details: MoveDetails): boolean {
  return Boolean(details.date && details.time);
}
