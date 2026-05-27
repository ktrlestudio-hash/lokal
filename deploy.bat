@echo off
setlocal
cd /d "%~dp0"
title Lokal — Deploy

:: ── Verificaciones previas ──────────────────────────────────────────────────
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js no instalado - https://nodejs.org
  pause & exit /b 1
)

where netlify >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Netlify CLI no instalado.
  echo        Instalar con: npm install -g netlify-cli
  pause & exit /b 1
)

if not exist "node_modules" (
  echo [1/3] Instalando dependencias...
  call npm install
  if %ERRORLEVEL% NEQ 0 ( echo ERROR: npm install fallo. & pause & exit /b 1 )
) else (
  echo [1/3] Dependencias OK
)

:: ── Build ───────────────────────────────────────────────────────────────────
echo.
echo [2/3] Compilando para produccion...
call npm run build
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: La compilacion fallo.
  pause & exit /b 1
)

:: ── Deploy ──────────────────────────────────────────────────────────────────
echo.
echo [3/3] Desplegando en Netlify...

:: Leer siteId de .netlify\state.json si existe
set "SITE_FLAG="
if exist ".netlify\state.json" (
  for /f "usebackq delims=" %%i in (
    `powershell -NoProfile -Command "(Get-Content -Raw '.netlify\state.json' | ConvertFrom-Json).siteId"`
  ) do set "SITE_FLAG=--site %%i"
)

:: --no-build: ya compilamos arriba, no buildear dos veces
call netlify deploy --prod --no-build --dir=dist %SITE_FLAG%
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERROR: El deploy fallo. Revisa los errores de arriba.
  pause & exit /b 1
)

echo.
echo ✓ Deploy completado exitosamente.
echo   https://lokalbovril.netlify.app
echo.
pause
