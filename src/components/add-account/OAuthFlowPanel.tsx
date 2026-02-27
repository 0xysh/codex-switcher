import { IconCheck } from "../ui";

interface OAuthStep {
  id: string;
  label: string;
  done: boolean;
}

interface OAuthFlowPanelProps {
  oauthPending: boolean;
  oauthSteps: OAuthStep[];
}

export function OAuthFlowPanel({ oauthPending, oauthSteps }: OAuthFlowPanelProps) {
  return (
    <section
      id="add-account-panel-oauth"
      role="tabpanel"
      aria-labelledby="add-account-tab-oauth"
      className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface-elevated)] p-4"
    >
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
  );
}
