import { IconActivity, IconAlertTriangle, IconCheck } from "../../../components/ui";
import { getRelativeTime } from "../selectors";
import type { ActivityEntry, CodexProcessInfo } from "../types";

interface ProcessStatusPanelProps {
  processInfo: CodexProcessInfo | null;
}

interface RecentActivityPanelProps {
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

export function ProcessStatusPanel({ processInfo }: ProcessStatusPanelProps) {
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
    <section className="surface-panel reveal-rise p-5">
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
  );
}

export function RecentActivityPanel({ activity }: RecentActivityPanelProps) {
  return (
    <section className="surface-panel reveal-rise stagger-3 border-[var(--border-strong)] p-4 sm:p-5">
      <p className="section-title">Recent Activity</p>
      {activity.length === 0 ? (
        <p className="mt-3 text-sm text-secondary">No actions yet in this session.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {activity.map((entry) => (
            <li
              key={entry.id}
              className={`rounded-xl border bg-[var(--bg-surface)] px-3 py-2.5 text-xs shadow-[var(--shadow-soft)] ${
                entry.kind === "success"
                  ? "border-[var(--success-border)]"
                  : entry.kind === "warning"
                    ? "border-[var(--warning-border)]"
                    : "border-[var(--border-soft)]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
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
                <p className="mono-data text-[10px] uppercase tracking-[0.1em] text-muted">
                  {getRelativeTime(entry.createdAt)}
                </p>
              </div>
              <p className="text-secondary">{entry.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface InspectorSidebarProps {
  processInfo: CodexProcessInfo | null;
  activity: ActivityEntry[];
}

export function InspectorSidebar({ processInfo, activity }: InspectorSidebarProps) {
  return (
    <aside className="space-y-5">
      <ProcessStatusPanel processInfo={processInfo} />
      <RecentActivityPanel activity={activity} />
    </aside>
  );
}
