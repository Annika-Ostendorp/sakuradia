@echo off
title Start Dev Server
setlocal

cd /d "%~dp0game"

if not exist node_modules (
    echo node_modules wurde nicht gefunden.
    echo Fuehre zuerst npm install aus...
    npm install || exit /b 1
)

start "Vite Dev Server" /B npm run dev

:wait_for_vite
powershell -NoProfile -Command "$client = New-Object Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 5173); exit 0 } catch { exit 1 } finally { $client.Close() }"
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto wait_for_vite
)

start "" http://localhost:5173

pause
