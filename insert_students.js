import Database from 'better-sqlite3';

const db = new Database('./server/data/campus.db');

const studentsData = [
  { name: 'Arjun S Nair', reg: '2023CS012', phone: '9847012345', bus: 'LBS1' },
  { name: 'Anjali Krishna', reg: '2024EC045', phone: '9446554321', bus: 'LBS1' },
  { name: 'Nithin Das', reg: '2023ME089', phone: '7012398765', bus: 'LBS2' },
  { name: 'Fathima Zahra', reg: '2024CS031', phone: '8129045678', bus: 'LBS2' },
  { name: 'Gokul Raj', reg: '2023CE067', phone: '9562112233', bus: 'LBS1' },
  { name: 'Sneha Varghese', reg: '2024EB022', phone: '8086445566', bus: 'LBS2' },
  { name: 'Kiran Kumar', reg: '2023CS105', phone: '9744338899', bus: 'LBS1' },
  { name: 'Meera Nambiar', reg: '2024ME014', phone: '9995887744', bus: 'LBS2' },
  { name: 'Irfan Mohammed', reg: '2023EC058', phone: '7559001122', bus: 'LBS1' },
  { name: 'Devika Santhosh', reg: '2024CS076', phone: '9495663322', bus: 'LBS2' }
];

const buses = db.prepare('SELECT id, number FROM buses').all();
const busMap = {};
buses.forEach(b => { 
  busMap[b.number] = b.id; 
});

const insert = db.prepare('INSERT INTO students (id, name, registerNumber, phone, email, assignedBusId) VALUES (?, ?, ?, ?, ?, ?)');

studentsData.forEach((s, i) => {
  // If LBS1/LBS2 aren't exact matches in DB bus numbers, we fallback to just saving the string as the ID.
  const busId = busMap[s.bus] || s.bus; 
  const studentId = `st_${Date.now()}_${i}`;
  const mockEmail = `${s.reg.toLowerCase()}@college.edu`;
  insert.run(studentId, s.name, s.reg, s.phone, mockEmail, busId);
});

console.log('Students fully inserted into the database!');
