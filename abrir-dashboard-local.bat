@echo off
setlocal

cd /d "%~dp0"
set "PORT=4174"
set "URL=http://localhost:%PORT%/dashboard.html?local=%RANDOM%%RANDOM%"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale o Node.js antes de abrir o dashboard local.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\http-server.cmd" (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo Nao foi possivel instalar as dependencias.
    pause
    exit /b 1
  )
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue) { exit 0 } exit 1"
if errorlevel 1 (
  start "Checklist dashboard local" /min cmd /k "cd /d ""%~dp0"" && npx http-server . -p %PORT% -c-1"
  timeout /t 2 /nobreak >nul
)

echo Abrindo dashboard local com dados do Firebase...
start "" "%URL%"

endlocal
