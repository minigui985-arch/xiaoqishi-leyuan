/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
// 仅供反向代理后的独立 HTTPS 棋局服务使用；Node 进程只监听本机。
const {server}=require('./friend-server.cjs');
if(!process.env.KNIGHT_DATA_DIR)throw Error('请先设置独立的 KNIGHT_DATA_DIR 棋局数据目录');
const {roomFile}=require('./data-paths.cjs');
const origins=(process.env.KNIGHT_FRIEND_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
if(!origins.length||origins.some(s=>{try{const u=new URL(s);return s!=='capacitor://localhost'&&(u.origin!==s||u.protocol!=='https:'&&!/^http:\/\/localhost(?::\d+)?$/.test(s))}catch{return true}}))throw Error('请设置精确的 KNIGHT_FRIEND_ORIGINS 来源列表');
const port=Number(process.env.KNIGHT_FRIEND_PORT||8788);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('端口不正确');
server({apiOnly:true,roomFile,allowedOrigins:origins}).listen(port,'127.0.0.1',()=>console.log(`棋局 API 已在本机 ${port} 端口启动；需由 HTTPS 反向代理提供公网入口。`));
