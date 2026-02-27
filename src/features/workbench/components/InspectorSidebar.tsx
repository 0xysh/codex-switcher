import { IconActivity, IconAlertTriangle, IconCheck } from "../../../components/ui";
import { getRelativeTime } from "../selectors";
import type { ActivityEntry, CodexProcessInfo } from "../types";

interface InspectorSidebarProps {
  processInfo: CodexProcessInfo | null;
  activity: ActivityEntry[];
}

function formatProcessHeadline(processInfo: CodexProcessInfo | null): string {
  if (!processInfo) {
    return "Checking process status…";
  }

  if (processInfo.count === 0) {
    return "No Codex process is currently running.";
  }

  return `${processInfo.count} Codex process${processInfo.count === 1 ? " is" : "es are"} still running.`;
}

export function InspectorSidebar({ processInfo, activity }: InspectorSidebarProps) {
  const hasRunningProcesses = !!processInfo && processInfo.count > 0;
  const isCheckingProcessStatus = processInfo === null;
  const blockingPids = processInfo?.pids.slice(0, 4) ?? [];

  const processChipClass = isCheckingProcessStatus
    ? "chip"
    : hasRunningProcesses
      ? "chip chip-warning"
      : "chip chip-success";

  const processChipText = isCheckingProcessStatus
    ? "Checking running processes"
    : hasRunningProcesses
      ? `Blocking PIDs: ${blockingPids.join(", ")}${processInfo && processInfo.pids.length > blockingPids.length ? "…" : ""}`
      : "No blocking processes";

  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <section className="surface-panel p-5">
        <p className="section-title">Process Status</p>
        <p className="mt-3 text-sm text-secondary">{formatProcessHeadline(processInfo)}</p>

        <div className={`mt-3 ${processChipClass}`}>
          {isCheckingProcessStatus ? null : hasRunningProcesses ? (
            <IconAlertTriangle className="h-3.5 w-3.5" />
          ) : (
            <IconCheck className="h-3.5 w-3.5" />
          )}
          {processChipText}
        </div>
      </section>

      <section className="surface-panel p-5">
        <p className="section-title">Recent Activity</p>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">No actions yet in this session.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {activity.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-xs"
              >
                <p className="mb-1 flex items-center gap-1 font-semibold text-[var(--text-primary)]">
                  {entry.kind === "success" ? (
                    <IconCheck className="h-3.5 w-3.5 text-[var(--success)]" />
                  ) : entry.kind === "warning" ? (
                    <IconAlertTriangle className="h-3.5 w-3.5 text-[var(--warning)]" />
                  ) : (
                    <IconActivity className="h-3.5 w-3.5 text-secondary" />
                  )}
                  {entry.kind === "success" ? "Success" : entry.kind === "warning" ? "Warning" : "Info"}
                </p>
                <p className="text-secondary">{entry.text}</p>
                <p className="mt-1 text-muted">{getRelativeTime(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
