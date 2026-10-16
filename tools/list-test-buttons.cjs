/* Inventory visible controls for release QA; does not submit gameplay actions. */
const {chromium}=require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {server}=require('../friend-server.cjs');
(async()=>{const app=server();await new Promise(r=>app.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto(`http://127.0.0.1:${app.address().port}`);await page.evaluate(()=>hideGuide());
 for(const view of ['home','board','pieces','moves','play']){
  await page.evaluate(view=>go(view),view);
  const modes=view==='play'?['capture','battle','local','online']:[null];
  for(const mode of modes){if(mode)await page.locator(`.play-mode[data-mode="${mode}"]`).click();
   const buttons=await page.locator(`#view-${view} button`).evaluateAll(items=>items.filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden').map(b=>({id:b.id||b.dataset.mode||b.dataset.type||b.dataset.faction||'',label:(b.getAttribute('aria-label')||b.innerText).trim().replace(/\s+/g,' ').slice(0,60)})));
   console.log(JSON.stringify({view,mode,buttons}));
  }
 }
}finally{await browser.close();app.closeAllConnections();await new Promise(r=>app.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});

