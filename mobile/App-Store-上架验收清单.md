# 小骑士乐园 iPhone 上架验收清单

更新：2026-10-16。范围：当前内置资源的 Capacitor iOS 测试工程；此清单不是已获准上架的声明。2026-10-14 的早期测试状态已按现有部署和公开资料修订。

| 验收关口 | 当前证据 | 放行条件 |
| --- | --- | --- |
| 可重复编译 | GitHub Actions 无签名 iOS 模拟器编译通过 | 每次候选版本重新编译并保存构建记录 |
| iPhone 真机 | 未完成 | 至少一台 iPhone 和一台 iPad 验证启动、棋盘触控、横竖屏、长局、离线 AI、语音、后台恢复、卸载重装和升级保档 |
| 网页版存档迁移 | 本地原型脚本已实现家长手动导出/导入与棋谱合法性校验，独立回归通过；目前尚未接入公开网页或原生候选包 | 先完成页面与打包接入，再在 iPhone Safari 主屏幕版与原生测试包之间实际迁移，确认课程、棋局和偏好完整，并验证错误文本不会覆盖原存档 |
| 线上功能边界 | UCloud 美国主机已部署 HTTPS 好友接口；三星 Android APK 与英国 iPhone Safari 网页版跨网对弈时，双方确认认输结果与复盘正常。iOS 原生包及断网恢复仍待真机复测 | 用候选安装包完成跨网对局、双方终局、断网恢复、儿童保护、数据留存及故障处理；商店截图只展示可用功能 |
| 儿童体验 | 无广告、无自由文字聊天；仍待完整验收 | 确定目标年龄段；检查所有外链、分享、反馈和可能购买入口，按所选分类落实家长门控 |
| 隐私与支持 | 中英双语测试期隐私和支持页面以公司邮箱 `xuerji@pengchenggongxing.com` 为主；公司邮箱已完成收发测试。原产品邮箱 `bujibuxushi@gmail.com` 仅作备用 | 核验公开 URL 持续可访问；按候选版本复核政策；填写 App Store Connect 隐私问卷 |
| 品牌与权利 | 源码保留开发者和公司版权；Stockfish 许可说明随包提供；国际版 Bundle ID 候选为 `com.pengchenggongxing.xiaoqishi.international` | 在组织账号核对 Bundle ID 可注册，确认商店名称、图标、截图、版权/素材权利和第三方许可证 |
| 国际化 | 棋局主界面已有多语资源；关于、反馈、好友提示仍以中文为主 | 按首发地区核对完整操作文案、商店资料和隐私政策语言，英语至少可独立完成核心流程 |
| 签名与分发 | 尚无公司 Apple Developer Program 账号 | 公司完成加入、证书及配置文件设置；生成已签名候选包，先通过 TestFlight 真实设备测试 |
| 商店审核 | 尚未提交 | 准备真实功能说明、年龄分级、支持与隐私 URL、审核所需演示账号/说明，再提交 Apple 审核；通过后才公开下载 |
| 中国大陆发行 | 域名备案及业务分类仍在办理与确认 | 单独核验中国大陆商店和业务资质要求，未确认前不声称可在该区上架 |

当前先用 iPhone Safari 主屏幕网页版与安卓测试包收集真实体验问题；原生测试工程继续同步开发。模拟器构建成功只证明代码可编译，不证明真机、儿童合规或商店审核通过。

官方依据：[Apple 开发者计划](https://developer.apple.com/help/account/membership/programs-overview/)、[App 隐私信息](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)、[App 审核准则](https://developer.apple.com/app-store/review/guidelines/)、[提交审核](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app)。

