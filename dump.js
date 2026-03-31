import Database from 'better-sqlite3';
import fs from 'fs';
const db = new Database('./server/data/campus.db');
const data = {
  routes: db.prepare('SELECT * FROM routes').all(),
  stops: db.prepare('SELECT routeId, name, lat, lng FROM stops ORDER BY routeId, "order"').all()
};
fs.writeFileSync('out.json', JSON.stringify(data, null, 2));
