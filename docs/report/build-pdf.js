// Генерація docs/report.pdf з report.html (A4, поля 30/15/20/20 мм, нумерація сторінок)
// Запуск: cd e2e && npm install && node ../docs/report/build-pdf.js
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require(require.resolve('puppeteer-core', { paths: [path.join(__dirname, '..', '..', 'e2e')] }));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(__dirname, 'report.html')).href, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: path.join(__dirname, '..', 'report.pdf'),
    format: 'A4',
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate:
      '<div style="width:100%;font-family:Times New Roman;font-size:11pt;text-align:right;padding-right:15mm"><span class="pageNumber"></span></div>',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '30mm' },
  });
  await browser.close();
  console.log('docs/report.pdf створено');
})();
