@echo off
cd /d "%~dp0"

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js no instalado - https://nodejs.org
  pause
  exit /b 1
)

where netlify >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Instalando Netlify CLI...
  npm install -g netlify-cli
)

if not exist "node_modules" (
  echo Instalando dependencias...
  npm install
)

cmd /k netlify dev
