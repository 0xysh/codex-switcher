import type { ComponentType, KeyboardEvent, SVGProps } from "react";

import type { ThemePreference } from "../../hooks/useTheme";
import { IconInfoCircle, IconMoon, IconSparkles, IconSun } from "./icons";

interface ThemeToggleProps {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
  onRandomInfoClick?: () => void;
  className?: string;
}

const OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "Random", icon: IconSparkles },
];

export function ThemeToggle({
  value,
  onChange,
  onRandomInfoClick,
  className,
}: ThemeToggleProps) {
  const selectedIndex = OPTIONS.findIndex((option) => option.value === value);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.closest('[role="radio"]')) {
      return;
    }

    event.preventDefault();

    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (selectedIndex + direction + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[nextIndex].value);
  };

  return (
    <div
      className={`inline-grid w-full grid-cols-3 items-stretch gap-1 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface-elevated)] p-1.5 shadow-[var(--shadow-soft)] ${className ?? ""}`}
      role="radiogroup"
      aria-label="Theme mode"
      onKeyDown={handleKeyDown}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        const showRandomInfoButton = option.value === "system" && Boolean(onRandomInfoClick);

        return (
          <div key={option.value} className="relative">
            <button
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={option.label}
              onClick={() => onChange(option.value)}
              className={`inline-flex h-11 w-full cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] font-semibold transition-[background-color,color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-secondary)] sm:min-w-[88px] sm:text-xs ${
                showRandomInfoButton ? "pr-12" : ""
              } ${
                active
                  ? "border border-[var(--accent-border)] bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--accent-foreground)] shadow-[0_10px_20px_rgb(20_80_182_/_.3)]"
                  : "border border-transparent text-[var(--text-muted)] hover:border-[var(--border-soft)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
            </button>

            {showRandomInfoButton ? (
              <button
                type="button"
                aria-label="Show random palette details"
                onClick={(event) => {
                  event.stopPropagation();
                  onRandomInfoClick?.();
                }}
                className={`absolute right-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer touch-manipulation items-center justify-center rounded-xl p-1 transition-[color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-secondary)] ${
                  active
                    ? "text-[var(--accent-foreground)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex h-full w-full items-center justify-center rounded-lg border transition-[background-color,border-color,color] duration-200 ${
                    active
                      ? "border-[rgb(255_255_255_/_.3)] bg-[rgb(255_255_255_/_.1)] hover:border-[rgb(255_255_255_/_.42)] hover:bg-[rgb(255_255_255_/_.16)]"
                      : "border-[var(--border-soft)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-elevated)]"
                  }`}
                >
                  <IconInfoCircle className="h-4 w-4" />
                </span>
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
