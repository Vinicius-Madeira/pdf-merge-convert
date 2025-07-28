import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface ControlsProps {
  onSelectFiles: () => void;
  onMergeFiles: () => void;
  onConvertSingle: () => void;
  onConvertMerged: () => void;
  hasFiles: boolean;
  hasMergedFile: boolean;
  ghostscriptAvailable: boolean;
}

export function Controls({
  onSelectFiles,
  onMergeFiles,
  onConvertSingle,
  onConvertMerged,
  hasFiles,
  hasMergedFile,
  ghostscriptAvailable,
}: ControlsProps) {
  return (
    <Card className="fixed top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b rounded-lg">
      <CardContent className="py-3">
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={onSelectFiles} variant="default">
            Adicionar PDF(s)
          </Button>
          <Button
            onClick={onMergeFiles}
            disabled={!hasFiles}
            variant="secondary"
          >
            Juntar PDFs
          </Button>
          <Button
            onClick={onConvertMerged}
            disabled={!hasMergedFile || !ghostscriptAvailable}
            variant="outline"
          >
            Converter Juntado para PDF/A
          </Button>
          <Button
            onClick={onConvertSingle}
            disabled={!hasFiles || !ghostscriptAvailable}
            variant="default"
          >
            Converter um PDF para PDF/A
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
