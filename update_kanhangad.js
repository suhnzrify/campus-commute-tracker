import Database from 'better-sqlite3';

const db = new Database('./server/data/campus.db');

const kanhangadStops = [
  { name: 'LBS COLLEGE', lat: 12.5002, lng: 75.0830, order: 1 },
  { name: 'POINACHI', lat: 12.4583, lng: 75.0625, order: 2 },
  { name: 'PANAYAL', lat: 12.4356, lng: 75.0690, order: 3 },
  { name: 'PERIYE', lat: 12.4100, lng: 75.0900, order: 4 },
  { name: 'KANHANGAD', lat: 12.3160, lng: 75.0880, order: 5 }
];

const kanRouteId = 'r1774828587922';

db.prepare('DELETE FROM stops WHERE routeId = ?').run(kanRouteId);

const insert = db.prepare('INSERT INTO stops (id, routeId, name, lat, lng, waitTime, "order") VALUES (?, ?, ?, ?, ?, ?, ?)');

kanhangadStops.forEach((s, idx) => {
  insert.run(`s_kan_fixed_v2_${Date.now()}_${idx}`, kanRouteId, s.name, s.lat, s.lng, 5, s.order);
});

console.log('Kanhangad route coordinates updated successfully!');
