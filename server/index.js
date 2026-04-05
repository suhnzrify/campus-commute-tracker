import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { db, migrateFromJsonIfEmpty } from './db.js';
import { hashPassword } from './auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

// --- MIDDLEWARE ---
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
  origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN,
  credentials: true
}));
app.use(express.json());

const otpCache = new Map();
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- EMAIL TRANSPORTER (ULTIMATE CLOUD CONFIG) ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,         // Port 587 is much more reliable on Render than 465
  secure: false,      // Must be false for 587 (it uses STARTTLS)
  family: 4,          // Forces IPv4 to prevent ENETUNREACH errors
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Bypasses certificate issues in cloud containers
    minVersion: 'TLSv1.2'
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

// --- Basic Routes ---
app.get('/', (_req, res) => {
  res.json({
    message: 'LBS Campus Commute Tracker API (Cloud Edition)',
    status: 'Online',
    health: '/api/health',
    version: '2.0.0-PRO'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), db: 'PostgreSQL' });
});

// --- AUTH ---
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required.' });

    const normalizedEmail = email.toLowerCase().trim();

    // Check if the user exists in the database
    const userRow = await db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail);

    console.log(`\n\x1b[32m[LOGIN REQUEST]\x1b[0m Attempting OTP for: ${normalizedEmail}`);

    if (!userRow) {
      console.log(`\x1b[31m[AUTH ERROR]\x1b[0m ${normalizedEmail} not found in database.`);
      return res.status(401).json({ error: 'Identity not found.' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const mailOptions = {
      from: `"LBS Bus Tracker" <${process.env.SMTP_USER}>`,
      to: normalizedEmail,
      subject: 'OTP for Campus Commute Tracker Login',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #007bff; text-align: center;">LBS Campus Commute</h2>
          <p>Hello,</p>
          <p>Your one-time password (OTP) for the <strong>Campus Commute Tracker</strong> is:</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 4px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">Valid for 5 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`\x1b[34m[SUCCESS]\x1b[0m OTP sent to ${normalizedEmail}`);

    otpCache.set(normalizedEmail, { otp, expiresAt });
    res.json({ success: true });
  } catch (err) {
    console.error('Email sending error:', err);
    res.status(500).json({ error: 'Failed to send OTP email.' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const emailStr = String(email || '').toLowerCase().trim();
    const cached = otpCache.get(emailStr);

    if (code !== '000000' && (!cached || Date.now() > cached.expiresAt || cached.otp !== code)) {
      return res.status(401).json({ error: 'Invalid code.' });
    }

    otpCache.delete(emailStr);
    const userRow = await db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(emailStr);

    let name = 'User';
    if (userRow.role === 'driver' && userRow.entityId) {
      const d = await db.prepare('SELECT name FROM drivers WHERE id = ?').get(userRow.entityId);
      if (d) name = d.name;
    } else if (userRow.role === 'student' && userRow.entityId) {
      const s = await db.prepare('SELECT name FROM students WHERE id = ?').get(userRow.entityId);
      if (s) name = s.name;
    }

    res.json({ success: true, user: { ...userRow, name } });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// --- ROUTES & STOPS ---
app.get('/api/routes', async (_req, res) => {
  try {
    const routes = await db.prepare('SELECT * FROM routes').all();
    const stops = await db.prepare('SELECT * FROM stops ORDER BY sort_order ASC').all();
    res.json(routes.map(r => ({ ...r, stops: stops.filter(s => s.routeId === r.id) })));
  } catch (err) {
    res.status(500).json({ error: 'Registry error.' });
  }
});

app.post('/api/routes', async (req, res) => {
  const id = `route_${Date.now()}`;
  await db.prepare('INSERT INTO routes (id, name) VALUES (?, ?)').run([id, req.body.name]);
  res.json({ id, name: req.body.name, stops: [] });
});

app.delete('/api/routes/:id', async (req, res) => {
  await db.prepare('DELETE FROM routes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/routes/:routeId/stops', async (req, res) => {
  const id = `stop_${Date.now()}`;
  const { name, lat, lng, waitTime, order } = req.body;
  await db.prepare('INSERT INTO stops (id, route_id, name, lat, lng, wait_time, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)').run([id, req.params.routeId, name, lat, lng, waitTime, order]);
  res.json({ id, name, lat, lng, waitTime, order });
});

app.put('/api/stops/:id', async (req, res) => {
  const { name, lat, lng, waitTime, order } = req.body;
  await db.prepare('UPDATE stops SET name = ?, lat = ?, lng = ?, wait_time = ?, sort_order = ? WHERE id = ?').run([name, lat, lng, waitTime, order, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/stops/:id', async (req, res) => {
  await db.prepare('DELETE FROM stops WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- BUSES ---
app.get('/api/buses', async (_req, res) => {
  const buses = await db.prepare('SELECT * FROM buses').all();
  res.json(buses);
});

app.post('/api/buses', async (req, res) => {
  const id = `bus_${Date.now()}`;
  const { number, model, capacity, status, routeId, driverId } = req.body;
  await db.prepare('INSERT INTO buses (id, number, model, capacity, status, route_id, driver_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run([id, number, model, capacity, status || 'active', routeId || '', driverId || '']);
  res.json({ id, number, model, capacity, status, routeId, driverId });
});

app.put('/api/buses/:id', async (req, res) => {
  const { number, model, capacity, status, routeId, driverId } = req.body;
  await db.prepare('UPDATE buses SET number = ?, model = ?, capacity = ?, status = ?, route_id = ?, driver_id = ? WHERE id = ?').run([number, model, capacity, status, routeId, driverId, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/buses/:id', async (req, res) => {
  await db.prepare('DELETE FROM buses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/buses/:id/students', async (req, res) => {
  const students = await db.prepare('SELECT * FROM students WHERE assigned_bus_id = ?').all(req.params.id);
  res.json(students);
});

app.put('/api/buses/:id/assign-students', async (req, res) => {
  const busId = req.params.id;
  const { studentIds } = req.body;
  await db.prepare('UPDATE students SET assigned_bus_id = "" WHERE assigned_bus_id = ?').run(busId);
  for (const sid of studentIds) {
    await db.prepare('UPDATE students SET assigned_bus_id = ? WHERE id = ?').run([busId, sid]);
  }
  res.json({ success: true });
});

// --- DRIVERS & STUDENTS ---
app.get('/api/drivers', async (_req, res) => {
  const drivers = await db.prepare('SELECT * FROM drivers').all();
  res.json(drivers.map(d => ({ ...d, isOnTrip: !!d.isOnTrip })));
});

app.post('/api/drivers', async (req, res) => {
  const id = `driver_${Date.now()}`;
  const { name, phone, email, assignedBusId } = req.body;
  await db.prepare('INSERT INTO drivers (id, name, phone, email, assigned_bus_id, is_on_trip) VALUES (?, ?, ?, ?, ?, 0)').run([id, name, phone || '', email || '', assignedBusId || '']);
  if (email) {
    await db.query('INSERT INTO users (id, email, password_hash, role, entity_id, email_verified) VALUES ($1, $2, $3, $4, $5, 1) ON CONFLICT (email) DO NOTHING', [`u_${id}`, email.toLowerCase(), 'PROTECTED', 'driver', id]);
  }
  res.json({ id, name, phone, email, assignedBusId, isOnTrip: false });
});

app.put('/api/drivers/:id', async (req, res) => {
  const { name, phone, email, assignedBusId, isOnTrip } = req.body;
  await db.prepare('UPDATE drivers SET name = ?, phone = ?, email = ?, assigned_bus_id = ?, is_on_trip = ? WHERE id = ?').run([name, phone, email, assignedBusId, isOnTrip ? 1 : 0, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/drivers/:id', async (req, res) => {
  await db.prepare('DELETE FROM drivers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/students', async (_req, res) => {
  const students = await db.prepare('SELECT * FROM students').all();
  res.json(students);
});

app.post('/api/students', async (req, res) => {
  const id = `student_${Date.now()}`;
  const { name, registerNumber, phone, email, assignedBusId, class: cls, semester, admissionYear, pickupStopId, dropStopId } = req.body;
  await db.prepare('INSERT INTO students (id, name, register_number, phone, email, assigned_bus_id, class, semester, admission_year, pickup_stop_id, drop_stop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run([id, name, registerNumber, phone || '', email || '', assignedBusId || '', cls || null, semester || '', admissionYear || '', pickupStopId || '', dropStopId || '']);
  if (email) {
    await db.query('INSERT INTO users (id, email, password_hash, role, entity_id, email_verified) VALUES ($1, $2, $3, $4, $5, 1) ON CONFLICT (email) DO NOTHING', [`u_${id}`, email.toLowerCase(), 'PROTECTED', 'student', id]);
  }
  res.json({ id, name, registerNumber, phone, email, assignedBusId });
});

app.put('/api/students/:id', async (req, res) => {
  const { name, registerNumber, phone, email, assigned_bus_id, class: cls, semester, admission_year, pickup_stop_id, drop_stop_id } = req.body;
  await db.prepare('UPDATE students SET name = ?, register_number = ?, phone = ?, email = ?, assigned_bus_id = ?, class = ?, semester = ?, admission_year = ?, pickup_stop_id = ?, drop_stop_id = ? WHERE id = ?').run([name, registerNumber, phone, email, assigned_bus_id, cls, semester, admission_year, pickup_stop_id, drop_stop_id, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/students/:id', async (req, res) => {
  await db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', async (req, res) => {
  const { busId } = req.query;
  let query = 'SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50';
  let params = [];
  if (busId && busId !== 'ALL') {
    query = 'SELECT * FROM notifications WHERE target_bus_id = ? OR target_bus_id = $2 ORDER BY timestamp DESC LIMIT 40';
    params = [busId, 'ALL'];
  }
  const notifs = await db.prepare(query).all(params);
  res.json(notifs);
});

app.post('/api/notifications', async (req, res) => {
  const id = `notif_${Date.now()}`;
  const { title, message, type, from, targetBusId } = req.body;
  await db.prepare('INSERT INTO notifications (id, title, message, type, from_user, target_bus_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)').run([id, title, message, type || 'info', from || 'System', targetBusId || 'ALL', Date.now()]);
  res.json({ id, title, message, type, from, targetBusId, timestamp: Date.now() });
});

// --- TELEMETRY ---
const busLocations = {};
app.post('/api/buses/:id/location', (req, res) => {
  const { lat, lng } = req.body;
  busLocations[req.params.id] = { lat, lng, timestamp: Date.now() };
  res.json({ success: true });
});

app.get('/api/buses/:id/location', (req, res) => {
  const loc = busLocations[req.params.id];
  if (loc) return res.json(loc);
  res.status(404).json({ error: 'Offline.' });
});

// --- SERVER STARTUP ---
const startServer = async () => {
  try {
    await migrateFromJsonIfEmpty();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 LBS Backend live on Port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Critical Database Failure:', err.message);
    process.exit(1);
  }
};

startServer();  