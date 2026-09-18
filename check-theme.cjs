/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
const {chromium}=require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.message)});
 await page.goto(pathToFileURL(path.join(__dirname,'小骑士乐园-统一主题版.html')).href);
 await page.waitForFunction(()=>document.querySelector('#worldTitle').textContent.length>0);
 await page.evaluate(()=>{hideGuide();document.querySelector('#toast').classList.remove('show');});
 assert.equal(await page.locator('html').getAttribute('data-theme'),'child');
 assert.doesNotMatch(await page.locator('body').innerText(),/明朝|✚|印/);
 assert.equal(await page.locator('#spriteChroma').count(),1);
 assert.match(await page.locator('#westHero image').getAttribute('href'),/child_w_keyed.png/);
 await page.screenshot({path:path.join(__dirname,'preview-child.png'),fullPage:true});
 await page.locator('#skinBtn').click();
 assert.equal(await page.locator('html').getAttribute('data-theme'),'adult');
 await page.evaluate(()=>{hideGuide();document.querySelector('#toast').classList.remove('show');});
 await page.screenshot({path:path.join(__dirname,'preview-adult.png'),fullPage:true});
 await page.locator('[data-realm="b"]').click();
 assert.equal(await page.locator('button[data-faction="b"]').getAttribute('aria-pressed'),'true');
 assert.doesNotMatch(await page.locator('.faction-tabs').innerText(),/[+＋✚印]/);
 assert.match(await page.locator('#pieceDetail').innerText(),/明军火铳手/);
 await page.locator('#openConcept').click();
 assert.match(await page.locator('#conceptImage').getAttribute('href'),/adult_b_keyed.png/);
 await page.locator('#closeConcept').click();
 await page.evaluate(()=>{go('play');hideGuide();});
 await page.locator('[data-mode="battle"]').click();
 await page.evaluate(()=>{hideGuide();S.stars=7;S.lessons.board=true;save();});
 const before=await page.evaluate(()=>JSON.stringify({battle,S}));
 await page.locator('#skinBtn').click();
 assert.equal(await page.evaluate(()=>JSON.stringify({battle,S})),before,'skin switching preserves all game and learning state');
 // Also preserve pending AI turn and selected-square state.
 await page.evaluate(()=>{battle.selected=12;battle.turn='b';battle.thinking=true;});
 const pending=await page.evaluate(()=>JSON.stringify(battle));
 await page.locator('#skinBtn').click();
 assert.equal(await page.evaluate(()=>JSON.stringify(battle)),pending);
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{battle.turn='w';battle.thinking=false;renderBattle();hideGuide();document.querySelector('#toast').classList.remove('show');});
 await page.locator('#skinBtn').click();
 await page.evaluate(()=>document.querySelector('#toast').classList.remove('show'));
 await page.screenshot({path:path.join(__dirname,'preview-board-no-background.png'),fullPage:true});
 await page.locator('#skinBtn').click();
 await page.evaluate(()=>document.querySelector('#toast').classList.remove('show'));
 assert.equal(await page.locator('#playBoardWrap .sq').first().getAttribute('data-idx'),'56');
 assert.match(await page.locator('#playBoardWrap [data-idx="0"]').getAttribute('class'),/dark/);
 await page.screenshot({path:path.join(__dirname,'preview-battle-mobile.png'),fullPage:true});
 for(const view of ['home','board','pieces','moves','play','board','pieces']){
  await page.evaluate(v=>{go(v);hideGuide();},view);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),view+' should fit mobile width');
 }
 await page.evaluate(()=>{go('home');hideGuide();document.querySelector('#toast').classList.remove('show');});
 await page.screenshot({path:path.join(__dirname,'preview-home-mobile.png'),fullPage:true});
 await page.reload();
 assert.equal(await page.locator('html').getAttribute('data-theme'),'adult');
 assert.equal(await page.evaluate(()=>S.stars),7);
 assert.deepEqual(errors,[]);
 console.log('PASS: five mobile views, both themes, local art loading, faction selection, dialog, saved preference, learning and battle state preservation; no page errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});



