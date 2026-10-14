/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
(()=>{
 let installPrompt;
 const ua=navigator.userAgent,standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const nativeApp=window.Capacitor?.isNativePlatform?.()===true;
 const isiOS=/iPad|iPhone|iPod/.test(ua),isHuawei=/HUAWEI|HONOR/i.test(ua),isSamsung=/SamsungBrowser|SM-/i.test(ua),isEmbedded=/MicroMessenger|QQ\//i.test(ua);
 if(!nativeApp&&'serviceWorker' in navigator&&isSecureContext)addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
 addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;document.querySelector('#installKnightApp')?.removeAttribute('hidden');});
 document.addEventListener('DOMContentLoaded',()=>{
  if(standalone||nativeApp)return;
  const home=document.querySelector('#view-home');if(!home)return;
  const button=document.createElement('button');button.id='installKnightApp';button.className='btn btn-primary mobile-install';button.textContent='安装到手机';
  const dialog=document.createElement('dialog');dialog.className='install-dialog';dialog.innerHTML='<h2>安装小骑士乐园</h2><p></p><button class="btn btn-primary">知道了</button>';
  const instruction=()=>{
   if(!isSecureContext)return '当前地址只能浏览测试，不能可靠安装。请使用正式 HTTPS 地址重新打开。';
   if(isEmbedded)return isiOS?'请点右上角菜单，选择“在 Safari 中打开”，再通过 Safari 的“分享—添加到主屏幕”安装。':'请点右上角菜单，选择“在浏览器打开”，再从系统浏览器菜单安装或添加到桌面。';
   if(isiOS)return '请使用 Safari 打开，点击“分享”，选择“添加到主屏幕”，开启“作为网页 App 打开”，再点“添加”。';
   if(isHuawei)return '请打开华为浏览器菜单，选择“添加至桌面”或“安装应用”；若没有该选项，请换用支持安装网页应用的浏览器。';
   if(isSamsung)return '请打开三星浏览器菜单，选择“添加页面到—主屏幕”或“安装应用”。';
   return '请打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。推荐使用最新版 Chrome、Edge 或其他支持网页应用安装的浏览器。';
  };
  document.body.append(dialog);home.append(button);dialog.querySelector('button').onclick=()=>dialog.close();
  button.onclick=async()=>{
   if(installPrompt){const prompt=installPrompt;installPrompt=undefined;await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')button.hidden=true;return;}
   dialog.querySelector('p').textContent=window.KnightI18n.text(instruction());dialog.showModal();
  };
  addEventListener('appinstalled',()=>{installPrompt=undefined;button.hidden=true;if(dialog.open)dialog.close();});
 });
})();
