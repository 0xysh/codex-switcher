import { useCallback, useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/core";

import type { CodexProcessInfo } from "../../../types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useProcessMonitor(intervalMs = 4000) {
  const [processInfo, setProcessInfo] = useState<CodexProcessInfo | null>(null);

  const refreshProcessInfo = useCallback(async () => {
    try {
      const info = await invoke<CodexProcessInfo>("check_codex_processes");
      setProcessInfo(info);
      return info;
    } catch (error) {
      console.error("Failed to check processes:", getErrorMessage(error));
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshProcessInfo();

    const interval = setInterval(() => {
      void refreshProcessInfo();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, refreshProcessInfo]);

  return {
    processInfo,
    refreshProcessInfo,
  };
}
