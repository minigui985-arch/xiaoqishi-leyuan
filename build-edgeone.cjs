/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = __dirname;
const output = path.resolve(root, 'dist', 'edgeone-pages');
const distRoot = path.resolve(root, 'dist') + path.sep;
if (!output.startsWith(distRoot)) throw new Error('拒绝清理工作区以外的目录');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const runtimeFiles = [
  'chess-3d.js','chess-3d-scene.mjs','vendor/three/three.module.js','vendor/three/three.core.js','vendor/three/LICENSE','vendor/three/SOURCE.md',
  'manifest.webmanifest', 'service-worker.js', 'pwa.js', 'app-info.js', 'i18n.js',
  'locales/zh-CN.js', 'locales/en-US.js','locales/ru-RU.js','locales/es-ES.js','locales/de-DE.js','locales/fr-FR.js','locales/pt-BR.js','locales/hi-IN.js', 'locales/ja-JP.js', 'locales/ko-KR.js', 'locales/content.js',
  'battle-save.js', 'transfer-save.js', 'friend-config.js', 'friend-client.js', 'feedback-client.js', 'immersive.js',
  'learning.js', 'classic-games.css', 'classic-games.js', 'classic-games-data.js',
  'stockfish-engine.js', 'privacy.html', 'support.html', 'COPYRIGHT', 'AUTHORS.md', 'NOTICE', 'LICENSE',
  'COMMERCIAL-LICENSE.md', 'THIRD_PARTY_NOTICES.md',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'assets/child_w_keyed.webp', 'assets/child_b_keyed.webp',
  'assets/adult_w_keyed.webp', 'assets/adult_b_keyed.webp',
  'vendor/stockfish/stockfish-18-lite-single.js',
  'vendor/stockfish/stockfish-18-lite-single.wasm',
  'vendor/stockfish/stockfish-18-lite-bundle.js',
  'vendor/stockfish/stockfish-18-lite-factory.js',
  'vendor/stockfish/COPYING', 'vendor/stockfish/SOURCE.md'
];
function copy(relative, target = relative) {
  const source = path.join(root, relative);
  const destination = path.join(output, target);
  if (!fs.existsSync(source)) throw new Error(`缺少发布文件：${relative}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
for (const file of runtimeFiles) copy(file);
copy('company-site/index.html');
copy('小骑士乐园-统一主题版.html', 'index.html');
copy('小骑士乐园-统一主题版.html');
const files = [];
function inventory(directory = output) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) inventory(absolute);
    else {
      const relative = path.relative(output, absolute).replaceAll('\\', '/');
      files.push({ file: relative, bytes: fs.statSync(absolute).size,
        sha256: crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex') });
    }
  }
}
inventory();
fs.writeFileSync(path.join(output, 'deployment-info.json'), JSON.stringify({
  product: '小骑士乐园', version: '0.8.3-friend-beta',
  target: 'Tencent EdgeOne Pages static closed beta', generatedAt: new Date().toISOString(),
  developer: '不疾不徐', copyright: '合肥市朋程共行电子商务有限责任公司',
  notes: '国际网页部署支持课程、名局、离线对弈、本机双人和经 HTTPS API 邀请的好友房间；在线反馈收件暂未启用。', files
}, null, 2));
console.log(output);
