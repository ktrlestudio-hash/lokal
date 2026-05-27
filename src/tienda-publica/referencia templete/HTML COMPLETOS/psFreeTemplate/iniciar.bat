@echo off
title psFreeTemplate — HTML estatico
cd /d "%~dp0website"
echo Abriendo template en http://localhost:3004
start http://localhost:3004
npx --yes serve . -p 3004
pause
