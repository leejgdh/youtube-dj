@echo off
echo Starting YouTube DJ Development Environment...
echo.

echo Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    npm install
) else (
    echo Dependencies already installed.
)

echo.
echo Starting development servers...
echo.

echo Starting Next.js development server...
start "Next.js Dev Server" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Socket.IO server...
start "Socket.IO Server" cmd /k "cd /d %~dp0 && npm run dev:socket"

echo.
echo Development servers starting...
echo - Next.js Web App: http://localhost:3000
echo - Socket.IO Server: http://localhost:3001
echo.
echo Press any key to exit...
pause >nul
