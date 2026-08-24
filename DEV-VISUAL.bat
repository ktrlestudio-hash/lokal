@echo off
REM Levanta SOLO Vite (npm run dev) con recarga en caliente (HMR) — para
REM iterar rapido en cambios visuales/estilos/layout.
REM
REM Diferencia con TEST-LOCAL.bat: ese compila un build estatico y lo sirve
REM con wrangler (backend Cloudflare real, sin HMR — cada cambio requiere
REM rebuild + reinicio). Este es al reves: cambios instantaneos, pero las
REM llamadas a /.netlify/functions/* van a FALLAR (no hay backend corriendo
REM en este modo) — las pantallas que dependen de datos reales (tiendas,
REM productos, login) se van a ver vacias o con error de red. Usa este modo
REM para ajustar estilos/layout/animaciones; usa TEST-LOCAL.bat para probar
REM flujos que necesitan datos reales o el backend.

cd /d "%~dp0"

echo Liberando puerto 5173 si quedo ocupado de una corrida anterior...
for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  echo   - Puerto 5173 ocupado por PID %%A, cerrando...
  taskkill /F /PID %%A >nul 2>&1
)

echo Instalando dependencias si hace falta...
if not exist node_modules (
  call npm install
)

echo Levantando Vite en http://localhost:5173 (con recarga en caliente)...
call npm run dev

pause
