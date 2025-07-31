import React, { useState, useEffect } from "react";
import { FileList } from "./components/FileList";
import { Controls } from "./components/Controls";
import { PdfPreview } from "./components/PdfPreview";
import { GhostscriptStatus } from "./components/GhostscriptStatus";
import { ThemeToggle } from "./components/ThemeToggle";
import { useElectronAPI } from "./hooks/useElectronAPI";
import { toast, Toaster } from "sonner";

interface FileItem {
  path: string;
  name: string;
  thumbnail?: string;
}

interface PageThumbnail {
  id: string;
  src: string;
  fileIndex: number;
  pageIndex: number;
  fileName: string;
}

export default function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [mergedFilePath, setMergedFilePath] = useState<string | null>(null);
  const [pageThumbnails, setPageThumbnails] = useState<PageThumbnail[]>([]);

  const [ghostscriptAvailable, setGhostscriptAvailable] =
    useState<boolean>(false);
  const [isInstallingGhostscript, setIsInstallingGhostscript] =
    useState<boolean>(false);
  const [ghostscriptProgress, setGhostscriptProgress] = useState<number>(0);

  const electronAPI = useElectronAPI();

  useEffect(() => {
    checkGhostscriptStatus();
  }, []);

  const checkGhostscriptStatus = async () => {
    try {
      const available = await electronAPI.checkGhostscript();
      setGhostscriptAvailable(available);
    } catch (error) {
      console.error("Error checking Ghostscript status:", error);
      setGhostscriptAvailable(false);
    }
  };

  const handleSelectFiles = async () => {
    try {
      const filePaths = await electronAPI.selectFiles();
      const newFiles = filePaths.map((filePath: string) => ({
        path: filePath,
        name: filePath.split(/[/\\]/).pop() || filePath,
      }));
      if (newFiles.length === 0) return;

      // Add new files to existing files instead of replacing
      const allFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(allFiles);
      // Generate thumbnails for all files (existing + new)
      await generateThumbnails(allFiles);
    } catch (error) {
      console.error("Error selecting files:", error);
      toast.error("Erro ao selecionar arquivo(s)");
    }
  };

  const generateThumbnails = async (files: FileItem[]) => {
    try {
      toast.loading("Gerando visualizações...", { duration: 5000 });
      const thumbnails: PageThumbnail[] = [];

      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];

        try {
          // Get the actual page count for this PDF
          const pageCount = await electronAPI.getPdfPageCount(file.path);

          if (pageCount === 0) {
            // Fallback to placeholder if PDF can't be read
            for (let pageIndex = 0; pageIndex < 3; pageIndex++) {
              thumbnails.push({
                id: `${fileIndex}-${pageIndex}`,
                src: `data:image/svg+xml;base64,${btoa(`
                  <svg width="150" height="200" xmlns="http://www.w3.org/2000/svg">
                    <rect width="150" height="200" fill="#f0f0f0" stroke="#ccc"/>
                    <text x="75" y="100" text-anchor="middle" fill="#666" font-size="14">
                      ${file.name}
                    </text>
                    <text x="75" y="120" text-anchor="middle" fill="#999" font-size="12">
                      Página ${pageIndex + 1}
                    </text>
                  </svg>
                `)}`,
                fileIndex,
                pageIndex,
                fileName: file.name,
              });
            }
          } else {
            // Generate real thumbnails for each page
            for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
              try {
                const thumbnailSrc = await electronAPI.generatePdfThumbnail(
                  file.path,
                  pageIndex + 1
                );
                thumbnails.push({
                  id: `${fileIndex}-${pageIndex}`,
                  src: thumbnailSrc,
                  fileIndex,
                  pageIndex,
                  fileName: file.name,
                });
              } catch (thumbnailError) {
                console.error(
                  `Error generating thumbnail for page ${pageIndex + 1}:`,
                  thumbnailError
                );
                // Fallback to placeholder for this page
                thumbnails.push({
                  id: `${fileIndex}-${pageIndex}`,
                  src: `data:image/svg+xml;base64,${btoa(`
                    <svg width="150" height="200" xmlns="http://www.w3.org/2000/svg">
                      <rect width="150" height="200" fill="#f0f0f0" stroke="#ccc"/>
                      <text x="75" y="100" text-anchor="middle" fill="#666" font-size="14">
                        ${file.name}
                      </text>
                      <text x="75" y="120" text-anchor="middle" fill="#999" font-size="12">
                        Página ${pageIndex + 1}
                      </text>
                    </svg>
                  `)}`,
                  fileIndex,
                  pageIndex,
                  fileName: file.name,
                });
              }
            }
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          // Add placeholder pages for this file
          for (let pageIndex = 0; pageIndex < 3; pageIndex++) {
            thumbnails.push({
              id: `${fileIndex}-${pageIndex}`,
              src: `data:image/svg+xml;base64,${btoa(`
                <svg width="150" height="200" xmlns="http://www.w3.org/2000/svg">
                  <rect width="150" height="200" fill="#f0f0f0" stroke="#ccc"/>
                  <text x="75" y="100" text-anchor="middle" fill="#666" font-size="14">
                    ${file.name}
                  </text>
                  <text x="75" y="120" text-anchor="middle" fill="#999" font-size="12">
                    Página ${pageIndex + 1}
                  </text>
                </svg>
              `)}`,
              fileIndex,
              pageIndex,
              fileName: file.name,
            });
          }
        }
      }

      setPageThumbnails(thumbnails);
      toast.dismiss();
    } catch (error) {
      console.error("Error generating thumbnails:", error);
      toast.error("Erro ao gerar visualizações");
    }
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    setPageThumbnails([]);
    setMergedFilePath(null);
  };

  const handleMergeFiles = async () => {
    if (selectedFiles.length === 0) return;

    const loadingToast = toast.loading("Juntando PDFs...");
    try {
      // Prompt user to select save location
      const outputPath = await electronAPI.selectSavePath("merged.pdf");
      if (!outputPath) {
        toast.dismiss(loadingToast);
        return;
      }

      // Create a flat list of pages in the exact order they appear in thumbnails
      const pageSequence = pageThumbnails.map((thumbnail) => ({
        filePath: selectedFiles[thumbnail.fileIndex].path,
        pageIndex: thumbnail.pageIndex,
      }));

      // Merge the PDFs with exact page sequence
      await electronAPI.mergePdfsSequence(pageSequence, outputPath);

      setMergedFilePath(outputPath);
      toast.dismiss(loadingToast);
      toast.success("PDFs juntados com sucesso!");
    } catch (error) {
      console.error("Error merging files:", error);
      toast.dismiss(loadingToast);
      toast.error("Erro ao juntar PDFs");
    }
  };

  const handleConvertSingle = async () => {
    const loadingToast = toast.loading(
      "Selecionando arquivo para conversão..."
    );
    try {
      // Let user select a specific file for conversion
      const filePaths = await electronAPI.selectFiles();
      if (filePaths.length === 0) {
        toast.dismiss(loadingToast);
        return;
      }

      const selectedFile = filePaths[0]; // Take the first selected file
      toast.dismiss(loadingToast);

      const convertingToast = toast.loading("Convertendo para PDF/A...");
      const outputPath = await electronAPI.selectSavePath("converted.pdf");
      if (outputPath) {
        await electronAPI.convertToPdfa(selectedFile, outputPath);

        // Verify the conversion was successful
        const isCompliant = await electronAPI.checkPdfACompliance(outputPath);

        toast.dismiss(convertingToast);
        if (isCompliant) {
          toast.success("Conversão para PDF/A concluída com sucesso!");
        } else {
          toast.warning(
            "Arquivo convertido, mas pode não estar totalmente compatível com PDF/A"
          );
        }
      } else {
        toast.dismiss(convertingToast);
      }
    } catch (error) {
      console.error("Error converting file:", error);
      toast.dismiss(loadingToast);
      toast.error(
        `Erro na conversão: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  };

  const handleConvertMerged = async () => {
    if (!mergedFilePath) return;

    const loadingToast = toast.loading("Convertendo para PDF/A...");
    try {
      const outputPath = await electronAPI.selectSavePath(
        "merged-converted.pdf"
      );
      if (outputPath) {
        await electronAPI.convertToPdfa(mergedFilePath, outputPath);

        // Verify the conversion was successful
        const isCompliant = await electronAPI.checkPdfACompliance(outputPath);

        toast.dismiss(loadingToast);
        if (isCompliant) {
          toast.success("Conversão para PDF/A concluída com sucesso!");
        } else {
          toast.warning(
            "Arquivo convertido, mas pode não estar totalmente compatível com PDF/A"
          );
        }
      } else {
        toast.dismiss(loadingToast);
      }
    } catch (error) {
      console.error("Error converting merged file:", error);
      toast.dismiss(loadingToast);
      toast.error(
        `Erro na conversão: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter(
      (_: FileItem, i: number) => i !== index
    );
    setSelectedFiles(newFiles);

    // Regenerate thumbnails for remaining files
    if (newFiles.length > 0) {
      generateThumbnails(newFiles);
    } else {
      setPageThumbnails([]);
    }
  };

  const handleDragReorder = (newOrder: PageThumbnail[]) => {
    setPageThumbnails(newOrder);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <div className="container mx-auto max-w-7xl space-y-6 pt-20 px-6">
        {/* Theme Toggle and Ghostscript Status - Top Right Corner */}
        <div className="fixed top-0 right-12 z-50 flex items-center space-x-2">
          <ThemeToggle />
          <GhostscriptStatus
            available={ghostscriptAvailable}
            isInstalling={isInstallingGhostscript}
            progress={ghostscriptProgress}
            onInstall={checkGhostscriptStatus}
          />
        </div>

        <Controls
          onSelectFiles={handleSelectFiles}
          onMergeFiles={handleMergeFiles}
          onConvertSingle={handleConvertSingle}
          onConvertMerged={handleConvertMerged}
          onClearFiles={handleClearFiles}
          hasFiles={selectedFiles.length > 0}
          hasMergedFile={!!mergedFilePath}
          ghostscriptAvailable={ghostscriptAvailable}
        />

        <FileList files={selectedFiles} onRemoveFile={handleRemoveFile} />

        <PdfPreview thumbnails={pageThumbnails} onReorder={handleDragReorder} />
      </div>
    </div>
  );
}
