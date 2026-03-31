import Database from 'better-sqlite3';

const db = new Database('./server/data/campus.db');

// Update the old admin email to the new one you requested
const updateInfo = db.prepare("UPDATE users SET email = 'adminlbscek@gmail.com' WHERE email = 'admin@gmail.com'").run();

if (updateInfo.changes > 0) {
  console.log("Successfully updated the old admin@gmail.com to adminlbscek@gmail.com in the database!");
} else {
  // If no admin@gmail.com was found, check if adminlbscek already exists, if not create it
  const existing = db.prepare("SELECT * FROM users WHERE email = 'adminlbscek@gmail.com'").get();
  if (!existing) {
    db.prepare("INSERT INTO users (id, email, passwordHash, role, entityId, emailVerified) VALUES (?, ?, ?, ?, ?, ?)")
      .run('admin_custom', 'adminlbscek@gmail.com', 'OTP_MANAGED', 'admin', null, 1);
    console.log("Created a fresh admin account for adminlbscek@gmail.com!");
  } else {
    console.log("adminlbscek@gmail.com already exists in the database. You are good to go!");
  }
}
