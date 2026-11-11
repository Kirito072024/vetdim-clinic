// Правила валідації форм (ті самі правила використовує сервер)

const NAME_RE = /^[A-Za-zА-Яа-яЁёЇїІіЄєҐґ'’ -]+$/;
const PHONE_RE = /^\+380\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Прибирає пробіли, дужки й дефіси: "+38 (067) 123-45-67" → "+380671234567" */
export const normalizePhone = (value) => value.replace(/[\s()-]/g, '');

export const rules = {
  ownerName(value) {
    const v = value.trim();
    if (!v) return "Вкажіть ваше ім'я";
    if (v.length < 2) return "Ім'я має містити щонайменше 2 літери";
    if (v.length > 60) return "Ім'я задовге (до 60 символів)";
    if (!NAME_RE.test(v)) return "Ім'я може містити лише літери, пробіл, апостроф і дефіс";
    return '';
  },
  phone(value) {
    const v = normalizePhone(value);
    if (!v) return 'Вкажіть номер телефону';
    if (!PHONE_RE.test(v)) return 'Введіть номер у форматі +380XXXXXXXXX';
    return '';
  },
  email(value, { required = false } = {}) {
    const v = value.trim();
    if (!v) return required ? 'Вкажіть email' : '';
    if (!EMAIL_RE.test(v)) return 'Перевірте email, наприклад name@example.com';
    return '';
  },
  petName(value) {
    const v = value.trim();
    if (!v) return 'Як звати вашого улюбленця?';
    if (v.length > 40) return 'Кличка задовга (до 40 символів)';
    return '';
  },
  petAge(value) {
    if (value === '') return '';
    const n = Number(value);
    if (Number.isNaN(n) || n < 0 || n > 30) return 'Вік має бути від 0 до 30 років';
    return '';
  },
  message(value) {
    const v = value.trim();
    if (!v) return 'Напишіть повідомлення';
    if (v.length < 10) return 'Повідомлення має містити щонайменше 10 символів';
    return '';
  },
};

/** Показує або ховає помилку під полем і оновлює aria-invalid */
export function setFieldError(input, message) {
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) errorEl.textContent = message;
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  return !message;
}

/**
 * Підключає «живу» валідацію: перевірка при втраті фокусу,
 * а після першої помилки — під час введення.
 */
export function attachLiveValidation(input, validate) {
  input.addEventListener('blur', () => setFieldError(input, validate(input.value)));
  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') setFieldError(input, validate(input.value));
  });
}
