import type { Inventory, LocationEntry, PriceBreakdown, VehicleType } from '../types.js';
import { FLOOR_RATES, INVENTORY_COSTS, RATES } from './rates.js';
import { depositFromQuoteTotal, roundMoney } from './money.js';
import { calculateFuelSurcharge } from './fuel.js';

export const EMPTY_BREAKDOWN: PriceBreakdown = {
  total: 0,
  base: 0,
  distance: 0,
  inventory: 0,
  access: 0,
  potentialAccess: 0,
  cbd: 0,
  bedService: 0,
  hours: 0,
  fuel: 0,
  fuelLitres: 0,
  fuelStatus: 'none',
  dieselAudPerLitre: null,
  isFixedTrip: false,
  hourlyRate: 0,
  deposit: 0,
  balance: 0,
  depositCents: 0,
};

export interface QuoteCalcInput {
  vehicle: VehicleType | null;
  truckHours: number;
  crewSize: number;
  pickups: LocationEntry[];
  dropoffs: LocationEntry[];
  inventory: Inventory;
  bedDisassembly: boolean;
  bedIsAssembled: boolean;
  distanceKm: number;
  travelTimeHrs: number;
  isInterstate: boolean;
  /** Live 7-Eleven diesel AUD/L. Null → fuel TBC (not guessed). */
  dieselAudPerLitre?: number | null;
  /** Wizard step. Server checkout always uses 6 (full quote). */
  step: number;
}

function withDeposit(breakdown: Omit<PriceBreakdown, 'deposit' | 'balance' | 'depositCents'>): PriceBreakdown {
  const money = depositFromQuoteTotal(breakdown.total);
  return {
    ...breakdown,
    total: money.quoteTotal,
    deposit: money.deposit,
    balance: money.balance,
    depositCents: money.depositCents,
  };
}

/**
 * Existing local / CBD / interstate pricing. Do not change the rate table.
 * Step filters match the wizard: route costs from step 3, inventory from step 4.
 */
export function calculateQuote(input: QuoteCalcInput): PriceBreakdown {
  if (!input.vehicle || input.step === 1) return EMPTY_BREAKDOWN;

  let base = 0;
  let distance = 0;
  let inventory = 0;
  let access = 0;
  let potentialAccess = 0;
  let bedService = 0;
  let hours = 0;
  let isFixedTrip = false;
  let hourlyRate = 0;

  let cbdFee = 0;
  [...input.pickups, ...input.dropoffs].forEach((loc) => {
    const isLocCBD = loc.address.includes('2000');
    if (isLocCBD && !loc.hasLoadingDock) {
      cbdFee += RATES.CBD_FEE;
    }
    potentialAccess += FLOOR_RATES[loc.access] || 0;
  });

  if (input.vehicle === 'truck') {
    const isLongDistance = input.distanceKm > RATES.LONG_DISTANCE_THRESHOLD;
    hourlyRate = input.crewSize === 1 ? RATES.TRUCK_HOURLY_SOLO : RATES.TRUCK_HOURLY_TEAM;

    if (isLongDistance) {
      isFixedTrip = true;
      const totalDistanceDiscountedReturn = input.distanceKm * 1.8;
      const rawCost = totalDistanceDiscountedReturn * RATES.TRUCK_WEAR_PER_KM;
      const marginPerKm = input.crewSize === 1 ? RATES.MARGIN_SOLO_PER_KM : RATES.MARGIN_TEAM_PER_KM;
      const laborMargin = input.distanceKm * marginPerKm;
      base = rawCost + laborMargin;
      hours = input.travelTimeHrs;
    } else {
      hours = input.isInterstate ? input.travelTimeHrs : Math.max(RATES.TRUCK_MIN_HOURS, input.truckHours);
      base = hours * hourlyRate;
    }
  } else {
    base = RATES.VAN_BASE;
    distance = input.distanceKm * RATES.VAN_PER_KM;
    access = potentialAccess;
  }

  (Object.keys(input.inventory) as (keyof Inventory)[]).forEach((key) => {
    inventory += input.inventory[key] * (INVENTORY_COSTS[key] || 0);
  });

  if (input.inventory.bed > 0 && input.bedIsAssembled && input.bedDisassembly) {
    bedService = RATES.BED_SERVICE_FEE;
  }

  const showInventoryCosts = input.step >= 4;
  const showRouteCosts = input.step >= 3;
  const fuelCharge = calculateFuelSurcharge(input.distanceKm, input.dieselAudPerLitre, {
    include: showRouteCosts,
  });

  const filteredInventory = showInventoryCosts ? inventory : 0;
  const filteredBedService = showInventoryCosts ? bedService : 0;
  const filteredDistance = showRouteCosts ? distance : 0;
  const filteredFuel = fuelCharge.fuel;
  const filteredCBD = showRouteCosts ? cbdFee : 0;
  const filteredAccess = showRouteCosts ? access : 0;

  const total = roundMoney(
    base + filteredDistance + filteredInventory + filteredAccess + filteredCBD + filteredBedService + filteredFuel
  );

  return withDeposit({
    total,
    base: roundMoney(base),
    distance: roundMoney(filteredDistance),
    inventory: roundMoney(filteredInventory),
    access: roundMoney(filteredAccess),
    potentialAccess: showRouteCosts ? roundMoney(potentialAccess) : 0,
    cbd: roundMoney(filteredCBD),
    bedService: roundMoney(filteredBedService),
    hours,
    fuel: roundMoney(filteredFuel),
    fuelLitres: fuelCharge.litres,
    fuelStatus: fuelCharge.status,
    dieselAudPerLitre: fuelCharge.dieselAudPerLitre,
    isFixedTrip,
    hourlyRate,
  });
}

export function calculateFullQuote(input: Omit<QuoteCalcInput, 'step'>): PriceBreakdown {
  return calculateQuote({ ...input, step: 6 });
}
