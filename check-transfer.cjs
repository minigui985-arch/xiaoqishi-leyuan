/* 验证网页 App 到原生容器的离线存档迁移；不会访问真实用户存档。 */
const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {server}=require('./friend-server.cjs');
(async()=>{
 const app=server(),browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 try{
  const url='http://127.0.0.1:'+app.address().port;
  const source=await browser.newPage({viewport:{width:390,height:844}});await source.goto(url);
  await source.evaluate(()=>{
   S.stars=7;S.wins=2;S.lessons.board=true;save();
   const board=setupBoard(),cast=castlingState(),move=allLegalMoves(board,'w',cast).find(m=>m.from===name2idx('e2')&&m.to===name2idx('e4'));
   battle.board=board;battle.history=[{move}];battle.human=false;battle.over=false;saveBattle();
   localStorage.setItem('friendSeat',JSON.stringify({token:'must-not-export'}));
  });
  await source.getByRole('button',{name:'迁移存档'}).click();await source.locator('#saveExport').click();
  const exported=await source.locator('#saveText').inputValue(),parsed=JSON.parse(exported);
  assert.equal(parsed.progress.stars,7);assert.equal(parsed.battle.moves.length,1);assert.ok(!exported.includes('must-not-export'));
  const nativeContext=await browser.newContext({viewport:{width:390,height:844}});
  await nativeContext.addInitScript(()=>{window.Capacitor={isNativePlatform:()=>true}});
  const target=await nativeContext.newPage();await target.goto(url);
  await target.evaluate(()=>{S.stars=1;save()});await target.getByRole('button',{name:'迁移存档'}).click();await target.locator('#saveText').fill(exported);
  target.once('dialog',dialog=>dialog.accept());await Promise.all([target.waitForEvent('load'),target.locator('#saveImport').click()]);
  const result=await target.evaluate(()=>({progress:JSON.parse(localStorage.getItem('chessknight_save_v1')),battle:JSON.parse(localStorage.getItem('knightBattleV1')),friend:localStorage.getItem('friendSeat')}));
  assert.equal(result.progress.stars,7);assert.equal(result.progress.lessons.board,true);assert.equal(result.battle.moves.length,1);assert.equal(result.friend,null);
  await target.getByRole('button',{name:'迁移存档'}).click();parsed.battle.moves[0].from=99;await target.locator('#saveText').fill(JSON.stringify(parsed));await target.locator('#saveImport').click();
  assert.match(await target.locator('#saveStatus').innerText(),/导入失败/);assert.equal(await target.evaluate(()=>JSON.parse(localStorage.getItem('knightBattleV1')).moves[0].from),nameToIndex('e2'));
  await source.close();await nativeContext.close();console.log('PASS: 网页到原生容器迁移、合法棋谱校验、房间令牌排除及损坏数据拒绝。');
 }finally{await browser.close();app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
function nameToIndex(name){return (Number(name[1])-1)*8+'abcdefgh'.indexOf(name[0])}

