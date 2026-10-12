/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
// Read-only check of the actual public entry point; never creates a room.
const origin = process.argv[2] || 'https://xiaoqishi-leyuan-7pfiaiem.edgeone.cool/';
const base = new URL(origin);
if (base.protocol !== 'https:') throw new Error('请使用 HTTPS 游戏网址');
async function check(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(12000) });
  return { response, text: await response.text() };
}
(async () => {
  const home = await check('/');
  console.log(`首页：HTTP ${home.response.status} ${base.origin}/`);
  if (home.response.status === 401) {
    console.error('大陆网络访问平台域名需要 EdgeOne 控制台生成的限时预览链接；当前地址不是长期公开入口。');
    process.exitCode = 2;
    return;
  }
  if (!home.response.ok || !home.text.includes('小骑士乐园')) {
    console.error('首页未返回预期游戏内容。');
    process.exitCode = 1;
    return;
  }
  const manifest = await check('/deployment-info.json');
  if (!manifest.response.ok) {
    console.error(`部署清单：HTTP ${manifest.response.status}，无法确认线上版本。`);
    process.exitCode = 1;
    return;
  }
  const info = JSON.parse(manifest.text);
  console.log(`部署版本：${info.version}；构建时间：${info.generatedAt}`);
  console.log('注意：此检查不证明好友跨网络对弈可用；须另做两台真机创建、加入、走棋、断线恢复验收。');
})().catch(error => { console.error(`访问失败：${error.message}`); process.exitCode = 1; });
