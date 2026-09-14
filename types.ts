
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
}

export interface PriceBreakdown {
  total: number;
  base: number;
  distance: number;
  inventory: number;
  access: number;
  potentialAccess: number;
  cbd: number;
  bedService: number;
  hours: number;
  fuel: number;
  isFixedTrip: boolean;
  hourlyRate: number;
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
  included: string[];
  lines: { label: string; amount: string; note?: string }[];
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
  instructions: string;
  moveType: string;
  distanceLabel: string;
}
