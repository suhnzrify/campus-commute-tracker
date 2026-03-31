const fs = require('fs');

let src = fs.readFileSync('server/index.js', 'utf8');

// 1. Fix Profile crash by injecting name
const loginReturnRegex = /return res\.json\(\{\s*success: true,\s*user: \{\s*id: userRow\.id,\s*email: userRow\.email,\s*role: userRow\.role,\s*entityId: userRow\.entityId\s*\},\s*\}\);/;

const newLoginReturn = `    let name = 'Admin';
    if (userRow.role === 'driver' && userRow.entityId) {
      const d = db.prepare('SELECT name FROM drivers WHERE id = ?').get(userRow.entityId);
      if (d) name = d.name;
    }
    if (userRow.role === 'student' && userRow.entityId) {
      const s = db.prepare('SELECT name FROM students WHERE id = ?').get(userRow.entityId);
      if (s) name = s.name;
    }

    return res.json({
      success: true,
      user: {
        id: userRow.id,
        name,
        email: userRow.email,
        role: userRow.role,
        entityId: userRow.entityId
      },
    });`;

src = src.replace(loginReturnRegex, newLoginReturn);

// 2. Fix bus studentCount
const busRouteOld = `app.get('/api/buses', (_req, res) => {
  const buses = db.prepare('SELECT * FROM buses').all();
  res.json(buses);
});`;
const busRouteNew = `app.get('/api/buses', (_req, res) => {
  const buses = db.prepare('SELECT * FROM buses').all();
  const resBuses = buses.map(b => {
    const row = db.prepare('SELECT COUNT(*) as c FROM students WHERE assignedBusId = ?').get(b.id);
    return { ...b, studentCount: row ? row.c : 0 };
  });
  res.json(resBuses);
});`;

src = src.replace(busRouteOld, busRouteNew);

// 3. Add new routes right before app.listen(PORT
const newRoutes = `
// --- New Notifications & Bus Features ---
app.get('/api/notifications', (req, res) => {
  const { busId } = req.query;
  let notifs;
  if (busId && busId !== 'ALL') {
    notifs = db.prepare('SELECT * FROM notifications WHERE targetBusId = ? OR targetBusId = "ALL" ORDER BY timestamp DESC LIMIT 50').all(busId);
  } else {
    notifs = db.prepare('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50').all();
  }
  res.json(notifs);
});

app.post('/api/notifications', (req, res) => {
  const { title, message, type, from, targetBusId } = req.body;
  const id = 'n' + Date.now();
  db.prepare('INSERT INTO notifications (id, title, message, type, from_user, targetBusId, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, title || 'Notice', message, type || 'info', from || 'System', targetBusId || 'ALL', Date.now());
  res.status(201).json({ success: true, id });
});

app.get('/api/buses/:id/students', (req, res) => {
  const students = db.prepare('SELECT * FROM students WHERE assignedBusId = ?').all(req.params.id);
  res.json(students);
});

app.put('/api/buses/:id/assign-students', (req, res) => {
  const { studentIds } = req.body;
  const tx = db.transaction(() => {
    db.prepare('UPDATE students SET assignedBusId = "" WHERE assignedBusId = ?').run(req.params.id);
    if (studentIds && studentIds.length > 0) {
      const stmt = db.prepare('UPDATE students SET assignedBusId = ? WHERE id = ?');
      for (const sId of studentIds) {
        stmt.run(req.params.id, sId);
      }
    }
  });
  tx();
  res.json({ success: true });
});

app.post('/api/buses/:id/location', (req, res) => {
  const { lat, lng, speed } = req.body;
  // Let's store in a simple global map for demo purposes
  if (!global.busLocations) global.busLocations = {};
  global.busLocations[req.params.id] = { lat, lng, speed, timestamp: Date.now() };
  res.json({ success: true });
});

app.get('/api/buses/:id/location', (req, res) => {
  if (global.busLocations && global.busLocations[req.params.id]) {
    res.json(global.busLocations[req.params.id]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(PORT`;

if (!src.includes('/api/notifications')) {
  src = src.replace('app.listen(PORT', newRoutes);
}

fs.writeFileSync('server/index.js', src, 'utf8');
console.log('API schema patched.');
