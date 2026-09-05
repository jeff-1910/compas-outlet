@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion
cd /d "%~dp0"

rem Ruta completa a git, para no depender del PATH de Windows.
set GIT="C:\Program Files\Git\cmd\git.exe"
if not exist %GIT% (
  echo.
  echo  ERROR: no encuentro Git en C:\Program Files\Git\cmd\git.exe
  echo  Instalalo desde https://git-scm.com y volve a intentar.
  echo.
  pause
  exit /b 1
)

echo.
echo ==========================================================
echo   PUBLICAR CAMBIOS - Compas Outlet
echo ==========================================================
echo.

rem ---- Paso 1: instalar el productos.js que bajaste de admin.html ----
set DESCARGA=%USERPROFILE%\Downloads\productos.js
if exist "%DESCARGA%" (
  echo  Encontre un productos.js en tu carpeta de Descargas:
  for %%F in ("%DESCARGA%") do echo     fecha: %%~tF
  echo.
  set /p RESP="  Lo instalo en la tienda? (S/N): "
  if /i "!RESP!"=="S" (
    copy /y "js\productos.js" "js\productos-anterior.js" >nul
    move /y "%DESCARGA%" "js\productos.js" >nul
    echo     Instalado. El catalogo anterior quedo como js\productos-anterior.js
  ) else (
    echo     Saltado. Se publica el catalogo que ya esta en la carpeta.
  )
  echo.
)

rem ---- Paso 2: subir los cambios ----
echo  Revisando que cambio...
%GIT% add -A
%GIT% diff --cached --quiet
if %errorlevel%==0 (
  echo.
  echo  No hay cambios nuevos que publicar. Todo esta al dia.
  echo.
  pause
  exit /b 0
)

echo.
%GIT% status --short
echo.

for /f "tokens=*" %%D in ('powershell -NoProfile -Command "Get-Date -Format \"yyyy-MM-dd HH:mm\""') do set FECHA=%%D
%GIT% commit -q -m "Actualizacion del catalogo - %FECHA%"
if errorlevel 1 (
  echo.
  echo  ERROR al guardar los cambios. Copiá este mensaje y mandaselo a Claude.
  echo.
  pause
  exit /b 1
)

echo  Subiendo a GitHub...
%GIT% push
if errorlevel 1 (
  echo.
  echo  ERROR al subir. Puede ser que necesites iniciar sesion en GitHub,
  echo  o que no haya internet. Copiá este mensaje y mandaselo a Claude.
  echo.
  pause
  exit /b 1
)

echo.
echo ==========================================================
echo   LISTO. Vercel publica los cambios en menos de un minuto.
echo ==========================================================
echo.
pause
