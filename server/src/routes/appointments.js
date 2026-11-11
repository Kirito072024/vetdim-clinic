// CRUD записів на прийом
import { Router } from 'express';
import { db } from '../db.js';
import { validateAppointment } from '../validation.js';
import { HttpError } from '../errors.js';

export const appointmentsRouter = Router();

const SLOT_TAKEN = 'Цей час уже зайнятий. Оберіть інший.';

// READ: GET /api/appointments?doctorId=1&date=2026-11-16
appointmentsRouter.get('/', (req, res) => {
  res.json(db.listAppointments({ doctorId: req.query.doctorId, date: req.query.date }));
});

// READ: GET /api/appointments/:id
appointmentsRouter.get('/:id', (req, res) => {
  const appointment = db.findAppointment(req.params.id);
  if (!appointment) throw new HttpError(404, 'Запис не знайдено');
  res.json(appointment);
});

// CREATE: POST /api/appointments
appointmentsRouter.post('/', async (req, res) => {
  const { errors, value, conflict } = validateAppointment(req.body);
  if (Object.keys(errors).length) throw new HttpError(400, 'Перевірте правильність заповнення форми', errors);
  if (conflict) throw new HttpError(409, SLOT_TAKEN, { time: SLOT_TAKEN });
  const appointment = await db.createAppointment(value);
  res.status(201).location(`/api/appointments/${appointment.id}`).json(appointment);
});

// UPDATE: PUT /api/appointments/:id — повна заміна даних запису (перенесення на інший час тощо)
appointmentsRouter.put('/:id', async (req, res) => {
  const existing = db.findAppointment(req.params.id);
  if (!existing) throw new HttpError(404, 'Запис не знайдено');
  const { errors, value, conflict } = validateAppointment(req.body, { excludeId: existing.id });
  if (Object.keys(errors).length) throw new HttpError(400, 'Перевірте правильність заповнення форми', errors);
  if (conflict) throw new HttpError(409, SLOT_TAKEN, { time: SLOT_TAKEN });
  res.json(await db.updateAppointment(existing.id, value));
});

// DELETE: DELETE /api/appointments/:id — скасування запису
appointmentsRouter.delete('/:id', async (req, res) => {
  const deleted = await db.deleteAppointment(req.params.id);
  if (!deleted) throw new HttpError(404, 'Запис не знайдено');
  res.status(204).end();
});
