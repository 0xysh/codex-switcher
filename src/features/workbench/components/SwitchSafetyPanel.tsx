import { IconAlertTriangle, IconShieldCheck } from "../../../components/ui";
import type { CodexProcessInfo, ProcessSummary } from "../types";

interface SwitchSafetyPanelProps {
  processInfo: CodexProcessInfo | null;
  processSummary: ProcessSummary;
}

export function SwitchSafetyPanel({ processInfo, processSummary }: SwitchSafetyPanelProps) {
  const hasRunningProcesses = !!processInfo && processInfo.count > 0;

  return (
    <div className="surface-panel px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-title">Switch Safety</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{processSummary.title}</h2>
          <p className="mt-1 text-sm text-secondary">{processSummary.text}</p>
        </div>

        <div className={processSummary.tone}>
          {hasRunningProcesses ? <IconAlertTriangle className="h-4 w-4" /> : <IconShieldCheck className="h-4 w-4" />}
          {hasRunningProcesses
            ? `Blocking PIDs: ${processInfo?.pids.slice(0, 3).join(", ")}${processInfo && processInfo.pids.length > 3 ? "…" : ""}`
            : "Switching available"}
        </div>
      </div>
    </div>
  );
}
