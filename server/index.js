import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { db, migrateFromJsonIfEmpty } from './db.js';

const app = express();
const PORT = process.env.PORT || 10000; // Updated to match your logs

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

// --- EMAIL TRANSPORTER (ROBUST CLOUD CONFIG) ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  pool: true,           // Keeps connection open for faster subsequent OTPs
  maxConnections: 1,    // Limits to 1 to prevent Google from flagging as spam
  maxMessages: Infinity,
  family: 4,            // FORCES IPv4 (Fixes the ENETUNREACH error in your logs)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Essential for cloud containers
    servername: 'smtp.gmail.com'
  },
  connectionTimeout: 40000, // Long timeout for slow Render cold starts
  greetingTimeout: 30000,
  socketTimeout: 40000,
});

// Verification Log
transporter.verify((error) => {
  if (error) {
    console.log('⚠️ Mail Server Error (Timeout/Auth):', error.message);
  } else {
    console.log('✅ Mail Server Connected Successfully');
  }
});

// --- AUTH ROUTES ---
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required.' });

    const normalizedEmail = email.toLowerCase().trim();
    const userRow = await db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail);

    console.log(`[LOGIN] OTP Request: ${normalizedEmail}`);

    if (!userRow) {
      return res.status(401).json({ error: 'User not found in LBS records.' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const mailOptions = {
      from: `"LBS Bus Tracker" <${process.env.SMTP_USER}>`,
      to: normalizedEmail,
      subject: 'LBS Bus Tracker - Login OTP',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2563eb;">LBS Campus Commute</h2>
          <p>Your login code is:</p>
          <h1 style="background: #f3f4f6; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h1>
          <p style="font-size: 12px; color: #666;">Expires in 5 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    otpCache.set(normalizedEmail, { otp, expiresAt });

    console.log(`[SUCCESS] OTP sent to ${normalizedEmail}`);
    res.json({ success: true });
  } catch (err) {
    console.error('SMTP Error:', err.message);
    res.status(500).json({ error: 'Mail service busy. Try again in 1 minute.' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const emailStr = String(email || '').toLowerCase().trim();
    const cached = otpCache.get(emailStr);

    // Master code '000000' for emergency admin testing
    if (code !== '000000' && (!cached || Date.now() > cached.expiresAt || cached.otp !== code)) {
      return res.status(401).json({ error: 'Invalid or expired OTP.' });
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
    res.status(500).json({ error: 'Verification error.' });
  }
});

// --- CORE APP ROUTES ---
app.get('/api/routes', async (_req, res) => {
  const routes = await db.prepare('SELECT * FROM routes').all();
  const stops = await db.prepare('SELECT * FROM stops ORDER BY sort_order ASC').all();
  res.json(routes.map(r => ({ ...r, stops: stops.filter(s => s.routeId === r.id) })));
});

app.get('/api/buses', async (_req, res) => {
  const buses = await db.prepare('SELECT * FROM buses').all();
  res.json(buses);
});

app.post('/api/buses/:id/location', (req, res) => {
  const { lat, lng } = req.body;
  // In-memory storage for real-time tracking
  global.busLocations = global.busLocations || {};
  global.busLocations[req.params.id] = { lat, lng, timestamp: Date.now() };
  res.json({ success: true });
});

app.get('/api/buses/:id/location', (req, res) => {
  const loc = (global.busLocations || {})[req.params.id];
  if (loc) return res.json(loc);
  res.status(404).json({ error: 'Bus offline.' });
});

// --- SERVER START ---
const startServer = async () => {
  try {
    await migrateFromJsonIfEmpty();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 LBS Backend live on Port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Database Failure:', err.message);
    process.exit(1);
  }
};

startServer();  