# Troubleshooting Guide - Ghostscript Installation

## Windows .exe Ghostscript Installation Issues

### Problem: Ghostscript is not being installed automatically

**Symptoms:**

- App shows "Ghostscript não está instalado" message
- Thumbnail generation fails
- PDF/A conversion fails
- No installation dialog appears

**Solutions:**

#### 1. Manual Installation via App

1. Look for the "Instalar Ghostscript" button in the top-right corner of the app
2. Click the button to start automatic installation
3. Wait for the download and installation to complete (may take several minutes)
4. Restart the app if prompted

#### 2. Manual Installation from Website

If automatic installation fails:

1. Go to https://www.ghostscript.com/releases/gsdnld.html
2. Download the appropriate version for your system:
   - **64-bit Windows**: `gs1000w64.exe`
   - **32-bit Windows**: `gs1000w32.exe`
3. Run the installer as Administrator
4. Use default installation settings
5. Restart the app

#### 3. Check Installation Path

The app looks for Ghostscript in these locations:

- `C:\Program Files\gs\gs10.00.0\bin\gswin64c.exe`
- `C:\Program Files\gs\gs10.00.0\bin\gswin32c.exe`
- `C:\Program Files (x86)\gs\gs10.00.0\bin\gswin32c.exe`

### Problem: Installation fails with permission errors

**Solutions:**

1. **Run as Administrator**: Right-click the app and select "Run as administrator"
2. **Check Windows Defender**: Temporarily disable Windows Defender or add the app to exclusions
3. **Check Firewall**: Allow the app through Windows Firewall
4. **Check Antivirus**: Add the app to your antivirus whitelist

### Problem: Download fails

**Solutions:**

1. **Check Internet Connection**: Ensure you have a stable internet connection
2. **Check Proxy Settings**: If behind a corporate firewall, configure proxy settings
3. **Try Manual Download**: Download Ghostscript manually from the official website
4. **Check DNS**: Try using a different DNS server (e.g., 8.8.8.8)

### Problem: Installation completes but app still can't find Ghostscript

**Solutions:**

1. **Restart the App**: Close and reopen the application
2. **Check PATH**: Ensure Ghostscript is added to your system PATH
3. **Verify Installation**: Run `gswin64c --version` in Command Prompt
4. **Reinstall Ghostscript**: Uninstall and reinstall Ghostscript

## Testing Ghostscript Installation

You can test if Ghostscript is properly installed by running:

```bash
node test-ghostscript.js
```

This will:

- Check if Ghostscript is detected in common locations
- Test if the download URLs are accessible
- Provide recommendations based on the results

## Common Error Messages

### "Ghostscript is not installed. Please install Ghostscript to generate thumbnails."

**Solution**: Install Ghostscript using one of the methods above

### "Failed to install Ghostscript: Installation failed"

**Solution**:

1. Try running the app as Administrator
2. Check antivirus/firewall settings
3. Try manual installation from the website

### "Ghostscript installed but not working properly"

**Solution**:

1. Restart the app
2. Check if Ghostscript is in the system PATH
3. Reinstall Ghostscript

## System Requirements

- **Windows**: Windows 7 or later (64-bit recommended)
- **Memory**: At least 2GB RAM
- **Disk Space**: At least 100MB free space
- **Permissions**: Administrator rights for installation

## Getting Help

If you continue to experience issues:

1. **Check the Console**: Press F12 to open developer tools and check for error messages
2. **Test Ghostscript**: Run the test script to diagnose issues
3. **Manual Installation**: Try installing Ghostscript manually from the official website
4. **Report Issues**: Create an issue on the GitHub repository with:
   - Your Windows version
   - Error messages from the console
   - Steps to reproduce the problem

## Alternative Solutions

If Ghostscript installation continues to fail:

1. **Use Portable Version**: Download a portable version of Ghostscript
2. **Use Different Version**: Try an older version of Ghostscript (9.56.1)
3. **Contact Support**: Reach out to the development team for assistance

---

**Note**: This app requires Ghostscript for PDF thumbnail generation and PDF/A conversion. Without Ghostscript, these features will not work, but basic PDF merging will still function.
