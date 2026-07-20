@echo off
REM Levanta LOKAL LINKS (React) en local: Vite + Netlify Functions juntos.
REM netlify dev abre el navegador solo, cuando el server esta listo de verdad
REM (una sola pestana). No agregamos apertura manual para no duplicar pestanas.

cd /d "%~dp0"

echo Liberando puertos 8889 y 5173 si quedaron ocupados de una corrida anterior...
for %%P in (8889 5173) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P" ^| findstr "LISTENING"') do (
    echo   - Puerto %%P ocupado por PID %%A, cerrando...
    taskkill /F /PID %%A >nul 2>&1
  )
)

echo Instalando dependencias si hace falta...
if not exist node_modules (
  call npm install
)

call npx netlify dev

pause
