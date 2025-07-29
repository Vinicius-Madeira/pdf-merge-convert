/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ElectronAPI {
  checkGhostscript: () => Promise<boolean>;
  getGhostscriptPath: () => Promise<string | null>;
  getPdfPageCount: (filePath: string) => Promise<number>;
  checkPdfACompliance: (filePath: string) => Promise<boolean>;
  generatePdfThumbnail: (
    filePath: string,
    pageNumber: number
  ) => Promise<string>;
  convertToPdfa: (inputPath: string, outputPath: string) => Promise<string>;
  mergePdfs: (
    inputPaths: string[],
    outputPath: string,
    pageOrders?: number[][]
  ) => Promise<void>;
  mergePdfsSequence: (
    pageSequence: Array<{ filePath: string; pageIndex: number }>,
    outputPath: string
  ) => Promise<void>;
  selectFiles: () => Promise<string[]>;
  selectSavePath: (defaultName: string) => Promise<string | undefined>;
  onGhostscriptDownloadProgress: (callback: (progress: number) => void) => void;
  onGhostscriptInstallProgress: (callback: (progress: number) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
