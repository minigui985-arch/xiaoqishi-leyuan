const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=__dirname,config=JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'),'utf8'));
assert.equal(config.server?.url,undefined,'原生安装包不得依赖远程网页入口');
const web=path.resolve(root,config.webDir),read=p=>fs.readFileSync(path.join(root,p));
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const target of ['android/app/src/main/assets/public','ios/App/App/public']){
 for(const asset of ['index.html','assets/child_w_keyed.webp','assets/child_b_keyed.webp','assets/adult_w_keyed.webp','assets/adult_b_keyed.webp','vendor/stockfish/stockfish-18-lite-single.wasm','LICENSE','THIRD_PARTY_NOTICES.md']){
  assert.equal(digest(read(path.join(target,asset))),digest(fs.readFileSync(path.join(web,asset))),`${target}/${asset} 与发布资源不同步`);
 }
}
assert.match(read('android/app/src/main/java/cn/xiaoqishileyuan/mobile/MainActivity.java').toString(),/原始开发者：不疾不徐/);
assert.match(read('ios/App/App/AppDelegate.swift').toString(),/原始开发者：不疾不徐/);
assert.ok(read('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png').length>10000);
assert.ok(read('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png').length>10000);
console.log('PASS: Android/iOS 原生工程及内置资源一致；未配置远程 server.url。');
