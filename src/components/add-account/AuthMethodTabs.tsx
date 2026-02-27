import { IconKey, IconShieldCheck } from "../ui";

export type AddAccountTab = "oauth" | "import";

interface AuthMethodTabsProps {
  activeTab: AddAccountTab;
  onTabChange: (tab: AddAccountTab) => void;
}

export function AuthMethodTabs({ activeTab, onTabChange }: AuthMethodTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Add account method"
      className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-surface)] p-1 shadow-[var(--shadow-soft)]"
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
          return;
        }

        event.preventDefault();
        onTabChange(activeTab === "oauth" ? "import" : "oauth");
      }}
    >
      <button
        type="button"
        id="add-account-tab-oauth"
        role="tab"
        aria-selected={activeTab === "oauth"}
        aria-controls="add-account-panel-oauth"
        tabIndex={activeTab === "oauth" ? 0 : -1}
        className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-[background-color,color,border-color,box-shadow] ${
          activeTab === "oauth"
            ? "border-transparent bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-[0_8px_18px_rgb(37_99_235_/_.22)]"
            : "border-transparent text-secondary hover:border-[var(--border-soft)] hover:bg-[var(--bg-surface-elevated)]"
        }`}
        onClick={() => onTabChange("oauth")}
      >
        <span className="inline-flex items-center gap-2">
          <IconShieldCheck className="h-4 w-4" />
          ChatGPT OAuth
        </span>
      </button>

      <button
        type="button"
        id="add-account-tab-import"
        role="tab"
        aria-selected={activeTab === "import"}
        aria-controls="add-account-panel-import"
        tabIndex={activeTab === "import" ? 0 : -1}
        className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-[background-color,color,border-color,box-shadow] ${
          activeTab === "import"
            ? "border-transparent bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-[0_8px_18px_rgb(37_99_235_/_.22)]"
            : "border-transparent text-secondary hover:border-[var(--border-soft)] hover:bg-[var(--bg-surface-elevated)]"
        }`}
        onClick={() => onTabChange("import")}
      >
        <span className="inline-flex items-center gap-2">
          <IconKey className="h-4 w-4" />
          Import auth.json
        </span>
      </button>
    </div>
  );
}
