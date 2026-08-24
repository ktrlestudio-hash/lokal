@echo off
REM Levanta LOKAL LINKS en local usando Cloudflare Pages (wrangler), el
REM mismo runtime que produccion — NO netlify dev.
REM
REM Por que se cambio: el proyecto migro de Netlify a Cloudflare Pages
REM (netlify/functions/ y netlify/edge-functions/ quedaron como codigo
REM legado, desactualizado — nunca recibieron el endpoint productos-globales.js
REM ni ningun cambio de backend desde la migracion). El backend real vive en
REM functions/.netlify/functions/ (el nombre de carpeta es legado, pero el
REM formato ya es Cloudflare Pages Functions: onRequestGet/onRequestPost/...).
REM `wrangler pages dev` sirve exactamente ese codigo, con el mismo binding
REM R2/D1 que wrangler.toml declara para produccion (en modo local/simulado,
REM sin tocar los datos reales).
REM
REM wrangler pages dev sirve un build ESTATICO de dist/ (no HMR de Vite) —
REM por eso se hace `npm run build` antes de cada arranque. Si estas
REM iterando rapido solo en el FRONTEND sin tocar backend, `npm run dev`
REM (Vite solo) es mas comodo aunque las llamadas a /.netlify/functions/*
REM van a fallar ahi (no hay backend corriendo).

cd /d "%~dp0"

echo Liberando puerto 8788 si quedo ocupado de una corrida anterior...
for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":8788" ^| findstr "LISTENING"') do (
  echo   - Puerto 8788 ocupado por PID %%A, cerrando...
  taskkill /F /PID %%A >nul 2>&1
)

echo Instalando dependencias si hace falta...
if not exist node_modules (
  call npm install
)

echo Compilando build de produccion (dist/)...
call npm run build
if errorlevel 1 (
  echo Build fallo, revisa los errores arriba.
  pause
  exit /b 1
)

echo Levantando Cloudflare Pages local (wrangler) en http://localhost:8788 ...
REM compatibility-date 2026-06-08 (no 2026-08-17 de wrangler.toml): el
REM binario local de wrangler instalado no soporta fechas mas nuevas que
REM esa. Solo afecta el runtime SIMULADO local, no produccion (donde
REM Cloudflare usa la fecha real de wrangler.toml).
call npx wrangler pages dev dist --port 8788 --compatibility-date=2026-06-08

pause
