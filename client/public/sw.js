// Service worker «ВетДім»: робота офлайн і швидке повторне відкриття.
// Стратегії кешування:
//  • сторінки (navigation)        — network-first, офлайн → збережена оболонка застосунку;
//  • GET-запити до API та JSON-даних — network-first, офлайн → останні збережені дані;
//  • статичні файли (JS, CSS, SVG) — cache-first (імена файлів Vite містять хеш, тож вони не змінюються).
// Запис на прийом (POST) офлайн неможливий — користувач побачить повідомлення про відсутність з'єднання.

const VERSION = 'vetdim-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const SCOPE = self.registration.scope; // напр. https://user.github.io/vetdim-clinic/

const PRECACHE = [SCOPE, `${SCOPE}manifest.webmanifest`, `${SCOPE}img/icons.svg`, `${SCOPE}img/hero.svg`, `${SCOPE}favicon.svg`];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  // Видаляємо кеші попередніх версій
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = (await cache.match(request)) || (fallbackUrl && (await caches.match(fallbackUrl)));
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SCOPE));
  } else if (url.pathname.includes('/api/') || url.pathname.includes('/data/')) {
    event.respondWith(networkFirst(request));
  } else if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
  }
});
