@echo off
echo 🚀 Personal Finance Assistant Setup Script
echo ==========================================

REM Check if Node.js is installed
echo.
echo ℹ️  Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm (usually comes with Node.js)
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js version: %NODE_VERSION%
echo ✅ npm version: %NPM_VERSION%

REM Install root dependencies
echo.
echo ℹ️  Installing root dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

REM Install frontend dependencies
echo.
echo ℹ️  Installing frontend dependencies...
cd frontend
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

REM Install backend dependencies
echo.
echo ℹ️  Installing backend dependencies...
cd ..\server
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

REM Check if .env file exists
echo.
echo ℹ️  Checking environment configuration...

if not exist ".env" (
    echo ⚠️  .env file not found
    echo ℹ️  Copying .env.example to .env...
    copy .env.example .env >nul
    echo ✅ .env file created
    echo.
    echo ⚠️  IMPORTANT: Please edit the .env file with your actual configuration:
    echo ⚠️  1. Set your MongoDB connection string (MONGODB_URI)
    echo ⚠️  2. Set your Google Gemini API key (GEMINI_API_KEY)
    echo ⚠️  3. Set a secure JWT secret (JWT_SECRET)
) else (
    echo ✅ .env file already exists
)

REM Create uploads directory
echo.
echo ℹ️  Creating uploads directory...
if not exist "uploads" mkdir uploads
echo ✅ Uploads directory created

REM Go back to root directory
cd ..

echo.
echo ✅ Setup completed successfully!
echo.
echo 🎯 Next steps:
echo 1. Configure your .env file in the server directory
echo 2. Set up your MongoDB database
echo 3. Get your Google Gemini API key
echo 4. Start the backend: cd server && npm start
echo 5. Start the frontend: cd frontend && npm start
echo.
echo 📚 For detailed instructions, see the README.md file
echo.
echo ✅ Happy coding! 💰📊
echo.
pause
