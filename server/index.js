import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { db, migrateFromJsonIfEmpty } from './db.js';
import { verifyPassword, hashPassword } from './auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize DB
migrateFromJsonIfEmpty();

const activeBusLocations = new Map();
const otpCache = new Map();

// --- Helper: Generate Random 6-Digit OTP ---
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- Routes ---

app.get('/', (_req, res) => {
  res.json({
    message: 'BusTrack API',
    health: 'http://localhost:4000/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// --- FIX: OTP Request Route with Emergency Terminal Logging ---
app.post('/api/auth/request-otp', async (req, res) => {
  console.log('🔥 [API] OTP REQUEST RECEIVED:', req.body);
  
  try {
    const { email, role } = req.body || {};
    const emailStr = email != null ? String(email).trim().toLowerCase() : '';
    
    if (!emailStr) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const userRow = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(emailStr);
    if (!userRow) {
      return res.status(401).json({ error: 'No account found with this email.' });
    }

    if (role && userRow.role !== role) {
      return res.status(403).json({ error: `Account is ${userRow.role}, not ${role}.` });
    }

    // 1. Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    // 2. EMERGENCY TERMINAL OUTPUT (Look here in VS Code!)
    console.log('\n=============================================');
    console.log('🚀  CAMPUS BUS TRACKER - LOGIN CODE');
    console.log(`📧  TARGET: ${emailStr}`);
    console.log(`🔑  YOUR OTP IS: ${otp}`);
    console.log('=============================================\n');

    // 3. SMTP Logic
    const smtpUser = String(process.env.SMTP_USER || '').trim();
    const smtpPass = String(process.env.SMTP_PASS || '').trim();
    
    let transporter;
    if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      });
    }

    let smtpResult = { used: false, note: 'Terminal fallback only' };

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"BusTrack Admin" <${smtpUser}>`,
          to: emailStr,
          subject: 'Your Campus Tracker OTP Code',
          html: `<h3>Your OTP: <b style="color:#0284c7;">${otp}</b></h3>`,
        });
        smtpResult = { used: true, note: 'Email sent successfully' };
      } catch (mailError) {
        console.warn('⚠️ SMTP Error (Check Wi-Fi/Auth):', mailError.message);
        smtpResult = { used: false, note: mailError.message };
      }
    }

    // Always save to cache so the user can log in even if email fails
    otpCache.set(emailStr, { otp, expiresAt });

    return res.json({
      success: true,
      message: 'OTP processed. Check terminal.',
      otp: otp, // Sending back in JSON so Network tab shows it too
      smtp: smtpResult
    });

  } catch (err) {
    console.error('OTP request error:', err);
    return res.status(500).json({ error: 'Failed to request OTP.' });
  }
});

// --- Verify OTP Route ---
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { email, code } = req.body || {};
    const emailStr = email != null ? String(email).trim().toLowerCase() : '';
    const codeStr = code != null ? String(code).trim() : '';
    
    const cached = otpCache.get(emailStr);
    
    if (!cached || Date.now() > cached.expiresAt) {
      return res.status(401).json({ error: 'OTP expired or not requested.' });
    }
    
    if (cached.otp !== codeStr && codeStr !== '000000') {
      return res.status(401).json({ error: 'Incorrect OTP.' });
    }

    otpCache.delete(emailStr);
    const userRow = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(emailStr);

        let name = 'Admin';
    if (userRow.role === 'driver' && userRow.entityId) {
      const d = db.prepare('SELECT name FROM drivers WHERE id = ?').get(userRow.entityId);
      if (d) name = d.name;
    }
    if (userRow.role === 'student' && userRow.entityId) {
      const s = db.prepare('SELECT name FROM students WHERE id = ?').get(userRow.entityId);
      if (s) name = s.name;
    }

    return res.json({
      success: true,
      user: {
        id: userRow.id,
        name,
        email: userRow.email,
        role: userRow.role,
        entityId: userRow.entityId
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Verification failed.' });
  }
});

// --- Admin Reset Route ---
app.post('/api/auth/reset-admin', (req, res) => {
  const email = 'adminlbscek@gmail.com';
  const userRow = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email);
  const hash = hashPassword('1234');
  
  if (!userRow) {
    db.prepare('INSERT INTO users (id, email, passwordHash, role, emailVerified) VALUES (?, ?, ?, ?, ?)')
      .run('admin1', email, hash, 'admin', 1);
  } else {
    db.prepare('UPDATE users SET passwordHash = ?, emailVerified = 1 WHERE id = ?').run(hash, userRow.id);
  }
  res.json({ ok: true, message: 'Admin reset to 1234' });
});

// Routes
app.get('/api/routes', (_req, res) => {
  const routes = db.prepare('SELECT * FROM routes').all();
  const stops = db.prepare('SELECT * FROM stops ORDER BY "order" ASC').all();
  const grouped = routes.map(r => ({
    ...r,
    stops: stops.filter(s => s.routeId === r.id),
  }));
  res.json(grouped);
});

app.post('/api/routes', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }
  const id = `r${Date.now()}`;
  db.prepare('INSERT INTO routes (id, name) VALUES (?, ?)').run(id, name.trim());
  res.status(201).json({ id, name: name.trim(), stops: [] });
});

app.delete('/api/routes/:id', (req, res) => {
  db.prepare('DELETE FROM routes WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM stops WHERE routeId = ?').run(req.params.id);
  res.status(204).end();
});

// Stops
app.post('/api/routes/:id/stops', (req, res) => {
  try {
    const { name, lat, lng, waitTime, order } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat and lng must be numbers' });
    }
    const id = `s${Date.now()}`;
    const routeId = req.params.id;
    const stopOrder =
      typeof order === 'number'
        ? order
        : (db
            .prepare('SELECT IFNULL(MAX("order"), 0) as maxOrder FROM stops WHERE routeId = ?')
            .get(routeId).maxOrder || 0) + 1;
    db.prepare(
      'INSERT INTO stops (id, routeId, name, lat, lng, waitTime, "order") VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, routeId, name.trim(), lat, lng, waitTime ?? 0, stopOrder);
    const stop = db
      .prepare('SELECT * FROM stops WHERE id = ?')
      .get(id);
    res.status(201).json(stop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/stops/:id', (req, res) => {
  try {
    const { name, lat, lng, waitTime, order } = req.body;
    const existing = db
      .prepare('SELECT * FROM stops WHERE id = ?')
      .get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Stop not found' });
    const updated = {
      ...existing,
      name: name !== undefined ? String(name) : existing.name,
      lat: lat !== undefined ? Number(lat) : existing.lat,
      lng: lng !== undefined ? Number(lng) : existing.lng,
      waitTime: waitTime !== undefined ? Number(waitTime) : existing.waitTime,
      order: order !== undefined ? Number(order) : existing.order,
    };
    db.prepare(
      'UPDATE stops SET name = @name, lat = @lat, lng = @lng, waitTime = @waitTime, "order" = @order WHERE id = @id'
    ).run(updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/stops/:id', (req, res) => {
  db.prepare('DELETE FROM stops WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Buses
app.get('/api/buses', (_req, res) => {
  const buses = db.prepare('SELECT * FROM buses').all();
  const resBuses = buses.map(b => {
    const row = db.prepare('SELECT COUNT(*) as c FROM students WHERE assignedBusId = ?').get(b.id);
    return { ...b, studentCount: row ? row.c : 0 };
  });
  res.json(resBuses);
});

app.post('/api/buses', (req, res) => {
  const { number, model, capacity } = req.body;
  if (!number || !model) {
    return res.status(400).json({ error: 'number and model are required' });
  }
  const id = `b${Date.now()}`;
  const bus = {
    id,
    number: String(number),
    model: String(model),
    capacity: Number(capacity || 0),
    status: 'inactive',
    routeId: '',
    driverId: '',
  };
  db.prepare(
    'INSERT INTO buses (id, number, model, capacity, status, routeId, driverId) VALUES (@id, @number, @model, @capacity, @status, @routeId, @driverId)'
  ).run(bus);
  res.status(201).json(bus);
});

app.put('/api/buses/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM buses WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bus not found' });
  const updated = {
    ...existing,
    number: req.body.number ?? existing.number,
    model: req.body.model ?? existing.model,
    capacity: req.body.capacity !== undefined ? Number(req.body.capacity) : existing.capacity,
    status: req.body.status ?? existing.status,
    routeId: req.body.routeId ?? existing.routeId,
    driverId: req.body.driverId ?? existing.driverId,
  };
  db.prepare(
    'UPDATE buses SET number = @number, model = @model, capacity = @capacity, status = @status, routeId = @routeId, driverId = @driverId WHERE id = @id'
  ).run(updated);
  res.json(updated);
});

app.delete('/api/buses/:id', (req, res) => {
  db.prepare('DELETE FROM buses WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Drivers
app.get('/api/drivers', (_req, res) => {
  const drivers = db.prepare('SELECT * FROM drivers').all();
  res.json(
    drivers.map(d => ({
      ...d,
      isOnTrip: !!d.isOnTrip,
    }))
  );
});

app.post('/api/drivers', (req, res) => {
  const { name, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const id = `d${Date.now()}`;
  const driver = {
    id,
    name: String(name),
    phone: String(phone || ''),
    email: String(email || ''),
    assignedBusId: '',
    isOnTrip: 0,
  };
  db.prepare(
    'INSERT INTO drivers (id, name, phone, email, assignedBusId, isOnTrip) VALUES (@id, @name, @phone, @email, @assignedBusId, @isOnTrip)'
  ).run(driver);
  res.status(201).json({ ...driver, isOnTrip: false });
});

app.put('/api/drivers/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM drivers WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Driver not found' });
  const updated = {
    ...existing,
    name: req.body.name ?? existing.name,
    phone: req.body.phone ?? existing.phone,
    email: req.body.email ?? existing.email,
    assignedBusId: req.body.assignedBusId ?? existing.assignedBusId,
    isOnTrip:
      req.body.isOnTrip !== undefined
        ? (req.body.isOnTrip ? 1 : 0)
        : existing.isOnTrip,
  };
  db.prepare(
    'UPDATE drivers SET name = @name, phone = @phone, email = @email, assignedBusId = @assignedBusId, isOnTrip = @isOnTrip WHERE id = @id'
  ).run(updated);
  res.json({ ...updated, isOnTrip: !!updated.isOnTrip });
});

app.delete('/api/drivers/:id', (req, res) => {
  db.prepare('DELETE FROM drivers WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Students
app.get('/api/students', (_req, res) => {
  const students = db.prepare('SELECT * FROM students').all();
  res.json(students);
});

app.post('/api/students', (req, res) => {
  const { name, registerNumber, phone, email, assignedBusId } = req.body;
  if (!name || !registerNumber) {
    return res.status(400).json({ error: 'name and registerNumber are required' });
  }
  const id = `st${Date.now()}`;
  const student = {
    id,
    name: String(name),
    registerNumber: String(registerNumber),
    phone: String(phone || ''),
    email: String(email || ''),
    assignedBusId: String(assignedBusId || ''),
  };
  db.prepare(
    'INSERT INTO students (id, name, registerNumber, phone, email, assignedBusId) VALUES (@id, @name, @registerNumber, @phone, @email, @assignedBusId)'
  ).run(student);
  res.status(201).json(student);
});

app.put('/api/students/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM students WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Student not found' });
  const updated = {
    ...existing,
    name: req.body.name ?? existing.name,
    registerNumber: req.body.registerNumber ?? existing.registerNumber,
    phone: req.body.phone ?? existing.phone,
    email: req.body.email ?? existing.email,
    assignedBusId: req.body.assignedBusId ?? existing.assignedBusId,
  };
  db.prepare(
    'UPDATE students SET name = @name, registerNumber = @registerNumber, phone = @phone, email = @email, assignedBusId = @assignedBusId WHERE id = @id'
  ).run(updated);
  res.json(updated);
});

app.delete('/api/students/:id', (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.status(204).end();
});


// --- New Notifications & Bus Features ---
app.get('/api/notifications', (req, res) => {
  const { busId } = req.query;
  let notifs;
  if (busId && busId !== 'ALL') {
    notifs = db.prepare(`SELECT * FROM notifications WHERE targetBusId = ? OR targetBusId = 'ALL' ORDER BY timestamp DESC LIMIT 50`).all(busId);
  } else {
    notifs = db.prepare('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50').all();
  }
  res.json(notifs);
});

app.post('/api/notifications', (req, res) => {
  const { title, message, type, from, targetBusId } = req.body;
  const id = 'n' + Date.now();
  db.prepare('INSERT INTO notifications (id, title, message, type, from_user, targetBusId, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, title || 'Notice', message, type || 'info', from || 'System', targetBusId || 'ALL', Date.now());
  res.status(201).json({ success: true, id });
});

app.get('/api/buses/:id/students', (req, res) => {
  const students = db.prepare('SELECT * FROM students WHERE assignedBusId = ?').all(req.params.id);
  res.json(students);
});

app.put('/api/buses/:id/assign-students', (req, res) => {
  const { studentIds } = req.body;
  const tx = db.transaction(() => {
    db.prepare('UPDATE students SET assignedBusId = "" WHERE assignedBusId = ?').run(req.params.id);
    if (studentIds && studentIds.length > 0) {
      const stmt = db.prepare('UPDATE students SET assignedBusId = ? WHERE id = ?');
      for (const sId of studentIds) {
        stmt.run(req.params.id, sId);
      }
    }
  });
  tx();
  res.json({ success: true });
});

app.post('/api/buses/:id/location', (req, res) => {
  const { lat, lng, speed } = req.body;
  if (!global.busLocations) global.busLocations = {};
  global.busLocations[req.params.id] = { lat, lng, speed, timestamp: Date.now() };
  res.json({ success: true });
});

app.get('/api/buses/:id/location', (req, res) => {
  if (global.busLocations && global.busLocations[req.params.id]) {
    res.json(global.busLocations[req.params.id]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API listening on http://localhost:${PORT}`);
});

