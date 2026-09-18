# Stockfish.js 来源说明

- 组件：Stockfish.js 18.0.0（lite single-thread WebAssembly 版）
- 上游项目：https://github.com/nmrugg/stockfish.js
- 发布版本：https://github.com/nmrugg/stockfish.js/releases/tag/v18.0.0
- 上游 Stockfish 提交：`official-stockfish/Stockfish@cb3d4ee`
- 本地文件：`stockfish-18-lite-single.js`、`stockfish-18-lite-single.wasm`
- JavaScript SHA-256：`2278005057F381491F1C9BB3E44C9F5920B3A00BEF9759E33CC6582769A1F1FE`
- WASM SHA-256：`A8FBC05EC6920B56D7485826DCB02C5FFD2826BCBF751CF973046F237A9096F1`
- `stockfish-18-lite-bundle.js` 与 `stockfish-18-lite-factory.js` 由根目录构建脚本生成，供 `file://` 离线模式注入相同 WASM 与 UCI 模块。
- 许可证：GNU GPL v3，全文见同目录 `COPYING`

本项目通过浏览器 Web Worker 按 UCI 协议调用该独立引擎文件。修改或分发该组件时，须继续遵守 GPL v3，并提供相应完整源代码或有效的源代码获取方式。
