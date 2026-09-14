import { Inventory, LocationEntry, QuoteState, VehicleType } from '../types';
import { ACCESS_LABELS, INVENTORY_LABELS } from './rates';
import { sanitizeMultiline, sanitizePlainText } from '../lib/sanitize';

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
  return 'Local Sydney / NSW';
}
