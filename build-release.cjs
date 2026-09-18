/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,out=path.join(root,'dist','knight-0.4.7-local-'+Date.now());fs.mkdirSync(out,{recursive:true});
const files=['小骑士乐园-统一主题版.html','friend-client.js','friend-server.cjs','battle-save.js','feedback-client.js','feedback-store.cjs','data-paths.cjs','app-info.js','immersive.js','import-feedback.cjs','learning.js','AUTHORS.md','COPYRIGHT','LICENSE','NOTICE','COMMERCIAL-LICENSE.md','署名与许可状态.md','0.4.0-交付与待办.md','0.4.5-课程闭环验收.md'];
files.push(...fs.readdirSync(path.join(root,'assets')).filter(n=>/^[a-z_]+\.png$/.test(n)).map(n=>'assets/'+n));
const manifest=[];for(const name of files){const src=path.join(root,name),dest=path.join(out,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(src,dest);manifest.push({file:name,sha256:crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex')});}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:'0.4.7-local',target:'local-testing-only',license:'LicenseRef-Knight-Noncommercial-1.0 OR separate paid commercial license',files:manifest},null,2));console.log(out);
