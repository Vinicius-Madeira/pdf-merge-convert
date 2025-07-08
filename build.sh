#!/bin/bash

echo "🚀 Building PDF World for Linux..."

# Check if electron-builder is installed
if ! npm list electron-builder > /dev/null 2>&1; then
    echo "📦 Installing electron-builder..."
    npm install --save-dev electron-builder
fi

# Create build directory if it doesn't exist
mkdir -p build

# Create a simple icon (you can replace this with your own)
echo "🎨 Creating placeholder icon..."
cat > build/icon.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#007bff"/>
  <text x="256" y="256" font-family="Arial" font-size="120" fill="white" text-anchor="middle" dominant-baseline="middle">PDF</text>
  <text x="256" y="350" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dominant-baseline="middle">World</text>
</svg>
EOF

# Convert SVG to PNG (requires ImageMagick or similar)
if command -v convert > /dev/null 2>&1; then
    convert build/icon.svg -resize 512x512 build/icon.png
    echo "✅ Icon created successfully"
else
    echo "⚠️  ImageMagick not found. Using placeholder icon."
    # Create a simple colored square as fallback
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > build/icon.png
fi

# Build the app
echo "🔨 Building application..."
npm run build:linux

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Check the 'dist' folder for your built application"
    echo ""
    echo "📦 Available files:"
    ls -la dist/
    echo ""
    echo "🎉 Your app is ready for distribution!"
    echo "💡 Users will need to install Ghostscript: sudo apt-get install ghostscript"
else
    echo "❌ Build failed!"
    exit 1
fi 