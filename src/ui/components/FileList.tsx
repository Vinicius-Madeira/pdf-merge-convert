import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";

interface FileItem {
  path: string;
  name: string;
  thumbnail?: string;
}

interface FileListProps {
  files: FileItem[];
  onRemoveFile: (index: number) => void;
}

export function FileList({ files, onRemoveFile }: FileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arquivos Selecionados ({files.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={file.path}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
            >
              <div className="flex items-center space-x-3">
                <Badge variant="secondary">PDF</Badge>
                <span className="font-medium text-sm truncate">
                  {file.name}
                </span>
              </div>
              <Button
                onClick={() => onRemoveFile(index)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
