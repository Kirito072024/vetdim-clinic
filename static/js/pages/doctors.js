// Каталог лікарів: дані через Fetch, фільтр за спеціалізацією, пошук
import { getDoctors } from '../api.js';
import { doctorCard, errorState } from '../cards.js';

export async function initDoctorsPage() {
  const list = document.getElementById('doctors-list');
  const search = document.getElementById('doctor-search');
  const chips = document.querySelectorAll('#specialty-filter .chip');
  const count = document.getElementById('results-count');

  const state = { specialty: new URLSearchParams(location.search).get('specialty') ?? '', query: '' };
  let doctors = [];

  try {
    doctors = await getDoctors();
  } catch (err) {
    list.innerHTML = errorState('Не вдалося завантажити список лікарів.');
    console.error(err);
    return;
  }

  function render() {
    const q = state.query.trim().toLowerCase();
    const filtered = doctors.filter(
      (d) => (!state.specialty || d.specialty === state.specialty) && (!q || d.name.toLowerCase().includes(q)),
    );
    list.innerHTML = filtered.length
      ? filtered.map((d) => doctorCard(d)).join('')
      : '<li class="empty"><p>За вашим запитом лікарів не знайдено. Спробуйте змінити фільтр.</p></li>';
    count.textContent = `Знайдено лікарів: ${filtered.length}`;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.specialty === state.specialty)));
  }

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      state.specialty = chip.dataset.specialty;
      render();
    }),
  );

  // Debounce: не перемальовуємо список на кожну літеру
  let timer;
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.query = search.value;
      render();
    }, 150);
  });

  render();
}
