/* Repeated local UI actions; no public service traffic. */
const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {server}=require('./friend-server.cjs');
(async()=>{const app=server();await new Promise(r=>app.listen(0,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${app.address().port}`);await page.evaluate(()=>hideGuide());
 const views=['home','board','pieces','moves','play'];
 for(let i=0;i<100;i++){
  const view=views[i%views.length];
  await page.locator(`.nav-item[data-view="${view}"]`).evaluate(button=>button.click());
  assert.equal(await page.evaluate(()=>currentView),view);
 }
 for(let i=0;i<20;i++){
  await page.getByRole('button',{name:'使用反馈'}).filter({visible:true}).first().evaluate(button=>button.click());
  assert.equal(await page.locator('#feedbackDialog').evaluate(d=>d.open),true);
  await page.locator('#feedbackClose').evaluate(button=>button.click());
  assert.equal(await page.locator('#feedbackDialog').evaluate(d=>d.open),false);
 }
 const locales=['en-US','zh-CN','ja-JP','fr-FR','de-DE'];
 for(let i=0;i<20;i++){const locale=locales[i%locales.length];await page.locator('#languageSelect').selectOption(locale);assert.equal(await page.locator('#languageSelect').inputValue(),locale);}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 console.log('PASS: 100 rapid navigation clicks, 20 feedback open/close cycles, 20 language switches; no page errors or mobile horizontal overflow.');
}finally{if(browser)await browser.close();app.closeAllConnections();await new Promise(r=>app.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});

