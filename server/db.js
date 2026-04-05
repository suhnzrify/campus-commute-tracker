import pkg from 'pg';
const { Pool } = pkg;
import { getAllRoutes } from './routesStore.js';
import { getBuses, getDrivers, getStudents } from './entitiesStore.js';
import { hashPassword } from './auth.js';

// Direct connection pool using native Node environment variables
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Helper for UI compatibility (snake_case to camelCase)
const toCamel = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const n = {};
  Object.keys(obj).forEach(k => {
    const ck = k.replace(/_([a-z])/g, (m, c) => c.toUpperCase());
    n[ck] = obj[k];
  });
  return n;
};

export const db = {
  query: (text, params) => pool.query(text.replace(/\?/g, (m, i) => `$${i + 1}`), params),
  prepare: (text) => {
    let pCount = 0;
    const pgText = text.replace(/\?/g, () => `$${++pCount}`);
    return {
      run: async (params) => {
        const values = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
        return pool.query(pgText, values);
      },
      get: async (params) => {
        const values = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
        const res = await pool.query(pgText, values);
        return toCamel(res.rows[0]);
      },
      all: async (params) => {
        const values = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
        const res = await pool.query(pgText, values);
        return res.rows.map(toCamel);
      }
    };
  }
};

export async function migrateFromJsonIfEmpty() {
  console.log("🚀 Initializing Supabase Schema & Sync...");
  let client;
  try {
    client = await pool.connect();

    // 1. Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS routes (id TEXT PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS stops (
        id TEXT PRIMARY KEY, route_id TEXT NOT NULL, name TEXT NOT NULL,
        lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
        wait_time INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL,
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS buses (
        id TEXT PRIMARY KEY, number TEXT NOT NULL, model TEXT NOT NULL,
        capacity INTEGER NOT NULL, status TEXT NOT NULL, route_id TEXT, driver_id TEXT
      );
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT,
        assigned_bus_id TEXT, is_on_trip INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, register_number TEXT NOT NULL,
        phone TEXT, email TEXT, assigned_bus_id TEXT, class TEXT, semester TEXT,
        admission_year TEXT, pickup_stop_id TEXT, drop_stop_id TEXT
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'student')),
        entity_id TEXT, email_verified INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, message TEXT NOT NULL,
        type TEXT NOT NULL, from_user TEXT NOT NULL, target_bus_id TEXT NOT NULL, timestamp BIGINT NOT NULL
      );
    `);

    // 2. Seed Data (Push local JSON to Cloud if empty)
    const routeCheck = await client.query("SELECT COUNT(*) FROM routes");
    if (parseInt(routeCheck.rows[0].count) === 0) {
      console.log("📦 Migrating local records to Supabase...");
      
      const routes = getAllRoutes();
      for (const r of routes) {
        await client.query('INSERT INTO routes (id, name) VALUES ($1, $2)', [r.id, r.name]);
        for (const s of r.stops) {
          await client.query('INSERT INTO stops (id, route_id, name, lat, lng, wait_time, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7)', [s.id, r.id, s.name, s.lat, s.lng, s.waitTime, s.order]);
        }
      }

      const buses = getBuses();
      for (const b of buses) {
        await client.query('INSERT INTO buses (id, number, model, capacity, status, route_id, driver_id) VALUES ($1, $2, $3, $4, $5, $6, $7)', [b.id, b.number, b.model, b.capacity, b.status, b.routeId, b.driverId]);
      }

      const drivers = getDrivers();
      for (const d of drivers) {
        await client.query('INSERT INTO drivers (id, name, phone, email, assigned_bus_id, is_on_trip) VALUES ($1, $2, $3, $4, $5, $6)', [d.id, d.name, d.phone, d.email, d.assignedBusId, d.isOnTrip ? 1 : 0]);
        if (d.email) {
          await client.query('INSERT INTO users (id, email, password_hash, role, entity_id, email_verified) VALUES ($1, $2, $3, $4, $5, 1) ON CONFLICT (email) DO NOTHING', [`u_${d.id}`, d.email.toLowerCase(), 'PROTECTED', 'driver', d.id]);
        }
      }

      const students = getStudents();
      for (const s of students) {
        await client.query('INSERT INTO students (id, name, register_number, phone, email, assigned_bus_id, class, semester, admission_year, pickup_stop_id, drop_stop_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', [s.id, s.name, s.registerNumber, s.phone, s.email, s.assignedBusId, s.class, s.semester, s.admissionYear, s.pickupStopId, s.dropStopId]);
        if (s.email) {
          await client.query('INSERT INTO users (id, email, password_hash, role, entity_id, email_verified) VALUES ($1, $2, $3, $4, $5, 1) ON CONFLICT (email) DO NOTHING', [`u_${s.id}`, s.email.toLowerCase(), 'PROTECTED', 'student', s.id]);
        }
      }

      // Default Admin
      const adminEmail = 'adminlbscek@gmail.com';
      await client.query('INSERT INTO users (id, email, password_hash, role, entity_id, email_verified) VALUES ($1, $2, $3, $4, $5, 1) ON CONFLICT (email) DO NOTHING', ['admin1', adminEmail, hashPassword('1234'), 'admin', null]);
      
      console.log("✅ Cloud Database seeding complete!");
    }

    console.log("✅ Supabase is ready!");
  } catch (err) {
    console.error("❌ Migration Failed:", err.message);
  } finally {
    if (client) client.release();
  }
}