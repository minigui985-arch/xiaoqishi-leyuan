/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
const fs=require('node:fs'),path=require('node:path'),{saveFeedback}=require('./feedback-store.cjs');
if(!process.argv[2]){console.error('用法：node import-feedback.cjs <反馈JSON文件或文件夹>');process.exitCode=1;}
else{const source=path.resolve(process.argv[2]);const files=fs.statSync(source).isDirectory()?fs.readdirSync(source).filter(n=>n.endsWith('.json')).map(n=>path.join(source,n)):[source];let ok=0;for(const file of files){try{if(fs.statSync(file).size>16384)throw Error('文件过大');saveFeedback(JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')));ok++;}catch(e){console.error(path.basename(file)+': '+e.message);process.exitCode=1;}}console.log('已导入/去重 '+ok+' 条；原文件未改动。');}
