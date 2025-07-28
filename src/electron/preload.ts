import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  checkGhostscript: () => ipcRenderer.invoke("check-ghostscript"),
  getGhostscriptPath: () => ipcRenderer.invoke("get-ghostscript-path"),
  getPdfPageCount: (filePath: string) =>
    ipcRenderer.invoke("get-pdf-page-count", filePath),
  generatePdfThumbnail: (filePath: string, pageNumber: number) =>
    ipcRenderer.invoke("generate-pdf-thumbnail", filePath, pageNumber),
  convertToPdfa: (inputPath: string, outputPath: string) =>
    ipcRenderer.invoke("convert-to-pdfa", inputPath, outputPath),
  selectFiles: () => ipcRenderer.invoke("select-files"),
  selectSavePath: (defaultName: string) =>
    ipcRenderer.invoke("select-save-path", defaultName),
  onGhostscriptDownloadProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on("ghostscript-download-progress", (event, progress) =>
      callback(progress)
    );
  },
  onGhostscriptInstallProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on("ghostscript-install-progress", (event, progress) =>
      callback(progress)
    );
  },
});
