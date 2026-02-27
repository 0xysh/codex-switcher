import type { ThemePreference } from "../../../hooks/useTheme";
import type { AccountSummary } from "../types";
import type { CodexProcessInfo } from "../../../types";
import {
  Button,
  IconPlus,
  IconRefresh,
  IconSparkles,
  ThemeToggle,
} from "../../../components/ui";

interface WorkbenchHeaderProps {
  isRefreshing: boolean;
  summary: AccountSummary;
  processInfo: CodexProcessInfo | null;
  themePreference: ThemePreference;
  onRefreshUsage: () => void;
  onOpenAddAccount: () => void;
  onThemeChange: (value: ThemePreference) => void;
}

function getProcessChip(processInfo: CodexProcessInfo | null) {
  if (!processInfo) {
    return {
      className: "chip",
      label: "Processes checking",
      blockingPids: null as string | null,
    };
  }

  if (processInfo.count === 0) {
    return {
      className: "chip chip-success",
      label: "Processes clear",
      blockingPids: null as string | null,
    };
  }

  const pids = processInfo.pids.slice(0, 4);
  const suffix = processInfo.pids.length > pids.length ? "…" : "";

  return {
    className: "chip chip-warning",
    label: `${processInfo.count} process${processInfo.count === 1 ? "" : "es"} running`,
    blockingPids: `Blocking PIDs: ${pids.join(", ")}${suffix}`,
  };
}

export function WorkbenchHeader({
  isRefreshing,
  summary,
  processInfo,
  themePreference,
  onRefreshUsage,
  onOpenAddAccount,
  onThemeChange,
}: WorkbenchHeaderProps) {
  const processChip = getProcessChip(processInfo);

  return (
    <header className="sticky top-0 z-40 px-4 pb-4 pt-4 sm:px-6">
      <div className="surface-panel glass-header mx-auto max-w-7xl px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
              <IconSparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Codex Usage Inspector</h1>
              <p className="mt-1 text-sm text-secondary">Monitor usage, session health, and account status.</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="chip">
                  <span className="mono-data text-[11px] text-[var(--text-primary)]">{summary.total}</span>
                  Accounts tracked
                </span>
                <span className={`chip ${summary.attention > 0 ? "chip-warning" : "chip-success"}`}>
                  <span className="mono-data text-[11px]">{summary.attention}</span>
                  Needs attention
                </span>
                <span className={processChip.className}>{processChip.label}</span>
                {processChip.blockingPids ? <span className="chip chip-warning">{processChip.blockingPids}</span> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-center lg:justify-end">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" disabled={isRefreshing} onClick={onRefreshUsage}>
                <IconRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Usage
              </Button>

              <Button variant="primary" onClick={onOpenAddAccount}>
                <IconPlus className="h-4 w-4" />
                Add Account
              </Button>

              <ThemeToggle value={themePreference} onChange={onThemeChange} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
