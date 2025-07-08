# PDF World

A powerful Electron application for merging PDFs and converting them to PDF/A format with drag-and-drop page rearrangement.

## Features

- 📄 **PDF Preview**: View all pages as thumbnails
- 🎯 **Drag & Drop**: Rearrange individual pages with visual feedback
- 🔗 **Smart Merging**: Merge PDFs in your custom page order
- 📋 **PDF/A Conversion**: Convert merged PDFs to PDF/A format for long-term archiving
- 🎨 **Modern UI**: Beautiful, responsive interface

## Prerequisites

- **Node.js** (v16 or higher)
- **Ghostscript** (for PDF/A conversion and thumbnail generation)

### Installing Ghostscript

#### Linux (Ubuntu/Debian):

```bash
sudo apt-get install ghostscript
```

#### macOS:

```bash
brew install ghostscript
```

#### Windows:

Download from [Ghostscript website](https://www.ghostscript.com/releases/gsdnld.html)

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

## Development

Run the app in development mode:

```bash
npm start
```

## Building for Distribution

### Install electron-builder:

```bash
npm install --save-dev electron-builder
```

### Build for your platform:

**Linux:**

```bash
npm run build:linux
```

**Windows:**

```bash
npm run build:win
```

**macOS:**

```bash
npm run build:mac
```

**All platforms:**

```bash
npm run build
```

### Build outputs:

- **Linux**: AppImage and .deb packages in `dist/` folder
- **Windows**: .exe installer in `dist/` folder
- **macOS**: .dmg file in `dist/` folder

## Distribution Options

### 1. **Direct Distribution**

- Share the built installer files directly with users
- Users need to install Ghostscript separately

### 2. **Portable App (Linux)**

- AppImage files are portable and don't require installation
- Users still need Ghostscript installed

### 3. **Bundled Distribution**

For a more complete solution, you can bundle Ghostscript with your app:

#### Linux:

```bash
# Create a script that checks for Ghostscript and installs if missing
echo '#!/bin/bash
if ! command -v gs &> /dev/null; then
    echo "Installing Ghostscript..."
    sudo apt-get update && sudo apt-get install -y ghostscript
fi
./your-app' > run-app.sh
```

#### Windows:

- Include Ghostscript installer with your app
- Create a setup script that installs both

## User Requirements

### System Requirements:

- **OS**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Ghostscript**: Must be installed and accessible via command line

### Installation Instructions for End Users:

1. **Install Ghostscript** (if not already installed)
2. **Download and run** the appropriate installer for their platform
3. **Launch the app** and start converting PDFs!

## Troubleshooting

### Common Issues:

1. **"gs command not found"**

   - Install Ghostscript (see Prerequisites section)

2. **Permission errors on Linux**

   - Make sure the AppImage is executable: `chmod +x PDF-World-*.AppImage`

3. **Blank pages in PDF/A output**

   - This has been fixed in the current version with improved Ghostscript parameters

4. **App won't start**
   - Check that all dependencies are installed
   - Try running from command line to see error messages

## Development Notes

- The app uses `pdf-lib` for page-by-page PDF manipulation
- Ghostscript handles PDF/A conversion and thumbnail generation
- Drag-and-drop functionality is implemented with HTML5 APIs
- All file operations are performed in the main process for security

## License

ISC License - see package.json for details
