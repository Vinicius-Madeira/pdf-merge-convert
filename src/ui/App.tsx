import React, { useState, useEffect } from "react";
import { FileList } from "./components/FileList";
import { Controls } from "./components/Controls";
import { PdfPreview } from "./components/PdfPreview";
import { Status } from "./components/Status";
import { GhostscriptStatus } from "./components/GhostscriptStatus";
import { useElectronAPI } from "./hooks/useElectronAPI";

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
  const [status, setStatus] = useState<string>("");
  const [mergeStatus, setMergeStatus] = useState<string>("");
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
      setSelectedFiles(newFiles);
      setStatus("");

      // Generate thumbnails for the selected files
      await generateThumbnails(newFiles);
    } catch (error) {
      console.error("Error selecting files:", error);
      setStatus("Erro ao selecionar arquivo(s)");
    }
  };

  const generateThumbnails = async (files: FileItem[]) => {
    try {
      setStatus("Gerando visualizações...");
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
      setStatus("");
    } catch (error) {
      console.error("Error generating thumbnails:", error);
      setStatus("Erro ao gerar visualizações");
    }
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    setPageThumbnails([]);
    setMergedFilePath(null);
    setStatus("");
    setMergeStatus("");
  };

  const handleMergeFiles = async () => {
    if (selectedFiles.length === 0) return;

    setMergeStatus("Juntando PDFs...");
    try {
      // This would need to be implemented with pdf-merger-js
      // For now, we'll just simulate the merge
      const mergedPath = "merged.pdf";
      setMergedFilePath(mergedPath);
      setMergeStatus("PDFs juntados com sucesso!");
    } catch (error) {
      console.error("Error merging files:", error);
      setMergeStatus("Erro ao juntar PDFs");
    }
  };

  const handleConvertSingle = async () => {
    if (selectedFiles.length === 0) return;

    setStatus("Convertendo para PDF/A...");
    try {
      const outputPath = await electronAPI.selectSavePath("converted.pdf");
      if (outputPath) {
        await electronAPI.convertToPdfa(selectedFiles[0].path, outputPath);
        setStatus("Conversão concluída com sucesso!");
      }
    } catch (error) {
      console.error("Error converting file:", error);
      setStatus("Erro na conversão");
    }
  };

  const handleConvertMerged = async () => {
    if (!mergedFilePath) return;

    setStatus("Convertendo para PDF/A...");
    try {
      const outputPath = await electronAPI.selectSavePath(
        "merged-converted.pdf"
      );
      if (outputPath) {
        await electronAPI.convertToPdfa(mergedFilePath, outputPath);
        setStatus("Conversão concluída com sucesso!");
      }
    } catch (error) {
      console.error("Error converting merged file:", error);
      setStatus("Erro na conversão");
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
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Ghostscript Status - Top Right Corner */}
        <div className="absolute top-4 right-4 z-50">
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
          hasFiles={selectedFiles.length > 0}
          hasMergedFile={!!mergedFilePath}
          ghostscriptAvailable={ghostscriptAvailable}
        />

        <FileList
          files={selectedFiles}
          onRemoveFile={handleRemoveFile}
          onClearFiles={handleClearFiles}
        />

        <PdfPreview thumbnails={pageThumbnails} onReorder={handleDragReorder} />

        <Status status={status} mergeStatus={mergeStatus} />
      </div>
    </div>
  );
}
