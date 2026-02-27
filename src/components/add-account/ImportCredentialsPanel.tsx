import { Button } from "../ui";

interface ImportCredentialsPanelProps {
  filePath: string;
  onSelectFile: () => void;
}

export function ImportCredentialsPanel({ filePath, onSelectFile }: ImportCredentialsPanelProps) {
  return (
    <section
      id="add-account-panel-import"
      role="tabpanel"
      aria-labelledby="add-account-tab-import"
      className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] p-4 shadow-[var(--shadow-soft)]"
    >
      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Import credentials</h3>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="mono-data min-h-11 flex-1 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-3 text-xs text-secondary shadow-[var(--shadow-soft)]">
          {filePath || "No file selected"}
        </div>
        <Button variant="secondary" onClick={onSelectFile}>
          Browse…
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted">
        Import only from trusted local files. Secrets are moved into your system keychain.
      </p>
    </section>
  );
}
