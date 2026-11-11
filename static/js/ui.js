// Спільна поведінка для всіх сторінок: тема, бургер-меню, хедер

export function initTheme() {
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  const root = document.documentElement;
  const update = () => {
    const dark = root.dataset.theme === 'dark';
    btn.setAttribute('aria-label', dark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему');
  };
  update();
  btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', root.dataset.theme);
    update();
  });
}

export function initBurger() {
  const burger = document.querySelector('.burger');
  const header = document.querySelector('.site-header');
  if (!burger || !header) return;

  const setOpen = (open) => {
    header.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  };

  burger.addEventListener('click', () => setOpen(!header.classList.contains('nav-open')));

  // Закриваємо меню клавішею Escape, кліком по посиланню або поза меню
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('nav-open')) {
      setOpen(false);
      burger.focus();
    }
  });
  header.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) setOpen(false);
  });
  // При переході на планшет/десктоп меню має бути закрите
  matchMedia('(min-width: 768px)').addEventListener('change', () => setOpen(false));
}

export function initHeaderShadow() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
