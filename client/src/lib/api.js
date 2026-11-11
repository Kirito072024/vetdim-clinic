// Клієнт REST API (Express-сервер з папки server/).
// У розробці запити /api проксіюються Vite на http://localhost:3001.
// У продакшні адреса API задається змінною VITE_API_URL.
// Якщо VITE_API_URL не задано під час збірки — працює демо-режим (дані з JSON у public/data,
// записи в localStorage), щоб опублікований сайт працював навіть без сервера.
import { asset, toISODate } from './format.js';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const DEMO_MODE = import.meta.env.PROD && !API_URL;

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Немає з'єднання із сервером. Перевірте інтернет і спробуйте ще раз.", 0);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? `Помилка сервера (${res.status})`, res.status, data?.fields);
  return data;
}

const qs = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')).toString();
  return s ? `?${s}` : '';
};

// ================= Демо-режим (без сервера) =================
const demo = {
  cache: {},
  async json(name) {
    this.cache[name] ??= fetch(asset(`data/${name}.json`)).then((r) => r.json());
    return this.cache[name];
  },
  appointments() {
    try {
      return JSON.parse(localStorage.getItem('vetdim-appointments')) ?? [];
    } catch {
      return [];
    }
  },
  busy(doctorId, date, time) {
    let hash = 0;
    for (const ch of `${doctorId}|${date}|${time}`) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return hash % 4 === 0;
  },
};

// ================= Публічні функції =================
export async function getDoctors({ specialty, q } = {}) {
  if (!DEMO_MODE) return request(`/doctors${qs({ specialty, q })}`);
  const list = await demo.json('doctors');
  const query = (q ?? '').toLowerCase();
  return list.filter((d) => (!specialty || d.specialty === specialty) && (!query || d.name.toLowerCase().includes(query)));
}

export async function getDoctor(id) {
  if (!DEMO_MODE) return request(`/doctors/${id}`);
  const doctor = (await demo.json('doctors')).find((d) => d.id === Number(id));
  if (!doctor) throw new ApiError('Лікаря не знайдено', 404);
  return doctor;
}

export async function getServices({ category } = {}) {
  if (!DEMO_MODE) return request(`/services${qs({ category })}`);
  const list = await demo.json('services');
  return list.filter((s) => !category || s.category === category);
}

/** Слоти лікаря на дату: [{ time: '09:00', available: true }, ...] */
export async function getSlots(doctorId, date) {
  if (!DEMO_MODE) return request(`/doctors/${doctorId}/slots${qs({ date })}`);
  const doctor = await getDoctor(doctorId);
  const day = new Date(`${date}T00:00`).getDay();
  if (!doctor.workDays.includes(day)) return [];
  const booked = demo.appointments().filter((a) => a.doctorId === doctor.id && a.date === date);
  const now = new Date();
  const nowStr = now.toTimeString().slice(0, 5);
  const slots = [];
  for (let m = 9 * 60; m < 18 * 60; m += 30) {
    const time = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const past = date === toISODate(now) && time <= nowStr;
    slots.push({ time, available: !past && !booked.some((a) => a.time === time) && !demo.busy(doctor.id, date, time) });
  }
  return slots;
}

export async function createAppointment(data) {
  if (!DEMO_MODE) return request('/appointments', { method: 'POST', body: data });
  const list = demo.appointments();
  if (list.some((a) => a.doctorId === data.doctorId && a.date === data.date && a.time === data.time)) {
    throw new ApiError('Цей час уже зайнятий. Оберіть інший.', 409);
  }
  const appointment = { id: Date.now(), number: 1000 + list.length + 1, status: 'confirmed', ...data };
  localStorage.setItem('vetdim-appointments', JSON.stringify([...list, appointment]));
  return appointment;
}

export async function sendFeedback(data) {
  if (!DEMO_MODE) return request('/feedback', { method: 'POST', body: data });
  return { ok: true };
}
