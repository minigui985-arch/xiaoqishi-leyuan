const {chromium}=require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage(),glbRequests=[],warnings=[];
  page.on('request',request=>{if(request.url().endsWith('.glb'))glbRequests.push({url:request.url(),fromServiceWorker:Boolean(request.serviceWorker())});});
  page.on('response',response=>{if(response.url().endsWith('.glb'))assert.equal(response.status(),200,response.url());});
  page.on('console',message=>{if(message.type()==='warning')warnings.push(message.text());});
  const url='http://127.0.0.1:8799/'+encodeURIComponent('小骑士乐园-统一主题版.html');
  await page.goto(url,{waitUntil:'load'});
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const versionedScript=await page.evaluate(async()=>await (await fetch('chess-3d.js?v=armies-20261026-r11')).text());
  assert.match(versionedScript,/chess-3d-scene\.mjs\?v=armies-20261123-r12/);
  await page.evaluate(()=>{go('play');hideGuide();});
  await page.locator('[data-mode="local"]').click();
  await page.evaluate(()=>hideGuide());
  await page.locator('.chess3d-tools button').first().click();
  await page.waitForSelector('.chess3d-stage canvas',{state:'visible',timeout:10_000});
  assert.equal(await page.locator('.chess3d-tools button').first().innerText(),'平面棋盘');
  assert.ok((await page.locator('.chess3d-stage canvas').boundingBox()).width>0);
  await page.waitForFunction(()=>{
   const help=document.querySelector('.chess3d-help')?.textContent||'';
   return help.includes('12/12')||help.includes('点角色与目标格');
  },undefined,{timeout:120_000});
  assert.equal(glbRequests.length,12,JSON.stringify(glbRequests));
  assert.equal(glbRequests.filter(request=>request.fromServiceWorker).length,0,JSON.stringify(glbRequests));
  assert.deepEqual(warnings.filter(text=>text.includes('Knight 3D')),[]);
  assert.equal(await page.locator('.chess3d-help').evaluate(element=>element.textContent.includes('加载失败')),false);
  await page.screenshot({path:__dirname+'/preview-3d-loading-fixed.png'});
  console.log('PASS: 3D canvas appears immediately; 12 mobile GLBs load directly, bypass Service Worker, and replace fallback pieces.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
