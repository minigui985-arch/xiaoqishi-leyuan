/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
// The HTML is now the canonical source; it runs directly without a bundler.
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'小骑士乐园-统一主题版.html');
const html=fs.readFileSync(file,'utf8');
for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(match[1]);
for(const mode of ['adult','child'])for(const color of ['w','b']){if(!fs.existsSync(path.join(__dirname,'assets',mode+'_'+color+'_keyed.png')))throw Error('Missing art');}
console.log('PASS: canonical HTML syntax and all skin assets. No desktop source dependency.');
