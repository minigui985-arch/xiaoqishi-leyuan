/* 检查独立棋局接口跨来源、来源白名单、持久化及手机页面开关。 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {server}=require('./friend-server.cjs');
fs.mkdirSync(path.join(__dirname,'dist'),{recursive:true});
const temp=fs.mkdtempSync(path.join(__dirname,'dist','friend-api-test-'));
if(!path.resolve(temp).startsWith(path.resolve(__dirname,'dist')+path.sep))throw Error('测试目录超出工作区');
const roomFile=path.join(temp,'rooms.json');
const listen=app=>new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
const close=app=>new Promise(resolve=>app.close(resolve));
(async()=>{
 let web,api,browser;
 try{
  web=server();await listen(web);const origin='http://127.0.0.1:'+web.address().port;
  api=server({apiOnly:true,roomFile,allowedOrigins:[origin]});await listen(api);const base='http://127.0.0.1:'+api.address().port;
  const preflight=await fetch(base+'/api/friend',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
  const denied=await fetch(base+'/api/friend',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:JSON.stringify({action:'create'})});
  assert.equal(denied.status,400);assert.equal(denied.headers.get('access-control-allow-origin'),null);
  assert.equal((await fetch(base+'/friend-client.js')).status,400);
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const hostContext=await browser.newContext({viewport:{width:390,height:844}}),guestContext=await browser.newContext({viewport:{width:390,height:844}});
  for(const context of [hostContext,guestContext])await context.addInitScript(url=>{window.KNIGHT_FRIEND_API_URL=url},base);
  const host=await hostContext.newPage();await host.goto(origin);await host.evaluate(()=>{go('play');hideGuide()});
  await host.locator('#friendCreate').waitFor({state:'visible'});await host.locator('#friendCreate').click();
  await host.waitForFunction(()=>document.querySelector('#friendStatus').textContent.includes('等待好友加入'));
  const invitation=await host.locator('#friendCode').inputValue();assert.match(invitation,/^[A-F0-9]{12}-[A-Z2-9]{10}$/);
  assert.ok(fs.existsSync(roomFile));
  const guest=await guestContext.newPage();await guest.goto(origin+'/?invite='+invitation+'#play');await guest.locator('#friendJoin').waitFor({state:'visible'});await guest.locator('#friendJoin').click();
  await guest.waitForFunction(()=>!document.querySelector('#friendReady').hidden);
  await host.waitForTimeout(2200);await host.locator('#friendReady').click();await guest.waitForTimeout(2200);await guest.locator('#friendReady').click();
  await host.waitForFunction(()=>document.querySelector('#friendStatus').textContent.includes('轮到你'));
  await host.locator('#friendBoard [data-idx="12"]').click();await host.locator('#friendBoard [data-idx="28"]').click();
  await guest.waitForFunction(()=>document.querySelector('#friendBoard [data-idx="28"] .piece'));
  const room=JSON.parse(fs.readFileSync(roomFile,'utf8'))[0][1];assert.equal(room.history.length,1);
  await browser.close();browser=null;await close(api);api=null;
  api=server({apiOnly:true,roomFile,allowedOrigins:[origin]});await listen(api);
  assert.equal((await fetch('http://127.0.0.1:'+api.address().port+'/api/friend',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'state',id:room.id,token:room.seats.w})})).status,200);
  const roomUrl='http://127.0.0.1:'+api.address().port+'/api/friend';
  const stateBody=JSON.stringify({action:'state',id:room.id,token:room.seats.w});
  for(let i=0;i<180;i++)assert.equal((await fetch(roomUrl,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Forwarded-For':'spoofed, 198.51.100.10'},body:stateBody})).status,200);
  const limited=await fetch(roomUrl,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Forwarded-For':'spoofed, 198.51.100.10'},body:stateBody});
  assert.equal(limited.status,400);assert.match((await limited.json()).error,/频繁/);
  assert.equal((await fetch(roomUrl,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Forwarded-For':'spoofed, 198.51.100.11'},body:stateBody})).status,200);
  console.log('PASS: 独立 API 来源限制、跨来源双人对弈、棋局持久化与重启恢复。');
 }finally{if(browser)await browser.close();if(api)await close(api);if(web)await close(web);fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
