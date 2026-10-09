@echo off
title Controle de Horas Complementares
cd /d "%~dp0"

echo ========================================================
echo    Iniciando Controle de Horas Complementares...
echo ========================================================

:: Inicia o micro servidor estatico em background caso ainda nao esteja rodando
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 48123); exit 0 } catch { exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    start /b node server.js
    timeout /t 1 /nobreak >nul
)

:: Abre a janela do aplicativo desktop nativo sem barras de navegador
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://127.0.0.1:48123" --window-size=1120,760
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://127.0.0.1:48123" --window-size=1120,760
) else (
    start http://127.0.0.1:48123
)

exit
