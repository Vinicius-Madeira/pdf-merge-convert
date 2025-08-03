import { useGhostscript } from "../hooks/useGhostscript";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { CheckCircle, AlertTriangle, Download, X } from "lucide-react";
import { useState } from "react";

interface GhostscriptStatusProps {
  available: boolean;
  onInstall: () => void;
}

export function GhostscriptStatus({
  available,
  onInstall,
}: GhostscriptStatusProps) {
  const { isInstalling, progress } = useGhostscript();
  const [showModal, setShowModal] = useState(!available);

  // If available, show a small check icon with tooltip
  if (available) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <CheckCircle className="h-4 w-4 text-green-500 cursor-pointer" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Ghostscript Instalado!</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // If not available, show modal
  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Ghostscript Necessário</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>
              Ghostscript é necessário para a funcionalidade de conversão PDF/A.
            </p>
            <p className="mt-2">
              Algumas funcionalidades podem não funcionar sem ele.
            </p>
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
            <div className="space-y-3">
              <Button onClick={onInstall} className="w-full" variant="default">
                <Download className="h-4 w-4 mr-2" />
                Instalar Ghostscript
              </Button>
              <Button
                onClick={() => setShowModal(false)}
                className="w-full"
                variant="outline"
              >
                Continuar sem Ghostscript
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
