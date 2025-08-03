import { useState } from "react";
import { FileItem, PageThumbnail } from "../types/files";
import { useElectronAPI } from "./useElectronAPI";
import { toast } from "sonner";

export function useFiles() {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [mergedFilePath, setMergedFilePath] = useState<string | null>(null);
  const [pageThumbnails, setPageThumbnails] = useState<PageThumbnail[]>([]);
  const electronAPI = useElectronAPI();

  async function handleSelectFiles() {
    try {
      const filePaths = await electronAPI.selectFiles();
      const newFiles = filePaths.map((filepath: string) => ({
        path: filepath,
        name: filepath.split(/[/\\]/).pop() || filepath,
      }));
      if (newFiles.length === 0) return;

      // Add new files to the existing selection
      const allFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(allFiles);
      // Generate thumbnails for all files
      await generateThumbnails(allFiles);
    } catch (error) {
      console.error("Error selecting files:", error);
      toast.error("Erro ao selecionar arquivo(s)");
    }
  }

  async function generateThumbnails(files: FileItem[]) {
    try {
      toast.loading("Gerando miniaturas...", { duration: 5000 });
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
      toast.error("Erro ao gerar miniaturas");
    }
  }

  async function handleMergeFiles() {
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
  }

  async function handleConvertSingle() {
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
  }

  async function handleConvertMerged() {
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
  }

  function handleRemoveFile(index: number) {
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
  }

  function handleDragReorder(newOrder: PageThumbnail[]) {
    setPageThumbnails(newOrder);
  }

  function handleClearFiles() {
    setSelectedFiles([]);
    setPageThumbnails([]);
    setMergedFilePath(null);
  }

  return {
    selectedFiles,
    mergedFilePath,
    pageThumbnails,
    handleSelectFiles,
    handleMergeFiles,
    handleConvertSingle,
    handleConvertMerged,
    handleRemoveFile,
    handleDragReorder,
    handleClearFiles,
  };
}
