import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing connection to:', process.env.DB_HOST);
console.log('👤 User:', process.env.DB_USER);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: { rejectUnauthorized: false }
});

try {
  const client = await pool.connect();
  console.log('✅ Success! Connected to Supabase.');
  const timeRes = await client.query('SELECT NOW()');
  console.log('🕒 DB Time:', timeRes.rows[0].now);

  const students = await client.query('SELECT name, email, assigned_bus_id FROM students LIMIT 5');
  console.log('🎓 Students:', JSON.stringify(students.rows, null, 2));
  client.release();
  process.exit(0);
} catch (err) {
  console.error('❌ Connection Failed!');
  console.error('Error Code:', err.code);
  console.error('Error Message:', err.message);
  process.exit(1);
}
