import { useEffect } from "react";
import { FileList } from "./components/FileList";
import { Controls } from "./components/Controls";
import { PdfPreview } from "./components/PdfPreview";
import { GhostscriptStatus } from "./components/GhostscriptStatus";
import { ThemeToggle } from "./components/ThemeToggle";
import { Toaster } from "sonner";
import { useGhostscript } from "./hooks/useGhostscript";
import { useFiles } from "./hooks/useFiles";

export default function App() {
  const {
    selectedFiles,
    mergedFilePath,
    pageThumbnails,
    handleSelectFiles,
    handleMergeFiles,
    handleConvertSingle,
    handleConvertMerged,
    handleClearFiles,
    handleRemoveFile,
    handleDragReorder,
  } = useFiles();

  const { available: ghostscriptAvailable, checkGhostscriptStatus } =
    useGhostscript();

  useEffect(() => {
    checkGhostscriptStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <div className="container mx-auto max-w-7xl space-y-6 pt-20 px-6">
        {/* Theme Toggle and Ghostscript Status - Top Right Corner */}
        <div className="fixed top-0 right-12 z-50 flex items-center space-x-2">
          <ThemeToggle />
          <GhostscriptStatus
            available={ghostscriptAvailable}
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
