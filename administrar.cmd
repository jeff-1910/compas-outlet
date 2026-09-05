@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Panel de Compas Outlet

echo.
echo   Abriendo el panel de Compas Outlet...
echo   (el navegador se abre solo en unos segundos)
echo.

if not exist "%~dp0servidor-admin.ps1" (
  echo.
  echo   ERROR: falta el archivo servidor-admin.ps1
  echo   Tiene que estar en la misma carpeta que este archivo.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor-admin.ps1"

rem Si PowerShell termina por un error, la ventana no se cierra de golpe:
rem asi se alcanza a leer que paso.
echo.
echo   El panel se cerro.
echo.
pause
