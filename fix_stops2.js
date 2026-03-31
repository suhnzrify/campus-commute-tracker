import Database from 'better-sqlite3';

const db = new Database('./server/data/campus.db');

const kanhangadStops = [
  { name: 'LBS COLLEGE', lat: 12.5505, lng: 75.0330, order: 1 },
  { name: 'POINACHI', lat: 12.5255, lng: 75.0085, order: 2 },
  { name: 'PANAYAL', lat: 12.4550, lng: 74.9750, order: 3 },
  { name: 'BEKAL', lat: 12.3900, lng: 74.9600, order: 4 },
  { name: 'PERIYE', lat: 12.3440, lng: 75.0850, order: 5 },
  { name: 'KANHANGAD', lat: 12.3080, lng: 75.0400, order: 6 }
];

// Target specific routes identified in the dump
const kasRouteId = 'r1774825696880';
const kanRouteId = 'r1774828587922';

// 1. Delete all stops for both
db.prepare('DELETE FROM stops WHERE routeId = ?').run(kasRouteId);
db.prepare('DELETE FROM stops WHERE routeId = ?').run(kanRouteId);

// 2. Insert correct stops for Kanhangad
const insert = db.prepare('INSERT INTO stops (id, routeId, name, lat, lng, waitTime, "order") VALUES (?, ?, ?, ?, ?, ?, ?)');
kanhangadStops.forEach((s, idx) => {
  insert.run(`s_kan_fixed_${idx}`, kanRouteId, s.name, s.lat, s.lng, 5, s.order);
});

console.log('Successfully untangled routes! Kanhangad is precise, Kasaragod stops reset.');
