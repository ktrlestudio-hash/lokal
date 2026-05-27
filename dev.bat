@echo off
cd /d "%~dp0"

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js no instalado - https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias...
  npm install
)

echo.
echo [Lokal] Iniciando servidor completo (frontend + funciones)...
echo [Lokal] App: http://localhost:8888
echo [Lokal] Para solo frontend sin funciones: npm run dev
echo.

cmd /k netlify dev
