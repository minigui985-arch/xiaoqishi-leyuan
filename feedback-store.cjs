/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
const fs=require('node:fs'),path=require('node:path');
const categories=['问题反馈','功能建议','体验评价'];
function saveFeedback(input,dir=require('./data-paths.cjs').feedbackDir){
 if(!input||typeof input!=='object'||!categories.includes(input.category)||typeof input.text!=='string'||input.text.trim().length<5||input.text.length>1000||typeof input.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id))throw Error('请填写5至1000字的反馈，并选择反馈类型');
 const item={id:input.id.toLowerCase(),category:input.category,text:input.text.trim(),version:typeof input.version==='string'&&/^[a-z0-9.-]{1,40}$/i.test(input.version)?input.version:'unknown',page:['home','board','pieces','moves','play','games'].includes(input.page)?input.page:'unknown',createdAt:new Date().toISOString(),status:'待梳理'};
 fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,item.id+'.json');
 if(fs.existsSync(file)){const old=JSON.parse(fs.readFileSync(file,'utf8'));if(old.text!==item.text||old.category!==item.category)throw Error('反馈编号冲突，请重新提交');return {id:old.id,saved:true};}
 if(fs.readdirSync(dir).filter(n=>n.endsWith('.json')).length>=1000)throw Error('本地反馈箱已满，请导出反馈交给开发者');
 fs.writeFileSync(file,JSON.stringify(item,null,2),{flag:'wx'});return {id:item.id,saved:true};
}
module.exports={saveFeedback};
