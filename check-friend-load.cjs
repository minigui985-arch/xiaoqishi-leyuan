/* Isolated local load test. Never point this at a public server. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {performance}=require('node:perf_hooks');
const {server}=require('./friend-server.cjs');

(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'knight-friend-load-'));
 const app=server({apiOnly:true,roomFile:path.join(dir,'rooms.json'),allowedOrigins:['http://127.0.0.1']});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${app.address().port}/api/friend`;
 const times=[];
 async function call(input,seat){
  const started=performance.now();
  const response=await fetch(url,{method:'POST',headers:{Origin:'http://127.0.0.1','Content-Type':'application/json','X-Forwarded-For':`198.51.100.${seat}`},body:JSON.stringify(input)});
  times.push(performance.now()-started);
  return {status:response.status,data:await response.json()};
 }
 try{
  const rooms=await Promise.all(Array.from({length:20},(_,i)=>call({action:'create',color:'w'},i+1)));
  rooms.forEach(r=>assert.equal(r.status,200));
  const games=await Promise.all(rooms.map(async({data:w},i)=>{
   const guest=await call({action:'join',id:w.id,inviteCode:w.inviteCode},i+1);assert.equal(guest.status,200);
   const b=guest.data;let state=(await call({...w,action:'state'},i+1)).data;
   state=(await call({...w,action:'ready',version:state.version,op:`ready-w-${i}`},i+1)).data;
   state=(await call({...b,action:'ready',version:state.version,op:`ready-b-${i}`},i+1)).data;
   const move={...w,action:'move',version:state.version,op:`move-${i}`,from:12,to:28};
   const repeated=await Promise.all(Array.from({length:4},()=>call(move,i+1)));
   repeated.forEach(r=>{assert.equal(r.status,200);assert.equal(r.data.history.length,1)});
   const final=await call({...b,action:'state'},i+1);assert.equal(final.data.history.length,1);
   assert.equal((await call({...b,action:'move',version:state.version,op:`stale-${i}`,from:52,to:36},i+1)).status,400);
   return w.id;
  }));
  assert.equal(new Set(games).size,20);
  const extra=await Promise.all(Array.from({length:10},(_,i)=>call({action:'create'},i+21)));
  extra.forEach(r=>assert.equal(r.status,200));
  const overflow=await call({action:'create'},31);
  assert.equal(overflow.status,400);
  assert.match(overflow.data.error,/房间已满/);
  const health=await fetch(url+'/health');assert.equal(health.status,200);
  times.sort((a,b)=>a-b);
  console.log(`PASS: 20 concurrent games / 40 seats, ${times.length} HTTP requests; duplicate move, stale version and 30-room capacity guard; p95=${times[Math.ceil(times.length*.95)-1].toFixed(1)}ms, max=${times.at(-1).toFixed(1)}ms (local machine only).`);
 }finally{app.closeAllConnections();await new Promise(resolve=>app.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});

