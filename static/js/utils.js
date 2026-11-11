// Допоміжні функції

/** Іконка зі спрайту */
export const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" aria-hidden="true"><use href="img/icons.svg#i-${name}"/></svg>`;

/** Екранування тексту перед вставкою в HTML (захист від XSS) */
export const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

/** Відмінювання: 1 рік, 2 роки, 5 років */
export function pluralYears(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'рік';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'роки';
  return 'років';
}

export const DOW_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const MONTH_SHORT = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];

/** Дата → "2026-11-16" за місцевим часом (без зсуву UTC) */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "2026-11-16" → "пн, 16 листопада" */
export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'long' });
}

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

/** Усі слоти робочого дня: 09:00 … 17:30, крок 30 хв */
export function daySlots(start = 9, end = 18, step = 30) {
  const slots = [];
  for (let min = start * 60; min < end * 60; min += step) {
    slots.push(`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
  }
  return slots;
}

/** Ціна у гривнях: 1800 → "1 800 ₴" */
export const formatPrice = (n) => `${n.toLocaleString('uk-UA')} ₴`;
