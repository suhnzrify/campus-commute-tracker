import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const BUSES_FILE = path.join(DATA_DIR, 'buses.json');
const DRIVERS_FILE = path.join(DATA_DIR, 'drivers.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');

function ensureFile(file, initialValue) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(initialValue, null, 2), 'utf-8');
  }
}

function readJson(file, initialValue) {
  ensureFile(file, initialValue);
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson(file, value) {
  ensureFile(file, []);
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

// Buses
export function getBuses() {
  return readJson(BUSES_FILE, []);
}

export function saveBus(bus) {
  const buses = getBuses();
  const idx = buses.findIndex(b => b.id === bus.id);
  if (idx === -1) {
    buses.push(bus);
  } else {
    buses[idx] = bus;
  }
  writeJson(BUSES_FILE, buses);
  return bus;
}

export function deleteBus(id) {
  const buses = getBuses().filter(b => b.id !== id);
  writeJson(BUSES_FILE, buses);
}

// Drivers
export function getDrivers() {
  return readJson(DRIVERS_FILE, []);
}

export function saveDriver(driver) {
  const drivers = getDrivers();
  const idx = drivers.findIndex(d => d.id === driver.id);
  if (idx === -1) {
    drivers.push(driver);
  } else {
    drivers[idx] = driver;
  }
  writeJson(DRIVERS_FILE, drivers);
  return driver;
}

export function deleteDriver(id) {
  const drivers = getDrivers().filter(d => d.id !== id);
  writeJson(DRIVERS_FILE, drivers);
}

// Students
export function getStudents() {
  return readJson(STUDENTS_FILE, []);
}

export function saveStudent(student) {
  const students = getStudents();
  const idx = students.findIndex(s => s.id === student.id);
  if (idx === -1) {
    students.push(student);
  } else {
    students[idx] = student;
  }
  writeJson(STUDENTS_FILE, students);
  return student;
}

export function deleteStudent(id) {
  const students = getStudents().filter(s => s.id !== id);
  writeJson(STUDENTS_FILE, students);
}

