/* global __dirname */
const { chromium } = require('C:/tmp/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const results = [];
  for (const [width, height] of [[360,640],[390,844],[412,915]]) {
    for (const scale of [1,1.5,2]) {
      for (const scenario of ['ACTIVE','READY','DRAFT','CLOSED','WAITING','empty','long','long-WAITING','long-CLOSED']) {
        const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
        const url = pathToFileURL(path.join(__dirname,'home-layout.html'));
        url.search = new URLSearchParams({scale:String(scale),state:scenario,...(scenario==='empty'?{empty:'1',state:'ACTIVE'}:scenario.startsWith('long')?{long:'1',state:scenario.split('-')[1]||'ACTIVE'}:{})}).toString();
        await page.goto(url.href);
        await page.evaluate(()=>new Promise(requestAnimationFrame));
        const measurements = await page.evaluate(() => {
          const box = (selector) => { const b=document.querySelector(selector).getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom};};
          const smallTargets = [...document.querySelectorAll('button')].filter(e=>e.getClientRects().length && (e.getBoundingClientRect().width<48||e.getBoundingClientRect().height<48)).map(e=>e.textContent);
          return {home:box('.home'),pet:box('.pet'),footer:box('.footer'),summary:box('.surface'),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,smallTargets,simultaneous:document.querySelector('.home').getBoundingClientRect().bottom<=innerHeight-24};
        });
        const id = `${width}x${height}-${scale}-${scenario}`;
        await page.screenshot({path:path.join(__dirname,`${id}.png`),fullPage:true});
        results.push({id,...measurements});await page.close();
      }
    }
  }
  fs.writeFileSync(path.join(__dirname,'measurements.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results.filter(r=>r.id.startsWith('360x640')&&(/ACTIVE|long/.test(r.id))),null,2));
  await browser.close();
})();
