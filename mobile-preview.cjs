/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
const os=require('node:os');
const {server}=require('./friend-server.cjs');
const port=Number(process.env.KNIGHT_PORT)||8787,app=server({roomFile:require('./data-paths.cjs').roomFile});
app.listen(port,'0.0.0.0',()=>{
 const ips=Object.values(os.networkInterfaces()).flat().filter(item=>item&&item.family==='IPv4'&&!item.internal).map(item=>item.address);
 console.log('小骑士乐园手机联调已启动。电脑和手机需连接同一 Wi-Fi：');
 for(const ip of ips)console.log(`  http://${ip}:${port}`);
 console.log('按 Ctrl+C 停止。此地址仅用于局域网布局与触控测试；安装和离线验收请使用 HTTPS。');
});
