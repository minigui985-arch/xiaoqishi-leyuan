/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'小骑士乐园-统一主题版.html');
let html=fs.readFileSync(file,'utf8');
if(html.includes('/* GUIDED_LEARNING_V1 */'))throw Error('Already upgraded; edit learning.js then replace its marked section.');
fs.copyFileSync(file,path.join(__dirname,'小骑士乐园-主题版备份.html'));
function replaceFn(name,code){const start=html.indexOf('function '+name+'(');if(start<0)throw Error(name);const end=html.indexOf('\nfunction ',start+10);if(end<0)throw Error('end '+name);html=html.slice(0,start)+code+'\n'+html.slice(end);}
html=html.replace("const pr = enemy==='w' ? r+1 : r-1;","const pr = enemy==='w' ? r-1 : r+1;");
html=html.replace('const add = (to, flags)=> out.push(Object.assign({from:idx, to}, flags||{}));',"const add = (to, flags)=> { if(to>=0&&to<64 && b[to]?.t!=='k') out.push(Object.assign({from:idx,to},flags||{})); };");
html=html.replace('if(!b[target]) add(target, {capture:true, ep:true});',"if(!b[target] && b[epR*8+epF]?.t==='p' && b[epR*8+epF].c!==c) add(target,{capture:true,ep:true});");
replaceFn('legalMoves',`function legalMoves(b,idx,cast){
 const p=b[idx];if(!p)return [];
 return pseudoMoves(b,idx,cast||{}).flatMap(m=>p.t==='p'&&(m.to<8||m.to>55)?['q','r','b','n'].map(promotion=>({...m,promotion})):[m]).filter(m=>{
  const next=cloneBoard(b);applyMove(next,m,cast,true);return !inCheck(next,p.c);
 });
}`);
replaceFn('applyMove',`function applyMove(b,m,cast,dry){
 const p=b[m.from];if(!p)throw Error('起点没有棋子');
 let captured=b[m.to]||null;
 if(m.ep){const i=m.to+(p.c==='w'?-8:8);captured=b[i];b[i]=null;}
 if(m.castle){const rookFrom=(p.c==='w'?0:56)+(m.castle==='K'?7:0),rookTo=m.to+(m.castle==='K'?-1:1);b[rookTo]=b[rookFrom];b[rookFrom]=null;}
 b[m.to]=p;b[m.from]=null;
 if(p.t==='p'&&(m.to<8||m.to>55)){b[m.to]={t:m.promotion||'q',c:p.c};if(!dry)m.promoted=true;}
 if(cast&&!dry){
  if(p.t==='k'){cast[p.c+'K']=false;cast[p.c+'Q']=false;}
  const rights={0:'wQ',7:'wK',56:'bQ',63:'bK'};
  if(p.t==='r'&&rights[m.from])cast[rights[m.from]]=false;
  if(captured?.t==='r'&&rights[m.to])cast[rights[m.to]]=false;
  cast.ep=p.t==='p'&&Math.abs(m.to-m.from)===16?[Math.floor(m.to/8),m.to%8]:null;
  cast.halfmove=p.t==='p'||captured?0:(cast.halfmove||0)+1;
 }
 return captured;
}`);
replaceFn('initBattle',`function initBattle(){
 clearTimeout(aiTimer);battleEpoch++;closeResult();
 battle.board=setupBoard();battle.cast=castlingState();battle.cast.halfmove=0;
 battle.turn='w';battle.over=false;battle.thinking=false;battle.selected=null;
 battle.captured={w:[],b:[]};battle.lastMove=null;battle.history=[];battle.positions=[positionKey(battle.board,'w',battle.cast)];
 hintStage=0;renderBattle();renderCoach();
 guide('你执白方十字军。先观察谁需要保护，再试着走一步。需要时点“给我一点提示”，不用着急。');
}`);
replaceFn('onBattleClick',`function onBattleClick(idx){
 if(battle.over||battle.thinking||battle.turn!=='w')return;
 const p=battle.board[idx],sel=battle.selected;
 if(sel!==null&&idx!==sel){
  const moves=legalMoves(battle.board,sel,battle.cast).filter(m=>m.to===idx);
  if(moves.length){if(moves.some(m=>m.promotion)){choosePromotion(moves,doBattleMove);}else doBattleMove(moves[0]);return;}
  if(!p||p.c!=='w'){coachSay(inCheck(battle.board,'w')?'国王正在被攻击。试试移动国王、挡住路线，或吃掉进攻者。':'这条路线暂时走不通。看看亮点：它们是这枚棋子能安全到达的位置。');return;}
 }
 if(p?.c==='w'){battle.selected=sel===idx?null:idx;renderBattle();}
}`);
replaceFn('doBattleMove',`function doBattleMove(mv){
 if(battle.over||battle.thinking||battle.turn!=='w')return;
 const valid=allLegalMoves(battle.board,'w',battle.cast).find(m=>sameMove(m,mv));if(!valid)return;
 recordAndMove(valid,'w');battle.turn='b';battle.thinking=true;battle.selected=null;hintStage=0;renderBattle();renderCoach();
 if(checkGameEnd('b'))return;
 const epoch=battleEpoch;aiTimer=setTimeout(()=>{if(epoch===battleEpoch)aiTurn();},450);
}`);
replaceFn('aiTurn',`function aiTurn(){
 if(battle.over||battle.turn!=='b')return;
 const mv=aiPickMove(battle.board,battle.cast);if(!mv){checkGameEnd('b');return;}
 recordAndMove(mv,'b');battle.turn='w';battle.thinking=false;renderBattle();renderCoach();checkGameEnd('w');
}`);
replaceFn('checkGameEnd',`function checkGameEnd(color){
 const moves=allLegalMoves(battle.board,color,battle.cast);
 if(!moves.length){finishLearning(inCheck(battle.board,color)?(color==='w'?'明军将杀':'十字军将杀'):'逼和：当前一方无合法走法，且没有被将军');return true;}
 if(simpleDeadPosition(battle.board)){finishLearning('和棋：当前子力无法形成将杀');return true;}
 const key=positionKey(battle.board,color,battle.cast),count=battle.positions.filter(k=>k===key).length;
 if(count>=5||(battle.cast.halfmove||0)>=150){finishLearning(count>=5?'和棋：同一局面出现五次':'和棋：双方连续75回合没有动兵或吃子');return true;}
 if(inCheck(battle.board,color)&&color==='w')coachSay('先保护国王：移动、挡住攻击路线，或吃掉进攻者。你想试哪一种？');
 return false;
}`);
// Returning to the page resumes the same game; only explicit New Game resets it.
html=html.replace("  initBattle();\n}\n/* ================================================================\n   初始化", "  if(battle.board){renderBattle();}else initBattle();\n  mountCoach();\n}\n/* ================================================================\n   初始化");
html=html.replace("$('#resultAgain').addEventListener('click', ()=>{ closeResult(); if(playPageMode==='battle') startBattle(); else startCapture(); });","$('#resultAgain').addEventListener('click', ()=>{ closeResult(); if(playPageMode==='battle') initBattle(); else startCapture(); });");
html=html.replace('本教学版本暂自动升后','到达底线时可自行选择升变棋子');
html=html.replace('</style>',()=>fs.readFileSync(path.join(__dirname,'learning.css'),'utf8')+'\n</style>');
html=html.replace("document.addEventListener('DOMContentLoaded', initApp);",()=>fs.readFileSync(path.join(__dirname,'learning.js'),'utf8')+"\ndocument.addEventListener('DOMContentLoaded', initApp);");
fs.writeFileSync(file,html);console.log('Guided learning integrated.');
