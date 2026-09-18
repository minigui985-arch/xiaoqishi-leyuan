/* Stockfish.js UCI adapter. Stockfish itself is GPL-3.0; see THIRD_PARTY_NOTICES.md. */
(function(){
 'use strict';
 const ENGINE_URL='vendor/stockfish/stockfish-18-lite-single.js';
 let worker=null, boot=null, chain=Promise.resolve(), listeners=[], protocolHandler=null;
 const emit=message=>{for(const line of String(message).split(/\r?\n/).filter(Boolean)){if(window.__KNIGHT_ENGINE_DEBUG)console.debug('[Stockfish]',line);protocolHandler?.(line);for(const fn of [...listeners])fn(line);}};
 function localTransport(){
  return new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='vendor/stockfish/stockfish-18-lite-bundle.js';script.async=true;
   script.onerror=()=>reject(new Error('大师引擎脚本加载失败'));
   script.onload=()=>{try{const raw=atob(window.KNIGHT_STOCKFISH_WASM),wasm=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)wasm[i]=raw.charCodeAt(i);const factoryScript=document.createElement('script');factoryScript.src='vendor/stockfish/stockfish-18-lite-factory.js';factoryScript.onerror=()=>reject(new Error('大师引擎模块加载失败'));factoryScript.onload=()=>{const module={wasmBinary:wasm,listener:emit};Promise.resolve(factoryScript._exports(module)).then(()=>resolve({postMessage:line=>module.processCommand(line),terminate:()=>module.terminate?.()}),reject);};document.head.append(factoryScript);}catch(e){reject(e);}};
   document.head.append(script);
  });
 }
 function create(){
  if(worker)return Promise.resolve(worker);
  if(boot)return boot;
  boot=new Promise((resolve,reject)=>{
   try{
    const timer=setTimeout(()=>{worker?.terminate();worker=null;boot=null;reject(new Error('大师引擎启动超时'));},20000);
    protocolHandler=line=>{if(line.includes('readyok')){clearTimeout(timer);resolve(worker);return;}if(line.includes('uciok')){worker.postMessage('setoption name Threads value 1');worker.postMessage('setoption name Hash value 32');worker.postMessage('isready');}};
    if(location.protocol==='file:'){
     localTransport().then(w=>{worker=w;worker.postMessage('uci');}).catch(e=>{clearTimeout(timer);worker=null;boot=null;reject(e);});
     return;
    }
    worker=new Worker(ENGINE_URL+'#'+encodeURIComponent(new URL('vendor/stockfish/stockfish-18-lite-single.wasm',location.href).href));
    worker.onerror=e=>{clearTimeout(timer);worker?.terminate();worker=null;boot=null;reject(new Error('大师引擎加载失败：'+(e.message||'未知错误')));};
    worker.onmessage=e=>emit(e.data);
    worker.postMessage('uci');
   }catch(e){worker=null;boot=null;reject(e);}
  });
  return boot;
 }
 function boardFen(board,turn,cast){
  const rows=[];
  for(let rank=7;rank>=0;rank--){let row='',empty=0;for(let file=0;file<8;file++){const p=board[rank*8+file];if(!p){empty++;continue;}if(empty){row+=empty;empty=0;}const letter=p.t==='n'?'n':p.t;row+=p.c==='w'?letter.toUpperCase():letter;}if(empty)row+=empty;rows.push(row);}
  let rights='';if(cast?.wK)rights+='K';if(cast?.wQ)rights+='Q';if(cast?.bK)rights+='k';if(cast?.bQ)rights+='q';
  let ep='-';if(cast?.ep){const [r,f]=cast.ep;const target=r+(turn==='w'?1:-1);ep='abcdefgh'[f]+(target+1);}
  return `${rows.join('/')} ${turn} ${rights||'-'} ${ep} ${cast?.halfmove||0} 1`;
 }
 function parseUci(text,board,turn,cast){
  if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(text))return null;
  const from=name2idx(text.slice(0,2)),to=name2idx(text.slice(2,4)),promotion=text[4]||undefined;
  return allLegalMoves(board,turn,cast).find(m=>m.from===from&&m.to===to&&(!promotion||m.promotion===promotion))||null;
 }
 function analyze(board,turn,cast,options={}){
  const job=()=>create().then(w=>new Promise((resolve,reject)=>{
   const lines=[],limit=Math.max(80,Math.min(8000,+options.movetime||900));
   const timeout=setTimeout(()=>{cleanup();w.postMessage('stop');reject(new Error('大师引擎本次思考超时'));},limit+12000);
   const onLine=line=>{if(line.includes('info '))lines.push(line);const match=line.match(/bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?|\(none\))/);if(match){cleanup();const uci=match[1];resolve({uci,move:parseUci(uci,board,turn,cast),info:lines.at(-1)||''});}};
   function cleanup(){clearTimeout(timeout);listeners=listeners.filter(x=>x!==onLine);}
   listeners.push(onLine);w.postMessage('ucinewgame');w.postMessage('position fen '+boardFen(board,turn,cast));w.postMessage('go movetime '+limit);
  }));
  const result=chain.then(job,job);chain=result.catch(()=>{});return result;
 }
 window.KnightStockfish=Object.freeze({ready:create,toFen:boardFen,analyze,chooseMove:(b,t,c,o)=>analyze(b,t,c,o).then(x=>x.move),shutdown(){worker?.terminate();worker=null;boot=null;}});
})();
