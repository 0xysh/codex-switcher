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
    <header className="px-4 pb-5 pt-4 sm:px-6">
      <div className="surface-panel glass-header relative mx-auto max-w-[90rem] overflow-hidden border-[var(--border-strong)] px-4 py-4 sm:px-6 sm:py-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-[var(--accent-soft)] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-[var(--usage-7d-soft)] blur-3xl"
        />

        <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19.5rem,23.5rem)] xl:items-stretch">
          <section className="reveal-rise min-w-0 rounded-3xl border border-[var(--border-soft)] bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-surface-elevated)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-[0_18px_34px_rgb(20_80_182_/_.34)]">
                <IconSparkles className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <span className="mono-data inline-flex rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--accent-primary)]">
                  Operations Workbench
                </span>

                <h1 className="mt-3 text-[2.08rem] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2.55rem]">
                  Codex Usage Inspector
                </h1>

                <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-secondary text-pretty sm:text-sm">
                  Monitor usage, session health, and account status through one high-clarity command surface.
                </p>
              </div>
            </div>
          </section>

          <aside className="reveal-rise stagger-1 rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-soft)] xl:ml-auto xl:w-full">
            <p className="mono-data mb-2 text-[10px] uppercase tracking-[0.18em] text-muted">Control Rail</p>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
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

              <div className="sm:col-span-2 xl:col-span-1 pt-1">
                <ThemeToggle value={themePreference} onChange={onThemeChange} />
              </div>
            </div>
          </aside>
        </div>

        <dl className="relative mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-[var(--shadow-soft)]">
            <dt className="mono-data text-[10px] uppercase tracking-[0.15em] text-muted">Accounts Tracked</dt>
            <dd className="mt-1 text-base font-semibold text-[var(--text-primary)]">{formatAccountCount(summary.total)}</dd>
          </div>

          <div className="min-w-0 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-[var(--shadow-soft)]">
            <dt className="mono-data text-[10px] uppercase tracking-[0.15em] text-muted">Needs Attention</dt>
            <dd className={`mt-1 text-base font-semibold ${summary.attention > 0 ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>
              {formatAttentionCount(summary.attention)}
            </dd>
          </div>

          <div className="min-w-0 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-[var(--shadow-soft)]">
            <dt className="mono-data text-[10px] uppercase tracking-[0.15em] text-muted">Process Status</dt>
            <dd className={`mt-1 text-sm font-semibold leading-tight ${processSummary.processClass}`}>{processSummary.processLabel}</dd>
          </div>

          <div className="min-w-0 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-[var(--shadow-soft)]">
            <dt className="mono-data text-[10px] uppercase tracking-[0.15em] text-muted">Blocking PIDs</dt>
            <dd className={`mono-data mt-1 truncate text-sm font-semibold ${processSummary.blockingClass}`} title={processSummary.blockingValue}>
              {processSummary.blockingValue}
            </dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
