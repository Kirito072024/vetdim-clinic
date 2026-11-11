// Серверна валідація. Правила для полів збігаються з клієнтськими (client/src/lib/validation.js),
// плюс перевірки, які можна зробити лише на сервері: чи існують лікар і послуга, чи вільний слот.
import { db } from './db.js';
import { isWorkingDay, isValidSlotTime, isPast, toISODate, isBookedByPhone } from './schedule.js';

const NAME_RE = /^[A-Za-zА-Яа-яЁёЇїІіЄєҐґ'’ -]+$/;
const PHONE_RE = /^\+380\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PET_TYPES = ['cat', 'dog', 'other'];
const MAX_DAYS_AHEAD = 30;

export const normalizePhone = (value = '') => String(value).replace(/[\s()-]/g, '');
const str = (v) => (typeof v === 'string' ? v.trim() : '');

export const rules = {
  ownerName(v) {
    v = str(v);
    if (!v) return "Вкажіть ваше ім'я";
    if (v.length < 2) return "Ім'я має містити щонайменше 2 літери";
    if (v.length > 60) return "Ім'я задовге (до 60 символів)";
    if (!NAME_RE.test(v)) return "Ім'я може містити лише літери, пробіл, апостроф і дефіс";
    return '';
  },
  phone(v) {
    v = normalizePhone(v);
    if (!v) return 'Вкажіть номер телефону';
    if (!PHONE_RE.test(v)) return 'Введіть номер у форматі +380XXXXXXXXX';
    return '';
  },
  email(v, required = false) {
    v = str(v);
    if (!v) return required ? 'Вкажіть email' : '';
    if (!EMAIL_RE.test(v) || v.length > 100) return 'Перевірте email, наприклад name@example.com';
    return '';
  },
  petName(v) {
    v = str(v);
    if (!v) return 'Як звати вашого улюбленця?';
    if (v.length > 40) return 'Кличка задовга (до 40 символів)';
    return '';
  },
  petType: (v) => (PET_TYPES.includes(v) ? '' : 'Оберіть вид тварини'),
  petAge(v) {
    if (v === undefined || v === null || v === '') return '';
    const n = Number(v);
    if (Number.isNaN(n) || n < 0 || n > 30) return 'Вік має бути від 0 до 30 років';
    return '';
  },
  comment: (v) => (v !== undefined && typeof v !== 'string') || str(v).length > 500 ? 'Коментар задовгий (до 500 символів)' : '',
  message(v) {
    v = str(v);
    if (!v) return 'Напишіть повідомлення';
    if (v.length < 10) return 'Повідомлення має містити щонайменше 10 символів';
    if (v.length > 1000) return 'Повідомлення задовге (до 1000 символів)';
    return '';
  },
};

/**
 * Перевіряє дані запису. Повертає { errors, value }:
 * errors — об'єкт «поле → повідомлення», value — очищені дані для збереження.
 * excludeId — id запису, який редагуємо (щоб він не конфліктував сам із собою).
 */
export function validateAppointment(body = {}, { excludeId } = {}) {
  const errors = {};
  const set = (field, message) => message && (errors[field] = message);

  const service = db.findService(body.serviceId);
  const doctor = db.findDoctor(body.doctorId);
  if (!service) set('serviceId', 'Оберіть послугу');
  if (!doctor) set('doctorId', 'Оберіть лікаря');
  if (service && doctor && !doctor.serviceIds.includes(service.id)) {
    set('doctorId', 'Цей лікар не надає обрану послугу');
  }

  // Дата: формат, не в минулому, не далі ніж 30 днів, робочий день лікаря
  const date = str(body.date);
  if (!DATE_RE.test(date) || Number.isNaN(new Date(`${date}T00:00`).getTime())) {
    set('date', 'Оберіть дату прийому');
  } else {
    const limit = new Date();
    limit.setDate(limit.getDate() + MAX_DAYS_AHEAD);
    if (date < toISODate(new Date())) set('date', 'Дата не може бути в минулому');
    else if (date > toISODate(limit)) set('date', `Запис можливий не більше ніж на ${MAX_DAYS_AHEAD} днів уперед`);
    else if (doctor && !isWorkingDay(doctor, date)) set('date', 'Лікар не приймає в цей день');
  }

  // Час: один зі слотів розкладу, не в минулому, не зайнятий
  const time = str(body.time);
  if (!isValidSlotTime(time)) set('time', 'Оберіть час прийому');
  else if (!errors.date && isPast(date, time)) set('time', 'Цей час уже минув');

  for (const field of ['ownerName', 'phone', 'petName', 'petType', 'petAge', 'comment']) {
    set(field, rules[field](body[field]));
  }
  set('email', rules.email(body.email));

  const value = {
    serviceId: service?.id,
    doctorId: doctor?.id,
    date,
    time,
    ownerName: str(body.ownerName),
    phone: normalizePhone(body.phone),
    email: str(body.email),
    petName: str(body.petName),
    petType: body.petType,
    petAge: body.petAge === '' || body.petAge === undefined || body.petAge === null ? null : Number(body.petAge),
    comment: str(body.comment),
  };

  // Конфлікт слотів перевіряємо лише для коректних даних
  const conflict =
    !Object.keys(errors).length &&
    (db.isSlotTaken(value.doctorId, value.date, value.time, excludeId) ||
      isBookedByPhone(value.doctorId, value.date, value.time));

  return { errors, value, conflict };
}

export function validateFeedback(body = {}) {
  const errors = {};
  const name = rules.ownerName(body.name);
  const email = rules.email(body.email, true);
  const message = rules.message(body.message);
  if (name) errors.name = name;
  if (email) errors.email = email;
  if (message) errors.message = message;
  return { errors, value: { name: str(body.name), email: str(body.email), message: str(body.message) } };
}
