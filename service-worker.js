/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
const CACHE='knight-mobile-0.8.3-opposite-status';
const APP='./小骑士乐园-统一主题版.html';
const CORE=[
  APP,'./manifest.webmanifest','./pwa.js','./app-info.js','./i18n.js','./privacy.html','./support.html','./transfer-save.js',
  './locales/zh-CN.js','./locales/en-US.js','./locales/ru-RU.js','./locales/es-ES.js','./locales/de-DE.js','./locales/fr-FR.js','./locales/pt-BR.js','./locales/hi-IN.js','./locales/ja-JP.js','./locales/ko-KR.js','./locales/content.js','./battle-save.js',
  './friend-config.js','./friend-client.js','./feedback-client.js','./immersive.js','./classic-games.css',
  './classic-games.js','./classic-games-data.js','./stockfish-engine.js',
  './icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png',
  './assets/child_w_keyed.webp','./assets/child_b_keyed.webp',
  './assets/adult_w_keyed.webp','./assets/adult_b_keyed.webp',
  './vendor/stockfish/stockfish-18-lite-single.js',
  './vendor/stockfish/stockfish-18-lite-single.wasm',
  './vendor/stockfish/stockfish-18-lite-bundle.js',
  './vendor/stockfish/stockfish-18-lite-factory.js'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('knight-mobile-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==location.origin||url.pathname.includes('/api/'))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(async response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(APP,copy));return response;}return await caches.match(APP)||response;}).catch(()=>caches.match(APP)));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));return response;})));
});

