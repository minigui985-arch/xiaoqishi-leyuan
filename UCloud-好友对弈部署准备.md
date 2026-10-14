# UCloud 美国云主机：好友对弈部署准备

当前只完成本地联调，尚未登录或修改用户的 UCloud 云主机，也没有公网棋局接口。GitHub Pages 继续托管网页；这台主机只运行 `/api/friend`，不可直接发布本地联调服务器 `friend-server.cjs`。

该 UCloud 主机同时承载其他项目的实时服务。部署前先确认现有服务的入口、监听端口和进程依赖，并验证其可用；未确认前不调整共享防火墙、反向代理或现有进程。小骑士 API 使用独立低权限账号、数据目录和本机监听端口，任何配置变更都只作用于小骑士服务。具体主机端口和运维检查结果只保存在不发布的运行记录中。

部署包由 `node build-friend-api.cjs` 生成到 `dist/friend-api`。它不包含运行数据、账号凭据或静态站点发布包。服务器需使用 Node.js 20 或更高版本；`friend-api.cjs` 默认只监听 `127.0.0.1:8788`，并使用 `KNIGHT_DATA_DIR` 保存 `rooms.json`。单实例运行，不可在多台机器/多个进程间共用同一 JSON 文件。
未设置 `KNIGHT_DATA_DIR` 时公网服务会拒绝启动，避免误把棋局数据写进 OpenClaw 或管理员的默认目录。
`deploy/ucloud/knight-friend.service` 和 `deploy/ucloud/Caddyfile.example` 是尚未应用的独立配置模板。安装前先检查主机实际 Node 路径、现有代理配置和 80／443 占用；安装后分别用 `systemd-analyze verify` 与 `caddy validate` 检查，再启动新服务。不要覆盖其他项目的 systemd 单元或代理站点。

公网入口须由主机上的 HTTPS 反向代理转发到本机 `8788`，例如 `https://api.xiaoqishileyuan.cn`；需要先确认域名 DNS、证书、UCloud 防火墙、主机系统及现有网站不会被覆盖。该子域名的 A 记录已配置并经权威 DNS 与公共解析器核验。若使用 Caddy 自动签发证书，其官方文档要求公网可到达 80 和 443；开放前须再次核对这两个端口没有现有服务，且代理只处理小骑士域名和 `/api/friend/` 路径。不向公网开放 8788。`KNIGHT_FRIEND_ORIGINS` 仅填写实际网页版来源，例如 `https://minigui985-arch.github.io`；原生容器真机联调再加入 `capacitor://localhost,http://localhost`。接口端无广告或自由文字聊天，房间 24 小时过期、最多 30 个同时存在。

反向代理必须**覆盖**客户端传来的 `X-Forwarded-For`，将其设为代理实际观测到的客户端地址，不能透传用户自填的值；API 仅信任本机代理传来的最后一个地址用于每分钟 180 次的限流。再在代理层设置连接数、请求速率、请求体大小和访问日志轮转，并在 UCloud 控制台设置流量/费用预警。以低权限专用账号运行 API，将 `KNIGHT_DATA_DIR` 指向与其他业务隔离、仅该账号可读写的目录；部署包不包含服务器上已有文件。公网 IP 可以告知部署人员，但不要发送密码、私钥、后台 Cookie 或含个人信息的服务器截图。

人数增长时，网页图片、脚本和离线资源仍由 GitHub Pages 分发；UCloud 承担房间创建、状态轮询和走棋请求，因而会产生其自身的出入站流量、CPU 和日志费用。当前最多 30 个活动房间是试运行上限，不是无限人数保障。需先观察实际账单，再决定是否提高上限或调整轮询频率。

控制台自带“登录”入口可打开远程终端。首次进入只做以下只读盘点，不贴出密码、密钥、完整环境变量或配置文件：`whoami; node --version; command -v nginx; command -v caddy; systemctl is-active firewalld; df -h /`。其中 `node --version` 或代理命令提示未找到也属正常；按实际输出决定安装方式。另在控制台查看套餐每月流量额度、已用量和超额计费规则，设置费用/流量告警。不要仅凭自动续费已开启就认定余额或服务连续性有保障。

公网接口健康检查、两部手机跨网络联调和费用监控通过后，再把 HTTPS **源站根地址**写入 `friend-config.js` 的 `KNIGHT_FRIEND_API_URL`，更新网页与原生内置资源。邀请码分享链接不得使用本机或临时预览地址。上线在线房间前同步更新隐私政策，明确所存棋局、短句、访问日志、保存期限和家长联系渠道。

本地验证：`node check-friends.cjs`、`node check-friend-api.cjs`、`node build-friend-api.cjs`、`node check-pwa.cjs`。这些结果不代表 UCloud 公网联调完成。
