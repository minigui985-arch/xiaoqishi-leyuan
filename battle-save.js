/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
let savedAtLoad=null;try{savedAtLoad=localStorage.getItem('knightBattleV1');}catch{}
// Store moves, reconstruct trusted engine state rather than trusting stored boards.
function saveBattle(){
 if(!battle.board||!Array.isArray(battle.history))return;
 try{localStorage.setItem('knightBattleV1',JSON.stringify({version:1,moves:battle.history.map(h=>h.move),over:!!battle.over}));}catch{}
}
function restoreBattle(){
 try{
  const raw=JSON.parse(savedAtLoad||'null');if(!raw||raw.version!==1||!Array.isArray(raw.moves)||raw.moves.length>2000)return;
  const b=setupBoard(),cast={...castlingState(),halfmove:0},history=[],positions=[positionKey(b,'w',cast)],captured={w:[],b:[]};let turn='w';
  for(const input of raw.moves){const m=allLegalMoves(b,turn,cast).find(m=>sameMove(m,input));if(!m)throw Error('Invalid saved move');const before=copyPosition(b,cast);const cap=applyMove(b,m,cast);if(cap)captured[turn].push(cap);history.push({before,move:{...m},color:turn});turn=turn==='w'?'b':'w';positions.push(positionKey(b,turn,cast));}
  const terminal=!allLegalMoves(b,turn,cast).length||simpleDeadPosition(b)||positions.filter(k=>k===positions.at(-1)).length>=5||(cast.halfmove||0)>=150;
  Object.assign(battle,{board:b,cast,history,positions,captured,turn,over:raw.over===true||terminal,thinking:turn==='b'&&!raw.over&&!terminal,selected:null,lastMove:history.length?[history.at(-1).move.from,history.at(-1).move.to]:null});
 }catch{try{localStorage.removeItem('knightBattleV1');}catch{}}
}
document.addEventListener('DOMContentLoaded',()=>{
 // initApp has already rendered the current route; restore after it, then redraw.
 clearTimeout(aiTimer);battleEpoch++;restoreBattle();
 if(playPageMode==='battle'&&battle.board){renderBattle();renderCoach();if(battle.thinking){const epoch=battleEpoch;aiTimer=setTimeout(()=>{if(epoch===battleEpoch)aiTurn();},450);}}
});
window.addEventListener('pagehide',saveBattle);
