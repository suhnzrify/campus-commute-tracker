import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { db, migrateFromJsonIfEmpty } from './db.js';
import { verifyPassword, hashPassword } from './auth.js';

dotenv.config();

const app = express();
// Render provides the PORT dynamically
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize DB
migrateFromJsonIfEmpty();

// In-memory cache for OTPs
const otpCache = new Map();

// --- Helper: Generate Random 6-Digit OTP ---
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- Routes ---

app.get('/', (_req, res) => {
  res.json({
    message: 'LBS Campus Commute Tracker API',
    status: 'Online',
    health: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// --- OTP Request Route (With Email & Terminal Logging) ---
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
      return res.status(403).json({ error: `Account is registered as ${userRow.role}, not ${role}.` });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins expiry

    // Log to Render terminal for emergency debugging
    console.log('---------------------------------------------');
    console.log(`🚀 OTP for ${emailStr}: ${otp}`);
    console.log('---------------------------------------------');

    // SMTP Configuration
    const smtpUser = String(process.env.SMTP_USER || '').trim();
    const smtpPass = String(process.env.SMTP_PASS || '').trim();

    let smtpResult = { sent: false, note: 'Terminal logging only' };

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      });

      try {
        await transporter.sendMail({
          from: `"LBS BusTrack Admin" <${smtpUser}>`,
          to: emailStr,
          subject: 'Your Campus Tracker OTP Code',
          html: `<div style="font-family:sans-serif; padding:20px; border:1px solid #eee; border-radius:10px;">
                  <h2 style="color: #0284c7;">LBS Campus Commute</h2>
                  <p>Your login verification code is:</p>
                  <h1 style="letter-spacing: 5px; color: #333;">${otp}</h1>
                  <p style="font-size: 12px; color: #666;">This code will expire in 5 minutes.</p>
                 </div>`,
        });
        smtpResult = { sent: true, note: 'Email sent successfully' };
      } catch (mailError) {
        console.error('⚠️ SMTP Error:', mailError.message);
        smtpResult = { sent: false, note: mailError.message };
      }
    }

    otpCache.set(emailStr, { otp, expiresAt });

    return res.json({
      success: true,
      message: 'OTP processed.',
      // For the demo, we include the OTP in the response so you can see it in the Network tab
      otp: otp,
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

    // Master code '000000' allowed for demo purposes
    if (cached.otp !== codeStr && codeStr !== '000000') {
      return res.status(401).json({ error: 'Incorrect OTP.' });
    }

    otpCache.delete(emailStr);
    const userRow = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(emailStr);

    let name = 'User';
    if (userRow.role === 'driver' && userRow.entityId) {
      const d = db.prepare('SELECT name FROM drivers WHERE id = ?').get(userRow.entityId);
      if (d) name = d.name;
    } else if (userRow.role === 'student' && userRow.entityId) {
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

// --- Bus, Route, and Location Data ---

app.get('/api/routes', (_req, res) => {
  const routes = db.prepare('SELECT * FROM routes').all();
  const stops = db.prepare('SELECT * FROM stops ORDER BY "order" ASC').all();
  res.json(routes.map(r => ({
    ...r,
    stops: stops.filter(s => s.routeId === r.id),
  })));
});

app.get('/api/buses', (_req, res) => {
  const buses = db.prepare('SELECT * FROM buses').all();
  res.json(buses.map(b => {
    const row = db.prepare('SELECT COUNT(*) as c FROM students WHERE assignedBusId = ?').get(b.id);
    return { ...b, studentCount: row ? row.c : 0 };
  }));
});

app.get('/api/drivers', (_req, res) => {
  const drivers = db.prepare('SELECT * FROM drivers').all();
  res.json(drivers.map(d => ({ ...d, isOnTrip: !!d.isOnTrip })));
});

// Real-time location tracking (In-memory for performance)
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

// --- Server Startup ---
// Using 0.0.0.0 is mandatory for Render/Cloud deployment
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ LBS Backend Live on Port ${PORT}`);
});
