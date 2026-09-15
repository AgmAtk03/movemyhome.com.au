import type Stripe from 'stripe';
import type { AccessType, Inventory, QuoteSnapshot, QuoteState, ServiceType } from '../../types.js';
import { BRAND_NAME } from '../../shared/rates.js';
import { calculateFullQuote } from '../../shared/quoteCalc.js';
import { buildQuoteSnapshot } from '../../shared/snapshot.js';
import { formatMoney } from '../../shared/money.js';
import { meta } from './stripeClient.js';
import type { PriceBreakdown } from '../../types.js';

export const MAIL_CLIENT_META = 'mail_client';
export const MAIL_BIZ_META = 'mail_biz';
export const MAIL_NOTE_META = 'mail_note';
export const MAIL_SENT_VALUE = 'sent';

const ACCESS: AccessType[] = ['ground', 'floor1', 'floor2', 'floor3', 'floor4'];
const SERVICES: ServiceType[] = ['home_move', 'room_move', 'item_delivery'];

const EMPTY_INVENTORY: Inventory = {
  boxes: 0, sofa: 0, mattress: 0, bed: 0, fridge: 0, tv: 0, washer: 0,
};

function splitAddresses(value: string): string[] {
  return value.split('|').map((part) => part.replace(/^\s+|\s+$/g, '')).filter(Boolean);
}

function parseAccessToken(raw: string): { access: AccessType; hasLoadingDock: boolean } {
  const hasLoadingDock = raw.includes('+dock') || raw.includes('dock');
  const token = raw.replace('+dock', '').replace(/[^a-z0-9]/gi, '') as AccessType;
  const access = ACCESS.includes(token) ? token : 'ground';
  return { access, hasLoadingDock };
}

function parseInventoryJson(raw: string): Inventory {
  if (!raw) return { ...EMPTY_INVENTORY };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pick = (key: keyof Inventory) => {
      const n = Number(parsed[key] || 0);
      return Number.isFinite(n) ? Math.max(0, Math.min(200, Math.round(n))) : 0;
    };
    return {
      boxes: pick('boxes'),
      sofa: pick('sofa'),
      mattress: pick('mattress'),
      bed: pick('bed'),
      fridge: pick('fridge'),
      tv: pick('tv'),
      washer: pick('washer'),
    };
  } catch {
    return { ...EMPTY_INVENTORY };
  }
}

function stopsFromMeta(addressesRaw: string, accessRaw: string, prefix: string): QuoteState['pickups'] {
  const addresses = splitAddresses(addressesRaw.replace(/\s+\|\s+/g, '|'));
  const accessParts = accessRaw.split('|').map((part) => part.trim());
  if (!addresses.length) {
    const fallback = addressesRaw.trim();
    const parsed = parseAccessToken(accessParts[0] || 'ground');
    return [{ id: `${prefix}1`, address: fallback, access: parsed.access, hasLoadingDock: parsed.hasLoadingDock }];
  }
  return addresses.map((address, index) => {
    const parsed = parseAccessToken(accessParts[index] || 'ground');
    return {
      id: `${prefix}${index + 1}`,
      address,
      access: parsed.access,
      hasLoadingDock: parsed.hasLoadingDock,
    };
  });
}

export function buildCheckoutMetadata(
  state: QuoteState,
  snapshot: QuoteSnapshot,
  breakdown: PriceBreakdown,
  extras: { dieselAudPerLitre: number | null; legalName: string },
): Record<string, string> {
  const quoteLines = snapshot.lines.map((line) => `${line.label}: ${line.note || line.amount}`).join('; ');
  return {
    brand: meta(BRAND_NAME, 40),
    customer_name: meta(state.details.name, 80),
    customer_email: meta(state.details.email, 120),
    customer_phone: meta(state.details.phone, 24),
    quote_total: meta(String(breakdown.total), 24),
    deposit: meta(String(breakdown.deposit), 24),
    balance: meta(String(breakdown.balance), 24),
    deposit_cents: meta(String(breakdown.depositCents), 12),
    currency: 'aud',
    move_date: meta(state.details.date, 16),
    move_time: meta(state.details.time, 8),
    service: meta(snapshot.serviceLabel, 80),
    service_type: meta(state.serviceType || '', 24),
    vehicle: meta(snapshot.vehicleLabel, 40),
    crew: meta(snapshot.crewLabel, 40),
    hours: meta(String(state.truckHours), 8),
    crew_n: meta(String(state.crewSize), 4),
    pickup: meta(state.pickups.map((row) => row.address).join(' | '), 500),
    dropoff: meta(state.dropoffs.map((row) => row.address).join(' | '), 500),
    pickup_access: meta(state.pickups.map((row) => `${row.access}${row.hasLoadingDock ? '+dock' : ''}`).join('|'), 80),
    dropoff_access: meta(state.dropoffs.map((row) => `${row.access}${row.hasLoadingDock ? '+dock' : ''}`).join('|'), 80),
    inventory: meta(snapshot.inventorySummary, 400),
    inventory_json: meta(JSON.stringify(state.inventory), 400),
    notes: meta(state.details.instructions || '', 400),
    route: meta(snapshot.routeSummary, 500),
    quote_lines: meta(quoteLines, 500),
    distance_km: meta(state.distanceKm.toFixed(1), 16),
    travel_hrs: meta(state.travelTimeHrs.toFixed(1), 16),
    fuel: meta(String(breakdown.fuel), 24),
    fuel_status: meta(
      breakdown.fuelStatus === 'none' && state.distanceKm <= 0 ? 'tbc' : breakdown.fuelStatus,
      12,
    ),
    diesel_aud_per_l: meta(extras.dieselAudPerLitre != null ? String(extras.dieselAudPerLitre) : '', 16),
    move_type: meta(snapshot.moveType, 80),
    legal_name: meta(extras.legalName, 80),
    bed_disassembly: state.details.bedDisassembly ? '1' : '0',
    bed_assembled: state.details.bedIsAssembled ? '1' : '0',
  };
}

export function mailAlreadySent(meta: Stripe.Metadata | null | undefined, key: string): boolean {
  return String(meta?.[key] || '') === MAIL_SENT_VALUE;
}

export function bookingFromCheckoutSession(session: Stripe.Checkout.Session): {
  state: QuoteState;
  snapshot: QuoteSnapshot;
} {
  const meta = session.metadata || {};
  const pickup = String(meta.pickup || '');
  const dropoff = String(meta.dropoff || '');
  const serviceRaw = String(meta.service_type || '');
  const serviceType = SERVICES.includes(serviceRaw as ServiceType) ? serviceRaw as ServiceType : null;
  const vehicle = String(meta.vehicle || '').toLowerCase().includes('truck') ? 'truck' : 'van';
  const crewSize = Number(meta.crew_n || 0) || (String(meta.crew || '').toLowerCase().includes('one') ? 1 : 2);
  const truckHours = Number(meta.hours || 0) || 2;
  const inventory = parseInventoryJson(String(meta.inventory_json || ''));
  const customerEmail = String(meta.customer_email || session.customer_email || session.customer_details?.email || '');

  const state: QuoteState = {
    step: 6,
    serviceType,
    vehicle,
    isManualTruckSelection: vehicle === 'truck',
    truckHours,
    crewSize: crewSize === 1 ? 1 : 2,
    pickups: stopsFromMeta(pickup, String(meta.pickup_access || ''), 'p'),
    dropoffs: stopsFromMeta(dropoff, String(meta.dropoff_access || ''), 'd'),
    inventory,
    details: {
      date: String(meta.move_date || ''),
      time: String(meta.move_time || ''),
      name: String(meta.customer_name || session.customer_details?.name || ''),
      email: customerEmail,
      phone: String(meta.customer_phone || ''),
      instructions: String(meta.notes || ''),
      bedDisassembly: String(meta.bed_disassembly || '') === '1',
      bedIsAssembled: String(meta.bed_assembled || '1') !== '0',
    },
    distanceKm: Number(meta.distance_km || 0) || 0,
    travelTimeHrs: Number(meta.travel_hrs || 0) || 0,
    isCBD: pickup.includes('2000') || dropoff.includes('2000'),
    isInterstate: String(meta.move_type || '').toLowerCase().includes('interstate'),
  };

  const dieselRaw = Number(meta.diesel_aud_per_l || 0);
  const snapshot = buildQuoteSnapshot(state, calculateFullQuote({
    vehicle: state.vehicle,
    truckHours: state.truckHours,
    crewSize: state.crewSize,
    pickups: state.pickups,
    dropoffs: state.dropoffs,
    inventory: state.inventory,
    bedDisassembly: state.details.bedDisassembly,
    bedIsAssembled: state.details.bedIsAssembled,
    distanceKm: state.distanceKm,
    travelTimeHrs: state.travelTimeHrs,
    isInterstate: state.isInterstate,
    dieselAudPerLitre: Number.isFinite(dieselRaw) && dieselRaw > 0 ? dieselRaw : null,
  }));

  const amountCents = session.amount_total ?? 0;
  return {
    state,
    snapshot: {
      ...snapshot,
      serviceLabel: String(meta.service || snapshot.serviceLabel),
      vehicleLabel: String(meta.vehicle || snapshot.vehicleLabel),
      crewLabel: String(meta.crew || snapshot.crewLabel),
      inventorySummary: String(meta.inventory || snapshot.inventorySummary),
      routeSummary: String(meta.route || snapshot.routeSummary),
      pickupAddresses: state.pickups.map((row) => row.address).filter(Boolean),
      dropoffAddresses: state.dropoffs.map((row) => row.address).filter(Boolean),
      moveType: String(meta.move_type || snapshot.moveType),
      totalLabel: meta.quote_total ? formatMoney(Number(meta.quote_total)) : snapshot.totalLabel,
      depositLabel: meta.deposit
        ? formatMoney(Number(meta.deposit))
        : formatMoney(amountCents / 100),
      balanceLabel: meta.balance ? formatMoney(Number(meta.balance)) : snapshot.balanceLabel,
    },
  };
}
