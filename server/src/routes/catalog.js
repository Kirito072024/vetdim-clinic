// Довідники: лікарі, послуги, вільні слоти
import { Router } from 'express';
import { db, doctors, services } from '../db.js';
import { SLOT_TIMES, isWorkingDay, isPast, isBookedByPhone } from '../schedule.js';
import { HttpError } from '../errors.js';

export const catalogRouter = Router();

// GET /api/doctors?specialty=Терапевт&q=олена
catalogRouter.get('/doctors', (req, res) => {
  const { specialty, q } = req.query;
  const query = typeof q === 'string' ? q.trim().toLowerCase() : '';
  res.json(
    doctors.filter(
      (d) => (!specialty || d.specialty === specialty) && (!query || d.name.toLowerCase().includes(query)),
    ),
  );
});

// GET /api/doctors/:id
catalogRouter.get('/doctors/:id', (req, res) => {
  const doctor = db.findDoctor(req.params.id);
  if (!doctor) throw new HttpError(404, 'Лікаря не знайдено');
  res.json(doctor);
});

// GET /api/doctors/:id/slots?date=2026-11-16 → [{ time, available }]
catalogRouter.get('/doctors/:id/slots', (req, res) => {
  const doctor = db.findDoctor(req.params.id);
  if (!doctor) throw new HttpError(404, 'Лікаря не знайдено');
  const { date } = req.query;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, 'Параметр date обов’язковий у форматі YYYY-MM-DD');
  }
  if (!isWorkingDay(doctor, date)) return res.json([]);

  const booked = new Set(db.listAppointments({ doctorId: doctor.id, date }).map((a) => a.time));
  res.json(
    SLOT_TIMES.map((time) => ({
      time,
      available: !booked.has(time) && !isPast(date, time) && !isBookedByPhone(doctor.id, date, time),
    })),
  );
});

// GET /api/services?category=Хірургія
catalogRouter.get('/services', (req, res) => {
  const { category } = req.query;
  res.json(services.filter((s) => !category || s.category === category));
});

// GET /api/services/:id
catalogRouter.get('/services/:id', (req, res) => {
  const service = db.findService(req.params.id);
  if (!service) throw new HttpError(404, 'Послугу не знайдено');
  res.json(service);
});
