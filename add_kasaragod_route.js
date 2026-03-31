import Database from 'better-sqlite3';

const db = new Database('./server/data/campus.db');

const kasaragodStops = [
  { name: 'LBS College of Engineering', lat: 12.5505, lng: 75.0330, order: 1 },
  { name: 'Cherkala Junction', lat: 12.5200, lng: 75.0200, order: 2 },
  { name: 'Vidyanagar', lat: 12.5055, lng: 75.0005, order: 3 },
  { name: 'Kasaragod New Bus Stand', lat: 12.4988, lng: 74.9895, order: 4 },
  { name: 'Kasaragod Town', lat: 12.4983, lng: 74.9896, order: 5 },
  { name: 'Kasaragod Railway Station', lat: 12.4981, lng: 74.9869, order: 6 }
];

const kasRouteId = 'r1774825696880';

// Clear any existing stops just in case out of safety
db.prepare('DELETE FROM stops WHERE routeId = ?').run(kasRouteId);

// Insert correct stops
const insert = db.prepare('INSERT INTO stops (id, routeId, name, lat, lng, waitTime, "order") VALUES (?, ?, ?, ?, ?, ?, ?)');

kasaragodStops.forEach((s, idx) => {
  insert.run(`s_kas_fixed_${Date.now()}_${idx}`, kasRouteId, s.name, s.lat, s.lng, 5, s.order);
});

console.log('Restored Kasaragod stops precisely!');
