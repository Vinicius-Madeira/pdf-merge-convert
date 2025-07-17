const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const https = require("https");
const { pipeline } = require("stream");
const { promisify } = require("util");

const pipelineAsync = promisify(pipeline);

// Ghostscript download URLs for Windows
const GHOSTSCRIPT_URLS = {
  x64: "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs1000/gs1000w64.exe",
  x86: "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs1000/gs1000w32.exe",
};

let ghostscriptPath = null;
let isInstallingGhostscript = false;
let ghostscriptInstallationDeclined = false;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "renderer.js"),
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  win.loadFile("index.html");
}

// Check if Ghostscript is available
async function checkGhostscript() {
  return new Promise((resolve) => {
    // First try the standard 'gs' command
    exec("gs --version", (error, stdout, stderr) => {
      if (!error) {
        ghostscriptPath = "gs";
        console.log("Ghostscript found via 'gs' command:", stdout.trim());
        resolve(true);
        return;
      }

      // Try common Windows Ghostscript paths
      const commonPaths = [
        "C:\\Program Files\\gs\\gs10.00.0\\bin\\gswin64c.exe",
        "C:\\Program Files\\gs\\gs10.00.0\\bin\\gswin32c.exe",
        "C:\\Program Files (x86)\\gs\\gs10.00.0\\bin\\gswin32c.exe",
        "C:\\Program Files\\gs\\gs9.56.1\\bin\\gswin64c.exe",
        "C:\\Program Files\\gs\\gs9.56.1\\bin\\gswin32c.exe",
        "C:\\Program Files (x86)\\gs\\gs9.56.1\\bin\\gswin32c.exe",
        // Add more recent versions
        "C:\\Program Files\\gs\\gs10.05.1\\bin\\gswin64c.exe",
        "C:\\Program Files\\gs\\gs10.05.1\\bin\\gswin32c.exe",
        "C:\\Program Files (x86)\\gs\\gs10.05.1\\bin\\gswin32c.exe",
      ];

      let checkedPaths = 0;
      const totalPaths = commonPaths.length;

      for (const gsPath of commonPaths) {
        if (fs.existsSync(gsPath)) {
          exec(`"${gsPath}" --version`, (error, stdout, stderr) => {
            checkedPaths++;
            if (!error) {
              ghostscriptPath = gsPath;
              console.log(
                "Ghostscript found at:",
                gsPath,
                "Version:",
                stdout.trim()
              );
              resolve(true);
              return;
            }
            // If this was the last path to check and none worked
            if (checkedPaths === totalPaths) {
              console.log("Ghostscript not found in any common location");
              resolve(false);
            }
          });
        } else {
          checkedPaths++;
          // If this was the last path to check and none existed
          if (checkedPaths === totalPaths) {
            console.log("Ghostscript not found in any common location");
            resolve(false);
          }
        }
      }
    });
  });
}

// Download Ghostscript installer with progress
async function downloadGhostscript(progressCallback) {
  const is64Bit = process.arch === "x64";
  const url = is64Bit ? GHOSTSCRIPT_URLS.x64 : GHOSTSCRIPT_URLS.x86;
  const installerPath = path.join(
    app.getPath("temp"),
    "ghostscript-installer.exe"
  );

  console.log("Downloading Ghostscript...");
  if (progressCallback)
    progressCallback("Downloading Ghostscript installer...");

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(installerPath);

    const makeRequest = (url) => {
      https
        .get(url, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            const newUrl = response.headers.location;
            console.log(`Redirecting to: ${newUrl}`);
            makeRequest(newUrl);
            return;
          }

          if (response.statusCode === 200) {
            const totalSize = parseInt(response.headers["content-length"], 10);
            let downloadedSize = 0;

            response.on("data", (chunk) => {
              downloadedSize += chunk.length;
              if (progressCallback && totalSize) {
                const progress = Math.round((downloadedSize / totalSize) * 100);
                progressCallback(`Downloading Ghostscript... ${progress}%`);
              }
            });

            response.pipe(file);
            file.on("finish", () => {
              file.close();
              if (progressCallback)
                progressCallback("Download completed. Installing...");
              resolve(installerPath);
            });
          } else {
            reject(
              new Error(
                `Failed to download Ghostscript: ${response.statusCode}`
              )
            );
          }
        })
        .on("error", reject);
    };

    makeRequest(url);
  });
}

// Install Ghostscript with better error handling
async function installGhostscript(installerPath, progressCallback) {
  return new Promise((resolve, reject) => {
    const installDir = path.join(
      process.env.PROGRAMFILES || "C:\\Program Files",
      "gs",
      "gs10.00.0"
    );

    if (progressCallback)
      progressCallback(
        "Installing Ghostscript (this may take a few minutes)..."
      );

    // Use a more robust installation command
    const installCommand = `"${installerPath}" /S /D="${installDir}" /NORESTART`;

    exec(installCommand, (error, stdout, stderr) => {
      if (error) {
        console.error("Installation error:", error);
        reject(new Error(`Installation failed: ${error.message}`));
        return;
      }

      // Wait longer for installation to complete and verify
      setTimeout(async () => {
        try {
          // Check if installation was successful
          const gsExePath = path.join(installDir, "bin", "gswin64c.exe");
          if (fs.existsSync(gsExePath)) {
            // Test if the executable works
            exec(`"${gsExePath}" --version`, (error, stdout, stderr) => {
              if (!error) {
                ghostscriptPath = gsExePath;
                if (progressCallback)
                  progressCallback("Ghostscript installed successfully!");
                resolve();
              } else {
                reject(
                  new Error("Ghostscript installed but not working properly")
                );
              }
            });
          } else {
            reject(
              new Error(
                "Ghostscript installation completed but executable not found"
              )
            );
          }
        } catch (err) {
          reject(new Error(`Installation verification failed: ${err.message}`));
        }
      }, 10000); // Wait 10 seconds for installation
    });
  });
}

// Initialize Ghostscript on app startup with user feedback
async function initializeGhostscript() {
  if (isInstallingGhostscript) {
    return; // Prevent multiple simultaneous installations
  }

  const isAvailable = await checkGhostscript();

  if (
    !isAvailable &&
    process.platform === "win32" &&
    !ghostscriptInstallationDeclined
  ) {
    isInstallingGhostscript = true;

    try {
      // Show installation dialog
      const { response, checkboxChecked } = await dialog.showMessageBox({
        type: "question",
        buttons: ["Yes", "No"],
        defaultId: 0,
        title: "Ghostscript Required",
        message:
          "PDF World requires Ghostscript to generate thumbnails and convert PDFs to PDF/A format.",
        detail:
          "Would you like to download and install Ghostscript now? This will take a few minutes.",
        checkboxLabel: "Don't ask again",
        checkboxChecked: false,
      });

      if (response === 0) {
        // User clicked Yes
        const installerPath = await downloadGhostscript((message) => {
          console.log(message);
        });

        await installGhostscript(installerPath, (message) => {
          console.log(message);
        });

        console.log("Ghostscript installed successfully");

        // Show success message
        dialog.showMessageBox({
          type: "info",
          title: "Installation Complete",
          message: "Ghostscript has been installed successfully!",
          detail:
            "You can now use all PDF World features including thumbnail generation and PDF/A conversion.",
        });
      } else {
        console.log("User declined Ghostscript installation");
        if (checkboxChecked) {
          ghostscriptInstallationDeclined = true;
          console.log("User chose not to be asked again");
        }
      }
    } catch (error) {
      console.error("Failed to install Ghostscript:", error);

      // Show error message to user
      dialog.showErrorBox(
        "Ghostscript Installation Failed",
        `Failed to install Ghostscript: ${error.message}\n\nYou can manually install Ghostscript from:\nhttps://www.ghostscript.com/releases/gsdnld.html\n\nSome features may not work without Ghostscript.`
      );
    } finally {
      isInstallingGhostscript = false;
    }
  } else if (isAvailable) {
    console.log(
      "Ghostscript is already available, skipping installation prompt"
    );
  } else if (ghostscriptInstallationDeclined) {
    console.log("User previously declined Ghostscript installation");
  }
}

app.whenReady().then(async () => {
  await initializeGhostscript();
  createWindow();
});

ipcMain.handle("select-pdfs", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  });
  return result.filePaths;
});

ipcMain.handle("select-single-pdf", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  });
  return result.filePaths.length > 0 ? result.filePaths[0] : null;
});

ipcMain.handle("generate-thumbnails", async (event, filePath) => {
  // Check if Ghostscript is available
  if (!ghostscriptPath) {
    const isAvailable = await checkGhostscript();
    if (!isAvailable) {
      throw new Error(
        "Ghostscript is not installed. Please install Ghostscript to generate thumbnails."
      );
    }
  }

  const outputDir = path.join(
    app.getPath("temp"),
    "pdf-thumbnails",
    path.basename(filePath, ".pdf")
  );

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Use Ghostscript to generate thumbnails for all pages
  const gsCommand = ghostscriptPath || "gs";
  const cmd = `"${gsCommand}" -dBATCH -dNOPAUSE -sDEVICE=pngalpha -r150 -sOutputFile="${path.join(
    outputDir,
    "page-%d.png"
  )}" "${filePath}"`;

  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(`Error generating thumbnails: ${stderr}`);
      } else {
        // Read the generated thumbnail files
        const thumbnails = [];
        let pageNum = 1;

        while (fs.existsSync(path.join(outputDir, `page-${pageNum}.png`))) {
          const thumbnailPath = path.join(outputDir, `page-${pageNum}.png`);
          const dataUrl = `data:image/png;base64,${fs
            .readFileSync(thumbnailPath)
            .toString("base64")}`;
          thumbnails.push(dataUrl);
          pageNum++;
        }

        resolve(thumbnails);
      }
    });
  });
});

ipcMain.handle("merge-pdfs", async (event, pageOrder) => {
  const { PDFDocument } = require("pdf-lib");
  const fs = require("fs");

  // Show save dialog for merged PDF
  const saveResult = await dialog.showSaveDialog({
    title: "Salvar PDF Juntado",
    defaultPath: path.join(app.getPath("desktop"), "pdf_juntado.pdf"),
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  });

  if (saveResult.canceled) {
    throw new Error("Operação cancelada pelo usuário");
  }

  const mergedPath = saveResult.filePath;

  // Create a new PDF document
  const mergedPdf = await PDFDocument.create();

  // Process each page in the specified order
  for (const page of pageOrder) {
    try {
      // Read the source PDF file
      const pdfBytes = fs.readFileSync(page.filePath);
      const pdf = await PDFDocument.load(pdfBytes);

      // Get the specific page
      const pages = pdf.getPages();
      if (page.pageIndex < pages.length) {
        const [copiedPage] = await mergedPdf.copyPages(pdf, [page.pageIndex]);
        mergedPdf.addPage(copiedPage);
      }
    } catch (error) {
      console.error(
        `Error processing page ${page.pageIndex} from ${page.filePath}:`,
        error
      );
    }
  }

  // Save the merged PDF
  const mergedBytes = await mergedPdf.save();
  fs.writeFileSync(mergedPath, mergedBytes);

  return mergedPath;
});

ipcMain.handle("convert-to-pdfa", async (event, mergedFilePath) => {
  // Check if Ghostscript is available
  if (!ghostscriptPath) {
    const isAvailable = await checkGhostscript();
    if (!isAvailable) {
      throw new Error(
        "Ghostscript is not installed. Please install Ghostscript to convert PDFs to PDF/A format."
      );
    }
  }

  // Show save dialog for PDF/A file
  const saveResult = await dialog.showSaveDialog({
    title: "Salvar PDF/A",
    defaultPath: path.join(app.getPath("desktop"), "documento_pdfa.pdf"),
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  });

  if (saveResult.canceled) {
    throw new Error("Operação cancelada pelo usuário");
  }

  const pdfaPath = saveResult.filePath;

  // Fixed Ghostscript command to prevent blank pages
  const gsCommand = ghostscriptPath || "gs";
  const cmd = `"${gsCommand}" -dPDFA=2 -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -sColorConversionStrategy=UseDeviceIndependentColor -sProcessColorModel=DeviceCMYK -dPDFACompatibilityPolicy=1 -dAutoFilterColorImages=false -dAutoFilterGrayImages=false -dColorImageFilter=/FlateEncode -dGrayImageFilter=/FlateEncode -sOutputFile="${pdfaPath}" "${mergedFilePath}"`;

  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(`Ghostscript error: ${stderr}`);
      } else {
        // Get file sizes for comparison
        const originalSize = fs.statSync(mergedFilePath).size;
        const pdfaSize = fs.statSync(pdfaPath).size;
        const sizeReduction = (
          ((originalSize - pdfaSize) / originalSize) *
          100
        ).toFixed(1);

        resolve(
          `✅ Conversão para PDF/A bem-sucedida!\n📁 Salvo em: ${pdfaPath}\n📊 Redução de tamanho: ${sizeReduction}% (${(
            originalSize /
            1024 /
            1024
          ).toFixed(1)}MB → ${(pdfaSize / 1024 / 1024).toFixed(1)}MB)`
        );
      }
    });
  });
});

// Manual Ghostscript installation handler
ipcMain.handle("install-ghostscript", async () => {
  if (isInstallingGhostscript) {
    throw new Error("Ghostscript installation is already in progress");
  }

  const isAvailable = await checkGhostscript();
  if (isAvailable) {
    return "Ghostscript is already installed and working";
  }

  isInstallingGhostscript = true;

  try {
    const installerPath = await downloadGhostscript((message) => {
      console.log(message);
    });

    await installGhostscript(installerPath, (message) => {
      console.log(message);
    });

    return "Ghostscript installed successfully!";
  } catch (error) {
    throw new Error(`Failed to install Ghostscript: ${error.message}`);
  } finally {
    isInstallingGhostscript = false;
  }
});

// Check Ghostscript status
ipcMain.handle("check-ghostscript", async () => {
  const isAvailable = await checkGhostscript();
  return {
    available: isAvailable,
    path: ghostscriptPath,
  };
});

// Reset Ghostscript installation preference
ipcMain.handle("reset-ghostscript-preference", () => {
  ghostscriptInstallationDeclined = false;
  return "Ghostscript installation preference reset. You will be asked again on next startup.";
});
