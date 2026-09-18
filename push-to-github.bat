@echo off
title Push Sentinel to GitHub
cd /d "%~dp0"
set "PATH=C:\Program Files\Git\cmd;%PATH%"

echo =====================================================================
echo           Sentinel Safety App - GitHub Push Helper
echo =====================================================================
echo Target Repository:
echo   https://github.com/jaskaransinghajmani-cloud/sentinel-safety-app.git
echo =====================================================================
echo.
echo Choose how you want to push:
echo.
echo [1] Standard Push (Opens GitHub login in your default web browser)
echo [2] Push using Personal Access Token (PAT) - 100%% reliable, no popups
echo [3] Clear old saved GitHub credentials and retry browser login
echo.
set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="2" goto USE_TOKEN
if "%choice%"=="3" goto CLEAR_CREDS

:STANDARD_PUSH
echo.
echo =====================================================================
echo Attempting standard push...
echo (If a browser window pops up, click "Authorize git-ecosystem")
echo =====================================================================
echo.
git push -u origin main
goto FINISH

:USE_TOKEN
echo.
echo =====================================================================
echo How to get a GitHub Personal Access Token in 1 minute:
echo 1. Open: https://github.com/settings/tokens/new
echo 2. Give it a Note (e.g. "Sentinel Push")
echo 3. Check the "repo" box
echo 4. Click "Generate token" and copy the token (starts with ghp_)
echo =====================================================================
echo.
set /p token="Paste your GitHub Token here: "
if "%token%"=="" (
    echo No token entered. Aborting.
    pause
    exit /b
)
echo.
echo Pushing to GitHub using your token...
git push https://%token%@github.com/jaskaransinghajmani-cloud/sentinel-safety-app.git main
goto FINISH

:CLEAR_CREDS
echo.
echo Clearing any old cached GitHub credentials from Windows...
cmd.exe /c "cmdkey /delete:LegacyGeneric:target=git:https://github.com" 2>nul
cmd.exe /c "cmdkey /delete:git:https://github.com" 2>nul
echo Done! Now trying standard push...
git push -u origin main
goto FINISH

:FINISH
echo.
if %errorlevel% equ 0 (
    echo =====================================================================
    echo [SUCCESS] Your code is now live on GitHub!
    echo Visit: https://github.com/jaskaransinghajmani-cloud/sentinel-safety-app
    echo =====================================================================
) else (
    echo =====================================================================
    echo [FAILED] If browser login didn't work, run this file again and
    echo choose option [2] to push directly with a GitHub Personal Access Token.
    echo =====================================================================
)
echo.
pause
