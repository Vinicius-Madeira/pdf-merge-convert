declare global {
  interface Window {
    electronAPI: {
      checkGhostscript: () => Promise<boolean>;
      getGhostscriptPath: () => Promise<string | null>;
      getPdfPageCount: (filePath: string) => Promise<number>;
      generatePdfThumbnail: (
        filePath: string,
        pageNumber: number
      ) => Promise<string>;
      convertToPdfa: (inputPath: string, outputPath: string) => Promise<string>;
      selectFiles: () => Promise<string[]>;
      selectSavePath: (defaultName: string) => Promise<string | undefined>;
      onGhostscriptDownloadProgress: (
        callback: (progress: number) => void
      ) => void;
      onGhostscriptInstallProgress: (
        callback: (progress: number) => void
      ) => void;
    };
  }
}

export function useElectronAPI() {
  return window.electronAPI;
}
