/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'小骑士乐园-统一主题版.html');let html=fs.readFileSync(file,'utf8');
const start=html.indexOf('/* GUIDED_LEARNING_V1 */'),end=html.indexOf('/* END_GUIDED_LEARNING_V1 */');
if(start<0||end<start)throw Error('Missing learning module markers');
html=html.slice(0,start)+fs.readFileSync(path.join(__dirname,'learning.js'),'utf8')+html.slice(end+'/* END_GUIDED_LEARNING_V1 */'.length);
const marked=html.indexOf('/* LEARNING_STYLES */');
const cssStart=marked>=0?marked:Math.min(...['.coach-panel{','.replay-tabs,.replay-transport{'].map(s=>html.indexOf(s)).filter(i=>i>=0)),cssEnd=html.indexOf('</style>',cssStart);
if(cssStart<0||cssEnd<cssStart)throw Error('Missing learning styles');
html=html.slice(0,cssStart)+'/* LEARNING_STYLES */\n'+fs.readFileSync(path.join(__dirname,'learning.css'),'utf8')+'\n'+html.slice(cssEnd);
fs.writeFileSync(file,html);console.log('Learning source and styles synchronized.');
