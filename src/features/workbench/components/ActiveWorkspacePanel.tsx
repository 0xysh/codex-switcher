import type { AccountWithUsage } from "../../../types";
import { IconAlertTriangle, IconArrowRightLeft, IconCheck } from "../../../components/ui";
import type { AccountSummary } from "../types";
import { needsAttention } from "../selectors";

interface ActiveWorkspacePanelProps {
  account: AccountWithUsage;
  summary: AccountSummary;
}

export function ActiveWorkspacePanel({ account, summary }: ActiveWorkspacePanelProps) {
  return (
    <div className="surface-panel-strong overflow-hidden p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="section-title">Active Workspace</p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{account.name}</h2>
          <p className="text-sm text-secondary">{account.email || "No email attached"}</p>
          <div className="flex flex-wrap gap-2">
            <span className="chip chip-accent">
              <IconCheck className="h-3.5 w-3.5" />
              Active
            </span>
            <span className="chip">
              <IconArrowRightLeft className="h-3.5 w-3.5" />
              {account.auth_mode === "api_key" ? "Imported auth" : "OAuth auth"}
            </span>
            {needsAttention(account) && (
              <span className="chip chip-warning">
                <IconAlertTriangle className="h-3.5 w-3.5" />
                Needs attention
              </span>
            )}
          </div>
        </div>

        <div className="grid w-full gap-2 sm:grid-cols-3 md:w-auto md:min-w-[280px]">
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">Accounts</p>
            <p className="mono-data mt-1 text-lg font-semibold text-[var(--text-primary)]">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">Attention</p>
            <p className="mono-data mt-1 text-lg font-semibold text-[var(--text-primary)]">{summary.attention}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">OAuth / Import</p>
            <p className="mono-data mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {summary.oauth} / {summary.imported}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
