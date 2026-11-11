// Точка входу: спільна поведінка + модуль поточної сторінки
import { initTheme, initBurger, initHeaderShadow } from './ui.js';

initTheme();
initBurger();
initHeaderShadow();

// Кожна сторінка позначена атрибутом <body data-page="...">.
// Модуль сторінки завантажується динамічно — лише той, що потрібен.
const pages = {
  doctors: () => import('./pages/doctors.js').then((m) => m.initDoctorsPage()),
  doctor: () => import('./pages/doctor.js').then((m) => m.initDoctorPage()),
  services: () => import('./pages/services.js').then((m) => m.initServicesPage()),
  booking: () => import('./pages/booking.js').then((m) => m.initBookingPage()),
  contacts: () => import('./pages/contacts.js').then((m) => m.initContactsPage()),
};

pages[document.body.dataset.page]?.().catch((err) => console.error('Помилка ініціалізації сторінки:', err));
