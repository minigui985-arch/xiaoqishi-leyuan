// Run in ego-browser nodejs after opening the local preview in the named task space.
import assert from 'node:assert/strict';
const task=await taskSpace('knight-3d-implementation-20261022'),page=task.page('p1');
await page.evaluate(()=>{window._before3dTest=JSON.parse(JSON.stringify(battle));battle.human=true;initBattle();hideGuide();});
try{
 await page.waitForSelector('#playBoardWrap canvas');
 await page.focus('#playBoardWrap canvas');
 await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>battle.selected),12,'keyboard selects e2');
 await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>battle.board[28]?.c),'w','keyboard moves e2-e4');
 await page.click('.chess3d-tools[data-board="playBoardWrap"] [data-camera="reset"]');
 async function clickSquare(index){
  const point=await page.evaluate(async i=>{
   const T=await import('/vendor/three/three.module.js'),canvas=document.querySelector('#playBoardWrap canvas'),r=canvas.getBoundingClientRect(),camera=new T.PerspectiveCamera(40,r.width/r.height,.1,80);
   camera.position.set(0,Math.sin(.85)*14.8,Math.cos(.85)*14.8);camera.lookAt(0,.1,0);camera.updateMatrixWorld();
   const p=new T.Vector3(i%8-3.5,.12,3.5-Math.floor(i/8)).project(camera);return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2};
  },index);await page.mouse.click(point.x,point.y);
 }
 await clickSquare(52);assert.equal(await page.evaluate(()=>battle.selected),52,'ray selects black e7');
 await clickSquare(36);assert.equal(await page.evaluate(()=>battle.board[36]?.c),'b','ray moves e7-e5');
 const saved=await page.evaluate(()=>JSON.stringify(battle));
 await page.click('#coachReview');await page.click('#wholeReplay');
 await page.click('.chess3d-tools[data-board="reviewBoard"]>button:first-child');await page.waitForSelector('#reviewBoard canvas');
 await page.click('#replayForward');assert.equal(await page.evaluate(()=>replay.ply),1);
 await page.click('#replayLast');assert.equal(await page.evaluate(()=>replay.ply),2);
 await page.click('#replayFirst');await page.click('#replayPlay');
 await page.waitForFunction(()=>replay.ply>=1);await page.click('#replayPlay');
 const paused=await page.evaluate(()=>replay.ply);await page.waitForTimeout(500);
 assert.equal(await page.evaluate(()=>replay.ply),paused,'pause freezes replay');
 await page.click('#closeReview');assert.equal(await page.evaluate(()=>JSON.stringify(battle)),saved,'replay does not change live board');
 console.log('PASS: 3D keyboard and ray-picked moves, replay step/seek/play/pause and state isolation.');
}finally{
 await page.evaluate(()=>{pauseReplay();document.querySelector('#reviewDialog')?.close();Object.assign(battle,window._before3dTest);delete window._before3dTest;renderBattle();renderCoach();});
}
