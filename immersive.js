/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
document.addEventListener('DOMContentLoaded',()=>{
 const style=document.createElement('style');style.textContent=`
 body.chess-immersive{overflow:hidden!important;background:radial-gradient(ellipse at 0% 50%,rgba(155,122,59,.20),transparent 38%),radial-gradient(ellipse at 100% 50%,rgba(148,54,40,.18),transparent 38%),repeating-linear-gradient(22deg,transparent 0 48px,rgba(126,102,72,.035) 49px 50px),var(--bg)!important}
 body.chess-immersive *{visibility:hidden!important}
 body.chess-immersive .immersive-parent{transform:none!important;filter:none!important;contain:none!important;overflow:visible!important}
 body.chess-immersive .immersive-board,body.chess-immersive .immersive-board *{visibility:visible!important}
 body.chess-immersive .immersive-board{position:fixed!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:min(calc(100vw - 18px),calc(100dvh - 38px))!important;max-width:none!important;margin:0!important;z-index:100000!important}
 body.chess-immersive .immersive-board .board-inner{transform:none!important}
 body.chess-immersive #exitImmersive{visibility:visible!important;position:fixed;right:6px;top:6px;z-index:100001;padding:6px 10px;font-size:12px;background:var(--card);border:1px solid var(--card-border);border-radius:12px;color:var(--ink)}
 body:not(.chess-immersive) #exitImmersive{display:none}
 .immersive-flank{display:none}
 body.chess-immersive::before,body.chess-immersive::after{content:'';position:fixed;top:16%;bottom:16%;width:22vw;pointer-events:none;opacity:.12;border-top:2px solid var(--west);border-bottom:2px solid var(--west);border-radius:50%;visibility:visible;z-index:0}
 body.chess-immersive::before{left:-8vw;transform:rotate(-14deg)}body.chess-immersive::after{right:-8vw;transform:rotate(14deg);border-color:var(--east)}
 @media(min-aspect-ratio: 3/2) and (min-width:1000px){
 body.chess-immersive .immersive-flank,body.chess-immersive .immersive-flank *{visibility:visible!important}
 body.chess-immersive .immersive-flank{display:block;position:fixed;top:64px;bottom:32px;width:calc((100vw - (100dvh - 38px))/2 - 36px);overflow:auto;z-index:100000;padding:18px 12px;background:var(--card);border:1px solid var(--card-border);border-radius:24px;text-align:center}
 .immersive-flank.w{left:16px;border-top:4px solid var(--west)}.immersive-flank.b{right:16px;border-top:4px solid var(--east)}
 .flank-portrait{width:min(150px,85%);margin:20px auto}.flank-portrait svg{width:100%;height:auto}
 .flank-turn{padding:10px;border-radius:12px;background:var(--bg-deep);margin:16px 0;font-weight:700}
 .flank-captures{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;margin-top:12px}.flank-captures svg{width:42px;height:42px}
 .immersive-flank p{font-size:.85rem;color:var(--ink-2)}
 }
 `;document.head.append(style);
 const exit=document.createElement('button');exit.id='exitImmersive';exit.textContent='退出沉浸';exit.title='退出沉浸模式（Esc）';document.body.append(exit);
 const flanks=['w','b'].map(color=>{const el=document.createElement('aside');el.className='immersive-flank '+color;el.setAttribute('aria-label',color==='w'?'十字军战况':'明军战况');document.body.append(el);return el;});
 let friendState=null,hudKey='';
 document.addEventListener('knight-friend-state',e=>{friendState=e.detail;updateHud();});
 function updateHud(){
  if(!active)return;const friendly=active.id==='friendBoard',state=friendly?friendState:battle;if(!state)return;
  const captured={w:[],b:[]};if(friendly){const b=setupBoard(),c=castlingState();for(const m of state.history||[]){const cap=applyMove(b,m,c);if(cap)captured[m.color].push(cap);}}else Object.assign(captured,battle.captured);
  const over=friendly?!!state.result:state.over,key=JSON.stringify([friendly,state.turn,over,state.ready,captured,window.__chessSkinMode]);if(key===hudKey)return;hudKey=key;
  flanks.forEach((el,i)=>{const color=i?'b':'w',name=i?'明军':'十字军',waiting=friendly&&(!state.ready?.w||!state.ready?.b);const status=over?'本局已结束':waiting?'等待双方准备':state.turn===color?'正在走棋':'等待对方走棋';
   el.innerHTML='<p>'+ (i?'BLACK · 黑方':'WHITE · 白方')+'</p><h2>'+name+'</h2><div class="flank-portrait">'+pieceSVG('k',color)+'</div><div class="flank-turn" role="status">'+status+'</div><h3>已吃棋子 · '+captured[color].length+'</h3><div class="flank-captures">'+captured[color].map(p=>pieceSVG(p.t,p.c)).join('')+'</div>'+(!captured[color].length?'<p>暂时没有吃子</p>':'');});
 }
 let active=null,trigger=null,native=false,scroll=0;
 function leave(){if(!active)return;active.classList.remove('immersive-board');document.querySelectorAll('.immersive-parent').forEach(e=>e.classList.remove('immersive-parent'));document.body.classList.remove('chess-immersive');active=null;window.scrollTo(0,scroll);trigger?.focus({preventScroll:true});if(native&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});native=false;}
 async function enter(board,button){if(active)leave();scroll=window.scrollY;active=board;trigger=button;board.classList.add('immersive-board');for(let p=board.parentElement;p&&p!==document.body;p=p.parentElement)p.classList.add('immersive-parent');document.body.classList.add('chess-immersive');hudKey='';updateHud();exit.focus({preventScroll:true});try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();if(active)native=true;else if(document.fullscreenElement)await document.exitFullscreen();}}catch{/* Page-only immersion remains available when full screen is denied. */}}
 exit.onclick=leave;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();leave();}});document.addEventListener('fullscreenchange',()=>{if(native&&!document.fullscreenElement)leave();});
 function mount(){updateHud();if(active&&(!active.isConnected||document.querySelector('dialog[open]')))leave();for(const id of ['playBoardWrap','friendBoard']){const board=document.getElementById(id);if(!board?.querySelector('.board'))continue;if(document.querySelector('[data-immerse="'+id+'"]'))continue;const b=document.createElement('button');b.className='btn btn-primary';b.dataset.immerse=id;b.textContent='沉浸模式';b.onclick=()=>enter(board,b);const controls=id==='playBoardWrap'?document.querySelector('#playPanel .play-status > div:last-child'):document.getElementById('friendShare')?.parentElement;if(controls)controls.append(b);}}
 new MutationObserver(mount).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});mount();
});
