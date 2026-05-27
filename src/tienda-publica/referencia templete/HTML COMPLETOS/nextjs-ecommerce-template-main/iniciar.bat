@echo off
title Next.js Ecommerce Template — puerto 3002
set DEST=D:\lokal-templates\nextjs-ecommerce-template

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
echo Abriendo en http://localhost:3002
start http://localhost:3002
npm run dev -- -p 3002
pause
