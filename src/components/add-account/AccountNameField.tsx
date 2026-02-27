interface AccountNameFieldProps {
  name: string;
  onChange: (value: string) => void;
}

export function AccountNameField({ name, onChange }: AccountNameFieldProps) {
  return (
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
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. Production Team…"
        className="w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-primary)] transition-[border-color,box-shadow] focus-visible:border-[var(--accent-border)]"
      />
      <p className="mt-2 text-xs text-muted">This label is local to this app and can be changed later.</p>
    </div>
  );
}
