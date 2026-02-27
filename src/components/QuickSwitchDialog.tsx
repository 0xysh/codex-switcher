import { useEffect, useMemo, useRef } from "react";

import type { AccountWithUsage } from "../types";
import {
  Button,
  IconArrowRightLeft,
  IconCommand,
  IconSearch,
  IconShieldCheck,
  IconX,
} from "./ui";

interface QuickSwitchDialogProps {
  isOpen: boolean;
  query: string;
  accounts: AccountWithUsage[];
  switchingId: string | null;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSwitch: (accountId: string) => Promise<void>;
}

export function QuickSwitchDialog({
  isOpen,
  query,
  accounts,
  switchingId,
  onQueryChange,
  onClose,
  onSwitch,
}: QuickSwitchDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const filteredAccounts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return accounts;
    }

    return accounts.filter((account) => {
      return (
        account.name.toLowerCase().includes(normalized) ||
        (account.email ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [accounts, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const getFocusableElements = () => {
      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );

      return elements.filter(
        (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
      );
    };

    const focusableElements = getFocusableElements();
    focusableElements[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--bg-overlay)] px-4 pt-24">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-switch-title"
        ref={dialogRef}
        className="surface-panel-strong w-full max-w-2xl"
      >
        <header className="border-b border-[var(--border-soft)] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <h2 id="quick-switch-title" className="flex items-center gap-2 text-lg font-semibold">
              <IconCommand className="h-5 w-5 text-[var(--accent-secondary)]" />
              Quick switch
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close quick switch"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-surface)] text-secondary"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>

          <label htmlFor="quick-switch-input" className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2">
            <IconSearch className="h-4 w-4 text-muted" />
            <input
              id="quick-switch-input"
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search account name or email"
              className="w-full border-0 bg-transparent text-sm text-[var(--text-primary)]"
              autoFocus
            />
          </label>
        </header>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
          {filteredAccounts.length === 0 ? (
            <p className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-muted">
              No account matches this search.
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredAccounts.map((account) => {
                const isSwitching = switchingId === account.id;

                return (
                  <li key={account.id}>
                    <button
                      type="button"
                      className="w-full cursor-pointer rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-4 py-3 text-left transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--bg-surface-elevated)]"
                      onClick={() => {
                        void onSwitch(account.id);
                      }}
                      disabled={isSwitching}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{account.name}</p>
                          <p className="text-xs text-muted">{account.email || "No email"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.is_active && (
                            <span className="chip chip-accent">
                              <IconShieldCheck className="h-3.5 w-3.5" />
                              Active
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-secondary">
                            <IconArrowRightLeft className="h-3.5 w-3.5" />
                            {isSwitching ? "Switching…" : "Switch"}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-[var(--border-soft)] px-5 py-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <IconCommand className="h-3.5 w-3.5" />
            Ctrl/Cmd + K opens this panel
          </span>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>
  );
}
