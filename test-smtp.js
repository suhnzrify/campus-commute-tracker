import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const testUser = process.env.SMTP_USER;
const testPass = process.env.SMTP_PASS;

console.log('🧪 STAGE 1: Testing SMTP Credentials...');
console.log('👤 User:', testUser);
console.log('🔑 Pass Length:', testPass?.length);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: testUser,
    pass: testPass,
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  family: 4, // Force IPv4
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
  debug: true,
  logger: true
});

async function runTest() {
  try {
    console.log('\n📡 STAGE 2: Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection verified!');

    console.log('\n📧 STAGE 3: Sending Test Email...');
    const info = await transporter.sendMail({
      from: `"LBS TEST" <${testUser}>`,
      to: testUser, // Sending to yourself
      subject: '🚀 SMTP Debug Success!',
      text: 'If you see this, your Gmail SMTP is working perfectly with the Campus Commute Tracker.',
      html: '<b>Gmail SMTP is working perfectly!</b>'
    });

    console.log('✅ Email sent successfully!');
    console.log('🆔 Message ID:', info.messageId);
    console.log('\n🎉 ALL TESTS PASSED!');
  } catch (err) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error Details:', err.message);
    if (err.message.includes('Invalid login')) {
      console.log('\n💡 Tip: Your App Password might be incorrect or deleted in Google Account settings.');
    }
  }
}

runTest();
