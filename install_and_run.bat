@echo off
chcp 65001 > nul
title SmilePlan - Установка и запуск

echo.
echo  =============================================
echo   🦷  SmilePlan — Установка и запуск
echo  =============================================
echo.

:: Check Node.js
node --version > nul 2>&1
if %errorlevel% neq 0 (
  echo  [!] Node.js не найден!
  echo.
  echo  Скачайте и установите Node.js с сайта:
  echo  https://nodejs.org/
  echo  (выберите LTS версию)
  echo.
  echo  После установки запустите этот файл снова.
  pause
  start https://nodejs.org/
  exit /b 1
)

echo  [✓] Node.js найден:
node --version

echo.
echo  Устанавливаю зависимости...
cd /d "%~dp0web"
call npm install

if %errorlevel% neq 0 (
  echo.
  echo  [!] Ошибка установки зависимостей
  pause
  exit /b 1
)

echo.
echo  =============================================
echo   ✅  Запускаю SmilePlan...
echo   Откройте браузер: http://localhost:5173
echo  =============================================
echo.

call npm run dev
pause
