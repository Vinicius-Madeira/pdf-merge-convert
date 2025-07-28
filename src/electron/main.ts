import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import https from "https";
import { pipeline } from "stream";
import { promisify } from "util";
import { PDFDocument } from "pdf-lib";

const pipelineAsync = promisify(pipeline);

// Ghostscript download URLs for Windows
const GHOSTSCRIPT_URLS = {
  x64: "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs1000/gs1000w64.exe",
  x86: "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs1000/gs1000w32.exe",
};

let ghostscriptPath: string | null = null;
let isInstallingGhostscript = false;
let ghostscriptInstallationDeclined = false;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// Check if Ghostscript is available
async function checkGhostscript(): Promise<boolean> {
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

// Get PDF page count
async function getPdfPageCount(filePath: string): Promise<number> {
  try {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc.getPageCount();
  } catch (error) {
    console.error("Error reading PDF page count:", error);
    return 0;
  }
}

// Generate PDF thumbnail using Ghostscript
async function generatePdfThumbnail(
  filePath: string,
  pageNumber: number
): Promise<string> {
  if (!ghostscriptPath) {
    throw new Error("Ghostscript not available");
  }

  return new Promise((resolve, reject) => {
    const outputPath = path.join(
      app.getPath("temp"),
      `thumb_${Date.now()}_${pageNumber}.png`
    );
    const command = `"${ghostscriptPath}" -sDEVICE=pngalpha -dFirstPage=${pageNumber} -dLastPage=${pageNumber} -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r150 -sOutputFile="${outputPath}" -dNOPAUSE -dBATCH "${filePath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      // Read the generated PNG and convert to base64
      try {
        const imageBuffer = fs.readFileSync(outputPath);
        const base64 = imageBuffer.toString("base64");
        const dataUrl = `data:image/png;base64,${base64}`;

        // Clean up the temporary file
        fs.unlinkSync(outputPath);

        resolve(dataUrl);
      } catch (readError) {
        reject(readError);
      }
    });
  });
}

// Download Ghostscript installer with progress
async function downloadGhostscript(
  progressCallback: (progress: number) => void
): Promise<string> {
  const is64Bit = process.arch === "x64";
  const url = is64Bit ? GHOSTSCRIPT_URLS.x64 : GHOSTSCRIPT_URLS.x86;
  const installerPath = path.join(
    app.getPath("temp"),
    `gs1000${is64Bit ? "w64" : "w32"}.exe`
  );

  return new Promise((resolve, reject) => {
    const makeRequest = (url: string) => {
      https
        .get(url, (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            // Follow redirect
            makeRequest(response.headers.location!);
            return;
          }

          if (response.statusCode !== 200) {
            reject(
              new Error(
                `HTTP ${response.statusCode}: ${response.statusMessage}`
              )
            );
            return;
          }

          const totalSize = parseInt(
            response.headers["content-length"] || "0",
            10
          );
          let downloadedSize = 0;

          const fileStream = fs.createWriteStream(installerPath);
          response.pipe(fileStream);

          response.on("data", (chunk) => {
            downloadedSize += chunk.length;
            if (totalSize > 0) {
              const progress = (downloadedSize / totalSize) * 100;
              progressCallback(progress);
            }
          });

          fileStream.on("finish", () => {
            fileStream.close();
            resolve(installerPath);
          });

          fileStream.on("error", (err) => {
            fs.unlink(installerPath, () => {}); // Delete the file if it exists
            reject(err);
          });
        })
        .on("error", reject);
    };

    makeRequest(url);
  });
}

// Install Ghostscript
async function installGhostscript(
  installerPath: string,
  progressCallback: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const installProcess = exec(`"${installerPath}" /S`, (error) => {
      if (error) {
        reject(error);
        return;
      }

      // Wait a bit for installation to complete
      setTimeout(async () => {
        const isAvailable = await checkGhostscript();
        if (isAvailable) {
          resolve();
        } else {
          reject(new Error("Ghostscript installation completed but not found"));
        }
      }, 5000);
    });

    // Simulate progress during installation
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 90) progress = 90;
      progressCallback(progress);
    }, 1000);

    installProcess.on("close", () => {
      clearInterval(progressInterval);
      progressCallback(100);
    });
  });
}

// Initialize Ghostscript
async function initializeGhostscript(): Promise<boolean> {
  if (ghostscriptPath) {
    return true;
  }

  if (isInstallingGhostscript || ghostscriptInstallationDeclined) {
    return false;
  }

  const isAvailable = await checkGhostscript();
  if (isAvailable) {
    return true;
  }

  // Only offer installation on Windows
  if (process.platform !== "win32") {
    return false;
  }

  isInstallingGhostscript = true;

  try {
    const installerPath = await downloadGhostscript((progress) => {
      // Send progress to renderer
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send("ghostscript-download-progress", progress);
      });
    });

    await installGhostscript(installerPath, (progress) => {
      // Send progress to renderer
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send("ghostscript-install-progress", progress);
      });
    });

    isInstallingGhostscript = false;
    return true;
  } catch (error) {
    console.error("Failed to install Ghostscript:", error);
    isInstallingGhostscript = false;
    return false;
  }
}

// Merge PDFs using pdf-lib with specific page orders
async function mergePdfs(
  inputPaths: string[],
  outputPath: string,
  pageOrders?: number[][]
): Promise<void> {
  try {
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < inputPaths.length; i++) {
      const inputPath = inputPaths[i];
      const pdfBytes = fs.readFileSync(inputPath);
      const pdf = await PDFDocument.load(pdfBytes);

      // If pageOrders is provided, use specific pages, otherwise use all pages
      const pageIndices =
        pageOrders && pageOrders[i]
          ? pageOrders[i].map((pageNum) => pageNum) // Convert to 0-based indices
          : pdf.getPageIndices();

      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedPdfBytes);
  } catch (error) {
    throw new Error(`Failed to merge PDFs: ${error}`);
  }
}

// Merge PDFs with exact page sequence
async function mergePdfsWithSequence(
  pageSequence: Array<{ filePath: string; pageIndex: number }>,
  outputPath: string
): Promise<void> {
  try {
    const mergedPdf = await PDFDocument.create();

    // Load all PDFs once to avoid repeated file I/O
    const pdfCache = new Map<string, PDFDocument>();

    for (const { filePath, pageIndex } of pageSequence) {
      // Load PDF if not already cached
      if (!pdfCache.has(filePath)) {
        const pdfBytes = fs.readFileSync(filePath);
        const pdf = await PDFDocument.load(pdfBytes);
        pdfCache.set(filePath, pdf);
      }

      const pdf = pdfCache.get(filePath)!;
      const copiedPages = await mergedPdf.copyPages(pdf, [pageIndex]);
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedPdfBytes);
  } catch (error) {
    throw new Error(`Failed to merge PDFs: ${error}`);
  }
}

// IPC handlers
ipcMain.handle("check-ghostscript", async () => {
  return await initializeGhostscript();
});

ipcMain.handle("get-ghostscript-path", () => {
  return ghostscriptPath;
});

ipcMain.handle("get-pdf-page-count", async (event, filePath: string) => {
  return await getPdfPageCount(filePath);
});

ipcMain.handle(
  "generate-pdf-thumbnail",
  async (event, filePath: string, pageNumber: number) => {
    return await generatePdfThumbnail(filePath, pageNumber);
  }
);

ipcMain.handle(
  "convert-to-pdfa",
  async (event, inputPath: string, outputPath: string) => {
    if (!ghostscriptPath) {
      throw new Error("Ghostscript not available");
    }

    return new Promise((resolve, reject) => {
      const command = `"${ghostscriptPath}" -sDEVICE=pdfwrite -dPDFA=1 -dPDFACompatibilityPolicy=1 -sOutputFile="${outputPath}" -dNOPAUSE -dBATCH "${inputPath}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(outputPath);
      });
    });
  }
);

ipcMain.handle(
  "merge-pdfs",
  async (
    event,
    inputPaths: string[],
    outputPath: string,
    pageOrders?: number[][]
  ) => {
    return await mergePdfs(inputPaths, outputPath, pageOrders);
  }
);

ipcMain.handle(
  "merge-pdfs-sequence",
  async (
    event,
    pageSequence: Array<{ filePath: string; pageIndex: number }>,
    outputPath: string
  ) => {
    return await mergePdfsWithSequence(pageSequence, outputPath);
  }
);

ipcMain.handle("select-files", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  });
  return result.filePaths;
});

ipcMain.handle("select-save-path", async (event, defaultName: string) => {
  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [{ name: "PDF Files", extensions: ["pdf"] }],
  });
  return result.filePath;
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
