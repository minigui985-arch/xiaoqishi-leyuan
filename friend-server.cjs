/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
// Local integration server only. Do not expose this prototype to the Internet.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {saveFeedback}=require('./feedback-store.cjs');
require('./data-paths.cjs').ensureDataDirs();
const html=fs.readFileSync(path.join(__dirname,'小骑士乐园-统一主题版.html'),'utf8');
const ctx=vm.createContext({});vm.runInContext(html.slice(html.indexOf('function emptyBoard()'),html.indexOf('function aiPickMove(')),ctx);
const engine=vm.runInContext('({setupBoard,castlingState,allLegalMoves,applyMove,inCheck})',ctx);
const learning=fs.readFileSync(path.join(__dirname,'learning.js'),'utf8');vm.runInContext(learning.slice(learning.indexOf('function positionKey('),learning.indexOf('function recordAndMove(')),ctx);
Object.assign(engine,vm.runInContext('({positionKey,simpleDeadPosition})',ctx));
const token=()=>crypto.randomBytes(24).toString('hex');
function fail(message){throw new Error(message);}
function createRoomService(file){
 const encode=rooms=>JSON.stringify([...rooms],(k,v)=>v instanceof Set?[...v]:v);
 const decode=text=>new Map(JSON.parse(text).map(([id,r])=>[id,{...r,seen:new Set(r.seen)}]));
 let rooms=file&&fs.existsSync(file)?decode(fs.readFileSync(file,'utf8')):new Map();
 function apply(input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('请求格式错误');
 for(const [id,r] of rooms)if(Date.now()-r.created>86400000)rooms.delete(id);
 if(['create','join'].includes(input.action)&&input.clientKey&&!/^[a-f0-9-]{36}$/i.test(input.clientKey))fail('请求身份格式错误');
 if(input.action==='create'){
  if(input.clientKey)for(const r of rooms.values())if(r.keys?.[r.host]===input.clientKey)return {id:r.id,token:r.seats[r.host],color:r.host};
  if(rooms.size>=30)fail('测试房间已满，请稍后再试');
  const id=crypto.randomBytes(6).toString('hex').toUpperCase(),secret=token();
  const board=engine.setupBoard(),cast=engine.castlingState();
  const host=input.color==='b'?'b':input.color==='random'?(crypto.randomInt(2)?'b':'w'):'w';
  rooms.set(id,{id,host,keys:{[host]:input.clientKey},created:Date.now(),board,cast,turn:'w',version:0,seats:{w:null,b:null,[host]:secret},ready:{w:false,b:false},history:[],positions:[engine.positionKey(board,'w',cast)],result:null,seen:new Set()});
  return {id,token:secret,color:host};
 }
 const r=rooms.get(String(input.id).toUpperCase());if(!r)fail('房间不存在或已过期');
 if(input.action==='join'){
  if(input.clientKey)for(const c of ['w','b'])if(r.keys?.[c]===input.clientKey)return {id:r.id,token:r.seats[c],color:c};
  const guest=r.host==='b'?'w':'b';if(r.seats[guest])fail('房间已满');r.seats[guest]=token();r.keys[guest]=input.clientKey;r.version++;return {id:r.id,token:r.seats[guest],color:guest};
 }
 const color=Object.keys(r.seats).find(c=>r.seats[c]&&r.seats[c]===input.token);if(!color)fail('无权访问这局棋');
 const snapshot=()=>({id:r.id,board:r.board,cast:r.cast,turn:r.turn,version:r.version,ready:r.ready,joined:!!(r.seats.w&&r.seats.b),history:r.history,result:r.result,color});
 if(input.action==='state')return snapshot();
 if(typeof input.op!=='string'||input.op.length>80)fail('缺少操作编号');
 if(r.seen.has(input.op))return snapshot();
 if(input.version!==r.version)fail('棋局已更新，请同步后重试');
 if(r.result)fail('对局已经结束');
 if(input.action==='ready'){r.ready[color]=true;}
 else if(input.action==='resign'){r.result=color==='w'?'黑方获胜：白方认输':'白方获胜：黑方认输';}
 else if(input.action==='draw'){
  if(r.turn!==color||!r.ready.w||!r.ready.b)fail('请在自己的回合申请');
  const key=engine.positionKey(r.board,r.turn,r.cast);
  if(r.positions.filter(k=>k===key).length<3&&(r.cast.halfmove||0)<100)fail('尚未达到三次重复或50回合和棋条件');r.result='和棋申请成立';
 }
 else if(input.action==='move'){
  if(!r.ready.w||!r.ready.b)fail('等待双方准备');if(r.turn!==color)fail('尚未轮到你');
  const m=engine.allLegalMoves(r.board,color,r.cast).find(m=>m.from===input.from&&m.to===input.to&&(m.promotion||'')===(input.promotion||''));if(!m)fail('这步不符合走棋规则');
  engine.applyMove(r.board,m,r.cast);r.history.push({...m,color});r.turn=color==='w'?'b':'w';
  const key=engine.positionKey(r.board,r.turn,r.cast);r.positions.push(key);
  if(!engine.allLegalMoves(r.board,r.turn,r.cast).length)r.result=engine.inCheck(r.board,r.turn)?(color==='w'?'白方':'黑方')+'将杀获胜':'逼和';
  else if(engine.simpleDeadPosition(r.board))r.result='和棋：常见必和子力';
  else if(r.positions.filter(k=>k===key).length>=5||(r.cast.halfmove||0)>=150)r.result='和棋：五次重复或75回合';
 }else fail('未知操作');
 r.version++;r.seen.add(input.op);return snapshot();
 }
 return {act(input){const before=encode(rooms);try{const result=apply(input);const after=encode(rooms);if(file&&after!==before){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,after,{mode:0o600});fs.renameSync(tmp,file);}return JSON.parse(JSON.stringify(result));}catch(e){rooms=decode(before);throw e;}}};
}
const {act}=createRoomService();
function server(options={}){const service=createRoomService(options.roomFile);const requests=new Map();return http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  if(req.method==='POST'&&['/api/friend','/api/feedback'].includes(req.url)){
   const now=Date.now(),who=req.socket.remoteAddress;for(const [k,v] of requests)if(now-v.time>60000)requests.delete(k);const counter=requests.get(who)||{time:now,count:0};counter.count++;requests.set(who,counter);if(counter.count>180)throw Error('操作过于频繁，请稍后重试');
   if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)throw new Error('不允许跨站请求');
   if(!String(req.headers['content-type']).startsWith('application/json'))throw new Error('请求格式错误');
   let data='';for await(const part of req){data+=part;if(data.length>8192)throw new Error('请求过大');}
   const input=JSON.parse(data);const result=req.url==='/api/feedback'?saveFeedback(input,options.feedbackDir):service.act(input);
   res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(result));return;
  }
  if(req.method!=='GET')throw new Error('不支持的请求');
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'小骑士乐园-统一主题版.html';
  const publicFiles=['小骑士乐园-统一主题版.html','friend-client.js','feedback-client.js','battle-save.js','app-info.js','immersive.js','classic-games.css','classic-games.js','classic-games-data.js','stockfish-engine.js','vendor/stockfish/stockfish-18-lite-single.js','vendor/stockfish/stockfish-18-lite-single.wasm','vendor/stockfish/stockfish-18-lite-bundle.js','vendor/stockfish/stockfish-18-lite-factory.js'];
  if(!publicFiles.includes(name)&&!/^assets\/[a-z_]+\.png$/.test(name))throw new Error('资源不存在');
  const type=name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.wasm')?'application/wasm':'image/png';res.setHeader('Content-Type',type);res.end(fs.readFileSync(path.join(__dirname,name)));
 }catch(e){res.statusCode=400;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({error:e.message}));}
});}
if(require.main===module)server({roomFile:require('./data-paths.cjs').roomFile}).listen(8787,'127.0.0.1',()=>console.log('本地联调：http://127.0.0.1:8787（房间保存至统一运行数据目录；禁止直接公网发布）'));
module.exports={act,server,createRoomService};
