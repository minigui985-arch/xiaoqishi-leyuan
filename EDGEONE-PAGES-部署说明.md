# EdgeOne Pages 封闭测试部署

当前源代码仓库保持私有：`minigui985-arch/xiaoqishi-leyuan`。

## 构建设置

- 构建命令：`node build-edgeone.cjs`
- 输出目录：`dist/edgeone-pages`
- Node.js：18 或更高版本
- 首页：`index.html`

构建后运行 `node check-edgeone-deploy.cjs`。

部署目录只包含浏览器运行所需文件和版权、许可声明，不包含反馈数据、房间记录、日志、临时附件或密钥。

## 当前封闭测试范围

静态站点可测试课程、认识棋子、走法、历史名局、Stockfish 离线 AI、同机双人、复盘、PWA 安装和离线缓存。

跨网络好友房间与在线反馈调用 `/api/`，需要后续接入 EdgeOne Functions、CloudBase 或其他 HTTPS 后端。后端接入前，页面会明确显示服务暂不可用，不会把未保存的数据标记为成功。

## 发布控制

1. GitHub 仓库保持 Private。
2. EdgeOne 仅发布 `dist/edgeone-pages`。
3. 封闭测试阶段使用访问邀请码或平台保护链接。
4. 中国大陆固定域名启用大陆节点前完成 ICP 备案。
5. 公开发布前重新检查 Git 历史、许可证、隐私政策和儿童保护材料。
