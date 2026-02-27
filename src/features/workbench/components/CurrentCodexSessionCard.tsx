import { useMemo, useState } from "react";

import { Button, IconKey, IconPlus, IconRefresh } from "../../../components/ui";
import type { CurrentAuthSummary } from "../../../types";

interface CurrentCodexSessionCardProps {
  summary: CurrentAuthSummary | null;
  onRefresh: () => Promise<unknown>;
  onSaveSnapshot: () => Promise<string>;
  onImportSnapshot: () => void;
}

const STATUS_LABELS: Record<CurrentAuthSummary["status"], string> = {
  ready: "Ready",
  missing: "Missing",
  invalid: "Invalid",
  error: "Error",
};

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleString();
}

export function CurrentCodexSessionCard({
  summary,
  onRefresh,
  onSaveSnapshot,
  onImportSnapshot,
}: CurrentCodexSessionCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const status = summary?.status ?? "checking";
  const statusLabel = summary ? STATUS_LABELS[summary.status] : "Checking";

  const modeLabel = useMemo(() => {
    if (!summary?.auth_mode) {
      return "Unknown";
    }

    return summary.auth_mode === "chat_gpt" ? "ChatGPT OAuth" : "API Key";
  }, [summary]);

  const snapshotPathLabel = summary?.snapshots_dir_path ?? "~/.codex-switcher/snapshots";
  const authFilePathLabel = summary?.auth_file_path ?? "~/.codex/auth.json";
  const summaryLine = summary
    ? `${modeLabel} · ${summary.email ?? "No email"} · ${summary.plan_type ?? "No plan detected"}`
    : "Checking auth file metadata.";

  const statusToneClass =
    status === "ready"
      ? "chip chip-success"
      : status === "missing" || status === "invalid"
        ? "chip chip-warning"
        : status === "error"
          ? "chip chip-danger"
          : "chip";

  return (
    <section className="surface-panel p-5" aria-label="Current Codex Session">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-title">Current Codex Session</p>
          <p className="mt-2 text-sm text-secondary">{summaryLine}</p>
        </div>
        <span className={statusToneClass}>Status: {statusLabel}</span>
      </div>

      {summary?.message ? (
        <p className="mt-3 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--warning)]">
          {summary.message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="min-h-11"
          disabled={isRefreshing}
          onClick={() => {
            setIsRefreshing(true);
            onRefresh()
              .then(() => setFeedback("Session metadata refreshed."))
              .catch(() => setFeedback("Failed to refresh session metadata."))
              .finally(() => setIsRefreshing(false));
          }}
        >
          <IconRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh session
        </Button>

        <Button
          variant="secondary"
          className="min-h-11"
          disabled={isSavingSnapshot}
          onClick={() => {
            setIsSavingSnapshot(true);
            onSaveSnapshot()
              .then(() => setFeedback("Snapshot saved."))
              .catch(() => setFeedback("Failed to save snapshot."))
              .finally(() => setIsSavingSnapshot(false));
          }}
        >
          <IconKey className="h-4 w-4" />
          Save snapshot
        </Button>

        <Button variant="primary" className="min-h-11" onClick={onImportSnapshot}>
          <IconPlus className="h-4 w-4" />
          Import snapshot
        </Button>
      </div>

      <details className="mt-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] px-3 py-2">
        <summary className="cursor-pointer select-none text-sm font-semibold text-[var(--text-primary)]">
          Session details
        </summary>
        <dl className="mt-3 grid gap-2 text-xs text-secondary sm:grid-cols-[auto_1fr]">
          <dt className="text-muted">Last modified</dt>
          <dd className="text-[var(--text-primary)]">{formatTimestamp(summary?.last_modified_at ?? null)}</dd>

          <dt className="text-muted">Auth file</dt>
          <dd className="mono-data break-words text-[var(--text-primary)]">{authFilePathLabel}</dd>

          <dt className="text-muted">Snapshots</dt>
          <dd className="mono-data break-words text-[var(--text-primary)]">{snapshotPathLabel}</dd>
        </dl>
      </details>

      <p className="sr-only" role="status" aria-live="polite">
        {feedback}
      </p>
    </section>
  );
}
