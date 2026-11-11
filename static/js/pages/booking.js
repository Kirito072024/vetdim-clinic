// Покрокова форма запису: послуга → лікар → дата і час → дані власника
import { getDoctors, getServices, getAppointments, createAppointment } from '../api.js';
import { rules, setFieldError, attachLiveValidation, normalizePhone } from '../validation.js';
import { nextDays, toISODate, daySlots, DOW_SHORT, MONTH_SHORT, formatDate, formatPrice, escapeHtml } from '../utils.js';

const TOTAL_STEPS = 4;

/** Імітація вже зайнятих слотів (детерміновано від лікаря, дати й часу) */
function isBusyDemo(doctorId, date, time) {
  const str = `${doctorId}|${date}|${time}`;
  let hash = 0;
  for (const ch of str) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 4 === 0;
}

export async function initBookingPage() {
  const form = document.getElementById('booking-form');
  const stepEls = [...form.querySelectorAll('.form-step')];
  const stepperItems = [...document.querySelectorAll('#stepper .stepper__item')];
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');
  const alertBox = document.getElementById('form-alert');
  const datesEl = document.getElementById('dates');
  const slotsEl = document.getElementById('slots');
  const summary = document.getElementById('summary');
  const successEl = document.getElementById('booking-success');

  const [doctors, services] = await Promise.all([getDoctors(), getServices()]);
  const params = new URLSearchParams(location.search);

  const state = {
    step: 1,
    serviceId: Number(params.get('service')) || null,
    doctorId: Number(params.get('doctor')) || null,
    date: null,
    time: null,
  };

  const service = () => services.find((s) => s.id === state.serviceId);
  const doctor = () => doctors.find((d) => d.id === state.doctorId);

  // ---------- Крок 1–2: показуємо лише сумісні послуги та лікарів ----------
  function syncOptions() {
    form.querySelectorAll('input[name="serviceId"]').forEach((input) => {
      const ok = !state.doctorId || doctor().serviceIds.includes(Number(input.value));
      input.closest('.option').hidden = !ok;
      input.checked = Number(input.value) === state.serviceId;
    });
    form.querySelectorAll('input[name="doctorId"]').forEach((input) => {
      const d = doctors.find((x) => x.id === Number(input.value));
      const ok = !state.serviceId || d.serviceIds.includes(state.serviceId);
      input.closest('.option').hidden = !ok;
      input.checked = Number(input.value) === state.doctorId;
    });
  }

  form.addEventListener('change', (e) => {
    const { name, value } = e.target;
    if (name === 'serviceId') {
      state.serviceId = Number(value);
      // Якщо обраний лікар не надає цю послугу — скидаємо лікаря
      if (state.doctorId && !doctor().serviceIds.includes(state.serviceId)) state.doctorId = null;
      setError('serviceId', '');
    }
    if (name === 'doctorId') {
      state.doctorId = Number(value);
      state.date = null;
      state.time = null;
      setError('doctorId', '');
    }
    syncOptions();
    updateSummary();
  });

  // ---------- Крок 3: дати та слоти ----------
  function renderDates() {
    const d = doctor();
    if (!d) {
      datesEl.innerHTML = '<p class="muted">Спочатку оберіть лікаря.</p>';
      return;
    }
    datesEl.innerHTML = nextDays(14)
      .map((day) => {
        const iso = toISODate(day);
        const works = d.workDays.includes(day.getDay());
        return `<button class="date" type="button" data-date="${iso}" aria-pressed="${iso === state.date}" ${works ? '' : 'disabled'}
          aria-label="${formatDate(iso)}${works ? '' : ' — лікар не приймає'}">
          <span class="date__dow">${DOW_SHORT[day.getDay()]}</span>
          <span class="date__day">${day.getDate()}</span>
          <span class="date__month">${MONTH_SHORT[day.getMonth()]}</span>
        </button>`;
      })
      .join('');
    // Автоматично обираємо першу доступну дату
    if (!state.date) {
      const first = datesEl.querySelector('.date:not(:disabled)');
      if (first) selectDate(first.dataset.date);
    } else {
      renderSlots();
    }
  }

  function selectDate(iso) {
    state.date = iso;
    state.time = null;
    datesEl.querySelectorAll('.date').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.date === iso)));
    renderSlots();
    updateSummary();
  }

  function renderSlots() {
    if (!state.date) {
      slotsEl.innerHTML = '<p class="muted">Оберіть дату, щоб побачити вільний час.</p>';
      return;
    }
    const booked = getAppointments().filter((a) => a.doctorId === state.doctorId && a.date === state.date);
    const now = new Date();
    const isToday = state.date === toISODate(now);
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const html = daySlots()
      .map((t) => {
        const busy = booked.some((a) => a.time === t) || isBusyDemo(state.doctorId, state.date, t) || (isToday && t <= nowStr);
        return `<button class="slot" type="button" data-time="${t}" aria-pressed="${t === state.time}" ${busy ? 'disabled aria-label="' + t + ' — зайнято"' : ''}>${t}</button>`;
      })
      .join('');
    slotsEl.innerHTML = html;
  }

  datesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.date');
    if (btn && !btn.disabled) selectDate(btn.dataset.date);
  });

  slotsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.slot');
    if (!btn || btn.disabled) return;
    state.time = btn.dataset.time;
    slotsEl.querySelectorAll('.slot').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    setError('time', '');
    updateSummary();
  });

  // ---------- Крок 4: поля ----------
  const fieldRules = {
    ownerName: rules.ownerName,
    phone: rules.phone,
    email: (v) => rules.email(v),
    petName: rules.petName,
    petAge: rules.petAge,
  };
  Object.entries(fieldRules).forEach(([name, validate]) => attachLiveValidation(form.elements[name], validate));

  // ---------- Підсумок ----------
  function updateSummary() {
    const set = (key, value) => (summary.querySelector(`[data-summary="${key}"]`).textContent = value || '—');
    set('service', service()?.name);
    set('doctor', doctor()?.name);
    set('date', state.date && formatDate(state.date));
    set('time', state.time);
    set('price', service() && `від ${formatPrice(service().price)}`);
  }

  // ---------- Навігація між кроками ----------
  function setError(key, message) {
    const el = document.getElementById(`${key}-error`);
    if (el) el.textContent = message;
  }

  function validateStep(step) {
    if (step === 1 && !state.serviceId) return setError('serviceId', 'Оберіть послугу'), false;
    if (step === 2 && !state.doctorId) return setError('doctorId', 'Оберіть лікаря'), false;
    if (step === 3 && (!state.date || !state.time)) return setError('time', 'Оберіть дату і вільний час'), false;
    if (step === 4) {
      let firstInvalid = null;
      for (const [name, validate] of Object.entries(fieldRules)) {
        const input = form.elements[name];
        if (!setFieldError(input, validate(input.value)) && !firstInvalid) firstInvalid = input;
      }
      if (firstInvalid) {
        firstInvalid.focus();
        return false;
      }
    }
    return true;
  }

  function goTo(step, { scroll = true } = {}) {
    state.step = step;
    stepEls.forEach((el) => el.classList.toggle('is-active', Number(el.dataset.step) === step));
    stepperItems.forEach((li, i) => {
      li.dataset.state = i + 1 < step ? 'done' : i + 1 === step ? 'current' : 'upcoming';
      if (i + 1 === step) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    prevBtn.hidden = step === 1;
    nextBtn.hidden = step === TOTAL_STEPS;
    submitBtn.hidden = step !== TOTAL_STEPS;
    alertBox.hidden = true;
    if (step === 3) renderDates();
    // Переводимо фокус на заголовок кроку — зручно для клавіатури та скрінрідерів
    const legend = stepEls[step - 1].querySelector('legend');
    legend.setAttribute('tabindex', '-1');
    legend.focus({ preventScroll: true });
    if (scroll) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  nextBtn.addEventListener('click', () => {
    if (validateStep(state.step)) goTo(state.step + 1);
  });
  prevBtn.addEventListener('click', () => goTo(state.step - 1));

  // ---------- Відправка ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      if (!validateStep(s)) {
        if (s !== state.step) goTo(s);
        return;
      }
    }
    const data = Object.fromEntries(new FormData(form));
    try {
      const appointment = createAppointment({
        serviceId: state.serviceId,
        doctorId: state.doctorId,
        date: state.date,
        time: state.time,
        ownerName: data.ownerName.trim(),
        phone: normalizePhone(data.phone),
        email: data.email.trim(),
        petName: data.petName.trim(),
        petType: data.petType,
        petAge: data.petAge === '' ? null : Number(data.petAge),
        comment: data.comment.trim(),
      });
      showSuccess(appointment);
    } catch (err) {
      alertBox.querySelector('p').textContent = err.message;
      alertBox.hidden = false;
      goTo(3);
      renderSlots();
    }
  });

  function showSuccess(a) {
    const set = (key, value) => (successEl.querySelector(`[data-success="${key}"]`).innerHTML = escapeHtml(value));
    set('number', `№${a.number}`);
    set('pet', a.petName);
    set('phone', a.phone);
    set('service', service().name);
    set('doctor', doctor().name);
    set('datetime', `${formatDate(a.date)}, ${a.time}`);
    form.hidden = true;
    document.querySelector('.booking__summary').hidden = true;
    successEl.hidden = false;
    successEl.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- Старт ----------
  document.documentElement.classList.add('js');
  syncOptions();
  updateSummary();
  // Якщо послугу/лікаря передано в URL — одразу переходимо далі
  goTo(state.serviceId && state.doctorId ? 3 : state.serviceId ? 2 : 1, { scroll: false });
}
