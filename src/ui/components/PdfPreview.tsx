import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { FileText, Move } from "lucide-react";

interface PageThumbnail {
  id: string;
  src: string;
  fileIndex: number;
  pageIndex: number;
  fileName: string;
}

interface PdfPreviewProps {
  thumbnails: PageThumbnail[];
  onReorder: (newOrder: PageThumbnail[]) => void;
}

export function PdfPreview({ thumbnails, onReorder }: PdfPreviewProps) {
  if (thumbnails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Visualização das Páginas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione arquivos PDF para ver as páginas aqui</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Visualização das Páginas</span>
          <Badge variant="secondary">{thumbnails.length} páginas</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 flex items-center space-x-2">
          <Move className="h-4 w-4" />
          <span>Arraste e solte as páginas para reorganizá-las</span>
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {thumbnails.map((thumbnail) => (
            <div
              key={thumbnail.id}
              className="group relative border rounded-lg p-2 bg-background hover:bg-muted/50 transition-colors cursor-move"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", thumbnail.id);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData("text/plain");
                const droppedId = thumbnail.id;

                if (draggedId !== droppedId) {
                  const newOrder = [...thumbnails];
                  const draggedIndex = newOrder.findIndex(
                    (t) => t.id === draggedId
                  );
                  const droppedIndex = newOrder.findIndex(
                    (t) => t.id === droppedId
                  );

                  const [draggedItem] = newOrder.splice(draggedIndex, 1);
                  newOrder.splice(droppedIndex, 0, draggedItem);

                  onReorder(newOrder);
                }
              }}
            >
              <div className="relative">
                <img
                  src={thumbnail.src}
                  alt={`Page ${thumbnail.pageIndex + 1}`}
                  className="w-full h-auto rounded border"
                />
                <div className="absolute top-1 right-1">
                  <Badge variant="outline" className="text-xs">
                    {thumbnail.pageIndex + 1}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-xs font-medium truncate">
                  {thumbnail.fileName}
                </div>
                <div className="text-xs text-muted-foreground">
                  Arquivo {thumbnail.fileIndex + 1} • Página{" "}
                  {thumbnail.pageIndex + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
