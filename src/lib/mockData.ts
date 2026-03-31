export interface Bus {
  id: string;
  number: string;
  model: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  routeId: string;
  driverId: string;
  studentCount?: number;
  driverName?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  assignedBusId: string;
  isOnTrip: boolean;
  location?: { lat: number; lng: number };
}

export interface Student {
  id: string;
  name: string;
  registerNumber: string;
  phone: string;
  email: string;
  assignedBusId: string;
  class?: string;
  semester?: string;
  admissionYear?: string;
  pickupStopId?: string;
  dropStopId?: string;
}

export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  waitTime: number; // minutes
  order: number;
}

export interface Route {
  id: string;
  name: string;
  stops: BusStop[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'emergency';
  from: string;
  timestamp: Date;
  read: boolean;
}
