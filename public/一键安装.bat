@echo off
chcp 65001 >nul
title B站舆情分析助手 - 安装程序
echo ╔════════════════════════════════════════╗
echo ║     B站舆情分析助手 - 一键安装程序     ║
echo ╚════════════════════════════════════════╝
echo.
echo 正在打开浏览器扩展管理页面...
echo.
echo 请按以下步骤操作：
echo   1. 开启右上角的「开发者模式」
echo   2. 点击「加载已解压的扩展程序」
echo   3. 选择本文件夹（即解压后的文件夹）
echo.
echo 正在打开 Chrome...
start "" "chrome://extensions/"
echo 正在打开 Edge...
start "" "edge://extensions/"
echo.
echo ┌──────────────────────────────────────┐
echo │  提示：两个浏览器都打开后，           │
echo │  在你想使用的浏览器中完成安装。       │
echo │  如果浏览器未打开，请手动输入地址。   │
echo └──────────────────────────────────────┘
echo.
pause
