import Database from 'better-sqlite3';

const db = new Database('./server/data/campus.db');

const stops = [
  { name: 'LBS COLLEGE', lat: 12.5505, lng: 75.0330, order: 1 },
  { name: 'POINACHI', lat: 12.5255, lng: 75.0085, order: 2 },
  { name: 'PANAYAL', lat: 12.4550, lng: 74.9750, order: 3 },
  { name: 'BEKAL', lat: 12.3900, lng: 74.9600, order: 4 },
  { name: 'PERIYE', lat: 12.3440, lng: 75.0850, order: 5 },
  { name: 'KANHANGAD', lat: 12.3080, lng: 75.0400, order: 6 }
];

const routes = db.prepare('SELECT id FROM routes').all();
if (routes.length > 0) {
  const routeId = routes[0].id;
  db.prepare('DELETE FROM stops WHERE routeId = ?').run(routeId);
  const insert = db.prepare('INSERT INTO stops (id, routeId, name, lat, lng, waitTime, "order") VALUES (?, ?, ?, ?, ?, ?, ?)');
  stops.forEach((s, idx) => {
    insert.run(`s_fixed_${idx}`, routeId, s.name, s.lat, s.lng, 5, s.order);
  });
  console.log('Stops successfully updated for route:', routeId);
} else {
  console.log('No active routes found in DB!');
}
