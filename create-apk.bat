@echo off
title Sentinel Android APK Downloader
cd /d "%~dp0"
echo ================================================================
echo           SENTINEL - ANDROID APK BUILDER ^& DOWNLOADER
echo ================================================================
echo.
echo 1. Building and downloading standalone Sentinel APK...
echo.
node download-apk.js
echo.
if exist "sentinel.apk" (
    echo ================================================================
    echo [SUCCESS] Your Android APK is ready at:
    echo 👉 %~dp0sentinel.apk
    echo.
    echo How to install on your Android phone:
    echo 1. Connect phone via USB or send "sentinel.apk" via WhatsApp / Drive.
    echo 2. Tap "sentinel.apk" on your phone to install!
    echo ================================================================
) else (
    echo [NOTE] Check the output above for details.
)
echo.
pause
