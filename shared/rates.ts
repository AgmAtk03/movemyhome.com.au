/**
 * Canonical rate table. The browser wizard and the serverless APIs
 * MUST import this same file so a 10% deposit cannot drift from the quote.
 * Do not invent new rates here — keep the existing Sydney / CBD / interstate logic.
 */
export const RATES = {
  VAN_BASE: 55,
  VAN_PER_KM: 0.42,
  VAN_MIN_KM: 0,
  TRUCK_HOURLY_TEAM: 90,
  TRUCK_HOURLY_SOLO: 80,
  TRUCK_MIN_HOURS: 2,
  CBD_FEE: 20,
  BED_SERVICE_FEE: 30,

  LONG_DISTANCE_THRESHOLD: 100,
  TRUCK_WEAR_PER_KM: 0.405,

  MARGIN_SOLO_PER_KM: 1.7385,
  MARGIN_TEAM_PER_KM: 2.5719,
} as const;

export const FLOOR_RATES: Record<string, number> = {
  ground: 0,
  floor1: 6.99,
  floor2: 9.99,
  floor3: 12.99,
  floor4: 16.99,
};

export const INVENTORY_COSTS: Record<string, number> = {
  boxes: 2,
  sofa: 10,
  mattress: 6.99,
  fridge: 5,
  washer: 5,
  tv: 0,
  bed: 10,
};

export const SERVICE_LABELS: Record<string, string> = {
  home_move: 'Home move',
  room_move: 'Room move',
  item_delivery: 'Item delivery',
};

export const ACCESS_LABELS: Record<string, string> = {
  ground: 'Ground floor or lift',
  floor1: '1st floor, stairs',
  floor2: '2nd floor, stairs',
  floor3: '3rd floor, stairs',
  floor4: '4th floor, stairs',
};

export const INVENTORY_LABELS: Record<string, string> = {
  boxes: 'Boxes / bags',
  sofa: 'Sofa',
  mattress: 'Mattress',
  bed: 'Bed frame',
  fridge: 'Fridge',
  washer: 'Washing machine',
  tv: 'TV',
};

export const BRAND_NAME = 'My Home Removals';
export const CURRENCY = 'aud';
export const DEPOSIT_RATE = 0.1;
