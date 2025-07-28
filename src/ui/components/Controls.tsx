import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ControlsProps {
  onSelectFiles: () => void;
  onClearFiles: () => void;
  onMergeFiles: () => void;
  onConvertSingle: () => void;
  onConvertMerged: () => void;
  hasFiles: boolean;
  hasMergedFile: boolean;
  ghostscriptAvailable: boolean;
}

export function Controls({
  onSelectFiles,
  onClearFiles,
  onMergeFiles,
  onConvertSingle,
  onConvertMerged,
  hasFiles,
  hasMergedFile,
  ghostscriptAvailable,
}: ControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Controles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Button
              onClick={onSelectFiles}
              className="w-full"
              variant="default"
            >
              Selecionar PDFs
            </Button>
            <Button
              onClick={onMergeFiles}
              disabled={!hasFiles}
              className="w-full"
              variant="secondary"
            >
              Juntar PDFs
            </Button>
            <Button
              onClick={onConvertMerged}
              disabled={!hasMergedFile || !ghostscriptAvailable}
              className="w-full"
              variant="outline"
            >
              Converter Juntado para PDF/A
            </Button>
            <Button
              onClick={onClearFiles}
              disabled={!hasFiles}
              className="w-full"
              variant="destructive"
            >
              Limpar Seleção
            </Button>
          </div>
          <div className="space-y-3">
            <Button
              onClick={onConvertSingle}
              disabled={!hasFiles || !ghostscriptAvailable}
              className="w-full h-full"
              variant="default"
            >
              Converter PDF para PDF/A
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
