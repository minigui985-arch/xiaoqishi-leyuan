/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
const {chromium}=require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('node:url'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1100,height:1100},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(__dirname+'/小骑士乐园-统一主题版.html').href);
await page.evaluate(()=>{go('play');hideGuide();});await page.locator('[data-mode="battle"]').click();
await page.evaluate(()=>{for(const [from,to] of [[12,28],[52,36],[6,21],[57,42]]){recordAndMove({from,to},battle.board[from].c);}battle.turn='w';battle.thinking=false;renderBattle();renderCoach();hideGuide();});
const snapshot=await page.evaluate(()=>JSON.stringify(battle));await page.locator('#coachReview').click();await page.locator('#wholeReplay').click();
assert.equal(await page.evaluate(()=>replay.ply),0);await page.locator('#replayForward').click();assert.equal(await page.evaluate(()=>replayPosition(replay.ply).board[28].t),'p');
await page.locator('#replayLast').click();assert.equal(await page.evaluate(()=>JSON.stringify(replayPosition(replay.ply).board)),await page.evaluate(()=>JSON.stringify(battle.board)));
await page.locator('#replayFirst').click();await page.locator('#replaySpeed').selectOption('1500');await page.locator('#replayPlay').click();await page.waitForFunction(()=>replay.ply>=1);await page.locator('#replayPlay').click();
const paused=await page.evaluate(()=>replay.ply);await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>replay.ply),paused);
await page.locator('#replayPlay').click();await page.keyboard.press('Escape');const closed=await page.evaluate(()=>replay.ply);await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>replay.ply),closed);
assert.equal(await page.evaluate(()=>JSON.stringify(battle)),snapshot);
await page.locator('#coachReview').click();await page.locator('#wholeReplay').click();await page.locator('#replayPlay').click();await page.waitForFunction(()=>replay.ply===4&&!replay.playing,{timeout:15000});
await page.locator('#keyMoments').click();await page.locator('#reviewRetry').click();assert.equal(await page.evaluate(()=>review.retry&&!replay.active),true);
await page.locator('#wholeReplay').click();assert.equal(await page.evaluate(()=>replay.ply),4);await page.screenshot({path:__dirname+'/preview-march-replay.png',fullPage:true});
await page.locator('#replayFirst').click();await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#replayPlay').click();await page.waitForSelector('#reviewBoard .piece-anim');await page.locator('#replayPlay').click();assert.equal(await page.locator('#reviewBoard .piece-anim').count(),0);
await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#reviewDialog').evaluate(el=>el.scrollWidth<=el.clientWidth));await page.locator('#closeReview').click();
// Replay special moves using the same state transformer, independently of the live board.
const specials=await page.evaluate(()=>{
 const b=emptyBoard();b[4]={t:'k',c:'w'};b[7]={t:'r',c:'w'};b[60]={t:'k',c:'b'};
 replay.history=[{before:copyPosition(b,castlingState()),move:{from:4,to:6,castle:'K'},color:'w'}];const castle=replayPosition(1).board;
 const ep=emptyBoard();ep[4]={t:'k',c:'w'};ep[60]={t:'k',c:'b'};ep[36]={t:'p',c:'w'};ep[35]={t:'p',c:'b'};replay.history=[{before:copyPosition(ep,{ep:[4,3]}),move:{from:36,to:43,ep:true},color:'w'}];const taken=replayPosition(1).board;
 ep[48]={t:'p',c:'w'};replay.history=[{before:copyPosition(ep,{}),move:{from:48,to:56,promotion:'n'},color:'w'}];const promoted=replayPosition(1).board;
 return {castle:castle[6]?.t==='k'&&castle[5]?.t==='r'&&!castle[4]&&!castle[7],ep:taken[43]?.t==='p'&&!taken[35]&&!taken[36],promotion:promoted[56]?.t==='n'};
});assert.deepEqual(specials,{castle:true,ep:true,promotion:true});assert.deepEqual(errors,[]);
console.log('PASS: replay seek/step/play/pause/end/ESC, retry switch, state isolation, mobile controls and special moves.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
