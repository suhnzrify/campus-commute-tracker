import Database from 'better-sqlite3';

const db = new Database('./server/data/campus.db');
console.log('Routes:', db.prepare('SELECT * FROM routes').all());
console.log('Stops:', db.prepare('SELECT routeId, name, lat, lng FROM stops ORDER BY routeId, "order"').all());
