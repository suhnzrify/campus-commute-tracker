import Database from 'better-sqlite3';

const db = new Database('./server/data/campus.db');

const studentsData = [
  { name: 'Naveena', reg: '2023B052', phone: '9188162219', email: 'naveena.23b052@lbscek.ac.in', bus: 'LBS1' },
  { name: 'Abhinav Rameshan', reg: '2023B109', phone: '9496932005', email: 'abhinav.23b109@lbscek.ac.in', bus: 'LBS1' },
  { name: 'SUHANA NASAR B', reg: '2024BL078', phone: '8714709291', email: 'suhananzr2003@gmail.com', bus: 'LBS1' },
  { name: 'Arjun S Nair', reg: '2023CS012', phone: '9847012345', email: 'arjun.23cs012@lbscek.ac.in', bus: 'LBS1' },
  { name: 'Anjali Krishna', reg: '2024EC045', phone: '9446554321', email: 'anjali.24ec045@lbscek.ac.in', bus: 'LBS1' },
  { name: 'Nithin Das', reg: '2023ME089', phone: '7012398765', email: 'nithin.23me089@lbscek.ac.in', bus: 'LBS2' },
  { name: 'Fathima Zahra', reg: '2024CS031', phone: '8129045678', email: 'fathima.24cs031@lbscek.ac.in', bus: 'LBS2' },
  { name: 'Gokul Raj', reg: '2023CE067', phone: '9562112233', email: 'gokul.23ce067@lbscek.ac.in', bus: 'LBS1' },
  { name: 'Sneha Varghese', reg: '2024EB022', phone: '8086445566', email: 'sneha.24eb022@lbscek.ac.in', bus: 'LBS2' },
  { name: 'Kiran Kumar', reg: '2023CS105', phone: '9744338899', email: 'kiran.23cs105@lbscek.ac.in', bus: 'LBS1' },
  { name: 'Meera Nambiar', reg: '2024ME014', phone: '9995887744', email: 'meera.24me014@lbscek.ac.in', bus: 'LBS2' },
  { name: 'Irfan Mohammed', reg: '2023EC058', phone: '7559001122', email: 'irfan.23ec058@lbscek.ac.in', bus: 'LBS1' },
  { name: 'Devika Santhosh', reg: '2024CS076', phone: '9495663322', email: 'devika.24cs076@lbscek.ac.in', bus: 'LBS2' }
];

// Map buses to IDs
const buses = db.prepare('SELECT id, number FROM buses').all();
const busMap = {};
buses.forEach(b => {
  busMap[b.number] = b.id;
});

// Clear out old students to prevent conflicts
db.prepare("DELETE FROM students").run();
// Clear out student user accounts
db.prepare("DELETE FROM users WHERE role = 'student'").run();

const insertStudent = db.prepare('INSERT INTO students (id, name, registerNumber, phone, email, assignedBusId) VALUES (?, ?, ?, ?, ?, ?)');
const insertUser = db.prepare('INSERT INTO users (id, email, passwordHash, role, entityId, emailVerified) VALUES (?, ?, ?, ?, ?, ?)');

studentsData.forEach((s, i) => {
  const busId = busMap[s.bus] || s.bus;
  const studentId = `st_${Date.now()}_${i}`;
  const lowercaseEmail = s.email.toLowerCase();

  // Insert to students table
  insertStudent.run(studentId, s.name, s.reg, s.phone, lowercaseEmail, busId);

  // Insert to Auth users table
  // Setting dummy password hash since we are using OTP, but MUST not be null due to schema.
  insertUser.run(studentId, lowercaseEmail, 'OTP_MANAGED', 'student', studentId, 1);
});

console.log('Successfully completed full student data refresh and auth table sync!');
