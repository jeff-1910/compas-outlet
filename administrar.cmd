@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Panel de Compas Outlet

echo.
echo   Abriendo el panel de Compas Outlet...
echo.

start "" "http://localhost:8787/admin.html"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor-admin.ps1"
