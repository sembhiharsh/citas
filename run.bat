@echo off
title AutoVision AI Launcher
echo ===================================================
echo   AutoVision AI - Local Startup Script
echo ===================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in system PATH.
    echo Please install Python 3.10+ and retry.
    pause
    exit /b 1
)

:: Check Node.js / NPM (bypassing ps1 restriction by checking npm.cmd)
call npm.cmd --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/NPM is not installed or not in system PATH.
    echo Please install Node.js and retry.
    pause
    exit /b 1
)

echo [1/3] Installing Python backend dependencies...
cd backend
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Some python modules could not be installed. Pipeline might fail.
)
cd ..
echo.

echo [2/3] Installing React frontend dependencies...
cd frontend
call npm.cmd install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend dependencies failed to install.
    pause
    exit /b 1
)
cd ..
echo.

echo [3/3] Launching servers...
echo.
echo starting FastAPI Backend (API on port 8000)...
start "AutoVision Backend" cmd /c "cd backend && python main.py"

echo starting Vite React Frontend (UI on port 5173)...
start "AutoVision Frontend" cmd /c "cd frontend && call npm.cmd run dev"

echo.
echo ===================================================
echo   AutoVision AI Dashboard Launching!
echo   Open http://localhost:5173 in your web browser.
echo ===================================================
echo.
pause
