@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo 未找到 Node.js，请先安装 Node.js 18 或更高版本。& pause & exit /b 1)
node mobile-preview.cjs
pause
