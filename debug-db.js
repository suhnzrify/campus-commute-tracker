import { db } from './server/db.js';

async function checkUsers() {
  try {
    const users = await db.prepare('SELECT email FROM users').all();
    console.log('\n--- [REGISTERED USERS] ---');
    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      users.forEach(u => console.log(`- ${u.email}`));
    }
    console.log('--------------------------\n');
  } catch (err) {
    console.error('❌ Database error:', err.message);
  } finally {
    process.exit();
  }
}

checkUsers();
