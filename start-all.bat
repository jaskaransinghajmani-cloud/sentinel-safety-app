@echo off
title Sentinel All-in-One Launcher
cd /d "%~dp0"
echo =========================================================
echo   Starting Sentinel Server and Secure Phone Tunnel...
echo =========================================================
echo.
start "Sentinel Server" cmd /k "cd /d "%~dp0" && node server.js"
timeout /t 2 >nul
start "Sentinel Phone Tunnel" cmd /k "cd /d "%~dp0" && node tunnel.js"
start http://localhost:3000
echo Server running at http://localhost:3000
echo Check the other window ("Sentinel Phone Tunnel") for your phone link!
echo.
pause
