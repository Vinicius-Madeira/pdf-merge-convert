@echo off
echo 🚀 Building PDF World for Windows...

REM Check if electron-builder is installed
npm list electron-builder >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing electron-builder...
    npm install --save-dev electron-builder
)

REM Create build directory if it doesn't exist
if not exist "build" mkdir build

REM Create a simple icon (you can replace this with your own)
echo 🎨 Creating placeholder icon...
echo ^<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"^>^<rect width="512" height="512" fill="#007bff"/^>^<text x="256" y="256" font-family="Arial" font-size="120" fill="white" text-anchor="middle" dominant-baseline="middle"^>PDF^</text^>^<text x="256" y="350" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dominant-baseline="middle"^>World^</text^>^</svg^> > build\icon.svg

REM Build the app
echo 🔨 Building application...
npm run build:win

if %errorlevel% equ 0 (
    echo ✅ Build completed successfully!
    echo 📁 Check the 'dist' folder for your built application
    echo.
    echo 📦 Available files:
    dir dist
    echo.
    echo 🎉 Your app is ready for distribution!
    echo 💡 Users will need to install Ghostscript from https://www.ghostscript.com/releases/gsdnld.html
) else (
    echo ❌ Build failed!
    exit /b 1
) 