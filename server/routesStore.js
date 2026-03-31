import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const ROUTES_FILE = path.join(DATA_DIR, 'routes.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ROUTES_FILE)) {
    const initial = [];
    fs.writeFileSync(ROUTES_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

function readRoutes() {
  ensureDataFile();
  const raw = fs.readFileSync(ROUTES_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeRoutes(routes) {
  ensureDataFile();
  fs.writeFileSync(ROUTES_FILE, JSON.stringify(routes, null, 2), 'utf-8');
}

export function getAllRoutes() {
  return readRoutes();
}

export function createRoute(name) {
  const routes = readRoutes();
  const route = {
    id: `r${Date.now()}`,
    name,
    stops: [],
  };
  routes.push(route);
  writeRoutes(routes);
  return route;
}

export function deleteRoute(id) {
  const routes = readRoutes();
  const filtered = routes.filter(r => r.id !== id);
  writeRoutes(filtered);
}

export function addStopToRoute(routeId, stop) {
  const routes = readRoutes();
  const idx = routes.findIndex(r => r.id === routeId);
  if (idx === -1) {
    throw new Error('Route not found');
  }
  const route = routes[idx];
  const newStop = {
    id: `s${Date.now()}`,
    name: stop.name,
    lat: stop.lat,
    lng: stop.lng,
    waitTime: stop.waitTime ?? 0,
    order: stop.order ?? route.stops.length + 1,
  };
  route.stops.push(newStop);
  routes[idx] = route;
  writeRoutes(routes);
  return newStop;
}

export function updateStop(stopId, updates) {
  const routes = readRoutes();
  let updatedStop = null;
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const sIdx = route.stops.findIndex(s => s.id === stopId);
    if (sIdx !== -1) {
      const stop = route.stops[sIdx];
      const merged = {
        ...stop,
        ...updates,
      };
      route.stops[sIdx] = merged;
      routes[i] = route;
      updatedStop = merged;
      break;
    }
  }
  if (!updatedStop) {
    throw new Error('Stop not found');
  }
  writeRoutes(routes);
  return updatedStop;
}

export function deleteStop(stopId) {
  const routes = readRoutes();
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const before = route.stops.length;
    route.stops = route.stops.filter(s => s.id !== stopId);
    if (route.stops.length !== before) {
      routes[i] = route;
      break;
    }
  }
  writeRoutes(routes);
}


