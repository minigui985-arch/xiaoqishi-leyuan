const {chromium}=require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const {pathToFileURL}=require('node:url');const path=require('node:path');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:1400,height:1000},reducedMotion:'reduce'}), errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.join(__dirname,'小骑士乐园-统一主题版.html')).href);
const hide=()=>page.evaluate(()=>{hideGuide();$('#toast').classList.remove('show');});
const nav=async name=>{await page.locator('.nav-item[data-view="'+name+'"]').click();await hide();};
const cell=async(w,i)=>{await hide();await page.locator(w+' [data-idx="'+i+'"]').click();};
await nav('board');
await page.evaluate(()=>{boardLesson.quiz={kind:'color',color:false,text:'点一个黑格'};renderBoardQuizUI();});
await cell('#view-board .board-wrap',1);assert.equal(await page.evaluate(()=>boardLesson.solved),0);
await cell('#view-board .board-wrap',0);assert.equal(await page.evaluate(()=>boardLesson.solved),1);
await page.evaluate(()=>{boardLesson.quiz={kind:'find',target:0,text:'找到格子 a1'};renderBoardQuizUI();});
await cell('#view-board .board-wrap',0);assert.equal(await page.evaluate(()=>boardLesson.solved),2);
await nav('home');await nav('board');assert.equal(await page.evaluate(()=>boardLesson.solved),2);
for(let n=2;n<5;n++){const idx=await page.evaluate(()=>{const q=boardLesson.quiz;return q.kind==='find'?q.target:q.color?1:0;});await cell('#view-board .board-wrap',idx);assert.equal(await page.evaluate(()=>boardLesson.solved),n+1);}
assert.equal(await page.locator('#boardQuizDots .ok').count(),5);const stars=await page.evaluate(()=>S.stars);await hide();await page.locator('#boardRetry').click();
for(let n=0;n<5;n++){const idx=await page.evaluate(()=>{const q=boardLesson.quiz;return q.kind==='find'?q.target:q.color?1:0;});await cell('#view-board .board-wrap',idx);}
assert.equal(await page.evaluate(()=>S.stars),stars);await hide();await page.locator('#boardNext').click();await hide();
for(let n=0;n<3;n++){const targets=await page.evaluate(()=>piecesLesson.find.board.flatMap((p,i)=>p?.t===piecesLesson.find.type&&p.c===piecesLesson.find.color?[i]:[]));for(const i of targets)await cell('#findQuiz .board-wrap',i);assert.equal(await page.evaluate(()=>piecesLesson.solved),n+1);}
assert.equal(await page.locator('#findQuizDots .ok').count(),3);await hide();await page.locator('#piecesNext').click();await hide();
// Cancelling demonstration cannot mutate a later exercise.
await page.locator('#mvDemo').click();await page.locator('.move-tab[data-type="n"]').click();const state=await page.evaluate(()=>JSON.stringify(movesLesson.board));await page.waitForTimeout(1700);assert.equal(await page.evaluate(()=>JSON.stringify(movesLesson.board)),state);
for(const type of ['p','r','n','b','q','k']){
 await page.locator('.move-tab[data-type="'+type+'"]').click();
 for(let n=0;n<5;n++){
  const task=await page.evaluate(()=>({from:movesLesson.pos,to:movesLesson.task.to}));await cell('#mvBoardWrap',task.from);await cell('#mvBoardWrap',task.to);assert.match(await page.locator('#mvStep').innerText(),/走对了/);await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(t=>movesLesson.progress[t],type),n+1);
  if(n===2){await nav('home');await nav('moves');assert.equal(await page.evaluate(()=>movesLesson.taskDone),3);}
 }
 assert.match(await page.locator('#mvStep').innerText(),/5 \/ 5/);
 if(type!=='k')assert.equal(await page.evaluate(()=>S.lessons.moves),false);
 console.log(type+': 5/5 passed');
}
assert.equal(await page.evaluate(()=>S.lessons.moves),true);await hide();await page.locator('#mvNext').click();assert.equal(await page.evaluate(()=>currentView),'play');
assert.deepEqual(errors,[]);console.log('PASS board 5/5 + repeat; pieces 3/3; all six movement groups 30/30; navigation, cancelled demo, reward and next-course buttons');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

