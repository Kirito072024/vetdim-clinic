// Робота з даними. Статична версія бере дані з JSON-файлів через Fetch,
// записи зберігає в localStorage. У React-версії (ПР 7–8) — справжній REST API.

const cache = new Map();

async function getJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не вдалося завантажити ${url}: ${res.status}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

export const getDoctors = () => getJSON('data/doctors.json');
export const getServices = () => getJSON('data/services.json');

export async function getDoctor(id) {
  const doctors = await getDoctors();
  return doctors.find((d) => d.id === Number(id)) ?? null;
}

// ---- Записи (localStorage) ----
const KEY = 'vetdim-appointments';

export function getAppointments() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}

export function createAppointment(data) {
  const list = getAppointments();
  const taken = list.some((a) => a.doctorId === data.doctorId && a.date === data.date && a.time === data.time);
  if (taken) throw new Error('Цей час уже зайнятий. Оберіть інший.');
  const appointment = { id: Date.now(), number: 1000 + list.length + 1, createdAt: new Date().toISOString(), ...data };
  list.push(appointment);
  localStorage.setItem(KEY, JSON.stringify(list));
  return appointment;
}
