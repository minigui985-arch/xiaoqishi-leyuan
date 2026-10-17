/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
// Offline, parent-operated transfer between the home-screen web app and native app.
(()=>{
 const keys=['chessknight_save_v1','knightBattleV1','chessSkinMode','knight-locale','knight-ai-level','knight-rule-mode'];
 const locales=['zh-CN','en-US','ru-RU','es-ES','de-DE','fr-FR','pt-BR','hi-IN','ja-JP','ko-KR'];
 const read=(key)=>{try{return localStorage.getItem(key)}catch{return null}};
 function parseBattle(value){
  if(value===null)return null;
  if(!value||value.version!==3||!Array.isArray(value.moves)||value.moves.length>2000||typeof value.over!=='boolean'||typeof value.human!=='boolean'||(value.endRaw!==null&&(typeof value.endRaw!=='string'||value.endRaw.length>80)))throw Error('棋局存档格式不正确');
  const board=setupBoard(),cast=castlingState();let turn='w';
  for(const input of value.moves){
   if(!input||!Number.isInteger(input.from)||!Number.isInteger(input.to)||input.from<0||input.from>63||input.to<0||input.to>63||(input.promotion!==undefined&&!['q','r','b','n'].includes(input.promotion)))throw Error('棋局包含无效走法');
   const move=allLegalMoves(board,turn,cast).find(candidate=>sameMove(candidate,input));
   if(!move)throw Error('棋局包含不合法走法');
   applyMove(board,move,cast);turn=turn==='w'?'b':'w';
  }
  return {version:3,moves:value.moves.map(m=>({from:m.from,to:m.to,...(m.promotion?{promotion:m.promotion}:{})})),over:value.over,human:value.human,endRaw:value.endRaw};
 }
 function validate(text){
  if(text.length>150000)throw Error('迁移文本过长');
  let data;try{data=JSON.parse(text)}catch{throw Error('不是有效的迁移文本')}
  if(data?.format!=='knight-save-v1'||!data.progress||!data.settings)throw Error('迁移版本或内容不正确');
  const p=data.progress,s=data.settings;
  if(!Number.isSafeInteger(p.stars)||p.stars<0||!Number.isSafeInteger(p.wins)||p.wins<0||typeof p.lessons!=='object'||p.lessons===null||['board','pieces','moves','play'].some(k=>typeof p.lessons[k]!=='boolean')||typeof p.muted!=='boolean'||typeof p.fastMode!=='boolean')throw Error('学习进度格式不正确');
  if(!s||typeof s!=='object'||!['child','adult'].includes(s.skin)||!locales.includes(s.locale)||!['basic','master'].includes(s.ai)||!['explore','tournament'].includes(s.rule))throw Error('偏好设置格式不正确');
  return {progress:{stars:p.stars,wins:p.wins,lessons:Object.fromEntries(['board','pieces','moves','play'].map(k=>[k,p.lessons[k]])),muted:p.muted,fastMode:p.fastMode},battle:parseBattle(data.battle??null),settings:s};
 }
 function exportText(){
  save();saveBattle();
  const raw=read('knightBattleV1');
  return JSON.stringify({format:'knight-save-v1',createdAt:new Date().toISOString(),progress:{stars:S.stars,wins:S.wins,lessons:Object.fromEntries(['board','pieces','moves','play'].map(k=>[k,S.lessons[k]===true])),muted:S.muted,fastMode:S.fastMode},battle:raw?JSON.parse(raw):null,settings:{skin:read('chessSkinMode')==='adult'?'adult':'child',locale:locales.includes(read('knight-locale'))?read('knight-locale'):KnightI18n.locale,ai:read('knight-ai-level')==='master'?'master':'basic',rule:read('knight-rule-mode')==='tournament'?'tournament':'explore'}});
 }
 function importText(text){
  const data=validate(text),values=[JSON.stringify(data.progress),data.battle?JSON.stringify(data.battle):null,data.settings.skin,data.settings.locale,data.settings.ai,data.settings.rule];
  if(!confirm(`将用迁移存档覆盖当前设备的学习进度和棋局（${data.battle?.moves.length||0} 步）。请确认旧存档已另行保留。继续吗？`))return false;
  const previous=keys.map(read);
  try{keys.forEach((key,i)=>values[i]===null?localStorage.removeItem(key):localStorage.setItem(key,values[i]));}
  catch(error){keys.forEach((key,i)=>{try{previous[i]===null?localStorage.removeItem(key):localStorage.setItem(key,previous[i])}catch{}});throw Error('写入失败，已尝试恢复原存档：'+error.message)}
  location.reload();return true;
 }
 document.addEventListener('DOMContentLoaded',()=>{
  const home=document.querySelector('#view-home');if(!home)return;
  const button=document.createElement('button');button.className='btn btn-ghost';button.textContent='迁移存档';home.append(button);
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','迁移学习存档');dialog.style.cssText='width:min(92vw,560px);max-height:85vh;overflow:auto;padding:24px;border:1px solid var(--card-border);border-radius:20px;background:var(--card);color:var(--ink)';
  dialog.innerHTML='<h2>迁移学习存档</h2><p>请由家长操作：先在旧设备或桌面网页版生成并复制迁移文本，再到新 App 粘贴导入。文本只在设备间复制，不会自动上传；请勿转发给其他人。</p><div class="coach-actions"><button class="btn btn-soft" id="saveExport">生成迁移文本</button><button class="btn btn-soft" id="saveCopy">复制文本</button></div><textarea id="saveText" rows="7" maxlength="150000" style="display:block;box-sizing:border-box;width:100%;margin:12px 0" aria-label="迁移文本" placeholder="在这里粘贴旧设备上的迁移文本"></textarea><p id="saveStatus" role="status" aria-live="polite"></p><div class="coach-actions"><button class="btn btn-primary" id="saveImport">导入并重启</button><button class="btn btn-ghost" id="saveClose">关闭</button></div>';
  document.body.append(dialog);const area=dialog.querySelector('#saveText'),status=dialog.querySelector('#saveStatus');
  button.onclick=()=>dialog.showModal();dialog.querySelector('#saveClose').onclick=()=>dialog.close();
  dialog.querySelector('#saveExport').onclick=()=>{try{area.value=exportText();area.select();status.textContent='迁移文本已生成。请复制后在新 App 导入。'}catch(e){status.textContent='生成失败：'+e.message}};
  dialog.querySelector('#saveCopy').onclick=async()=>{if(!area.value){status.textContent='请先生成迁移文本。';return}try{await navigator.clipboard.writeText(area.value);status.textContent='已复制到剪贴板。'}catch{area.select();status.textContent='自动复制不可用，请长按文本选择“复制”。'}};
  dialog.querySelector('#saveImport').onclick=()=>{try{importText(area.value.trim())}catch(e){status.textContent='导入失败：'+e.message}};
 });
 window.KnightSaveTransfer=Object.freeze({validate,exportText});
})();

