/* Security regression in a loopback-only API and temporary room files. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {createRoomService,server}=require('./friend-server.cjs');

(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'knight-security-'));
 const file=path.join(dir,'rooms.json');
 let api;
 try{
  let service=createRoomService(file);
  const create={action:'create',clientKey:randomUUID()};
  const seat=service.act(create);
  assert.deepEqual(service.act(create),seat);
  let state=service.act({...seat,action:'state'});
  state=service.act({...seat,action:'ready',op:'first-ready',version:state.version});
  const unchanged=fs.readFileSync(file,'utf8');
  assert.deepEqual(service.act({...seat,action:'ready',op:'another-ready',version:state.version}),state);
  assert.equal(fs.readFileSync(file,'utf8'),unchanged);

  const realNow=Date.now;
  let now=realNow();
  Date.now=()=>now;
  try{
   for(let i=0;i<300;i++){
    now+=1501;
    state=service.act({...seat,action:'signal',message:'hello',op:`signal-${i}`,version:state.version});
   }
  }finally{Date.now=realNow;}
  assert.equal(JSON.parse(fs.readFileSync(file,'utf8'))[0][1].seen.length,256);
  assert.throws(()=>service.act({...seat,action:'ready',op:'first-ready',version:1}),/已更新/);
  service=createRoomService(file);
  assert.deepEqual(service.act({...seat,action:'signal',message:'hello',op:'signal-299',version:state.version}),state);
  const legacy=JSON.parse(fs.readFileSync(file,'utf8'));
  legacy[0][1].seen=Array.from({length:300},(_,i)=>`old-${i}`);
  fs.writeFileSync(file,JSON.stringify(legacy));
  service=createRoomService(file);
  service.act({...seat,action:'resign',op:'after-legacy',version:state.version});
  assert.equal(JSON.parse(fs.readFileSync(file,'utf8'))[0][1].seen.length,256);

  api=server({apiOnly:true,roomFile:path.join(dir,'api-rooms.json'),allowedOrigins:['http://127.0.0.1']});
  await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${api.address().port}/api/friend`;
  const post=(input,forwarded)=>fetch(url,{method:'POST',headers:{Origin:'http://127.0.0.1','Content-Type':'application/json','X-Forwarded-For':forwarded},body:JSON.stringify(input)});
  const firstKey=randomUUID();
  const first=await post({action:'create',clientKey:firstKey},'198.51.100.1');
  assert.equal(first.status,200);
  const firstRoom=await first.json();
  for(let i=0;i<4;i++)assert.equal((await post({action:'create',clientKey:randomUUID()},'198.51.100.1')).status,200);
  const denied=await post({action:'create',clientKey:randomUUID()},'spoofed, 198.51.100.1');
  assert.equal(denied.status,400);
  assert.match((await denied.json()).error,/创建房间过于频繁/);
  const retry=await post({action:'create',clientKey:firstKey},'198.51.100.1');
  assert.equal(retry.status,200);
  assert.deepEqual(await retry.json(),firstRoom);
  assert.equal((await post({action:'create'},'198.51.100.2')).status,200);
  console.log('PASS: same-source quota, retry and other-source access; repeated ready no write; bounded operation IDs survive restart.');
 }finally{
  if(api){api.closeAllConnections();await new Promise(resolve=>api.close(resolve));}
  fs.rmSync(dir,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});

