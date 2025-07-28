import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle, AlertTriangle, Download, X } from "lucide-react";
import { useState } from "react";

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
  const [showModal, setShowModal] = useState(!available);

  // If available, show a small notification
  if (available) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Badge
          variant="default"
          className="flex items-center space-x-1 bg-green-500 hover:bg-green-600"
        >
          <CheckCircle className="h-3 w-3" />
          <span>Ghostscript</span>
        </Badge>
      </div>
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
              <span>Ghostscript Required</span>
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
            <p>Ghostscript is required for PDF/A conversion functionality.</p>
            <p className="mt-2">Some features may not work without it.</p>
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
                Installing... {Math.round(progress)}%
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={onInstall} className="w-full" variant="default">
                <Download className="h-4 w-4 mr-2" />
                Install Ghostscript
              </Button>
              <Button
                onClick={() => setShowModal(false)}
                className="w-full"
                variant="outline"
              >
                Continue without Ghostscript
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
