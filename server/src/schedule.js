// Розклад прийому: слоти по 30 хвилин з 09:00 до 18:00

const START_HOUR = 9;
const END_HOUR = 18;
const STEP_MIN = 30;

export const SLOT_TIMES = (() => {
  const times = [];
  for (let m = START_HOUR * 60; m < END_HOUR * 60; m += STEP_MIN) {
    times.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return times;
})();

/** Date → "YYYY-MM-DD" за місцевим часом сервера */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const isValidSlotTime = (time) => SLOT_TIMES.includes(time);

export const isWorkingDay = (doctor, date) => doctor.workDays.includes(new Date(`${date}T00:00`).getDay());

/** Чи вже минув цей слот (для сьогоднішньої дати) */
export function isPast(date, time) {
  const now = new Date();
  const today = toISODate(now);
  if (date !== today) return date < today;
  return time <= now.toTimeString().slice(0, 5);
}

/**
 * Імітація записів, зроблених телефоном через реєстратуру
 * (детерміновано: однакові лікар/дата/час завжди дають однаковий результат),
 * щоб розклад виглядав реалістично. Вимикається змінною DEMO_BUSY=false.
 */
export function isBookedByPhone(doctorId, date, time) {
  if (process.env.DEMO_BUSY === 'false') return false;
  let hash = 0;
  for (const ch of `${doctorId}|${date}|${time}`) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 4 === 0;
}
