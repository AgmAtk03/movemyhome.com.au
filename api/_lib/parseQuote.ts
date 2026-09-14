import {
  AccessType,
  Inventory,
  LocationEntry,
  MoveDetails,
  QuoteState,
  ServiceType,
  VehicleType,
} from '../../types';
import { isContactValid } from '../../lib/validation';
import { sanitizeMultiline, sanitizePlainText } from '../../lib/sanitize';
import { addressesReady } from '../../shared/snapshot';

const ACCESS: AccessType[] = ['ground', 'floor1', 'floor2', 'floor3', 'floor4'];
const VEHICLES: VehicleType[] = ['van', 'truck'];
const SERVICES: ServiceType[] = ['home_move', 'room_move', 'item_delivery'];

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function parseLocation(raw: unknown, prefix: string, index: number): LocationEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const access = ACCESS.includes(row.access as AccessType) ? (row.access as AccessType) : 'ground';
  return {
    id: sanitizePlainText(String(row.id || `${prefix}${index + 1}`), 24) || `${prefix}${index + 1}`,
    address: sanitizePlainText(String(row.address || ''), 200),
    access,
    hasLoadingDock: Boolean(row.hasLoadingDock),
  };
}

function parseInventory(raw: unknown): Inventory {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pick = (key: keyof Inventory) => clamp(Math.round(asNumber(row[key], 0)), 0, 200);
  return {
    boxes: pick('boxes'),
    sofa: pick('sofa'),
    mattress: pick('mattress'),
    bed: pick('bed'),
    fridge: pick('fridge'),
    tv: pick('tv'),
    washer: pick('washer'),
  };
}

export function parseCheckoutPayload(body: unknown): { ok: true; state: QuoteState } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Missing booking details.' };
  }
  const row = body as Record<string, unknown>;

  // Never accept client money fields — they are ignored even if present.
  const vehicle = VEHICLES.includes(row.vehicle as VehicleType) ? (row.vehicle as VehicleType) : null;
  if (!vehicle) return { ok: false, error: 'Choose a van or truck.' };

  const serviceType = SERVICES.includes(row.serviceType as ServiceType)
    ? (row.serviceType as ServiceType)
    : null;

  const pickups = (Array.isArray(row.pickups) ? row.pickups : [])
    .map((item, i) => parseLocation(item, 'p', i))
    .filter((item): item is LocationEntry => Boolean(item))
    .slice(0, 4);
  const dropoffs = (Array.isArray(row.dropoffs) ? row.dropoffs : [])
    .map((item, i) => parseLocation(item, 'd', i))
    .filter((item): item is LocationEntry => Boolean(item))
    .slice(0, 4);

  if (!addressesReady(pickups, dropoffs)) {
    return { ok: false, error: 'Add a pickup and a drop-off address.' };
  }

  const detailsRaw = row.details && typeof row.details === 'object'
    ? (row.details as Record<string, unknown>)
    : row;

  const details: MoveDetails = {
    date: sanitizePlainText(String(detailsRaw.date || ''), 16),
    time: sanitizePlainText(String(detailsRaw.time || ''), 8),
    name: sanitizePlainText(String(detailsRaw.name || ''), 80),
    email: sanitizePlainText(String(detailsRaw.email || ''), 120),
    phone: sanitizePlainText(String(detailsRaw.phone || ''), 24),
    instructions: sanitizeMultiline(String(detailsRaw.instructions || ''), 800),
    bedDisassembly: Boolean(detailsRaw.bedDisassembly),
    bedIsAssembled: detailsRaw.bedIsAssembled !== false,
  };

  if (!details.date || !details.time) {
    return { ok: false, error: 'Choose a date and a start time.' };
  }
  if (!isContactValid(details)) {
    return { ok: false, error: 'Please add a name, email, and Australian phone number.' };
  }

  const crewSize = clamp(Math.round(asNumber(row.crewSize, 2)), 1, 2);
  const truckHours = clamp(asNumber(row.truckHours, 2), 1, 16);
  const distanceKm = clamp(asNumber(row.distanceKm, 0), 0, 5000);
  const travelTimeHrs = clamp(asNumber(row.travelTimeHrs, 0), 0, 48);

  const state: QuoteState = {
    step: 6,
    serviceType,
    vehicle,
    isManualTruckSelection: vehicle === 'truck',
    truckHours,
    crewSize,
    pickups: pickups.length ? pickups : [{ id: 'p1', address: '', access: 'ground', hasLoadingDock: false }],
    dropoffs: dropoffs.length ? dropoffs : [{ id: 'd1', address: '', access: 'ground', hasLoadingDock: false }],
    inventory: parseInventory(row.inventory),
    details,
    distanceKm,
    travelTimeHrs,
    isCBD: pickups.concat(dropoffs).some((loc) => loc.address.includes('2000') && !loc.hasLoadingDock),
    isInterstate: Boolean(row.isInterstate),
  };

  return { ok: true, state };
}
