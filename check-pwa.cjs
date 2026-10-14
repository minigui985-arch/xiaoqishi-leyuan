/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname,read=name=>fs.readFileSync(path.join(root,name),'utf8');
const manifest=JSON.parse(read('manifest.webmanifest')),html=read('小骑士乐园-统一主题版.html'),sw=read('service-worker.js'),pwa=read('pwa.js');
assert.equal(manifest.display,'standalone');assert.match(manifest.start_url,/小骑士乐园-统一主题版\.html/);
for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,icon.src)),icon.src);
for(const required of ['manifest.webmanifest','icons/icon-180.png','pwa.js'])assert.ok(html.includes(required),required+' not linked');
for(const required of ['小骑士乐园-统一主题版.html','child_w_keyed.webp','adult_b_keyed.webp','stockfish-18-lite-single.wasm','stockfish-18-lite-bundle.js','stockfish-18-lite-factory.js','i18n.js','locales/en-US.js','locales/ru-RU.js','locales/hi-IN.js'])assert.ok(sw.includes(required),required+' not cached');
assert.match(html,/viewport-fit=cover/);assert.match(html,/safe-area-inset-top/);assert.match(html,/safe-area-inset-bottom/);
for(const required of ['Safari','华为浏览器','三星浏览器','isSecureContext','appinstalled'])assert.ok(pwa.includes(required),required+' install path missing');
const {chromium}=require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {server}=require('./friend-server.cjs');
(async()=>{const app=server(),browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));try{
 const base='http://127.0.0.1:'+app.address().port,page=await browser.newPage({viewport:{width:390,height:844}});await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);assert.equal((await page.request.get(base+'/manifest.webmanifest')).headers()['content-type'],'application/manifest+json');assert.equal(await page.locator('#installKnightApp').isVisible(),true);
 await page.context().setOffline(true);await page.reload({waitUntil:'domcontentloaded'});assert.match(await page.title(),/小骑士乐园|Little Knight/);assert.equal(await page.locator('link[rel="apple-touch-icon"]').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(await page.evaluate(()=>Promise.all(['assets/child_w_keyed.webp','assets/child_b_keyed.webp','assets/adult_w_keyed.webp','assets/adult_b_keyed.webp'].map(async url=>(await fetch(url)).ok))),[true,true,true,true]);assert.equal(await page.evaluate(()=>KnightStockfish.ready().then(()=>true).catch(error=>error.message)),true);await page.evaluate(()=>KnightStockfish.shutdown());
 await page.context().setOffline(false);for(const [name,userAgent,expected] of [
  ['iPhone','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1','Safari'],
  ['Huawei','Mozilla/5.0 (Linux; Android 14; HUAWEI P60) AppleWebKit/537.36 Mobile Safari/537.36','Huawei|华为浏览器'],
  ['Samsung','Mozilla/5.0 (Linux; Android 14; SM-S9280) AppleWebKit/537.36 SamsungBrowser/27.0 Mobile Safari/537.36','Samsung|三星浏览器']]){
   const context=await browser.newContext({viewport:{width:390,height:844},userAgent}),mobile=await context.newPage();await mobile.goto(base);await mobile.locator('#installKnightApp').click();assert.match(await mobile.locator('.install-dialog p').innerText(),new RegExp(expected),name);await context.close();
  }
 const nativeContext=await browser.newContext({viewport:{width:390,height:844}});await nativeContext.addInitScript(()=>{window.Capacitor={isNativePlatform:()=>true}});const nativePage=await nativeContext.newPage();await nativePage.goto(base);assert.equal(await nativePage.locator('#installKnightApp').count(),0);assert.equal(await nativePage.evaluate(()=>navigator.serviceWorker.controller),null);await nativeContext.close();
 console.log('PASS: PWA manifest, icons, safe areas, service worker, offline reload, iPhone/Huawei/Samsung install guidance.');
}finally{await browser.close();app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}})().catch(error=>{console.error(error);process.exitCode=1;});
