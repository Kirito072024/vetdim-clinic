// Сторінка лікаря: заповнюємо розмітку даними за ?id=
import { getDoctor, getServices } from '../api.js';
import { pluralYears, DOW_SHORT, escapeHtml, formatPrice } from '../utils.js';

export async function initDoctorPage() {
  const id = new URLSearchParams(location.search).get('id') ?? '1';
  const root = document.getElementById('doctor');
  const [doctor, services] = await Promise.all([getDoctor(id), getServices()]).catch(() => [null, []]);

  if (!doctor) {
    root.innerHTML = `<div class="empty"><h1>Лікаря не знайдено</h1><p><a class="btn btn--primary" href="doctors.html">До списку лікарів</a></p></div>`;
    document.title = 'Лікаря не знайдено — ВетДім';
    return;
  }

  const set = (field, value) =>
    document.querySelectorAll(`[data-field="${field}"]`).forEach((el) => (el.textContent = value));
  set('name', doctor.name);
  set('specialty', doctor.specialty);
  set('experience', `${doctor.experience} ${pluralYears(doctor.experience)}`);
  set('rating', doctor.rating.toFixed(1));
  set('education', doctor.education);
  set('bio', doctor.bio);

  const photo = document.querySelector('[data-field="photo"]');
  photo.src = doctor.photo;
  photo.alt = `Портрет: ${doctor.name}`;

  document.querySelector('[data-field="services"]').innerHTML = doctor.serviceIds
    .map((sid) => services.find((s) => s.id === sid))
    .filter(Boolean)
    .map(
      (s) =>
        `<li><span>${escapeHtml(s.name)}</span><span class="service-list__price">від ${formatPrice(s.price)}</span></li>`,
    )
    .join('');

  document.querySelector('[data-field="schedule"]').innerHTML = [1, 2, 3, 4, 5, 6, 0]
    .map((n) => {
      const on = doctor.workDays.includes(n);
      return `<li class="week__day${on ? ' is-active' : ''}"><abbr title="${on ? 'Приймає' : 'Не приймає'}">${DOW_SHORT[n]}</abbr></li>`;
    })
    .join('');

  document.querySelector('[data-field="cta"]').href = `booking.html?doctor=${doctor.id}`;
  document.title = `${doctor.name} — ${doctor.specialty} | ВетДім`;
}
