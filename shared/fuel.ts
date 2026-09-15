import { roundMoney } from './money.js';

/** Under this driving distance, fuel is not charged. */
export const FUEL_FREE_UNDER_KM = 12;

/** Owner rule: 10 km of driving uses 1 litre of diesel. */
export const FUEL_KM_PER_LITRE = 10;

export type FuelStatus = 'none' | 'waived' | 'priced' | 'tbc';

export interface FuelSurcharge {
  fuel: number;
  litres: number;
  status: FuelStatus;
  dieselAudPerLitre: number | null;
}

/**
 * Fuel on the quote:
 *   distance < 12 km → $0
 *   distance ≥ 12 km → litres = km / 10, cost = litres × live 7-Eleven diesel (AUD/L)
 * If the diesel price is missing, do not invent one: status is `tbc` and fuel is $0.
 */
export function calculateFuelSurcharge(
  distanceKm: number,
  dieselAudPerLitre: number | null | undefined,
  opts: { include: boolean } = { include: true }
): FuelSurcharge {
  if (!opts.include) {
    return { fuel: 0, litres: 0, status: 'none', dieselAudPerLitre: dieselAudPerLitre ?? null };
  }

  const km = Number.isFinite(distanceKm) ? Math.max(0, distanceKm) : 0;
  const price = typeof dieselAudPerLitre === 'number' && Number.isFinite(dieselAudPerLitre) && dieselAudPerLitre > 0
    ? dieselAudPerLitre
    : null;

  // No Maps distance yet — do not treat 0 km as a free short trip.
  if (km <= 0) {
    return { fuel: 0, litres: 0, status: 'none', dieselAudPerLitre: price };
  }

  const litres = roundMoney(km / FUEL_KM_PER_LITRE);

  if (km < FUEL_FREE_UNDER_KM) {
    return { fuel: 0, litres: 0, status: 'waived', dieselAudPerLitre: price };
  }

  if (price == null) {
    return { fuel: 0, litres, status: 'tbc', dieselAudPerLitre: null };
  }

  return {
    fuel: roundMoney(litres * price),
    litres,
    status: 'priced',
    dieselAudPerLitre: price,
  };
}
