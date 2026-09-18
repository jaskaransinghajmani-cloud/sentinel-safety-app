@echo off
title Sentinel Phone Tunnel
cd /d "%~dp0"
echo ===================================================
echo   Opening Secure HTTPS Tunnel for Your Phone...
echo ===================================================
node tunnel.js
pause
