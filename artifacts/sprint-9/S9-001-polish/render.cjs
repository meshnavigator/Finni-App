/* global __dirname */
const { chromium } = require('C:/tmp/node_modules/playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  for (const [name, width, height, query] of [['ordinary',390,844,''],['small',360,640,''],['large',360,640,'?large=1'],['large-stress',360,640,'?large=1&long=1']]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(pathToFileURL(path.join(__dirname, 'mockup.html')).href + query);
    await page.screenshot({ path: path.join(__dirname, 'mockup-' + name + '.png') });
    console.log(name, await page.evaluate(() => ({ height: document.querySelector('main').scrollHeight, available: innerHeight - 72 })));
    await page.close();
  }
  await browser.close();
})();
