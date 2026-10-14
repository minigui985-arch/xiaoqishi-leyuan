# 小骑士乐园移动 App 测试工程

本目录已生成 Android Studio 工程 `android/` 与 Xcode 工程 `ios/`，使用 Capacitor 将同一份棋局网页资源打包到原生容器。静态课程、名局、同机对弈与本机 AI 随安装包提供；跨网络好友房间仍需要独立的 HTTPS 棋局服务，当前 GitHub Pages 静态站点没有这项服务。两个工程已换用小骑士乐园标识与启动画面。

当前包标识 `cn.xiaoqishileyuan.mobile` 是测试工程标识。建立商店记录前，应由版权主体确认最终包标识和应用名称；发布后不宜变更包标识。

## 安卓

在本目录运行 `npm ci`，再运行 `npm run sync:android`。使用 Android Studio 打开 `android/`，安装 SDK 后在真机运行。此电脑目前未安装 Android Studio/SDK，因此尚未生成、签名或实测 APK/AAB。

仓库的 `Android test APK` 工作流会构建短期保存的 **debug APK**，供开发测试下载；它不是商店签名包，也不代表已完成真机验收。

## 苹果

在本目录运行 `npm ci`，再运行 `npm run sync:ios`。使用 macOS 上的 Xcode 打开 `ios/`，配置团队、签名和真机运行；TestFlight 与 App Store 提交需要 Apple Developer 账号。Windows 无法在本机完成 iOS 签名与真机编译。

每次修改网页程序后，重新运行对应平台的 `sync` 命令，再从原生工程构建。原生容器加载随包附带的资源，不使用 `server.url` 指向 GitHub Pages。`pwa.js` 在原生容器内隐藏“安装到手机”按钮；浏览器 PWA 仍保留该入口。Android `versionName` 与 iOS `MARKETING_VERSION` 当前为 0.8.1，商店构建前还需递增构建号。

公开商店发布前需完成双平台真机验收、应用隐私与儿童保护材料、第三方代码许可核对，并确认线上好友对弈的云端服务。此目录是开发测试工程，不代表已获得商店审核或已上线。
