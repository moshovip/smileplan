@echo off
chcp 65001 > nul
set PATH=C:\Users\Armen\Projects\smileplan\node\node-v20.18.0-win-x64;%PATH%
cd /d C:\Users\Armen\Projects\smileplan\web
echo.
echo  ========================================
echo   Деплой SmilePlan на Vercel
echo  ========================================
echo.
echo  Шаг 1: Войдите в аккаунт Vercel
echo  (откроется браузер для входа через GitHub/Google)
echo.
vercel login
echo.
echo  Шаг 2: Деплой...
vercel deploy --prod --yes --name smileplan
echo.
pause
