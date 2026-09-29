/* global __dirname */
const { chromium } = require('C:/tmp/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const icons = {
  home: '<path d="M4 14 16 4l12 10M7 12v16h7v-9h5v9h6V12"/>',
  plan: '<rect x="6" y="7" width="21" height="22" rx="4"/><path d="M11 4v6m11-6v6M7 14h19m-15 5h3m5 0h3m-11 5h3m5 0h3"/>',
  shop: '<path d="M7 11h19l2 17H5zM11 12V8a5 5 0 0 1 10 0v4"/>',
  savings: '<path d="M5 13 8 8h17l3 5v14H5zM5 16h23M14 16v5h5v-5M10 8V6h12v2"/>',
  progress: '<path d="m16 3 4 9 10 1-8 7 2 10-8-5-9 5 2-10-7-7 10-1z"/>',
  adult: '<circle cx="16" cy="10" r="5"/><path d="M6 28v-4a10 10 0 0 1 20 0v4"/>',
  help: '<circle cx="16" cy="16" r="13"/><path d="M12 11c0-5 10-5 9 1-.5 3-5 3-5 7m0 5v.1"/>',
};
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const dir=path.resolve(__dirname,'../../../assets/ui/home');fs.mkdirSync(dir,{recursive:true});
const page=await browser.newPage({viewport:{width:96,height:96},deviceScaleFactor:1});
for(const [name,paths]of Object.entries(icons)){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 32 32" fill="none" stroke="#79563c" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;fs.writeFileSync(path.join(dir,name+'.svg'),svg);await page.setContent('<style>body{margin:0;background:transparent}</style>'+svg);await page.screenshot({path:path.join(dir,name+'.png'),omitBackground:true});}
await page.close();
for(const [name,w,h,query]of [['ordinary',390,844,''],['large',360,640,'?large=1'],['large-stress',360,640,'?large=1&long=1']]){const p=await browser.newPage({viewport:{width:w,height:h}});await p.goto(pathToFileURL(path.join(__dirname,'mockup.html')).href+query);await p.screenshot({path:path.join(__dirname,'mockup-'+name+'.png')});console.log(name,await p.evaluate(()=>({height:document.querySelector('main').scrollHeight,available:innerHeight-72})));await p.close();}await browser.close();
})();
