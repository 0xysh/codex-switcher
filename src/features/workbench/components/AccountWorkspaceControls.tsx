import { IconFilter } from "../../../components/ui";
import type { AccountFilter, AccountSort } from "../types";

interface AccountWorkspaceControlsProps {
  accountFilter: AccountFilter;
  accountSort: AccountSort;
  onFilterChange: (filter: AccountFilter) => void;
  onSortChange: (sort: AccountSort) => void;
}

const FILTER_OPTIONS: Array<{ value: AccountFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "oauth", label: "OAuth" },
  { value: "imported", label: "Imported" },
  { value: "attention", label: "Needs attention" },
];

export function AccountWorkspaceControls({
  accountFilter,
  accountSort,
  onFilterChange,
  onSortChange,
}: AccountWorkspaceControlsProps) {
  return (
    <div className="surface-panel px-4 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Account Workspace</h2>

        <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-secondary">
          <IconFilter className="h-3.5 w-3.5" />
          Sort
          <select
            value={accountSort}
            onChange={(event) => onSortChange(event.target.value as AccountSort)}
            className="cursor-pointer border-0 bg-transparent text-xs text-[var(--text-primary)]"
          >
            <option value="recent">Recent activity</option>
            <option value="name">Name</option>
            <option value="usage">Usage pressure</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((filterOption) => {
          const isActive = accountFilter === filterOption.value;

          return (
            <button
              key={filterOption.value}
              type="button"
              onClick={() => onFilterChange(filterOption.value)}
              className={`inline-flex h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-primary)]"
                  : "border-[var(--border-soft)] bg-[var(--bg-surface)] text-secondary hover:border-[var(--border-strong)]"
              }`}
            >
              {filterOption.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
