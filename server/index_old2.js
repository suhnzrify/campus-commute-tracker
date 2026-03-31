import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { db, migrateFromJsonIfEmpty } from './db.js';
import { verifyPassword, hashPassword } from './auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

// --- Email Configuration (Nodemailer) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER, // adminlbscek@gmail.com
    pass: process.env.SMTP_PASS, // your app password
  },
});

app.use(cors());
app.use(express.json());

// Initialize DB
migrateFromJsonIfEmpty();

// Root Route
app.get('/', (_req, res) => {
  res.json({
    message: 'LBS Campus Commute API',
    status: 'Live',
    health: '/api/health',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --- Authentication Routes ---

// 1. Request OTP (Forgot Password / Verification)
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in DB or Memory (Simplified for demo)
    console.log(`🔑 OTP for ${normalizedEmail}: ${otp}`);

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: normalizedEmail,
      subject: 'LBS Bus Tracker - Your Login OTP',
      text: `Your One-Time Password for the Campus Commute Tracker is: ${otp}. This code expires in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Email Error:', err);
    res.status(500).json({ error: 'Failed to send OTP email.' });
  }
});

// 2. Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, role } = req.body || {};
    const emailStr = email != null ? String(email).trim().toLowerCase() : '';
    const passwordStr = password != null ? String(password) : '';

    if (!emailStr || !passwordStr) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRow = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(emailStr);

    if (!userRow) {
      return res.status(401).json({ error: 'Account not found.' });
    }

    if (role && userRow.role !== role) {
      return res.status(403).json({ error: `Unauthorized role: ${role}` });
    }

    if (!verifyPassword(passwordStr, userRow.passwordHash)) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    // Get Display Name
    let name = 'User';
    if (userRow.role === 'driver' && userRow.entityId) {
      const d = db.prepare('SELECT name FROM drivers WHERE id = ?').get(userRow.entityId);
      if (d) name = d.name;
    } else if (userRow.role === 'student' && userRow.entityId) {
      const s = db.prepare('SELECT name FROM students WHERE id = ?').get(userRow.entityId);
      if (s) name = s.name;
    }

    res.json({
      user: { id: userRow.id, name, email: userRow.email, role: userRow.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// --- Data Routes (Buses, Routes, Students) ---

app.get('/api/routes', (_req, res) => {
  const routes = db.prepare('SELECT * FROM routes').all();
  const stops = db.prepare('SELECT * FROM stops ORDER BY "order" ASC').all();
  res.json(routes.map(r => ({
    ...r,
    stops: stops.filter(s => s.routeId === r.id),
  })));
});

app.get('/api/buses', (_req, res) => {
  res.json(db.prepare('SELECT * FROM buses').all());
});

app.get('/api/drivers', (_req, res) => {
  res.json(db.prepare('SELECT * FROM drivers').all().map(d => ({ ...d, isOnTrip: !!d.isOnTrip })));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ LBS Backend running on port ${PORT}`);
});
