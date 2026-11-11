const puppeteer = require('puppeteer-core');
const B = process.env.BASE_URL || 'http://localhost:4173';
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const ok = (name, cond, extra = '') => console.log(cond ? 'PASS' : 'FAIL', name, extra);
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  let p = await b.newPage();
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  // 3. Burger
  await p.setViewport({ width: 360, height: 760, isMobile: true, hasTouch: true });
  await p.goto(B + '/', { waitUntil: 'networkidle0' });
  await p.click('.burger'); await wait(300);
  const open = await p.$eval('.burger', e => e.getAttribute('aria-expanded'));
  const navVisible = await p.$eval('.nav', e => getComputedStyle(e).visibility);
  await p.keyboard.press('Escape'); await wait(300);
  const closed = await p.$eval('.burger', e => e.getAttribute('aria-expanded'));
  const focusBurger = await p.evaluate(() => document.activeElement.classList.contains('burger'));
  ok('burger open/escape', open === 'true' && navVisible === 'visible' && closed === 'false' && focusBurger);
  await p.click('.burger'); await wait(200); await p.click('.nav a[href$="/services"]'); await wait(500);
  ok('burger closes on navigation', (await p.$eval('.burger', e => e.getAttribute('aria-expanded'))) === 'false' && p.url().endsWith('/services'));
  // 4. Theme
  await p.setViewport({ width: 1280, height: 800 });
  await p.goto(B + '/', { waitUntil: 'networkidle0' });
  const t1 = await p.evaluate(() => document.documentElement.dataset.theme);
  await p.click('.theme-toggle'); await wait(200);
  await p.reload({ waitUntil: 'networkidle0' });
  const t2 = await p.evaluate(() => document.documentElement.dataset.theme);
  ok('theme toggle persists', t1 !== t2, `${t1} -> ${t2}`);
  await p.click('.theme-toggle');
  // 6. Search
  await p.goto(B + '/doctors', { waitUntil: 'networkidle0' });
  await p.type('#doctor-search', 'олена'); await wait(400);
  const n = await p.$$eval('.doctor-card', e => e.length);
  const cnt = await p.$eval('.results-count', e => e.textContent);
  ok('search', n === 1 && cnt.includes('1'), cnt);
  // 8. 404 doctor
  await p.goto(B + '/doctors/999', { waitUntil: 'networkidle0' });
  ok('doctor 404', (await p.$eval('h1', e => e.textContent)) === 'Лікаря не знайдено');
  // 19. Contacts
  await p.goto(B + '/contacts', { waitUntil: 'networkidle0' });
  await p.click('.contact-form button[type=submit]'); await wait(200);
  const errs = await p.$$eval('.contact-form .field__error', e => e.map(x => x.textContent).filter(Boolean).length);
  const focused = await p.evaluate(() => document.activeElement.id);
  await p.type('#name', 'Олена'); await p.type('#email', 'olena@example.com'); await p.type('#message', 'Скільки коштує УЗД для собаки?');
  await p.click('.contact-form button[type=submit]'); await wait(600);
  const sent = await p.$('.contact-form .alert--success');
  ok('contacts validation + success', errs === 3 && focused === 'name' && !!sent);
  // 21. API down
  const p2 = await b.newPage();
  await p2.setRequestInterception(true);
  p2.on('request', r => r.url().includes('/api/') ? r.abort() : r.continue());
  await p2.goto(B + '/doctors', { waitUntil: 'networkidle0' });
  const errText = await p2.$eval('.empty', e => e.innerText).catch(() => '');
  const retry = await p2.$('.empty button');
  ok('API down shows error + retry', errText.includes("з'єднання") && !!retry, JSON.stringify(errText.slice(0, 60)));
  // 22. Keyboard
  await p.goto(B + '/', { waitUntil: 'networkidle0' });
  await p.keyboard.press('Tab');
  const first = await p.evaluate(() => document.activeElement.className);
  await p.keyboard.press('Enter'); await wait(200);
  const afterSkip = await p.evaluate(() => document.activeElement.id);
  const seq = [];
  for (let i = 0; i < 8; i++) { await p.keyboard.press('Tab'); seq.push(await p.evaluate(() => { const e = document.activeElement; return e.tagName + ':' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 18) + ':' + getComputedStyle(e).outlineStyle; })); }
  ok('keyboard skip-link', first === 'skip-link' && afterSkip === 'main', afterSkip);
  console.log('   tab order after skip:', seq.join(' | '));
  // booking via keyboard: select radio with Space
  await p.goto(B + '/booking', { waitUntil: 'networkidle0' });
  await p.focus('input[name=serviceId]'); await p.keyboard.press('Space'); await wait(100);
  ok('radio via keyboard', await p.$eval('input[name=serviceId]', e => e.checked));
  await b.close();
})();
