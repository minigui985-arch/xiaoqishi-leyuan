# EdgeOne Pages 封闭测试部署

当前源代码仓库已公开：`minigui985-arch/xiaoqishi-leyuan`。EdgeOne 项目绑定 GitHub `main` 分支后可自动构建部署。

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

1. GitHub 仓库为公开状态，运行数据和密钥不得提交。
2. EdgeOne 仅发布 `dist/edgeone-pages`。
3. 封闭测试阶段使用访问邀请码或平台保护链接。
4. 中国大陆固定域名启用大陆节点前完成 ICP 备案。
5. 公开发布前重新检查 Git 历史、许可证、隐私政策和儿童保护材料。

## 大陆手机的长期入口

EdgeOne 平台项目域名在中国大陆网络需通过控制台生成限时预览链接访问。公司目前没有已备案的自有域名，因此暂不能把该预览链接当作长期 PWA 安装或分享地址。后续绑定已备案自有域名并指向生产环境，才做长期入口验收。

2026-10-12 实测项目域名 `https://xiaoqishi-leyuan-7pfiaiem.edgeone.cool/` 返回 HTTP 401，响应头提示 `eo_time missing`。控制台显示“域名已生效”只代表域名配置生效，不代表大陆用户能直接打开。可运行 `node check-edgeone-live.cjs` 复查；获得固定自有域名后也可将网址作为参数传入。
