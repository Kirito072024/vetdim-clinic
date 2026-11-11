// Шаблони карток (ті самі класи, що й у статичній розмітці)
import { icon, escapeHtml, pluralYears, formatPrice } from './utils.js';

export const doctorCard = (d, level = 'h2') => `
  <li>
    <article class="card card--hover doctor-card">
      <div class="doctor-card__photo"><img src="${d.photo}" alt="" width="400" height="300" loading="lazy"></div>
      <div class="card__body">
        <span class="badge">${escapeHtml(d.specialty)}</span>
        <${level} class="card__title"><a href="doctor.html?id=${d.id}">${escapeHtml(d.name)}</a></${level}>
        <div class="card__meta">
          <span>Стаж ${d.experience} ${pluralYears(d.experience)}</span>
          <span class="rating">${icon('star')}${d.rating.toFixed(1)}</span>
        </div>
      </div>
    </article>
  </li>`;

export const serviceCard = (s, level = 'h2') => `
  <li>
    <article class="card card--hover service-card">
      <div class="card__body">
        <div class="service-card__icon">${icon(s.icon)}</div>
        <p class="card__meta"><span>${escapeHtml(s.category)}</span><span>${icon('clock', 'icon icon--sm')}${s.duration} хв</span></p>
        <${level} class="card__title">${escapeHtml(s.name)}</${level}>
        <p class="muted service-card__text">${escapeHtml(s.description)}</p>
        <div class="card__footer">
          <p class="price"><small>від</small> ${formatPrice(s.price)}</p>
          <a class="btn btn--secondary" href="booking.html?service=${s.id}" aria-label="Записатися: ${escapeHtml(s.name)}">Записатися</a>
        </div>
      </div>
    </article>
  </li>`;

export const errorState = (message) => `
  <li class="empty">
    <p><strong>${escapeHtml(message)}</strong></p>
    <button class="btn btn--secondary" type="button" data-action="reload">Спробувати ще раз</button>
  </li>`;

// Кнопка «Спробувати ще раз» в стані помилки
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-action="reload"]')) location.reload();
});
