(function(){
 'use strict';
 const letterType={K:'k',Q:'q',R:'r',B:'b',N:'n'};
 function cleanSan(s){return s.replace(/[!?]+/g,'').replace(/[+#]+$/,'').replace(/e\.p\.?$/i,'');}
 function sanMove(san,board,color,cast){
  const text=cleanSan(san);
  if(/^(O-O|0-0)$/.test(text))return allLegalMoves(board,color,cast).find(m=>m.castle==='K');
  if(/^(O-O-O|0-0-0)$/.test(text))return allLegalMoves(board,color,cast).find(m=>m.castle==='Q');
  const match=text.match(/^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=([QRBN]))?$/);
  if(!match)throw new Error('无法识别走法 '+san);
  const [,piece,file,rank,capture,target,promotion]=match,type=letterType[piece]||'p',to=name2idx(target);
  const candidates=allLegalMoves(board,color,cast).filter(m=>{
   const p=board[m.from];return p?.t===type&&m.to===to&&(!file||m.from%8==='abcdefgh'.indexOf(file))&&(!rank||Math.floor(m.from/8)+1===+rank)&&(!promotion||m.promotion===letterType[promotion])&&(!capture||m.capture||m.ep);
  });
  if(candidates.length!==1)throw new Error(`${san} 对应 ${candidates.length} 个合法走法`);
  return candidates[0];
 }
 function parse(game){
  const board=setupBoard(),cast=castlingState(),history=[];let color='w';
  const tokens=game.moves.trim().split(/\s+/).map(t=>t.replace(/^\d+\.(?:\.\.)?/, '')).filter(Boolean);
  for(const san of tokens){const move=sanMove(san,board,color,cast);history.push({before:copyPosition(board,cast),move:{...move},color,san});applyMove(board,move,cast);color=color==='w'?'b':'w';}
  return history;
 }
 function install(){
  const main=document.querySelector('.app-main'),nav=document.querySelector('#bottomNav');if(!main||!nav||document.querySelector('#view-games'))return;
  main.insertAdjacentHTML('beforeend',`<section class="view hidden classics-view" id="view-games"><div class="page-head"><h2>历史名局 · 行军档案</h2><p>逐步回放真实公开对局，观察高手如何调兵、打开线路与保护国王</p></div><div class="classic-toolbar"><label>难度 <select id="classicLevel"><option value="">全部</option><option>入门</option><option>进阶</option><option>大师</option></select></label><label>主题 <select id="classicTheme"><option value="">全部主题</option></select></label><span id="classicCount"></span></div><div class="classic-feature"><b>观看方法</b><span>打开棋谱后，用“上一步 / 下一步”慢慢看，或播放完整行军路线。每一步仍使用十字军与明军人物皮肤演绎。</span></div><div class="classic-grid" id="classicGrid"></div></section>`);
  nav.insertAdjacentHTML('beforeend','<button class="nav-item" data-view="games" aria-label="历史名局"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M8 4v16M11 8h5M11 12h5"/></svg>名局</button>');
  const themes=[...new Set(KNIGHT_CLASSIC_GAMES.map(g=>g.theme))];document.querySelector('#classicTheme').insertAdjacentHTML('beforeend',themes.map(x=>`<option>${x}</option>`).join(''));
  document.querySelector('#classicLevel').onchange=render;document.querySelector('#classicTheme').onchange=render;render();
 }
 function render(){
  const grid=document.querySelector('#classicGrid');if(!grid)return;
  const level=document.querySelector('#classicLevel').value,theme=document.querySelector('#classicTheme').value;
  const games=KNIGHT_CLASSIC_GAMES.filter(g=>(!level||g.level===level)&&(!theme||g.theme===theme));
  document.querySelector('#classicCount').textContent=`${games.length} 局`;
  grid.innerHTML=games.map(g=>`<article class="classic-card"><div class="classic-year">${g.year}</div><div class="classic-tags"><span>${g.level}</span><span>${g.theme}</span></div><h3>${g.title}</h3><p class="classic-players"><b>${g.white}</b>　${g.result}　<b>${g.black}</b></p><p>${g.intro}</p><div class="classic-foot"><span>${g.opening}</span><button class="btn btn-primary btn-sm" data-game="${g.id}">打开棋谱</button></div></article>`).join('');
  grid.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>open(b.dataset.game));
 }
 function open(id){
  const game=KNIGHT_CLASSIC_GAMES.find(g=>g.id===id);if(!game)return;
  try{
   const history=parse(game);openReview({history,thinking:false});
   document.querySelector('#reviewTitle').textContent=`${game.title} · ${game.year}`;
   document.querySelector('#wholeReplay').click();
   document.querySelector('#reviewMessage').textContent=game.intro;
  }catch(e){console.error(e);toast('这份棋谱暂时无法解析：'+e.message,'error');}
 }
 window.KnightClassics=Object.freeze({parse,open,render,validateAll:()=>KNIGHT_CLASSIC_GAMES.map(g=>({id:g.id,plies:parse(g).length}))});
 install();
})();
