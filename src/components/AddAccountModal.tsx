import { useEffect, useMemo, useRef, useState } from "react";

import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";

import { Button, IconButton, IconCheck, IconKey, IconShieldCheck, IconX } from "./ui";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFile: (path: string, name: string) => Promise<void>;
  onStartOAuth: (name: string) => Promise<{ auth_url: string }>;
  onCompleteOAuth: () => Promise<unknown>;
  onCancelOAuth: () => Promise<void>;
}

type Tab = "oauth" | "import";

export function AddAccountModal({
  isOpen,
  onClose,
  onImportFile,
  onStartOAuth,
  onCompleteOAuth,
  onCancelOAuth,
}: AddAccountModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("oauth");
  const [name, setName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthPending, setOauthPending] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const isPrimaryDisabled = loading || (activeTab === "oauth" && oauthPending);

  const oauthSteps = useMemo(() => {
    return [
      { id: "authorize", label: "Authorize in browser", done: oauthPending },
      { id: "verify", label: "Confirm callback", done: false },
      { id: "save", label: "Save secure credentials", done: false },
    ];
  }, [oauthPending]);

  const resetForm = () => {
    setName("");
    setFilePath("");
    setError(null);
    setLoading(false);
    setOauthPending(false);
    setActiveTab("oauth");
  };

  const requestClose = () => {
    if (oauthPending) {
      void onCancelOAuth().catch((err) => {
        console.error("Failed to cancel login:", getErrorMessage(err));
      });
    }
    resetForm();
    onClose();
  };

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
        requestClose();
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
  }, [isOpen, oauthPending, onCancelOAuth, onClose]);

  const handleOAuthLogin = async () => {
    if (!name.trim()) {
      setError("Please enter an account name.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const info = await onStartOAuth(name.trim());
      setOauthPending(true);
      setLoading(false);

      await openUrl(info.auth_url);
      await onCompleteOAuth();

      requestClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
      setOauthPending(false);
    }
  };

  const handleSelectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "JSON",
            extensions: ["json"],
          },
        ],
        title: "Select auth.json file",
      });

      if (selected) {
        setFilePath(selected);
      }
    } catch (err) {
      console.error("Failed to open file dialog:", getErrorMessage(err));
    }
  };

  const handleImportFile = async () => {
    if (!name.trim()) {
      setError("Please enter an account name.");
      return;
    }

    if (!filePath.trim()) {
      setError("Please select an auth.json file.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await onImportFile(filePath.trim(), name.trim());
      requestClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-account-modal-title"
        ref={dialogRef}
        className="surface-panel-strong w-full max-w-xl overflow-hidden"
      >
        <header className="border-b border-[var(--border-soft)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="add-account-modal-title" className="text-2xl font-semibold text-[var(--text-primary)]">
                Add a new account
              </h2>
              <p className="mt-1 text-sm text-secondary">
                Connect with OAuth or import an existing local auth file.
              </p>
            </div>
            <IconButton aria-label="Close Add Account Modal" onClick={requestClose}>
              <IconX className="h-4 w-4" />
            </IconButton>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] p-1">
            <button
              type="button"
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                activeTab === "oauth"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-primary)]"
                  : "text-secondary hover:bg-[var(--bg-surface-elevated)]"
              }`}
              onClick={() => {
                setActiveTab("oauth");
                setError(null);
              }}
            >
              <span className="inline-flex items-center gap-2">
                <IconShieldCheck className="h-4 w-4" />
                ChatGPT OAuth
              </span>
            </button>

            <button
              type="button"
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                activeTab === "import"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-primary)]"
                  : "text-secondary hover:bg-[var(--bg-surface-elevated)]"
              }`}
              onClick={() => {
                if (oauthPending) {
                  void onCancelOAuth().catch((err) => {
                    console.error("Failed to cancel login:", getErrorMessage(err));
                  });
                  setOauthPending(false);
                  setLoading(false);
                }
                setActiveTab("import");
                setError(null);
              }}
            >
              <span className="inline-flex items-center gap-2">
                <IconKey className="h-4 w-4" />
                Import auth.json
              </span>
            </button>
          </div>
        </header>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label htmlFor="account-name" className="mb-2 block text-sm font-semibold text-secondary">
              Account Name
            </label>
            <input
              id="account-name"
              name="accountName"
              type="text"
              value={name}
              autoComplete="off"
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Production Team"
              className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-primary)]"
            />
          </div>

          {activeTab === "oauth" ? (
            <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] p-4">
              <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">OAuth flow</h3>
              <ol className="space-y-2 text-sm text-secondary">
                {oauthSteps.map((step, index) => (
                  <li key={step.id} className="flex items-start gap-2">
                    <span
                      className={`mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                        step.done
                          ? "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]"
                          : "border-[var(--border-soft)] bg-[var(--bg-surface)] text-secondary"
                      }`}
                    >
                      {step.done ? <IconCheck className="h-3 w-3" /> : index + 1}
                    </span>
                    <span>{step.label}</span>
                  </li>
                ))}
              </ol>

              {oauthPending && (
                <div className="mt-4 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent-primary)]">
                  Waiting for browser login… Complete authentication to finish setup.
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] p-4">
              <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Import credentials</h3>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="mono-data min-h-11 flex-1 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-3 text-xs text-secondary">
                  {filePath || "No file selected"}
                </div>
                <Button variant="secondary" onClick={() => void handleSelectFile()}>
                  Browse…
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted">
                Import only from trusted local files. Secrets are moved into your system keychain.
              </p>
            </section>
          )}

          {error && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]"
            >
              {error}
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[var(--border-soft)] px-6 py-5 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={requestClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isPrimaryDisabled}
            disabled={isPrimaryDisabled}
            onClick={() => {
              if (activeTab === "oauth") {
                void handleOAuthLogin();
                return;
              }

              void handleImportFile();
            }}
          >
            {loading ? "Adding…" : activeTab === "oauth" ? "Login with ChatGPT" : "Import account"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
