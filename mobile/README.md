# 小骑士乐园国际版原生测试工程

本目录包含 Capacitor Android 与 iOS 工程。课程、棋谱、人物图和 Stockfish 随安装包内置；好友房间使用独立的美国 HTTPS 棋局服务。原生界面不通过 `server.url` 加载 GitHub Pages，离线课程与联网好友对弈需分别验收。当前为测试工程，不代表已通过 App Store 或 Google Play 审核。

## 构建

在本目录运行 `npm ci`，再运行 `npm run sync:android` 或 `npm run sync:ios`。每次修改网页资源后都要重新同步并重新构建安装包。`npm run check:native` 检查内置资源、原生来源与服务器允许列表。Android 工程目标 API 为 36；商店提交前仍须在当时核对 Google Play 的要求。

Android Studio 可打开 `android/` 并在真机安装调试包。仓库的 Android test APK 工作流只生成短期保留的 **debug APK**，不是商店签名的 AAB。上架需由应用主体确定最终包标识、签名密钥及 Google Play Console 账号，然后生成并验证正式 AAB。

iOS 工程需在 macOS 的 Xcode 打开 `ios/`，用应用主体的 Apple Developer 团队签名并在真机测试。仓库的 iOS simulator build 只验证无签名模拟器编译，不能安装到真实 iPhone；TestFlight 与 App Store 仍需 Apple Developer 账号和 App Store Connect 提交。

## 跨网络好友房间

打包配置为安卓 `https://localhost`、iOS `capacitor://localhost` 提供独立的 HTTPS API 地址。UCloud 上的 `knight-friend.service` 必须更新到允许这两个**精确来源**的版本，再在两台真机、不同网络下验收创建房间、邀请码加入、双方准备、走棋同步、断线恢复和 24 小时到期。邀请码与席位验证仍由服务器执行。不要把服务改为允许任意来源，也不要在客户端存放服务器密钥。

## 上架前

完成儿童用户和监护人流程、隐私政策与商店数据申报一致性、第三方许可、真实设备适配与无障碍检查；准备商店图、英文/中文描述、支持网址及审核账号说明。Android 与 iOS 均需实际签名包与真机记录。应用主体需确认最终名称和包标识；发布后不宜更改。中国大陆的域名、ICP 备案和可能的业务前置审批另行办理，不用把国际版提交进度误写成国内准入完成。
