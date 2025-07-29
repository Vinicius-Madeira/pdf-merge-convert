import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { FileText, Move } from "lucide-react";
import { useState } from "react";

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
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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
          {thumbnails.map((thumbnail, index) => {
            const isDragging = draggedId === thumbnail.id;
            const isDragOver = dragOverId === thumbnail.id;

            return (
              <div
                key={thumbnail.id}
                className={`group relative border rounded-lg p-2 bg-background transition-all duration-200 ease-in-out cursor-move
                  ${
                    isDragging
                      ? "opacity-50 scale-95 rotate-2 shadow-lg"
                      : isDragOver
                      ? "border-primary/50 bg-primary/5 scale-105 shadow-md"
                      : "hover:bg-muted/50 hover:scale-102"
                  }
                  ${isDragging ? "z-50" : "z-10"}
                `}
                draggable
                onDragStart={(e) => {
                  setDraggedId(thumbnail.id);
                  e.dataTransfer.setData("text/plain", thumbnail.id);
                  e.dataTransfer.effectAllowed = "move";

                  // Add a slight delay to the drag start for better visual feedback
                  setTimeout(() => {
                    if (e.target instanceof HTMLElement) {
                      e.target.style.opacity = "0.5";
                    }
                  }, 0);
                }}
                onDragEnd={(e) => {
                  setDraggedId(null);
                  setDragOverId(null);
                  if (e.target instanceof HTMLElement) {
                    e.target.style.opacity = "";
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (thumbnail.id !== draggedId) {
                    setDragOverId(thumbnail.id);
                  }
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  // Only clear drag over if we're actually leaving the element
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverId(null);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDraggedId(null);
                  setDragOverId(null);

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
                    className={`w-full h-auto rounded transition-all duration-200
                      ${isDragOver ? "border-primary/50" : ""}
                    `}
                  />
                  <div className="absolute -top-1 -left-1">
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                  {isDragOver && (
                    <div className="absolute inset-0 bg-primary/10 border-2 rounded flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                        Soltar aqui
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-center font-medium truncate">
                    {removeFileExtension(thumbnail.fileName)}
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    Arquivo {thumbnail.fileIndex + 1} • Página{" "}
                    {thumbnail.pageIndex + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function removeFileExtension(filename: string) {
  const extensionIndex = filename.lastIndexOf(".");
  return filename.substring(0, extensionIndex);
}
