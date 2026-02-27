import { useCallback, useMemo, useRef, useState } from "react";

import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";

import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import { AccountNameField } from "./add-account/AccountNameField";
import { AuthMethodTabs } from "./add-account/AuthMethodTabs";
import { ImportCredentialsPanel } from "./add-account/ImportCredentialsPanel";
import { OAuthFlowPanel } from "./add-account/OAuthFlowPanel";
import type { AddAccountTab } from "./add-account/AuthMethodTabs";
import { Button, IconButton, IconShieldCheck, IconX } from "./ui";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toUserSafeOAuthError(error: unknown): string {
  const message = getErrorMessage(error);

  if (message.includes("OAuth login timed out")) return "Login timed out. Please try again.";
  if (message.includes("No pending OAuth login")) return "Login session expired. Please start the login flow again.";
  if (message.includes("OAuth login cancelled")) return "Login was cancelled.";

  return "Unable to complete login. Please try again.";
}

function isTrustedOAuthUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "auth.openai.com";
  } catch {
    return false;
  }
}

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFile: (path: string, name: string) => Promise<void>;
  onStartOAuth: (name: string) => Promise<{ auth_url: string }>;
  onCompleteOAuth: () => Promise<unknown>;
  onCancelOAuth: () => Promise<void>;
}

export function AddAccountModal({
  isOpen,
  onClose,
  onImportFile,
  onStartOAuth,
  onCompleteOAuth,
  onCancelOAuth,
}: AddAccountModalProps) {
  const [activeTab, setActiveTab] = useState<AddAccountTab>("oauth");
  const [name, setName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthPending, setOauthPending] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const oauthAttemptRef = useRef(0);
  const oauthInFlightRef = useRef(false);
  const oauthPendingRef = useRef(false);

  const setOauthPendingState = (value: boolean) => {
    oauthPendingRef.current = value;
    setOauthPending(value);
  };

  const isPrimaryDisabled = loading || (activeTab === "oauth" && oauthPending);
  const isCancelDisabled = loading && activeTab === "import";

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
    setOauthPendingState(false);
    setActiveTab("oauth");
  };

  const requestClose = useCallback(() => {
    const shouldCancel = oauthPendingRef.current || oauthInFlightRef.current;

    oauthAttemptRef.current += 1;
    oauthInFlightRef.current = false;

    if (shouldCancel) {
      void onCancelOAuth().catch((err) => {
        console.error("Failed to cancel login.", getErrorMessage(err));
      });
    }
    resetForm();
    onClose();
  }, [onCancelOAuth, onClose]);

  const handleTabChange = useCallback(
    (nextTab: AddAccountTab) => {
      if (nextTab === "import" && oauthPending) {
        oauthAttemptRef.current += 1;
        oauthInFlightRef.current = false;

        void onCancelOAuth().catch((err) => {
          console.error("Failed to cancel login.", getErrorMessage(err));
        });
        setOauthPendingState(false);
        setLoading(false);
      }

      setActiveTab(nextTab);
      setError(null);
    },
    [oauthPending, onCancelOAuth],
  );

  useDialogFocusTrap({ isOpen, containerRef: dialogRef, onRequestClose: requestClose });

  const handleOAuthLogin = async () => {
    if (oauthInFlightRef.current) {
      return;
    }

    if (!name.trim()) {
      setError("Please enter an account name.");
      return;
    }

    oauthInFlightRef.current = true;
    const oauthAttempt = oauthAttemptRef.current + 1;
    oauthAttemptRef.current = oauthAttempt;

    let oauthStarted = false;

    try {
      setLoading(true);
      setError(null);

      const info = await onStartOAuth(name.trim());

      if (oauthAttemptRef.current !== oauthAttempt) {
        void onCancelOAuth().catch((cancelErr) => {
          console.error("Failed to cancel login.", getErrorMessage(cancelErr));
        });
        return;
      }

      oauthStarted = true;

      if (!isTrustedOAuthUrl(info.auth_url)) {
        throw new Error("Invalid OAuth URL from backend");
      }

      setOauthPendingState(true);
      setLoading(false);

      void openUrl(info.auth_url).catch((openErr) => {
        console.error("Failed to open browser.", getErrorMessage(openErr));
      });

      await onCompleteOAuth();

      if (oauthAttemptRef.current !== oauthAttempt) {
        return;
      }

      requestClose();
    } catch (err) {
      if (oauthAttemptRef.current !== oauthAttempt) {
        return;
      }

      if (oauthStarted) {
        void onCancelOAuth().catch((cancelErr) => {
          console.error("Failed to cancel login.", getErrorMessage(cancelErr));
        });
      }
      setError(toUserSafeOAuthError(err));
      setLoading(false);
      setOauthPendingState(false);
    } finally {
      if (oauthAttemptRef.current === oauthAttempt) {
        oauthInFlightRef.current = false;
      }
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
        className="surface-panel-strong w-full max-w-xl overflow-hidden overscroll-contain"
      >
        <header className="border-b border-[var(--border-soft)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="add-account-modal-title" className="text-2xl font-semibold text-[var(--text-primary)] text-balance">
                Add a new account
              </h2>
              <p className="mt-1 text-sm text-secondary text-pretty">
                Connect with OAuth or import an existing local auth file.
              </p>
              <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-primary)]">
                <IconShieldCheck className="h-3.5 w-3.5" />
                Secrets stay encrypted in your system keychain
              </p>
            </div>
            <IconButton aria-label="Close Add Account Modal" onClick={requestClose} disabled={isCancelDisabled}>
              <IconX className="h-4 w-4" />
            </IconButton>
          </div>

          <AuthMethodTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </header>

        <div className="space-y-5 px-6 py-5">
          <AccountNameField name={name} onChange={setName} />

          {activeTab === "oauth" ? (
            <OAuthFlowPanel oauthPending={oauthPending} oauthSteps={oauthSteps} />
          ) : (
            <ImportCredentialsPanel filePath={filePath} onSelectFile={() => void handleSelectFile()} />
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
          <Button variant="ghost" onClick={requestClose} disabled={isCancelDisabled}>
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
