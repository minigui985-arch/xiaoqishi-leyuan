/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,dist=path.resolve(root,'dist')+path.sep,out=path.resolve(root,'dist','friend-api');
if(!out.startsWith(dist))throw Error('拒绝清理工作区以外的目录');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const names=['friend-api.cjs','friend-server.cjs','feedback-store.cjs','data-paths.cjs','learning.js','小骑士乐园-统一主题版.html','COPYRIGHT','LICENSE','NOTICE'];
const files=[];
for(const name of names){const src=path.join(root,name),dest=path.join(out,name);fs.copyFileSync(src,dest);files.push({name,sha256:crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex')});}
fs.writeFileSync(path.join(out,'package.json'),JSON.stringify({private:true,name:'xiaoqishi-friend-api',version:'0.8.3',scripts:{start:'node friend-api.cjs'}},null,2));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({purpose:'单实例 HTTPS 反向代理后的好友棋局接口',files},null,2));
console.log(out);
