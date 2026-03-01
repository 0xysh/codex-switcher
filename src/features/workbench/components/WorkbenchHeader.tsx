import type { CardDensityMode } from "../../../hooks/useUiPreferences";
import type { ThemePreference } from "../../../hooks/useTheme";
import type { AccountSummary } from "../types";
import type { CodexProcessInfo } from "../../../types";
import {
  Button,
  IconButton,
  IconChevronDown,
  IconPanelRight,
  IconPlus,
  IconRefresh,
  ThemeToggle,
} from "../../../components/ui";

interface WorkbenchHeaderProps {
  isRefreshing: boolean;
  summary: AccountSummary;
  processInfo: CodexProcessInfo | null;
  cardDensityMode: CardDensityMode;
  themePreference: ThemePreference;
  isCollapsed: boolean;
  onRefreshUsage: () => void;
  onOpenAddAccount: () => void;
  onOpenThemePalette: () => void;
  onToggleCollapsed: () => void;
  onToggleCardDensityMode: () => void;
  onThemeChange: (value: ThemePreference) => void;
}

function getBlockingSummary(processInfo: CodexProcessInfo | null) {
  if (!processInfo) {
    return {
      blockingValue: "checking",
      blockingClass: "text-secondary",
    };
  }

  if (processInfo.count === 0) {
    return {
      blockingValue: "none",
      blockingClass: "text-secondary",
    };
  }

  const pids = processInfo.pids.slice(0, 4);
  const suffix = processInfo.pids.length > pids.length ? "…" : "";

  return {
    blockingValue: `${pids.join(", ")}${suffix}`,
    blockingClass: "text-[var(--warning)]",
  };
}

function formatAccountCount(count: number) {
  return `${count} ${count === 1 ? "account" : "accounts"}`;
}

export function WorkbenchHeader({
  isRefreshing,
  summary,
  processInfo,
  cardDensityMode,
  themePreference,
  isCollapsed,
  onRefreshUsage,
  onOpenAddAccount,
  onOpenThemePalette,
  onToggleCollapsed,
  onToggleCardDensityMode,
  onThemeChange,
}: WorkbenchHeaderProps) {
  const blockingSummary = getBlockingSummary(processInfo);

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

        <div className={`relative grid gap-4 ${isCollapsed ? "" : "xl:grid-cols-[minmax(0,1fr)_minmax(19.5rem,23.5rem)] xl:items-stretch"}`}>
          <section className="reveal-rise min-w-0 self-center">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[2.08rem] font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2.55rem]">
                Codex Usage Inspector
              </h1>

              <IconButton
                aria-label={isCollapsed ? "Expand header panel" : "Collapse header panel"}
                aria-controls="workbench-control-rail"
                aria-expanded={!isCollapsed}
                size="md"
                onClick={onToggleCollapsed}
              >
                <IconChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isCollapsed ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </IconButton>
            </div>

            {isCollapsed ? (
              <p className="mt-3 text-sm text-secondary">
                Controls collapsed. {formatAccountCount(summary.total)} tracked, blocking pids: {blockingSummary.blockingValue}.
              </p>
            ) : null}
          </section>

          {!isCollapsed ? (
            <aside
              id="workbench-control-rail"
              className="reveal-rise stagger-1 rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-soft)] xl:ml-auto xl:w-full"
            >
              <p className="mono-data mb-2 text-[10px] uppercase tracking-[0.18em] text-muted">Control Rail</p>

              <div className="grid gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="secondary"
                    className="min-h-11 w-full justify-center px-2 text-[11px] sm:text-xs"
                    disabled={isRefreshing}
                    onClick={onRefreshUsage}
                  >
                    <IconRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    Refresh Usage
                  </Button>

                  <Button
                    variant="primary"
                    className="min-h-11 w-full justify-center px-2 text-[11px] sm:text-xs"
                    onClick={onOpenAddAccount}
                  >
                    <IconPlus className="h-4 w-4" />
                    Add Account
                  </Button>

                  <Button
                    variant="secondary"
                    className="min-h-11 w-full justify-center px-2 text-[11px] sm:text-xs"
                    aria-pressed={cardDensityMode === "compact"}
                    onClick={onToggleCardDensityMode}
                  >
                    <IconPanelRight className="h-4 w-4" />
                    {cardDensityMode === "full" ? "Compact View" : "Full View"}
                  </Button>
                </div>

                <ThemeToggle
                  value={themePreference}
                  onChange={onThemeChange}
                  onRandomInfoClick={onOpenThemePalette}
                />

                <dl className="grid grid-cols-2 gap-2 pt-1">
                  <div className="min-w-0 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-[var(--shadow-soft)]">
                    <dt className="mono-data text-[10px] uppercase tracking-[0.15em] text-muted">Accounts Tracked</dt>
                    <dd className="mt-1 text-base font-semibold text-[var(--text-primary)]">{formatAccountCount(summary.total)}</dd>
                  </div>

                  <div className="min-w-0 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-[var(--shadow-soft)]">
                    <dt className="mono-data text-[10px] uppercase tracking-[0.15em] text-muted">Blocking PIDs</dt>
                    <dd className={`mono-data mt-1 truncate text-sm font-semibold ${blockingSummary.blockingClass}`} title={blockingSummary.blockingValue}>
                      {blockingSummary.blockingValue}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </header>
  );
}
