import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getAllRoutes } from './routesStore.js';
import {
  getBuses,
  getDrivers,
  getStudents,
} from './entitiesStore.js';
import { hashPassword } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'campus.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);

function run(sql) {
  db.prepare(sql).run();
}

export function initSchema() {
  run(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS stops (
      id TEXT PRIMARY KEY,
      routeId TEXT NOT NULL,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      waitTime INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL,
      FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS buses (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL,
      model TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      status TEXT NOT NULL,
      routeId TEXT,
      driverId TEXT
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      assignedBusId TEXT,
      isOnTrip INTEGER NOT NULL DEFAULT 0
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      registerNumber TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      assignedBusId TEXT
    );
  `);

  run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'student')),
      entityId TEXT,
      emailVerified INTEGER NOT NULL DEFAULT 0
    );
  `);
}

function tableIsEmpty(name) {
  const row = db.prepare(`SELECT COUNT(*) as c FROM ${name}`).get();
  return row.c === 0;
}

export function migrateFromJsonIfEmpty() {
  initSchema();

  // Routes & stops
  if (tableIsEmpty('routes')) {
    const routes = getAllRoutes();
    const insertRoute = db.prepare(
      'INSERT INTO routes (id, name) VALUES (@id, @name)'
    );
    const insertStop = db.prepare(
      'INSERT INTO stops (id, routeId, name, lat, lng, waitTime, "order") VALUES (@id, @routeId, @name, @lat, @lng, @waitTime, @order)'
    );
    const tx = db.transaction(() => {
      routes.forEach(route => {
        insertRoute.run({ id: route.id, name: route.name });
        route.stops.forEach(stop => {
          insertStop.run({
            id: stop.id,
            routeId: route.id,
            name: stop.name,
            lat: stop.lat,
            lng: stop.lng,
            waitTime: stop.waitTime,
            order: stop.order,
          });
        });
      });
    });
    tx();
  }

  // Buses
  if (tableIsEmpty('buses')) {
    const buses = getBuses();
    const insertBus = db.prepare(
      'INSERT INTO buses (id, number, model, capacity, status, routeId, driverId) VALUES (@id, @number, @model, @capacity, @status, @routeId, @driverId)'
    );
    const tx = db.transaction(() => {
      buses.forEach(b => insertBus.run(b));
    });
    tx();
  }

  // Drivers
  if (tableIsEmpty('drivers')) {
    const drivers = getDrivers();
    const insertDriver = db.prepare(
      'INSERT INTO drivers (id, name, phone, email, assignedBusId, isOnTrip) VALUES (@id, @name, @phone, @email, @assignedBusId, @isOnTrip)'
    );
    const tx = db.transaction(() => {
      drivers.forEach(d =>
        insertDriver.run({
          ...d,
          isOnTrip: d.isOnTrip ? 1 : 0,
        })
      );
    });
    tx();
  }

  // Students
  if (tableIsEmpty('students')) {
    const students = getStudents();
    const insertStudent = db.prepare(
      'INSERT INTO students (id, name, registerNumber, phone, email, assignedBusId) VALUES (@id, @name, @registerNumber, @phone, @email, @assignedBusId)'
    );
    const tx = db.transaction(() => {
      students.forEach(s => insertStudent.run(s));
    });
    tx();
  }

  // Users (login accounts): ensure default admin admin@gmail.com / 1234 always works
  const defaultAdminEmail = 'admin@gmail.com';
  const defaultAdminHash = hashPassword('1234');
  const existingAdmin = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(defaultAdminEmail);
  if (existingAdmin) {
    db.prepare('UPDATE users SET passwordHash = ?, emailVerified = 1 WHERE id = ?').run(defaultAdminHash, existingAdmin.id);
  } else {
    const insertUser = db.prepare(
      'INSERT INTO users (id, email, passwordHash, role, entityId, emailVerified) VALUES (@id, @email, @passwordHash, @role, @entityId, @emailVerified)'
    );
    const adminId = 'admin1';
    insertUser.run({
      id: adminId,
      email: defaultAdminEmail,
      passwordHash: defaultAdminHash,
      role: 'admin',
      entityId: null,
      emailVerified: 1,
    });
  }
  // If old admin@college.edu exists and is different from admin1, remove it to avoid duplicate email
  const oldAdmin = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get('admin@college.edu');
  if (oldAdmin && oldAdmin.id !== (existingAdmin && existingAdmin.id)) {
    db.prepare('DELETE FROM users WHERE id = ?').run(oldAdmin.id);
  }
}

