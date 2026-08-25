@echo off
chcp 65001 >nul
title 短视频舆情分析助手 - 一键安装

echo ============================================
echo    短视频舆情分析助手 - 一键安装
echo ============================================
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\YuqingAssistant"

echo [1/4] 正在解压文件到 %INSTALL_DIR% ...
if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%"
mkdir "%INSTALL_DIR%" 2>nul

powershell -NoProfile -Command "Expand-Archive -Path '%~dp0短视频舆情分析助手.zip' -DestinationPath '%INSTALL_DIR%' -Force"

if not exist "%INSTALL_DIR%\manifest.json" (
  echo [错误] 解压失败，请手动解压 ZIP 文件后加载
  pause
  exit /b 1
)
echo [完成] 文件已解压
echo.

echo [2/4] 请选择浏览器：
echo   1. Google Chrome
echo   2. Microsoft Edge
echo   3. 两个都打开
set /p choice="请输入数字 (1/2/3): "

if "%choice%"=="2" goto :edge
if "%choice%"=="3" goto :both
goto :chrome

:chrome
echo [3/4] 正在打开 Chrome 扩展页面...
start chrome://extensions/
echo [完成] 已打开 Chrome 扩展页面
goto :guide

:edge
echo [3/4] 正在打开 Edge 扩展页面...
start edge://extensions/
echo [完成] 已打开 Edge 扩展页面
goto :guide

:both
echo [3/4] 正在打开 Chrome 和 Edge 扩展页面...
start chrome://extensions/
timeout /t 2 /nobreak >nul
start edge://extensions/
echo [完成] 已打开 Chrome 和 Edge 扩展页面
goto :guide

:guide
echo.
echo [4/4] 请按以下步骤完成安装：
echo.
echo   Chrome 用户：
echo   1. 右上角开启「开发者模式」
echo   2. 点击「加载已解压的扩展程序」
echo.
echo   Edge 用户：
echo   1. 左下角开启「开发人员模式」
echo   2. 点击「加载解压缩的扩展」
echo.
echo   3. 在弹出的文件夹选择框中，选择以下路径：
echo.
echo      %INSTALL_DIR%
echo.
echo   4. 安装完成后，打开抖音/快手/B站/小红书的视频页面
echo   5. 点击浏览器工具栏中的扩展图标
echo   6. 点击「采集当前页面评论」即可开始使用
echo.
echo ============================================
echo  安装目录: %INSTALL_DIR%
echo  如需卸载，删除该目录并在浏览器扩展页面移除即可
echo ============================================
echo.
pause
