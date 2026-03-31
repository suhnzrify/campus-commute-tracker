// Routes
app.get('/api/routes', (_req, res) => {
  const routes = db.prepare('SELECT * FROM routes').all();
  const stops = db.prepare('SELECT * FROM stops ORDER BY "order" ASC').all();
  const grouped = routes.map(r => ({
    ...r,
    stops: stops.filter(s => s.routeId === r.id),
  }));
  res.json(grouped);
});

app.post('/api/routes', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }
  const id = `r${Date.now()}`;
  db.prepare('INSERT INTO routes (id, name) VALUES (?, ?)').run(id, name.trim());
  res.status(201).json({ id, name: name.trim(), stops: [] });
});

app.delete('/api/routes/:id', (req, res) => {
  db.prepare('DELETE FROM routes WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM stops WHERE routeId = ?').run(req.params.id);
  res.status(204).end();
});

// Stops
app.post('/api/routes/:id/stops', (req, res) => {
  try {
    const { name, lat, lng, waitTime, order } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat and lng must be numbers' });
    }
    const id = `s${Date.now()}`;
    const routeId = req.params.id;
    const stopOrder =
      typeof order === 'number'
        ? order
        : (db
            .prepare('SELECT IFNULL(MAX("order"), 0) as maxOrder FROM stops WHERE routeId = ?')
            .get(routeId).maxOrder || 0) + 1;
    db.prepare(
      'INSERT INTO stops (id, routeId, name, lat, lng, waitTime, "order") VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, routeId, name.trim(), lat, lng, waitTime ?? 0, stopOrder);
    const stop = db
      .prepare('SELECT * FROM stops WHERE id = ?')
      .get(id);
    res.status(201).json(stop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/stops/:id', (req, res) => {
  try {
    const { name, lat, lng, waitTime, order } = req.body;
    const existing = db
      .prepare('SELECT * FROM stops WHERE id = ?')
      .get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Stop not found' });
    const updated = {
      ...existing,
      name: name !== undefined ? String(name) : existing.name,
      lat: lat !== undefined ? Number(lat) : existing.lat,
      lng: lng !== undefined ? Number(lng) : existing.lng,
      waitTime: waitTime !== undefined ? Number(waitTime) : existing.waitTime,
      order: order !== undefined ? Number(order) : existing.order,
    };
    db.prepare(
      'UPDATE stops SET name = @name, lat = @lat, lng = @lng, waitTime = @waitTime, "order" = @order WHERE id = @id'
    ).run(updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/stops/:id', (req, res) => {
  db.prepare('DELETE FROM stops WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Buses
app.get('/api/buses', (_req, res) => {
  const buses = db.prepare('SELECT * FROM buses').all();
  res.json(buses);
});

app.post('/api/buses', (req, res) => {
  const { number, model, capacity } = req.body;
  if (!number || !model) {
    return res.status(400).json({ error: 'number and model are required' });
  }
  const id = `b${Date.now()}`;
  const bus = {
    id,
    number: String(number),
    model: String(model),
    capacity: Number(capacity || 0),
    status: 'inactive',
    routeId: '',
    driverId: '',
  };
  db.prepare(
    'INSERT INTO buses (id, number, model, capacity, status, routeId, driverId) VALUES (@id, @number, @model, @capacity, @status, @routeId, @driverId)'
  ).run(bus);
  res.status(201).json(bus);
});

app.put('/api/buses/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM buses WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bus not found' });
  const updated = {
    ...existing,
    number: req.body.number ?? existing.number,
    model: req.body.model ?? existing.model,
    capacity: req.body.capacity !== undefined ? Number(req.body.capacity) : existing.capacity,
    status: req.body.status ?? existing.status,
    routeId: req.body.routeId ?? existing.routeId,
    driverId: req.body.driverId ?? existing.driverId,
  };
  db.prepare(
    'UPDATE buses SET number = @number, model = @model, capacity = @capacity, status = @status, routeId = @routeId, driverId = @driverId WHERE id = @id'
  ).run(updated);
  res.json(updated);
});

app.delete('/api/buses/:id', (req, res) => {
  db.prepare('DELETE FROM buses WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Drivers
app.get('/api/drivers', (_req, res) => {
  const drivers = db.prepare('SELECT * FROM drivers').all();
  res.json(
    drivers.map(d => ({
      ...d,
      isOnTrip: !!d.isOnTrip,
    }))
  );
});

app.post('/api/drivers', (req, res) => {
  const { name, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const id = `d${Date.now()}`;
  const driver = {
    id,
    name: String(name),
    phone: String(phone || ''),
    email: String(email || ''),
    assignedBusId: '',
    isOnTrip: 0,
  };
  db.prepare(
    'INSERT INTO drivers (id, name, phone, email, assignedBusId, isOnTrip) VALUES (@id, @name, @phone, @email, @assignedBusId, @isOnTrip)'
  ).run(driver);
  res.status(201).json({ ...driver, isOnTrip: false });
});

app.put('/api/drivers/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM drivers WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Driver not found' });
  const updated = {
    ...existing,
    name: req.body.name ?? existing.name,
    phone: req.body.phone ?? existing.phone,
    email: req.body.email ?? existing.email,
    assignedBusId: req.body.assignedBusId ?? existing.assignedBusId,
    isOnTrip:
      req.body.isOnTrip !== undefined
        ? (req.body.isOnTrip ? 1 : 0)
        : existing.isOnTrip,
  };
  db.prepare(
    'UPDATE drivers SET name = @name, phone = @phone, email = @email, assignedBusId = @assignedBusId, isOnTrip = @isOnTrip WHERE id = @id'
  ).run(updated);
  res.json({ ...updated, isOnTrip: !!updated.isOnTrip });
});

app.delete('/api/drivers/:id', (req, res) => {
  db.prepare('DELETE FROM drivers WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Students
app.get('/api/students', (_req, res) => {
  const students = db.prepare('SELECT * FROM students').all();
  res.json(students);
});

app.post('/api/students', (req, res) => {
  const { name, registerNumber, phone, email, assignedBusId } = req.body;
  if (!name || !registerNumber) {
    return res.status(400).json({ error: 'name and registerNumber are required' });
  }
  const id = `st${Date.now()}`;
  const student = {
    id,
    name: String(name),
    registerNumber: String(registerNumber),
    phone: String(phone || ''),
    email: String(email || ''),
    assignedBusId: String(assignedBusId || ''),
  };
  db.prepare(
    'INSERT INTO students (id, name, registerNumber, phone, email, assignedBusId) VALUES (@id, @name, @registerNumber, @phone, @email, @assignedBusId)'
  ).run(student);
  res.status(201).json(student);
});

app.put('/api/students/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM students WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Student not found' });
  const updated = {
    ...existing,
    name: req.body.name ?? existing.name,
    registerNumber: req.body.registerNumber ?? existing.registerNumber,
    phone: req.body.phone ?? existing.phone,
    email: req.body.email ?? existing.email,
    assignedBusId: req.body.assignedBusId ?? existing.assignedBusId,
  };
  db.prepare(
    'UPDATE students SET name = @name, registerNumber = @registerNumber, phone = @phone, email = @email, assignedBusId = @assignedBusId WHERE id = @id'
  ).run(updated);
  res.json(updated);
});

app.delete('/api/students/:id', (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API listening on http://localhost:${PORT}`);
});

