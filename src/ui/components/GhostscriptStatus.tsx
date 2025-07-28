import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle, AlertTriangle, Download } from "lucide-react";

interface GhostscriptStatusProps {
  available: boolean;
  isInstalling: boolean;
  progress: number;
  onInstall: () => void;
}

export function GhostscriptStatus({
  available,
  isInstalling,
  progress,
  onInstall,
}: GhostscriptStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Ghostscript Status</span>
          {available ? (
            <Badge variant="default" className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>Instalado</span>
            </Badge>
          ) : (
            <Badge
              variant="destructive"
              className="flex items-center space-x-1"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Não Instalado</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {available ? (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Ghostscript está instalado e pronto para uso</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Ghostscript não está instalado</span>
            </div>

            {isInstalling ? (
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  Instalando... {Math.round(progress)}%
                </span>
              </div>
            ) : (
              <Button onClick={onInstall} className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Instalar Ghostscript
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              Algumas funcionalidades podem não funcionar sem o Ghostscript
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
