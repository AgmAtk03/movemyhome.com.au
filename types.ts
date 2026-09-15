
export type VehicleType = 'van' | 'truck';
export type ServiceType = 'home_move' | 'room_move' | 'item_delivery';

export interface Inventory {
  boxes: number;
  sofa: number;
  mattress: number;
  bed: number;
  fridge: number;
  tv: number;
  washer: number;
}

export type AccessType = 'ground' | 'floor1' | 'floor2' | 'floor3' | 'floor4';

export interface LocationEntry {
  id: string;
  address: string;
  access: AccessType;
  hasLoadingDock: boolean;
}

export interface MoveDetails {
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  instructions: string;
  bedDisassembly: boolean;
  bedIsAssembled: boolean;
}

export interface QuoteState {
  step: number;
  serviceType: ServiceType | null;
  vehicle: VehicleType | null;
  isManualTruckSelection: boolean;
  truckHours: number;
  crewSize: number;
  pickups: LocationEntry[];
  dropoffs: LocationEntry[];
  inventory: Inventory;
  details: MoveDetails;
  distanceKm: number;
  travelTimeHrs: number;
  isCBD: boolean;
  isInterstate: boolean;
  /** Student/member code from homepage signup. Validated server-side at checkout. */
  discountCode: string;
}

export interface PriceBreakdown {
  total: number;
  /** Quote before member 5% off. Equals `total` when no discount applies. */
  subtotal: number;
  memberDiscount: number;
  memberDiscountCode: string;
  memberDiscountRate: number;
  base: number;
  distance: number;
  inventory: number;
  access: number;
  potentialAccess: number;
  cbd: number;
  bedService: number;
  hours: number;
  fuel: number;
  fuelLitres: number;
  fuelStatus: 'none' | 'waived' | 'priced' | 'tbc';
  dieselAudPerLitre: number | null;
  isFixedTrip: boolean;
  hourlyRate: number;
  deposit: number;
  balance: number;
  depositCents: number;
}

export interface QuoteSnapshot {
  serviceLabel: string;
  vehicleLabel: string;
  crewLabel: string;
  routeSummary: string;
  pickupAddresses: string[];
  dropoffAddresses: string[];
  inventorySummary: string;
  scheduleLabel: string;
  distanceLabel: string;
  travelTimeLabel: string;
  moveType: string;
  totalLabel: string;
  subtotalLabel: string;
  memberDiscountLabel: string;
  memberDiscountCode: string;
  depositLabel: string;
  balanceLabel: string;
  included: string[];
  lines: { label: string; amount: string; note?: string }[];
  fuelLine: { label: string; amount: string; note?: string; status: 'none' | 'waived' | 'priced' | 'tbc' };
}

export type JobWorkflowStatus = 'new' | 'confirmed' | 'in_progress' | 'done' | 'cancelled';
export type JobBoardFilter = 'all' | 'new' | 'upcoming' | 'future' | 'done' | 'cancelled';
export type JobScheduleBucket = 'new' | 'upcoming' | 'future' | 'done' | 'cancelled';

export interface StoredJob {
  id: string;
  createdAt: string;
  /** Staff workflow — persisted. Do not overwrite from the diary bucket. */
  workflowStatus: JobWorkflowStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  moveDate: string;
  moveTime: string;
  scheduleLabel: string;
  serviceLabel: string;
  vehicleLabel: string;
  crewLabel: string;
  routeSummary: string;
  pickupAddresses: string[];
  dropoffAddresses: string[];
  inventorySummary: string;
  totalLabel: string;
  depositLabel?: string;
  balanceLabel?: string;
  instructions: string;
  moveType: string;
  distanceLabel: string;
  paymentStatus?: 'demo' | 'unpaid' | 'deposit_paid';
  stripeSessionId?: string;
}
