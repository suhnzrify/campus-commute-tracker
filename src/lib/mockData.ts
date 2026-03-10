export interface Bus {
  id: string;
  number: string;
  model: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  routeId: string;
  driverId: string;
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

export const mockRoutes: Route[] = [
  {
    id: 'r1',
    name: 'Route A - North Campus',
    stops: [
      { id: 's1', name: 'Central Station', lat: 13.0827, lng: 80.2707, waitTime: 5, order: 1 },
      { id: 's2', name: 'Park Avenue', lat: 13.0850, lng: 80.2750, waitTime: 3, order: 2 },
      { id: 's3', name: 'MG Road Junction', lat: 13.0880, lng: 80.2790, waitTime: 3, order: 3 },
      { id: 's4', name: 'Tech Park', lat: 13.0910, lng: 80.2830, waitTime: 4, order: 4 },
      { id: 's5', name: 'College Gate', lat: 13.0950, lng: 80.2870, waitTime: 0, order: 5 },
    ],
  },
  {
    id: 'r2',
    name: 'Route B - South Campus',
    stops: [
      { id: 's6', name: 'Beach Road', lat: 13.0600, lng: 80.2800, waitTime: 5, order: 1 },
      { id: 's7', name: 'Marina Stop', lat: 13.0650, lng: 80.2780, waitTime: 3, order: 2 },
      { id: 's8', name: 'Temple Street', lat: 13.0700, lng: 80.2760, waitTime: 3, order: 3 },
      { id: 's9', name: 'Hospital Junction', lat: 13.0770, lng: 80.2740, waitTime: 4, order: 4 },
      { id: 's10', name: 'College Gate', lat: 13.0950, lng: 80.2870, waitTime: 0, order: 5 },
    ],
  },
];

export const mockBuses: Bus[] = [
  { id: 'b1', number: 'BUS-001', model: 'Ashok Leyland Viking', capacity: 52, status: 'active', routeId: 'r1', driverId: 'd1' },
  { id: 'b2', number: 'BUS-002', model: 'Tata Starbus', capacity: 48, status: 'active', routeId: 'r2', driverId: 'd2' },
  { id: 'b3', number: 'BUS-003', model: 'Eicher Skyline', capacity: 40, status: 'inactive', routeId: 'r1', driverId: 'd3' },
  { id: 'b4', number: 'BUS-004', model: 'Ashok Leyland Viking', capacity: 52, status: 'maintenance', routeId: 'r2', driverId: '' },
];

export const mockDrivers: Driver[] = [
  { id: 'd1', name: 'Rajesh Kumar', phone: '+91 98765 43210', email: 'rajesh@college.edu', assignedBusId: 'b1', isOnTrip: true, location: { lat: 13.0860, lng: 80.2770 } },
  { id: 'd2', name: 'Suresh Babu', phone: '+91 98765 43211', email: 'suresh@college.edu', assignedBusId: 'b2', isOnTrip: false },
  { id: 'd3', name: 'Mohammed Ali', phone: '+91 98765 43212', email: 'mohammed@college.edu', assignedBusId: 'b3', isOnTrip: false },
];

export const mockStudents: Student[] = [
  { id: 'st1', name: 'Arun Prakash', registerNumber: '2024CS001', phone: '+91 87654 32100', email: 'arun@student.edu', assignedBusId: 'b1' },
  { id: 'st2', name: 'Priya Sharma', registerNumber: '2024CS002', phone: '+91 87654 32101', email: 'priya@student.edu', assignedBusId: 'b1' },
  { id: 'st3', name: 'Karthik Raja', registerNumber: '2024EC003', phone: '+91 87654 32102', email: 'karthik@student.edu', assignedBusId: 'b2' },
  { id: 'st4', name: 'Divya Lakshmi', registerNumber: '2024ME004', phone: '+91 87654 32103', email: 'divya@student.edu', assignedBusId: 'b2' },
  { id: 'st5', name: 'Vikram Singh', registerNumber: '2024EE005', phone: '+91 87654 32104', email: 'vikram@student.edu', assignedBusId: 'b1' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Route Change', message: 'BUS-001 will take alternate route via Highway due to road work.', type: 'warning', from: 'Admin', timestamp: new Date(Date.now() - 1000 * 60 * 30), read: false },
  { id: 'n2', title: 'Bus Delayed', message: 'BUS-002 is running 10 minutes late due to traffic.', type: 'info', from: 'Driver - Suresh', timestamp: new Date(Date.now() - 1000 * 60 * 60), read: true },
  { id: 'n3', title: 'Emergency', message: 'All evening buses cancelled due to heavy rain alert.', type: 'emergency', from: 'Admin', timestamp: new Date(Date.now() - 1000 * 60 * 120), read: false },
];
