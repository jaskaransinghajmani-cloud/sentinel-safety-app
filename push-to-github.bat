@echo off
title Push Sentinel to GitHub
cd /d "%~dp0"
set "PATH=C:\Program Files\Git\cmd;%PATH%"
echo =========================================================
echo   Pushing Sentinel to GitHub...
echo   Repo: https://github.com/jaskaransinghajmani-cloud/sentinel-safety-app.git
echo =========================================================
echo.
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo =========================================================
    echo [SUCCESS] Your code is now live on GitHub!
    echo Visit: https://github.com/jaskaransinghajmani-cloud/sentinel-safety-app
    echo =========================================================
) else (
    echo =========================================================
    echo [NOTE] If a browser window opened, click "Sign in with your browser"
    echo or enter your GitHub Personal Access Token to authorize.
    echo =========================================================
)
echo.
pause
