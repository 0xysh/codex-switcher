import { useEffect, useRef, useState } from "react";

import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import {
  formatThemePaletteCss,
  readThemePaletteSnapshot,
} from "../hooks/themePaletteSnapshot";
import { Button, IconButton, IconX } from "./ui";

interface ThemePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function ThemePaletteModal({ isOpen, onClose }: ThemePaletteModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopyStatus(null);
      setIsCopying(false);
    }
  }, [isOpen]);

  useDialogFocusTrap({
    isOpen,
    containerRef: dialogRef,
    onRequestClose: onClose,
  });

  const snapshot = isOpen ? readThemePaletteSnapshot() : [];

  const handleCopy = async () => {
    if (!navigator.clipboard?.writeText) {
      setCopyStatus("Clipboard is unavailable. Copy values manually.");
      return;
    }

    try {
      setIsCopying(true);
      const latestSnapshot = readThemePaletteSnapshot();
      await navigator.clipboard.writeText(formatThemePaletteCss(latestSnapshot));
      setCopyStatus("Palette copied.");
    } catch (error) {
      console.error("Failed to copy palette:", getErrorMessage(error));
      setCopyStatus("Failed to copy palette.");
    } finally {
      setIsCopying(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] px-4 py-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-palette-modal-title"
        ref={dialogRef}
        className="surface-panel-strong w-full max-w-2xl overflow-hidden overscroll-contain shadow-[var(--shadow-raised)]"
      >
        <header className="border-b border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="theme-palette-modal-title"
                className="text-2xl font-semibold text-[var(--text-primary)] text-balance"
              >
                Current Theme Palette
              </h2>
              <p className="mt-1 text-sm text-secondary text-pretty">
                Capture the current token set from your active theme.
              </p>
            </div>

            <IconButton aria-label="Close theme palette modal" onClick={onClose}>
              <IconX className="h-4 w-4" />
            </IconButton>
          </div>
        </header>

        <div className="max-h-[58vh] overflow-y-auto px-6 py-5">
          <ul className="space-y-2">
            {snapshot.map((entry) => (
              <li
                key={entry.token}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2"
              >
                <span className="mono-data min-w-0 truncate text-xs font-semibold text-[var(--text-primary)]">
                  {entry.token}
                </span>
                <span className="mono-data min-w-0 truncate text-xs text-secondary">
                  {entry.value}
                </span>
                <span
                  aria-hidden="true"
                  className="h-8 w-8 rounded-lg border border-[var(--border-soft)]"
                  style={{ backgroundColor: entry.value === "not-set" ? "transparent" : entry.value }}
                  title={entry.value}
                />
              </li>
            ))}
          </ul>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label="Theme palette status"
            className="text-sm text-secondary"
          >
            {copyStatus}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              loading={isCopying}
              disabled={isCopying}
              onClick={() => {
                void handleCopy();
              }}
            >
              {isCopying ? "Copying…" : "Copy palette"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
