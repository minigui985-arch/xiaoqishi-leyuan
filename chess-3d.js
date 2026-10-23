/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
/* Optional local 3D renderer. The existing rules and room API remain authoritative. */
(()=>{
 const boards=new Map(),allowed=new Set(['playBoardWrap','friendBoard','reviewBoard']);
 let module;
 const style=document.createElement('style');style.textContent=`
 .chess3d-tools{display:flex;position:relative;isolation:isolate;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}
 .chess3d-tools button{min-height:48px;min-width:48px}
 .chess3d-help{font-size:.82rem;color:var(--ink-2);flex-basis:100%;pointer-events:none}
 .board-wrap.chess3d-on{overflow:visible!important;aspect-ratio:1/1}
 .chess3d-on>.board-files,.chess3d-on>.board-inner{display:none!important}
 .chess3d-stage{position:absolute;inset:0;overflow:hidden;border-radius:14px;background:#252c35}
 .chess3d-stage canvas{display:block;width:100%;height:100%;touch-action:none;outline-offset:-4px}
 .chess3d-on>.route-svg{display:none}
 body.chess-immersive .chess3d-tools{visibility:visible!important;position:fixed;bottom:max(8px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:100002;background:var(--card);padding:4px 8px;border-radius:12px;margin:0;max-width:95vw;flex-wrap:nowrap}
 body.chess-immersive .chess3d-tools *{visibility:visible!important}
 body.chess-immersive .chess3d-help{display:none}
 `;document.head.append(style);
 function off(entry,message){
  entry.scene?.dispose();entry.scene=null;entry.wrap.classList.remove('chess3d-on');entry.button.textContent='3D 动画试制';entry.button.setAttribute('aria-pressed','false');
  entry.tools.querySelectorAll('[data-camera]').forEach(b=>b.hidden=true);
  entry.tools.querySelector('[data-camera="zoom"]').textContent='放大';
  entry.help.textContent=message||'动画试制预览；角色外形尚未通过三视图验收。';
 }
 async function toggle(entry){
  if(entry.scene){off(entry);return;}if(entry.loading)return;
  entry.loading=true;entry.button.disabled=true;entry.help.textContent='正在加载本机 3D 棋盘…';
  try{
   module=module||import('./chess-3d-scene.mjs');const {createScene}=await module;
   entry.scene=createScene(entry.wrap,()=>entry.opts,()=>off(entry,'3D 暂不可用，已返回平面棋盘。'));
   entry.wrap.classList.add('chess3d-on');entry.scene.update(entry.board,entry.opts,true);
   entry.button.textContent='平面棋盘';entry.button.setAttribute('aria-pressed','true');
   entry.tools.querySelectorAll('[data-camera]').forEach(b=>b.hidden=false);
   entry.help.textContent='试制角色，尚未定稿。点角色与目标格走棋；拖动旋转；方向键选格、回车确认。';
  }catch(error){off(entry,'此设备暂不能开启 3D，请使用平面棋盘。');console.warn('Knight 3D:',error.message);module=null;}
  finally{entry.loading=false;entry.button.disabled=false;}
 }
 window.Knight3D={
  render(wrap,board,opts){
   if(!allowed.has(wrap.id))return;
   let entry=boards.get(wrap);
   if(!entry){
    const tools=document.createElement('div');tools.className='chess3d-tools';
    tools.dataset.board=wrap.id;
    tools.innerHTML='<button type="button" class="btn btn-soft" aria-pressed="false">3D 动画试制</button><button type="button" class="btn btn-ghost" data-camera="reset" hidden>复位视角</button><button type="button" class="btn btn-ghost" data-camera="zoom" hidden>放大</button><span class="chess3d-help" role="status">动画试制预览；角色外形尚未通过三视图验收。</span>';
    wrap.before(tools);entry={wrap,tools,button:tools.firstElementChild,help:tools.lastElementChild};boards.set(wrap,entry);
    entry.button.onclick=()=>toggle(entry);
    tools.querySelector('[data-camera="reset"]').onclick=()=>{entry.scene?.reset();tools.querySelector('[data-camera="zoom"]').textContent='放大';};
    tools.querySelector('[data-camera="zoom"]').onclick=e=>{const zoom=entry.scene?.zoom();e.currentTarget.textContent=zoom?'缩小':'放大';};
   }
   entry.board=board?.map(p=>p?{...p}:null);entry.opts=opts;
   if(entry.scene){entry.wrap.classList.add('chess3d-on');entry.scene.update(entry.board,opts);}
  },
  selection(wrap,selected,selectable,captureSet){const entry=boards.get(wrap);if(!entry)return;entry.opts={...entry.opts,selected,selectable,captureSet};entry.scene?.highlight(entry.opts);},
  animate(wrap,from,to,move){return boards.get(wrap)?.scene?.animate(from,to,move)||false;},
  cancel(wrap){const entry=boards.get(wrap);if(entry?.scene)entry.scene.update(entry.board,entry.opts,true);},
  refreshSkins(){for(const entry of boards.values())if(entry.scene)entry.scene.update(entry.board,entry.opts,true);}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const entry of boards.values())window.Knight3D.cancel(entry.wrap);});
 new MutationObserver(()=>{for(const [wrap,entry]of boards){if(!wrap.querySelector('.board')){off(entry);entry.tools.remove();boards.delete(wrap);}else entry.tools.hidden=wrap.offsetWidth===0;}}).observe(document.body,{childList:true,subtree:true});
})();
