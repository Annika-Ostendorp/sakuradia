@echo off
title Start Dev Server

cd /d "%~dp0game"

if not exist node_modules (
    echo node_modules wurde nicht gefunden.
    echo Fuehre zuerst npm install aus...
    npm install
)

start http://localhost:5173

npm run dev

pause