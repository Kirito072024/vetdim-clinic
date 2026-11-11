// Форматування дат, цін і відмінювання

/** Шлях до файлу з папки public з урахуванням base (для GitHub Pages) */
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

/** 1 рік, 2 роки, 5 років */
export function pluralYears(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'рік';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'роки';
  return 'років';
}

export const DOW_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const MONTH_SHORT = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];

/** Date → "2026-11-16" за місцевим часом */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "2026-11-16" → Date (місцевий час) */
export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-11-16" → "пн, 16 листопада" */
export const formatDate = (iso) =>
  fromISODate(iso).toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'long' });

/** Наступні N днів, починаючи з сьогодні */
export function nextDays(count = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

/** 1800 → "1 800 ₴" */
export const formatPrice = (n) => `${n.toLocaleString('uk-UA')} ₴`;
