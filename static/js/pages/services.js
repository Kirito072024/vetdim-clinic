// Каталог послуг: фільтр за категорією
import { getServices } from '../api.js';
import { serviceCard, errorState } from '../cards.js';

export async function initServicesPage() {
  const list = document.getElementById('services-list');
  const chips = document.querySelectorAll('#category-filter .chip');
  let services = [];
  try {
    services = await getServices();
  } catch (err) {
    list.innerHTML = errorState('Не вдалося завантажити послуги.');
    console.error(err);
    return;
  }

  const render = (category) => {
    list.innerHTML = services
      .filter((s) => !category || s.category === category)
      .map((s) => serviceCard(s))
      .join('');
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.category === category)));
  };

  chips.forEach((chip) => chip.addEventListener('click', () => render(chip.dataset.category)));
  render('');
}
