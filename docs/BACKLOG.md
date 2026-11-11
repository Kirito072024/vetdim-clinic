# Беклог (дзеркало GitHub Issues)

Кожен пункт відповідає окремій задачі (Issue) на GitHub з міткою етапу.

## ПР 1 — Концепція, ТЗ
- [x] Створити репозиторій і README
- [x] Додати `.gitignore`
- [x] Написати технічне завдання `docs/TZ.md`
- [ ] Створити Issues-беклог на GitHub (див. README → «Що зробити вручну»)

## ПР 2 — UX, wireframe
- [x] Персони користувачів (2)
- [x] User stories (5)
- [x] User flow запису на прийом
- [x] Sitemap
- [x] Low-fi wireframe 6 екранів (desktop 1440 / mobile 375) — `docs/wireframes/`
- [x] Клікабельний прототип (HTML-wireframe)
- [ ] Коридорне тестування з 2 одногрупниками (заповнити docs/UX.md, розділ 6)

## ПР 3 — Дизайн-система
- [x] Мудборд (docs/DESIGN.md)
- [x] Токени: кольори, типографіка, відступи, радіуси
- [x] Компоненти: кнопки, поля, картки, хедер, футер
- [x] Макети desktop + mobile

## ПР 4 — HTML
- [x] Розмітка всіх сторінок
- [x] Перевірка W3C-валідатором

## ПР 5 — CSS
- [x] Mobile-first верстка (360 / 768 / 1280)
- [x] Темна тема

## ПР 6 — JavaScript
- [x] Бургер-меню, перемикач теми
- [x] Фільтр і пошук лікарів
- [x] Валідація форми запису
- [x] Завантаження даних через Fetch

## ПР 7 — React
- [x] Ініціалізація Vite + React
- [x] Компоненти і маршрутизація (React Router)
- [x] Покрокова форма запису (стан, хуки)

## ПР 8 — Node.js API
- [x] Express-сервер, CRUD `/api/appointments`
- [x] `/api/doctors`, `/api/services`, `/api/doctors/:id/slots`
- [x] Серверна валідація, перевірка конфліктів слотів
- [x] Підключення API до React

## ПР 9 — Тестування
- [x] Lighthouse «до/після»
- [x] SEO: meta, title, description, Open Graph
- [x] a11y: контраст, клавіатура, aria
- [x] Чек-лист тестів

## ПР 10 — Деплой
- [x] Деплой фронтенду (GitHub Pages через GitHub Actions) з автодеплоєм із `main`
- [x] Конфігурація деплою API (render.yaml)
- [ ] Підключити репозиторій до Render і вказати API_URL (вручну)
- [x] PWA (manifest, service worker)
- [x] README зі скриншотами, звіт `docs/report.pdf`, презентація
