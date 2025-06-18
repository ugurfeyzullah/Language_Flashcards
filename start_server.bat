@echo off
REM Language Flash Cards Server Startup Script
echo.
echo 🚀 Starting Language Flash Cards Server...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo 📥 Installing dependencies...
pip install -r requirements.txt --quiet

REM Start the server
echo.
echo 🌐 Starting Flask server...
echo 📱 Open http://localhost:5000 in your browser
echo ⏹️  Press Ctrl+C to stop the server
echo.
python server.py

pause
