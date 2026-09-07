
export const CONFIG = {
  COMPANY_NAME: 'Aama Removals',
  COMPANY_SHORT_NAME: 'Aama',
  COMPANY_EMAIL: 'bookings@aamaremovals.com.au',
  COMPANY_WEBSITE: './',
  COMPANY_PHONE: '1300 000 000',
  COMPANY_TAGLINE: 'Sydney Moving Made Simple.',
  // Replace these with your real EmailJS keys
  EMAILJS_SERVICE_ID: 'service_YOUR_ID',
  EMAILJS_TEMPLATE_ID: 'template_YOUR_ID',
  EMAILJS_PUBLIC_KEY: 'YOUR_PUBLIC_KEY',
};

export const RATES = {
  VAN_BASE: 55,
  VAN_PER_KM: 0.42,
  VAN_MIN_KM: 0,
  TRUCK_HOURLY_TEAM: 90,
  TRUCK_HOURLY_SOLO: 80,
  TRUCK_MIN_HOURS: 2,
  CBD_FEE: 20,
  BED_SERVICE_FEE: 30,
  
  // Long Distance / Fixed Trip Config
  LONG_DISTANCE_THRESHOLD: 100, // Distance in km where fixed trip pricing kicks in
  TRUCK_L_PER_100KM: 26,        // 26L per 100km
  DIESEL_PRICE_PER_L: 1.85,     // $1.85 per Litre
  TRUCK_WEAR_PER_KM: 0.405,      // $0.405 per km (Reduced 10% from 0.45)
  
  // Labor Margins per one-way KM (to satisfy the Canberra Rule: 300km trip)
  // Re-calculated based on 1.8x Return Trip multiplier and $0.405 Wear rate
  // Solo (1 Man) Target $1000 for 300km: Margin approx $1.7385/km
  // Team (2 Men) Target $1250 for 300km: Margin approx $2.5719/km
  MARGIN_SOLO_PER_KM: 1.7385,
  MARGIN_TEAM_PER_KM: 2.5719,
};

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

export const VEHICLE_OPTIONS = [
  {
    id: 'van',
    name: 'Van',
    icon: '🚐',
    desc: 'Small Moves (Studio/1 Bed)',
  },
  {
    id: 'truck',
    name: 'Truck',
    icon: '🚛',
    desc: 'Large Moves (2+ Bedrooms)',
  },
] as const;
