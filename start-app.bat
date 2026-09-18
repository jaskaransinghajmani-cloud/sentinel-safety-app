@echo off
title Sentinel Safety App
cd /d "%~dp0"
echo ===================================================
echo   Starting Sentinel Women's Safety App Server...
echo ===================================================
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000
node server.js
pause
