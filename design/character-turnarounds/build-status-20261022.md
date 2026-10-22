# 国际版构建核对 · 2026-10-22

通过 GitHub Actions 与远端分支核对，最近成功的两端测试构建均对应 `codex/mobile-fixes-20261016` 的提交 `ef0709de2762a3d79978abe24f5cdc07949edef8`，构建时间为 2026-10-17 20:25（北京时间）。

- [Android test APK](https://github.com/minigui985-arch/xiaoqishi-leyuan/actions/runs/39032434737)：成功，`xiaoqishi-android-debug` 产物存在且未过期；它是测试 APK，不是商店正式发行的 AAB。
- [iOS simulator build](https://github.com/minigui985-arch/xiaoqishi-leyuan/actions/runs/39032434751)：成功，流程使用 `iphonesimulator` 与 `CODE_SIGNING_ALLOWED=NO`，未产生可供 iPhone 安装的签名 IPA。不能视为 TestFlight 交付或 iPhone 真机验收完成。

本轮角色图纸位于独立设计分支，未修改两端应用资源或发起新安装包构建。图纸不是已接入的 3D 游戏功能。上述证据只确认构建与产物状态，不能单凭构建成功断言所有近期修复都已完成真机验收，也不证明 Apple／Google 商店账号注册或上架完成。
