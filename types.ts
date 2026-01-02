
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
