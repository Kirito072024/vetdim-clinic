// Тести REST API: node --test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let server;
let base;
let tmp;

before(async () => {
  // Окрема тимчасова папка з даними, щоб тести не чіпали справжні записи
  tmp = await mkdtemp(path.join(tmpdir(), 'vetdim-'));
  for (const f of ['doctors.json', 'services.json']) {
    await copyFile(path.join(here, '..', 'data', f), path.join(tmp, f));
  }
  process.env.DATA_DIR = tmp;
  process.env.DEMO_BUSY = 'false';
  const { createApp } = await import('../src/app.js');
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}/api`;
});

after(async () => {
  server?.close();
  await rm(tmp, { recursive: true, force: true });
});

const api = async (method, url, body) => {
  const res = await fetch(base + url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: res.status === 204 ? null : await res.json() };
};

/** Найближчий робочий день лікаря, починаючи із завтра */
function nextWorkDay(workDays) {
  const d = new Date();
  do d.setDate(d.getDate() + 1);
  while (!workDays.includes(d.getDay()));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DATE = nextWorkDay([1, 2, 3, 4, 5]); // графік лікаря №1
const valid = () => ({
  serviceId: 2,
  doctorId: 1,
  date: DATE,
  time: '10:00',
  ownerName: 'Олена',
  phone: '+38 (067) 123-45-67',
  email: '',
  petName: 'Барсик',
  petType: 'cat',
  petAge: 3,
  comment: '',
});

test('GET /api/health', async () => {
  const { status, body } = await api('GET', '/health');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
});

test('GET /api/doctors повертає 6 лікарів і фільтрує за спеціалізацією', async () => {
  assert.equal((await api('GET', '/doctors')).body.length, 6);
  const { body } = await api('GET', `/doctors?specialty=${encodeURIComponent('Терапевт')}`);
  assert.equal(body.length, 2);
  assert.ok(body.every((d) => d.specialty === 'Терапевт'));
});

test('GET /api/doctors/:id — 200 та 404', async () => {
  assert.equal((await api('GET', '/doctors/1')).body.name, 'Олена Іваненко');
  assert.equal((await api('GET', '/doctors/999')).status, 404);
});

test('GET /api/services?category= фільтрує послуги', async () => {
  const { body } = await api('GET', `/services?category=${encodeURIComponent('Хірургія')}`);
  assert.equal(body.length, 2);
});

test('GET /slots вимагає дату і повертає 18 слотів', async () => {
  assert.equal((await api('GET', '/doctors/1/slots')).status, 400);
  const { body } = await api('GET', `/doctors/1/slots?date=${DATE}`);
  assert.equal(body.length, 18);
  assert.ok(body.every((s) => s.available));
});

test('POST /api/appointments — серверна валідація', async () => {
  const { status, body } = await api('POST', '/appointments', { ...valid(), phone: '123', ownerName: '' });
  assert.equal(status, 400);
  assert.ok(body.fields.phone);
  assert.ok(body.fields.ownerName);
});

test('POST — лікар має надавати обрану послугу', async () => {
  const { status, body } = await api('POST', '/appointments', { ...valid(), serviceId: 4 }); // стерилізація — не терапевт
  assert.equal(status, 400);
  assert.ok(body.fields.doctorId);
});

test('POST — дата в минулому відхиляється', async () => {
  const { status, body } = await api('POST', '/appointments', { ...valid(), date: '2020-01-06' });
  assert.equal(status, 400);
  assert.ok(body.fields.date);
});

test('CRUD: створення, конфлікт слоту, читання, оновлення, видалення', async () => {
  // CREATE
  const created = await api('POST', '/appointments', valid());
  assert.equal(created.status, 201);
  assert.equal(created.body.phone, '+380671234567'); // телефон нормалізовано
  const { id } = created.body;

  // Той самий слот вдруге — 409 Conflict
  assert.equal((await api('POST', '/appointments', valid())).status, 409);

  // Слот став недоступним
  const slots = (await api('GET', `/doctors/1/slots?date=${DATE}`)).body;
  assert.equal(slots.find((s) => s.time === '10:00').available, false);

  // READ
  assert.equal((await api('GET', `/appointments/${id}`)).body.petName, 'Барсик');
  assert.equal((await api('GET', `/appointments?doctorId=1&date=${DATE}`)).body.length, 1);

  // UPDATE — перенесення на 11:00
  const updated = await api('PUT', `/appointments/${id}`, { ...valid(), time: '11:00' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.time, '11:00');

  // DELETE
  assert.equal((await api('DELETE', `/appointments/${id}`)).status, 204);
  assert.equal((await api('GET', `/appointments/${id}`)).status, 404);
});

test('POST /api/feedback — валідація і успіх', async () => {
  assert.equal((await api('POST', '/feedback', { name: 'О', email: 'x', message: '' })).status, 400);
  const ok = await api('POST', '/feedback', { name: 'Олена', email: 'olena@example.com', message: 'Підкажіть, будь ласка, ціну УЗД.' });
  assert.equal(ok.status, 201);
});

test('Некоректний JSON та невідомий маршрут', async () => {
  const res = await fetch(`${base}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(res.status, 400);
  assert.equal((await api('GET', '/unknown')).status, 404);
});
