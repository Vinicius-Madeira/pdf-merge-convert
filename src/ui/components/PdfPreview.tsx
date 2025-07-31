import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { FileText, Move, GripVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll functionality
  const handleAutoScroll = (clientY: number) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollThreshold = 100; // pixels from edge to trigger scroll
    const scrollSpeed = 5;

    // Clear existing interval
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }

    // Check if we need to scroll up
    if (clientY - rect.top < scrollThreshold && container.scrollTop > 0) {
      autoScrollInterval.current = setInterval(() => {
        if (container.scrollTop <= 0) {
          if (autoScrollInterval.current) {
            clearInterval(autoScrollInterval.current);
            autoScrollInterval.current = null;
          }
          return;
        }
        container.scrollTop -= scrollSpeed;
      }, 16); // ~60fps
    }
    // Check if we need to scroll down
    else if (
      rect.bottom - clientY < scrollThreshold &&
      container.scrollTop < container.scrollHeight - container.clientHeight
    ) {
      autoScrollInterval.current = setInterval(() => {
        if (
          container.scrollTop >=
          container.scrollHeight - container.clientHeight
        ) {
          if (autoScrollInterval.current) {
            clearInterval(autoScrollInterval.current);
            autoScrollInterval.current = null;
          }
          return;
        }
        container.scrollTop += scrollSpeed;
      }, 16); // ~60fps
    }
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  // Create custom drag image
  const createDragImage = (thumbnail: PageThumbnail, index: number) => {
    const dragElement = document.createElement("div");
    dragElement.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      width: 120px;
      height: 80px;
      background: hsl(var(--background));
      border: 2px solid hsl(var(--primary));
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
      font-family: system-ui, -apple-system, sans-serif;
      color: hsl(var(--foreground));
      z-index: 1000;
    `;

    dragElement.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
        <span style="margin-left: 4px; font-size: 12px; font-weight: 600;">Página ${
          index + 1
        }</span>
      </div>
      <div style="font-size: 10px; color: hsl(var(--muted-foreground)); text-align: center; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${removeFileExtension(thumbnail.fileName)}
      </div>
    `;

    document.body.appendChild(dragElement);
    return dragElement;
  };

  useEffect(() => {
    // Cleanup auto-scroll on unmount
    return () => {
      stopAutoScroll();
    };
  }, []);

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
      <CardContent className="p-0">
        <p className="px-6 text-sm text-muted-foreground mb-4 flex items-center space-x-2">
          <Move className="h-4 w-4" />
          <span>Arraste e solte as páginas para reorganizá-las</span>
        </p>
        <div
          ref={containerRef}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-h-[70vh] overflow-y-auto p-6"
        >
          {thumbnails.map((thumbnail, index) => {
            const isDragging = draggedId === thumbnail.id;
            const isDragOver = dragOverId === thumbnail.id;

            return (
              <div
                key={thumbnail.id}
                className={`group relative border rounded-lg p-2 bg-background transition-all duration-200 ease-in-out cursor-move
                  ${
                    isDragging
                      ? "opacity-30 scale-95 rotate-1 shadow-lg"
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

                  // Create custom drag image
                  const dragImage = createDragImage(thumbnail, index);
                  e.dataTransfer.setDragImage(dragImage, 60, 40);

                  // Clean up drag image after a delay
                  setTimeout(() => {
                    document.body.removeChild(dragImage);
                  }, 100);
                }}
                onDrag={(e) => {
                  // Handle auto-scroll during drag
                  handleAutoScroll(e.clientY);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverId(null);
                  stopAutoScroll();
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
                  {/* Drag handle indicator */}
                  <div
                    className={`absolute top-1 right-1 z-10 p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDragging ? "opacity-100" : ""
                    }`}
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                  </div>

                  <div className="bg-white rounded p-2 shadow-sm">
                    <img
                      src={thumbnail.src}
                      alt={`Page ${thumbnail.pageIndex + 1}`}
                      className={`w-full h-auto rounded transition-all duration-200 select-none
                        ${isDragOver ? "border-primary/50" : ""}
                      `}
                      draggable={false}
                    />
                  </div>
                  <div className="absolute -top-1 -left-1">
                    <Badge variant="default" className="text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                  {isDragOver && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
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
