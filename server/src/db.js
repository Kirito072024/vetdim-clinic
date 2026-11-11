// Просте сховище на JSON-файлах.
// Лікарі та послуги — довідники (лише читання), записи на прийом — змінні дані.
import { readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const file = (name) => path.join(DATA_DIR, `${name}.json`);

async function readJSON(name, fallback) {
  if (!existsSync(file(name))) return fallback;
  return JSON.parse(await readFile(file(name), 'utf8'));
}

// Довідники читаємо один раз при старті
export const doctors = await readJSON('doctors', []);
export const services = await readJSON('services', []);

let appointments = await readJSON('appointments', []);

// Записуємо у тимчасовий файл і перейменовуємо — так файл не пошкодиться,
// якщо сервер впаде посеред запису. Черга (writing) не дає двом записам перетнутися.
let writing = Promise.resolve();
function persist() {
  const snapshot = JSON.stringify(appointments, null, 2);
  writing = writing.then(async () => {
    await writeFile(`${file('appointments')}.tmp`, snapshot);
    await rename(`${file('appointments')}.tmp`, file('appointments'));
  });
  return writing;
}

export const db = {
  findDoctor: (id) => doctors.find((d) => d.id === Number(id)),
  findService: (id) => services.find((s) => s.id === Number(id)),

  listAppointments: (filter = {}) =>
    appointments.filter(
      (a) =>
        (!filter.doctorId || a.doctorId === Number(filter.doctorId)) && (!filter.date || a.date === filter.date),
    ),
  findAppointment: (id) => appointments.find((a) => a.id === Number(id)),

  isSlotTaken: (doctorId, date, time, exceptId) =>
    appointments.some((a) => a.doctorId === doctorId && a.date === date && a.time === time && a.id !== exceptId),

  async createAppointment(data) {
    const id = appointments.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const appointment = { id, number: 1000 + id, status: 'confirmed', createdAt: new Date().toISOString(), ...data };
    appointments.push(appointment);
    await persist();
    return appointment;
  },

  async updateAppointment(id, data) {
    const index = appointments.findIndex((a) => a.id === Number(id));
    if (index === -1) return null;
    appointments[index] = { ...appointments[index], ...data, updatedAt: new Date().toISOString() };
    await persist();
    return appointments[index];
  },

  async deleteAppointment(id) {
    const before = appointments.length;
    appointments = appointments.filter((a) => a.id !== Number(id));
    if (appointments.length === before) return false;
    await persist();
    return true;
  },

  /** Для тестів: очищення записів */
  async reset() {
    appointments = [];
    await persist();
  },
};
