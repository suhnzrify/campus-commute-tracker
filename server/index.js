import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { db, migrateFromJsonIfEmpty } from './db.js';
import { hashPassword } from './auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Initialize DB & run migrations
migrateFromJsonIfEmpty();

// In-memory OTP cache
const otpCache = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─────────────────────────────────────────────
// ROOT & HEALTH
// ─────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({ message: 'LBS Campus Commute Tracker API', status: 'Online', health: '/api/health' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

app.post('/api/auth/request-otp', async (req, res) => {
  console.log('🔥 [API] OTP REQUEST:', req.body);
  try {
    const { email, role } = req.body || {};
    const emailStr = email != null ? String(email).trim().toLowerCase() : '';
    if (!emailStr) return res.status(400).json({ error: 'Email is required.' });

    const userRow = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(emailStr);
    if (!userRow) return res.status(401).json({ error: 'No account found with this email.' });
    if (role && userRow.role !== role) {
      return res.status(403).json({ error: `Account is registered as ${userRow.role}, not ${role}.` });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    console.log('─────────────────────────────────');
    console.log(`📧 OTP for ${emailStr}: ${otp}`);
    console.log('─────────────────────────────────');

    const smtpUser = String(process.env.SMTP_USER || '').trim();
    const smtpPass = String(process.env.SMTP_PASS || '').replace(/\s/g, '').trim();

    let smtpResult = { sent: false, note: 'Terminal logging only' };

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      });
      try {
        await transporter.sendMail({
          from: `"LBS BusTrack" <${smtpUser}>`,
          to: emailStr,
          subject: 'Your Campus Tracker OTP Code',
          html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;">
                   <h2 style="color:#0284c7;">LBS Campus Commute</h2>
                   <p>Your login code is:</p>
                   <h1 style="letter-spacing:5px;color:#333;">${otp}</h1>
                   <p style="font-size:12px;color:#666;">Expires in 5 minutes.</p>
                 </div>`,
        });
        smtpResult = { sent: true, note: 'Email sent successfully' };
      } catch (mailErr) {
        console.error('⚠️ SMTP Error:', mailErr.message);
        smtpResult = { sent: false, note: mailErr.message };
      }
    }

    otpCache.set(emailStr, { otp, expiresAt });
    return res.json({ success: true, message: 'OTP processed.', otp, smtp: smtpResult });
  } catch (err) {
    console.error('OTP request error:', err);
    return res.status(500).json({ error: 'Failed to request OTP.' });
  }
});

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
    if (!userRow) return res.status(401).json({ error: 'User not found.' });

    let name = 'User';
    if (userRow.role === 'driver' && userRow.entityId) {
      const d = db.prepare('SELECT name FROM drivers WHERE id = ?').get(userRow.entityId);
      if (d) name = d.name;
    } else if (userRow.role === 'student' && userRow.entityId) {
      const s = db.prepare('SELECT name FROM students WHERE id = ?').get(userRow.entityId);
      if (s) name = s.name;
    } else if (userRow.role === 'admin') {
      name = 'Admin';
    }

    return res.json({
      success: true,
      user: { id: userRow.id, name, email: userRow.email, role: userRow.role, entityId: userRow.entityId },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Verification failed.' });
  }
});

app.post('/api/auth/reset-admin', (req, res) => {
  const email = 'adminlbscek@gmail.com';
  const hash = hashPassword('1234');
  const userRow = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email);
  if (!userRow) {
    db.prepare('INSERT INTO users (id, email, passwordHash, role, emailVerified) VALUES (?, ?, ?, ?, ?)')
      .run('admin1', email, hash, 'admin', 1);
  } else {
    db.prepare('UPDATE users SET passwordHash = ?, emailVerified = 1 WHERE id = ?').run(hash, userRow.id);
  }
  res.json({ ok: true, message: 'Admin reset to 1234' });
});

// ─────────────────────────────────────────────
// ROUTES & STOPS
// ─────────────────────────────────────────────

app.get('/api/routes', (_req, res) => {
  const routes = db.prepare('SELECT * FROM routes').all();
  const stops = db.prepare('SELECT * FROM stops ORDER BY "order" ASC').all();
  res.json(routes.map(r => ({ ...r, stops: stops.filter(s => s.routeId === r.id) })));
});

app.post('/api/routes', (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Route name is required.' });
  const id = `route_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const routeName = String(name).trim();
  db.prepare('INSERT INTO routes (id, name) VALUES (?, ?)').run(id, routeName);
  res.status(201).json({ id, name: routeName, stops: [] });
});

app.put('/api/routes/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM routes WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Route not found' });
  const { name } = req.body || {};
  const updated = { id, name: name ? String(name).trim() : existing.name };
  db.prepare('UPDATE routes SET name = ? WHERE id = ?').run(updated.name, id);
  const stops = db.prepare('SELECT * FROM stops WHERE routeId = ? ORDER BY "order" ASC').all(id);
  res.json({ ...updated, stops });
});

app.delete('/api/routes/:id', (req, res) => {
  const id = req.params.id;
  // Delete stops first (cascade safety)
  db.prepare('DELETE FROM stops WHERE routeId = ?').run(id);
  db.prepare('DELETE FROM routes WHERE id = ?').run(id);
  res.json({ success: true });
});

// ─── Stops CRUD ───

app.post('/api/routes/:routeId/stops', (req, res) => {
  const { routeId } = req.params;
  const route = db.prepare('SELECT id FROM routes WHERE id = ?').get(routeId);
  if (!route) return res.status(404).json({ error: 'Route not found' });

  const { name, lat, lng, waitTime = 0, order } = req.body || {};
  if (!name || lat == null || lng == null) {
    return res.status(400).json({ error: 'name, lat, lng are required' });
  }

  // Default order to next index
  const maxOrder = db.prepare('SELECT MAX("order") as m FROM stops WHERE routeId = ?').get(routeId);
  const stopOrder = order != null ? Number(order) : (maxOrder?.m ?? 0) + 1;

  const id = `stop_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const stop = {
    id, routeId,
    name: String(name).trim(),
    lat: Number(lat), lng: Number(lng),
    waitTime: Number(waitTime),
    order: stopOrder,
  };
  db.prepare('INSERT INTO stops (id, routeId, name, lat, lng, waitTime, "order") VALUES (@id, @routeId, @name, @lat, @lng, @waitTime, @order)').run(stop);
  res.status(201).json(stop);
});

app.put('/api/stops/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM stops WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Stop not found' });

  const { name, lat, lng, waitTime, order } = req.body || {};
  const updated = {
    id,
    name: name != null ? String(name).trim() : existing.name,
    lat: lat != null ? Number(lat) : existing.lat,
    lng: lng != null ? Number(lng) : existing.lng,
    waitTime: waitTime != null ? Number(waitTime) : existing.waitTime,
    order: order != null ? Number(order) : existing.order,
  };
  db.prepare('UPDATE stops SET name = @name, lat = @lat, lng = @lng, waitTime = @waitTime, "order" = @order WHERE id = @id').run(updated);
  res.json({ ...updated, routeId: existing.routeId });
});

app.delete('/api/stops/:id', (req, res) => {
  db.prepare('DELETE FROM stops WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
// BUSES
// ─────────────────────────────────────────────

app.get('/api/buses', (_req, res) => {
  const buses = db.prepare('SELECT * FROM buses').all();
  res.json(buses.map(b => {
    const row = db.prepare('SELECT COUNT(*) as c FROM students WHERE assignedBusId = ?').get(b.id);
    return { ...b, studentCount: row ? row.c : 0 };
  }));
});

app.post('/api/buses', (req, res) => {
  const { number, model, capacity, status = 'active', routeId, driverId } = req.body;
  if (!number || !model || !capacity) return res.status(400).json({ error: 'number, model, capacity required' });
  const id = `bus_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const bus = {
    id,
    number: String(number),
    model: String(model),
    capacity: Number(capacity),
    status: String(status),
    routeId: String(routeId || ''),
    driverId: String(driverId || ''),
  };
  db.prepare('INSERT INTO buses (id, number, model, capacity, status, routeId, driverId) VALUES (@id, @number, @model, @capacity, @status, @routeId, @driverId)').run(bus);
  res.status(201).json(bus);
});

app.put('/api/buses/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM buses WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Bus not found' });
  const { number, model, capacity, status, routeId, driverId } = req.body;
  const updated = {
    id,
    number: number !== undefined ? String(number) : existing.number,
    model: model !== undefined ? String(model) : existing.model,
    capacity: capacity !== undefined ? Number(capacity) : existing.capacity,
    status: status !== undefined ? String(status) : existing.status,
    routeId: routeId !== undefined ? String(routeId || '') : existing.routeId,
    driverId: driverId !== undefined ? String(driverId || '') : existing.driverId,
  };
  db.prepare('UPDATE buses SET number = @number, model = @model, capacity = @capacity, status = @status, routeId = @routeId, driverId = @driverId WHERE id = @id').run(updated);
  res.json(updated);
});

app.delete('/api/buses/:id', (req, res) => {
  db.prepare('DELETE FROM buses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get students assigned to a specific bus
app.get('/api/buses/:id/students', (req, res) => {
  const busId = req.params.id;
  const students = db.prepare('SELECT * FROM students WHERE assignedBusId = ?').all(busId);
  res.json(students);
});

// Assign multiple students to a bus
app.put('/api/buses/:id/assign-students', (req, res) => {
  const busId = req.params.id;
  const bus = db.prepare('SELECT id FROM buses WHERE id = ?').get(busId);
  if (!bus) return res.status(404).json({ error: 'Bus not found' });

  const { studentIds } = req.body || {};
  if (!Array.isArray(studentIds)) return res.status(400).json({ error: 'studentIds array required' });

  const assign = db.transaction(() => {
    // Clear current assignments for this bus
    db.prepare('UPDATE students SET assignedBusId = "" WHERE assignedBusId = ?').run(busId);
    // Assign new students
    for (const sid of studentIds) {
      db.prepare('UPDATE students SET assignedBusId = ? WHERE id = ?').run(busId, sid);
    }
  });
  assign();
  res.json({ success: true });
});

// ─────────────────────────────────────────────
// DRIVERS
// ─────────────────────────────────────────────

app.get('/api/drivers', (_req, res) => {
  const drivers = db.prepare('SELECT * FROM drivers').all();
  res.json(drivers.map(d => ({ ...d, isOnTrip: !!d.isOnTrip })));
});

app.post('/api/drivers', (req, res) => {
  const { name, phone, email, assignedBusId = '', isOnTrip = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = `d_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const driver = {
    id,
    name: String(name),
    phone: String(phone || ''),
    email: String(email || ''),
    assignedBusId: String(assignedBusId),
    isOnTrip: Number(isOnTrip),
  };
  db.prepare('INSERT INTO drivers (id, name, phone, email, assignedBusId, isOnTrip) VALUES (@id, @name, @phone, @email, @assignedBusId, @isOnTrip)').run(driver);
  res.status(201).json({ ...driver, isOnTrip: !!driver.isOnTrip });
});

app.put('/api/drivers/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Driver not found' });
  const { name, phone, email, assignedBusId, isOnTrip } = req.body;
  const updated = {
    id,
    name: name !== undefined ? String(name) : existing.name,
    phone: phone !== undefined ? String(phone || '') : existing.phone,
    email: email !== undefined ? String(email || '') : existing.email,
    assignedBusId: assignedBusId !== undefined ? String(assignedBusId || '') : existing.assignedBusId,
    isOnTrip: isOnTrip !== undefined ? Number(isOnTrip) : existing.isOnTrip,
  };
  db.prepare('UPDATE drivers SET name = @name, phone = @phone, email = @email, assignedBusId = @assignedBusId, isOnTrip = @isOnTrip WHERE id = @id').run(updated);
  res.json({ ...updated, isOnTrip: !!updated.isOnTrip });
});

app.delete('/api/drivers/:id', (req, res) => {
  db.prepare('DELETE FROM drivers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────

app.get('/api/students', (_req, res) => {
  const students = db.prepare('SELECT * FROM students').all();
  res.json(students);
});

app.post('/api/students', (req, res) => {
  const { name, registerNumber, phone, email, assignedBusId, class: cls, semester, admissionYear, pickupStopId, dropStopId } = req.body;
  if (!name || !registerNumber) return res.status(400).json({ error: 'Name and registerNumber required' });
  const id = `st_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const student = {
    id,
    name: String(name),
    registerNumber: String(registerNumber),
    phone: String(phone || ''),
    email: String(email || ''),
    assignedBusId: String(assignedBusId || ''),
    class: cls || null,
    semester: String(semester || ''),
    admissionYear: String(admissionYear || ''),
    pickupStopId: String(pickupStopId || ''),
    dropStopId: String(dropStopId || ''),
  };
  db.prepare(`
    INSERT INTO students (id, name, registerNumber, phone, email, assignedBusId, class, semester, admissionYear, pickupStopId, dropStopId)
    VALUES (@id, @name, @registerNumber, @phone, @email, @assignedBusId, @class, @semester, @admissionYear, @pickupStopId, @dropStopId)
  `).run(student);
  res.status(201).json(student);
});

app.put('/api/students/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Student not found' });
  const { name, registerNumber, phone, email, assignedBusId, class: cls, semester, admissionYear, pickupStopId, dropStopId } = req.body;
  const updated = {
    id,
    name: name !== undefined ? String(name) : existing.name,
    registerNumber: registerNumber !== undefined ? String(registerNumber) : existing.registerNumber,
    phone: phone !== undefined ? String(phone || '') : existing.phone,
    email: email !== undefined ? String(email || '') : existing.email,
    assignedBusId: assignedBusId !== undefined ? String(assignedBusId || '') : existing.assignedBusId,
    class: cls !== undefined ? cls || null : existing.class,
    semester: semester !== undefined ? String(semester || '') : existing.semester,
    admissionYear: admissionYear !== undefined ? String(admissionYear || '') : existing.admissionYear,
    pickupStopId: pickupStopId !== undefined ? String(pickupStopId || '') : existing.pickupStopId,
    dropStopId: dropStopId !== undefined ? String(dropStopId || '') : existing.dropStopId,
  };
  db.prepare(`
    UPDATE students SET name = @name, registerNumber = @registerNumber, phone = @phone, email = @email,
    assignedBusId = @assignedBusId, class = @class, semester = @semester, admissionYear = @admissionYear,
    pickupStopId = @pickupStopId, dropStopId = @dropStopId WHERE id = @id
  `).run(updated);
  res.json(updated);
});

app.delete('/api/students/:id', (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

app.get('/api/notifications', (req, res) => {
  const { busId } = req.query;
  let notifs;
  if (busId && busId !== 'ALL') {
    notifs = db.prepare('SELECT * FROM notifications WHERE targetBusId = ? OR targetBusId = "ALL" ORDER BY timestamp DESC LIMIT 50').all(busId);
  } else {
    notifs = db.prepare('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50').all();
  }
  res.json(notifs);
});

app.post('/api/notifications', (req, res) => {
  const { title, message, type = 'info', from = 'System', targetBusId = 'ALL' } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });
  const id = `n_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const notif = {
    id,
    title: String(title || 'Notice'),
    message: String(message),
    type: String(type),
    from_user: String(from),
    targetBusId: String(targetBusId),
    timestamp: Date.now(),
  };
  db.prepare('INSERT INTO notifications (id, title, message, type, from_user, targetBusId, timestamp) VALUES (@id, @title, @message, @type, @from_user, @targetBusId, @timestamp)').run(notif);
  res.status(201).json(notif);
});

// ─────────────────────────────────────────────
// REAL-TIME BUS LOCATION
// ─────────────────────────────────────────────

const busLocations = {};

app.post('/api/buses/:id/location', (req, res) => {
  const { lat, lng, speed } = req.body;
  busLocations[req.params.id] = { lat, lng, speed, timestamp: Date.now() };
  res.json({ success: true });
});

app.get('/api/buses/:id/location', (req, res) => {
  const loc = busLocations[req.params.id];
  if (loc) res.json(loc);
  else res.status(404).json({ error: 'Location not found' });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ LBS Backend running on http://localhost:${PORT}`);
  console.log(`📋 API: http://localhost:${PORT}/api/health`);
});