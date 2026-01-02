@echo off
REM ================================================
REM Hostel Management System - Chatbot Setup
REM ================================================
REM

REM Check if backend exists
if not exist "backend" (
    echo ❌ Backend folder not found!
    exit /b 1
)

REM Check if frontend exists
if not exist "frontend" (
    echo ❌ Frontend folder not found!
    exit /b 1
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend

REM Check if @google/generative-ai is installed
npm list @google/generative-ai >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing @google/generative-ai...
    call npm install @google/generative-ai
)

call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    exit /b 1
)

echo ✅ Backend dependencies installed successfully

cd ..

REM Install frontend dependencies
echo.
echo 📦 Installing frontend dependencies...
cd frontend

call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    exit /b 1
)

echo ✅ Frontend dependencies installed successfully

cd ..

REM Display completion message
echo.
echo ================================================
echo ✅ Setup Complete!
echo ================================================
echo.
echo Next Steps:
echo 1. Get your Google Gemini API key from:
echo    https://makersuite.google.com/app/apikey
echo.
echo 2. Create a .env file in the backend folder
echo    and add: GEMINI_API_KEY=your_key_here
echo.
echo 3. You can use backend\.env.example as template
echo.
echo 4. Start the backend: cd backend ^&^& npm run dev
echo 5. Start the frontend: cd frontend ^&^& npm run dev
echo.
echo For detailed instructions, see CHATBOT_SETUP.md
echo ================================================
echo.
pause
