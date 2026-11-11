// Форма зворотного зв'язку з валідацією
import { rules, setFieldError, attachLiveValidation } from '../validation.js';

export function initContactsPage() {
  const form = document.getElementById('feedback-form');
  const success = document.getElementById('feedback-success');
  const fields = [
    [form.elements.name, rules.ownerName],
    [form.elements.email, (v) => rules.email(v, { required: true })],
    [form.elements.message, rules.message],
  ];

  fields.forEach(([input, validate]) => attachLiveValidation(input, validate));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstInvalid = null;
    for (const [input, validate] of fields) {
      const ok = setFieldError(input, validate(input.value));
      if (!ok && !firstInvalid) firstInvalid = input;
    }
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    success.hidden = false;
    form.reset();
    setTimeout(() => (success.hidden = true), 6000);
  });
}
