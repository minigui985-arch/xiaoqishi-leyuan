/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
/* GUIDED_LEARNING_V1 */
let aiTimer=null,battleEpoch=0,hintStage=0;
let battleRuleMode='explore';try{battleRuleMode=localStorage.getItem('knight-rule-mode')==='tournament'?'tournament':'explore';}catch{}
const tournamentRules=()=>battleRuleMode==='tournament';
const copyPosition=(b,c)=>({board:b.map(p=>p?{...p}:null),cast:JSON.parse(JSON.stringify(c||{}))});
const sameMove=(a,b)=>a.from===b.from&&a.to===b.to&&(a.promotion||'')===(b.promotion||'');
function positionKey(b,turn,c){
 const ep=allLegalMoves(b,turn,c).some(m=>m.ep)?c.ep.join(','):'-';
 return b.map(p=>p?p.c+p.t:'.').join('')+'/'+turn+'/'+['wK','wQ','bK','bQ'].map(k=>c[k]?1:0).join('')+'/'+ep;
}
function simpleDeadPosition(b){const pieces=b.map((p,i)=>({...p,i})).filter(p=>p.t&&p.t!=='k');if(!pieces.length)return true;if(pieces.length===1&&['b','n'].includes(pieces[0].t))return true;return pieces.every(p=>p.t==='b')&&new Set(pieces.map(p=>(p.i%8+Math.floor(p.i/8))%2)).size===1;}
function recordAndMove(m,color){
 const before=copyPosition(battle.board,battle.cast);const captured=applyMove(battle.board,m,battle.cast);
 if(captured)battle.captured[color].push(captured);
 battle.lastMove=[m.from,m.to];battle.history.push({before,move:{...m},color});
 const next=color==='w'?'b':'w';battle.positions.push(positionKey(battle.board,next,battle.cast));
 if(captured)SFX.capture();else SFX.move();
}
function material(b){return b.reduce((s,p)=>s+(p?(p.c==='w'?1:-1)*(SCORE[p.t]||0):0),0);}
// Two-ply material/terminal search: an explainable short-line suggestion, not master analysis.
function shortLines(b,c,color='w'){
 return allLegalMoves(b,color,c).map(move=>{
  const next=copyPosition(b,c);applyMove(next.board,move,next.cast);
  const enemy=color==='w'?'b':'w';const replies=allLegalMoves(next.board,enemy,next.cast);
  let score=material(next.board),reply=null;
  if(!replies.length)score=inCheck(next.board,enemy)?(color==='w'?10000:-10000):0;
  else {let best=enemy==='b'?Infinity:-Infinity;for(const r of replies){const after=copyPosition(next.board,next.cast);applyMove(after.board,r,after.cast);let value=material(after.board);const follow=allLegalMoves(after.board,color,after.cast);if(!follow.length)value=inCheck(after.board,color)?(color==='w'?-10000:10000):0;if(enemy==='b'?value<best:value>best){best=value;reply=r;}}score=best;}
  return {move,reply,score};
 }).sort((a,b)=>color==='w'?b.score-a.score:a.score-b.score);
}
function coachSay(text){const el=$('#coachMessage');if(el)el.textContent=text;}
function mountCoach(){
 if(!$('#coachPanel'))$('#playPanel').insertAdjacentHTML('beforeend',`<section class="coach-panel" id="coachPanel"><span class="coach-mode">启蒙探索 · 不限时</span><h3>观察一下，再决定下一步</h3><p class="coach-note" id="coachMessage" aria-live="polite"></p><div class="coach-actions"><button class="btn btn-soft" id="coachHint">给我一点提示</button><button class="btn btn-ghost" id="coachUndo">退回上一步</button><button class="btn btn-ghost" id="coachReview">战局回顾</button><button class="btn btn-ghost" id="coachEnd">结束练习并复盘</button><button class="btn btn-ghost" id="coachDraw">申请和棋</button></div><div class="race-pending"><label><input type="checkbox" id="tournamentRules"> 国际标准赛事规则</label><br><span id="ruleModeNote">探索模式保留合法走法提示、引导和重试。</span></div></section>`);
 $('#coachHint').onclick=giveHint;$('#coachUndo').onclick=undoLearning;$('#coachReview').onclick=openReview;
 $('#coachEnd').onclick=endLearning;$('#coachDraw').onclick=claimLearningDraw;
 $('#tournamentRules').onchange=e=>{if(battle.history?.length&&!battle.over){e.target.checked=tournamentRules();coachSay('规则模式只能在新对局开始前切换。');return;}battleRuleMode=e.target.checked?'tournament':'explore';try{localStorage.setItem('knight-rule-mode',battleRuleMode);}catch{}renderBattle();renderCoach();toast(tournamentRules()?'已开启赛事规则：本局不提供提示、悔棋和途中复盘':'已切换启蒙探索：可以使用提示、悔棋和复盘','success');};renderCoach();
}
function renderCoach(){if(!$('#coachPanel'))return;const strict=tournamentRules(),started=!!battle.history?.length&&!battle.over;$('.coach-mode').textContent=strict?'国际标准赛事规则 · 不限时':'启蒙探索 · 不限时';$('#tournamentRules').checked=strict;$('#tournamentRules').disabled=started;$('#ruleModeNote').textContent=strict?'严格执行合法走法与和棋声明；关闭提示、悔棋和途中复盘。本地练习暂不计时。':'探索模式保留合法走法提示、引导和重试。';$('#coachHint').disabled=strict||battle.over||battle.thinking;$('#coachUndo').disabled=strict||!battle.history?.length;$('#coachReview').disabled=(strict&&!battle.over)||!battle.history?.some(h=>h.color==='w');$('#coachEnd').disabled=battle.over;$('#coachEnd').textContent=strict?'认输并复盘':'结束练习并复盘';$('#coachDraw').disabled=battle.over||battle.turn!=='w';coachSay(battle.over?'对局结束，可以查看完整复盘。':strict?(battle.thinking?'明军正在走棋。':'赛事规则已开启，请独立完成本回合。'):(battle.thinking?'明军陪练正在思考。留意它下一步想保护谁。':'先看看国王是否安全，再找一找受到攻击的伙伴。'));}
function endLearning(){finishLearning(tournamentRules()?'白方认输，赛事对局结束':'本轮练习结束，一起回顾');}
function giveHint(){
 if(tournamentRules()){coachSay('赛事规则中不提供走法提示。结束后可以统一复盘。');return;}if(battle.over||battle.thinking)return;
 const lines=shortLines(battle.board,battle.cast);if(!lines.length)return;
 const line=lines[0],name=FACTIONS.w.roles[battle.board[line.move.from].t];hintStage++;
 if(hintStage===1){coachSay(inCheck(battle.board,'w')?'国王正受到攻击。你能找到一条解围路线吗？':'先观察：有没有伙伴受到攻击？有没有机会吃子后仍保持安全？');}
 else if(hintStage===2){coachSay(`试着观察 ${idx2name(line.move.from)} 的${name}。看看它能到达哪些格子。`);battle.selected=line.move.from;renderBattle();}
 else {coachSay(`短线练习方案：${idx2name(line.move.from)} → ${idx2name(line.move.to)}。这只比较眼前一来一回；先想想对手会如何回应。`);drawRoutes($('#playBoardWrap'),[{...line.move,color:'#276a87'}]);}
}
function undoLearning(){
 if(tournamentRules()){coachSay('赛事规则中不能悔棋。');return;}if(!battle.history?.length)return;clearTimeout(aiTimer);battleEpoch++;
 let index=battle.history.length-1;while(index>0&&battle.history[index].color!=='w')index--;
 const saved=battle.history[index].before;battle.board=copyPosition(saved.board,saved.cast).board;battle.cast=JSON.parse(JSON.stringify(saved.cast));battle.history=battle.history.slice(0,index);battle.positions=battle.positions.slice(0,index+1);battle.turn='w';battle.thinking=false;battle.over=false;battle.selected=null;battle.lastMove=battle.history.length?[battle.history.at(-1).move.from,battle.history.at(-1).move.to]:null;
 battle.captured={w:[],b:[]};for(const h of battle.history){const pos=copyPosition(h.before.board,h.before.cast);const cap=applyMove(pos.board,h.move,pos.cast);if(cap)battle.captured[h.color].push(cap);}hintStage=0;closeResult();renderBattle();renderCoach();coachSay('回到选择之前。这次试着说说：我想保护谁，或威胁谁？');
}
function claimLearningDraw(){
 const key=positionKey(battle.board,battle.turn,battle.cast);if(battle.positions.filter(k=>k===key).length>=3||(battle.cast.halfmove||0)>=100)finishLearning('和棋申请成立');else coachSay('目前尚未达到同一局面三次或双方50回合未动兵、未吃子的条件。你也可以结束练习，直接复盘。');
}
function finishLearning(title){clearTimeout(aiTimer);battleEpoch++;battle.over=true;battle.thinking=false;renderBattle();renderCoach();coachSay(title);openReview();}
function choosePromotion(moves,commit,overrideColor){
 let dialog=$('#promotionDialog');if(!dialog){document.body.insertAdjacentHTML('beforeend','<dialog id="promotionDialog"><h2>选择升变棋子</h2><p>兵到达底线，可以变成后、车、象或马。</p><div class="promotion-choices"></div><button class="btn btn-ghost" id="cancelPromotion">暂不走这步</button></dialog>');dialog=$('#promotionDialog');}
 const color=overrideColor||battle.board[moves[0].from]?.c||'w';dialog.querySelector('.promotion-choices').innerHTML=moves.map(m=>`<button data-promotion="${m.promotion}">${pieceSVG(m.promotion,color)}${PIECES[m.promotion].name}</button>`).join('');dialog.querySelectorAll('[data-promotion]').forEach(b=>b.onclick=()=>{dialog.close();commit(moves.find(m=>m.promotion===b.dataset.promotion));});$('#cancelPromotion').onclick=()=>dialog.close();dialog.showModal();
}
function drawRoutes(wrap,routes){
 const board=wrap.querySelector('.board');if(!board)return;board.style.position='relative';board.querySelector('.route-overlay')?.remove();
 const center=i=>[(i%8)*100+50,(7-Math.floor(i/8))*100+50];
 const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 board.insertAdjacentHTML('beforeend',`<svg class="route-overlay" viewBox="0 0 800 800" aria-hidden="true">${routes.map(m=>{
  const a=center(m.from),b=center(m.to),knight=Math.abs(a[0]-b[0])*Math.abs(a[1]-b[1])===20000;
  let points=[];const line=(x,y)=>{for(let i=0;i<16;i++)points.push(lerp(x,y,i/16));};
  if(knight){const bend=Math.abs(a[0]-b[0])===200?[b[0],a[1]]:[a[0],b[1]],u=lerp(bend,a,24/Math.hypot(a[0]-bend[0],a[1]-bend[1])),v=lerp(bend,b,24/Math.hypot(b[0]-bend[0],b[1]-bend[1]));line(a,u);for(let i=0;i<12;i++){const t=i/12;points.push(u.map((x,j)=>(1-t)**2*x+2*(1-t)*t*bend[j]+t*t*v[j]));}line(v,b);}else line(a,b);
  points.push(b);const last=points.at(-2),angle=Math.atan2(b[1]-last[1],b[0]-last[0])*180/Math.PI;
  const edges=[[],[]];points.forEach((p,i)=>{const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1,w=18-10*i/(points.length-1);edges[0].push([p[0]-dy/len*w,p[1]+dx/len*w]);edges[1].push([p[0]+dy/len*w,p[1]-dx/len*w]);});
  const route='M'+points.map(p=>p.join(',')).join(' L'),band='M'+[...edges[0],...edges[1].reverse()].map(p=>p.join(',')).join(' L')+' Z';
  return `<g class="march-route"><path d="${route}" fill="none" stroke="${m.color}" stroke-width="46" stroke-linecap="round" stroke-linejoin="round" opacity=".12"/>${m.dashed?`<path class="march-trail" d="${route}" fill="none" stroke="${m.color}" stroke-width="26" stroke-linecap="round" stroke-dasharray="25 20" opacity=".65"/>`:`<path class="march-trail" d="${band}" fill="${m.color}" opacity=".62" stroke="${m.color}" stroke-width="3" stroke-linejoin="round"/>`}<circle cx="${a[0]}" cy="${a[1]}" r="17" fill="${m.color}" opacity=".45"/><path class="march-head" transform="translate(${b}) rotate(${angle})" d="M0 0 Q-17 -13 -47 -31 Q-52 -32 -48 -25 L-37 0 L-48 25 Q-52 32 -47 31 Q-17 13 0 0Z" fill="${m.color}" opacity=".86" stroke="${m.color}" stroke-width="3" stroke-linejoin="round"/></g>`;
 }).join('')}</svg>`);
}
let review={items:[],index:0,stage:0,selected:null,retry:false,awarded:new Set()};
function openReview(source){
 if(!source||!Array.isArray(source.history))source=battle;
 if(source.thinking){coachSay('等对手走完这一步，再一起回顾。');return;}
 const history=(source.history||[]).filter(h=>h.color==='w');if(!history.length){coachSay('先尝试走一步，再来看看你的选择。');return;}
 const items=history.map((h,i)=>{const lines=shortLines(h.before.board,h.before.cast);const actual=lines.find(l=>sameMove(l.move,h.move));return {...h,number:i+1,lines,actual,gap:actual?lines[0].score-actual.score:0};});
 review={items:items.sort((a,b)=>b.gap-a.gap).slice(0,3).sort((a,b)=>a.number-b.number),index:0,stage:0,selected:null,retry:false,awarded:new Set()};
 if(!$('#reviewDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="reviewDialog" aria-labelledby="reviewTitle"><div class="review-head"><h2 id="reviewTitle">战局回顾 · 看懂再试</h2><button class="btn btn-ghost" id="closeReview">返回棋局</button></div><p id="reviewProgress"></p><div class="review-board"><div class="board-wrap" id="reviewBoard"></div></div><div class="review-copy" id="reviewMessage" aria-live="polite"></div><div class="review-controls"><button class="btn btn-soft" id="reviewHint">提醒观察</button><button class="btn btn-soft" id="reviewDirection">提供方向</button><button class="btn btn-soft" id="reviewAnswer">展示路线</button><button class="btn btn-ghost" id="reviewReply">对手回应</button><button class="btn btn-primary" id="reviewRetry">我来试试</button></div><div class="review-controls"><button class="btn btn-ghost" id="reviewPrev">上一个时刻</button><button class="btn btn-ghost" id="reviewNext">下一个时刻</button></div><p class="review-caption">虚线：原来的路线　蓝色：练习方案　红色：对手回应。短线分析只比较一来一回的子力与将杀，不代表全局最佳；重试不会改动原对局。</p></dialog>`);
 const dialog=$('#reviewDialog');
 if(!dialog.querySelector('.review-layout')){
  const layout=document.createElement('div');layout.className='review-layout';
  const side=document.createElement('div');side.className='review-side';
  const board=dialog.querySelector('.review-board');layout.append(board,side);
  for(const child of [...dialog.children])if(!child.classList.contains('review-head'))side.append(child);
  dialog.append(layout);
 }
 mountReplayControls(source.history);
 $('#closeReview').onclick=()=>$('#reviewDialog').close();
 for(const [id,stage] of [['reviewHint',1],['reviewDirection',2],['reviewAnswer',3],['reviewReply',4]])$('#'+id).onclick=()=>{leaveReplay();review.stage=stage;review.retry=false;renderReview();};
 $('#reviewRetry').onclick=()=>{leaveReplay();review.retry=true;review.stage=0;review.selected=null;renderReview();};
 $('#reviewPrev').onclick=()=>changeReview(-1);$('#reviewNext').onclick=()=>changeReview(1);renderReview();$('#reviewDialog').showModal();
}
function changeReview(delta){leaveReplay();review.index=Math.max(0,Math.min(review.items.length-1,review.index+delta));review.stage=0;review.retry=false;review.selected=null;renderReview();}
function renderReview(){
 if(replay.active){renderReplay();return;}
 const item=review.items[review.index],best=item.lines[0];const pos=copyPosition(item.before.board,item.before.cast);let routes=[];
 if(!review.retry)routes=[{...item.move,color:'#a66448',dashed:true}];
 if(review.stage===3)routes.push({...best.move,color:'#276a87'});
 if(review.stage===4){applyMove(pos.board,best.move,pos.cast);if(best.reply){routes=[{...best.reply,color:'#b7483b'}];applyMove(pos.board,best.reply,pos.cast);}else routes=[];}
 let text=item.gap>=2?'这里有一个值得再观察的时刻。先看原来的路线，想想对手可能如何回应。':'这里没有发现明确的短线损失。我们一起看看这一步，也可以尝试其他路线。';
 if(review.stage===1){text=inCheck(item.before.board,'w')?'先观察国王：它是否正被攻击？我们要先解围。':'找一找：有没有伙伴受到攻击？对手下一步能吃到谁？';if(item.actual?.reply&&item.gap>=2){applyMove(pos.board,item.move,pos.cast);const reply=item.actual.reply;routes.push({...reply,color:'#b7483b',dashed:true});const target=pos.board[reply.to];text=`原来的路线走完后，对手可以 ${idx2name(reply.from)} → ${idx2name(reply.to)}${target?'，攻击这里的'+FACTIONS.w.roles[target.t]:''}。看看红色虚线，怎样让局面更稳？`;}}
 if(review.stage===2)text=`观察 ${idx2name(best.move.from)} 的${FACTIONS.w.roles[item.before.board[best.move.from].t]}：想想移动、保护或吃子，哪种行动能让局面更稳。`;
 if(review.stage===3)text=`可以试试 ${idx2name(best.move.from)} → ${idx2name(best.move.to)}${best.move.promotion?'，升变为'+PIECES[best.move.promotion].name:''}。${item.gap>=2?'在眼前一来一回中，这个方案的子力结果更稳。':'这是一种短线可行方案，并不意味着你的原走法错误。'}接着看看对手的回应。`;
 if(review.stage===4)text=best.reply?`对手可以 ${idx2name(best.reply.from)} → ${idx2name(best.reply.to)}。这是一个合理候选回应，不是它唯一能走的一步。再看看现在双方还剩哪些保护关系。`:'这一方案后，对手已无合法走法。结合国王是否被将军，区分将杀和逼和。';
 if(review.retry)text='轮到你来试。先选一枚白棋，再选目的地；同样稳妥的其他路线也值得肯定。';
 $('#reviewMessage').textContent=text;$('#reviewProgress').textContent=`时刻 ${review.index+1} / ${review.items.length} · 你的第 ${item.number} 步`;
 const selectable=new Set(review.retry&&review.selected!==null?legalMoves(pos.board,review.selected,pos.cast).map(m=>m.to):[]);
 renderChessBoard($('#reviewBoard'),pos.board,{selected:review.selected,selectable,onClick:retryReview});drawRoutes($('#reviewBoard'),routes);
 $('#reviewPrev').disabled=review.index===0;$('#reviewNext').disabled=review.index===review.items.length-1;
}
function retryReview(idx){
 if(replay.active)return;
 if(!review.retry)return;const item=review.items[review.index],b=item.before.board;
 const options=review.selected===null?[]:item.lines.filter(l=>l.move.from===review.selected&&l.move.to===idx);
 const assess=line=>{const good=item.lines[0].score-line.score<1.5;$('#reviewMessage').textContent=good?'你找到了一条短线同样稳妥的路线！试着说说，你想保护谁或威胁谁？':'这个选择值得再观察：对手还有吃子或将杀的机会。点“提供方向”得到下一层提示，再试一次。';drawRoutes($('#reviewBoard'),[{...line.move,color:good?'#347458':'#a66448'}]);};
 if(options.length){if(options.length>1)choosePromotion(options.map(l=>l.move),m=>assess(options.find(l=>sameMove(l.move,m))));else assess(options[0]);return;}
 if(b[idx]?.c==='w'){review.selected=idx;renderReview();}else $('#reviewMessage').textContent='这一步不符合走法或会暴露国王。再观察一下点亮的格子。';
}
let replay={active:false,playing:false,ply:0,history:[],timer:null,frame:null,epoch:0};
function mountReplayControls(history=battle.history){
 pauseReplay();replay.active=false;replay.ply=0;replay.history=JSON.parse(JSON.stringify(history||[]));
 if(!$('#replayToolbar')){
  $('#reviewProgress').insertAdjacentHTML('beforebegin',`<div class="replay-tabs" role="group" aria-label="复盘方式"><button id="keyMoments" class="btn btn-soft" aria-pressed="true">关键时刻</button><button id="wholeReplay" class="btn btn-ghost" aria-pressed="false">全局行军回放</button></div><div id="replayToolbar" class="hidden"><div class="replay-transport"><button id="replayFirst" class="btn btn-ghost" aria-label="回到开局">开局</button><button id="replayBack" class="btn btn-ghost" aria-label="上一步">上一步</button><button id="replayPlay" class="btn btn-primary">播放</button><button id="replayForward" class="btn btn-ghost" aria-label="下一步">下一步</button><button id="replayLast" class="btn btn-ghost" aria-label="最后一步">终局</button><label>节奏 <select id="replaySpeed" aria-label="回放节奏"><option value="3600">慢速</option><option value="2400" selected>正常</option><option value="1500">快速</option></select></label></div><input id="replaySeek" type="range" min="0" value="0" aria-label="选择回放步数"></div>`);
  $('#reviewDialog').addEventListener('close',pauseReplay);$('#reviewDialog').addEventListener('cancel',pauseReplay);
 }
 $('#replayToolbar').classList.add('hidden');
 $('#keyMoments').onclick=()=>{leaveReplay();renderReview();};
 $('#wholeReplay').onclick=()=>{pauseReplay();replay.active=true;review.retry=false;$('#replayToolbar').classList.remove('hidden');setReplayTabs(true);renderReplay();};
 $('#replayFirst').onclick=()=>seekReplay(0);$('#replayLast').onclick=()=>seekReplay(replay.history.length);
 $('#replayBack').onclick=()=>seekReplay(replay.ply-1);$('#replayForward').onclick=()=>seekReplay(replay.ply+1);
 $('#replaySeek').oninput=e=>seekReplay(+e.target.value);
 $('#replayPlay').onclick=()=>{if(replay.playing){pauseReplay();renderReplay();}else{if(replay.ply>=replay.history.length)replay.ply=0;replay.playing=true;renderReplay();playReplayStep();}};
 $('#replaySpeed').onchange=()=>{if(replay.playing){pauseReplay();replay.playing=true;playReplayStep();}};
 setReplayTabs(false);$('#keyMoments').hidden=false;
}
function setReplayTabs(active){
 $('#wholeReplay')?.setAttribute('aria-pressed',String(active));$('#keyMoments')?.setAttribute('aria-pressed',String(!active));
 document.querySelectorAll('#reviewDialog .review-controls').forEach(el=>el.classList.toggle('hidden',active));
 const caption=$('#reviewDialog .review-caption');if(caption){caption.dataset.guidedText ||= caption.textContent;caption.textContent=active?'蓝色路线：十字军；红色路线：明军。马的日字折线是走法示意，可以越子。回放还原本局实际走法；分析与重试请切回“关键时刻”。':caption.dataset.guidedText;}
}
function pauseReplay(){clearTimeout(replay.timer);clearTimeout(replay.frame);replay.epoch++;replay.playing=false;$('#reviewBoard .piece-anim')?.remove();if($('#replayPlay'))$('#replayPlay').textContent='播放';}
function leaveReplay(){pauseReplay();replay.active=false;$('#replayToolbar')?.classList.add('hidden');setReplayTabs(false);}
function seekReplay(ply){pauseReplay();replay.ply=Math.max(0,Math.min(replay.history.length,ply));renderReplay();}
function replayPosition(ply){
 if(!replay.history.length)return copyPosition(setupBoard(),castlingState());
 if(ply<replay.history.length){const h=replay.history[ply];return copyPosition(h.before.board,h.before.cast);}
 const h=replay.history.at(-1),pos=copyPosition(h.before.board,h.before.cast);applyMove(pos.board,h.move,pos.cast);return pos;
}
function replayNarration(h){
 const m=h.move,p=h.before.board[m.from],role=FACTIONS[h.color].roles[p.t];
 let text=`${h.color==='w'?'白方':'黑方'}${role}从 ${idx2name(m.from)} 行进到 ${idx2name(m.to)}。`;
 const captured=h.before.board[m.ep?m.to+(h.color==='w'?-8:8):m.to];
 if(m.castle)text+='这是王车易位：王与同侧的车在这一步同时调动。';
 else if(m.ep)text+='这是吃过路兵：对方刚走两格的兵从相邻位置退场。';
 else if(captured)text+=`${FACTIONS[captured.c].roles[captured.t]}被吃，退出这次对局。`;
 if(m.promotion)text+=`兵到达底线，升变为${PIECES[m.promotion].name}。`;
 if(p.t==='n')text+='马走日字，能够越过其他棋子。';
 const next=copyPosition(h.before.board,h.before.cast);applyMove(next.board,m,next.cast);
 if(inCheck(next.board,h.color==='w'?'b':'w'))text+='将军！另一方下一步必须先解除国王受到的攻击。';
 return text;
}
function renderReplay(){
 const pos=replayPosition(replay.ply),previous=replay.ply?replay.history[replay.ply-1]:null;
 renderChessBoard($('#reviewBoard'),pos.board,{lastMove:previous?[previous.move.from,previous.move.to]:null});
 if(previous)drawRoutes($('#reviewBoard'),[{...previous.move,color:previous.color==='w'?'#276a87':'#b7483b'}]);
 $('#reviewProgress').textContent=`全局回放 · ${replay.ply} / ${replay.history.length} 步（双方各走一步分别计数）`;
 $('#reviewMessage').textContent=previous?replayNarration(previous):'先看看这一局的起始局面。按“播放”，观察十字军与明军如何一步步展开。';
 $('#replaySeek').max=replay.history.length;$('#replaySeek').value=replay.ply;
 $('#replayPlay').textContent=replay.playing?'暂停':'播放';
 $('#replayFirst').disabled=$('#replayBack').disabled=replay.ply===0;
 $('#replayLast').disabled=$('#replayForward').disabled=replay.ply===replay.history.length;
 $('#reviewPrev').disabled=true;$('#reviewNext').disabled=true;
}
function playReplayStep(){
 if(!replay.playing||!replay.active||!$('#reviewDialog').open)return;
 if(replay.ply>=replay.history.length){pauseReplay();renderReplay();return;}
 const epoch=replay.epoch,h=replay.history[replay.ply],m=h.move,p=h.before.board[m.from];
 renderReplay();drawRoutes($('#reviewBoard'),[{...m,color:h.color==='w'?'#276a87':'#b7483b'}]);
 $('#reviewMessage').textContent=replayNarration(h);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!reduced){$('#reviewBoard [data-idx="'+m.from+'"] .piece')?.style.setProperty('visibility','hidden');animatePiece($('#reviewBoard'),m.from,m.to,p.t,p.c);}
 replay.frame=setTimeout(()=>{if(epoch!==replay.epoch||!replay.playing||!$('#reviewDialog').open)return;replay.ply++;renderReplay();if(replay.ply>=replay.history.length){pauseReplay();renderReplay();return;}replay.timer=setTimeout(playReplayStep,+$('#replaySpeed').value);},reduced?0:400);
}
/* END_GUIDED_LEARNING_V1 */
