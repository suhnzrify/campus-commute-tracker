import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 3,
  family: 4, // Force IPv4
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

async function testEmail() {
  const recipient = process.env.SMTP_USER; // Send to self for testing
  const otp = '999999';

  const mailOptions = {
    from: `"LBS Bus Tracker" <${process.env.SMTP_USER}>`,
    to: recipient,
    subject: 'OTP for Campus Commute Tracker Login',
    text: `Your OTP is ${otp}. Please use this to login.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f4f4f4;">
        <h2 style="color: #333;">LBS Campus Commute Tracker</h2>
        <p>Your one-time password (OTP) is:</p>
        <h1 style="color: #007bff; font-size: 48px; letter-spacing: 5px;">${otp}</h1>
        <p style="color: #666;">This code will expire in 5 minutes.</p>
      </div>
    `,
  };

  try {
    console.log('Attempting to send test email to:', recipient);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (err) {
    console.error('Email sending failed:', err.message);
  }
}

testEmail();
