import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { FolderOpen, Merge, FileCheck, FileText, Trash2 } from "lucide-react";

interface ControlsProps {
  onSelectFiles: () => void;
  onMergeFiles: () => void;
  onConvertSingle: () => void;
  onConvertMerged: () => void;
  onClearFiles: () => void;
  hasFiles: boolean;
  hasMergedFile: boolean;
  ghostscriptAvailable: boolean;
}

export function Controls({
  onSelectFiles,
  onMergeFiles,
  onConvertSingle,
  onConvertMerged,
  onClearFiles,
  hasFiles,
  hasMergedFile,
  ghostscriptAvailable,
}: ControlsProps) {
  return (
    <Card className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b rounded-none border-x-0 border-t-0 mx-6">
      <CardContent className="py-3 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          {/* Left side - First three buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={onSelectFiles} variant="default">
              <FolderOpen className="h-4 w-4 mr-2" />
              Adicionar PDF(s)
            </Button>
            <Button
              onClick={onMergeFiles}
              disabled={!hasFiles}
              variant="secondary"
            >
              <Merge className="h-4 w-4 mr-2" />
              Juntar PDFs
            </Button>
            <Button
              onClick={onConvertMerged}
              disabled={!hasMergedFile || !ghostscriptAvailable}
              variant="outline"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Converter Junção para PDF/A
            </Button>
            <Button
              onClick={onClearFiles}
              disabled={!hasFiles}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Seleção
            </Button>
          </div>

          {/* Right side - Last button */}
          <div>
            <Button
              onClick={onConvertSingle}
              disabled={!ghostscriptAvailable}
              variant="default"
            >
              <FileText className="h-4 w-4 mr-2" />
              Converter um PDF para PDF/A
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
