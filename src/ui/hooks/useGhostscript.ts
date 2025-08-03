import { useState } from "react";
import { useElectronAPI } from "./useElectronAPI";

export function useGhostscript() {
  const electronAPI = useElectronAPI();
  const [available, setAvailable] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  async function checkGhostscriptStatus() {
    try {
      const isAvailable = await electronAPI.checkGhostscript();
      setAvailable(isAvailable);
    } catch (error) {
      console.error("Error checking Ghostscript availability:", error);
      setAvailable(false);
    }
  }

  return {
    available,
    setAvailable,
    checkGhostscriptStatus,
    isInstalling,
    setIsInstalling,
    progress,
    setProgress,
  };
}
