/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
// 公网网页和原生 App 使用公开 HTTPS 棋局服务；本地浏览器测试仍使用同源服务。
// 此处仅是公开地址，不放密钥。
const knightLocalBrowser=['localhost','127.0.0.1'].includes(location.hostname)
  && location.protocol==='http:'
  && window.Capacitor?.isNativePlatform?.()!==true;
window.KNIGHT_FRIEND_API_URL=window.KNIGHT_FRIEND_API_URL
  || (knightLocalBrowser?'':'https://api.xiaoqishileyuan.cn');
window.KNIGHT_PUBLIC_GAME_URL=window.KNIGHT_PUBLIC_GAME_URL||'https://minigui985-arch.github.io/xiaoqishi-leyuan/';
