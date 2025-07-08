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
    exec("gs --version", (error, stdout, stderr) => {
      if (error) {
        resolve(false);
      } else {
        ghostscriptPath = "gs";
        resolve(true);
      }
    });
  });
}

// Download Ghostscript installer
async function downloadGhostscript() {
  const is64Bit = process.arch === "x64";
  const url = is64Bit ? GHOSTSCRIPT_URLS.x64 : GHOSTSCRIPT_URLS.x86;
  const installerPath = path.join(
    app.getPath("temp"),
    "ghostscript-installer.exe"
  );

  console.log("Downloading Ghostscript...");

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(installerPath);
    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve(installerPath);
          });
        } else {
          reject(
            new Error(`Failed to download Ghostscript: ${response.statusCode}`)
          );
        }
      })
      .on("error", reject);
  });
}

// Install Ghostscript
async function installGhostscript(installerPath) {
  return new Promise((resolve, reject) => {
    const installDir = path.join(
      process.env.PROGRAMFILES || "C:\\Program Files",
      "gs",
      "gs10.00.0"
    );

    exec(
      `"${installerPath}" /S /D="${installDir}"`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          // Wait a moment for installation to complete
          setTimeout(() => {
            ghostscriptPath = path.join(installDir, "bin", "gswin64c.exe");
            resolve();
          }, 5000);
        }
      }
    );
  });
}

// Initialize Ghostscript on app startup
async function initializeGhostscript() {
  const isAvailable = await checkGhostscript();

  if (!isAvailable && process.platform === "win32") {
    try {
      const installerPath = await downloadGhostscript();
      await installGhostscript(installerPath);
      console.log("Ghostscript installed successfully");
    } catch (error) {
      console.error("Failed to install Ghostscript:", error);
      // Continue without Ghostscript - user will get error messages
    }
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
