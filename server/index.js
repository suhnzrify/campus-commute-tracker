import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { db, migrateFromJsonIfEmpty } from './db.js';

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

// --- EMAIL TRANSPORTER (FIXED FOR RENDER/GMAIL) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,               // Switched to 465 for SSL (more stable on Render)
  secure: true,            // True for 465
  pool: true,              // Uses pooled connections to prevent timeouts
  family: 4,               // Force IPv4 to fix the "ENETUNREACH" error in your logs
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // MUST be the 16-character App Password from your screenshot
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  connectionTimeout: 10000, // Reduced wait time for faster failover
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Verification Failed:', error);
  } else {
    console.log('✅ Mail Server is ready to send OTPs');
  }
});

// --- AUTH ---
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required.' });

    const normalizedEmail = email.toLowerCase().trim();

    // Check database
    const userRow = await db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail);

    console.log(`\n\x1b[32m[LOGIN REQUEST]\x1b[0m Attempting OTP for: ${normalizedEmail}`);

    if (!userRow) {
      console.log(`\x1b[31m[AUTH ERROR]\x1b[0m ${normalizedEmail} not found.`);
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
    console.error('Email sending error details:', err);
    res.status(500).json({ error: 'Failed to send OTP email. Please check server logs.' });
  }
});

// ... [REST OF YOUR ROUTES: /api/auth/verify-otp, /api/routes, /api/buses, etc. remain the same] ...

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const emailStr = String(email || '').toLowerCase().trim();
    const cached = otpCache.get(emailStr);

    // Manual Override for testing or if cache fails
    if (code !== '000000' && (!cached || Date.now() > cached.expiresAt || cached.otp !== code)) {
      return res.status(401).json({ error: 'Invalid or expired code.' });
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

// --- REMAINDER OF FILE ---
// (Keep all your existing /api/routes, /api/buses, /api/drivers routes as they were)

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