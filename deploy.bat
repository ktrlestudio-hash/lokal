@echo off
REM Deploy manual a produccion (sitio Netlify: lokallinks).
REM Doble click o ejecutar desde cmd/PowerShell cuando quieras publicar.
cd /d "%~dp0"

echo.
echo === LOKAL LINKS - Deploy a produccion (lokallinks) ===
echo.

call netlify deploy --prod --build
if errorlevel 1 (
    echo.
    echo *** El deploy fallo. Revisa el error de arriba. ***
    pause
    exit /b 1
)

echo.
echo === Deploy completado. ===
pause
