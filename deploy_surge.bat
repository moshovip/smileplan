@echo off
chcp 65001 > nul
set PATH=C:\Users\Armen\Projects\smileplan\node\node-v20.18.0-win-x64;%PATH%
cd /d C:\Users\Armen\Projects\smileplan\web

echo.
echo  ==========================================
echo   SmilePlan — Публикация на surge.sh
echo  ==========================================
echo.
echo  Введите email (любой, для создания аккаунта)
echo  Введите пароль (придумайте любой)
echo  Домен оставьте по умолчанию или введите свой
echo.
echo  Итог: постоянная ссылка вида smileplan.surge.sh
echo.

npx surge dist --domain smileplan-test.surge.sh

echo.
echo  Ваша постоянная ссылка: https://smileplan-test.surge.sh
pause
