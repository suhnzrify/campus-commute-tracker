import { db } from './server/db.js';
import { hashPassword } from './server/auth.js';

async function addTestAdmin() {
  const email = 'suhananzr2003@gmail.com';
  try {
    console.log(`🚀 Adding ${email} to database...`);
    await db.query(
      'INSERT INTO users (id, email, password_hash, role, entity_id, email_verified) VALUES ($1, $2, $3, $4, $5, 1) ON CONFLICT (email) DO NOTHING',
      [`u_${Date.now()}`, email, hashPassword('1234'), 'admin', null]
    );
    console.log(`✅ Success! ${email} is now an Admin.`);
  } catch (err) {
    console.error('❌ Error adding user:', err.message);
  } finally {
    process.exit();
  }
}

addTestAdmin();
