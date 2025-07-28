"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  checkGhostscript: () => electron.ipcRenderer.invoke("check-ghostscript"),
  getGhostscriptPath: () => electron.ipcRenderer.invoke("get-ghostscript-path"),
  getPdfPageCount: (filePath) => electron.ipcRenderer.invoke("get-pdf-page-count", filePath),
  generatePdfThumbnail: (filePath, pageNumber) => electron.ipcRenderer.invoke("generate-pdf-thumbnail", filePath, pageNumber),
  convertToPdfa: (inputPath, outputPath) => electron.ipcRenderer.invoke("convert-to-pdfa", inputPath, outputPath),
  selectFiles: () => electron.ipcRenderer.invoke("select-files"),
  selectSavePath: (defaultName) => electron.ipcRenderer.invoke("select-save-path", defaultName),
  onGhostscriptDownloadProgress: (callback) => {
    electron.ipcRenderer.on(
      "ghostscript-download-progress",
      (event, progress) => callback(progress)
    );
  },
  onGhostscriptInstallProgress: (callback) => {
    electron.ipcRenderer.on(
      "ghostscript-install-progress",
      (event, progress) => callback(progress)
    );
  }
});
