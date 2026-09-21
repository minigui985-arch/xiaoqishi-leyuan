/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const dataRoot=path.resolve(process.env.KNIGHT_DATA_DIR||path.join(os.homedir(),'Documents','chatGPT','小骑士乐园-运行数据'));
const feedbackDir=path.join(dataRoot,'feedback'),roomFile=path.join(dataRoot,'rooms.json');
function ensureDataDirs(){fs.mkdirSync(feedbackDir,{recursive:true});return {dataRoot,feedbackDir,roomFile};}
module.exports={dataRoot,feedbackDir,roomFile,ensureDataDirs};
