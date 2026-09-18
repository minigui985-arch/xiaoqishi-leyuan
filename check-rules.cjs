/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/小骑士乐园-统一主题版.html','utf8');
const context=vm.createContext({});vm.runInContext(html.slice(html.indexOf('function emptyBoard()'),html.indexOf('function aiPickMove(')),context);
const result=vm.runInContext(`(()=>{
function perft(b,c,turn,depth){if(!depth)return 1;let nodes=0;for(const m of allLegalMoves(b,turn,c)){const nb=b.slice(),nc={...c};applyMove(nb,m,nc);nodes+=perft(nb,nc,turn==='w'?'b':'w',depth-1);}return nodes;}
function fen(s){const b=emptyBoard();s.split('/').forEach((row,r)=>{let f=0;for(const ch of row){if(/\\d/.test(ch))f+=+ch;else b[(7-r)*8+f++]={t:ch.toLowerCase(),c:ch===ch.toUpperCase()?'w':'b'};}});return b;}
const start=setupBoard(),initial=[1,2,3].map(d=>perft(start,castlingState(),'w',d));
const kiwi=fen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R');
let b=fen('k3r3/8/8/8/8/8/4R3/4K3');const pin=legalMoves(b,12,{}).some(m=>m.to===13);
b=fen('k7/8/8/4KPpr/8/8/8/8');const epPin=legalMoves(b,37,{ep:[4,6]}).some(m=>m.ep);
b=fen('4k3/P7/8/8/8/8/8/4K3');const promotions=legalMoves(b,48,{}).map(m=>m.promotion).sort();
b=fen('4k3/8/8/3p4/4K3/8/8/8');const pawnCheck=inCheck(b,'w');
b=setupBoard();let c=castlingState();applyMove(b,{from:12,to:28},c);const epSet=c.ep;applyMove(b,{from:62,to:45},c);const epExpired=c.ep;
b=fen('r3k2r/8/8/8/8/8/8/R3K2R');c=castlingState();applyMove(b,{from:0,to:56},c);const capturedRookRight=c.bQ;
return {initial,kiwi:[1,2].map(d=>perft(kiwi,castlingState(),'w',d)),pin,epPin,promotions,pawnCheck,epSet,epExpired,capturedRookRight};})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(result)),{initial:[20,400,8902],kiwi:[48,2039],pin:false,epPin:false,promotions:['b','n','q','r'],pawnCheck:true,epSet:[3,4],epExpired:null,capturedRookRight:false});
console.log('PASS:',JSON.stringify(result));
const terminal=vm.runInContext(`(()=>{
function board(pieces){const b=emptyBoard();for(const [sq,t,c] of pieces)b[sq]={t,c};return b;}
const mate=board([[56,'k','b'],[49,'q','w'],[42,'k','w']]);
const stale=board([[56,'k','b'],[41,'q','w'],[42,'k','w']]);
const transit=board([[4,'k','w'],[7,'r','w'],[56,'k','b'],[61,'r','b']]);
const ep=board([[4,'k','w'],[60,'k','b'],[36,'p','w'],[35,'p','b']]);const c={ep:[4,3]};const move=legalMoves(ep,36,c).find(m=>m.ep);applyMove(ep,move,c);
return {mate:inCheck(mate,'b')&&allLegalMoves(mate,'b',{}).length===0,stalemate:!inCheck(stale,'b')&&allLegalMoves(stale,'b',{}).length===0,castleThroughAttack:legalMoves(transit,4,castlingState()).some(m=>m.castle),epCaptured:ep[35]===null&&ep[43]?.c==='w',noKingCapture:allLegalMoves(board([[4,'k','w'],[60,'k','b'],[52,'q','w']]),'w',{}).every(m=>m.to!==60)};
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(terminal)),{mate:true,stalemate:true,castleThroughAttack:false,epCaptured:true,noKingCapture:true});
console.log('PASS: checkmate, stalemate, castling through attack, legal en passant, no king captures.');
