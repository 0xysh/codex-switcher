import type {
  ButtonHTMLAttributes,
  ComponentType,
  KeyboardEvent,
  RefObject,
  SVGProps,
} from "react";

import type { AccountWithUsage } from "../types";
import {
  IconActivity,
  IconClock,
  IconGripVertical,
  IconButton,
  IconKey,
  IconRefresh,
  IconShieldCheck,
} from "./ui";

interface UsageStatusViewModel {
  label: string;
  className: string;
}

interface AccountCardHeaderProps {
  account: AccountWithUsage;
  isCompact: boolean;
  isEditing: boolean;
  isRenaming: boolean;
  editName: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onEditNameChange: (value: string) => void;
  onStartEditing: () => void;
  onCommitRename: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  creditsBalance: string | null | undefined;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  isRefreshing: boolean;
  onRefresh: () => void;
  usageStatus: UsageStatusViewModel | null;
  UsageStatusIcon?: ComponentType<SVGProps<SVGSVGElement>>;
  planDisplay: string;
  authModeDisplay: string;
  lastRefresh: Date | null;
  formatLastRefresh: (value: Date | null) => string;
}

export function AccountCardHeader({
  account,
  isCompact,
  isEditing,
  isRenaming,
  editName,
  inputRef,
  onEditNameChange,
  onStartEditing,
  onCommitRename,
  onKeyDown,
  creditsBalance,
  dragHandleProps,
  isRefreshing,
  onRefresh,
  usageStatus,
  UsageStatusIcon,
  planDisplay,
  authModeDisplay,
  lastRefresh,
  formatLastRefresh,
}: AccountCardHeaderProps) {
  return (
    <header
      className={`relative z-10 overflow-hidden ${
        isCompact
          ? "mb-5 min-h-[4.5rem] rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-4 py-3.5 shadow-[var(--shadow-soft)]"
          : "mb-4 space-y-3"
      }`}
    >
      {isCompact ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-[var(--accent-soft)] via-transparent to-[var(--usage-7d-soft)] opacity-55"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-border)] to-transparent"
          />
        </>
      ) : null}

      <div className={isCompact ? "relative z-10 flex h-full items-center gap-3" : "flex items-start gap-2"}>
        <div className="min-w-0 flex-1">
          {isCompact ? (
            <p className="truncate text-[1.08rem] font-semibold leading-6 text-[var(--text-primary)]">
              {account.name}
            </p>
          ) : (
            <>
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  name="accountRename"
                  aria-label="Account name"
                  autoComplete="off"
                  disabled={isRenaming}
                  value={editName}
                  onChange={(event) => onEditNameChange(event.target.value)}
                  onBlur={onCommitRename}
                  onKeyDown={onKeyDown}
                  className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-[1.02rem] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-soft)]"
                />
              ) : (
                <button
                  type="button"
                  aria-label="Rename Account"
                  onClick={onStartEditing}
                  disabled={isRenaming}
                  className="w-full cursor-pointer truncate text-left text-[1.12rem] font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-primary)] disabled:cursor-default disabled:hover:text-[var(--text-primary)]"
                >
                  {account.name}
                </button>
              )}

              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-2.5 py-2 text-sm text-secondary shadow-[var(--shadow-soft)]">
                <div className="flex min-w-0 items-center gap-2">
                  {account.auth_mode === "api_key" ? (
                    <IconKey className="h-4 w-4" />
                  ) : (
                    <IconShieldCheck className="h-4 w-4" />
                  )}
                  {account.email ? (
                    <span className="truncate">{account.email}</span>
                  ) : (
                    <span className="text-muted">No email available</span>
                  )}
                </div>

                {creditsBalance ? (
                  <p className="mono-data shrink-0 rounded-full border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-[11px] text-secondary">
                    Credits: {creditsBalance}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>

        <div className={isCompact ? "flex shrink-0 items-center gap-2.5" : "mt-0.5 flex shrink-0 items-center gap-2"}>
          {isCompact ? (
            <IconButton
              aria-label={`Refresh ${account.name} usage`}
              tone="accent"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <IconRefresh className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </IconButton>
          ) : null}

          {dragHandleProps ? (
            <IconButton
              aria-label={dragHandleProps["aria-label"] ?? `Reorder ${account.name}`}
              tone="accent"
              size="sm"
              className="touch-none cursor-grab active:cursor-grabbing"
              {...dragHandleProps}
            >
              <IconGripVertical className="h-4 w-4" />
            </IconButton>
          ) : null}
        </div>
      </div>

      {!isCompact ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-2.5 py-2.5 shadow-[var(--shadow-soft)]">
          {usageStatus && UsageStatusIcon ? (
            <span className={usageStatus.className}>
              <UsageStatusIcon className="h-3.5 w-3.5" />
              {usageStatus.label}
            </span>
          ) : null}

          <span className="chip">
            <IconActivity className="h-3.5 w-3.5" />
            {planDisplay}
          </span>

          <span className="chip">
            <IconShieldCheck className="h-3.5 w-3.5" />
            {authModeDisplay}
          </span>

          <span className="chip ml-auto min-w-max" title={lastRefresh ? lastRefresh.toLocaleString() : "No usage refresh yet"}>
            <IconClock className="h-3.5 w-3.5" />
            Updated {formatLastRefresh(lastRefresh)}
          </span>
        </div>
      ) : null}
    </header>
  );
}
