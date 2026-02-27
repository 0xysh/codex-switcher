import type { RefObject } from "react";

import type { ThemePreference } from "../../../hooks/useTheme";
import {
  Button,
  IconCommand,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSparkles,
  ThemeToggle,
} from "../../../components/ui";

interface WorkbenchHeaderProps {
  query: string;
  isRefreshing: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  themePreference: ThemePreference;
  onQueryChange: (value: string) => void;
  onOpenQuickSwitch: () => void;
  onRefreshUsage: () => void;
  onOpenAddAccount: () => void;
  onThemeChange: (value: ThemePreference) => void;
}

export function WorkbenchHeader({
  query,
  isRefreshing,
  searchInputRef,
  themePreference,
  onQueryChange,
  onOpenQuickSwitch,
  onRefreshUsage,
  onOpenAddAccount,
  onThemeChange,
}: WorkbenchHeaderProps) {
  return (
    <header className="sticky top-0 z-40 px-4 pb-4 pt-4 sm:px-6">
      <div className="surface-panel mx-auto max-w-7xl px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
              <IconSparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Codex Switcher</h1>
              <p className="mt-1 text-sm text-secondary">Aurora Signal Workbench for multi-account operations</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 xl:max-w-2xl xl:flex-row xl:items-center xl:justify-end">
            <label
              htmlFor="account-search"
              className="flex h-11 w-full items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 xl:max-w-md"
            >
              <IconSearch className="h-4 w-4 text-muted" />
              <input
                ref={searchInputRef}
                id="account-search"
                type="text"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search account name or email"
                className="w-full border-0 bg-transparent text-sm text-[var(--text-primary)]"
              />
              <span className="mono-data hidden rounded-md border border-[var(--border-soft)] px-1.5 py-0.5 text-[10px] text-muted md:inline-flex">
                /
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={onOpenQuickSwitch}>
                <IconCommand className="h-4 w-4" />
                Quick switch
              </Button>

              <Button variant="secondary" disabled={isRefreshing} onClick={onRefreshUsage}>
                <IconRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh usage
              </Button>

              <Button variant="primary" onClick={onOpenAddAccount}>
                <IconPlus className="h-4 w-4" />
                Add account
              </Button>

              <ThemeToggle value={themePreference} onChange={onThemeChange} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
