@echo off
title Free Next.js Admin Dashboard — puerto 3001
set DEST=D:\lokal-templates\free-nextjs-admin-dashboard

if not exist "%DEST%" (
  echo Copiando proyecto a D:\lokal-templates...
  mkdir "D:\lokal-templates" 2>nul
  xcopy /E /I /Q "%~dp0." "%DEST%"
)

cd /d "%DEST%"

if not exist node_modules (
  echo Instalando dependencias en D:...
  npm install
)

echo.
echo Abriendo en http://localhost:3001
start http://localhost:3001
npm run dev -- -p 3001
pause
