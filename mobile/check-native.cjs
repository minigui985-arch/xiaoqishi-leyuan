const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const root=__dirname,config=JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'),'utf8'));
assert.equal(config.server?.url,undefined,'原生安装包不得依赖远程网页入口');
assert.equal(config.appId,'com.pengchenggongxing.xiaoqishi.international','国际版必须与大陆版使用不同标识');
assert.match(fs.readFileSync(path.join(root,'android/app/build.gradle'),'utf8'),new RegExp(`applicationId "${config.appId.replaceAll('.','\\.')}"`));
assert.match(fs.readFileSync(path.join(root,'ios/App/App.xcodeproj/project.pbxproj'),'utf8'),new RegExp(`PRODUCT_BUNDLE_IDENTIFIER = ${config.appId.replaceAll('.','\\.')};`));
const web=path.resolve(root,config.webDir),read=p=>fs.readFileSync(path.join(root,p));
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const target of ['android/app/src/main/assets/public','ios/App/App/public']){
 for(const asset of ['index.html','privacy.html','support.html','assets/child_w_keyed.webp','assets/child_b_keyed.webp','assets/adult_w_keyed.webp','assets/adult_b_keyed.webp','vendor/stockfish/stockfish-18-lite-single.wasm','LICENSE','THIRD_PARTY_NOTICES.md']){
  assert.equal(digest(read(path.join(target,asset))),digest(fs.readFileSync(path.join(web,asset))),`${target}/${asset} 与发布资源不同步`);
 }
}
assert.match(read('android/app/src/main/java/com/pengchenggongxing/xiaoqishi/international/MainActivity.java').toString(),/原始开发者：不疾不徐/);
assert.match(read('android/app/src/main/java/com/pengchenggongxing/xiaoqishi/international/MainActivity.java').toString(),/package com\.pengchenggongxing\.xiaoqishi\.international;/);
assert.match(read('ios/App/App/AppDelegate.swift').toString(),/原始开发者：不疾不徐/);
assert.ok(read('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png').length>10000);
assert.ok(read('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png').length>10000);
const friendConfig=fs.readFileSync(path.resolve(root,'../friend-config.js'),'utf8');
for(const [protocol,hostname,expected] of [
 ['http:','localhost',''],
 ['https:','minigui985-arch.github.io','https://api.xiaoqishileyuan.cn'],
 ['https:','localhost','https://api.xiaoqishileyuan.cn'],
 ['capacitor:','localhost','https://api.xiaoqishileyuan.cn']
]){
 const context={window:{},location:{protocol,hostname}};
 vm.runInNewContext(friendConfig,context);
 assert.equal(context.window.KNIGHT_FRIEND_API_URL,expected,`${protocol}//${hostname} 好友接口配置错误`);
}
const unit=read('../deploy/ucloud/knight-friend.service').toString();
for(const origin of ['https://minigui985-arch.github.io','https://localhost','capacitor://localhost']){
 assert.ok(unit.includes(origin),`好友服务缺少 ${origin} 来源`);
}
console.log('PASS: Android/iOS 内置资源、原生好友接口来源及服务允许列表一致。');
