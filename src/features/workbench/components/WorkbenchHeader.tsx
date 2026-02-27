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

function getProcessSummary(processInfo: CodexProcessInfo | null) {
  if (!processInfo) {
    return {
      processLabel: "Processes checking",
      processClass: "text-secondary",
      blockingValue: "checking",
      blockingClass: "text-secondary",
    };
  }

  if (processInfo.count === 0) {
    return {
      processLabel: "Processes clear",
      processClass: "text-[var(--success)]",
      blockingValue: "none",
      blockingClass: "text-secondary",
    };
  }

  const pids = processInfo.pids.slice(0, 4);
  const suffix = processInfo.pids.length > pids.length ? "…" : "";
  const processNoun = processInfo.count === 1 ? "process" : "processes";

  return {
    processLabel: `${processInfo.count} ${processNoun} running`,
    processClass: "text-[var(--warning)]",
    blockingValue: `${pids.join(", ")}${suffix}`,
    blockingClass: "text-[var(--warning)]",
  };
}

function formatAccountCount(count: number) {
  return `${count} ${count === 1 ? "account" : "accounts"}`;
}

function formatAttentionCount(count: number) {
  if (count === 0) {
    return "none";
  }

  return `${count} ${count === 1 ? "account" : "accounts"}`;
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
  const processSummary = getProcessSummary(processInfo);

  return (
    <header className="px-4 pb-4 pt-4 sm:px-6">
      <div className="surface-panel glass-header mx-auto max-w-7xl border-[var(--border-strong)] px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] xl:items-start">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-[0_12px_24px_rgb(37_99_235_/_.24)]">
                <IconSparkles className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="mono-data text-[11px] uppercase tracking-[0.14em] text-muted">Usage Workbench</p>
                <h1 className="mt-1 text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[2rem]">
                  Codex Usage Inspector
                </h1>
                <p className="mt-1 max-w-2xl text-[13px] text-secondary text-pretty sm:text-sm">
                  Monitor usage, session health, and account status in one focused workflow.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-soft)] xl:ml-auto xl:w-full xl:max-w-[28rem]">
            <p className="mono-data mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">Controls</p>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                className="min-h-11 w-full justify-center"
                disabled={isRefreshing}
                onClick={onRefreshUsage}
              >
                <IconRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh Usage
              </Button>

              <Button variant="primary" className="min-h-11 w-full justify-center" onClick={onOpenAddAccount}>
                <IconPlus className="h-4 w-4" />
                Add Account
              </Button>

              <div className="sm:col-span-2 pt-1">
                <ThemeToggle
                  value={themePreference}
                  onChange={onThemeChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] p-2.5 shadow-[var(--shadow-soft)] sm:p-3">
          <dl className="grid grid-cols-2 gap-2">
            <div className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] px-2.5 py-2 shadow-[var(--shadow-soft)]">
              <dt className="mono-data text-[10px] uppercase tracking-[0.14em] text-muted">Accounts Tracked</dt>
              <dd className="mt-1 text-base font-semibold leading-tight text-[var(--text-primary)]">{formatAccountCount(summary.total)}</dd>
            </div>

            <div className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] px-2.5 py-2 shadow-[var(--shadow-soft)]">
              <dt className="mono-data text-[10px] uppercase tracking-[0.14em] text-muted">Needs Attention</dt>
              <dd className={`mt-1 text-base font-semibold leading-tight ${summary.attention > 0 ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>
                {formatAttentionCount(summary.attention)}
              </dd>
            </div>

            <div className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] px-2.5 py-2 shadow-[var(--shadow-soft)]">
              <dt className="mono-data text-[10px] uppercase tracking-[0.14em] text-muted">Process Status</dt>
              <dd className={`mt-1 text-sm font-semibold leading-tight ${processSummary.processClass}`}>{processSummary.processLabel}</dd>
            </div>

            <div className="min-w-0 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] px-2.5 py-2 shadow-[var(--shadow-soft)]">
              <dt className="mono-data text-[10px] uppercase tracking-[0.14em] text-muted">Blocking PIDs</dt>
              <dd className={`mono-data mt-1 truncate text-sm font-semibold ${processSummary.blockingClass}`} title={processSummary.blockingValue}>
                {processSummary.blockingValue}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </header>
  );
}
