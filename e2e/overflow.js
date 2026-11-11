const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const p = await b.newPage();
  for (const w of [360, 768, 1280]) {
    const res = [];
    for (const path of ['/', '/doctors', '/doctors/3', '/services', '/booking', '/contacts', '/xyz']) {
      await p.setViewport({ width: w, height: 800, isMobile: w < 768, hasTouch: w < 768 });
      await p.goto((process.env.BASE_URL || 'http://localhost:4173') + path, { waitUntil: 'networkidle0' });
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      res.push(`${path}:${sw > w ? 'OVERFLOW ' + sw : 'ok'}`);
    }
    console.log(w, res.join('  '));
  }
  await b.close();
})();
