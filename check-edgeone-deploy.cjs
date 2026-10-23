/* EdgeOne Pages 静态发布包校验 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;
const output = path.join(root, 'dist', 'edgeone-pages');
const required = ['index.html','manifest.webmanifest','service-worker.js','pwa.js','friend-config.js','i18n.js','locales/zh-CN.js','locales/en-US.js','locales/ru-RU.js','locales/es-ES.js','locales/de-DE.js','locales/fr-FR.js','locales/pt-BR.js','locales/hi-IN.js','locales/ja-JP.js','locales/ko-KR.js','locales/content.js','icons/icon-192.png','icons/icon-512.png','assets/child_w_keyed.webp','assets/child_b_keyed.webp','assets/adult_w_keyed.webp','assets/adult_b_keyed.webp','vendor/stockfish/stockfish-18-lite-single.wasm','deployment-info.json'];
const forbidden = [/\.env(?:\.|$)/i,/rooms\.json$/i,/feedback-records/i,/\.log$/i,/codex-remote/i];
const failures = [];
required.push('chess-3d.js','chess-3d-scene.mjs','vendor/three/three.module.js','vendor/three/three.core.js','vendor/three/LICENSE');
for (const file of required) { const full=path.join(output,file); if(!fs.existsSync(full)||fs.statSync(full).size===0) failures.push(`缺少或为空：${file}`); }
function walk(directory=output){ for(const entry of fs.readdirSync(directory,{withFileTypes:true})){ const full=path.join(directory,entry.name); if(entry.isDirectory()) walk(full); else { const relative=path.relative(output,full).replaceAll('\\','/'); if(forbidden.some(rule=>rule.test(relative))) failures.push(`不应发布：${relative}`); } } }
if(fs.existsSync(output)) walk();
const html=fs.existsSync(path.join(output,'index.html'))?fs.readFileSync(path.join(output,'index.html'),'utf8'):'';
for(const marker of ['manifest.webmanifest','i18n.js','locales/ru-RU.js','friend-config.js','friend-client.js','stockfish-engine.js']) if(!html.includes(marker)) failures.push(`首页未引用：${marker}`);
if(!fs.readFileSync(path.join(output,'pwa.js'),'utf8').includes('service-worker.js')) failures.push('PWA 脚本未注册 service-worker.js');
const cachedAssets=vm.runInNewContext(fs.readFileSync(path.join(root,'service-worker.js'),'utf8')+'\nCORE',{self:{addEventListener(){}}});
for(const cached of cachedAssets){
 const file=cached.replace(/^\.\//,''),built=path.join(output,file);
 if(!fs.existsSync(built))failures.push(`离线缓存文件未打包：${file}`);
 else if(!fs.readFileSync(built).equals(fs.readFileSync(path.join(root,file))))failures.push(`离线缓存资源落后于源码：${file}`);
}
if(failures.length){ console.error(failures.join('\n')); process.exit(1); }
console.log('EdgeOne Pages 发布包校验通过');
